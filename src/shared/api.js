const API = import.meta.env.VITE_API_URL || '';

export function setSession(tokens) {
  if (tokens?.access_token) sessionStorage.setItem('niramaya.access', tokens.access_token);
  if (tokens?.refresh_token) sessionStorage.setItem('niramaya.refresh', tokens.refresh_token);
  if (tokens?.user) sessionStorage.setItem('niramaya.user', JSON.stringify(tokens.user));
}
export function clearSession() {
  sessionStorage.removeItem('niramaya.access');
  sessionStorage.removeItem('niramaya.refresh');
  sessionStorage.removeItem('niramaya.user');
}

async function request(path, options = {}, retry = true) {
  const headers = new Headers(options.headers || {});
  const access = sessionStorage.getItem('niramaya.access');
  if (access) headers.set('Authorization', `Bearer ${access}`);
  if (options.body && !(options.body instanceof FormData))
    headers.set('Content-Type', 'application/json');
  let response = await fetch(`${API}${path}`, { ...options, headers });
  if (response.status === 401 && retry && sessionStorage.getItem('niramaya.refresh')) {
    const refreshed = await fetch(`${API}/api/auth/refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sessionStorage.getItem('niramaya.refresh')}` },
    });
    if (refreshed.ok) {
      const token = await refreshed.json();
      setSession({ access_token: token.access_token });
      return request(path, options, false);
    }
    clearSession();
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw Object.assign(
      new Error(body.detail || 'Could not reach Niramaya. Try again when connected.'),
      { status: response.status },
    );
  }
  return response.status === 204 ? null : response.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  login: (credentials) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }, false),
  me: () => request('/api/auth/me'),
  changePassword: (body) =>
    request('/api/auth/change-password', { method: 'POST', body: JSON.stringify(body) }),
};
