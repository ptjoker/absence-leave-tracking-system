import { useMemo, useState } from 'react';
import {
    BarChart3,
    Bell,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Filter,
    LayoutDashboard,
    LogOut,
    MoreVertical,
    Plus,
    ShieldCheck,
    UsersRound,
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { ModeToggle } from '@/components/portal/PortalComponents';

// Reuses the same logo asset and "serif"/"mono" type classes as the rest of
// the app (see Brand / Home / DashboardPage / SupervisorDashboard) so this
// page matches the existing visual language rather than introducing a new one.

const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, href: '/supervisor' },
    { key: 'calendar', label: 'Calendar', icon: <CalendarDays size={18} />, href: '/supervisor/calendar' },
    { key: 'requests', label: 'Requests', icon: <ClipboardList size={18} />, href: '/supervisor/requests' },
    { key: 'assistances', label: 'Student Assistances', icon: <UsersRound size={18} />, href: '/supervisor/assistances' },
    { key: 'reports', label: 'Reports', icon: <BarChart3 size={18} />, href: '/supervisor/reports' },
];

const summaryStats = [
    { label: 'Assigned Shifts', value: '342', accent: 'bg-[#1f70d0]' },
    { label: 'Student Hours', value: '90H', accent: 'bg-[#1f70d0]' },
    { label: 'Absences', value: '12', accent: 'bg-[#d05b48]' },
    { label: 'Strike Events', value: '2', accent: 'bg-[#f2aa00]' },
    { label: 'Library Closures', value: '4', accent: 'bg-[#8ca0b2]' },
    { label: 'Weekly Hours', value: '18/19', accent: 'bg-[#19885d]' },
];

const tagStyles = {
    shift: 'bg-[#e7f1fa] text-[#1f70d0]',
    absence: 'bg-[#fbe4e1] text-[#d05b48]',
    closure: 'bg-[#eef2f6] text-[#52708b]',
};

const weekdayLabels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// August 2026 starts on a Saturday; grid begins on the preceding Sunday
// (27 July) and runs six weeks to keep the layout consistent with the mockup.
const calendarWeeks = [
    [
        { day: 26, inMonth: false, tags: [] },
        { day: 27, inMonth: false, tags: [] },
        { day: 28, inMonth: false, tags: [] },
        { day: 29, inMonth: false, tags: [] },
        { day: 30, inMonth: false, tags: [] },
        { day: 31, inMonth: false, tags: [] },
        { day: 1, inMonth: true, tags: [] },
    ],
    [
        { day: 2, inMonth: true, tags: [] },
        { day: 3, inMonth: true, tags: [] },
        { day: 4, inMonth: true, tags: [] },
        { day: 5, inMonth: true, tags: [] },
        { day: 6, inMonth: true, tags: [] },
        { day: 7, inMonth: true, tags: [] },
        { day: 8, inMonth: true, tags: [] },
    ],
    [
        { day: 9, inMonth: true, tags: [] },
        { day: 10, inMonth: true, tags: [] },
        { day: 11, inMonth: true, tags: [] },
        { day: 12, inMonth: true, tags: [] },
        { day: 13, inMonth: true, tags: [] },
        { day: 14, inMonth: true, tags: [] },
        { day: 15, inMonth: true, tags: [] },
    ],
    [
        { day: 16, inMonth: true, tags: [] },
        { day: 17, inMonth: true, tags: [] },
        { day: 18, inMonth: true, tags: [] },
        { day: 19, inMonth: true, tags: [] },
        { day: 20, inMonth: true, tags: [] },
        { day: 21, inMonth: true, tags: [{ label: 'Alex Rivera', type: 'shift' }] },
        { day: 22, inMonth: true, tags: [{ label: 'Alex Rivera', type: 'shift' }, { label: 'Jordan Smith', type: 'shift' }] },
    ],
    [
        { day: 23, inMonth: true, tags: [{ label: 'Weekly Maintenance', type: 'closure' }] },
        { day: 24, inMonth: true, tags: [{ label: 'Alex Rivera', type: 'shift' }] },
        { day: 25, inMonth: true, tags: [{ label: 'Alex Rivera', type: 'shift' }, { label: 'Jordan Smith', type: 'shift' }] },
        { day: 26, inMonth: true, tags: [{ label: 'Alex Rivera', type: 'shift' }] },
        { day: 27, inMonth: true, tags: [{ label: 'Alex Rivera', type: 'shift' }] },
        { day: 28, inMonth: true, tags: [{ label: 'Alex Rivera', type: 'shift' }, { label: 'Jordan Smith', type: 'shift' }] },
        { day: 29, inMonth: true, tags: [{ label: 'Alex Rivera', type: 'shift' }] },
    ],
    [
        { day: 30, inMonth: true, tags: [{ label: 'Weekly Maintenance', type: 'closure' }] },
        { day: 31, inMonth: true, tags: [{ label: 'Alex Rivera', type: 'shift' }, { label: 'Jordan Smith', type: 'shift' }] },
        { day: 1, inMonth: false, tags: [{ label: 'Alex Rivera', type: 'shift' }] },
        { day: 2, inMonth: false, tags: [{ label: 'Alex Rivera', type: 'shift' }] },
        { day: 3, inMonth: false, tags: [{ label: 'Alex Rivera', type: 'shift' }, { label: 'Jordan Smith', type: 'shift' }] },
        { day: 4, inMonth: false, tags: [{ label: 'Alex Rivera', type: 'shift' }] },
        { day: 5, inMonth: false, tags: [{ label: 'Alex Rivera', type: 'shift' }, { label: 'Medical Leave', type: 'absence' }] },
    ],
];

