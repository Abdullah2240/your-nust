import mongoose from 'mongoose';
import { ok } from '../../lib/http.js';

// Counts documents of a model that may not be merged yet (returns 0 until it is).
function count(modelName, filter = {}) {
  const Model = mongoose.models[modelName];
  return Model ? Model.countDocuments(filter) : Promise.resolve(0);
}

// GET /api/admin/stats
export async function getStats(_req, res) {
  const [users, verifiedUsers, openReports, pendingProjects, pendingRides, lostOpen, menuItems] = await Promise.all([
    count('User'),
    count('User', { isVerified: true }),
    count('Report', { status: 'open' }),
    count('Project', { approval: 'pending', isRemoved: { $ne: true } }),
    count('Ride', { approval: 'pending', isRemoved: { $ne: true } }),
    count('LostItem', { status: 'Open', isRemoved: { $ne: true } }),
    count('MenuItem'),
  ]);
  ok(res, { users, verifiedUsers, openReports, pendingProjects, pendingRides, lostOpen, menuItems });
}
