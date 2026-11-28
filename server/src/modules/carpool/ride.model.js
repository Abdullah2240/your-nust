import mongoose from 'mongoose';
import { baseSchemaOptions } from '../../lib/schema.js';
import { DAYS } from '../../lib/constants.js';

const rideSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ['offer', 'request'], required: true },
    frequency: { type: String, enum: ['one-time', 'recurring'], required: true },
    origin: { type: String, required: true, trim: true, maxlength: 60 },
    destination: { type: String, required: true, trim: true, maxlength: 60 },
    departAt: { type: Date }, // one-time rides
    days: { type: [{ type: String, enum: DAYS }], default: undefined }, // recurring rides
    time: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/ }, // recurring rides, "HH:MM"
    // Offer: seats still free. Request: seats the rider needs.
    seats: { type: Number, required: true, min: 0, max: 8 },
    notes: { type: String, default: '', trim: true, maxlength: 300 },
    status: { type: String, enum: ['Active', 'Full', 'Completed', 'Cancelled'], default: 'Active' },
    approval: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    rejectionReason: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    isRemoved: { type: Boolean, default: false },
  },
  baseSchemaOptions,
);

rideSchema.virtual('displayTitle').get(function displayTitle() {
  return `${this.origin} → ${this.destination}`;
});

rideSchema.index({ approval: 1, isRemoved: 1, status: 1, frequency: 1 });

export const Ride = mongoose.models.Ride || mongoose.model('Ride', rideSchema);
