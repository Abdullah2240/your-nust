import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { app, request, startTestDb, stopTestDb, clearDb, createUser, createAdmin, agentFor } from './helpers.js';
import { Ride } from '../src/modules/carpool/ride.model.js';
import { Notification } from '../src/modules/notifications/notification.model.js';

before(startTestDb);
after(stopTestDb);
beforeEach(clearDb);

const future = (hours = 24) => new Date(Date.now() + hours * 3600 * 1000).toISOString();
const oneTime = (extra = {}) => ({ kind: 'offer', frequency: 'one-time', origin: 'G-11', destination: 'H-12', departAt: future(), seats: 2, ...extra });
const recurring = (extra = {}) => ({ kind: 'offer', frequency: 'recurring', origin: 'I-8', destination: 'H-12', days: ['Mon', 'Wed'], time: '08:00', seats: 3, ...extra });

async function makeRide(owner, extra = {}) {
  return Ride.create({ kind: 'offer', frequency: 'one-time', origin: 'G-11', destination: 'H-12', departAt: new Date(Date.now() + 86400000), seats: 2, owner: owner._id, ...extra });
}

test('carpool is for verified members only', async () => {
  assert.equal((await request(app).get('/api/carpool')).status, 401);
  const unverified = await agentFor(await createUser({ isVerified: false }));
  assert.equal((await unverified.get('/api/carpool')).status, 403);
  assert.equal((await unverified.post('/api/carpool').send(oneTime())).status, 403);
  assert.equal((await (await agentFor(await createUser())).get('/api/carpool')).status, 200);
});

test('one-time rides are approved at once; recurring rides wait for an admin', async () => {
  const owner = await createUser();
  const admin = await createAdmin();
  const a = await agentFor(owner);

  const one = await a.post('/api/carpool').send(oneTime());
  assert.equal(one.status, 201);
  assert.equal(one.body.data.approval, 'approved');
  assert.equal(one.body.data.isMine, true);

  const rec = await a.post('/api/carpool').send(recurring());
  assert.equal(rec.status, 201);
  assert.equal(rec.body.data.approval, 'pending');
  assert.equal(await Notification.countDocuments({ user: admin._id, type: 'admin_queue' }), 1);

  const viewer = await agentFor(await createUser());
  assert.equal((await viewer.get('/api/carpool')).body.data.total, 1);
  assert.equal((await viewer.get('/api/carpool')).body.data.items[0].isMine, false);
  assert.equal((await viewer.get(`/api/carpool/${rec.body.data.id}`)).status, 404);

  const adm = await agentFor(admin);
  assert.equal((await adm.get('/api/carpool/admin/pending')).body.data.total, 1);
  assert.equal((await adm.patch(`/api/carpool/${rec.body.data.id}/approval`).send({ decision: 'rejected' })).status, 400);
  const ok = await adm.patch(`/api/carpool/${rec.body.data.id}/approval`).send({ decision: 'approved' });
  assert.equal(ok.body.data.approval, 'approved');
  assert.equal((await viewer.get('/api/carpool')).body.data.total, 2);
  assert.equal(await Notification.countDocuments({ user: owner._id, type: 'post_approved' }), 1);
});

test('validation: past time, missing days, same start and end, bad seats', async () => {
  const a = await agentFor(await createUser());
  const past = await a.post('/api/carpool').send(oneTime({ departAt: new Date(Date.now() - 60000).toISOString() }));
  assert.equal(past.status, 400);
  assert.ok(past.body.error.fields.departAt);
  const noDays = await a.post('/api/carpool').send(recurring({ days: [] }));
  assert.ok(noDays.body.error.fields.days);
  const same = await a.post('/api/carpool').send(oneTime({ destination: 'g-11' }));
  assert.ok(same.body.error.fields.destination);
  assert.ok((await a.post('/api/carpool').send(oneTime({ seats: 0 }))).body.error.fields.seats);
  assert.ok((await a.post('/api/carpool').send(recurring({ time: '8am' }))).body.error.fields.time);
  assert.equal((await a.post('/api/carpool').send({ kind: 'offer' })).status, 400);
});

test('list filters, search with regex characters, and hiding old or removed rides', async () => {
  const owner = await createUser();
  await makeRide(owner, { origin: 'Bahria Phase 7' });
  await makeRide(owner, { kind: 'request', origin: 'I-8' });
  await makeRide(owner, { frequency: 'recurring', departAt: undefined, days: ['Mon'], time: '08:00' });
  await makeRide(owner, { departAt: new Date(Date.now() - 5 * 3600 * 1000) }); // left 5 hours ago
  await makeRide(owner, { isRemoved: true });
  await makeRide(owner, { status: 'Cancelled' });
  const a = await agentFor(await createUser());
  const get = async (q) => (await a.get(`/api/carpool${q}`)).body.data;
  assert.equal((await get('')).total, 3);
  assert.equal((await get('?kind=request')).total, 1);
  assert.equal((await get('?frequency=recurring')).total, 1);
  assert.equal((await get('?q=bahria')).total, 1);
  assert.equal((await get('?q=(')).total, 0);
  assert.equal((await get('?status=Cancelled')).total, 1);
});

test('rides never expose the owner email or phone', async () => {
  const owner = await createUser({ phone: '03001234567' });
  const ride = await makeRide(owner);
  const a = await agentFor(await createUser());
  for (const url of ['/api/carpool', `/api/carpool/${ride.id}`]) {
    const text = JSON.stringify((await a.get(url)).body);
    assert.ok(!text.includes('@seecs.edu.pk'), url);
    assert.ok(!text.includes('03001234567'), url);
  }
});

test('owner can update seats, notes and status; others cannot; Full follows the seat count', async () => {
  const owner = await createUser();
  const ride = await makeRide(owner);
  assert.equal((await (await agentFor(await createUser())).patch(`/api/carpool/${ride.id}`).send({ seats: 1 })).status, 403);
  const a = await agentFor(owner);
  assert.equal((await a.patch(`/api/carpool/${ride.id}`).send({ origin: 'Elsewhere' })).status, 400);
  assert.equal((await a.patch(`/api/carpool/${ride.id}`).send({ seats: 0 })).body.data.status, 'Full');
  assert.equal((await a.patch(`/api/carpool/${ride.id}`).send({ seats: 2 })).body.data.status, 'Active');
  assert.equal((await a.patch(`/api/carpool/${ride.id}`).send({ status: 'Cancelled' })).body.data.status, 'Cancelled');
  assert.equal((await a.patch(`/api/carpool/${ride.id}`).send({ notes: 'x' })).status, 409);
});

test('/mine returns my rides in every state', async () => {
  const owner = await createUser();
  await makeRide(owner);
  await makeRide(owner, { approval: 'pending', frequency: 'recurring', days: ['Mon'], time: '08:00' });
  await makeRide(await createUser());
  assert.equal((await (await agentFor(owner)).get('/api/carpool/mine')).body.data.total, 2);
});
