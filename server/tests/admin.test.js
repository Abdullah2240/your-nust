import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { app, request, startTestDb, stopTestDb, clearDb, createUser, createAdmin, agentFor } from './helpers.js';
import { User } from '../src/modules/users/user.model.js';

before(startTestDb);
after(stopTestDb);
beforeEach(clearDb);

test('stats returns numbers for every tile, including modules not merged yet', async () => {
  const admin = await createAdmin();
  await createUser();
  await createUser({ isVerified: false });
  const res = await (await agentFor(admin)).get('/api/admin/stats');
  assert.equal(res.status, 200);
  const d = res.body.data;
  assert.equal(d.users, 3);
  assert.equal(d.verifiedUsers, 2);
  for (const key of ['openReports', 'pendingProjects', 'pendingRides', 'lostOpen', 'menuItems']) {
    assert.equal(typeof d[key], 'number', key);
  }
});

test('admin user list includes email and supports search', async () => {
  const admin = await createAdmin();
  await createUser({ name: 'Ayesha Khan', email: 'ayesha@seecs.edu.pk' });
  await createUser({ name: 'Bilal Ahmed', email: 'bilal@smme.edu.pk' });
  const a = await agentFor(admin);
  const all = await a.get('/api/admin/users');
  assert.equal(all.body.data.total, 3);
  const found = await a.get('/api/admin/users?q=smme');
  assert.equal(found.body.data.total, 1);
  assert.equal(found.body.data.items[0].email, 'bilal@smme.edu.pk');
  assert.ok(!JSON.stringify(found.body).includes('passwordHash'));
  assert.equal((await a.get('/api/admin/users?q=(')).status, 200);
});

test('an admin cannot demote themself, so there is always an admin', async () => {
  const admin = await createAdmin();
  const res = await (await agentFor(admin)).patch(`/api/admin/users/${admin.id}/role`).send({ role: 'member' });
  assert.equal(res.status, 409);
  assert.equal((await User.findById(admin.id)).role, 'admin');
});

test('promote a member, then the new admin can demote the first admin', async () => {
  const first = await createAdmin();
  const member = await createUser();
  const promote = await (await agentFor(first)).patch(`/api/admin/users/${member.id}/role`).send({ role: 'admin' });
  assert.equal(promote.status, 200);
  assert.equal(promote.body.data.role, 'admin');
  const demote = await (await agentFor(member)).patch(`/api/admin/users/${first.id}/role`).send({ role: 'member' });
  assert.equal(demote.status, 200);
  assert.equal((await User.findById(first.id)).role, 'member');
});

test('invalid role or unknown user is rejected', async () => {
  const admin = await createAdmin();
  const member = await createUser();
  const a = await agentFor(admin);
  assert.equal((await a.patch(`/api/admin/users/${member.id}/role`).send({ role: 'king' })).status, 400);
  assert.equal((await a.patch('/api/admin/users/64b000000000000000000000/role').send({ role: 'admin' })).status, 404);
});

test('domains: list, add, reject duplicates and bad values, never delete the last one', async () => {
  const a = await agentFor(await createAdmin());
  const list = await a.get('/api/admin/domains');
  assert.equal(list.status, 200);
  const startCount = list.body.data.length;
  assert.ok(startCount >= 1);

  const added = await a.post('/api/admin/domains').send({ domain: 'SCME.nust.edu.pk' });
  assert.equal(added.status, 201);
  assert.equal(added.body.data.domain, 'scme.nust.edu.pk');
  assert.equal((await a.post('/api/admin/domains').send({ domain: 'scme.nust.edu.pk' })).status, 409);
  assert.equal((await a.post('/api/admin/domains').send({ domain: 'not a domain' })).status, 400);

  const domains = (await a.get('/api/admin/domains')).body.data;
  for (const d of domains.slice(1)) assert.equal((await a.delete(`/api/admin/domains/${d.id}`)).status, 200);
  assert.equal((await a.delete(`/api/admin/domains/${domains[0].id}`)).status, 409);
});

test('new domains are accepted at sign-up right away', async () => {
  const a = await agentFor(await createAdmin());
  await a.post('/api/admin/domains').send({ domain: 'ceme.nust.edu.pk' });
  const res = await request(app).post('/api/auth/register').send({
    name: 'Sara Ali', email: 'sara@ceme.nust.edu.pk', password: 'Password123!', department: 'Other', batch: '2025',
  });
  assert.equal(res.status, 201);
});

test('members and guests cannot reach admin endpoints', async () => {
  const member = await agentFor(await createUser());
  for (const path of ['/api/admin/stats', '/api/admin/users', '/api/admin/domains']) {
    assert.equal((await member.get(path)).status, 403, path);
    assert.equal((await request(app).get(path)).status, 401, path);
  }
});
