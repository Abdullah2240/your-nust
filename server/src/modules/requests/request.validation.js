import { z } from 'zod';
import { TARGETS } from '../../lib/targets.js';

const STATUSES = ['pending', 'approved', 'declined', 'withdrawn'];

export const createRequestSchema = z.object({
  targetType: z.enum(Object.keys(TARGETS), { message: 'Unknown post type' }),
  targetId: z.string({ message: 'Missing post' }).trim().min(1, 'Missing post'),
  message: z
    .string({ message: 'Write a short message' })
    .trim()
    .min(10, 'Write at least 10 characters so they know who you are')
    .max(500, 'Keep it under 500 characters'),
  seats: z.coerce.number().int('Must be a whole number').min(1, 'At least 1 seat').max(8, 'At most 8 seats').optional(),
});

export const listRequestsSchema = z.object({
  status: z.enum(STATUSES).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).optional(),
});

export const decideRequestSchema = z.object({
  decision: z.enum(['approved', 'declined'], { message: 'Decision must be approved or declined' }),
});
