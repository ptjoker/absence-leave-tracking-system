import { format, getISOWeek, startOfWeek, addDays, isSameDay } from 'date-fns';

// South African public holidays for 2026. When a holiday falls on Sunday,
// the following Monday is also treated as a public holiday under the normal
// observed-holiday rule.
export const PUBLIC_HOLIDAYS_2026 = {
  '2026-01-01': 'New Year’s Day',
  '2026-03-21': 'Human Rights Day',
  '2026-04-03': 'Good Friday',
  '2026-04-06': 'Family Day',
  '2026-04-27': 'Freedom Day',
  '2026-05-01': 'Workers’ Day',
  '2026-06-16': 'Youth Day',
  '2026-08-09': 'National Women’s Day',
  '2026-08-10': 'Public holiday (observed)',
  '2026-09-24': 'Heritage Day',
  '2026-12-16': 'Day of Reconciliation',
  '2026-12-25': 'Christmas Day',
  '2026-12-26': 'Day of Goodwill',
  '2026-12-28': 'Public holiday (observed)',
};

export const isPublicHoliday = (date) => Boolean(PUBLIC_HOLIDAYS_2026[format(date, 'yyyy-MM-dd')]);
export const holidayName = (date) => PUBLIC_HOLIDAYS_2026[format(date, 'yyyy-MM-dd')] || '';

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seeded(value) {
  let x = value >>> 0;
  return () => {
    x += 0x6D2B79F5;
    let t = x;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(items, random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Generates a stable 2–3-shifts-per-week schedule for a student assistant.
 * The same student number always receives the same schedule, while different
 * student numbers receive different patterns. Public holidays and Sundays
 * are never scheduled.
 */
export function generateStudentSchedule(studentNumber = 'SA-2024-8842', year = 2026) {
  const random = seeded(hashString(`${studentNumber}-${year}`));
  const result = {};
  let cursor = new Date(year, 0, 1);

  while (cursor.getFullYear() === year) {
    const weekStart = startOfWeek(cursor, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 6 }, (_, index) => addDays(weekStart, index));
    const available = weekDays.filter((day) => day.getFullYear() === year && !isPublicHoliday(day));
    const shiftCount = 2 + (Math.floor(random() * 2));
    const chosen = shuffle(available, random).slice(0, shiftCount);

    chosen.forEach((day) => {
      const key = format(day, 'yyyy-MM-dd');
      const afternoon = random() >= 0.5;
      result[key] = {
        date: key,
        time: afternoon ? '12:00 PM – 04:00 PM' : '08:00 AM – 12:00 PM',
        shift: afternoon ? 'Afternoon' : 'Morning',
      };
    });

    cursor = addDays(weekStart, 7);
  }

  return result;
}

export function getStudentShift(date, studentNumber) {
  if (isPublicHoliday(date)) return null;
  return generateStudentSchedule(studentNumber, date.getFullYear())[format(date, 'yyyy-MM-dd')] || null;
}

export function isSunday(date) {
  return date.getDay() === 0;
}

export function isBlockedCalendarDay(date, blockedDates = []) {
  const key = format(date, 'yyyy-MM-dd');
  return isPublicHoliday(date) || isSunday(date) || blockedDates.includes(key);
}

export function sameCalendarDate(a, b) {
  return a && b ? isSameDay(a, b) : false;
}

export function parseDateRangeKeys(dateRange) {
  if (!dateRange) return [];
  const matches = String(dateRange).match(/[A-Z][a-z]{2} \d{1,2}, \d{4}/g);
  if (!matches) return [];
  const keys = [];
  matches.forEach((value) => {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) keys.push(format(date, 'yyyy-MM-dd'));
  });
  if (keys.length === 2) {
    const start = new Date(`${keys[0]}T00:00:00`);
    const end = new Date(`${keys[1]}T00:00:00`);
    let cursor = start;
    while (cursor <= end) {
      keys.push(format(cursor, 'yyyy-MM-dd'));
      cursor = addDays(cursor, 1);
    }
  }
  return [...new Set(keys)];
}

export function approvedLeaveDates(requests = []) {
  return [...new Set(requests
    .filter((request) => request.status === 'Approved' && !String(request.type || '').toLowerCase().includes('shift swap'))
    .flatMap((request) => parseDateRangeKeys(request.dateRange)))];
}

export function approvedSwapRequests(requests = []) {
  return requests.filter((request) => request.status === 'Approved' && String(request.type || '').toLowerCase().includes('shift swap'));
}
