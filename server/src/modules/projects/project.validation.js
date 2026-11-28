import { z } from 'zod';
import { SCHOOLS } from '../../lib/constants.js';

const skill = z.string().trim().min(1, 'Skill cannot be empty').max(30, 'Keep each skill under 30 characters');
const skills = z
  .array(skill, { message: 'Add at least one skill' })
  .min(1, 'Add at least one skill')
  .max(10, 'Up to 10 skills')
  .transform((list) => {
    // Remove case-insensitive duplicates, keep the first spelling.
    const seen = new Set();
    return list.filter((s) => (seen.has(s.toLowerCase()) ? false : seen.add(s.toLowerCase())));
  });

const fields = {
  title: z.string({ message: 'Give your project a title' }).trim().min(3, 'Title is too short').max(100, 'Keep the title under 100 characters'),
  description: z
    .string({ message: 'Describe the project' })
    .trim()
    .min(10, 'Add a bit more detail (at least 10 characters)')
    .max(2000, 'Keep the description under 2000 characters'),
  skills,
  department: z.enum(SCHOOLS, { message: 'Choose a school' }),
  teamSize: z.coerce.number({ message: 'Enter the team size' }).int('Must be a whole number').min(2, 'At least 2 people').max(20, 'At most 20 people'),
};

export const createProjectSchema = z.object(fields);

export const updateProjectSchema = z
  .object({
    ...Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.optional()])),
    status: z.enum(['Open', 'Closed'], { message: 'Status must be Open or Closed' }).optional(),
  })
  .strict();

const csv = (v) =>
  (Array.isArray(v) ? v : v === undefined ? [] : [v])
    .flatMap((x) => String(x).split(','))
    .map((x) => x.trim())
    .filter(Boolean);

export const listProjectsSchema = z.object({
  skill: z.union([z.string(), z.array(z.string())]).optional().transform((v) => csv(v)),
  department: z.enum(SCHOOLS).optional(),
  status: z.enum(['Open', 'Closed']).optional(),
  minTeam: z.coerce.number().int().min(1).optional(),
  maxTeam: z.coerce.number().int().min(1).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).optional(),
});

export const mineSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).optional(),
});

export const approvalSchema = z
  .object({
    decision: z.enum(['approved', 'rejected'], { message: 'Decision must be approved or rejected' }),
    reason: z.string().trim().max(300, 'Keep the reason under 300 characters').optional().default(''),
  })
  .superRefine((val, ctx) => {
    if (val.decision === 'rejected' && val.reason.length < 3) {
      ctx.addIssue({ code: 'custom', path: ['reason'], message: 'Tell the owner why (at least 3 characters)' });
    }
  });
