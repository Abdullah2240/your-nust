import mongoose from 'mongoose';
import { baseSchemaOptions } from '../../lib/schema.js';

const requestSchema = new mongoose.Schema(
  {
    targetType: { type: String, enum: ['lostfound', 'project', 'carpool'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Copied from the target when the request is created, so "incoming" is one simple query.
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, default: '', trim: true, maxlength: 500 },
    seats: { type: Number, default: 1, min: 1, max: 8 },
    status: { type: String, enum: ['pending', 'approved', 'declined', 'withdrawn'], default: 'pending' },
    decidedAt: { type: Date },
  },
  baseSchemaOptions,
);

// A person can have only one PENDING request per post. Decided ones don't block a new request.
requestSchema.index(
  { targetType: 1, targetId: 1, requester: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } },
);
requestSchema.index({ owner: 1, status: 1, createdAt: -1 });
requestSchema.index({ requester: 1, createdAt: -1 });

export const InterestRequest = mongoose.models.InterestRequest || mongoose.model('InterestRequest', requestSchema);
