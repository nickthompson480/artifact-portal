class ApiError extends Error {
  constructor(code, message, status, detail) {
    super(message);
    this.code = code;
    this.status = status;
    this.detail = detail;
  }
}

async function req(method, path, body, isFormData = false) {
  const opts = { method, credentials: 'include' };
  if (body !== undefined) {
    if (isFormData) {
      opts.body = body;
    } else {
      opts.headers = { 'Content-Type': 'application/json' };
      opts.body = JSON.stringify(body);
    }
  }
  const res = await fetch(path, opts);
  if (!res.ok) {
    let payload = {};
    try { payload = await res.json(); } catch {}
    throw new ApiError(payload.code || 'ERROR', payload.message || res.statusText, res.status, payload.detail);
  }
  if (res.status === 204) return null;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

export const fileUrl = (id) => `/artifacts/${id}/file`;

export const me = () => req('GET', '/me');
export const login = (password) => req('POST', '/login', { password });
export const logout = () => req('POST', '/logout');
export const setup = (password) => req('POST', '/setup', { password });

export function listArtifacts(params = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') qs.set(k, v);
  }
  return req('GET', `/artifacts?${qs}`);
}

export const getArtifact = (id) => req('GET', `/artifacts/${id}`);
export const getArtifactFile = (id) => req('GET', `/artifacts/${id}/file`);
export const patchArtifact = (id, body) => req('PATCH', `/artifacts/${id}`, body);
export const softDelete = (id) => req('DELETE', `/artifacts/${id}`);
export const restore = (id) => req('POST', `/artifacts/${id}/restore`);
export const permanentDelete = (id) => req('DELETE', `/artifacts/${id}/permanent?confirm=1`);
export const createShareToken = (id, opts = {}) => req('POST', `/artifacts/${id}/share-token`, opts);
export const revokeShareToken = (id) => req('DELETE', `/artifacts/${id}/share-token`);

export const getSettings = () => req('GET', '/settings');
export const patchSetting = (key, value) => req('PATCH', '/settings', { key, value });
export const listApiKeys = () => req('GET', '/settings/api-keys');
export const createApiKey = (name) => req('POST', '/settings/api-keys', { name });
export const revokeApiKey = (id) => req('DELETE', `/settings/api-keys/${id}`);
