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
} from 'lucide-react';
import { PortalShell } from '@/components/portal/PortalComponents';
import { apiFetch } from '@/lib/api';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [students, setStudents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    user_id: '',
    shift_date: '',
    start_time: '08:00 AM',
    end_time: '04:00 PM',
    role: 'Library Assistant',
    location: 'Main Desk',
    notes: '',
  });
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const loadShifts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/shifts');
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
        const res = await apiFetch('/api/assistants');
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
      start_time: '08:00 AM',
      end_time: '04:00 PM',
      role: 'Library Assistant',
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
    if (!form.start_time || !form.end_time) return setFormError('Start and end time are required.');

        setSaving(true);
    try {
      const res = await apiFetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
  const selectedShifts = shiftsByDate[selectedKey] || [];

  const todayKey = ymd(new Date());
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
                  const overflowCount = dayShifts.length > 2 ? dayShifts.length - 2 : 0;

                  return (
                    <button
                      key={`${key}-${index}`}
                      type="button"
                      onClick={() => setSelectedDate(cell.date)}
                      className={`focus-ring flex min-h-[104px] flex-col gap-1.5 border-b border-r border-[#e2eaf1] p-2 text-left transition-colors last:border-r-0 hover:bg-[#f4f8fb] ${
                        !cell.inMonth ? 'bg-[#fafbfc] text-[#c3cfd9]' : 'bg-white text-[#243e5b]'
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
                          {cell.date.getDate()}
                        </span>
                        {dayShifts.length > 0 && (
                          <span className="mono grid size-4 place-items-center rounded bg-[#eef2f6] text-[9px] font-bold text-[#7890a4]">
                            {dayShifts.length}
                          </span>
                        )}
                      </span>
                      <span className="flex flex-col gap-1">
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
              <ul className="mt-2 space-y-2 text-xs leading-5 text-[#385570]">
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
          </div>
        </div>
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
                    Student <em className="not-italic text-[#d05b48]">*</em>
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
                      Date <em className="not-italic text-[#d05b48]">*</em>
                    </label>
                    <input
                      type="date"
                      value={form.shift_date}
                      onChange={(e) => setForm((f) => ({ ...f, shift_date: e.target.value }))}
                      className="focus-ring w-full rounded-lg border border-[#cfdee9] bg-[#fbfdfe] px-3.5 py-3 text-sm text-[#243e5b] outline-none focus:border-[#1f70d0]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#385570]">Role</label>
                    <input
                      type="text"
                      value={form.role}
                      onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                      placeholder="e.g. Library Assistant"
                      className="focus-ring w-full rounded-lg border border-[#cfdee9] bg-[#fbfdfe] px-3.5 py-3 text-sm text-[#243e5b] outline-none focus:border-[#1f70d0]"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#385570]">
                      Start time <em className="not-italic text-[#d05b48]">*</em>
                    </label>
                    <input
                      type="text"
                      value={form.start_time}
                      onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                      placeholder="e.g. 08:00 AM"
                      className="focus-ring w-full rounded-lg border border-[#cfdee9] bg-[#fbfdfe] px-3.5 py-3 text-sm text-[#243e5b] outline-none focus:border-[#1f70d0]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#385570]">
                      End time <em className="not-italic text-[#d05b48]">*</em>
                    </label>
                    <input
                      type="text"
                      value={form.end_time}
                      onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                      placeholder="e.g. 04:00 PM"
                      className="focus-ring w-full rounded-lg border border-[#cfdee9] bg-[#fbfdfe] px-3.5 py-3 text-sm text-[#243e5b] outline-none focus:border-[#1f70d0]"
                    />
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