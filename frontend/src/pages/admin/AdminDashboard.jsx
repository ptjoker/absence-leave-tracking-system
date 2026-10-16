import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, ChevronLeft, ChevronRight, Clock3, Download, Eye, Filter, Grid2X2, LockKeyhole, LogOut, MapPin, Monitor, Pencil, Plus, RefreshCw, Search, ShieldCheck, Smartphone, Trash2, TrendingUp, Users, UserRound, UserRoundCog, X } from 'lucide-react';
import { useLocation } from 'wouter';
import { format, subDays } from 'date-fns';
import { apiFetch } from '@/lib/api';
import { clearSession, getSession } from '@/lib/session';
import { PortalBrand } from '@/components/portal/PortalComponents';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Grid2X2 },
  { id: 'user-management', label: 'User Management', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

const sampleSessions = [
  { name: 'Hlongwane Jan', device: 'Chrome on macOS', ip: '192.168.1.42', location: 'eMalahleni, SA', status: 'Current', icon: Monitor },
  { name: 'Mathebula Nicholas', device: 'Safari on iPhone 15', ip: '172.26.25.1', location: 'eMalahleni, SA', status: 'Active', icon: Smartphone },
  { name: 'Jiyane Duduzile', device: 'Firefox on Windows 11', ip: '10.0.0.5', location: 'eMalahleni, SA', status: 'Active', icon: Monitor },
  { name: 'Segomotso Lencwe', device: 'Edge on Windows 10', ip: '192.168.1.102', location: 'eMalahleni, SA', status: 'Active', icon: Monitor },
  { name: 'Shoba Thabiso', device: 'Chrome on Android', ip: '172.29.10.4', location: 'eMalahleni, SA', status: 'Active', icon: Smartphone },
];

const sampleActivity = [
  { title: 'Leave request approved', detail: 'Sick leave request · Student assistant', user: 'By: Admin (System)', time: '12 mins ago', severity: 'Info' },
  { title: 'Shift swap requested', detail: 'Shift swap submitted for review', user: 'By: Jiyane Duduzile · Student assistant', time: '45 mins ago', severity: 'Info' },
  { title: 'Profile updated', detail: 'Contact details changed', user: 'By: Segomotso Lencwe · Student assistant', time: '2 hours ago', severity: 'Low' },
  { title: 'Leave request submitted', detail: 'Exam leave · Pending review', user: 'By: Mathebula Nicholas · Student assistant', time: '4 hours ago', severity: 'Info' },
  { title: 'Strike recorded', detail: 'Attendance policy · Review required', user: 'By: Supervisor account', time: '6 hours ago', severity: 'High' },
];

const sampleTraffic = [
  { day: 'Mon', requests: 4500, errors: 90 },
  { day: 'Tue', requests: 5200, errors: 140 },
  { day: 'Wed', requests: 4800, errors: 110 },
  { day: 'Thu', requests: 6300, errors: 210 },
  { day: 'Fri', requests: 6500, errors: 170 },
  { day: 'Sat', requests: 3200, errors: 70 },
  { day: 'Sun', requests: 2800, errors: 55 },
];

const trafficScale = [8000, 6000, 4000, 2000, 0];

function readAdminSession() {
  return getSession();
}

function MetricCard({ label, value, note, icon: Icon, tint }) {
  return (
    <article className="rounded-xl border border-[#e6eaee] bg-white p-5 shadow-[0_2px_8px_rgba(30,48,66,.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.08em] text-[#75808c]">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#202a34]">{value}</p>
        </div>
        <span className={`grid size-9 place-items-center rounded-lg ${tint}`}><Icon size={18} /></span>
      </div>
      <p className="mt-3 text-xs text-[#8b96a1]">{note}</p>
    </article>
  );
}

function formatDate(value) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : format(date, 'd MMM yyyy');
}

