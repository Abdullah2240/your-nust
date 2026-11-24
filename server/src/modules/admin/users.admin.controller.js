import mongoose from 'mongoose';
import { z } from 'zod';
import { HttpError, ok, paginate } from '../../lib/http.js';
import { ROLES } from '../../lib/constants.js';
import { escapeRegex } from '../../lib/regex.js';
import { User } from '../users/user.model.js';

export const listUsersSchema = z.object({
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).optional(),
});
export const roleSchema = z.object({ role: z.enum(ROLES, { message: 'Role must be member or admin' }) });

// Admin-only view of a user: email is allowed here.
const toAdminUser = (u) => ({
  id: String(u._id), name: u.name, email: u.email, department: u.department, batch: u.batch,
  role: u.role, isVerified: u.isVerified, createdAt: u.createdAt,
});

// GET /api/admin/users?q=
export async function listUsers(req, res) {
  const { q, page, limit } = req.query;
  const filter = q ? { $or: [{ name: new RegExp(escapeRegex(q), 'i') }, { email: new RegExp(escapeRegex(q), 'i') }] } : {};
  const result = await paginate(User.find(filter).sort({ createdAt: -1 }), { page, limit });
  ok(res, { ...result, items: result.items.map(toAdminUser) });
}

// PATCH /api/admin/users/:id/role { role }. The site must always keep at least one admin.
export async function setRole(req, res) {
  const user = mongoose.isValidObjectId(req.params.id) ? await User.findById(req.params.id) : null;
  if (!user) throw new HttpError(404, 'NOT_FOUND', 'User not found');
  const { role } = req.body;

  if (user.role === 'admin' && role !== 'admin') {
    if (user._id.equals(req.user._id)) {
      throw new HttpError(409, 'CONFLICT', "You can't remove your own admin role. Ask another admin.");
    }
    if ((await User.countDocuments({ role: 'admin' })) <= 1) {
      throw new HttpError(409, 'CONFLICT', 'The site needs at least one admin.');
    }
  }
  user.role = role;
  await user.save();
  ok(res, toAdminUser(user));
}
