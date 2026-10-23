import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, Clock3, FileText, Grid2X2, LogOut, Megaphone, Monitor, RefreshCw, ShieldCheck, Users, UserRound, UserRoundCog } from 'lucide-react';
import { useLocation } from 'wouter';
import { format, subDays } from 'date-fns';
import { apiFetch } from '@/lib/api';
import { clearSession, getSession } from '@/lib/session';
import { PortalBrand, ModeToggle } from '@/components/portal/PortalComponents';
import { NotificationBell } from '@/components/portal/NotificationBell';
import AdminRequest from '@/pages/admin/AdminRequest';
import Analytics from '@/pages/admin/Analytics';
import UserManagement from '@/pages/admin/UserManagement';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Grid2X2 },
  { id: 'user-management', label: 'User Management', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'requests', label: 'Requests', icon: FileText },
];

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

function formatLastSeen(value) {
  if (!value) return 'Never';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : format(date, 'd MMM yyyy, HH:mm');
}

function getLastSeenTimestamp(value) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
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

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [session, setSession] = useState(readAdminSession);
  const [overview, setOverview] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [supervisorDeclarations, setSupervisorDeclarations] = useState([]);
  const [declarationsLoading, setDeclarationsLoading] = useState(false);
  const [declarationsError, setDeclarationsError] = useState('');
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [pendingRegistrationsLoading, setPendingRegistrationsLoading] = useState(false);
  const [pendingRegistrationsError, setPendingRegistrationsError] = useState('');
  const [registrationBusyId, setRegistrationBusyId] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [analyticsRequests, setAnalyticsRequests] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');
  const [requests, setRequests] = useState([]);
  const [requestSearch, setRequestSearch] = useState('');
  const [requestStatus, setRequestStatus] = useState('');
  const [requestType, setRequestType] = useState('');
  const [requestFrom, setRequestFrom] = useState('');
  const [requestTo, setRequestTo] = useState('');
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState('');
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
      setLocation('/login');
    }
  }, [session, setLocation]);

  const loadDashboard = useCallback(async (quiet = false) => {
    if (!session?.access_token || session.user?.role !== 'admin') return;
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const paths = ['/api/admin/overview', '/api/admin/assistants', '/api/admin/supervisors', '/api/admin/active-users'];
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
      setActiveUsers(data[3].users || []);
    } catch (requestError) {
      console.error('Load administrator dashboard error:', requestError);
      setError(requestError.message || 'Could not load administrator dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  const loadPendingRegistrations = useCallback(async () => {
    if (!session?.access_token || session.user?.role !== 'admin') return;
    setPendingRegistrationsLoading(true);
    setPendingRegistrationsError('');
    try {
      const response = await apiFetch('/api/admin/registration-requests?status=pending');
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || `Could not load pending registrations (${response.status}).`);
      setPendingRegistrations(Array.isArray(body.requests) ? body.requests : []);
    } catch (requestError) {
      console.error('Load pending registrations error:', requestError);
      setPendingRegistrationsError(requestError.message || 'Could not load pending registrations.');
    } finally {
      setPendingRegistrationsLoading(false);
    }
  }, [session]);

  const loadSupervisorDeclarations = useCallback(async () => {
    if (!session?.access_token || session.user?.role !== 'admin') return;
    setDeclarationsLoading(true);
    setDeclarationsError('');
    try {
      const response = await apiFetch('/api/closures');
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || `Could not load supervisor declarations (${response.status}).`);
      if (!Array.isArray(body)) throw new Error('The supervisor declarations response was invalid.');
      setSupervisorDeclarations([...body].sort((a, b) => String(b.declaredAt || b.date).localeCompare(String(a.declaredAt || a.date))));
    } catch (requestError) {
      console.error('Load supervisor declarations error:', requestError);
      setDeclarationsError(requestError.message || 'Could not load supervisor declarations.');
    } finally {
      setDeclarationsLoading(false);
    }
  }, [session]);

  const reviewRegistration = async (registration, decision, reason = '') => {
    setRegistrationBusyId(registration.id);
    setPendingRegistrationsError('');
    try {
      const response = await apiFetch(
        `/api/admin/registration-requests/${encodeURIComponent(registration.id)}/${decision}`,
        {
          method: 'PATCH',
          headers: decision === 'reject' ? { 'Content-Type': 'application/json' } : undefined,
          body: decision === 'reject' ? JSON.stringify({ reason }) : undefined,
        },
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || `Could not ${decision} registration (${response.status}).`);
      setAccountNotice(`${registration.name}'s registration was ${decision === 'approve' ? 'approved' : 'declined'}.`);
      await Promise.all([loadPendingRegistrations(), loadDashboard(true)]);
    } catch (requestError) {
      console.error(`${decision === 'approve' ? 'Approve' : 'Reject'} registration error:`, requestError);
      setPendingRegistrationsError(requestError.message || `Could not ${decision} registration.`);
    } finally {
      setRegistrationBusyId(null);
    }
  };

  const loadRequests = useCallback(async (filters) => {
    if (!session?.access_token || session.user?.role !== 'admin') return;
    setRequestsLoading(true);
    setRequestsError('');
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      const queryString = params.toString();
      const response = await apiFetch(`/api/admin/requests${queryString ? `?${queryString}` : ''}`);
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || `Could not load requests (${response.status}).`);
      setRequests(Array.isArray(body.requests) ? body.requests : []);
    } catch (requestError) {
      console.error('Load administrator requests error:', requestError);
      setRequestsError(requestError.message || 'Could not load administrator requests.');
    } finally {
      setRequestsLoading(false);
    }
  }, [session]);

  const loadAnalyticsRequests = useCallback(async () => {
    if (!session?.access_token || session.user?.role !== 'admin') return;
    setAnalyticsLoading(true);
    setAnalyticsError('');
    const today = new Date();
    const params = new URLSearchParams({
      from: format(subDays(today, 6), 'yyyy-MM-dd'),
      to: format(today, 'yyyy-MM-dd'),
    });
    try {
      const response = await apiFetch(`/api/admin/requests?${params.toString()}`);
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || `Could not load analytics requests (${response.status}).`);
      setAnalyticsRequests(Array.isArray(body.requests) ? body.requests : []);
    } catch (requestError) {
      console.error('Load administrator analytics requests error:', requestError);
      setAnalyticsError(requestError.message || 'Could not load request analytics.');
    } finally {
      setAnalyticsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session?.access_token && session.user?.role === 'admin') loadDashboard();
  }, [loadDashboard, session]);

  useEffect(() => {
    if (session?.access_token && session.user?.role === 'admin') loadSupervisorDeclarations();
  }, [loadSupervisorDeclarations, session]);

  useEffect(() => {
    if (activeSection !== 'requests') return undefined;
    const timer = window.setTimeout(() => {
      loadRequests({
        q: requestSearch.trim(),
        status: requestStatus,
        type: requestType,
        from: requestFrom,
        to: requestTo,
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [activeSection, loadRequests, requestFrom, requestSearch, requestStatus, requestTo, requestType]);

  useEffect(() => {
    if (activeSection === 'analytics') loadAnalyticsRequests();
  }, [activeSection, loadAnalyticsRequests]);

  useEffect(() => {
    if (activeSection === 'user-management') loadPendingRegistrations();
  }, [activeSection, loadPendingRegistrations]);

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
  const onlineUserCount = activeUsers.filter((user) => user.online).length;
  const sortedActiveUsers = useMemo(() => [...activeUsers].sort((a, b) => {
    const onlineOrder = Number(b.online) - Number(a.online);
    if (onlineOrder !== 0) return onlineOrder;

    const aLastSeen = getLastSeenTimestamp(a.lastSeenAt);
    const bLastSeen = getLastSeenTimestamp(b.lastSeenAt);
    if (aLastSeen === null) return bLastSeen === null ? 0 : 1;
    if (bLastSeen === null) return -1;
    return bLastSeen - aLastSeen;
  }), [activeUsers]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  const openAccountDialog = (mode, account = null) => {
    setAccountError('');
    setAccountNotice('');
    setAccountDialog({
      mode,
      account,
      role: 'student',
      nextStatus: account?.accountStatus === 'disabled' ? 'active' : 'disabled',
    });
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

  const handleAccountStatusChange = async () => {
    if (accountDialog?.mode !== 'status') return;
    setAccountBusy(true);
    setAccountError('');
    try {
      const result = await sendAdminRequest(accountEndpoint(accountDialog.account, '/status'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_status: accountDialog.nextStatus }),
      });
      setAccountDialog(null);
      setAccountNotice(result.message || `User account ${accountDialog.nextStatus === 'disabled' ? 'deactivated' : 'activated'}.`);
      await loadDashboard(true);
    } catch (requestError) {
      console.error('Change administrator-managed account status error:', requestError);
      setAccountError(requestError.message || 'Could not update this account status.');
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

  const requestFilters = {
    q: requestSearch.trim(),
    status: requestStatus,
    type: requestType,
    from: requestFrom,
    to: requestTo,
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

  const analyticsRequestActivity = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const day = subDays(today, 6 - index);
      const key = format(day, 'yyyy-MM-dd');
      return {
        key,
        label: format(day, 'EEE'),
        count: analyticsRequests.filter((request) => request.requestDate && format(new Date(request.requestDate), 'yyyy-MM-dd') === key).length,
      };
    });
  }, [analyticsRequests]);

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
  const maxDailyRequestCount = Math.max(1, ...analyticsRequestActivity.map((day) => day.count));

  return (
    <div className="admin-console min-h-screen bg-[#f4f5f7] text-[#202a34]">
      <aside className="admin-sidebar fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-[#e1e5e9] bg-[#eceef0] px-4 py-5 lg:flex">
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
          <div className="mb-2">
            <NotificationBell onNavigate={(notification) => {
              if (notification.type === 'registration_pending') jumpTo('user-management');
            }} />
          </div>
          <button type="button" onClick={() => setShowLogoutConfirm(true)} className="focus-ring flex w-full items-center gap-3 rounded-lg bg-[#1f70d0] px-3 py-2.5 text-sm font-bold text-white hover:bg-[#256fc6]"><LogOut size={18} />Logout</button>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex min-h-[62px] items-center justify-between gap-4 border-b border-[#e1e5e9] bg-white/95 px-5 backdrop-blur sm:px-8">
          <div className="ml-auto flex items-center gap-3">
            <div className="lg:hidden"><NotificationBell compact onNavigate={(notification) => {
              if (notification.type === 'registration_pending') jumpTo('user-management');
            }} /></div>
            <ModeToggle size="compact" />
            <span className="hidden text-xs text-[#697582] sm:inline">Signed in as <strong className="text-[#344252]">{firstName}</strong></span>
            <button type="button" onClick={() => {
              if (activeSection === 'requests') loadRequests(requestFilters);
              else if (activeSection === 'analytics') {
                loadDashboard(true);
                loadAnalyticsRequests();
              } else {
                loadDashboard(true);
                loadSupervisorDeclarations();
              }
            }} disabled={activeSection === 'requests' ? requestsLoading : activeSection === 'analytics' ? analyticsLoading || refreshing || loading : refreshing || loading} className="focus-ring inline-flex items-center gap-2 rounded-md border border-[#d7dde3] bg-white px-3 py-2 text-xs font-semibold text-[#3f4b58] hover:bg-[#f6f8fa] disabled:opacity-60">
              <RefreshCw size={14} className={(activeSection === 'requests' ? requestsLoading : activeSection === 'analytics' ? analyticsLoading || refreshing : refreshing) ? 'animate-spin' : ''} />{(activeSection === 'requests' ? requestsLoading : activeSection === 'analytics' ? analyticsLoading || refreshing : refreshing) ? 'Refreshing…' : 'Refresh data'}
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
              <p className="text-xs font-semibold text-[#75808c]"></p>
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
              <div className="grid gap-5 xl:grid-cols-[1.3fr_.9fr]">
                <article className="rounded-xl border border-[#e6eaee] bg-white shadow-[0_2px_8px_rgba(30,48,66,.04)]">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0f2] px-5 py-4">
                    <div><h2 className="text-base font-bold text-[#202a34]">Active user sessions</h2><p className="mt-1 text-xs text-[#82909d]">Recent activity from student assistants and supervisors</p></div>
                    <span className="rounded-md bg-[#eef5ff] px-2.5 py-1 text-[10px] font-bold text-[#1473e6]">{onlineUserCount} online · {activeUsers.length} active accounts</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[620px] text-left">
                      <thead><tr className="border-b border-[#edf0f2] text-[10px] font-bold uppercase tracking-wide text-[#82909d]"><th className="px-5 py-3">User</th><th className="px-3 py-3">Device / IP</th><th className="px-3 py-3">Last seen</th><th className="px-3 py-3">Status</th></tr></thead>
                      <tbody>
                        {sortedActiveUsers.length ? sortedActiveUsers.map((user) => (
                          <tr key={user.id} className="border-b border-[#f0f2f4] last:border-0">
                            <td className="px-5 py-3 text-xs font-semibold text-[#344252]">{user.name}</td>
                            <td className="px-3 py-3"><span className="flex items-center gap-1.5 text-xs text-[#526171]"><Monitor size={13} />{user.userAgent || 'Unknown device'}</span><span className="mt-1 block font-mono text-[10px] text-[#929daa]">{user.ipAddress || 'IP unavailable'}</span></td>
                            <td className="px-3 py-3 text-xs text-[#687583]">{formatLastSeen(user.lastSeenAt)}</td>
                            <td className="px-3 py-3"><span className={`rounded px-2 py-1 text-[9px] font-bold uppercase ${user.online ? 'bg-[#e8f8f0] text-[#18875f]' : 'bg-[#f1f3f5] text-[#687583]'}`}>{user.online ? 'Online' : 'Offline'}</span></td>
                          </tr>
                        )) : (
                          <tr><td colSpan={4} className="px-5 py-8 text-center text-xs text-[#82909d]">No active accounts found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="border-t border-[#edf0f2] px-5 py-3 text-center text-xs font-semibold text-[#82909d]">Online means the account has made an authenticated request in the last five minutes.</div>
                </article>
                <article className="rounded-xl border border-[#e6eaee] bg-white shadow-[0_2px_8px_rgba(30,48,66,.04)]">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0f2] px-5 py-4">
                    <div><h2 className="text-base font-bold text-[#202a34]">Supervisor declarations</h2><p className="mt-1 text-xs text-[#82909d]">Institutional strikes and library closures</p></div>
                    <button type="button" onClick={loadSupervisorDeclarations} disabled={declarationsLoading} className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-[#d7dde3] px-2.5 py-1.5 text-[10px] font-semibold text-[#526171] hover:bg-[#f6f8fa] disabled:opacity-60" data-testid="button-refresh-declarations">
                      <RefreshCw size={12} className={declarationsLoading ? 'animate-spin' : ''} />Refresh
                    </button>
                  </div>
                  {declarationsError ? (
                    <p role="alert" className="px-5 py-6 text-center text-xs font-semibold text-[#b84233]">{declarationsError}</p>
                  ) : declarationsLoading && !supervisorDeclarations.length ? (
                    <p className="px-5 py-8 text-center text-xs text-[#82909d]">Loading supervisor declarations…</p>
                  ) : supervisorDeclarations.length ? (
                    <ol className="max-h-[420px] divide-y divide-[#f0f2f4] overflow-y-auto px-5">
                      {supervisorDeclarations.map((declaration) => (
                        <li key={declaration.date} className="flex gap-3 py-4">
                          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-[#fff0ee] text-[#c34d42]"><Megaphone size={15} /></span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <h3 className="text-xs font-bold text-[#344252]">{declaration.type || 'Institutional closure'}</h3>
                              <span className="whitespace-nowrap text-[10px] text-[#929daa]">{formatDate(declaration.date)}</span>
                            </div>
                            <p className="mt-1 text-[11px] leading-5 text-[#687583]">{declaration.note || 'No additional details provided.'}</p>
                            <p className="mt-1 text-[10px] text-[#82909d]">Declared by a supervisor{declaration.declaredAt ? ` · ${formatLastSeen(declaration.declaredAt)}` : ''}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="px-5 py-8 text-center text-xs text-[#82909d]">No strikes or library closures have been declared.</p>
                  )}
                </article>
              </div>
            </div>
          </section>}

          {activeSection === 'analytics' && <Analytics
            overview={overview}
            totalUsers={totalUsers}
            onlineUserCount={onlineUserCount}
            analyticsRequests={analyticsRequests}
            analyticsLoading={analyticsLoading}
            analyticsError={analyticsError}
            analyticsRequestActivity={analyticsRequestActivity}
            accountActivity={accountActivity}
            maxDailyCount={maxDailyCount}
            maxDailyRequestCount={maxDailyRequestCount}
          />}

          {activeSection === 'user-management' && <UserManagement
            loading={loading}
            error={error}
            accounts={accounts}
            filteredAccounts={filteredAccounts}
            visibleAccounts={visibleAccounts}
            search={search}
            setSearch={setSearch}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            page={page}
            pageSize={pageSize}
            pageCount={pageCount}
            accountNotice={accountNotice}
            accountDialog={accountDialog}
            accountForm={accountForm}
            accountError={accountError}
            accountBusy={accountBusy}
            pendingRegistrations={pendingRegistrations}
            pendingRegistrationsLoading={pendingRegistrationsLoading}
            pendingRegistrationsError={pendingRegistrationsError}
            registrationBusyId={registrationBusyId}
            onRefresh={() => loadDashboard(true)}
            onRefreshRegistrations={loadPendingRegistrations}
            onReviewRegistration={reviewRegistration}
            onOpenAccount={openAccountDialog}
            onDeleteAccount={handleDeleteAccount}
            onChangeAccountStatus={handleAccountStatusChange}
            onSaveAccount={handleSaveAccount}
            onFormChange={handleAccountFormChange}
            onCloseDialog={() => setAccountDialog(null)}
            onRoleChange={(role) => setAccountDialog((current) => ({ ...current, role }))}
            onPageChange={setPage}
            onExport={handleExport}
          />}

          {activeSection === 'requests' && <AdminRequest
            requests={requests}
            loading={requestsLoading}
            error={requestsError}
            search={requestSearch}
            setSearch={setRequestSearch}
            status={requestStatus}
            setStatus={setRequestStatus}
            type={requestType}
            setType={setRequestType}
            from={requestFrom}
            setFrom={setRequestFrom}
            to={requestTo}
            setTo={setRequestTo}
            onRefresh={() => loadRequests(requestFilters)}
          />}

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
              <button type="button" onClick={handleLogout} className="focus-ring fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-[#cb3f43] px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-[#ad3036] lg:hidden"><LogOut size={14} />Log out</button>
    </div>
  );
}
