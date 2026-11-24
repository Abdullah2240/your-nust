import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env.js';
import { asyncHandler } from '../../lib/http.js';
import { validate } from '../../middleware/validate.js';
import * as c from './auth.controller.js';
import { emailSchema, loginSchema, registerSchema, resetSchema, tokenSchema } from './auth.validation.js';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skip: () => env.isTest,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json({ ok: false, error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again in 15 minutes.' } }),
});

const router = Router();
router.post('/register', limiter, validate(registerSchema), asyncHandler(c.register));
router.post('/verify', validate(tokenSchema), asyncHandler(c.verify));
router.post('/resend-verification', limiter, validate(emailSchema), asyncHandler(c.resendVerification));
router.post('/login', limiter, validate(loginSchema), asyncHandler(c.login));
router.post('/logout', asyncHandler(c.logout));
router.get('/me', asyncHandler(c.me));
router.post('/forgot-password', limiter, validate(emailSchema), asyncHandler(c.forgotPassword));
router.post('/reset-password', validate(resetSchema), asyncHandler(c.resetPassword));

export default router;
