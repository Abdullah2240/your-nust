import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { app, request, startTestDb, stopTestDb, clearDb, createUser, agentFor } from './helpers.js';
import { insertPost } from './fixtures.js';
import { Project } from '../src/modules/projects/project.model.js';
import { Ride } from '../src/modules/carpool/ride.model.js';
import { Notification } from '../src/modules/notifications/notification.model.js';
import { InterestRequest } from '../src/modules/requests/request.model.js';

before(startTestDb);
after(stopTestDb);
beforeEach(clearDb);

const MSG = 'I can help with the backend and testing.';
const ask = (agent, targetType, targetId, extra = {}) =>
  agent.post('/api/requests').send({ targetType, targetId: String(targetId), message: MSG, ...extra });

async function setup() {
  const owner = await createUser({ name: 'Owner Ayesha', phone: '03001234567' });
  const bilal = await createUser({ name: 'Bilal', phone: '03111111111' });
  const carol = await createUser({ name: 'Carol' });
  const project = await Project.create({
    title: 'Delivery app', description: 'Campus ordering app project.', skills: ['React'],
    department: 'SEECS', teamSize: 3, owner: owner._id, approval: 'approved',
  });
  const ride = await Ride.create({
    kind: 'offer', frequency: 'one-time', origin: 'G-11', destination: 'H-12',
    departAt: new Date(Date.now() + 86400000), seats: 2, owner: owner._id,
  });
  return { owner, bilal, carol, project, ride, o: await agentFor(owner), b: await agentFor(bilal), c: await agentFor(carol) };
}

test('guests and unverified users cannot send requests', async () => {
  const { project } = await setup();
  assert.equal((await ask(request(app), 'project', project.id)).status, 401);
  const u = await agentFor(await createUser({ isVerified: false }));
  assert.equal((await ask(u, 'project', project.id)).status, 403);
});

test('sending a request notifies the owner; the response has no contact details', async () => {
  const { project, owner, b } = await setup();
  const res = await ask(b, 'project', project.id);
  assert.equal(res.status, 201);
  assert.equal(res.body.data.status, 'pending');
  const text = JSON.stringify(res.body);
  assert.ok(!text.includes('@seecs.edu.pk') && !text.includes('03001234567') && !text.includes('03111111111'));
  assert.equal(await Notification.countDocuments({ user: owner._id, type: 'request_new' }), 1);
});

test('validation and rules: short message, own post, duplicate pending, missing or hidden post', async () => {
  const { project, o, b, owner } = await setup();
  const short = await ask(b, 'project', project.id, { message: 'hi' });
  assert.equal(short.status, 400);
  assert.ok(short.body.error.fields.message);
  assert.equal((await ask(o, 'project', project.id)).status, 403);
  assert.equal((await ask(b, 'project', project.id)).status, 201);
  assert.equal((await ask(b, 'project', project.id)).status, 409);
  assert.equal((await ask(b, 'project', new mongoose.Types.ObjectId())).status, 404);
  assert.equal((await ask(b, 'project', 'bad-id')).status, 404);
  assert.equal((await ask(b, 'nope', project.id)).status, 400);
  const pendingProject = await Project.create({
    title: 'Hidden', description: 'Not approved yet project.', skills: ['React'], department: 'SEECS', teamSize: 3, owner: owner._id,
  });
  assert.equal((await ask(b, 'project', pendingProject.id)).status, 404);
});

test('withdrawing lets the person send a new request later', async () => {
  const { project, b, c } = await setup();
  const first = await ask(b, 'project', project.id);
  assert.equal((await c.patch(`/api/requests/${first.body.data.id}/withdraw`)).status, 403);
  assert.equal((await b.patch(`/api/requests/${first.body.data.id}/withdraw`)).body.data.status, 'withdrawn');
  assert.equal((await b.patch(`/api/requests/${first.body.data.id}/withdraw`)).status, 409);
  assert.equal((await ask(b, 'project', project.id)).status, 201);
});

test('only the owner can decide; accepting a project request adds a member and closes a full team', async () => {
  const { project, owner, b, c, o } = await setup(); // teamSize 3, 1 member
  const r1 = await ask(b, 'project', project.id);
  const r2 = await ask(c, 'project', project.id);
  assert.equal((await b.patch(`/api/requests/${r1.body.data.id}`).send({ decision: 'approved' })).status, 403);
  assert.equal((await o.patch(`/api/requests/${r1.body.data.id}`).send({ decision: 'maybe' })).status, 400);

  const a1 = await o.patch(`/api/requests/${r1.body.data.id}`).send({ decision: 'approved' });
  assert.equal(a1.status, 200);
  assert.equal((await Project.findById(project.id)).currentMembers, 2);
  assert.equal((await o.patch(`/api/requests/${r1.body.data.id}`).send({ decision: 'declined' })).status, 409);

  await o.patch(`/api/requests/${r2.body.data.id}`).send({ decision: 'approved' });
  const after = await Project.findById(project.id);
  assert.equal(after.currentMembers, 3);
  assert.equal(after.status, 'Closed');
  assert.equal(await Notification.countDocuments({ type: 'request_decision' }), 2);
  assert.ok(owner);
});

test('a full project rejects further approvals and the request stays pending', async () => {
  const { project, o, b, c } = await setup();
  await Project.updateOne({ _id: project._id }, { currentMembers: 2, teamSize: 3 });
  const r1 = await ask(b, 'project', project.id);
  const r2 = await ask(c, 'project', project.id);
  await Promise.all([
    o.patch(`/api/requests/${r1.body.data.id}`).send({ decision: 'approved' }),
    o.patch(`/api/requests/${r2.body.data.id}`).send({ decision: 'approved' }),
  ]);
  assert.equal((await Project.findById(project.id)).currentMembers, 3);
  assert.equal(await InterestRequest.countDocuments({ status: 'approved' }), 1);
  assert.equal(await InterestRequest.countDocuments({ status: 'pending' }), 1);
});

