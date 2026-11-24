import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AUTH_COOKIE } from '../../middleware/auth.js';
import { AllowedDomain } from '../admin/domain.model.js';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// True when the email's domain equals an allowed domain or is a subdomain of one.
export async function isAllowedEmail(email) {
  const domain = String(email).toLowerCase().split('@')[1];
  if (!domain) return false;
  const allowed = await AllowedDomain.find().lean();
  return allowed.some(({ domain: d }) => domain === d || domain.endsWith('.' + d));
}

// Random one-time token; only its SHA-256 hash is stored.
export function issueToken() {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, hash: hashToken(token) };
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

export function setAuthCookie(res, user) {
  const token = jwt.sign({ sub: String(user._id) }, env.jwtSecret, { expiresIn: '7d' });
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProd,
    maxAge: SEVEN_DAYS_MS,
    path: '/',
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, { httpOnly: true, sameSite: 'lax', secure: env.isProd, path: '/' });
}
