import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { Router } from 'express';
import { request, startTestDb, stopTestDb, clearDb, createUser, createAdmin, agentFor, PASSWORD } from './helpers.js';
import { createApp } from '../src/app.js';
import { sentMail } from '../src/lib/mailer.js';
import { requireRole, requireVerified } from '../src/middleware/auth.js';
import { User } from '../src/modules/users/user.model.js';

// App with two probe routes for the guards.
const app = createApp({
  extraRoutes: (a) => {
    const r = Router();
    r.get('/verified', requireVerified, (_q, res) => res.json({ ok: true }));
    r.get('/admin', requireRole('admin'), (_q, res) => res.json({ ok: true }));
    a.use('/api/_probe', r);
  },
});

const signup = (overrides = {}) =>
  request(app).post('/api/auth/register').send({
    name: 'Ayesha Khan', email: 'ayesha@seecs.edu.pk', password: PASSWORD, department: 'SEECS', batch: '2024', ...overrides,
  });

const tokenFrom = (mail) => mail.text.match(/token=([a-f0-9]+)/)[1];

before(startTestDb);
after(stopTestDb);
beforeEach(async () => { await clearDb(); sentMail.length = 0; });

test('register creates an unverified user and emails a verification link', async () => {
  const res = await signup();
  assert.equal(res.status, 201);
  assert.equal(res.body.data.user.email, 'ayesha@seecs.edu.pk');
  assert.equal(res.body.data.user.isVerified, false);
  assert.ok(!JSON.stringify(res.body).includes('passwordHash'));
  assert.equal(sentMail.length, 1);
  assert.match(sentMail[0].text, /\/verify-email\?token=/);
});

test('register rejects non-NUST and look-alike domains, accepts subdomains', async () => {
  for (const email of ['x@gmail.com', 'x@seecs.edu.pk.evil.com', 'x@notseecs.edu.pk']) {
    const res = await signup({ email });
    assert.equal(res.status, 400, email);
    assert.ok(res.body.error.fields.email, email);
  }
  assert.equal((await signup({ email: 'x@student.seecs.edu.pk' })).status, 201);
});

test('registering the same email twice is a conflict', async () => {
  await signup();
  const res = await signup({ email: 'AYESHA@seecs.edu.pk' });
  assert.equal(res.status, 409);
});

test('verify link signs the user in once; reuse and expiry fail with 400', async () => {
  await signup();
  const token = tokenFrom(sentMail[0]);
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/verify').send({ token });
  assert.equal(res.status, 200);
  const me = await agent.get('/api/auth/me');
  assert.equal(me.body.data.user.isVerified, true);
  assert.equal((await request(app).post('/api/auth/verify').send({ token })).status, 400);

  await signup({ email: 'bilal@smme.edu.pk' });
  await User.updateOne({ email: 'bilal@smme.edu.pk' }, { verifyTokenExpires: new Date(Date.now() - 1000) });
  assert.equal((await request(app).post('/api/auth/verify').send({ token: tokenFrom(sentMail[1]) })).status, 400);
});

test('login errors use one message for wrong password and unknown email', async () => {
  const user = await createUser();
  const wrong = await request(app).post('/api/auth/login').send({ email: user.email, password: 'nope-nope' });
  const unknown = await request(app).post('/api/auth/login').send({ email: 'ghost@seecs.edu.pk', password: 'nope-nope' });
  assert.equal(wrong.status, 401);
  assert.equal(wrong.body.error.message, 'Email or password is incorrect');
  assert.equal(unknown.body.error.message, wrong.body.error.message);
});

test('unverified users can sign in but get 403 NOT_VERIFIED on member actions', async () => {
  const user = await createUser({ isVerified: false });
  const agent = await agentFor(user, app);
  const res = await agent.get('/api/_probe/verified');
  assert.equal(res.status, 403);
  assert.equal(res.body.error.code, 'NOT_VERIFIED');
  assert.equal((await request(app).get('/api/_probe/verified')).status, 401);
});

test('requireRole(admin) blocks members and allows admins', async () => {
  const member = await agentFor(await createUser(), app);
  const admin = await agentFor(await createAdmin(), app);
  assert.equal((await member.get('/api/_probe/admin')).status, 403);
  assert.equal((await admin.get('/api/_probe/admin')).status, 200);
});

test('forgot/reset password flow, without revealing unknown emails', async () => {
  const user = await createUser();
  assert.equal((await request(app).post('/api/auth/forgot-password').send({ email: 'ghost@seecs.edu.pk' })).status, 200);
  assert.equal(sentMail.length, 0);
  assert.equal((await request(app).post('/api/auth/forgot-password').send({ email: user.email })).status, 200);
  const token = tokenFrom(sentMail[0]);
  assert.equal((await request(app).post('/api/auth/reset-password').send({ token, password: 'NewPass123!' })).status, 200);
  assert.equal((await request(app).post('/api/auth/login').send({ email: user.email, password: PASSWORD })).status, 401);
  assert.equal((await request(app).post('/api/auth/login').send({ email: user.email, password: 'NewPass123!' })).status, 200);
  assert.equal((await request(app).post('/api/auth/reset-password').send({ token, password: 'Another123!' })).status, 400);
});

test('public profile exposes only safe fields', async () => {
  const user = await createUser({ phone: '03001234567', skills: ['React'] });
  const res = await request(app).get(`/api/users/${user.id}`);
  assert.equal(res.status, 200);
  assert.deepEqual(Object.keys(res.body.data).sort(), ['batch', 'department', 'id', 'name', 'skills']);
});

test('logout clears the session', async () => {
  const agent = await agentFor(await createUser());
  await agent.post('/api/auth/logout');
  const me = await agent.get('/api/auth/me');
  assert.equal(me.body.data.user, null);
});
