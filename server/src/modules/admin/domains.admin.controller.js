import mongoose from 'mongoose';
import { z } from 'zod';
import { HttpError, ok } from '../../lib/http.js';
import { AllowedDomain } from './domain.model.js';

export const domainSchema = z.object({
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/, 'Enter a domain like seecs.edu.pk'),
});

// GET /api/admin/domains
export async function listDomains(_req, res) {
  ok(res, await AllowedDomain.find().sort({ domain: 1 }));
}

// POST /api/admin/domains { domain }
export async function addDomain(req, res) {
  if (await AllowedDomain.exists({ domain: req.body.domain })) {
    throw new HttpError(409, 'CONFLICT', 'That domain is already allowed.', { domain: 'Already in the list' });
  }
  ok(res, await AllowedDomain.create({ domain: req.body.domain }), 201);
}

// DELETE /api/admin/domains/:id. At least one domain must remain, or nobody could sign up.
export async function deleteDomain(req, res) {
  const domain = mongoose.isValidObjectId(req.params.id) ? await AllowedDomain.findById(req.params.id) : null;
  if (!domain) throw new HttpError(404, 'NOT_FOUND', 'Domain not found');
  if ((await AllowedDomain.countDocuments()) <= 1) {
    throw new HttpError(409, 'CONFLICT', 'Keep at least one domain, or nobody can sign up.');
  }
  await domain.deleteOne();
  ok(res, { deleted: true });
}
