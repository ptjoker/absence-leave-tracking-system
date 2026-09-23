import { useState, useEffect } from 'react';
import { CalendarDays, Bell, LogOut, LayoutDashboard, Plus, Clock3, User, ClipboardList, UsersRound, BarChart3, RefreshCw, Menu, X, ChevronLeft, ChevronRight, Check, Moon, Sun } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useTheme } from '@/context/ThemeContext';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, endOfMonth, isBefore, startOfDay, isSameMonth } from 'date-fns';
import { PUBLIC_HOLIDAYS_2026, holidayName, isPublicHoliday, isSunday } from '@/lib/schedule';

export const STUDENT = { name: 'Nicholas Mathebula', initials: 'NM', number: 'SA-2024-8842' };
export const SUPERVISOR = { name: 'PS Monta', initials: 'PS' };

export function PortalBrand({ supervisor = false }) {
  return (
    <Link href="/" className="focus-ring flex items-center gap-2 px-2" data-testid="link-portal-brand">
      <img src="/tut-logo.png" alt="TUT logo" className="size-9 rounded-lg object-contain shadow-sm" />
      <span className="leading-none">
        <strong className="block text-[15px] font-bold tracking-[-.02em] text-[#162c4d]">{supervisor ? 'Supervisor Portal' : 'Student Portal'}</strong>
        <span className="mt-1 block text-[9px] font-bold uppercase tracking-[.16em] text-[#c8102e]">ABSENCE AND LEAVE TRACKER</span>
      </span>
    </Link>
  );
}

const studentNav = [
  ['dashboard', 'Dashboard', LayoutDashboard, '/dashboard'],
  ['request', 'Request', Plus, '/dashboard/request'],
  ['history', 'History', Clock3, '/dashboard/history'],
  ['schedule', 'Schedule', CalendarDays, '/dashboard/schedule'],
  ['profile', 'Profile', User, '/profile'],
];
const supervisorNav = [
  ['dashboard', 'Dashboard', LayoutDashboard, '/supervisor'],
  ['calendar', 'Calendar', CalendarDays, '/supervisor/calendar'],
  ['requests', 'Requests', ClipboardList, '/supervisor/requests'],
  ['assistances', 'Student Assistances', UsersRound, '/supervisor/assistances'],
  ['reports', 'Reports', BarChart3, '/supervisor/reports'],
];

