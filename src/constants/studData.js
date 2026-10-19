import { apiFetch, getSession, subscribeSession } from '@/lib/api';
import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

/* ================================================================== */
/* SAMPLE DATA - everything marked TODO(API) should later come from    */
/* your backend. Values match the web screenshots.                     */
/* ================================================================== */

// TODO(API): GET /student/me
export const USER = {
  name: 'Nicholas Mathebula',
  initials: 'NM',
  role: 'Student Assist',
  position: 'Student Assistant',
  accountType: 'Student',
  studentNumber: 'SA-2024-8842',
  department: 'Information and Communication Technology',
  email: 'student@test.com',
  cell: '076 123 4567',
  personalEmail: '',
  currentYear: '',
  enrolledSince: '',
  attendanceRate: 94,
  footerContact: 'General: general@tut.ac.za · Contact: +27 (0)86 110 2421',
  footerCopy: '© 2026 Faculty of Information and Communication Technology. All rights reserved.',
};

/* ---------------------------- date helpers ---------------------------- */
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
export const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const WEEKDAYS_LONG = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

export const toKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const fromKey = (k) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const formatLong = (d) => `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

export function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // Monday first
  const total = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < offset; i += 1) cells.push(null);
  for (let d = 1; d <= total; d += 1) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/* ------------------------- schedule sample data ----------------------- */
// TODO(API): GET /student/schedule?month=YYYY-MM
export const SHIFTS = {
  '2026-10-06': { slot: 'Morning', time: '08:00 AM – 12:00 PM' },
  '2026-10-07': { slot: 'Morning', time: '08:00 AM – 12:00 PM' },
  '2026-10-13': { slot: 'Morning', time: '08:00 AM – 12:00 PM' },
  '2026-10-15': { slot: 'Afternoon', time: '12:00 PM – 04:00 PM' },
  '2026-10-16': { slot: 'Afternoon', time: '12:00 PM – 04:00 PM' },
  '2026-10-21': { slot: 'Morning', time: '08:00 AM – 12:00 PM' },
  '2026-10-24': { slot: 'Morning', time: '08:00 AM – 12:00 PM' },
  '2026-10-26': { slot: 'Afternoon', time: '12:00 PM – 04:00 PM' },
  '2026-10-28': { slot: 'Morning', time: '08:00 AM – 12:00 PM' },
  '2026-10-30': { slot: 'Afternoon', time: '12:00 PM – 04:00 PM' },
};

export const CLOSURES = {
  '2026-10-02': 'Institutional closure · Library closure',
  '2026-10-03': 'Institutional closure · Strike',
};

export const HOLIDAYS = {
  '2026-12-16': 'Day of Reconciliation',
  '2026-12-25': 'Christmas Day',
  '2026-12-26': 'Day of Goodwill',
  '2027-01-01': "New Year's Day",
};

export const APPROVED_LEAVE = ['2026-10-17', '2026-10-18', '2026-10-19'];

export const SWAPS = [{ from: '2026-10-06', to: '2026-10-08', with: 'Simphiwe Masanabo' }];

export function getDayInfo(date, shifts = SHIFTS) {
  const key = toKey(date);
  if (CLOSURES[key]) return { key, kind: 'closure', label: CLOSURES[key] };
  if (HOLIDAYS[key]) return { key, kind: 'holiday', label: HOLIDAYS[key] };
  const from = SWAPS.find((s) => s.from === key);
  if (from) {
    return { key, kind: 'swapFrom', label: `Swapped to ${formatLong(fromKey(from.to))}`, swap: from };
  }
  const to = SWAPS.find((s) => s.to === key);
  if (to) {
    return { key, kind: 'swapTo', label: `Swapped from ${formatLong(fromKey(to.from))}`, swap: to };
  }
  if (APPROVED_LEAVE.includes(key)) return { key, kind: 'leave', label: 'Approved leave' };
  if (shifts[key]) return { key, kind: 'shift', label: 'Shift', shift: shifts[key] };
  if (date.getDay() === 0) return { key, kind: 'sunday', label: 'Sundays are never scheduled.' };
  return { key, kind: 'none', label: 'No shift scheduled.' };
}

/* Dates that cannot be picked for leave start or swap date. */
export function isUnavailable(date, extraBlockedKey) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) return true;
  if (date.getDay() === 0) return true;
  if (toKey(date) === extraBlockedKey) return true;
  return ['closure', 'holiday', 'swapFrom', 'swapTo', 'leave'].includes(getDayInfo(date).kind);
}

/* Starting at startKey, collect `days` available days (skips unavailable ones). */
export function computeLeaveDates(startKey, days) {
  const out = [];
  const d = fromKey(startKey);
  let guard = 0;
  while (out.length < days && guard < 400) {
    if (!isUnavailable(d)) out.push(toKey(d));
    d.setDate(d.getDate() + 1);
    guard += 1;
  }
  return out;
}

/* ================================================================== */
/* SHIFT TIMER (Start Shift / countdown / auto-complete)               */
/* ================================================================== */

/* TEST MODE: set SHIFT_TEST_MODE to true to try the timer without waiting.
   While on, 1 assigned hour counts down as SHIFT_TEST_SECONDS_PER_HOUR seconds
   (1h = 10s, 2h = 20s, 4h = 40s) and the "not before start / after end"
   check is skipped. Set it back to false for real use. */
export const SHIFT_TEST_MODE = false;
export const SHIFT_TEST_SECONDS_PER_HOUR = 10;

const MINUTE_MS = 60000;

function clockToMinutes(h, m, meridiem) {
  let hh = Number(h);
  const mm = Number(m);
  if (meridiem) {
    const mer = meridiem.toUpperCase();
    if (mer === 'PM' && hh < 12) hh += 12;
    if (mer === 'AM' && hh === 12) hh = 0;
  }
  if (hh > 24 || mm > 59) return null;
  return hh * 60 + mm;
}

/* Reads every clock time ("08:00 AM", "4:00 PM", "16:00") found in a string. */
function readClockTimes(text) {
  const out = [];
  const re = /(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/gi;
  let match = re.exec(text);
  while (match) {
    const value = clockToMinutes(match[1], match[2], match[3]);
    if (value !== null) out.push(value);
    match = re.exec(text);
  }
  return out;
}

export function formatClock(totalMinutes) {
  const m = ((totalMinutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const mm = m % 60;
  const meridiem = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${meridiem}`;
}

