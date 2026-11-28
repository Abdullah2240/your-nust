import { z } from 'zod';
import { DAYS } from '../../lib/constants.js';

const place = (label) =>
  z.string({ message: `Enter ${label}` }).trim().min(2, `Enter ${label}`).max(60, 'Keep it under 60 characters');

const base = {
  kind: z.enum(['offer', 'request'], { message: 'Choose offer or request' }),
  origin: place('where you start'),
  destination: place('where you are going'),
  seats: z.coerce.number({ message: 'Enter the number of seats' }).int('Must be a whole number').min(1, 'At least 1 seat').max(8, 'At most 8 seats'),
  notes: z.string().trim().max(300, 'Keep notes under 300 characters').optional().default(''),
};

const oneTime = z.object({
  ...base,
  frequency: z.literal('one-time'),
  departAt: z.coerce
    .date({ error: 'Choose a valid date and time' })
    .refine((d) => d.getTime() > Date.now(), 'Choose a time in the future'),
});

const recurring = z.object({
  ...base,
  frequency: z.literal('recurring'),
  days: z
    .array(z.enum(DAYS, { message: 'Choose valid days' }), { message: 'Choose at least one day' })
    .min(1, 'Choose at least one day')
    .transform((d) => DAYS.filter((x) => d.includes(x))),
  time: z
    .string({ message: 'Enter a departure time' })
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use a time like 08:00'),
});

export const createRideSchema = z
  .discriminatedUnion('frequency', [oneTime, recurring], { error: 'Choose one-time or recurring' })
  .superRefine((val, ctx) => {
    if (val.origin && val.destination && val.origin.toLowerCase() === val.destination.toLowerCase()) {
      ctx.addIssue({ code: 'custom', path: ['destination'], message: 'Start and destination must be different' });
    }
  });

export const updateRideSchema = z
  .object({
    status: z.enum(['Active', 'Full', 'Completed', 'Cancelled'], { message: 'Invalid status' }).optional(),
    seats: z.coerce.number().int('Must be a whole number').min(0, 'Cannot be negative').max(8, 'At most 8 seats').optional(),
    notes: z.string().trim().max(300, 'Keep notes under 300 characters').optional(),
  })
  .strict();

export const listRidesSchema = z.object({
  kind: z.enum(['offer', 'request']).optional(),
  frequency: z.enum(['one-time', 'recurring']).optional(),
  status: z.enum(['Active', 'Full', 'Completed', 'Cancelled']).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).optional(),
});

export const pageSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).optional(),
});

export const rideApprovalSchema = z
  .object({
    decision: z.enum(['approved', 'rejected'], { message: 'Decision must be approved or rejected' }),
    reason: z.string().trim().max(300, 'Keep the reason under 300 characters').optional().default(''),
  })
  .superRefine((val, ctx) => {
    if (val.decision === 'rejected' && val.reason.length < 3) {
      ctx.addIssue({ code: 'custom', path: ['reason'], message: 'Tell the owner why (at least 3 characters)' });
    }
  });
