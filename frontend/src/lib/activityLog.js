import { useEffect, useState } from 'react';

const STORAGE_KEY = 'sa_supervisor_activity_v1';
const CHANGE_EVENT = 'sa-supervisor-activity-changed';
const MAX_ENTRIES = 500;

function read() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function recordActivity(activity) {
  const entry = {
    id: activity.id || `activity:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    occurredAt: new Date().toISOString(),
    ...activity,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...read()].slice(0, MAX_ENTRIES)));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch (error) {
    console.error('Could not save supervisor activity:', error);
  }
  return entry;
}

export function getActivities() {
  return read();
}

export function useActivityLog() {
  const [activities, setActivities] = useState(getActivities);
  useEffect(() => {
    const refresh = () => setActivities(getActivities());
    window.addEventListener(CHANGE_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(CHANGE_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);
  return activities;
}
