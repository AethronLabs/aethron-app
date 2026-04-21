import { supabase } from './supabase';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

async function getToken() {
  // Always refresh to ensure the token isn't stale
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    console.warn('[api] No session found:', error?.message);
    return null;
  }

  // If token is close to expiry, refresh it
  const expiresAt = session.expires_at; // unix seconds
  const nowSecs = Math.floor(Date.now() / 1000);
  if (expiresAt && expiresAt - nowSecs < 60) {
    console.log('[api] Token near expiry, refreshing...');
    const { data: refreshed } = await supabase.auth.refreshSession();
    return refreshed.session?.access_token ?? null;
  }

  console.log('[api] Token present, expires in', expiresAt ? expiresAt - nowSecs : '?', 's');
  return session.access_token;
}

async function req(path, options = {}) {
  const token = await getToken();

  if (!token) {
    console.error('[api] No token — request will fail:', path);
  }

  // Don't set Content-Type for FormData — fetch sets it automatically with the boundary
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  console.log(`[api] ${options.method ?? 'GET'} ${BASE_URL}${path}`, {
    hasToken: !!token,
    tokenPrefix: token ? token.slice(0, 20) + '...' : null,
  });

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[api] ${res.status} on ${path}:`, body);
    throw new Error(body || `${res.status} ${res.statusText}`);
  }

  return res.json();
}

export const api = {
  me: () => req('/auth/me'),

  listProjects: () => req('/projects'),
  createProject: (body) =>
    req('/projects', { method: 'POST', body: JSON.stringify(body) }),
  getProject: (id) => req(`/projects/${id}`),
  deleteProject: (id) => req(`/projects/${id}`, { method: 'DELETE' }),

  uploadSpec: (id, text) => {
    const form = new FormData();
    form.append('file', text);
    return req(`/projects/${id}/spec`, {
      method: 'POST',
      body: form,
    });
  },

  getCommands: (id) => req(`/projects/${id}/commands`),
  updateCommand: (projectId, cmdId, body) =>
    req(`/projects/${projectId}/commands/${cmdId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  previewCode: (id) => req(`/projects/${id}/preview`, { method: 'POST' }),
  publish: (id) => req(`/projects/${id}/publish`, { method: 'POST' }),
  getStatus: (id) => req(`/projects/${id}/status`),
  downloadSource: (id) => req(`/projects/${id}/download`),

  sandboxStats: () => req('/sandbox/stats'),
  listSessions: () => req('/sandbox/sessions'),
  getSession: (id) => req(`/sandbox/sessions/${id}`),
  startSandbox: (body) =>
    req('/sandbox/start', { method: 'POST', body: JSON.stringify(body) }),
  stopSandbox: (body) =>
    req('/sandbox/stop', { method: 'POST', body: JSON.stringify(body) }),
};
