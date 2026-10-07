import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

/* ------------------------------------------------------------------ */
/* ASSETS - set these once you have added the files to your project.   */
/* Paths are relative to THIS file (src/constants).                    */
/* Example: export const LOGO_IMAGE = require('../../assets/images/logo.png'); */
/* ------------------------------------------------------------------ */
export const LOGO_IMAGE = null;
export const LIBRARY_BG = null;

/* Nav bar placement: 'bottom' (as in your nav screenshot) or 'top'. */
export const NAV_POSITION = 'bottom';

/* Single place for every route used by the Student Dashboard.
   Each value must match a file name in src/app (without the extension). */
export const ROUTES = {
  dashboard: '/studDash',
  schedule: '/studSchedule',
  requests: '/studRequest',
  history: '/studHistory',
  profile: '/studProfile',
  notifications: '/studNotification',
  login: '/', // TODO(API/AUTH): point to your real login route
};

export const SERIF = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

const LIGHT = {
  mode: 'light',
  bgFallback: '#8fb1d6',
  overlay: 'rgba(120,160,210,0.45)',
  header: '#ffffff',
  card: '#f5f8fc',
  panel: '#e9f0f9',
  text: '#0f172a',
  muted: '#475569',
  title: '#14213d',
  border: '#dbe3ee',
  inputBg: '#ffffff',
  inputBorder: '#cbd5e1',
  primary: '#2563eb',
  primarySoft: '#e6efff',
  danger: '#c8503e',
  okBg: '#dcfce7',
  okText: '#15803d',
  badBg: '#fee2e2',
  badText: '#b91c1c',
  warnBg: '#fef3c7',
  warnText: '#b45309',
  navBg: '#ffffff',
  navInactive: '#4b5563',
  navActive: '#5b5bf0',
  accentRed: '#c8102e',
  amber: '#e8a317',
};

const DARK = {
  mode: 'dark',
  bgFallback: '#1b2a41',
  overlay: 'rgba(10,20,40,0.65)',
  header: '#111827',
  card: '#1e293b',
  panel: '#273449',
  text: '#e2e8f0',
  muted: '#94a3b8',
  title: '#f1f5f9',
  border: '#334155',
  inputBg: '#0f172a',
  inputBorder: '#475569',
  primary: '#3b82f6',
  primarySoft: '#1e3a6e',
  danger: '#d9604d',
  okBg: '#14532d',
  okText: '#86efac',
  badBg: '#7f1d1d',
  badText: '#fca5a5',
  warnBg: '#78350f',
  warnText: '#fcd34d',
  navBg: '#111827',
  navInactive: '#9ca3af',
  navActive: '#818cf8',
  accentRed: '#f87171',
  amber: '#e8a317',
};

let currentMode = 'light';
const listeners = new Set();

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const getMode = () => currentMode;

export function toggleMode() {
  currentMode = currentMode === 'light' ? 'dark' : 'light';
  listeners.forEach((fn) => fn());
}

export function useStudTheme() {
  const mode = useSyncExternalStore(subscribe, getMode, getMode);
  return { mode, c: mode === 'dark' ? DARK : LIGHT, toggle: toggleMode };
}