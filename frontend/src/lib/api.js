// frontend/src/lib/api.js
const API_BASE = 'http://localhost:3000';

function getSession() {
  try {
    const raw = localStorage.getItem('session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  localStorage.setItem('session', JSON.stringify(session));
  // Notify other tabs and contexts that the session changed.
  window.dispatchEvent(new Event('storage'));
}

function clearSession() {
  localStorage.removeItem('session');
}

function isExpiringSoon(session) {
  if (!session?.expires_at) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  // Refresh if less than 60 seconds remain.
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
    saveSession(updated);
    return updated;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

/**
 * Fetch wrapper that handles auth automatically:
 * - Preemptively refreshes if the token is about to expire
 * - Retries once on 401 after a refresh
 * - Clears session and redirects to /login on unrecoverable auth failure
 */
export async function apiFetch(path, options = {}) {
  let session = getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }

  // Preemptive refresh
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

  // Reactive refresh + retry on 401
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