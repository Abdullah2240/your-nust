import mongoose from 'mongoose';
import { baseSchemaOptions } from '../../lib/schema.js';
import { REPORT_REASONS } from '../../lib/constants.js';
import { TARGETS } from '../../lib/targets.js';

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: Object.keys(TARGETS), required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    details: { type: String, trim: true, maxlength: 500, default: '' },
    status: { type: String, enum: ['open', 'dismissed', 'actioned'], default: 'open' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
  },
  baseSchemaOptions,
);

// One open report per person per post.
reportSchema.index(
  { reporter: 1, targetType: 1, targetId: 1 },
  { unique: true, partialFilterExpression: { status: 'open' } },
);
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ targetType: 1, targetId: 1, status: 1 });

export const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);
