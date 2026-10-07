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
    const user = JSON.parse(localStorage.getItem('session') || 'null')?.user;
    if (!user) return null;
    return {
      role: user.role === 'supervisor' ? 'supervisor' : 'student',
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

const NotificationsContext = createContext({
  all: [],
  push: () => {},
  markRead: () => {},
  markAllRead: () => {},
  clearAll: () => {},
});

export function NotificationsProvider({ children }) {
  const [all, setAll] = useState(load);

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

  const markRead = useCallback((id) => {
    commit((current) => current.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, [commit]);

  const markAllRead = useCallback(() => {
    const viewer = getViewer();
    commit((current) => current.map((n) => (visibleTo(n, viewer) ? { ...n, read: true } : n)));
  }, [commit]);

  const clearAll = useCallback(() => {
    const viewer = getViewer();
    commit((current) => current.filter((n) => !visibleTo(n, viewer)));
  }, [commit]);

  const value = useMemo(
    () => ({ all, push, markRead, markAllRead, clearAll }),
    [all, push, markRead, markAllRead, clearAll],
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
  return { notifications, unreadCount, push, markRead, markAllRead, clearAll };
}
