import { supabase } from './supabase';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

async function getToken() {
  // Always refresh to ensure the token isn't stale
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  const expiresAt = session.expires_at;
  const nowSecs = Math.floor(Date.now() / 1000);
  if (expiresAt && expiresAt - nowSecs < 60) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    return refreshed.session?.access_token ?? null;
  }

  return session.access_token;
}

export async function getAuthHeaders() {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function req(path, options = {}) {
  const token = await getToken();

  // Don't set Content-Type for FormData — fetch sets it automatically with the boundary
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
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

  getSpec: (id) => req(`/projects/${id}/spec`),
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
  generateCommands: (id) => req(`/projects/${id}/generate-commands`, { method: 'POST' }),

  generateCode: (id) => req(`/projects/${id}/generate-code`, { method: 'POST' }),
  previewCode: (id) => req(`/projects/${id}/preview`),
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
