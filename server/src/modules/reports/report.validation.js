import { z } from 'zod';
import { REPORT_REASONS } from '../../lib/constants.js';
import { TARGETS } from '../../lib/targets.js';

export const createReportSchema = z.object({
  targetType: z.enum(Object.keys(TARGETS), { message: 'Unknown post type' }),
  targetId: z.string().trim().min(1, 'Missing post'),
  reason: z.enum(REPORT_REASONS, { message: 'Choose a reason' }),
  details: z.string().trim().max(500, 'Keep it under 500 characters').optional().default(''),
});

export const listReportsSchema = z.object({
  status: z.enum(['open', 'dismissed', 'actioned', 'all']).optional().default('open'),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).optional(),
});

export const decideReportSchema = z.object({
  action: z.enum(['dismiss', 'remove'], { message: 'Action must be dismiss or remove' }),
});
