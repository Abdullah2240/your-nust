// Tiny fetch wrapper for our API. Paths leave out "/api": api.get('/lost-found', { q }).
// Resolves to the unwrapped `data`; throws ApiError { status, code, message, fields } on failure.

export class ApiError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields || {};
  }
}

function toQuery(params) {
  if (!params) return '';
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) value.forEach((v) => qs.append(key, v));
    else qs.append(key, value);
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

async function request(method, path, { params, body, form } = {}) {
  const init = { method, credentials: 'same-origin', headers: {} };
  if (form) init.body = form;
  else if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(`/api${path}${toQuery(params)}`, init);
  } catch {
    throw new ApiError(0, 'NETWORK', 'Could not reach the server. Check your connection and try again.');
  }
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    const e = json?.error || {};
    throw new ApiError(res.status, e.code || 'SERVER_ERROR', e.message || 'Something went wrong. Please try again.', e.fields);
  }
  return json.data;
}

export const api = {
  get: (path, params) => request('GET', path, { params }),
  post: (path, body) => request('POST', path, { body }),
  patch: (path, body) => request('PATCH', path, { body }),
  del: (path) => request('DELETE', path),
  upload: (path, formData, method = 'POST') => request(method, path, { form: formData }),
};
