import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { app, request, startTestDb, stopTestDb, clearDb, createUser, createAdmin, agentFor } from './helpers.js';
import { notify, notifyAdmins } from '../src/modules/notifications/notify.js';
import { Notification } from '../src/modules/notifications/notification.model.js';

before(startTestDb);
after(stopTestDb);
beforeEach(clearDb);

test('notify creates a notification and never throws on bad input', async () => {
  const user = await createUser();
  await notify({ userId: user._id, type: 'request_new', title: 'T', link: '/x' });
  assert.equal(await Notification.countDocuments({ user: user._id }), 1);
  const original = console.error;
  console.error = () => {};
  await assert.doesNotReject(notify({ userId: 'not-an-id', type: 'request_new', title: 'T' }));
  console.error = original;
});

test('notifyAdmins notifies every admin', async () => {
  await createAdmin();
  await createAdmin();
  await createUser();
  await notifyAdmins({ type: 'admin_queue', title: 'Queue' });
  assert.equal(await Notification.countDocuments({ type: 'admin_queue' }), 2);
});

test('users only see and update their own notifications', async () => {
  const a = await createUser();
  const b = await createUser();
  await notify({ userId: a._id, type: 'request_new', title: 'A1' });
  await notify({ userId: a._id, type: 'request_new', title: 'A2' });
  await notify({ userId: b._id, type: 'request_new', title: 'B1' });
  const agentA = await agentFor(a);
  const agentB = await agentFor(b);

  const list = await agentA.get('/api/notifications');
  assert.equal(list.body.data.total, 2);
  const someId = list.body.data.items[0].id;
  assert.equal((await agentB.patch(`/api/notifications/${someId}/read`)).status, 404);

  assert.equal((await agentA.get('/api/notifications/unread-count')).body.data.count, 2);
  await agentA.patch('/api/notifications/read-all');
  assert.equal((await agentA.get('/api/notifications/unread-count')).body.data.count, 0);
  assert.equal((await agentB.get('/api/notifications/unread-count')).body.data.count, 1);
});

test('guests get 401', async () => {
  assert.equal((await request(app).get('/api/notifications')).status, 401);
});