/* The assigned duration is ALWAYS calculated from the start and end times, so a
   stored "duration" field can never disagree with the real shift hours.
   Accepts { startTime, endTime } / { start, end } or the existing { time: 'A – B' }.
   Shifts that cross midnight (end <= start) get +24h. */
export function parseShiftTimes(shift) {
  if (!shift) return null;
  let startMin = null;
  let endMin = null;
  const s = shift.startTime ?? shift.start;
  const e = shift.endTime ?? shift.end;
  if (s && e) {
    startMin = readClockTimes(String(s))[0] ?? null;
    endMin = readClockTimes(String(e))[0] ?? null;
  }
  if (startMin === null || endMin === null) {
    const found = readClockTimes(String(shift.time || ''));
    if (found.length >= 2) {
      startMin = found[0];
      endMin = found[1];
    }
  }
  if (startMin === null || endMin === null) return null;
  if (endMin <= startMin) endMin += 1440;
  return {
    startMin,
    endMin,
    durationMinutes: endMin - startMin,
    startLabel: formatClock(startMin),
    endLabel: formatClock(endMin),
  };
}

/* Real timestamps (ms) for a shift on a given date key. */
export function getShiftWindow(dateKey, shift) {
  const t = parseShiftTimes(shift);
  if (!t || t.durationMinutes <= 0) return null;
  const day = fromKey(dateKey);
  const startTs = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, t.startMin).getTime();
  const realMs = t.durationMinutes * MINUTE_MS;
  const timerMs = SHIFT_TEST_MODE
    ? Math.round((t.durationMinutes / 60) * SHIFT_TEST_SECONDS_PER_HOUR * 1000)
    : realMs;
  return { ...t, startTs, endTs: startTs + realMs, durationMs: realMs, timerMs };
}

export function formatCountdown(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const parts = [];
  if (h) parts.push(`${h} ${h === 1 ? 'hour' : 'hours'}`);
  if (m) parts.push(`${m} min`);
  return parts.join(' ') || '0 min';
}

/* ---- shift records: { [dateKey]: { startedAt, endsAt, timerMs, completedAt|null, ... } } ----
   Kept in a module-level store so the countdown survives navigation between screens,
   and saved to storage so it survives a page refresh / app restart. */
// TODO(API): replace with GET/POST /student/shift-sessions so records live in your database.
const SHIFT_STORAGE_KEY = 'studShiftRecords';
let shiftRecords = {};
const shiftListeners = new Set();
const emitShifts = () => shiftListeners.forEach((fn) => fn());

function getShiftStorage() {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return {
          getItem: async (k) => window.localStorage.getItem(k),
          setItem: async (k, v) => window.localStorage.setItem(k, v),
        };
      }
    } catch (e) {
      /* storage blocked */
    }
    return null;
  }
  try {
    // Optional: works after `npx expo install @react-native-async-storage/async-storage`.
    // Without it the countdown still survives navigation, just not a full app restart.
    // eslint-disable-next-line global-require
    const mod = require('@react-native-async-storage/async-storage');
    return mod.default || mod;
  } catch (e) {
    return null;
  }
}

