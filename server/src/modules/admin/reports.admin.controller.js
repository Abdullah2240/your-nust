import mongoose from 'mongoose';
import { HttpError, ok, paginate } from '../../lib/http.js';
import { TARGETS, getTarget } from '../../lib/targets.js';
import { notify } from '../notifications/notify.js';
import { Report } from '../reports/report.model.js';
import { toPublicProfile } from '../users/user.utils.js';

function targetSummary(type, doc) {
  if (!doc) return null;
  const id = String(doc._id);
  return { type, id, title: doc.displayTitle ?? '', link: TARGETS[type].path(id), isRemoved: !!doc.isRemoved };
}

// GET /api/admin/reports?status=open|dismissed|actioned|all
export async function listReports(req, res) {
  const { status, page, limit } = req.query;
  const filter = status === 'all' ? {} : { status };
  const result = await paginate(
    Report.find(filter).sort({ createdAt: status === 'open' ? 1 : -1 }).populate('reporter'),
    { page, limit },
  );
  const items = await Promise.all(
    result.items.map(async (r) => ({
      id: String(r._id),
      targetType: r.targetType,
      reason: r.reason,
      details: r.details,
      status: r.status,
      createdAt: r.createdAt,
      reviewedAt: r.reviewedAt,
      reporter: toPublicProfile(r.reporter),
      target: targetSummary(r.targetType, await getTarget(r.targetType, r.targetId)),
    })),
  );
  ok(res, { ...result, items });
}

// PATCH /api/admin/reports/:id { action: 'dismiss' | 'remove' }
export async function decideReport(req, res) {
  const report = mongoose.isValidObjectId(req.params.id) ? await Report.findById(req.params.id) : null;
  if (!report) throw new HttpError(404, 'NOT_FOUND', 'Report not found');
  if (report.status !== 'open') throw new HttpError(409, 'CONFLICT', 'This report has already been reviewed.');

  const reviewed = { reviewedBy: req.user._id, reviewedAt: new Date() };

  if (req.body.action === 'dismiss') {
    Object.assign(report, { status: 'dismissed', ...reviewed });
    await report.save();
    return ok(res, report);
  }

  const target = await getTarget(report.targetType, report.targetId);
  if (target && !target.isRemoved) {
    await target.constructor.updateOne({ _id: target._id }, { $set: { isRemoved: true } });
    await notify({
      userId: target.owner,
      type: 'moderation',
      title: 'Your post was removed by a moderator',
      body: `"${target.displayTitle ?? 'Your post'}" was reported and removed. Contact the admins if you think this is a mistake.`,
      link: TARGETS[report.targetType].path(String(target._id)),
    });
  }
  await Report.updateMany(
    { targetType: report.targetType, targetId: report.targetId, status: 'open' },
    { $set: { status: 'actioned', ...reviewed } },
  );
  ok(res, await Report.findById(report._id));
}
