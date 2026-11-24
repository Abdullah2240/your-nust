import mongoose from 'mongoose';
import { baseSchemaOptions } from '../../lib/schema.js';
import { NOTIFICATION_TYPES } from '../../lib/constants.js';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true, maxlength: 200 },
    body: { type: String, default: '', maxlength: 1000 },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false },
  },
  baseSchemaOptions,
);
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
