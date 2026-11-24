import { z } from 'zod';
import { SCHOOLS } from '../../lib/constants.js';

const email = z.string().trim().toLowerCase().email('Enter a valid email address');
const password = z.string().min(8, 'Use at least 8 characters').max(100, 'Password is too long');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name').max(60),
  email,
  password,
  department: z.enum(SCHOOLS, { message: 'Choose your school' }),
  batch: z.string().trim().regex(/^\d{4}$/, 'Enter a year like 2024'),
});

export const loginSchema = z.object({ email, password: z.string().min(1, 'Enter your password') });
export const emailSchema = z.object({ email });
export const tokenSchema = z.object({ token: z.string().min(10, 'Invalid or expired link') });
export const resetSchema = z.object({ token: z.string().min(10, 'Invalid or expired link'), password });
