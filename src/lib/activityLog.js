// src/lib/activityLog.js
import { apiFetch } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ACTIVITY_LOGS_STORAGE_KEY = '@icenter/supervisor-activity-logs';

const MAX_ENTRIES = 500;
let _memoryLogs = [];
const _listeners = new Set();

const notifyListeners = (logs) => {
  _listeners.forEach((cb) => {
    try { cb(logs); } catch (e) { /* ignore */ }
  });
};

export const loadActivityLogs = async () => {
  try {
    const raw = await AsyncStorage.getItem(ACTIVITY_LOGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        _memoryLogs = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Activity logs load failed:', e?.message || e);
  }
  return _memoryLogs;
};

const persistActivityLogs = async (logs) => {
  _memoryLogs = logs;
  try {
    await AsyncStorage.setItem(ACTIVITY_LOGS_STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.warn('Activity logs save failed:', e?.message || e);
  }
  notifyListeners(logs);
};

export const logSupervisorActivity = async ({
  actionType,
  action,
  description,
  details,
  supervisor,
}) => {
  const newLog = {
    id: `al-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    actionType: actionType || 'default',
    action: action || 'Activity',
    description: description || '',
    details: details || '',
    timestamp: new Date().toISOString(),
    supervisor: supervisor || 'Supervisor',
  };

  const current = await loadActivityLogs();
  const next = [newLog, ...current].slice(0, MAX_ENTRIES);
  await persistActivityLogs(next);

  apiFetch('/api/activity-logs', {
    method: 'POST',
    body: JSON.stringify(newLog),
  }).catch(() => {});

  return newLog;
};

export const clearActivityLogs = async () => {
  await persistActivityLogs([]);
};

export const subscribeToActivityLogs = (callback) => {
  _listeners.add(callback);
  return () => { _listeners.delete(callback); };
};

export const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const filterActivityLogsByRange = (logs, filter) => {
  if (!Array.isArray(logs)) return [];
  if (filter === 'all') return logs;
  const nowMs = Date.now();
  const msPerDay = 1000 * 60 * 60 * 24;
  return logs.filter((log) => {
    const d = toDate(log.timestamp);
    if (!d) return false;
    const diffDays = (nowMs - d.getTime()) / msPerDay;
    switch (filter) {
      case 'today': return diffDays < 1;
      case '7days': return diffDays <= 7;
      case '30days': return diffDays <= 30;
      case 'all':
      default: return true;
    }
  });
};

export const formatRelativeTime = (value) => {
  const date = toDate(value);
  if (!date) return '';
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
};