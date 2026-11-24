import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { app, request, startTestDb, stopTestDb, clearDb, createUser, createAdmin, agentFor } from './helpers.js';
import { insertProject, postModel } from './fixtures.js';
import { Notification } from '../src/modules/notifications/notification.model.js';

before(startTestDb);
after(stopTestDb);
beforeEach(clearDb);

async function setup() {
  const owner = await createUser({ name: 'Ayesha Owner' });
  const reporter = await createUser({ name: 'Bilal Reporter' });
  const other = await createUser();
  const admin = await createAdmin();
  const projectId = await insertProject({ owner: owner._id, title: 'Campus delivery app' });
  return { owner, reporter, other, admin, projectId };
}

const report = (agent, targetId, extra = {}) =>
  agent.post('/api/reports').send({ targetType: 'project', targetId: String(targetId), reason: 'spam', ...extra });

test('a verified member can report a post once; others can report it too', async () => {
  const { reporter, other, projectId } = await setup();
  const a = await agentFor(reporter);
  const first = await report(a, projectId, { details: 'Selling things' });
  assert.equal(first.status, 201);
  assert.equal(first.body.data.status, 'open');
  assert.equal((await report(a, projectId)).status, 409);
  assert.equal((await report(await agentFor(other), projectId)).status, 201);
});

test('guests and unverified users cannot report', async () => {
  const { projectId } = await setup();
  assert.equal((await report(request(app), projectId)).status, 401);
  const unverified = await agentFor(await createUser({ isVerified: false }));
  assert.equal((await report(unverified, projectId)).status, 403);
});

test('reporting a missing, invalid or removed post is 404; unknown type is 400', async () => {
  const { reporter, owner } = await setup();
  const a = await agentFor(reporter);
  assert.equal((await report(a, new mongoose.Types.ObjectId())).status, 404);
  assert.equal((await report(a, 'not-an-id')).status, 404);
  const removedId = await insertProject({ owner: owner._id, title: 'Gone', isRemoved: true });
  assert.equal((await report(a, removedId)).status, 404);
  const bad = await a.post('/api/reports').send({ targetType: 'nope', targetId: String(removedId), reason: 'spam' });
  assert.equal(bad.status, 400);
  assert.ok(bad.body.error.fields.targetType);
  const badReason = await report(a, removedId, { reason: 'boring' });
  assert.equal(badReason.status, 400);
});

test('resolved Lost & Found items can still be reported', async () => {
  const { reporter, owner } = await setup();
  postModel('LostItem', 'itemName');
  const LostItem = mongoose.model('LostItem');
  const { insertedId } = await LostItem.collection.insertOne({ owner: owner._id, itemName: 'Wallet', status: 'Resolved', isRemoved: false });
  const res = await (await agentFor(reporter)).post('/api/reports').send({ targetType: 'lostfound', targetId: String(insertedId), reason: 'misleading' });
  assert.equal(res.status, 201);
});

test('admin sees open reports with target summary and reporter public profile only', async () => {
  const { reporter, admin, projectId } = await setup();
  await report(await agentFor(reporter), projectId);
  const res = await (await agentFor(admin)).get('/api/admin/reports?status=open');
  assert.equal(res.status, 200);
  assert.equal(res.body.data.total, 1);
  const item = res.body.data.items[0];
  assert.equal(item.targetType, 'project');
  assert.equal(item.reporter.name, 'Bilal Reporter');
  assert.equal(item.reporter.email, undefined);
  assert.deepEqual(item.target, { type: 'project', id: String(projectId), title: 'Campus delivery app', link: `/projects/${projectId}`, isRemoved: false });
});

test('admin remove hides the post, closes all its open reports and tells the owner', async () => {
  const { owner, reporter, other, admin, projectId } = await setup();
  const r1 = await report(await agentFor(reporter), projectId);
  await report(await agentFor(other), projectId);
  const res = await (await agentFor(admin)).patch(`/api/admin/reports/${r1.body.data.id}`).send({ action: 'remove' });
  assert.equal(res.status, 200);
  const Project = mongoose.model('Project');
  assert.equal((await Project.collection.findOne({ _id: projectId })).isRemoved, true);
  const list = await (await agentFor(admin)).get('/api/admin/reports?status=actioned');
  assert.equal(list.body.data.total, 2);
  const n = await Notification.find({ user: owner._id, type: 'moderation' });
  assert.equal(n.length, 1);
  assert.equal(n[0].title, 'Your post was removed by a moderator');
});

test('admin dismiss changes only that report; deciding twice is a conflict', async () => {
  const { reporter, other, admin, projectId } = await setup();
  const r1 = await report(await agentFor(reporter), projectId);
  await report(await agentFor(other), projectId);
  const adminAgent = await agentFor(admin);
  assert.equal((await adminAgent.patch(`/api/admin/reports/${r1.body.data.id}`).send({ action: 'dismiss' })).status, 200);
  assert.equal((await adminAgent.get('/api/admin/reports?status=open')).body.data.total, 1);
  assert.equal((await adminAgent.patch(`/api/admin/reports/${r1.body.data.id}`).send({ action: 'dismiss' })).status, 409);
  assert.equal((await adminAgent.patch(`/api/admin/reports/${r1.body.data.id}`).send({ action: 'explode' })).status, 400);
});

test('report list survives a deleted target', async () => {
  const { reporter, admin, projectId } = await setup();
  await report(await agentFor(reporter), projectId);
  await mongoose.model('Project').collection.deleteOne({ _id: projectId });
  const res = await (await agentFor(admin)).get('/api/admin/reports');
  assert.equal(res.status, 200);
  assert.equal(res.body.data.items[0].target, null);
});

test('members cannot use admin report endpoints', async () => {
  const { reporter } = await setup();
  const a = await agentFor(reporter);
  assert.equal((await a.get('/api/admin/reports')).status, 403);
  assert.equal((await a.patch(`/api/admin/reports/${new mongoose.Types.ObjectId()}`).send({ action: 'dismiss' })).status, 403);
});