const scheduleByDate = {
    '31': [
        {
            id: 'shift-1',
            title: 'Library Assistant',
            person: 'Alex Rivera',
            time: '09:00 AM – 01:00 PM',
            place: 'Main Desk',
        },
        {
            id: 'shift-2',
            title: 'Resource Management',
            person: 'Jordan Smith',
            time: '02:00 PM – 05:00 PM',
            place: 'Archive Room',
        },
    ],
};

function CalendarSidebar() {
    const [location] = useLocation();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    return (
        <aside className="flex h-[100dvh] w-64 shrink-0 flex-col justify-between border-r border-[#e2eaf1] bg-white px-4 py-6">
            <div>
                <Link href="/" className="focus-ring mb-8 flex items-center gap-3 px-2" data-testid="link-sidebar-brand">
                    <img src="/tut-logo.png" alt="TUT logo" className="size-10 rounded-[5px] object-contain shadow-sm" />
                    <span className="leading-none">
                        <strong className="block text-[15px] font-bold tracking-[-.02em] text-[#162c4d]">Supervisor</strong>
                        <span className="mt-1 block text-[9px] font-bold uppercase tracking-[.18em] text-[#6b809a]">Leave tracker</span>
                    </span>
                </Link>
                <nav className="flex flex-col gap-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.key}
                            href={item.href}
                            className={`focus-ring flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${location === item.href
                                    ? 'bg-[#e7f1fa] text-[#1f70d0]'
                                    : 'text-[#52708b] hover:bg-[#f4f8fb] hover:text-[#286ee5]'
                                }`}
                            data-testid={`link-sidebar-${item.key}`}
                        >
                            {item.icon}
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>
            <div className="flex flex-col gap-2">
                <button
                    type="button"
                    className="focus-ring flex items-center gap-3 rounded-lg bg-[#eef4fb] px-3 py-2.5 text-sm font-semibold text-[#52708b] hover:bg-[#e5eef8]"
                    data-testid="button-notification"
                >
                    <Bell size={18} />
                    Notification
                </button>
                <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="focus-ring flex items-center gap-3 rounded-lg bg-[#1f70d0] px-3 py-2.5 text-sm font-bold text-white hover:bg-[#256fc6]"
                data-testid="button-logout"
                >
                <LogOut size={18} />
                Logout
                </button>
            </div>
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
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('session');
                  window.location.href = '/login';
                }}
                className="focus-ring flex-1 rounded-lg bg-[#1f70d0] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#256fc6]"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
        </aside>
    );
}

