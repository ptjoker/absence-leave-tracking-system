import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const RequestsContext = createContext({
  requests: [],
  loading: false,
  error: null,
  addRequest: async () => {},
  updateRequestStatus: async () => {},
  refresh: async () => {},
});

const API_BASE = 'http://localhost:3000';

function getAuthHeader() {
  try {
    const raw = localStorage.getItem('session');
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session.access_token) return null;
    return { Authorization: `Bearer ${session.access_token}` };
  } catch {
    return null;
  }
}

function normalizeStatus(status) {
  // Backend returns 'Pending' / 'Approved' / 'Rejected' — same as frontend.
  return status;
}

export function RequestsProvider({ children }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    const auth = getAuthHeader();
    if (!auth) {
      // Not logged in — nothing to fetch.
      setRequests([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/requests`, { headers: auth });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Load requests error:', err);
      setError(err.message);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and whenever the auth session changes (login/logout).
  useEffect(() => {
    refresh();
    const onStorage = (e) => {
      if (e.key === 'session') refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);

  const addRequest = async (entry) => {
    const auth = getAuthHeader();
    if (!auth) {
      throw new Error('Not authenticated');
    }
    const payload = {
      type: entry.type,
      dateRange: entry.dateRange || entry.date_range || null,
      detail: entry.detail || entry.comments || null,
      replacement: entry.replacement || null,
      reason: entry.reason || null,
    };
    const res = await fetch(`${API_BASE}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Could not submit request');
    }
    // Refresh the list so the new item appears immediately.
    await refresh();
  };

const updateRequestStatus = async (id, status) => {
  const auth = getAuthHeader();
  if (!auth) {
    throw new Error('Not authenticated');
  }
  // `id` is the display ID (e.g., "REQ-001"). Look up the real rawId from state.
  const target = requests.find((r) => r.id === id);
  if (!target || !target.rawId) throw new Error('Request not found');
  const rawId = target.rawId;
  const res = await fetch(`${API_BASE}/api/requests/${rawId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({ status: normalizeStatus(status) }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Could not update status');
    }
    // Optimistic local update, then refresh to stay in sync.
    setRequests((current) =>
      current.map((r) => (r.id === id ? { ...r, status } : r))
    );
    await refresh();
  };

  return (
    <RequestsContext.Provider
      value={{ requests, loading, error, addRequest, updateRequestStatus, refresh }}
    >
      {children}
    </RequestsContext.Provider>
  );
}

export function useRequests() {
  return useContext(RequestsContext);
}