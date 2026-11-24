import { z } from 'zod';
import { SCHOOLS } from '../../lib/constants.js';

// Trims skills and removes case-insensitive duplicates, keeping the first spelling.
const skills = z
  .array(z.string().trim().min(1).max(30, 'Each skill must be 30 characters or fewer'))
  .max(15, 'Add up to 15 skills')
  .transform((list) => {
    const seen = new Set();
    return list.filter((s) => {
      const k = s.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  });

export const updateMeSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name').max(60).optional(),
  department: z.enum(SCHOOLS).optional(),
  batch: z.string().trim().regex(/^\d{4}$/, 'Enter a year like 2024').optional(),
  skills: skills.optional(),
  phone: z
    .string()
    .trim()
    .regex(/^(03\d{9})?$/, 'Use the format 03XXXXXXXXX')
    .optional(),
});
