// frontend/src/lib/api.js
import { getSession, setSession, clearSession } from '@/lib/session';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export { API_BASE };

function isExpiringSoon(session) {
  if (!session?.expires_at) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  return session.expires_at - nowSec < 60;
}

let refreshPromise = null;

async function refreshSession() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const session = getSession();
    if (!session?.refresh_token) throw new Error('No refresh token');

    const res = await fetch(`${API_BASE}/api/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });

    if (!res.ok) throw new Error('Refresh failed');
    const data = await res.json();

    const updated = {
      ...session,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
    };
    setSession(updated);
    return updated;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function apiFetch(path, options = {}) {
  let session = getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }

  if (isExpiringSoon(session)) {
    try {
      session = await refreshSession();
    } catch (err) {
      clearSession();
      window.location.href = '/login';
      throw err;
    }
  }

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${session.access_token}`,
  };

  let res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    try {
      session = await refreshSession();
      headers.Authorization = `Bearer ${session.access_token}`;
      res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } catch (err) {
      clearSession();
      window.location.href = '/login';
      throw err;
    }
  }

  return res;
}

export { getSession };