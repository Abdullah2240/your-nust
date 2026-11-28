import mongoose from 'mongoose';
import { baseSchemaOptions } from '../../lib/schema.js';
import { SCHOOLS } from '../../lib/constants.js';

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    skills: {
      type: [String],
      validate: [(v) => v.length >= 1 && v.length <= 10, 'Add between 1 and 10 skills'],
    },
    // Lower-cased copy of `skills`, used only for case-insensitive filtering. Never sent to the client.
    skillsKey: { type: [String], index: true, select: false },
    department: { type: String, enum: SCHOOLS, required: true },
    teamSize: { type: Number, required: true, min: 2, max: 20 },
    currentMembers: { type: Number, default: 1, min: 1 },
    status: { type: String, enum: ['Open', 'Closed'], default: 'Open' },
    approval: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rejectionReason: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    isRemoved: { type: Boolean, default: false },
  },
  baseSchemaOptions,
);

projectSchema.virtual('displayTitle').get(function displayTitle() {
  return this.title;
});

projectSchema.pre('validate', function setSkillsKey() {
  this.skillsKey = (this.skills || []).map((s) => s.toLowerCase());
});

projectSchema.index({ approval: 1, isRemoved: 1, createdAt: -1 });

export const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
