import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { app, request, startTestDb, stopTestDb, clearDb, createUser, createAdmin, agentFor } from './helpers.js';
import { Project } from '../src/modules/projects/project.model.js';
import { Notification } from '../src/modules/notifications/notification.model.js';

before(startTestDb);
after(stopTestDb);
beforeEach(clearDb);

const body = (extra = {}) => ({
  title: 'Campus delivery app',
  description: 'Ordering from the cafeterias with delivery to hostels.',
  skills: ['React', 'Node.js'],
  department: 'SEECS',
  teamSize: 4,
  ...extra,
});

async function makeProject(owner, extra = {}) {
  return Project.create({ ...body(), owner: owner._id, approval: 'approved', ...extra });
}

test('guests can browse approved projects but not create them', async () => {
  const owner = await createUser();
  await makeProject(owner);
  const list = await request(app).get('/api/projects');
  assert.equal(list.status, 200);
  assert.equal(list.body.data.total, 1);
  assert.equal((await request(app).post('/api/projects').send(body())).status, 401);
  const unverified = await agentFor(await createUser({ isVerified: false }));
  assert.equal((await unverified.post('/api/projects').send(body())).status, 403);
});

test('creating a project makes it pending, notifies admins and hides it from the public list', async () => {
  const owner = await createUser();
  const admin = await createAdmin();
  const res = await (await agentFor(owner)).post('/api/projects').send(body());
  assert.equal(res.status, 201);
  assert.equal(res.body.data.approval, 'pending');
  assert.equal(res.body.data.currentMembers, 1);
  assert.equal((await request(app).get('/api/projects')).body.data.total, 0);
  assert.equal(await Notification.countDocuments({ user: admin._id, type: 'admin_queue' }), 1);
});

test('validation errors name the field', async () => {
  const a = await agentFor(await createUser());
  const res = await a.post('/api/projects').send(body({ title: '', skills: [], teamSize: 1 }));
  assert.equal(res.status, 400);
  assert.ok(res.body.error.fields.title);
  assert.ok(res.body.error.fields.skills);
  assert.ok(res.body.error.fields.teamSize);
});

test('owner info never contains email or phone', async () => {
  const owner = await createUser({ phone: '03001234567' });
  const p = await makeProject(owner);
  for (const url of ['/api/projects', `/api/projects/${p.id}`]) {
    const text = JSON.stringify((await request(app).get(url)).body);
    assert.ok(!text.includes('@seecs.edu.pk'), url);
    assert.ok(!text.includes('03001234567'), url);
    assert.ok(!text.includes('passwordHash'), url);
    assert.ok(!text.includes('skillsKey'), url);
  }
});

test('filters: skill (case-insensitive, several), department, status, team size, search with regex characters', async () => {
  const o = await createUser();
  await makeProject(o, { title: 'A', skills: ['React'], department: 'SEECS', teamSize: 3 });
  await makeProject(o, { title: 'B', skills: ['Python', 'C++'], department: 'SMME', teamSize: 6, status: 'Closed' });
  await makeProject(o, { title: 'C', skills: ['UI/UX'], department: 'SEECS', teamSize: 10 });
  const get = async (q) => (await request(app).get(`/api/projects${q}`)).body.data;
  assert.equal((await get('?skill=react')).total, 1);
  assert.equal((await get('?skill=react,UI/UX')).total, 2);
  assert.equal((await get('?skill=react&skill=python')).total, 2);
  assert.equal((await get('?department=SMME')).total, 1);
  assert.equal((await get('?status=Closed')).items[0].title, 'B');
  assert.equal((await get('?minTeam=5&maxTeam=8')).items[0].title, 'B');
  assert.equal((await get('?q=C%2B%2B')).total, 1);
  assert.equal((await get('?q=(')).total, 0);
  assert.equal((await request(app).get('/api/projects?department=Nope')).status, 400);
});

