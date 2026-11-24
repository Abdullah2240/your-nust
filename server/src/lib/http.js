// Response envelope, error type and small route helpers shared by every module.

// Sends { ok: true, data } with the given status.
export function ok(res, data, status = 200) {
  return res.status(status).json({ ok: true, data });
}

// Throw this anywhere in a route; the error middleware turns it into { ok: false, error }.
export class HttpError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

// Wraps an async route handler so rejected promises reach the error middleware.
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// Runs a paged find. `query` is a Mongoose Query (not yet executed).
// Returns { items, total, page, pages }. Default limit 12, max 50.
export async function paginate(query, { page = 1, limit = 12 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 50);
  const safePage = Math.max(Number(page) || 1, 1);
  const filter = query.getFilter();
  const [items, total] = await Promise.all([
    query.clone().skip((safePage - 1) * safeLimit).limit(safeLimit),
    query.model.countDocuments(filter),
  ]);
  return { items, total, page: safePage, pages: Math.max(Math.ceil(total / safeLimit), 1) };
}