export function PortalSidebar({ supervisor = false }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const items = supervisor ? supervisorNav : studentNav;
  const active = (key, href) => key === 'request'
    ? location.startsWith('/dashboard/request') || location.startsWith('/dashboard/shift-swap')
    : location === href;

  return (
    <>
      <button className="fixed left-4 top-4 z-50 rounded-lg bg-white p-2 text-[#24405c] shadow md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
      {mobileOpen && <button className="fixed inset-0 z-40 bg-[#10253f]/25 md:hidden" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col justify-between border-r border-[#e2eaf1] bg-white px-4 py-6 transition-transform md:static md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          <div className="mb-8 flex items-center justify-between">
            <PortalBrand supervisor={supervisor} />
            <button className="rounded p-1 text-[#718196] md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={18} /></button>
          </div>
          <nav className="flex flex-col gap-1">
            {items.map(([key, label, Icon, href]) => (
              <Link key={key} href={href} onClick={() => setMobileOpen(false)} className={`focus-ring flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${active(key, href) ? 'bg-[#e7f1fa] text-[#1f70d0]' : 'text-[#52708b] hover:bg-[#f4f8fb] hover:text-[#286ee5]'}`} data-testid={`link-sidebar-${key}`}>
                <Icon size={18} />{label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-2">
          <button type="button" className="focus-ring flex items-center gap-3 rounded-lg bg-[#eef4fb] px-3 py-2.5 text-sm font-semibold text-[#52708b] hover:bg-[#e5eef8]"><Bell size={18} />Notification</button>
          <button type="button" onClick={() => setShowLogoutConfirm(true)} className="focus-ring flex items-center gap-3 rounded-lg bg-[#1f70d0] px-3 py-2.5 text-sm font-bold text-white hover:bg-[#256fc6]"><LogOut size={18} />Logout</button>
        </div>
      </aside>
            {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-[0_18px_45px_rgba(43,81,119,.25)]">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#fbe4e1] text-[#d05b48]">
              <LogOut size={22} />
            </div>
            <h3 className="serif mt-4 text-center text-2xl text-[#162c4d]">Log out?</h3>
            <p className="mt-2 text-center text-sm text-[#60768c]">
              You'll need to sign in again to access your dashboard.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="focus-ring flex-1 rounded-lg border border-[#cfdee9] bg-white px-4 py-2.5 text-sm font-bold text-[#385570] hover:bg-[#f4f8fb]"
                data-testid="button-cancel-logout"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('session');
                  window.location.href = '/logout-success';
                }}
                className="focus-ring flex-1 rounded-lg bg-[#1f70d0] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#256fc6]"
                data-testid="button-confirm-logout"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function ModeToggle({ size = 'default' }) {
  const { darkMode, toggleDarkMode } = useTheme();
  const compact = size === 'compact';
  return (
    <button
      type="button"
      onClick={toggleDarkMode}
      aria-pressed={darkMode}
      className={`focus-ring inline-flex items-center gap-2 rounded-lg font-semibold text-[#385570] transition-colors hover:text-[#286ee5] ${compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'}`}
      data-testid="button-change-mode"
    >
      {darkMode ? <Sun size={compact ? 14 : 16} /> : <Moon size={compact ? 14 : 16} />}
      Change mode <span className="font-bold text-[#f0b323]">· {darkMode ? 'Light' : 'Dark'}</span>
    </button>
  );
}

export function PortalTopbar({ supervisor = false }) {
  const stored = typeof window !== 'undefined' ? localStorage.getItem('session') : null;
  const session = stored ? JSON.parse(stored) : null;
  const user = session?.user || {};
  const firstName = user.first_name || 'User';
  const lastName = user.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'U';
  const email = user.email || '';
  return (
    <header className="flex h-[70px] items-center justify-between border-b border-[#e2eaf1] bg-white px-5 md:px-8">
      <ModeToggle size="compact" />
      <div className="flex items-center gap-3">
        <span className="text-right leading-tight">
          <strong className="block text-sm font-bold text-[#162c4d]">{fullName}</strong>
          <span className="block text-xs text-[#7890a4]">{supervisor ? 'Supervisor' : 'Student Assist'}</span>
        </span>
        <Link href={supervisor ? '/supervisor' : '/profile'} aria-label={supervisor ? 'Supervisor profile' : 'Open profile'} className="focus-ring relative grid size-9 place-items-center rounded-full bg-[#1f70d0] text-sm font-bold text-white">{initials}<span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-white bg-[#22b78b]" /></Link>
      </div>
    </header>
  );
}

export function PortalShell({ children, supervisor = false, className = '' }) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      const raw = localStorage.getItem('session');
      if (!raw) {
        window.location.href = '/login';
        return false;
      }
      try {
        const s = JSON.parse(raw);
        const isExpired = s.expires_at && (s.expires_at * 1000 < Date.now());
        if (isExpired) {
          localStorage.removeItem('session');
          window.location.href = '/login';
          return false;
        }
      } catch {
        localStorage.removeItem('session');
        window.location.href = '/login';
        return false;
      }
      return true;
    };

    checkAuth();

    const onPageShow = (e) => {
      if (e.persisted) checkAuth();
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  const stored = localStorage.getItem('session');
  if (!stored) return null;

  return <div className={`min-h-[100dvh] bg-[#90bddb] ${className}`}><div className="flex min-h-[100dvh]"><PortalSidebar supervisor={supervisor} /><div className="min-w-0 flex-1"><PortalTopbar supervisor={supervisor} />{children}</div></div></div>;
}

export function StatusBadge({ status }) {
  const styles = { Approved: 'bg-[#e3f7ec] text-[#19885d]', Pending: 'bg-[#fff0d8] text-[#f2aa00]', Rejected: 'bg-[#fbe4e1] text-[#d05b48]' };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] || 'bg-[#eef4fb] text-[#52708b]'}`}>{status}</span>;
}

export function FieldLabel({ children, required = false, icon }) {
  return <span className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#385570]">{icon}{children}{required && <em className="not-italic text-[#d05b48]">*</em>}</span>;
}

export function DatePicker({ value, onChange, range = false, label, error, id, helper, blockedDates = [], showHolidayLegend = true }) {
  const [open, setOpen] = useState(false);
  const today = startOfDay(new Date());
  const monthStart = startOfDay(new Date(today.getFullYear(), today.getMonth(), 1));
  const monthEnd = endOfMonth(today);
  const blocked = new Set(blockedDates || []);
  const disabled = (date) => {
    const day = startOfDay(date);
    const key = format(day, 'yyyy-MM-dd');
    if (isBefore(day, today) || day > monthEnd) return true;
    if (isPublicHoliday(day) || isSunday(day) || blocked.has(key)) return true;
    if (range && value?.from && !isSameMonth(day, value.from)) return true;
    return false;
  };
  const display = range
    ? value?.from ? `${format(value.from, 'MMM d, yyyy')}${value.to ? ` – ${format(value.to, 'MMM d, yyyy')}` : ''}` : ''
    : value ? format(value, 'MMM d, yyyy') : '';

  const selectDate = (next) => {
    if (!next) return;
    if (range && next?.from && next?.to && !isSameMonth(next.from, next.to)) {
      onChange({ from: next.from, to: undefined });
      return;
    }
    onChange(next);
    if (!range || next?.to) setOpen(false);
  };

  return <div>
    {label && <FieldLabel required icon={<CalendarDays size={14} className="text-[#8aa0b2]" />}>{label}</FieldLabel>}
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button id={id} type="button" className={`focus-ring flex w-full items-center justify-between rounded-lg border bg-[#fbfdfe] px-3.5 py-3 text-left text-sm outline-none ${error ? 'border-[#d05b48]' : 'border-[#cfdee9] hover:border-[#9cc0dd]'}`} aria-label={label || 'Select date'}>
          <span className={display ? 'text-[#243e5b]' : 'text-[#000000]'}>{display || (range ? 'Select dates in this month' : 'Select a date')}</span><CalendarDays size={18} className="shrink-0 text-[#000000]" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="date-picker-popover w-[min(40vw,680px)] min-w-[430px] p-4">
        <Calendar
          mode={range ? 'range' : 'single'}
          selected={value}
          onSelect={selectDate}
          defaultMonth={monthStart}
          startMonth={monthStart}
          endMonth={monthEnd}
          disabled={disabled}
          modifiers={{ holiday: (date) => isPublicHoliday(date), blocked: (date) => blocked.has(format(startOfDay(date), 'yyyy-MM-dd')) }}
          modifiersClassNames={{ holiday: 'calendar-holiday', blocked: 'calendar-blocked' }}
          initialFocus
        />
        <div className="mt-3 grid gap-2 border-t border-[#e2eaf1] px-2 pt-3 text-sm font-semibold text-black sm:grid-cols-2">
          {showHolidayLegend && <span className="flex items-center gap-2"><span className="size-4 rounded border border-[#2c9b62] bg-[#d9f3e3]" />Green box - Holiday</span>}
          <span className="flex items-center gap-2"><span className="size-4 rounded bg-[#d9dde2]" />Unavailable / approved</span>
        </div>
        <p className="mt-2 px-2 text-sm font-semibold text-black">Sundays and public holidays cannot be selected. {range ? 'Both dates must be in the same month.' : ''}</p>
        {Object.keys(PUBLIC_HOLIDAYS_2026).some((key) => key.startsWith(format(today, 'yyyy-'))) && <p className="mt-1 px-2 text-xs font-bold text-[#2c7d4e]">Public holidays are shown in green and are unavailable for leave, swaps and shifts.</p>}
      </PopoverContent>
    </Popover>
    {helper && <p className="mt-1.5 text-sm italic text-black">{helper}</p>}
    {error && <p className="mt-1.5 text-sm font-medium text-[#c54f43]">{error}</p>}
  </div>;
}
export function SuggestionBox({ title, suggestions }) {
  return <div className="mt-2 rounded-lg border border-[#d8e4ed] bg-[#f4f8fb] px-3.5 py-3"><p className="text-[10px] font-bold uppercase tracking-[.08em] text-[#718196]">Suggested text</p><p className="mt-1 text-xs leading-5 text-[#5f7185]">{suggestions.join(' · ')}</p></div>;
}

export function BackButton({ href, children = 'Back' }) {
  return <Link href={href} className="focus-ring mb-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.08em] text-[#24405c] hover:text-[#1f70d0]"><ChevronLeft size={15} />{children}</Link>;
}