test('pending, rejected and removed projects are hidden from everyone but the owner and admins', async () => {
  const owner = await createUser();
  const other = await createUser();
  const admin = await createAdmin();
  const pending = await makeProject(owner, { approval: 'pending' });
  const removed = await makeProject(owner, { isRemoved: true });
  for (const p of [pending, removed]) {
    assert.equal((await request(app).get(`/api/projects/${p.id}`)).status, 404);
    assert.equal((await (await agentFor(other)).get(`/api/projects/${p.id}`)).status, 404);
    assert.equal((await (await agentFor(owner)).get(`/api/projects/${p.id}`)).status, 200);
    assert.equal((await (await agentFor(admin)).get(`/api/projects/${p.id}`)).status, 200);
  }
  assert.equal((await request(app).get('/api/projects/not-an-id')).status, 404);
  assert.equal((await request(app).get(`/api/projects/${new mongoose.Types.ObjectId()}`)).status, 404);
});

test('/mine shows every approval state to the owner only', async () => {
  const owner = await createUser();
  const other = await createUser();
  await makeProject(owner);
  await makeProject(owner, { approval: 'pending' });
  await makeProject(other);
  const res = await (await agentFor(owner)).get('/api/projects/mine');
  assert.equal(res.body.data.total, 2);
  assert.equal((await request(app).get('/api/projects/mine')).status, 401);
});

test('admin approves or rejects; owner is notified; reason is required to reject', async () => {
  const owner = await createUser();
  const admin = await createAdmin();
  const p = await makeProject(owner, { approval: 'pending' });
  const a = await agentFor(admin);

  assert.equal((await a.get('/api/projects/admin/pending')).body.data.total, 1);
  assert.equal((await (await agentFor(owner)).get('/api/projects/admin/pending')).status, 403);

  const noReason = await a.patch(`/api/projects/${p.id}/approval`).send({ decision: 'rejected' });
  assert.equal(noReason.status, 400);
  assert.ok(noReason.body.error.fields.reason);

  const rejected = await a.patch(`/api/projects/${p.id}/approval`).send({ decision: 'rejected', reason: 'Too vague' });
  assert.equal(rejected.body.data.approval, 'rejected');
  assert.equal(await Notification.countDocuments({ user: owner._id, type: 'post_rejected' }), 1);

  // Owner edits a rejected project -> back to pending
  const edit = await (await agentFor(owner)).patch(`/api/projects/${p.id}`).send({ description: 'A much clearer description of the plan.' });
  assert.equal(edit.status, 200);
  assert.equal(edit.body.data.approval, 'pending');

  const approved = await a.patch(`/api/projects/${p.id}/approval`).send({ decision: 'approved' });
  assert.equal(approved.body.data.approval, 'approved');
  assert.equal((await request(app).get('/api/projects')).body.data.total, 1);
  assert.equal((await a.patch(`/api/projects/${p.id}/approval`).send({ decision: 'approved' })).status, 409);
});

test('only the owner can edit; after approval only status and teamSize change', async () => {
  const owner = await createUser();
  const other = await createUser();
  const p = await makeProject(owner, { currentMembers: 3 });
  assert.equal((await (await agentFor(other)).patch(`/api/projects/${p.id}`).send({ status: 'Closed' })).status, 403);
  assert.equal((await request(app).patch(`/api/projects/${p.id}`).send({ status: 'Closed' })).status, 401);

  const a = await agentFor(owner);
  assert.equal((await a.patch(`/api/projects/${p.id}`).send({ title: 'New title' })).status, 400);
  assert.equal((await a.patch(`/api/projects/${p.id}`).send({ teamSize: 2 })).status, 400); // below current members
  assert.equal((await a.patch(`/api/projects/${p.id}`).send({ teamSize: 6 })).body.data.teamSize, 6);
  assert.equal((await a.patch(`/api/projects/${p.id}`).send({ status: 'Closed' })).body.data.status, 'Closed');
});
