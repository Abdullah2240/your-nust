import mongoose from 'mongoose';
import { baseSchemaOptions } from '../../lib/schema.js';
import { ROLES, SCHOOLS } from '../../lib/constants.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: true },
    department: { type: String, enum: SCHOOLS, default: 'Other' },
    batch: { type: String, trim: true, default: '' },
    skills: { type: [String], default: [] },
    phone: { type: String, trim: true, default: '' },
    role: { type: String, enum: ROLES, default: 'member' },
    isVerified: { type: Boolean, default: false },
    verifyTokenHash: String,
    verifyTokenExpires: Date,
    resetTokenHash: String,
    resetTokenExpires: Date,
  },
  baseSchemaOptions,
);

userSchema.index({ verifyTokenHash: 1 }, { sparse: true });
userSchema.index({ resetTokenHash: 1 }, { sparse: true });

export const User = mongoose.models.User || mongoose.model('User', userSchema);
