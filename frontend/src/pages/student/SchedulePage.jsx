import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { PortalShell } from '@/components/portal/PortalComponents';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

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
  const startWeekday = first.getDay();
  const daysInMonth = last.getDate();

  const cells = [];

  const prevMonthLast = new Date(year, month, 0).getDate();
  for (let i = startWeekday - 1; i >= 0; i--) {
    const day = prevMonthLast - i;
    cells.push({ date: new Date(year, month - 1, day), inMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ date: new Date(year, month, day), inMonth: true });
  }

  while (cells.length % 7 !== 0) {
    const lastCell = cells[cells.length - 1].date;
    const d = new Date(lastCell);
    d.setDate(d.getDate() + 1);
    cells.push({ date: d, inMonth: false });
  }

  return cells;
}

export default function SchedulePage() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());

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
      const res = await fetch('http://localhost:3000/api/shifts', {
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

  // Upcoming summary
  const upcoming = useMemo(
    () => shifts.filter((s) => s.shiftDate >= todayKey),
    [shifts, todayKey]
  );

  const nextShift = upcoming[0];

  return (
    <PortalShell>
      <main className="px-5 py-7 md:px-8 md:py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-3 inline-flex rounded-full bg-[#162c4d] px-3 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-white">
              Student Schedule
            </p>
            <h1 className="serif text-4xl text-[#10253f]">My Work Schedule</h1>
            <p className="mt-2 max-w-xl text-sm text-[#3d5a76]">
              View your assigned shifts. Days with a shift are highlighted — click any day to see the details.
            </p>
          </div>
          <button
            type="button"
            onClick={loadShifts}
            disabled={loading}
            className="focus-ring flex items-center gap-2 rounded-lg border border-[#dce8f2] bg-white px-4 py-2.5 text-sm font-semibold text-[#385570] shadow-sm hover:bg-[#f4f8fb] disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-[#fbe4e1] px-4 py-2.5 text-sm font-semibold text-[#d05b48]">
            {error}
          </div>
        )}

        {/* Summary row */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-[#f4f8fb] p-4">
            <p className="mono text-[10px] font-bold uppercase tracking-[.1em] text-[#7890a4]">
              Total Shifts
            </p>
            <p className="serif mt-1 text-3xl text-[#10253f]">{shifts.length}</p>
          </div>
          <div className="rounded-xl bg-[#f4f8fb] p-4">
            <p className="mono text-[10px] font-bold uppercase tracking-[.1em] text-[#7890a4]">
              Upcoming
            </p>
            <p className="serif mt-1 text-3xl text-[#10253f]">{upcoming.length}</p>
          </div>
          <div className="rounded-xl bg-[#f4f8fb] p-4">
            <p className="mono text-[10px] font-bold uppercase tracking-[.1em] text-[#7890a4]">
              Next Shift
            </p>
            <p className="mt-1 text-sm font-bold text-[#243e5b]">
              {nextShift
                ? `${new Date(nextShift.shiftDate).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                  })} · ${nextShift.startTime}`
                : '—'}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Calendar */}
          <section className="rounded-xl bg-white p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#10253f]">{monthLabel}</h2>
                <p className="text-xs text-[#718196]">Monthly shift calendar</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="rounded-lg border border-[#e2eaf1] bg-white p-2 text-[#52708b] hover:bg-[#f4f8fb]"
                  aria-label="Previous month"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={goToday}
                  className="mono rounded-lg border border-[#e2eaf1] px-3 py-2 text-xs font-bold uppercase tracking-[.06em] text-[#385570] hover:bg-[#f4f8fb]"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="rounded-lg border border-[#e2eaf1] bg-white p-2 text-[#52708b] hover:bg-[#f4f8fb]"
                  aria-label="Next month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-[#dce5ec] bg-[#dce5ec]">
              <div className="col-span-7 grid grid-cols-7 bg-white">
                {WEEKDAYS.map((d) => (
                  <div
                    key={d}
                    className="p-2 text-center text-[10px] font-bold uppercase text-[#8ca0b2]"
                  >
                    {d}
                  </div>
                ))}
              </div>
              {cells.map((cell, index) => {
                const key = ymd(cell.date);
                const hasShift = (shiftsByDate[key] || []).length > 0;
                const isSelected = key === selectedKey;
                const isToday = key === todayKey;

                return (
                  <button
                    key={`${key}-${index}`}
                    type="button"
                    onClick={() => setSelectedDate(cell.date)}
                    className={`min-h-24 bg-white p-2 text-left align-top transition-colors ${
                      !cell.inMonth ? 'bg-[#fafbfc] text-[#c3cfd9]' : 'text-[#385570]'
                    } ${isSelected ? 'ring-2 ring-inset ring-[#1f70d0]' : ''} hover:bg-[#f4f8fb]`}
                  >
                    <span
                      className={`grid size-7 place-items-center rounded-full text-xs font-bold ${
                        isSelected
                          ? 'bg-[#1f70d0] text-white'
                          : isToday
                          ? 'bg-[#f2aa00] text-white'
                          : ''
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>
                    {hasShift && (
                      <span className="mt-3 block rounded-md bg-[#e7f1fa] px-1.5 py-1 text-[9px] font-bold text-[#1f70d0]">
                        Shift
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Side panel */}
          <aside className="space-y-5">
            <div className="rounded-xl bg-white p-5 shadow-[0_3px_8px_rgba(53,91,121,.08)]">
              <div className="flex items-start gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-[#e7f1fa] text-[#1f70d0]">
                  <CalendarDays size={18} />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.08em] text-[#8ca0b2]">
                    Selected day
                  </p>
                  <h2 className="mt-1 font-bold text-[#10253f]">
                    {selectedDate.toLocaleDateString('en-GB', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </h2>
                </div>
              </div>

              {selectedShifts.length ? (
                <div className="mt-5 space-y-3">
                  {selectedShifts.map((s) => (
                    <div key={s.id} className="rounded-lg bg-[#f4f8fb] p-3">
                      <p className="flex items-center gap-2 text-sm font-bold text-[#243e5b]">
                        <Clock3 size={14} />
                        {s.startTime} – {s.endTime}
                      </p>
                      {s.role && (
                        <p className="mt-1 text-xs font-semibold text-[#52708b]">{s.role}</p>
                      )}
                      {s.location && (
                        <p className="mt-1 flex items-center gap-2 text-xs text-[#718196]">
                          <MapPin size={13} />
                          {s.location}
                        </p>
                      )}
                      {s.notes && (
                        <p className="mt-2 rounded bg-white px-2 py-1.5 text-[11px] italic text-[#718196]">
                          {s.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-5 text-sm text-[#718196]">No shift assigned for this date.</p>
              )}
            </div>

            <div className="rounded-xl bg-[#f4f8fb] p-5">
              <p className="text-sm font-bold text-[#10253f]">Schedule notes</p>
              <ul className="mt-3 space-y-3 text-xs leading-5 text-[#5f7185]">
                <li className="flex gap-2">
                  <ShieldCheck size={14} className="mt-0.5 shrink-0 text-[#22b78b]" />
                  Approved leave and swaps are reflected here.
                </li>
                <li className="flex gap-2">
                  <Clock3 size={14} className="mt-0.5 shrink-0 text-[#1f70d0]" />
                  Arrive 10 minutes before your shift starts.
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </PortalShell>
  );
}