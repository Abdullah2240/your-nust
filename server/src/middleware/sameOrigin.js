// CSRF guard for cookie auth: blocks state-changing requests whose browser Origin header
// is not our own site. Requests with no Origin (curl, tests, same-origin GETs) pass.
import { env } from '../config/env.js';
import { HttpError } from '../lib/http.js';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

export function sameOrigin(req, _res, next) {
  const origin = req.get('origin');
  if (SAFE.has(req.method) || !origin) return next();
  const host = `${req.protocol}://${req.get('host')}`;
  if (origin === env.clientUrl || origin === host) return next();
  next(new HttpError(403, 'FORBIDDEN', 'Cross-site request blocked'));
}
