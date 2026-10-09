import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Plus,
  RefreshCw,
  ShieldCheck,
  User,
  X,
  Save,
  Megaphone,
  FileText,
  Download,
  Search,
  Users,
} from 'lucide-react';
import { PortalShell } from '@/components/portal/PortalComponents';
import { useNotifications } from '@/context/NotificationsContext';
import { useRequests } from '@/context/RequestsContext';
import { declareInstitutionalClosure, removeInstitutionalClosure, useStrikeDays } from '@/lib/strikes';
import { institutionalStrikeNotification } from '@/lib/notifications';
import { isPublicHoliday, isSunday, approvedSwapRequests, parseDateRangeKeys } from '@/lib/schedule';
import { useTimetables, formatFileSize } from '@/lib/timetables';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// A small palette of distinct, accessible colors.
// Each student gets a stable color based on a hash of their UUID.
const STUDENT_COLORS = [
  { bg: 'bg-[#dbeafe]', text: 'text-[#1e40af]', dot: 'bg-[#2563eb]' },
  { bg: 'bg-[#fce7f3]', text: 'text-[#9d174d]', dot: 'bg-[#db2777]' },
  { bg: 'bg-[#dcfce7]', text: 'text-[#166534]', dot: 'bg-[#16a34a]' },
  { bg: 'bg-[#fef3c7]', text: 'text-[#92400e]', dot: 'bg-[#d97706]' },
  { bg: 'bg-[#e0e7ff]', text: 'text-[#3730a3]', dot: 'bg-[#4f46e5]' },
  { bg: 'bg-[#ffe4e6]', text: 'text-[#9f1239]', dot: 'bg-[#e11d48]' },
  { bg: 'bg-[#ccfbf1]', text: 'text-[#115e59]', dot: 'bg-[#0d9488]' },
  { bg: 'bg-[#f3e8ff]', text: 'text-[#6b21a8]', dot: 'bg-[#9333ea]' },
];

function colorForStudent(userId) {
  if (!userId) return STUDENT_COLORS[0];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return STUDENT_COLORS[Math.abs(hash) % STUDENT_COLORS.length];
}

function ymd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildCalendarGrid(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startWeekday = first.getDay(); // 0 = Sun
  const daysInMonth = last.getDate();

  const cells = [];

  // Leading days from previous month
  const prevMonthLast = new Date(year, month, 0).getDate();
  for (let i = startWeekday - 1; i >= 0; i--) {
    const day = prevMonthLast - i;
    const d = new Date(year, month - 1, day);
    cells.push({ date: d, inMonth: false });
  }

  // Current month
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    cells.push({ date: d, inMonth: true });
  }

  // Trailing days to fill the last week
  while (cells.length % 7 !== 0) {
    const lastCell = cells[cells.length - 1].date;
    const d = new Date(lastCell);
    d.setDate(d.getDate() + 1);
    cells.push({ date: d, inMonth: false });
  }

  return cells;
}

