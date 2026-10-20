import { getSession } from '@/lib/session';
import { apiFetch } from '@/lib/api';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'sa_notifications_v1';
const MAX_STORED = 200;

function load() {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function persist(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable – keep in-memory state only */
  }
}

/** Who is signed in right now (read fresh from the session every time). */
export function getViewer() {
  try {
    const user = getSession()?.user;
    if (!user) return null;
    return {
      role: ['admin', 'supervisor'].includes(user.role) ? user.role : 'student',
      keys: [user.id, user.email].filter(Boolean),
    };
  } catch {
    return null;
  }
}

function visibleTo(notification, viewer) {
  if (!viewer) return false;
  if (notification.recipientRole !== viewer.role) return false;
  if (!notification.recipients || notification.recipients.length === 0) return true;
  return notification.recipients.some((key) => viewer.keys.includes(key));
}

function getNotificationLink(role, type) {
  if (role === 'admin' && type === 'registration_pending') return '/admin';
  if (role === 'supervisor' && ['leave_request_pending', 'shift_swap_submitted', 'shift_swap_pending_supervisor'].includes(type)) {
    return '/supervisor/requests';
  }
  if (role === 'student' && type === 'shift_swap_pending_colleague') return '/dashboard/shift-swap';
  return undefined;
}

const NotificationsContext = createContext({
  all: [],
  push: () => {},
  markRead: () => {},
  markAllRead: () => {},
  clearAll: () => {},
});

export function NotificationsProvider({ children }) {
  const [all, setAll] = useState(load);
  const [serverNotifications, setServerNotifications] = useState([]);
  const session = getSession();

  useEffect(() => {
    if (!session?.access_token || !session.user?.id) {
      setServerNotifications([]);
      return undefined;
    }

    let cancelled = false;
    const loadServerNotifications = async () => {
      try {
        const response = await apiFetch('/api/notifications?limit=100');
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || `Could not load notifications (${response.status}).`);
        if (cancelled) return;
        setServerNotifications((body.notifications || []).map((notification) => ({
          ...notification,
          id: `api:${notification.id}`,
          serverId: notification.id,
          serverBacked: true,
          recipientRole: session.user.role,
          recipients: null,
          read: Boolean(notification.isRead),
          link: getNotificationLink(session.user.role, notification.type),
        })));
      } catch (error) {
        if (!cancelled) console.error('Load server notifications error:', error);
      }
    };

    loadServerNotifications();
    const interval = window.setInterval(loadServerNotifications, 30000);
    window.addEventListener('focus', loadServerNotifications);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener('focus', loadServerNotifications);
    };
  }, [session?.access_token, session?.user?.id, session?.user?.role]);

  // Keep other tabs / windows in sync.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setAll(load());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const commit = useCallback((updater) => {
    const next = updater(load());
    persist(next);
    setAll(next);
  }, []);

  /** Adds a notification. A notification with an id that already exists is ignored. */
  const push = useCallback((notification) => {
    commit((current) => {
      if (notification.id && current.some((n) => n.id === notification.id)) return current;
      const item = {
        recipientRole: 'student',
        recipients: null,
        read: false,
        createdAt: new Date().toISOString(),
        ...notification,
        id: notification.id || `n:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
      };
      return [item, ...current].slice(0, MAX_STORED);
    });
  }, [commit]);

  const markRead = useCallback(async (id) => {
    const notification = serverNotifications.find((item) => item.id === id);
    if (!notification) {
      commit((current) => current.map((n) => (n.id === id ? { ...n, read: true } : n)));
      return;
    }

    try {
      const response = await apiFetch(`/api/notifications/${encodeURIComponent(notification.serverId)}/read`, { method: 'PATCH' });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || `Could not update notification (${response.status}).`);
      setServerNotifications((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
    } catch (error) {
      console.error('Mark server notification read error:', error);
    }
  }, [commit, serverNotifications]);

  const markAllRead = useCallback(() => {
    const viewer = getViewer();
    commit((current) => current.map((n) => (visibleTo(n, viewer) ? { ...n, read: true } : n)));
    if (serverNotifications.some((item) => !item.read)) {
      apiFetch('/api/notifications/read-all', { method: 'PATCH' })
        .then(async (response) => {
          const body = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(body.error || `Could not update notifications (${response.status}).`);
          setServerNotifications((current) => current.map((item) => ({ ...item, read: true })));
        })
        .catch((error) => console.error('Mark all server notifications read error:', error));
    }
  }, [commit, serverNotifications]);

  const clearAll = useCallback(async () => {
    const viewer = getViewer();
    if (serverNotifications.length > 0) {
      try {
        const response = await apiFetch('/api/notifications', { method: 'DELETE' });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || `Could not clear notifications (${response.status}).`);
        setServerNotifications([]);
      } catch (error) {
        console.error('Clear server notifications error:', error);
        return;
      }
    }
    commit((current) => current.filter((n) => !visibleTo(n, viewer)));
  }, [commit, serverNotifications.length]);

  const value = useMemo(
    () => ({ all: [...all, ...serverNotifications], push, markRead, markAllRead, clearAll }),
    [all, serverNotifications, push, markRead, markAllRead, clearAll],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

/** Notifications addressed to the signed-in user, newest first. */
export function useNotifications() {
  const { all, push, markRead, markAllRead, clearAll } = useContext(NotificationsContext);
  const viewer = getViewer();
  const viewerSig = viewer ? `${viewer.role}|${viewer.keys.join(',')}` : '';
  const notifications = useMemo(
    () => all
      .filter((n) => visibleTo(n, viewer))
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [all, viewerSig],
  );
  const unreadCount = notifications.filter((n) => !n.read).length;
  const canClearAll = notifications.length > 0;
  return { notifications, unreadCount, push, markRead, markAllRead, clearAll, canClearAll };
}
