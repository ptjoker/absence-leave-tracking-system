import { apiFetch } from '@/lib/api'; // Ensure this matches your alias! (The top of your file had '@libapi', but your code uses '@/lib/api')
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

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
    refresh();
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