function CalendarTopbar() {
    return (
        <header className="flex h-[70px] items-center justify-between gap-6 border-b border-[#e2eaf1] bg-white px-8">
            <ModeToggle size="compact" />
            <nav className="mono flex items-center gap-2 text-xs font-bold uppercase tracking-[.08em] text-[#7890a4]" aria-label="Breadcrumb">
                <Link href="/supervisor" className="hover:text-[#1f70d0]">Dashboard</Link>
                <span>/</span>
                <span className="text-[#243e5b]">Calendar</span>
            </nav>
            <div className="flex items-center gap-3">
                <span className="text-right leading-tight">
                    <strong className="block text-sm font-bold text-[#162c4d]">PS Monta</strong>
                    <span className="mono block text-[10px] font-bold uppercase tracking-[.1em] text-[#7890a4]">Supervisor</span>
                </span>
                <span className="relative">
                    <span className="grid size-9 place-items-center rounded-full bg-[#dce5fb] text-sm font-bold text-[#1f70d0]">PS</span>
                    <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-white bg-[#22b78b]" />
                </span>
            </div>
        </header>
    );
}

function Hero() {
    return (
        <div className="relative overflow-hidden rounded-xl bg-[#1a2432] px-7 py-7 text-white">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.08),transparent_55%)]" />
            <div className="relative">
                <span className="mono inline-flex rounded bg-[#1f70d0] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.1em]">
                    Administrative Control
                </span>
                <h1 className="serif mt-3 max-w-xl text-3xl leading-[1.05] sm:text-[40px]">Library Staff Master Schedule</h1>
                <p className="mt-3 max-w-xl text-[13px] leading-5 text-slate-300">
                    Oversee all student assistant assignments, manage institutional events, and handle absences from a central 30-day
                    dashboard.
                </p>
                <p className="mt-5 flex items-baseline gap-2">
                    <span className="serif text-2xl">18</span>
                    <span className="mono text-[9px] font-bold uppercase tracking-[.1em] text-slate-300">Active assistants</span>
                </p>
            </div>
        </div>
    );
}

