// Auth middleware. loadUser runs on every request; the require* guards protect routes.
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from '../lib/http.js';
import { User } from '../modules/users/user.model.js';

export const AUTH_COOKIE = 'yn_token';

// Sets req.user to the signed-in User document, or null. Never blocks.
export async function loadUser(req, _res, next) {
  req.user = null;
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) return next();
  try {
    const { sub } = jwt.verify(token, env.jwtSecret);
    req.user = await User.findById(sub);
  } catch {
    req.user = null;
  }
  next();
}

// 401 unless signed in.
export function requireAuth(req, _res, next) {
  if (!req.user) return next(new HttpError(401, 'UNAUTHENTICATED', 'Please sign in first.'));
  next();
}

// 401 unless signed in, 403 NOT_VERIFIED unless the email is verified.
export function requireVerified(req, _res, next) {
  if (!req.user) return next(new HttpError(401, 'UNAUTHENTICATED', 'Please sign in first.'));
  if (!req.user.isVerified && req.user.role !== 'admin') {
    return next(new HttpError(403, 'NOT_VERIFIED', 'Please verify your NUST email first.'));
  }
  next();
}

// requireRole('admin'): 401 unless signed in, 403 unless the user has that role.
export function requireRole(role) {
  return (req, _res, next) => {
    if (!req.user) return next(new HttpError(401, 'UNAUTHENTICATED', 'Please sign in first.'));
    if (req.user.role !== role) return next(new HttpError(403, 'FORBIDDEN', 'You do not have access to this.'));
    next();
  };
}
