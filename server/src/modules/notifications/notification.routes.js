import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { asyncHandler, HttpError, ok, paginate } from '../../lib/http.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { Notification } from './notification.model.js';

const listSchema = z.object({
  unread: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).optional(),
});

const router = Router();
router.use(requireAuth);

router.get('/', validate(listSchema, 'query'), asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.unread === 'true') filter.read = false;
  ok(res, await paginate(Notification.find(filter).sort({ createdAt: -1 }), req.query));
}));

router.get('/unread-count', asyncHandler(async (req, res) => {
  ok(res, { count: await Notification.countDocuments({ user: req.user._id, read: false }) });
}));

router.patch('/read-all', asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  ok(res, { updated: true });
}));

router.patch('/:id/read', asyncHandler(async (req, res) => {
  const n = mongoose.isValidObjectId(req.params.id)
    ? await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { read: true }, { new: true })
    : null;
  if (!n) throw new HttpError(404, 'NOT_FOUND', 'Notification not found');
  ok(res, n);
}));

export default router;
