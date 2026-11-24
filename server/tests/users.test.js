import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { app, request, startTestDb, stopTestDb, clearDb, createUser, agentFor } from './helpers.js';

before(startTestDb);
after(stopTestDb);
beforeEach(clearDb);

test('skills are trimmed and de-duplicated case-insensitively', async () => {
  const agent = await agentFor(await createUser());
  const res = await agent.patch('/api/users/me').send({ skills: ['React', 'react', ' Node.js '] });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data.user.skills, ['React', 'Node.js']);
});

test('role and other protected keys are ignored', async () => {
  const agent = await agentFor(await createUser());
  const res = await agent.patch('/api/users/me').send({ role: 'admin', isVerified: false, name: 'New Name' });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.user.role, 'member');
  assert.equal(res.body.data.user.isVerified, true);
  assert.equal(res.body.data.user.name, 'New Name');
});

test('invalid phone is rejected; empty phone clears it', async () => {
  const agent = await agentFor(await createUser({ phone: '03001234567' }));
  const bad = await agent.patch('/api/users/me').send({ phone: '12345' });
  assert.equal(bad.status, 400);
  assert.ok(bad.body.error.fields.phone);
  const cleared = await agent.patch('/api/users/me').send({ phone: '' });
  assert.equal(cleared.body.data.user.phone, '');
});

test('guests cannot edit a profile', async () => {
  assert.equal((await request(app).patch('/api/users/me').send({ name: 'X' })).status, 401);
});
