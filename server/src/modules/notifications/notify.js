// notify() and notifyAdmins(): create in-app notifications. They never throw, so a failed
// notification can't break the action that triggered it; failures are logged.
import { Notification } from './notification.model.js';
import { User } from '../users/user.model.js';

export async function notify({ userId, type, title, body = '', link = '' }) {
  try {
    await Notification.create({ user: userId, type, title, body, link });
  } catch (err) {
    console.error('notify() failed:', err.message);
  }
}

export async function notifyAdmins({ type, title, body = '', link = '' }) {
  try {
    const admins = await User.find({ role: 'admin' }, '_id').lean();
    await Promise.all(admins.map((a) => notify({ userId: a._id, type, title, body, link })));
  } catch (err) {
    console.error('notifyAdmins() failed:', err.message);
  }
}
