// 404 for unknown API routes, and the single place errors become { ok: false, error }.
import mongoose from 'mongoose';
import { HttpError } from '../lib/http.js';

export function notFound(req, _res, next) {
  next(new HttpError(404, 'NOT_FOUND', `No route for ${req.method} ${req.path}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let status = 500;
  let error = { code: 'SERVER_ERROR', message: 'Something went wrong. Please try again.' };

  if (err instanceof HttpError) {
    status = err.status;
    error = { code: err.code, message: err.message };
    if (err.fields) error.fields = err.fields;
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    const fields = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
    error = { code: 'VALIDATION', message: 'Please fix the highlighted fields.', fields };
  } else if (err instanceof mongoose.Error.CastError) {
    status = 404;
    error = { code: 'NOT_FOUND', message: 'Not found' };
  } else if (err?.code === 11000) {
    status = 409;
    error = { code: 'CONFLICT', message: 'That already exists.' };
  } else if (err?.type === 'entity.parse.failed') {
    status = 400;
    error = { code: 'VALIDATION', message: 'Request body is not valid JSON.' };
  } else {
    console.error(err);
  }
  res.status(status).json({ ok: false, error });
}
