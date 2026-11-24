import mongoose from 'mongoose';
import { baseSchemaOptions } from '../../lib/schema.js';

const domainSchema = new mongoose.Schema(
  { domain: { type: String, required: true, unique: true, lowercase: true, trim: true } },
  baseSchemaOptions,
);

export const AllowedDomain = mongoose.models.AllowedDomain || mongoose.model('AllowedDomain', domainSchema);

export const DEFAULT_DOMAINS = ['nust.edu.pk', 'seecs.edu.pk', 'smme.edu.pk', 's3h.nust.edu.pk', 'nbs.nust.edu.pk'];
