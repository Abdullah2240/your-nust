import { HttpError, ok } from '../../lib/http.js';
import { getTarget } from '../../lib/targets.js';
import { Report } from './report.model.js';

// POST /api/reports (verified members). Resolved posts can still be reported (FR-11).
export async function createReport(req, res) {
  const { targetType, targetId, reason, details } = req.body;
  const target = await getTarget(targetType, targetId);
  if (!target || target.isRemoved) throw new HttpError(404, 'NOT_FOUND', 'That post no longer exists.');

  const duplicate = await Report.exists({ reporter: req.user._id, targetType, targetId: target._id, status: 'open' });
  if (duplicate) throw new HttpError(409, 'CONFLICT', "You've already reported this post. An admin will review it.");

  const report = await Report.create({ reporter: req.user._id, targetType, targetId: target._id, reason, details });
  ok(res, report, 201);
}
