import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { z } from 'zod';
import { request, startTestDb, stopTestDb } from './helpers.js';
import { createApp } from '../src/app.js';
import { HttpError, paginate } from '../src/lib/http.js';
import { escapeRegex } from '../src/lib/regex.js';
import { getTarget } from '../src/lib/targets.js';
import { validate } from '../src/middleware/validate.js';

const app = createApp({
  extraRoutes: (a) => {
    a.get('/api/_t/conflict', () => { throw new HttpError(409, 'CONFLICT', 'Taken'); });
    a.get('/api/_t/boom', () => { throw new Error('boom'); });
    a.post('/api/_t/price', validate(z.object({ price: z.number().positive() })), (req, res) => res.json({ ok: true }));
  },
});

before(startTestDb);
after(stopTestDb);

test('GET /api/health returns the success envelope', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { ok: true, data: { status: 'up' } });
});

test('unknown API route returns 404 NOT_FOUND envelope', async () => {
  const res = await request(app).get('/api/nope');
  assert.equal(res.status, 404);
  assert.equal(res.body.ok, false);
  assert.equal(res.body.error.code, 'NOT_FOUND');
});

test('HttpError is formatted with its status and code', async () => {
  const res = await request(app).get('/api/_t/conflict');
  assert.equal(res.status, 409);
  assert.deepEqual(res.body, { ok: false, error: { code: 'CONFLICT', message: 'Taken' } });
});

test('unexpected errors become a generic 500 without leaking the message', async () => {
  const original = console.error;
  console.error = () => {};
  const res = await request(app).get('/api/_t/boom');
  console.error = original;
  assert.equal(res.status, 500);
  assert.equal(res.body.error.code, 'SERVER_ERROR');
  assert.ok(!res.body.error.message.includes('boom'));
});

test('validate() returns 400 VALIDATION with field messages', async () => {
  const res = await request(app).post('/api/_t/price').send({ price: -1 });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION');
  assert.ok(res.body.error.fields.price);
});

test('cross-site POST with a foreign Origin is blocked', async () => {
  const res = await request(app).post('/api/auth/logout').set('Origin', 'https://evil.example');
  assert.equal(res.status, 403);
});

test('escapeRegex makes user text safe for RegExp', () => {
  assert.equal(escapeRegex('C++ (x)'), 'C\\+\\+ \\(x\\)');
  assert.doesNotThrow(() => new RegExp(escapeRegex('(')));
});

test('paginate pages results and caps limit at 50', async () => {
  const Thing = mongoose.models.Thing || mongoose.model('Thing', new mongoose.Schema({ n: Number }));
  await Thing.insertMany(Array.from({ length: 60 }, (_, n) => ({ n })));
  const page2 = await paginate(Thing.find({ n: { $lt: 30 } }).sort({ n: 1 }), { page: 2, limit: 12 });
  assert.equal(page2.items.length, 12);
  assert.equal(page2.total, 30);
  assert.equal(page2.pages, 3);
  assert.equal(page2.items[0].n, 12);
  const capped = await paginate(Thing.find(), { limit: 500 });
  assert.equal(capped.items.length, 50);
});

test('getTarget returns null for unknown types and bad ids', async () => {
  assert.equal(await getTarget('nope', new mongoose.Types.ObjectId()), null);
  assert.equal(await getTarget('project', 'not-an-id'), null);
});