function persistShiftRecords() {
  const storage = getShiftStorage();
  if (!storage) return;
  Promise.resolve()
    .then(() => storage.setItem(SHIFT_STORAGE_KEY, JSON.stringify(shiftRecords)))
    .catch(() => {});
}

/* Marks any record whose end time has passed as completed (idempotent). */
function completeFinishedShifts(now) {
  let changed = false;
  const next = { ...shiftRecords };
  Object.keys(next).forEach((key) => {
    const r = next[key];
    if (!r.completedAt && now >= r.endsAt) {
      next[key] = { ...r, completedAt: r.endsAt };
      changed = true;
    }
  });
  if (changed) {
    shiftRecords = next;
    persistShiftRecords();
    emitShifts();
  }
}

async function hydrateShiftRecords() {
  const storage = getShiftStorage();
  if (!storage) return;
  try {
    const raw = await storage.getItem(SHIFT_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      shiftRecords = { ...parsed, ...shiftRecords };
      completeFinishedShifts(Date.now());
      emitShifts();
    }
  } catch (e) {
    /* ignore corrupt data */
  }
}
hydrateShiftRecords();

const subscribeShifts = (fn) => {
  shiftListeners.add(fn);
  return () => shiftListeners.delete(fn);
};

export function useShiftRecords() {
  return useSyncExternalStore(subscribeShifts, () => shiftRecords, () => shiftRecords);
}

/* ---- ONE shared 1-second ticker for the whole app ----
   It only runs while at least one component uses useNow(), and it stops
   when the last one unmounts, so intervals can never pile up or leak. */
let tickNow = Date.now();
let tickTimer = null;
const tickListeners = new Set();

function runTick() {
  tickNow = Date.now();
  completeFinishedShifts(tickNow);
  tickListeners.forEach((fn) => fn());
}

function subscribeTick(fn) {
  tickListeners.add(fn);
  if (!tickTimer) {
    tickNow = Date.now();
    completeFinishedShifts(tickNow);
    tickTimer = setInterval(runTick, 1000);
  }
  return () => {
    tickListeners.delete(fn);
    if (tickListeners.size === 0 && tickTimer) {
      clearInterval(tickTimer);
      tickTimer = null;
    }
  };
}

/* Current time in ms, refreshed every second. */
export function useNow() {
  const [mountedAt] = useState(() => Date.now());
  const tick = useSyncExternalStore(subscribeTick, () => tickNow, () => tickNow);
  return Math.max(tick, mountedAt);
}

/* 'upcoming' | 'available' | 'inProgress' | 'completed' | 'ended' | 'invalid' */
export function getShiftStatus(dateKey, shift, record, now) {
  if (record?.completedAt) return 'completed';
  if (record) return now >= record.endsAt ? 'completed' : 'inProgress';
  const w = getShiftWindow(dateKey, shift);
  if (!w) return 'invalid';
  if (SHIFT_TEST_MODE) return 'available';
  if (now < w.startTs) return 'upcoming';
  if (now >= w.endTs) return 'ended';
  return 'available';
}

/* Starts a shift. Returns { ok: true } or { ok: false, message }. */
export function startShift(dateKey, shift, now = Date.now()) {
  const w = getShiftWindow(dateKey, shift);
  if (!w) {
    return { ok: false, message: 'This shift has no valid start and end time, so it cannot be started.' };
  }
  const existing = shiftRecords[dateKey];
  if (existing) {
    return {
      ok: false,
      message: existing.completedAt || now >= existing.endsAt
        ? 'This shift has already been completed and cannot be started again.'
        : 'This shift is already in progress.',
    };
  }
  const running = Object.keys(shiftRecords).find(
    (k) => !shiftRecords[k].completedAt && now < shiftRecords[k].endsAt,
  );
  if (running) {
    return { ok: false, message: `Finish your shift on ${formatLong(fromKey(running))} before starting another one.` };
  }
  if (!SHIFT_TEST_MODE) {
    if (now < w.startTs) {
      return { ok: false, message: `You can only start this shift from ${w.startLabel} on its scheduled day.` };
    }
    if (now >= w.endTs) {
      return { ok: false, message: 'The assigned time for this shift has ended, so it can no longer be started.' };
    }
  }
  const record = {
    startedAt: now,
    endsAt: now + w.timerMs,
    timerMs: w.timerMs,
    durationMinutes: w.durationMinutes,
    scheduledStart: w.startTs,
    scheduledEnd: w.endTs,
    testMode: SHIFT_TEST_MODE,
    completedAt: null,
  };
  shiftRecords = { ...shiftRecords, [dateKey]: record };
  persistShiftRecords();
  emitShifts();
  return { ok: true };
}

