import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNotifications, getViewer } from '@/context/NotificationsContext';
import {
  declineReasonOf,
  requestDecisionNotification,
  requestSubmittedNotification,
} from '@/lib/notifications';

const RequestsContext = createContext({
  requests: [],
  loading: false,
  error: null,
  addRequest: async () => {},
  updateRequest: async () => {},
  cancelRequest: async () => {},
  updateRequestStatus: async () => {},
  refresh: async () => {},
});

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const DECLINE_REASONS_KEY = 'sa_decline_reasons_v1';
const SNAPSHOT_PREFIX = 'sa_request_snapshot_v1:';
const POLL_MS = 20000;

function getSession() {
  try {
    return JSON.parse(localStorage.getItem('session') || 'null');
  } catch {
    return null;
  }
}

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
  return status;
}

function readJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function withDeclineReasons(list) {
  const reasons = readJson(DECLINE_REASONS_KEY, {});
  return list.map((request) => {
    const reason = declineReasonOf(request) || reasons[request.rawId];
    return reason ? { ...request, declineReason: reason } : request;
  });
}

export function RequestsProvider({ children }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { push } = useNotifications();

  const detectChanges = useCallback((list) => {
    const viewer = getViewer();
    if (!viewer) return;
    const key = `${SNAPSHOT_PREFIX}${viewer.keys[0] || viewer.role}`;
    const previous = readJson(key, null);
    const next = {};
    list.forEach((request) => {
      if (request.rawId) next[request.rawId] = request.status;
    });
    if (previous) {
      list.forEach((request) => {
        if (!request.rawId) return;
        const before = previous[request.rawId];
        if (viewer.role === 'supervisor') {
          if (request.status === 'Pending' && before === undefined) {
            push(requestSubmittedNotification(request));
          }
        } else if (before === 'Pending' && (request.status === 'Approved' || request.status === 'Rejected')) {
          push({
            ...requestDecisionNotification(request, request.status, declineReasonOf(request)),
            recipients: viewer.keys.length ? viewer.keys : null,
          });
        }
      });
    }
    writeJson(key, next);
  }, [push]);

  const refresh = useCallback(async (options) => {
    const silent = options?.silent === true;
    const auth = getAuthHeader();
    if (!auth) {
      setRequests([]);
      return [];
    }
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/requests`, { headers: auth });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      const data = await res.json();
      const list = withDeclineReasons(Array.isArray(data) ? data : []);
      setRequests(list);
      detectChanges(list);
      return list;
    } catch (err) {
      console.error('Load requests error:', err);
      if (!silent) {
        setError(err.message);
        setRequests([]);
      }
      return [];
    } finally {
      if (!silent) setLoading(false);
    }
  }, [detectChanges]);

  useEffect(() => {
    refresh();
    let lastSession = localStorage.getItem('session');
    let lastPoll = Date.now();
    const onStorage = (e) => {
      if (e.key === 'session') refresh();
    };
    const tick = () => {
      const current = localStorage.getItem('session');
      if (current !== lastSession) {
        lastSession = current;
        lastPoll = Date.now();
        refresh();
        return;
      }
      if (!current || document.hidden) return;
      if (Date.now() - lastPoll >= POLL_MS) {
        lastPoll = Date.now();
        refresh({ silent: true });
      }
    };
    window.addEventListener('storage', onStorage);
    const timer = setInterval(tick, 1500);
    return () => {
      window.removeEventListener('storage', onStorage);
      clearInterval(timer);
    };
  }, [refresh]);

  const addRequest = async (entry) => {
    const auth = getAuthHeader();
    if (!auth) throw new Error('Not authenticated');
    const session = getSession();
    const user = session?.user || {};
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Student Assistant';
    const payload = {
      type: entry.type,
      dateRange: entry.dateRange || entry.date_range || null,
      detail: entry.detail || entry.comments || null,
      replacement: entry.replacement || null,
      reason: entry.reason || null,
    };
    const knownIds = new Set(requests.map((r) => r.rawId));
    const res = await fetch(`${API_BASE}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Could not submit request');
    }
    const list = await refresh();
    const created = list.find((r) => r.rawId && !knownIds.has(r.rawId));
    push(requestSubmittedNotification(created || {
      rawId: `local-${Date.now()}`,
      name: fullName,
      type: payload.type,
      dateRange: payload.dateRange,
    }));
  };

  const updateRequest = async (id, entry) => {
    const auth = getAuthHeader();
    if (!auth) throw new Error('Not authenticated');
    const target = requests.find((r) => r.id === id || String(r.rawId) === String(id));
    if (!target?.rawId || target.status !== 'Pending') throw new Error('Only pending requests can be edited.');
    const res = await fetch(`${API_BASE}/api/requests/${target.rawId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...auth }, body: JSON.stringify({ type: entry.type, dateRange: entry.dateRange || null, detail: entry.detail || entry.comments || null, replacement: entry.replacement || null, reason: entry.reason || null }) });
    if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(body.error || 'Could not update request'); }
    await refresh();
  };

  const cancelRequest = async (id) => {
    const auth = getAuthHeader();
    if (!auth) throw new Error('Not authenticated');
    const target = requests.find((r) => r.id === id || String(r.rawId) === String(id));
    if (!target?.rawId || target.status !== 'Pending') throw new Error('Only pending requests can be cancelled.');
    const res = await fetch(`${API_BASE}/api/requests/${target.rawId}`, { method: 'DELETE', headers: auth });
    if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(body.error || 'Could not cancel request'); }
    await refresh();
  };

  const updateRequestStatus = async (id, status, reason = '') => {
    const auth = getAuthHeader();
    if (!auth) throw new Error('Not authenticated');
    const target = requests.find((r) => r.id === id);
    if (!target || !target.rawId) throw new Error('Request not found');
    const rawId = target.rawId;
    const cleanReason = String(reason || '').trim();
    const declined = status === 'Rejected';
    const res = await fetch(`${API_BASE}/api/requests/${rawId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({
        status: normalizeStatus(status),
        ...(cleanReason ? { reason: cleanReason } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Could not update status');
    }
    if (declined && cleanReason) {
      writeJson(DECLINE_REASONS_KEY, { ...readJson(DECLINE_REASONS_KEY, {}), [rawId]: cleanReason });
    }
    if (status === 'Approved' || declined) {
      push(requestDecisionNotification(target, status, cleanReason));
    }
    setRequests((current) =>
      current.map((r) => (r.id === id ? { ...r, status, ...(declined && cleanReason ? { declineReason: cleanReason } : {}) } : r))
    );
    await refresh();
  };

  return (
    <RequestsContext.Provider value={{ requests, loading, error, addRequest, updateRequest, cancelRequest, updateRequestStatus, refresh }}>
      {children}
    </RequestsContext.Provider>
  );
}

export function useRequests() {
  return useContext(RequestsContext);
}
