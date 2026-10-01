// src/lib/api.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ CHANGE THIS if your laptop's Wi-Fi IP changes.
// Run `ipconfig` on your laptop to find the current IPv4 address.
export const API_BASE = 'https://spas-latex-lib-cow.trycloudflare.com';

const SESSION_KEY = 'session';

export async function getSession() {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveSession(session) {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function clearSession() {
  await AsyncStorage.removeItem(SESSION_KEY);
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
    const session = await getSession();
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
    await saveSession(updated);
    return updated;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

/**
 * Fetch wrapper that handles auth automatically:
 * - Attaches the current JWT if a session exists
 * - Preemptively refreshes if the token is about to expire
 * - Retries once on 401 after refreshing
 * - Clears session on unrecoverable auth failure
 *
 * Works for both authenticated and public endpoints (login, register).
 */
export async function apiFetch(path, options = {}) {
  let session = await getSession();

  // Preemptive refresh (only if we have a session that's expiring)
  if (session && isExpiringSoon(session)) {
    try {
      session = await refreshSession();
    } catch {
      await clearSession();
      session = null;
    }
  }

  const headers = { ...(options.headers || {}) };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  let res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // Reactive refresh + retry on 401
  if (res.status === 401 && session?.refresh_token) {
    try {
      session = await refreshSession();
      headers.Authorization = `Bearer ${session.access_token}`;
      res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } catch {
      await clearSession();
      throw new Error('Session expired. Please log in again.');
    }
  }

  return res;
}