function StatStrip() {
    return (
        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {summaryStats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-2.5 rounded-xl bg-[#f4f8fb] p-3.5">
                    <span className={`h-7 w-1 rounded-full ${stat.accent}`} />
                    <div>
                        <p className="mono text-[8px] font-bold uppercase tracking-[.06em] text-[#8ca0b2]">{stat.label}</p>
                        <p className="serif mt-0.5 text-lg text-[#10253f]">{stat.value}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function DayCell({ cell, isSelected, onSelect }) {
    const overflowCount = cell.tags.length > 2 ? cell.tags.length - 2 : 0;
    return (
        <button
            type="button"
            onClick={() => onSelect(cell)}
            className={`focus-ring flex min-h-[104px] flex-col gap-1.5 border-b border-r border-[#e2eaf1] bg-white p-2 text-left transition-colors last:border-r-0 hover:bg-[#f4f8fb] ${!cell.inMonth ? 'text-[#c3cfd9]' : 'text-[#243e5b]'
                }`}
            data-testid={`button-day-${cell.day}-${cell.inMonth ? 'current' : 'other'}`}
        >
            <span className="flex items-center justify-between">
                <span
                    className={`grid size-6 place-items-center rounded-full text-sm font-semibold ${isSelected ? 'bg-[#1f70d0] text-white' : ''
                        }`}
                >
                    {cell.day}
                </span>
                {cell.tags.length > 0 && (
                    <span className="mono grid size-4 place-items-center rounded bg-[#eef2f6] text-[9px] font-bold text-[#7890a4]">
                        {cell.tags.length}
                    </span>
                )}
            </span>
            <span className="flex flex-col gap-1">
                {cell.tags.slice(0, 2).map((tag) => (
                    <span
                        key={tag.label}
                        className={`mono truncate rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[.02em] ${tagStyles[tag.type]}`}
                    >
                        {tag.label}
                    </span>
                ))}
                {overflowCount > 0 && <span className="mono text-[9px] font-semibold text-[#8ca0b2]">+{overflowCount} more</span>}
            </span>
        </button>
    );
}

function ShiftCard({ shift }) {
    return (
        <div className="flex gap-3 rounded-xl border border-[#e2eaf1] bg-white p-4">
            <span className="w-1 shrink-0 rounded-full bg-[#1f70d0]" />
            <div className="flex-1">
                <div className="flex items-start justify-between">
                    <span className="mono rounded bg-[#eef2f6] px-2 py-1 text-[9px] font-bold uppercase tracking-[.06em] text-[#52708b]">
                        Shift
                    </span>
                    <button type="button" className="focus-ring text-[#9aabb9] hover:text-[#52708b]" aria-label="Shift options" data-testid={`button-shift-menu-${shift.id}`}>
                        <MoreVertical size={16} />
                    </button>
                </div>
                <p className="mt-3 text-sm font-bold text-[#162c4d]">{shift.title}</p>
                <p className="mt-2 flex items-center gap-2 text-xs text-[#52708b]">
                    <span className="grid size-6 place-items-center rounded-full bg-[#eef2f6] text-[#8ca0b2]">
                        <UsersRound size={12} />
                    </span>
                    {shift.person}
                </p>
                <p className="mono mt-3 flex items-center justify-between text-[10px] font-semibold text-[#7890a4]">
                    <span>{shift.time}</span>
                    <span>{shift.place}</span>
                </p>
            </div>
        </div>
    );
}

export default function CalendarPage() {
    const [selected, setSelected] = useState({ day: 31, inMonth: true });
    const [panelTab, setPanelTab] = useState('schedule');

    const shifts = useMemo(() => scheduleByDate[String(selected.day)] ?? [], [selected]);

    return (
        <div className="flex min-h-[100dvh] bg-[#90bddb]">
            <CalendarSidebar />
            <div className="flex-1">
                <CalendarTopbar />
                <main className="px-8 py-8">
                    <Hero />
                    <StatStrip />

                    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_.42fr]">
                        <div className="rounded-xl bg-white p-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="grid size-10 place-items-center rounded-lg bg-[#1f70d0] text-white">
                                        <CalendarDays size={18} />
                                    </span>
                                    <div>
                                        <p className="serif text-xl text-[#10253f]">August 2026</p>
                                        <p className="text-xs text-[#7890a4]">Central Library Resource Unit</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button type="button" className="focus-ring grid size-9 place-items-center rounded-lg border border-[#e2eaf1] text-[#52708b] hover:bg-[#f4f8fb]" aria-label="Previous month" data-testid="button-month-prev">
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button type="button" className="focus-ring mono rounded-lg border border-[#e2eaf1] px-3 py-2 text-xs font-bold uppercase tracking-[.06em] text-[#385570] hover:bg-[#f4f8fb]" data-testid="button-month-today">
                                        Today
                                    </button>
                                    <button type="button" className="focus-ring grid size-9 place-items-center rounded-lg border border-[#e2eaf1] text-[#52708b] hover:bg-[#f4f8fb]" aria-label="Next month" data-testid="button-month-next">
                                        <ChevronRight size={16} />
                                    </button>
                                    <button type="button" className="focus-ring flex items-center gap-2 rounded-lg bg-[#1f70d0] px-4 py-2 text-xs font-bold text-white hover:bg-[#256fc6]" data-testid="button-new-event">
                                        <Plus size={15} />
                                        New Event
                                    </button>
                                </div>
                            </div>

                            <div className="mt-5 overflow-hidden rounded-lg border border-[#e2eaf1]">
                                <div className="grid grid-cols-7 border-b border-[#e2eaf1] bg-[#f4f8fb]">
                                    {weekdayLabels.map((label) => (
                                        <div key={label} className="mono py-2 text-center text-[10px] font-bold uppercase tracking-[.08em] text-[#8ca0b2]">
                                            {label}
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 border-t border-[#e2eaf1]">
                                    {calendarWeeks.flat().map((cell, index) => (
                                        <DayCell
                                            key={`${cell.day}-${index}`}
                                            cell={cell}
                                            isSelected={cell.inMonth && cell.day === selected.day}
                                            onSelect={setSelected}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-[#e2eaf1] pt-5">
                                <div className="flex flex-wrap items-center gap-5 text-xs font-semibold text-[#52708b]">
                                    <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-[#1f70d0]" />Assigned Shifts</span>
                                    <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-[#d05b48]" />Student Absences</span>
                                    <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-[#f2aa00]" />Strikes</span>
                                    <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-[#8ca0b2]" />Library Closures</span>
                                </div>
                                <div className="flex gap-3">
                                    <button type="button" className="focus-ring flex items-center gap-2 rounded-lg border border-[#e2eaf1] px-3.5 py-2 text-xs font-semibold text-[#385570] hover:bg-[#f4f8fb]" data-testid="button-filters">
                                        <Filter size={14} />
                                        Filters
                                    </button>
                                    <button type="button" className="focus-ring flex items-center gap-2 rounded-lg border border-[#e2eaf1] px-3.5 py-2 text-xs font-semibold text-[#385570] hover:bg-[#f4f8fb]" data-testid="button-view-options">
                                        <CalendarDays size={14} />
                                        View Options
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-5">
                            <div className="rounded-xl bg-white p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <p className="serif text-2xl leading-tight text-[#10253f]">
                                        Aug<br />{selected.day},<br />2026
                                    </p>
                                    <div className="flex rounded-lg bg-[#f4f8fb] p-1">
                                        <button
                                            type="button"
                                            onClick={() => setPanelTab('schedule')}
                                            className={`focus-ring rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${panelTab === 'schedule' ? 'bg-white text-[#1f70d0] shadow-sm' : 'text-[#8ca0b2]'
                                                }`}
                                            data-testid="button-panel-schedule"
                                        >
                                            Schedule
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPanelTab('manage')}
                                            className={`focus-ring rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${panelTab === 'manage' ? 'bg-white text-[#1f70d0] shadow-sm' : 'text-[#8ca0b2]'
                                                }`}
                                            data-testid="button-panel-manage"
                                        >
                                            Manage
                                        </button>
                                    </div>
                                </div>
                                <p className="mt-2 text-xs text-[#8ca0b2]">Manage events for this date</p>

                                <div className="mt-4 flex flex-col gap-3">
                                    {panelTab === 'schedule' ? (
                                        shifts.length ? (
                                            shifts.map((shift) => <ShiftCard key={shift.id} shift={shift} />)
                                        ) : (
                                            <p className="rounded-lg bg-[#f4f8fb] px-4 py-6 text-center text-xs text-[#8ca0b2]">
                                                No shifts scheduled for this date.
                                            </p>
                                        )
                                    ) : (
                                        <p className="rounded-lg bg-[#f4f8fb] px-4 py-6 text-center text-xs text-[#8ca0b2]">
                                            Editing tools for this date go here.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-xl bg-[#eef8f2] p-5">
                                <p className="flex items-center gap-2 text-sm font-bold text-[#10253f]">
                                    <ShieldCheck size={16} className="text-[#19885d]" />
                                    Operational Check
                                </p>
                                <p className="mt-2 text-xs leading-5 text-[#385570]">
                                    Total staffing for next week is at 92% capacity. Consider assigning 3 additional shifts to cover peak hours
                                    on Wednesday.
                                </p>
                                <button type="button" className="focus-ring mt-3 flex items-center gap-1 text-xs font-bold text-[#1f70d0] hover:text-[#1555aa]" data-testid="button-view-staffing-report">
                                    View Staffing Report
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}