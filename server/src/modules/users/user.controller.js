import mongoose from 'mongoose';
import { HttpError, ok } from '../../lib/http.js';
import { User } from './user.model.js';
import { toPublicProfile, toSelf } from './user.utils.js';

export async function getProfile(req, res) {
  const user = mongoose.isValidObjectId(req.params.id) ? await User.findById(req.params.id) : null;
  if (!user) throw new HttpError(404, 'NOT_FOUND', 'User not found');
  ok(res, toPublicProfile(user));
}

// Only these keys can change; anything else in the body (role, email, isVerified) is ignored.
export async function updateMe(req, res) {
  const allowed = ['name', 'department', 'batch', 'skills', 'phone'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) req.user[key] = req.body[key];
  }
  await req.user.save();
  ok(res, { user: toSelf(req.user) });
}
