// validate(zodSchema, 'body' | 'query' | 'params'): 400 VALIDATION with `fields` on failure,
// otherwise replaces req[part] with the parsed (coerced, trimmed) value.
import { HttpError } from '../lib/http.js';

export function validate(schema, part = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[part] ?? {});
    if (!result.success) {
      const fields = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.') || '_';
        if (!fields[key]) fields[key] = issue.message;
      }
      return next(new HttpError(400, 'VALIDATION', 'Please fix the highlighted fields.', fields));
    }
    // Express 5 makes req.query a getter, so define it explicitly.
    Object.defineProperty(req, part, { value: result.data, writable: true, configurable: true, enumerable: true });
    next();
  };
}