test('carpool: seats are checked on request and taken on approval, and the ride becomes Full', async () => {
  const { ride, o, b, c } = await setup(); // 2 seats
  const tooMany = await ask(b, 'carpool', ride.id, { seats: 3 });
  assert.equal(tooMany.status, 409);
  const r1 = await ask(b, 'carpool', ride.id, { seats: 1 });
  const r2 = await ask(c, 'carpool', ride.id, { seats: 2 });
  assert.equal(r1.status, 201);
  assert.equal(r2.status, 201);
  assert.equal((await o.patch(`/api/requests/${r1.body.data.id}`).send({ decision: 'approved' })).status, 200);
  assert.equal((await Ride.findById(ride.id)).seats, 1);
  // r2 wants 2 seats but only 1 is left: 409 and still pending
  assert.equal((await o.patch(`/api/requests/${r2.body.data.id}`).send({ decision: 'approved' })).status, 409);
  assert.equal((await InterestRequest.findById(r2.body.data.id)).status, 'pending');
  assert.equal((await o.patch(`/api/requests/${r2.body.data.id}`).send({ decision: 'declined' })).status, 200);
});

test('carpool: the last seat can only be given once, even with two accepts at the same time', async () => {
  const { ride, o, b, c } = await setup();
  await Ride.updateOne({ _id: ride._id }, { seats: 1 });
  const r1 = await ask(b, 'carpool', ride.id);
  const r2 = await ask(c, 'carpool', ride.id);
  await Promise.all([
    o.patch(`/api/requests/${r1.body.data.id}`).send({ decision: 'approved' }),
    o.patch(`/api/requests/${r2.body.data.id}`).send({ decision: 'approved' }),
  ]);
  const final = await Ride.findById(ride.id);
  assert.equal(final.seats, 0);
  assert.equal(final.status, 'Full');
  assert.equal(await InterestRequest.countDocuments({ status: 'approved' }), 1);
  // A Full ride takes no new requests
  const d = await agentFor(await createUser());
  assert.equal((await ask(d, 'carpool', ride.id)).status, 409);
});

test('incoming and outgoing lists show the right requests with the target title', async () => {
  const { project, ride, o, b } = await setup();
  await ask(b, 'project', project.id);
  await ask(b, 'carpool', ride.id);
  const incoming = await o.get('/api/requests/incoming');
  assert.equal(incoming.body.data.total, 2);
  assert.equal(incoming.body.data.items[0].requester.name, 'Bilal');
  assert.ok(incoming.body.data.items.some((i) => i.target.title === 'Delivery app'));
  assert.ok(incoming.body.data.items.some((i) => i.target.title === 'G-11 → H-12'));
  const outgoing = await b.get('/api/requests/outgoing');
  assert.equal(outgoing.body.data.total, 2);
  assert.equal((await b.get('/api/requests/incoming')).body.data.total, 0);
  assert.equal((await o.get('/api/requests/incoming?status=approved')).body.data.total, 0);
  const text = JSON.stringify([incoming.body, outgoing.body]);
  assert.ok(!text.includes('@seecs.edu.pk') && !text.includes('0300') && !text.includes('0311'));
});

test('contact details appear only for the two people, only after approval', async () => {
  const { project, o, b, c } = await setup();
  const r = await ask(b, 'project', project.id);
  const id = r.body.data.id;
  assert.equal((await b.get(`/api/requests/${id}/contact`)).status, 403); // still pending
  assert.equal((await o.get(`/api/requests/${id}/contact`)).status, 403);
  await o.patch(`/api/requests/${id}`).send({ decision: 'approved' });
  const forRequester = await b.get(`/api/requests/${id}/contact`);
  assert.equal(forRequester.status, 200);
  assert.equal(forRequester.body.data.contact.phone, '03001234567');
  assert.ok(forRequester.body.data.contact.email);
  const forOwner = await o.get(`/api/requests/${id}/contact`);
  assert.equal(forOwner.body.data.contact.name, 'Bilal');
  assert.equal(forOwner.body.data.contact.phone, '03111111111');
  assert.equal((await c.get(`/api/requests/${id}/contact`)).status, 403);
  assert.equal((await request(app).get(`/api/requests/${id}/contact`)).status, 401);
});

test('Lost & Found claims work through the same endpoints and respect the poster contact choice', async () => {
  const owner = await createUser({ phone: '03001234567' });
  const claimer = await createUser();
  const itemId = await insertPost('LostItem', 'itemName', { owner: owner._id, itemName: 'Blue bottle', contactMethod: 'phone', status: 'Open' });
  const o = await agentFor(owner);
  const b = await agentFor(claimer);
  const r = await ask(b, 'lostfound', itemId, { message: 'I lost it near the library on Monday.' });
  assert.equal(r.status, 201);
  await o.patch(`/api/requests/${r.body.data.id}`).send({ decision: 'approved' });
  const contact = (await b.get(`/api/requests/${r.body.data.id}/contact`)).body.data.contact;
  assert.equal(contact.phone, '03001234567');
  assert.equal(contact.email, undefined);
  await insertPost('LostItem', 'itemName', { owner: owner._id, itemName: 'Gone', status: 'Resolved' }).then(async (id) => {
    assert.equal((await ask(b, 'lostfound', id, { message: 'Is this still available?' })).status, 409);
  });
});