function StatCard({ label, value, accent = 'bg-[#1f70d0]' }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-[#f4f8fb] p-3.5">
      <span className={`h-7 w-1 rounded-full ${accent}`} />
      <div>
        <p className="mono text-[8px] font-bold uppercase tracking-[.06em] text-[#8ca0b2]">{label}</p>
        <p className="serif mt-0.5 text-lg text-[#10253f]">{value}</p>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [shifts, setShifts] = useState([]);
  const { requests } = useRequests();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [students, setStudents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    user_id: '',
    shift_date: '',
    shift_time: 'Morning',
    role: 'iCenter',
    location: 'Main Desk',
    notes: '',
  });
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const strikeDays = useStrikeDays();
  const { push } = useNotifications();
  const [strikeDialog, setStrikeDialog] = useState(false);
  const [strikeReason, setStrikeReason] = useState('');
  const [closureType, setClosureType] = useState('Strike');
  const timetables = useTimetables();
  const [timetableDialog, setTimetableDialog] = useState(false);
  const [timetableSearch, setTimetableSearch] = useState('');
  const [activeTimetable, setActiveTimetable] = useState(null);
  const timetableList = useMemo(() => {
    const q = timetableSearch.trim().toLowerCase();
    return Object.values(timetables)
      .filter((t) => !q || `${t.name} ${t.studentNumber}`.toLowerCase().includes(q))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [timetables, timetableSearch]);
  const recentTimetables = useMemo(
    () => Object.values(timetables).sort((a, b) => String(b.uploadedAt).localeCompare(String(a.uploadedAt))).slice(0, 3),
    [timetables],
  );
  const openTimetable = (t) => { setTimetableSearch(''); setActiveTimetable(t); setTimetableDialog(true); };
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('timetables') === '1') {
      setTimetableSearch('');
      setActiveTimetable(null);
      setTimetableDialog(true);
    }
  }, []);
  const openTimetables = () => { setTimetableSearch(''); setActiveTimetable(null); setTimetableDialog(true); };

  const loadShifts = async () => {
    setLoading(true);
    setError('');
    try {
      const raw = localStorage.getItem('session');
      const session = raw ? JSON.parse(raw) : null;
      if (!session?.access_token) {
        setError('Not authenticated');
        return;
      }
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/shifts`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not load shifts');
        return;
      }
      setShifts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Load shifts error:', err);
      setError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
  }, []);

    // Fetch students once so the form has a roster to choose from.
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const raw = localStorage.getItem('session');
        const session = raw ? JSON.parse(raw) : null;
        if (!session?.access_token) return;
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/assistants`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setStudents(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Load students error:', err);
      }
    };
    loadStudents();
  }, []);

  const openForm = (presetDate) => {
    setForm({
      user_id: '',
      shift_date: presetDate || ymd(selectedDate),
      shift_time: 'Morning',
      role: 'iCenter',
      location: 'Main Desk',
      notes: '',
    });
    setFormError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setFormError('');
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.user_id) return setFormError('Please select a student.');
    if (!form.shift_date) return setFormError('Please pick a date.');
    if (!form.shift_time) return setFormError('Please select a shift time.');
    const selected = new Date(`${form.shift_date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selected < today) return setFormError('Shifts cannot be assigned on past dates.');
    if (isSunday(selected)) return setFormError('Shifts cannot be assigned on Sundays.');
    if (isPublicHoliday(selected)) return setFormError('Shifts cannot be assigned on public holidays.');
    if ((shiftsByDate[form.shift_date] || []).some((shift) => shift.userId === form.user_id)) return setFormError('This student already has a shift assigned on that date.');
    const [start_time, end_time] = form.shift_time === 'Morning' ? ['08:00', '12:00'] : ['12:00', '16:00'];

    setSaving(true);
    try {
      const raw = localStorage.getItem('session');
      const session = raw ? JSON.parse(raw) : null;
      if (!session?.access_token) {
        setFormError('Not authenticated');
        return;
      }
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/shifts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ user_id: form.user_id, shift_date: form.shift_date, start_time, end_time, role: form.role, location: form.location, notes: form.notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Could not create shift');
        return;
      }
      setShowForm(false);
      // Refresh shifts so the new one appears immediately.
      await loadShifts();
      // Auto-navigate to the month of the newly created shift.
      const [y, m] = form.shift_date.split('-').map(Number);
      setMonthDate(new Date(y, m - 1, 1));
      setSelectedDate(new Date(y, m - 1, Number(form.shift_date.split('-')[2])));
    } catch (err) {
      console.error('Create shift error:', err);
      setFormError('Could not reach the server.');
    } finally {
      setSaving(false);
    }
  };

  const shiftsByDate = useMemo(() => {
    const map = {};
    shifts.forEach((s) => {
      if (!map[s.shiftDate]) map[s.shiftDate] = [];
      map[s.shiftDate].push(s);
    });
    return map;
  }, [shifts]);

  const cells = useMemo(() => buildCalendarGrid(monthDate), [monthDate]);
  const selectedKey = ymd(selectedDate);
  const approvedSwaps = useMemo(() => approvedSwapRequests(requests), [requests]);
  const swapDateKeys = useMemo(() => {
    const to = new Set(); const from = new Set();
    approvedSwaps.forEach((r) => {
      parseDateRangeKeys(r.dateRange).forEach((k) => to.add(k));
      const match = `${r.detail || ''} ${r.reason || ''}`.match(/Swap from (.+?) to (.+?) with (.+?)(?:\.|$)/i);
      if (match) { const d = new Date(match[1]); if (!Number.isNaN(d.getTime())) from.add(ymd(d)); }
    });
    return { to, from };
  }, [approvedSwaps]);
  const selectedShifts = shiftsByDate[selectedKey] || [];

  const todayKey = ymd(new Date());
  const selectedStrike = strikeDays[selectedKey];
  const selectedIsPast = selectedKey < todayKey;
  const selectedIsNonWorking = isSunday(selectedDate) || isPublicHoliday(selectedDate);
  const canDeclareStrike = !selectedIsPast && !selectedIsNonWorking;

  const confirmDeclareStrike = (e) => {
    e.preventDefault();
    declareInstitutionalClosure(selectedKey, closureType, strikeReason);
    push(institutionalStrikeNotification(selectedKey, strikeReason.trim(), false, closureType));
    setStrikeDialog(false);
    setStrikeReason('');
  };

  const cancelStrike = () => {
    removeInstitutionalClosure(selectedKey);
    push(institutionalStrikeNotification(selectedKey, '', true));
  };
  const monthLabel = monthDate.toLocaleString('en-GB', { month: 'long', year: 'numeric' });

  const prevMonth = () => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1));
  const nextMonth = () => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1));
  const goToday = () => {
    const now = new Date();
    setMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  };

  // Summary stats
  const totalShifts = shifts.length;
  const uniqueStudents = new Set(shifts.map((s) => s.userId)).size;
  const upcomingShifts = shifts.filter((s) => s.shiftDate >= todayKey).length;

  // Legend (unique students with colors)
  const legend = useMemo(() => {
    const seen = new Map();
    shifts.forEach((s) => {
      if (!seen.has(s.userId)) {
        seen.set(s.userId, {
          userId: s.userId,
          name: s.studentName,
          color: colorForStudent(s.userId),
        });
      }
    });
    return Array.from(seen.values()).slice(0, 6); // cap at 6 for legend
  }, [shifts]);

  return (
    <PortalShell supervisor>
      <main className="px-5 py-7 md:px-8 md:py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="serif text-4xl text-[#10253f]">Master Schedule</h1>
            <p className="mt-2 max-w-xl text-sm text-[#3d5a76]">
              Manage every student assistant's shifts from a single monthly view. Each student has a unique color.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={loadShifts}
              disabled={loading}
              className="focus-ring flex items-center gap-2 rounded-lg border border-[#dce8f2] bg-white px-4 py-2.5 text-sm font-semibold text-[#385570] shadow-sm hover:bg-[#f4f8fb] disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          <button
            type="button"
            onClick={() => openForm()}
            className="focus-ring flex items-center gap-2 rounded-lg bg-[#1f70d0] px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_#1555aa] hover:bg-[#256fc6]"
            data-testid="button-new-event"
          >
            <Plus size={15} />
            New Shift
          </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-[#fbe4e1] px-4 py-2.5 text-sm font-semibold text-[#d05b48]">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <StatCard label="Total Shifts" value={totalShifts} />
          <StatCard label="Active Assistants" value={uniqueStudents} accent="bg-[#19885d]" />
          <StatCard label="Upcoming" value={upcomingShifts} accent="bg-[#f2aa00]" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_.42fr]">
          {/* Calendar */}
          <div className="rounded-xl bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-[#1f70d0] text-white">
                  <CalendarDays size={18} />
                </span>
                <div>
                  <p className="serif text-xl text-[#10253f]">{monthLabel}</p>
                  <p className="text-xs text-[#7890a4]">Library Resource Unit</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="focus-ring grid size-9 place-items-center rounded-lg border border-[#e2eaf1] text-[#52708b] hover:bg-[#f4f8fb]"
                  aria-label="Previous month"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={goToday}
                  className="focus-ring mono rounded-lg border border-[#e2eaf1] px-3 py-2 text-xs font-bold uppercase tracking-[.06em] text-[#385570] hover:bg-[#f4f8fb]"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="focus-ring grid size-9 place-items-center rounded-lg border border-[#e2eaf1] text-[#52708b] hover:bg-[#f4f8fb]"
                  aria-label="Next month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-lg border border-[#e2eaf1]">
              <div className="grid grid-cols-7 border-b border-[#e2eaf1] bg-[#f4f8fb]">
                {WEEKDAYS.map((label) => (
                  <div
                    key={label}
                    className="mono py-2 text-center text-[10px] font-bold uppercase tracking-[.08em] text-[#8ca0b2]"
                  >
                    {label}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 border-t border-[#e2eaf1]">
                {cells.map((cell, index) => {
                  const key = ymd(cell.date);
                  const dayShifts = shiftsByDate[key] || [];
                  const isSelected = key === selectedKey;
                  const isToday = key === todayKey;
                  const isStrike = Boolean(strikeDays[key]);
                  const isHoliday = isPublicHoliday(cell.date);
                  const isSundayDay = isSunday(cell.date);
                  const isPastDay = key < todayKey;
                  const isSwapTo = swapDateKeys.to.has(key);
                  const isSwapFrom = swapDateKeys.from.has(key);
                  const overflowCount = dayShifts.length > 2 ? dayShifts.length - 2 : 0;

                  return (
                    <button
                      key={`${key}-${index}`}
                      type="button"
                      onClick={() => setSelectedDate(cell.date)}
                      className={`focus-ring flex min-h-[104px] flex-col gap-1.5 border-b border-r border-[#e2eaf1] p-2 text-left transition-colors last:border-r-0 hover:bg-[#f4f8fb] ${
                        !cell.inMonth ? 'calendar-outside-month bg-[#fafbfc] text-[#c3cfd9]' : isStrike ? 'bg-[#d05b48] text-white' : isHoliday ? 'bg-[#d9f3e3] text-[#243e5b]' : isSwapFrom ? 'bg-[#dce9ff] text-[#163f8a]' : isSwapTo ? 'bg-[#d9dde2] text-[#243e5b]' : 'bg-white text-[#243e5b]'
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        <span
                          className={`grid size-6 place-items-center rounded-full text-sm font-semibold ${
                            isSelected
                              ? 'bg-[#1f70d0] text-white'
                              : isToday
                              ? 'bg-[#f2aa00] text-white'
                              : ''
                          }`}
                        >
                          <span className={`calendar-day-number ${isPastDay || isSundayDay ? 'calendar-x-number' : ''}`}>{cell.date.getDate()}</span>
                        </span>
                        {dayShifts.length > 0 && (
                          <span className="mono grid size-4 place-items-center rounded bg-[#eef2f6] text-[9px] font-bold text-[#7890a4]">
                            {dayShifts.length}
                          </span>
                        )}
                      </span>
                      <span className="flex flex-col gap-1">
                        {isStrike && <span className="mono truncate rounded bg-[#d05b48] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[.04em] text-white">Institutional closure</span>}
                        {isHoliday && <span className="mono truncate rounded bg-[#d9f3e3] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#246b45]">Holiday</span>}
                        {isSwapTo && <span className="mono truncate rounded bg-[#d9dde2] px-1.5 py-0.5 text-[9px] font-bold uppercase text-black">Date swapped to</span>}
                        {isSwapFrom && <span className="mono truncate rounded bg-[#dce9ff] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#163f8a]">Date swapped from</span>}
                        {dayShifts.slice(0, 2).map((s) => {
                          const color = colorForStudent(s.userId);
                          return (
                            <span
                              key={s.id}
                              className={`mono truncate rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[.02em] ${color.bg} ${color.text}`}
                            >
                              {s.studentName}
                            </span>
                          );
                        })}
                        {overflowCount > 0 && (
                          <span className="mono text-[9px] font-semibold text-[#8ca0b2]">
                            +{overflowCount} more
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            {legend.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-[#e2eaf1] pt-4">
                <span className="mono text-[10px] font-bold uppercase tracking-[.08em] text-[#8ca0b2]">
                  Legend
                </span>
                {legend.map((s) => (
                  <span key={s.userId} className="flex items-center gap-2 text-xs font-semibold text-[#385570]">
                    <span className={`size-2.5 rounded-full ${s.color.dot}`} />
                    {s.name}
                  </span>
                ))}
                {new Set(shifts.map((s) => s.userId)).size > 6 && (
                  <span className="text-xs italic text-[#8ca0b2]">
                    +{new Set(shifts.map((s) => s.userId)).size - 6} more students
                  </span>
                )}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-4 border-t border-[#e2eaf1] pt-4 text-xs font-semibold text-black"><span><span className="mr-1 inline-block size-3 rounded bg-[#d9f3e3]"/>Green box - Holiday</span><span><span className="mr-1 inline-block size-3 rounded bg-[#d05b48]"/>Red box - Institutional closure</span><span><span className="mr-1 inline-block size-3 rounded bg-[#d9dde2]"/>Grey box - date swapped to</span><span><span className="mr-1 inline-block size-3 rounded border border-[#2b67c9] bg-[#dce9ff]"/>Blue box - date swapped from</span></div>
          </div>

          {/* Side panel — selected day */}
          <div className="flex flex-col gap-5">
            <div className="rounded-xl bg-white p-5">
              <p className="serif text-2xl leading-tight text-[#10253f]">
                {selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p className="mt-1 text-xs text-[#8ca0b2]">
                {selectedShifts.length} shift{selectedShifts.length === 1 ? '' : 's'} scheduled
              </p>

              {selectedStrike ? (
                <div className="mt-4 rounded-xl border border-[#e9c7c2] bg-[#fdecea] p-4" data-testid="strike-day-banner">
                  <p className="flex items-center gap-2 text-sm font-bold text-[#8f3a2d]">
                    <Megaphone size={15} /> Institutional closure{selectedStrike.closureType ? ` · ${selectedStrike.closureType}` : ''}
                  </p>
                  {selectedStrike.reason && <p className="mt-1 text-xs leading-5 text-[#8f3a2d]">{selectedStrike.reason}</p>}
                  <button
                    type="button"
                    onClick={cancelStrike}
                    className="focus-ring mt-3 rounded-lg border border-[#d05b48] bg-white px-3 py-1.5 text-xs font-bold text-[#d05b48] hover:bg-[#fbe4e1]"
                    data-testid="button-cancel-strike-day"
                  >
                    Remove closure declaration
                  </button>
                </div>
              ) : (
                <div className="mt-4">
                  <button
                    type="button"
                    disabled={!canDeclareStrike}
                    onClick={() => { setStrikeReason(''); setClosureType('Strike'); setStrikeDialog(true); }}
                    className="focus-ring flex w-full items-center justify-center gap-2 rounded-lg border border-[#d05b48] bg-white px-3 py-2 text-xs font-bold text-[#d05b48] hover:bg-[#fbe4e1] disabled:cursor-not-allowed disabled:opacity-50"
                    data-testid="button-declare-strike-day"
                  >
                    <Megaphone size={14} /> Declare institutional closure
                  </button>
                  {!canDeclareStrike && (
                    <p className="mt-1.5 text-[11px] text-[#8ca0b2]">
                      {selectedIsPast ? 'Past dates cannot be declared an institutional closure.' : 'Sundays and public holidays are already non-working days.'}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 flex flex-col gap-3">
                {selectedShifts.length === 0 ? (
                  <p className="rounded-lg bg-[#f4f8fb] px-4 py-6 text-center text-xs text-[#8ca0b2]">
                    No shifts scheduled for this date.
                  </p>
                ) : (
                  selectedShifts.map((s) => {
                    const color = colorForStudent(s.userId);
                    return (
                      <div key={s.id} className="flex gap-3 rounded-xl border border-[#e2eaf1] bg-white p-4">
                        <span className={`w-1 shrink-0 rounded-full ${color.dot}`} />
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={`mono rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.06em] ${color.bg} ${color.text}`}
                            >
                              {s.studentName}
                            </span>
                          </div>
                          {s.role && (
                            <p className="mt-2 text-sm font-bold text-[#162c4d]">{s.role}</p>
                          )}
                          <p className="mono mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-[#7890a4]">
                            <Clock3 size={11} />
                            {s.startTime} – {s.endTime}
                          </p>
                          {s.location && (
                            <p className="mono mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-[#7890a4]">
                              <MapPin size={11} />
                              {s.location}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="rounded-xl bg-[#eef8f2] p-5">
              <p className="flex items-center gap-2 text-sm font-bold text-[#10253f]">
                <ShieldCheck size={16} className="text-[#19885d]" />
                Scheduling Tips
              </p>
              <ul className="mt-2 space-y-2 text-xs leading-5 text-[#385570] dark-readable-text">
                <li className="flex gap-2">
                  <User size={12} className="mt-1 shrink-0 text-[#19885d]" />
                  Each student has a unique color for quick scanning.
                </li>
                <li className="flex gap-2">
                  <CalendarDays size={12} className="mt-1 shrink-0 text-[#19885d]" />
                  Days show up to 2 shifts before collapsing.
                </li>
              </ul>
            </div>

            <div className="rounded-xl bg-[#f4f8fb] p-5" data-testid="block-view-student-timetable">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-bold text-[#10253f]">
                  <FileText size={16} className="text-[#1f70d0]" />
                  View Student Timetable
                </p>
                {Object.keys(timetables).length > 0 && (
                  <span className="mono grid h-5 min-w-5 place-items-center rounded bg-[#1f70d0] px-1.5 text-[10px] font-bold text-white">
                    {Object.keys(timetables).length}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs leading-5 text-[#385570]">Recent timetable uploads</p>
              <div className="mt-3 space-y-2">
                {recentTimetables.length === 0 ? (
                  <p className="rounded-lg bg-white px-3 py-4 text-center text-xs text-[#8ca0b2]">No timetables uploaded yet.</p>
                ) : (
                  recentTimetables.map((t) => (
                    <button
                      key={t.studentNumber}
                      type="button"
                      onClick={() => openTimetable(t)}
                      className="focus-ring flex w-full items-center gap-2.5 rounded-lg bg-white p-2.5 text-left hover:bg-[#eef4fa]"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-[#e7f1fa] text-[#1f70d0]"><FileText size={15} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-bold text-[#162c4d]">{t.name}</span>
                        <span className="block truncate text-[11px] text-[#60768c]">
                          {new Date(t.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {t.fileName}
                        </span>
                      </span>
                    </button>
                  ))
                )}
              </div>
              <button
                type="button"
                onClick={openTimetables}
                className="focus-ring mt-3 w-full rounded-lg bg-[#1f70d0] px-3 py-2 text-xs font-bold text-white hover:bg-[#256fc6]"
                data-testid="button-view-student-schedule"
              >
                View all uploads
              </button>
            </div>
          </div>
        </div>
        {timetableDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setTimetableDialog(false); }}>
            <div role="dialog" aria-modal="true" aria-labelledby="timetable-dialog-title" className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white p-6 shadow-[0_18px_45px_rgba(43,81,119,.25)]" data-testid="dialog-student-timetables">
              <div className="flex items-start justify-between">
                <div>
                  <h3 id="timetable-dialog-title" className="serif text-2xl text-[#162c4d]">Student timetables</h3>
                  <p className="mt-1 text-sm text-[#60768c]">Class timetables uploaded by student assistants. Use them to avoid clashes when setting shifts.</p>
                </div>
                <button type="button" onClick={() => setTimetableDialog(false)} className="focus-ring rounded-lg p-1.5 text-[#7890a4] hover:bg-[#f4f8fb]" aria-label="Close"><X size={18} /></button>
              </div>

              {activeTimetable ? (
                <div className="mt-4 flex min-h-0 flex-1 flex-col">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button type="button" onClick={() => setActiveTimetable(null)} className="focus-ring flex items-center gap-1 text-sm font-bold text-[#1f70d0] hover:underline"><ChevronLeft size={16} /> All students</button>
                    <a href={activeTimetable.dataUrl} download={activeTimetable.fileName} className="focus-ring flex items-center gap-1.5 rounded-lg border border-[#cfdee9] px-3 py-1.5 text-xs font-bold text-[#385570] hover:bg-[#f4f8fb]"><Download size={13} /> Download</a>
                  </div>
                  <p className="mt-3 text-sm font-bold text-[#162c4d]">{activeTimetable.name} <span className="font-normal text-[#60768c]">· {activeTimetable.studentNumber}</span></p>
                  <div className="mt-3 min-h-0 flex-1 overflow-auto rounded-lg border border-[#e2eaf1] bg-[#f4f8fb]">
                    {activeTimetable.type === 'application/pdf' ? (
                      <iframe title={`${activeTimetable.name} timetable`} src={activeTimetable.dataUrl} className="h-[65vh] w-full" />
                    ) : (
                      <img src={activeTimetable.dataUrl} alt={`${activeTimetable.name} timetable`} className="mx-auto max-w-full" />
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex min-h-0 flex-1 flex-col">
                  <label className="relative block">
                    <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8ca0b2]" />
                    <input
                      type="text"
                      value={timetableSearch}
                      onChange={(e) => setTimetableSearch(e.target.value)}
                      placeholder="Search by name or student number"
                      className="focus-ring w-full rounded-lg border border-[#cfdee9] bg-[#fbfdfe] py-2.5 pl-9 pr-3 text-sm text-[#243e5b] outline-none focus:border-[#1f70d0]"
                    />
                  </label>
                  <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-auto">
                    {timetableList.length === 0 ? (
                      <div className="rounded-lg bg-[#f4f8fb] px-4 py-10 text-center text-sm text-[#60768c]">
                        <Users size={22} className="mx-auto mb-2 text-[#8ca0b2]" />
                        {Object.keys(timetables).length === 0 ? 'No student has uploaded a timetable yet.' : 'No students match your search.'}
                      </div>
                    ) : timetableList.map((t) => (
                      <div key={t.studentNumber} className="flex items-center gap-3 rounded-xl border border-[#e2eaf1] p-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#e7f1fa] text-[#1f70d0]"><FileText size={18} /></span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-[#162c4d]">{t.name}</p>
                          <p className="truncate text-xs text-[#60768c]">{t.studentNumber} · {t.fileName} · {formatFileSize(t.size)} · Uploaded {new Date(t.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <button type="button" onClick={() => setActiveTimetable(t)} className="focus-ring rounded-lg bg-[#1f70d0] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#256fc6]">View</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {strikeDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setStrikeDialog(false); }}>
            <form onSubmit={confirmDeclareStrike} role="dialog" aria-modal="true" aria-labelledby="strike-dialog-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_18px_45px_rgba(43,81,119,.25)]" data-testid="dialog-declare-strike">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#fbe4e1] text-[#d05b48]"><Megaphone size={22} /></div>
              <h3 id="strike-dialog-title" className="serif mt-4 text-center text-2xl text-[#162c4d]">Declare institutional closure</h3>
              <p className="mt-2 text-center text-sm text-[#60768c]">
                {selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} will be marked as an institutional closure on the calendar, blocked for leave and swap requests, and all student assistants will be notified.
              </p>
              <label htmlFor="closure-type" className="mt-5 block">
                <span className="mb-2 block text-xs font-bold text-[#385570]">Closure type <span className="text-[#d05b48]">*</span></span>
                <select id="closure-type" value={closureType} onChange={(e) => setClosureType(e.target.value)} className="focus-ring w-full rounded-lg border border-[#cfdee9] bg-white px-3.5 py-3 text-sm font-semibold text-black outline-none focus:border-[#1f70d0]">
                  <option value="Strike">Strike</option>
                  <option value="Library closure">Library closure</option>
                </select>
              </label>
              <label htmlFor="strike-reason" className="mt-4 block">
                <span className="mb-2 block text-xs font-bold text-[#385570]">Note for students (optional)</span>
                <textarea
                  id="strike-reason"
                  rows={3}
                  maxLength={200}
                  autoFocus
                  value={strikeReason}
                  onChange={(e) => setStrikeReason(e.target.value)}
                  placeholder="e.g. Campus closed due to the national shutdown."
                  className="focus-ring w-full rounded-lg border border-[#cfdee9] bg-[#fbfdfe] px-3.5 py-3 text-sm text-[#243e5b] outline-none placeholder:text-[#9baebe] focus:border-[#1f70d0]"
                  data-testid="input-strike-reason"
                />
              </label>
              <div className="mt-5 flex gap-3">
                <button type="button" onClick={() => setStrikeDialog(false)} className="focus-ring flex-1 rounded-lg border border-[#cfdee9] bg-white px-4 py-2.5 text-sm font-bold text-[#385570] hover:bg-[#f4f8fb]">Cancel</button>
                <button type="submit" className="focus-ring flex-1 rounded-lg bg-[#d05b48] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#bd4c3a]" data-testid="button-confirm-institutional-closure">Declare closure</button>
              </div>
            </form>
          </div>
        )}
                {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-[0_18px_45px_rgba(43,81,119,.25)]">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="serif text-2xl text-[#162c4d]">Schedule New Shift</h3>
                  <p className="mt-1 text-sm text-[#60768c]">Assign a shift to a student assistant.</p>
                </div>
                <button
                  type="button"
                  onClick={closeForm}
                  className="focus-ring rounded-lg p-1.5 text-[#7890a4] hover:bg-[#f4f8fb]"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={submitForm} className="mt-5 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#385570]">
                    Student Assistant <em className="not-italic text-[#d05b48]">*</em>
                  </label>
                  <select
                    value={form.user_id}
                    onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))}
                    className="focus-ring w-full rounded-lg border border-[#cfdee9] bg-[#fbfdfe] px-3.5 py-3 text-sm text-[#243e5b] outline-none focus:border-[#1f70d0]"
                  >
                    <option value="">Select a student assistant…</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {s.course || 'No department'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#385570]">
                      Date of shift <em className="not-italic text-[#d05b48]">*</em>
                    </label>
                    <input
                      type="date"
                      value={form.shift_date}
                      min={ymd(new Date())}
                      onChange={(e) => setForm((f) => ({ ...f, shift_date: e.target.value }))}
                      className="focus-ring w-full rounded-lg border border-[#cfdee9] bg-[#fbfdfe] px-3.5 py-3 text-sm text-[#243e5b] outline-none focus:border-[#1f70d0]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#385570]">Position</label>
                    <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="focus-ring w-full rounded-lg border border-[#cfdee9] bg-[#fbfdfe] px-3.5 py-3 text-sm text-[#243e5b] outline-none focus:border-[#1f70d0]">
                      <option value="iCenter">iCenter</option>
                      <option value="Circular 2">Circular 2</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#385570]">Shift Time <em className="not-italic text-[#d05b48]">*</em></label>
                    <select value={form.shift_time} onChange={(e) => setForm((f) => ({ ...f, shift_time: e.target.value }))} className="focus-ring w-full rounded-lg border border-[#cfdee9] bg-[#fbfdfe] px-3.5 py-3 text-sm text-[#243e5b] outline-none focus:border-[#1f70d0]">
                      <option value="Morning">Morning [08:00AM - 12:00PM]</option>
                      <option value="Afternoon">Afternoon [12:00PM - 04:00PM]</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#385570]">Duration</label>
                    <input type="text" readOnly value="4 hours" className="w-full rounded-lg border border-[#cfdee9] bg-[#eef4f8] px-3.5 py-3 text-sm font-bold text-black outline-none" />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#385570]">Location</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. Main Desk"
                    className="focus-ring w-full rounded-lg border border-[#cfdee9] bg-[#fbfdfe] px-3.5 py-3 text-sm text-[#243e5b] outline-none focus:border-[#1f70d0]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#385570]">Notes (optional)</label>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Any additional instructions…"
                    className="focus-ring w-full rounded-lg border border-[#cfdee9] bg-[#fbfdfe] px-3.5 py-3 text-sm text-[#243e5b] outline-none focus:border-[#1f70d0]"
                  />
                </div>

                {formError && (
                  <p className="rounded-lg bg-[#fbe4e1] px-3 py-2 text-xs font-semibold text-[#d05b48]">
                    {formError}
                  </p>
                )}

                <div className="flex justify-end gap-3 border-t border-[#e2eaf1] pt-4">
                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    className="focus-ring rounded-lg border border-[#cfdee9] bg-white px-4 py-2.5 text-sm font-bold text-[#385570] hover:bg-[#f4f8fb] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="focus-ring flex items-center gap-2 rounded-lg bg-[#1f70d0] px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_#1555aa] hover:bg-[#256fc6] disabled:opacity-50"
                  >
                    <Save size={15} />
                    {saving ? 'Creating…' : 'Create Shift'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </PortalShell>
  );
}
