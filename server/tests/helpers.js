// Shared test helpers. Typical test file:
//
//   import { before, after, beforeEach, test } from 'node:test';
//   import assert from 'node:assert/strict';
//   import { app, startTestDb, stopTestDb, clearDb, createUser, agentFor, request } from './helpers.js';
//   before(startTestDb); after(stopTestDb); beforeEach(clearDb);
//   test('guest cannot post', async () => {
//     const res = await request(app).post('/api/lost-found').send({});
//     assert.equal(res.status, 401);
//   });
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { User } from '../src/modules/users/user.model.js';
import { AllowedDomain, DEFAULT_DOMAINS } from '../src/modules/admin/domain.model.js';

export { request };
export const PASSWORD = 'Password123!';
export const app = createApp();

let mongo;
let counter = 0;
const hashed = bcrypt.hashSync(PASSWORD, 4);

// Starts an in-memory MongoDB for this test file.
export async function startTestDb() {
  mongo = await MongoMemoryServer.create();
  await connectDb(mongo.getUri());
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
}

export async function stopTestDb() {
  await disconnectDb();
  await mongo?.stop();
}

// Empties every collection and re-adds the default allowed domains.
export async function clearDb() {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
  await AllowedDomain.insertMany(DEFAULT_DOMAINS.map((domain) => ({ domain })));
}

// Creates a verified member (override anything, e.g. { isVerified: false, phone: '03001234567' }).
export async function createUser(overrides = {}) {
  counter += 1;
  return User.create({
    name: `Test User ${counter}`,
    email: `user${counter}@seecs.edu.pk`,
    passwordHash: hashed,
    department: 'SEECS',
    batch: '2024',
    isVerified: true,
    ...overrides,
  });
}

export function createAdmin(overrides = {}) {
  return createUser({ role: 'admin', name: `Admin ${counter + 1}`, ...overrides });
}

// Returns a supertest agent already signed in as `user` (the auth cookie is kept between calls).
// Pass your own app as the second argument if your test builds one with createApp({ extraRoutes }).
export async function agentFor(user, targetApp = app) {
  const agent = request.agent(targetApp);
  const res = await agent.post('/api/auth/login').send({ email: user.email, password: PASSWORD });
  if (res.status !== 200) throw new Error(`agentFor login failed: ${res.status} ${JSON.stringify(res.body)}`);
  return agent;
}
