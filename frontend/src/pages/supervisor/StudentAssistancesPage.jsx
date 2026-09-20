import { useMemo, useState } from 'react';
import {
    Bell,
    BarChart3,
    CalendarDays,
    ClipboardList,
    LayoutDashboard,
    LogOut,
    Mail,
    Phone,
    Search,
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

const assistants = [
    {
        id: 'sa-1',
        name: 'Hlongwane Jan',
        initials: 'HJ',
        avatarBg: 'bg-[#2f3b52]',
        department: 'Computer Science',
        email: '215324567@tut4life.ac.za',
        phone: '076 432 6578',
        attendance: 94,
        leaveBalance: 6,
        status: 'Active',
    },
    {
        id: 'sa-2',
        name: 'Mathebula Nicholas',
        initials: 'MN',
        avatarBg: 'bg-[#6c8bb8]',
        department: 'Information Technology',
        email: '214801122@tut4life.ac.za',
        phone: '072 118 4432',
        attendance: 88,
        leaveBalance: 3,
        status: 'Active',
    },
    {
        id: 'sa-3',
        name: 'Jiyane Duduzile',
        initials: 'JD',
        avatarBg: 'bg-[#3a3f47]',
        department: 'Faculty of ICT',
        email: '216590234@tut4life.ac.za',
        phone: '081 903 7765',
        attendance: 79,
        leaveBalance: 1,
        status: 'On leave',
    },
    {
        id: 'sa-4',
        name: 'Simphiwe Masanabo',
        initials: 'SM',
        avatarBg: 'bg-[#19885d]',
        department: 'Computer Science',
        email: '213387765@tut4life.ac.za',
        phone: '060 221 9987',
        attendance: 97,
        leaveBalance: 8,
        status: 'Active',
    },
    {
        id: 'sa-5',
        name: 'Mashabela Basetsana',
        initials: 'MB',
        avatarBg: 'bg-[#a0762b]',
        department: 'Information Technology',
        email: '217754432@tut4life.ac.za',
        phone: '079 660 1120',
        attendance: 91,
        leaveBalance: 4,
        status: 'Active',
    },
];

function StudentAssistancesSidebar() {
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

function StudentAssistancesTopbar({ query, onQueryChange }) {
    return (
        <header className="flex h-[70px] items-center justify-between gap-6 border-b border-[#e2eaf1] bg-white px-8">
            <ModeToggle size="compact" />
            <label className="relative block w-full max-w-md" htmlFor="assistants-search">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8aa0b2]" />
                <input
                    id="assistants-search"
                    type="search"
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    placeholder="Search reports or students..."
                    className="focus-ring w-full rounded-lg border border-[#e2eaf1] bg-[#f4f8fb] py-2.5 pl-9 pr-3 text-sm text-[#243e5b] outline-none placeholder:text-[#9baebe] focus:border-[#1f70d0] focus:bg-white"
                    data-testid="input-assistants-search"
                />
            </label>
            <div className="flex shrink-0 items-center gap-5">
                <button type="button" className="focus-ring relative text-[#52708b] hover:text-[#286ee5]" aria-label="Notifications" data-testid="button-topbar-notifications">
                    <Bell size={19} />
                    <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-[#d05b48]" />
                </button>
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
            </div>
        </header>
    );
}

function StatusPill({ status }) {
    const styles = {
        Active: 'bg-[#e3f7ec] text-[#19885d]',
        'On leave': 'bg-[#fff0d8] text-[#f2aa00]',
    };
    return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] ?? 'bg-[#eef4fb] text-[#52708b]'}`}>{status}</span>;
}

function AttendanceBar({ value }) {
    return (
        <div className="w-32">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#52708b]">
                <span>Attendance</span>
                <span className="text-[#1f70d0]">{value}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-[#dce8f2]">
                <div className="h-1.5 rounded-full bg-[#1f70d0]" style={{ width: `${value}%` }} />
            </div>
        </div>
    );
}

function AssistantRow({ assistant }) {
    return (
        <tr className="border-t border-[#e2eaf1] align-top">
            <td className="py-4 pl-6 pr-4">
                <div className="flex items-center gap-3">
                    <span className={`grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${assistant.avatarBg}`}>
                        {assistant.initials}
                    </span>
                    <div>
                        <strong className="block text-sm font-bold text-[#162c4d]">{assistant.name}</strong>
                        <span className="mono text-[10px] font-bold uppercase tracking-[.06em] text-[#8ca0b2]">{assistant.department}</span>
                    </div>
                </div>
            </td>
            <td className="py-4 pr-4">
                <p className="flex items-center gap-1.5 text-xs text-[#52708b]">
                    <Mail size={12} />
                    {assistant.email}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-[#52708b]">
                    <Phone size={12} />
                    {assistant.phone}
                </p>
            </td>
            <td className="py-4 pr-4">
                <AttendanceBar value={assistant.attendance} />
            </td>
            <td className="mono py-4 pr-4 text-xs font-semibold text-[#243e5b]">{assistant.leaveBalance} days</td>
            <td className="py-4 pr-6">
                <StatusPill status={assistant.status} />
            </td>
        </tr>
    );
}

export default function StudentAssistancesPage() {
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const term = query.trim().toLowerCase();
        if (!term) return assistants;
        return assistants.filter(
            (assistant) =>
                assistant.name.toLowerCase().includes(term) ||
                assistant.department.toLowerCase().includes(term) ||
                assistant.email.toLowerCase().includes(term)
        );
    }, [query]);

    const activeCount = assistants.filter((assistant) => assistant.status === 'Active').length;
    const averageAttendance = Math.round(
        assistants.reduce((sum, assistant) => sum + assistant.attendance, 0) / assistants.length
    );

    return (
        <div className="flex min-h-[100dvh] bg-[#90bddb]">
            <StudentAssistancesSidebar />
            <div className="flex-1">
                <StudentAssistancesTopbar query={query} onQueryChange={setQuery} />
                <main className="px-8 py-8">
                    <h1 className="serif text-4xl text-[#10253f]">Student Assistances</h1>
                    <p className="mt-2 max-w-lg text-sm text-[#3d5a76]">Track your department's student assistant roster, contact details, and standing.</p>

                    <div className="mt-6 grid gap-5 sm:grid-cols-3">
                        <div className="rounded-xl bg-[#f4f8fb] p-5">
                            <p className="mono text-[10px] font-bold uppercase tracking-[.1em] text-[#7890a4]">Total Assistants</p>
                            <p className="serif mt-2 text-4xl text-[#10253f]">{assistants.length}</p>
                        </div>
                        <div className="rounded-xl bg-[#f4f8fb] p-5">
                            <p className="mono text-[10px] font-bold uppercase tracking-[.1em] text-[#7890a4]">Currently Active</p>
                            <p className="serif mt-2 text-4xl text-[#10253f]">{activeCount}</p>
                        </div>
                        <div className="rounded-xl bg-[#f4f8fb] p-5">
                            <p className="mono text-[10px] font-bold uppercase tracking-[.1em] text-[#7890a4]">Avg. Attendance</p>
                            <p className="serif mt-2 text-4xl text-[#10253f]">{averageAttendance}%</p>
                        </div>
                    </div>

                    <div className="mt-8 overflow-x-auto rounded-xl bg-[#f4f8fb]">
                        <table className="w-full min-w-[760px] text-left">
                            <thead>
                                <tr className="mono text-[10px] font-bold uppercase tracking-[.08em] text-[#8ca0b2]">
                                    <th className="py-3 pl-6 pr-4 font-bold">Assistant</th>
                                    <th className="py-3 pr-4 font-bold">Contact</th>
                                    <th className="py-3 pr-4 font-bold">Attendance</th>
                                    <th className="py-3 pr-4 font-bold">Leave Balance</th>
                                    <th className="py-3 pr-6 font-bold">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length ? (
                                    filtered.map((assistant) => <AssistantRow key={assistant.id} assistant={assistant} />)
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-sm text-[#7890a4]">
                                            No student assistants match “{query}”.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>
        </div>
    );
}