/* ------------------------------ form data ----------------------------- */
// PLACEHOLDER categories/limits: only Sick Leave (5 days) and Exam Leave are
// visible in the screenshots. Replace with your real list.
// TODO(API): GET /leave-categories
export const LEAVE_CATEGORIES = [
  { value: 'Sick Leave', maxDays: 5, description: 'Medical or health related absence' },
  { value: 'Exam Leave', maxDays: 3, description: 'Scheduled examination or assessment' },
  { value: 'Family Responsibility Leave', maxDays: 3, description: 'Family or personal emergency' },
];

export const LEAVE_SUGGESTIONS = [
  'Medical appointment and recovery',
  'Scheduled examination',
  'Family or personal commitment',
  'University-related activity',
];

export const SWAP_SUGGESTIONS = [
  'Medical appointment',
  'Family commitment',
  'Academic timetable conflict',
  'Transport or scheduling issue',
];

// TODO(API): GET /student/upcoming-shifts
export const SHIFT_OPTIONS = [
  { value: '2026-10-06', label: 'Oct 6, 2026 · 08:00 AM – 12:00 PM · Morning' },
  { value: '2026-10-07', label: 'Oct 7, 2026 · 08:00 AM – 12:00 PM · Morning' },
  { value: '2026-10-13', label: 'Oct 13, 2026 · 08:00 AM – 12:00 PM · Morning' },
  { value: '2026-10-15', label: 'Oct 15, 2026 · 12:00 PM – 04:00 PM · Afternoon' },
];

// TODO(API): GET /shifts/available-assistants?date=YYYY-MM-DD
export const AVAILABLE_ASSISTANTS = [
  'Simphiwe Masanabo',
  'Thandi Nkosi',
  'Lerato Mokoena',
];

/* In-memory drafts ("Draft is kept while you complete the form."). */
// TODO(API/STORAGE): swap for AsyncStorage if drafts must survive app restarts.
export const drafts = { leave: null, swap: null };

/* ---------------------------- requests store -------------------------- */
// Fetches the logged-in student's requests from the deployed backend.
// Returns an array of: { id, rawId, name, initials, email, type, status, ... }

const RequestsContext = createContext({
  requests: [],
  loading: false,
  error: null,
  refresh: async () => {},
  cancelRequest: async () => {},
  updateRequest: async () => {},
  addRequest: async () => {},
});

export function RequestsProvider({ children }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    const session = await getSession();
    if (!session?.access_token) {
      setRequests([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/requests');
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

  useEffect(() => {
    let active = true;
    let sessionChanged = false;
    const syncRequests = (session) => {
      if (!active) return;
      if (session?.access_token) {
        refresh();
      } else {
        setRequests([]);
        setError(null);
        setLoading(false);
      }
    };
    const unsubscribe = subscribeSession((session) => {
      sessionChanged = true;
      syncRequests(session);
    });

    getSession().then((session) => {
      if (active && !sessionChanged) syncRequests(session);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [refresh]);

  const cancelRequest = async (id) => {
    const target = requests.find((r) => r.id === id || String(r.rawId) === String(id));
    if (!target?.rawId || target.status !== 'Pending') {
      throw new Error('Only pending requests can be cancelled.');
    }
    const res = await apiFetch(`/api/requests/${target.rawId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Could not cancel request');
    }
    await refresh();
  };

  const updateRequest = async (id, entry) => {
    const target = requests.find((r) => r.id === id || String(r.rawId) === String(id));
    if (!target?.rawId || target.status !== 'Pending') {
      throw new Error('Only pending requests can be edited.');
    }
    const res = await apiFetch(`/api/requests/${target.rawId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: entry.type,
        dateRange: entry.dateRange || null,
        detail: entry.detail || entry.comments || null,
        replacement: entry.replacement || null,
        reason: entry.reason || null,
        ...(entry.supportingDocument ? { supportingDocument: entry.supportingDocument } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Could not update request');
    }
    await refresh();
  };

  // Added this back so "New Request" works!
  const addRequest = async (entry) => {
    const res = await apiFetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: entry.type,
        dateRange: entry.dateRange || entry.date_range || null,
        detail: entry.detail || entry.comments || null,
        replacement: entry.replacement || null,
        reason: entry.reason || null,
        supportingDocument: entry.supportingDocument || null,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Could not submit request');
    }
    await refresh();
  };

  return (
    <RequestsContext.Provider value={{ requests, loading, error, refresh, cancelRequest, updateRequest, addRequest }}>
      {children}
    </RequestsContext.Provider>
  );
}

export function useRequests() {
  return useContext(RequestsContext);
}
console.log('studData LOADED, useShiftRecords is', typeof useShiftRecords);