function escapeCsv(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

const emptyAccountForm = {
  first_name: '',
  last_name: '',
  student_number: '',
  course: '',
  level_of_study: '',
  student_email: '',
  cell_number: '',
  personal_email: '',
  password: '',
};

function accountEndpoint(account, suffix = '') {
  const role = account.apiRole || account;
  return `/api/admin/${role === 'student' ? 'assistants' : 'supervisors'}${account.id ? `/${encodeURIComponent(account.id)}` : ''}${suffix}`;
}

function AccountField({ label, name, value, onChange, type = 'text', required = false, readOnly = false, autoComplete }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-[#526171]">{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        readOnly={readOnly}
        autoComplete={autoComplete}
        className={`focus-ring w-full rounded-md border border-[#d7dde3] px-3 py-2.5 text-sm text-[#344252] outline-none focus:border-[#1473e6] ${readOnly ? 'bg-[#f4f6f8] text-[#82909d]' : 'bg-white'}`}
      />
    </label>
  );
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [session, setSession] = useState(readAdminSession);
  const [overview, setOverview] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [accountDialog, setAccountDialog] = useState(null);
  const [accountForm, setAccountForm] = useState(emptyAccountForm);
  const [accountError, setAccountError] = useState('');
  const [accountNotice, setAccountNotice] = useState('');
  const [accountBusy, setAccountBusy] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session?.access_token || session.user?.role !== 'admin') {
      setLocation('/admin/login');
    }
  }, [session, setLocation]);

  const loadDashboard = useCallback(async (quiet = false) => {
    if (!session?.access_token || session.user?.role !== 'admin') return;
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const paths = ['/api/admin/overview', '/api/admin/assistants', '/api/admin/supervisors'];
      const responses = await Promise.all(paths.map((path) => apiFetch(path)));
      const data = await Promise.all(responses.map(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || `Could not load administrator data (${response.status}).`);
        return body;
      }));
      setOverview(data[0].overview || null);
      const assistants = (data[1].assistants || []).map((account) => ({ ...account, apiRole: 'student', role: 'Student assistant', email: account.studentEmail }));
      const supervisors = (data[2].supervisors || []).map((account) => ({ ...account, apiRole: 'supervisor', role: 'Supervisor', email: account.studentEmail }));
      setAccounts([...assistants, ...supervisors].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))));
    } catch (requestError) {
      console.error('Load administrator dashboard error:', requestError);
      setError(requestError.message || 'Could not load administrator dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => {
    if (session?.access_token && session.user?.role === 'admin') loadDashboard();
  }, [loadDashboard, session]);

  const filteredAccounts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return accounts.filter((account) => (roleFilter === 'all' || account.apiRole === roleFilter) && (
      !query || [
        account.name, account.email, account.role, account.studentNumber, account.course,
        account.levelOfStudy, account.cellNumber, account.personalEmail,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    ));
  }, [accounts, roleFilter, search]);

  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(filteredAccounts.length / pageSize));
  const visibleAccounts = filteredAccounts.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  const openAccountDialog = (mode, account = null) => {
    setAccountError('');
    setAccountNotice('');
    setAccountDialog({ mode, account, role: 'student' });
    setAccountForm(account ? {
      ...emptyAccountForm,
      first_name: account.firstName || '',
      last_name: account.lastName || '',
      student_number: account.studentNumber || '',
      course: account.course || '',
      level_of_study: account.levelOfStudy || '',
      student_email: account.email || '',
      cell_number: account.cellNumber || '',
      personal_email: account.personalEmail || '',
    } : { ...emptyAccountForm });
  };

  const handleAccountFormChange = (event) => {
    const { name, value } = event.target;
    setAccountForm((current) => ({ ...current, [name]: value }));
  };

  const sendAdminRequest = async (path, options = {}) => {
    const response = await apiFetch(path, options);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `Account request failed (${response.status}).`);
    return body;
  };

  const handleSaveAccount = async (event) => {
    event.preventDefault();
    if (!accountDialog) return;
    setAccountBusy(true);
    setAccountError('');
    const { mode, account } = accountDialog;
    const isStudent = account?.apiRole === 'student' || accountDialog.role === 'student';
    const endpointRole = account?.apiRole || accountDialog.role;
    const fields = {
      first_name: accountForm.first_name.trim(),
      last_name: accountForm.last_name.trim(),
      cell_number: accountForm.cell_number.trim(),
      personal_email: accountForm.personal_email.trim(),
    };
    if (isStudent) {
      Object.assign(fields, {
        student_number: accountForm.student_number.trim(),
        course: accountForm.course.trim(),
        level_of_study: accountForm.level_of_study.trim(),
      });
    }

    if (mode === 'create') {
      Object.assign(fields, {
        student_email: accountForm.student_email.trim(),
        password: accountForm.password,
      });
    }

    try {
      const path = accountEndpoint(mode === 'create' ? endpointRole : account);
      await sendAdminRequest(path, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      setAccountDialog(null);
      setAccountNotice(mode === 'create' ? 'User account created.' : 'User account updated.');
      await loadDashboard(true);
    } catch (requestError) {
      console.error('Save administrator-managed account error:', requestError);
      setAccountError(requestError.message || 'Could not save this account.');
    } finally {
      setAccountBusy(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (accountDialog?.mode !== 'delete') return;
    setAccountBusy(true);
    setAccountError('');
    try {
      await sendAdminRequest(accountEndpoint(accountDialog.account), { method: 'DELETE' });
      setAccountDialog(null);
      setAccountNotice('User account deleted.');
      await loadDashboard(true);
    } catch (requestError) {
      console.error('Delete administrator-managed account error:', requestError);
      setAccountError(requestError.message || 'Could not delete this account.');
    } finally {
      setAccountBusy(false);
    }
  };

  const handleExport = () => {
    const rows = [
      ['Name', 'Role', 'Email', 'Created'],
      ...filteredAccounts.map((account) => [account.name, account.role, account.email, formatDate(account.createdAt)]),
    ];
    const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'icenter-user-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const accountActivity = useMemo(() => {
    const now = new Date();
    const days = Array.from({ length: 7 }, (_, index) => {
      const day = subDays(now, 6 - index);
      const key = format(day, 'yyyy-MM-dd');
      return { key, label: format(day, 'EEE'), count: accounts.filter((account) => account.createdAt && format(new Date(account.createdAt), 'yyyy-MM-dd') === key).length };
    });
    return days;
  }, [accounts]);

  const handleLogout = () => {
    clearSession();
    setSession(null);
    window.dispatchEvent(new Event('storage'));
    setLocation('/logout-success');
  };

  const jumpTo = (id) => {
    setActiveSection(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!session?.access_token || session.user?.role !== 'admin') return null;

  const totalUsers = (overview?.totalStudentAssistants || 0) + (overview?.totalSupervisors || 0);
  const maxDailyCount = Math.max(1, ...accountActivity.map((day) => day.count));
  const firstName = session.user.first_name || 'Administrator';
  const trafficPoints = sampleTraffic.map((item, index) => ({
    x: 62 + index * 100,
    requestY: 222 - (item.requests / 8000) * 190,
    errorY: 222 - (item.errors / 8000) * 190,
  }));
  const requestLine = trafficPoints.map(({ x, requestY }) => `${x},${requestY}`).join(' ');
  const errorLine = trafficPoints.map(({ x, errorY }) => `${x},${errorY}`).join(' ');
  const requestArea = `62,222 ${requestLine} 662,222`;

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-[#202a34]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-[#e1e5e9] bg-[#eceef0] px-4 py-5 lg:flex">
        <div className="border-b border-[#dce1e5] px-2 pb-5">
          <PortalBrand />
        </div>
        <nav className="mt-5 space-y-1" aria-label="Administrator navigation">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => jumpTo(id)} className={`focus-ring flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold transition-colors ${activeSection === id ? 'bg-[#dce1e6] text-[#202a34]' : 'text-[#687481] hover:bg-white/70 hover:text-[#202a34]'}`}>
              <Icon size={16} />{label}
            </button>
          ))}
        </nav>
        <div className="mt-auto border-t border-[#dce1e5] pt-4">
          <button type="button" onClick={() => setShowLogoutConfirm(true)} className="focus-ring flex w-full items-center gap-3 rounded-lg bg-[#1f70d0] px-3 py-2.5 text-sm font-bold text-white hover:bg-[#256fc6]"><LogOut size={18} />Logout</button>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex min-h-[62px] items-center justify-between gap-4 border-b border-[#e1e5e9] bg-white/95 px-5 backdrop-blur sm:px-8">
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs text-[#697582] sm:inline">Signed in as <strong className="text-[#344252]">{firstName}</strong></span>
            <button type="button" onClick={() => loadDashboard(true)} disabled={refreshing || loading} className="focus-ring inline-flex items-center gap-2 rounded-md border border-[#d7dde3] bg-white px-3 py-2 text-xs font-semibold text-[#3f4b58] hover:bg-[#f6f8fa] disabled:opacity-60">
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />{refreshing ? 'Refreshing…' : 'Refresh data'}
            </button>
            <button type="button" onClick={handleExport} disabled={!accounts.length} className="focus-ring inline-flex items-center gap-2 rounded-md bg-[#1473e6] px-3 py-2 text-xs font-bold text-white hover:bg-[#095fc5] disabled:cursor-not-allowed disabled:opacity-50">
              <Download size={14} />Export report
            </button>
          </div>
        </header>
        <nav className="flex gap-2 overflow-x-auto border-b border-[#e1e5e9] bg-white px-4 py-2 lg:hidden" aria-label="Administrator navigation">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => jumpTo(id)} className={`focus-ring inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold ${activeSection === id ? 'bg-[#e9f2ff] text-[#1473e6]' : 'text-[#687481] hover:bg-[#f4f6f8]'}`}>
              <Icon size={14} />{label}
            </button>
          ))}
        </nav>

        <main className="mx-auto max-w-[1500px] space-y-6 p-5 sm:p-8">
          {activeSection === 'dashboard' && <section id="dashboard">
            <div className="mb-5">
              <p className="text-xs font-semibold text-[#75808c]">Dashboard　›　Overview</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#202a34]">Dashboard Overview</h1>
              <p className="mt-1 text-sm text-[#77828e]">Account metrics and administrative monitoring.</p>
            </div>
            {error && <div role="alert" className="mb-5 rounded-lg border border-[#f1c6c3] bg-[#fff1f0] px-4 py-3 text-sm font-semibold text-[#b84233]">{error}</div>}
            {loading ? <div className="rounded-xl border border-[#e6eaee] bg-white px-5 py-10 text-center text-sm text-[#75808c]">Loading administrator metrics…</div> : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Total users" value={totalUsers.toLocaleString()} note="Student assistants and supervisors" icon={Users} tint="bg-[#eaf3ff] text-[#1473e6]" />
                <MetricCard label="Active accounts" value={(overview?.activeAccounts || 0).toLocaleString()} note="Accounts currently enabled" icon={UserRound} tint="bg-[#e8f8f0] text-[#15966a]" />
                <MetricCard label="Student assistants" value={(overview?.totalStudentAssistants || 0).toLocaleString()} note={`${overview?.activeStudentAssistants || 0} active`} icon={UserRoundCog} tint="bg-[#f1ecff] text-[#7450c8]" />
                <MetricCard label="Supervisors" value={(overview?.totalSupervisors || 0).toLocaleString()} note={`${overview?.activeSupervisors || 0} active`} icon={ShieldCheck} tint="bg-[#fff5e5] text-[#c17a13]" />
              </div>
            )}
            <div className="mt-5">
              <p className="mb-4 inline-flex items-center rounded-md border border-[#f2d9a6] bg-[#fff8e8] px-2.5 py-1.5 text-xs font-semibold text-[#946200]">UI preview · Sample data only, not live system activity</p>
              <div className="grid gap-5 xl:grid-cols-[1.3fr_.9fr]">
                <article className="rounded-xl border border-[#e6eaee] bg-white shadow-[0_2px_8px_rgba(30,48,66,.04)]">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0f2] px-5 py-4">
                    <div><h2 className="text-base font-bold text-[#202a34]">Active user sessions</h2><p className="mt-1 text-xs text-[#82909d]">A preview of signed-in accounts and devices</p></div>
                    <span className="rounded-md bg-[#eef5ff] px-2.5 py-1 text-[10px] font-bold text-[#1473e6]">12 sessions · sample</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[620px] text-left">
                      <thead><tr className="border-b border-[#edf0f2] text-[10px] font-bold uppercase tracking-wide text-[#82909d]"><th className="px-5 py-3">User</th><th className="px-3 py-3">Device / IP</th><th className="px-3 py-3">Location</th><th className="px-3 py-3">Status</th></tr></thead>
                      <tbody>
                        {sampleSessions.map(({ name, device, ip, location, status, icon: DeviceIcon }) => (
                          <tr key={name} className="border-b border-[#f0f2f4] last:border-0">
                            <td className="px-5 py-3 text-xs font-semibold text-[#344252]">{name}</td>
                            <td className="px-3 py-3"><span className="flex items-center gap-1.5 text-xs text-[#526171]"><DeviceIcon size={13} />{device}</span><span className="mt-1 block font-mono text-[10px] text-[#929daa]">{ip}</span></td>
                            <td className="px-3 py-3 text-xs text-[#687583]"><span className="flex items-center gap-1"><MapPin size={12} />{location}</span></td>
                            <td className="px-3 py-3"><span className={`rounded px-2 py-1 text-[9px] font-bold uppercase ${status === 'Current' ? 'bg-[#eaf3ff] text-[#1473e6]' : 'bg-[#e8f8f0] text-[#18875f]'}`}>{status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="border-t border-[#edf0f2] px-5 py-3 text-center text-xs font-semibold text-[#82909d]">Session management will be available when connected to the reporting service.</div>
                </article>
                <article className="rounded-xl border border-[#e6eaee] bg-white shadow-[0_2px_8px_rgba(30,48,66,.04)]">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0f2] px-5 py-4">
                    <div><h2 className="text-base font-bold text-[#202a34]">All user activity</h2><p className="mt-1 text-xs text-[#82909d]">Requests, account changes, and administrative actions</p></div>
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-[#f1f3f5] px-2 py-1 text-[10px] font-bold text-[#687583]"><span className="size-1.5 rounded-full bg-[#9aa5b1]" />Preview</span>
                  </div>
                  <ol className="divide-y divide-[#f0f2f4] px-5">
                    {sampleActivity.map(({ title, detail, user, time, severity }) => (
                      <li key={title + user} className="flex gap-3 py-4">
                        <span className="mt-1.5 size-2 shrink-0 rounded-sm bg-[#398de3]" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                            <h3 className="text-xs font-bold text-[#344252]">{title}</h3>
                            <span className="whitespace-nowrap text-[10px] text-[#929daa]">{time}</span>
                          </div>
                          <p className="mt-1 text-[11px] text-[#687583]">{detail}</p>
                          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[10px] text-[#82909d]">{user}</span>
                            <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${severity === 'High' ? 'bg-[#fff0ee] text-[#c34d42]' : severity === 'Low' ? 'bg-[#f1f3f5] text-[#687583]' : 'bg-[#eef5ff] text-[#1473e6]'}`}>{severity}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <div className="border-t border-[#edf0f2] px-5 py-3 text-center text-xs font-semibold text-[#82909d]">Complete activity history requires backend event logging.</div>
                </article>
              </div>
            </div>
          </section>}

          {activeSection === 'analytics' && <section id="analytics" className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-[#75808c]">Dashboard　›　Analytics</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#202a34]">System Analytics</h1>
              <p className="mt-1 text-sm text-[#77828e]">Usage overview and system traffic for the past seven days.</p>
              <p className="mt-3 inline-flex items-center rounded-md border border-[#f2d9a6] bg-[#fff8e8] px-2.5 py-1.5 text-xs font-semibold text-[#946200]">UI preview · All analytics figures below are sample data</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[
                { label: 'Total users', value: '12,482', change: '+12.5%', note: 'Accounts across platform', icon: Users, tint: 'bg-[#eaf3ff] text-[#1473e6]' },
                { label: 'Active sessions', value: '1,204', change: '+3.2%', note: 'Users currently authenticated', icon: Activity, tint: 'bg-[#e8f8f0] text-[#15966a]' },
                { label: 'Pending approvals', value: '48', change: 'Needs review', note: 'Requests awaiting review', icon: Clock3, tint: 'bg-[#fff5e5] text-[#c17a13]' },
              ].map(({ label, value, change, note, icon: Icon, tint }) => (
                <article key={label} className="rounded-xl border border-[#e6eaee] bg-white p-5 shadow-[0_2px_8px_rgba(30,48,66,.04)]">
                  <div className="flex items-start justify-between gap-3">
                    <span className={`grid size-9 place-items-center rounded-lg ${tint}`}><Icon size={17} /></span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f8f0] px-2 py-1 text-[10px] font-bold text-[#18875f]">{label === 'Pending approvals' ? null : <TrendingUp size={11} />}{change}</span>
                  </div>
                  <p className="mt-4 text-[11px] font-bold uppercase tracking-[.08em] text-[#75808c]">{label}</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-[#202a34]">{value}</p>
                  <p className="mt-1 text-xs text-[#8b96a1]">{note}</p>
                </article>
              ))}
            </div>
            <article className="rounded-xl border border-[#e6eaee] bg-white p-5 shadow-[0_2px_8px_rgba(30,48,66,.04)] sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 className="text-base font-bold text-[#202a34]">System traffic analysis</h2><p className="mt-1 text-xs text-[#82909d]">Network requests and error rates over the last seven days</p></div>
                <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wide">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-[#eef5ff] px-2.5 py-1.5 text-[#526171]"><span className="size-2 rounded-full bg-[#2585f5]" />Requests</span>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-[#fff1f0] px-2.5 py-1.5 text-[#526171]"><span className="size-2 rounded-full bg-[#e35b58]" />Errors</span>
                </div>
              </div>
              <div className="mt-5 h-64 w-full" role="img" aria-label="Sample line chart showing system requests and errors over seven days">
                <svg viewBox="0 0 720 270" preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
                  {trafficScale.map((value) => {
                    const y = 222 - (value / 8000) * 190;
                    return (
                      <g key={value}>
                        <text x="48" y={y + 4} textAnchor="end" fill="#82909d" fontSize="10">{value.toLocaleString()}</text>
                        <line x1="58" x2="690" y1={y} y2={y} stroke="#e9edf1" strokeDasharray="3 4" />
                      </g>
                    );
                  })}
                  <polygon points={requestArea} fill="#2585f5" fillOpacity=".06" />
                  <polyline points={requestLine} fill="none" stroke="#2585f5" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
                    <title>Requests: weekly sample traffic</title>
                  </polyline>
                  <polyline points={errorLine} fill="none" stroke="#e35b58" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
                    <title>Errors: weekly sample traffic</title>
                  </polyline>
                  {sampleTraffic.map(({ day }, index) => (
                    <text key={day} x={trafficPoints[index].x} y="250" textAnchor="middle" fill="#82909d" fontSize="11">{day}</text>
                  ))}
                </svg>
              </div>
            </article>
            <div className="grid gap-5 xl:grid-cols-[1.35fr_.85fr]">
            <article className="rounded-xl border border-[#e6eaee] bg-white p-5 shadow-[0_2px_8px_rgba(30,48,66,.04)] sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 className="text-base font-bold text-[#202a34]">Account creation activity</h2><p className="mt-1 text-xs text-[#82909d]">New accounts created over the last seven days</p></div>
                <span className="rounded-md bg-[#eef5ff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#1473e6]">Accounts</span>
              </div>
              <div className="mt-7 flex h-48 items-end gap-3 border-b border-l border-[#e7ebef] px-3">
                {accountActivity.map((day) => (
                  <div key={day.key} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <span className="text-[10px] font-semibold text-[#768391]">{day.count}</span>
                    <div className="flex w-full max-w-12 items-end" style={{ height: '72%' }}>
                      <div className="w-full rounded-t bg-[#4a9af4] transition-all" style={{ height: `${Math.max(day.count ? 12 : 4, (day.count / maxDailyCount) * 100)}%` }} title={`${day.count} account${day.count === 1 ? '' : 's'}`} />
                    </div>
                    <span className="pb-2 text-[10px] text-[#8793a0]">{day.label}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-xl border border-[#e6eaee] bg-white p-5 shadow-[0_2px_8px_rgba(30,48,66,.04)] sm:p-6">
              <div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-bold text-[#202a34]">Account health</h2><p className="mt-1 text-xs text-[#82909d]">Active and disabled account totals</p></div><LockKeyhole size={18} className="text-[#1473e6]" /></div>
              <div className="mt-6 space-y-5">
                <div>
                  <div className="mb-2 flex justify-between text-xs"><span className="font-semibold text-[#526171]">Active</span><span className="font-bold text-[#202a34]">{(overview?.activeAccounts || 0).toLocaleString()}</span></div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[#edf0f3]"><div className="h-full rounded-full bg-[#27ae7b]" style={{ width: `${totalUsers ? (overview.activeAccounts / totalUsers) * 100 : 0}%` }} /></div>
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-xs"><span className="font-semibold text-[#526171]">Disabled</span><span className="font-bold text-[#202a34]">{(overview?.disabledAccounts || 0).toLocaleString()}</span></div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[#edf0f3]"><div className="h-full rounded-full bg-[#e27369]" style={{ width: `${totalUsers ? (overview.disabledAccounts / totalUsers) * 100 : 0}%` }} /></div>
                </div>
                <p className="rounded-lg bg-[#f6f8fa] p-3 text-xs leading-5 text-[#687583]">Account totals are loaded from the administrator reporting service.</p>
              </div>
            </article>
            </div>
          </section>}

          {activeSection === 'user-management' && <section id="user-management" className="rounded-xl border border-[#e6eaee] bg-white p-5 shadow-[0_2px_8px_rgba(30,48,66,.04)] sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><h2 className="text-xl font-bold text-[#202a34]">User management</h2><p className="mt-1 text-sm text-[#82909d]">Create, review, edit, and delete user accounts.</p></div>
              <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                <button type="button" onClick={() => loadDashboard(true)} disabled={refreshing} className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-[#d7dde3] px-3 py-2 text-xs font-semibold text-[#526171] hover:bg-[#f6f8fa] disabled:opacity-60"><RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />Sync records</button>
                <button type="button" onClick={() => openAccountDialog('create')} className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-[#1473e6] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#095fc5]"><Plus size={15} />Add new user</button>
              </div>
            </div>
            {accountNotice && <p role="status" className="mt-4 rounded-md border border-[#bce4cf] bg-[#effaf4] px-3 py-2.5 text-sm font-semibold text-[#18794e]">{accountNotice}</p>}
            <div className="mt-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-md bg-[#f1f3f5] p-1">
                {[['all', 'All users'], ['student', 'Student assistants'], ['supervisor', 'Supervisors']].map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setRoleFilter(value)} className={`focus-ring shrink-0 rounded px-3 py-2 text-xs font-semibold transition-colors ${roleFilter === value ? 'bg-white text-[#202a34] shadow-sm' : 'text-[#687583] hover:text-[#202a34]'}`}>{label}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <label className="relative min-w-0 flex-1 sm:w-64" htmlFor="admin-account-search">
                  <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8b96a1]" />
                  <input id="admin-account-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, or ID…" className="focus-ring w-full rounded-md border border-[#d7dde3] py-2.5 pl-9 pr-3 text-xs outline-none focus:border-[#1473e6]" />
                </label>
                <button type="button" onClick={() => { setSearch(''); setRoleFilter('all'); }} className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-[#d7dde3] px-3 py-2 text-xs font-semibold text-[#526171] hover:bg-[#f6f8fa]"><Filter size={13} />Reset</button>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead><tr className="border-y border-[#e8ecef] bg-[#f7f8f9] text-[10px] font-bold uppercase tracking-[.08em] text-[#82909d]"><th className="px-3 py-3">User profile</th><th className="px-3 py-3">Administrative role</th><th className="px-3 py-3">Department / course</th><th className="px-3 py-3">Created</th><th className="px-3 py-3 text-right">Actions</th></tr></thead>
                <tbody>
                  {visibleAccounts.map((account) => (
                    <tr key={`${account.apiRole}-${account.id}`} className="border-b border-[#edf0f2] last:border-0 hover:bg-[#fafbfc]">
                      <td className="px-3 py-3 font-semibold text-[#344252]">{account.name || 'Unnamed account'}<span className="mt-0.5 block text-[11px] font-normal text-[#82909d]">{account.email || 'Email unavailable'}{account.studentNumber ? ` · ${account.studentNumber}` : ''}</span></td>
                      <td className="px-3 py-3"><span className="rounded bg-[#f0f4f8] px-2 py-1 text-[10px] font-bold text-[#526171]">{account.role}</span></td>
                      <td className="px-3 py-3 text-xs text-[#687583]">{account.course ? `${account.course}${account.levelOfStudy ? ` · Level ${account.levelOfStudy}` : ''}` : '—'}</td>
                      <td className="px-3 py-3 text-xs text-[#82909d]">{formatDate(account.createdAt)}</td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-1">
                          <button type="button" onClick={() => openAccountDialog('view', account)} aria-label={`View ${account.name || 'user'}`} title="View details" className="focus-ring rounded p-2 text-[#526171] hover:bg-[#eaf3ff] hover:text-[#1473e6]"><Eye size={15} /></button>
                          <button type="button" onClick={() => openAccountDialog('edit', account)} aria-label={`Edit ${account.name || 'user'}`} title="Edit account" className="focus-ring rounded p-2 text-[#526171] hover:bg-[#eaf3ff] hover:text-[#1473e6]"><Pencil size={15} /></button>
                          <button type="button" onClick={() => openAccountDialog('delete', account)} aria-label={`Delete ${account.name || 'user'}`} title="Delete account" className="focus-ring rounded p-2 text-[#cb3f43] hover:bg-[#fff1f0]"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && !visibleAccounts.length && <tr><td colSpan={5} className="py-10 text-center text-sm text-[#82909d]">{error ? 'User list could not be loaded.' : search ? 'No matching accounts.' : 'No accounts to display.'}</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#edf0f2] pt-3">
              <p className="text-xs text-[#82909d]">Showing {filteredAccounts.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filteredAccounts.length)} of {filteredAccounts.length} accounts</p>
              <div className="flex items-center gap-2">
                <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="focus-ring inline-flex items-center gap-1 rounded-md border border-[#d7dde3] px-2.5 py-1.5 text-xs font-semibold text-[#526171] hover:bg-[#f6f8fa] disabled:cursor-not-allowed disabled:opacity-45"><ChevronLeft size={14} />Previous</button>
                <span className="rounded-md bg-[#eaf3ff] px-3 py-1.5 text-xs font-bold text-[#1473e6]">{page} / {pageCount}</span>
                <button type="button" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} className="focus-ring inline-flex items-center gap-1 rounded-md border border-[#d7dde3] px-2.5 py-1.5 text-xs font-semibold text-[#526171] hover:bg-[#f6f8fa] disabled:cursor-not-allowed disabled:opacity-45">Next<ChevronRight size={14} /></button>
              </div>
            </div>
          </section>}

          <footer className="flex flex-wrap justify-between gap-3 border-t border-[#e1e5e9] py-4 text-[10px] text-[#8793a0]"><span>© 2026 iCenter Administrative Console</span><a href="mailto:general@tut.ac.za" className="hover:text-[#1473e6]">Contact support</a></footer>
        </main>
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
                data-testid="button-cancel-logout"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="focus-ring flex-1 rounded-lg bg-[#1f70d0] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#256fc6]"
                data-testid="button-confirm-logout"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
          {accountDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#142333]/45 px-4 py-6" onMouseDown={(event) => { if (event.target === event.currentTarget && !accountBusy) setAccountDialog(null); }}>
              <section role={accountDialog.mode === 'delete' ? 'alertdialog' : 'dialog'} aria-modal="true" aria-labelledby="admin-account-dialog-title" className="my-auto w-full max-w-2xl rounded-xl bg-white p-5 shadow-[0_18px_45px_rgba(30,48,66,.25)] sm:p-7">
                <div className="flex items-start justify-between gap-4 border-b border-[#e8ecef] pb-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#1473e6]">User management</p>
                    <h2 id="admin-account-dialog-title" className="mt-1 text-xl font-bold text-[#202a34]">
                      {accountDialog.mode === 'create' ? 'Add new user' : accountDialog.mode === 'edit' ? 'Edit user account' : accountDialog.mode === 'delete' ? 'Delete user account' : 'User profile'}
                    </h2>
                    <p className="mt-1 text-xs text-[#82909d]">
                      {accountDialog.mode === 'create' ? 'Create an account for a student assistant or supervisor.' : accountDialog.account?.name}
                    </p>
                  </div>
                  <button type="button" onClick={() => setAccountDialog(null)} disabled={accountBusy} aria-label="Close dialog" className="focus-ring rounded-md p-1.5 text-[#82909d] hover:bg-[#f1f3f5] disabled:opacity-50"><X size={18} /></button>
                </div>

                {accountError && <p role="alert" className="mt-4 rounded-md border border-[#f1c6c3] bg-[#fff1f0] px-3 py-2.5 text-sm font-semibold text-[#b84233]">{accountError}</p>}

                {accountDialog.mode === 'view' && (
                  <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                    {[
                      ['First name', accountDialog.account?.firstName],
                      ['Last name', accountDialog.account?.lastName],
                      ['Email address', accountDialog.account?.email],
                      ['Role', accountDialog.account?.role],
                      ['Student number', accountDialog.account?.studentNumber],
                      ['Course', accountDialog.account?.course],
                      ['Level of study', accountDialog.account?.levelOfStudy],
                      ['Cell number', accountDialog.account?.cellNumber],
                      ['Personal email', accountDialog.account?.personalEmail],
                      ['Created', formatDate(accountDialog.account?.createdAt)],
                    ].filter(([, value]) => value).map(([label, value]) => (
                      <div key={label} className="border-b border-[#edf0f2] pb-2">
                        <dt className="text-[10px] font-bold uppercase tracking-wide text-[#82909d]">{label}</dt>
                        <dd className="mt-1 break-words text-sm font-medium text-[#344252]">{value}</dd>
                      </div>
                    ))}
                    <div className="flex justify-end gap-2 sm:col-span-2">
                      <button type="button" onClick={() => openAccountDialog('edit', accountDialog.account)} className="focus-ring inline-flex items-center gap-2 rounded-md bg-[#1473e6] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#095fc5]"><Pencil size={14} />Edit account</button>
                    </div>
                  </dl>
                )}

                {accountDialog.mode === 'delete' && (
                  <div className="mt-5">
                    <p className="text-sm leading-6 text-[#526171]">You are about to permanently remove <strong>{accountDialog.account?.name || 'this user'}</strong> ({accountDialog.account?.email || 'no email available'}). This action cannot be undone. The server may prevent deletion if this account has existing system records.</p>
                    <div className="mt-6 flex justify-end gap-2">
                      <button type="button" onClick={() => setAccountDialog(null)} disabled={accountBusy} className="focus-ring rounded-md border border-[#d7dde3] px-4 py-2.5 text-xs font-bold text-[#526171] hover:bg-[#f6f8fa]">Cancel</button>
                      <button type="button" onClick={handleDeleteAccount} disabled={accountBusy} className="focus-ring inline-flex items-center gap-2 rounded-md bg-[#d84a44] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#b93b36] disabled:cursor-wait disabled:opacity-60"><Trash2 size={14} />{accountBusy ? 'Deleting…' : 'Delete account'}</button>
                    </div>
                  </div>
                )}

                {(accountDialog.mode === 'create' || accountDialog.mode === 'edit') && (
                  <form onSubmit={handleSaveAccount} className="mt-5 space-y-4">
                    {accountDialog.mode === 'create' && (
                      <label className="block max-w-xs">
                        <span className="mb-1.5 block text-xs font-semibold text-[#526171]">Administrative role</span>
                        <select value={accountDialog.role} onChange={(event) => setAccountDialog((current) => ({ ...current, role: event.target.value }))} className="focus-ring w-full rounded-md border border-[#d7dde3] bg-white px-3 py-2.5 text-sm text-[#344252] outline-none focus:border-[#1473e6]">
                          <option value="student">Student assistant</option>
                          <option value="supervisor">Supervisor</option>
                        </select>
                      </label>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <AccountField label="First name" name="first_name" value={accountForm.first_name} onChange={handleAccountFormChange} required />
                      <AccountField label="Last name" name="last_name" value={accountForm.last_name} onChange={handleAccountFormChange} required />
                      {accountDialog.mode === 'create' ? (
                        <>
                          <AccountField label="Login email" name="student_email" value={accountForm.student_email} onChange={handleAccountFormChange} type="email" required autoComplete="email" />
                          <AccountField label="Temporary password" name="password" value={accountForm.password} onChange={handleAccountFormChange} type="password" required autoComplete="new-password" />
                        </>
                      ) : (
                        <AccountField label="Login email (cannot be changed here)" name="student_email" value={accountForm.student_email} readOnly />
                      )}
                      {((accountDialog.mode === 'create' && accountDialog.role === 'student') || (accountDialog.mode === 'edit' && accountDialog.account.apiRole === 'student')) && (
                        <>
                          <AccountField label="Student number" name="student_number" value={accountForm.student_number} onChange={handleAccountFormChange} required />
                          <AccountField label="Course" name="course" value={accountForm.course} onChange={handleAccountFormChange} required />
                          <AccountField label="Level of study" name="level_of_study" value={accountForm.level_of_study} onChange={handleAccountFormChange} required />
                        </>
                      )}
                      <AccountField label="Cell number" name="cell_number" value={accountForm.cell_number} onChange={handleAccountFormChange} type="tel" autoComplete="tel" />
                      <AccountField label="Personal email" name="personal_email" value={accountForm.personal_email} onChange={handleAccountFormChange} type="email" autoComplete="email" />
                    </div>
                    <p className="text-xs leading-5 text-[#82909d]">The login email and password are set at account creation. Existing account editing updates profile details supported by the administration service.</p>
                    <div className="flex justify-end gap-2 border-t border-[#edf0f2] pt-4">
                      <button type="button" onClick={() => setAccountDialog(null)} disabled={accountBusy} className="focus-ring rounded-md border border-[#d7dde3] px-4 py-2.5 text-xs font-bold text-[#526171] hover:bg-[#f6f8fa]">Cancel</button>
                      <button type="submit" disabled={accountBusy} className="focus-ring rounded-md bg-[#1473e6] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#095fc5] disabled:cursor-wait disabled:opacity-60">{accountBusy ? 'Saving…' : accountDialog.mode === 'create' ? 'Create user' : 'Save changes'}</button>
                    </div>
                  </form>
                )}
              </section>
            </div>
          )}
          <button type="button" onClick={handleLogout} className="focus-ring fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-[#cb3f43] px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-[#ad3036] lg:hidden"><LogOut size={14} />Log out</button>
    </div>
  );
}
