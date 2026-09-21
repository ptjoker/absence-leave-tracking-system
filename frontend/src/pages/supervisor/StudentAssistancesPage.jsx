import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Mail,
  Phone,
  Search,
  UsersRound,
  CheckCircle2,
  Clock3,
  CalendarDays,
  RefreshCw,
} from 'lucide-react';
import { PortalShell, StatusBadge } from '@/components/portal/PortalComponents';

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-xl bg-[#f4f8fb] p-5">
      <div className="flex items-center justify-between">
        <p className="mono text-[10px] font-bold uppercase tracking-[.1em] text-[#7890a4]">{label}</p>
        <span className="text-[#1f70d0]">{icon}</span>
      </div>
      <p className="serif mt-2 text-4xl text-[#10253f]">{value}</p>
    </div>
  );
}

function RequestPill({ label, count, tone }) {
  const tones = {
    approved: 'bg-[#e3f7ec] text-[#19885d]',
    pending: 'bg-[#fff0d8] text-[#f2aa00]',
    rejected: 'bg-[#fbe4e1] text-[#d05b48]',
    neutral: 'bg-[#eef4fb] text-[#52708b]',
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone] || tones.neutral}`}>
      {count} {label}
    </span>
  );
}

function AssistantRow({ assistant }) {
  return (
    <tr className="border-t border-[#e2eaf1] align-top">
      <td className="py-4 pl-6 pr-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#1f70d0] text-xs font-bold text-white">
            {assistant.initials}
          </span>
          <div>
            <strong className="block text-sm font-bold text-[#162c4d]">{assistant.name}</strong>
            <span className="mono text-[10px] font-bold uppercase tracking-[.06em] text-[#8ca0b2]">
              {assistant.course || 'No department'}
            </span>
          </div>
        </div>
      </td>
      <td className="py-4 pr-4">
        <p className="flex items-center gap-1.5 text-xs text-[#52708b]">
          <Mail size={12} />
          {assistant.email || '—'}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-[#52708b]">
          <Phone size={12} />
          {assistant.phone || '—'}
        </p>
        {assistant.studentNumber && (
          <p className="mt-1 mono text-[10px] font-bold uppercase tracking-[.06em] text-[#8ca0b2]">
            StudNo: {assistant.studentNumber}
          </p>
        )}
      </td>
      <td className="py-4 pr-4">
        <div className="flex flex-wrap gap-1.5">
          <RequestPill label="total" count={assistant.totalRequests} tone="neutral" />
          {assistant.approvedRequests > 0 && (
            <RequestPill label="approved" count={assistant.approvedRequests} tone="approved" />
          )}
          {assistant.pendingRequests > 0 && (
            <RequestPill label="pending" count={assistant.pendingRequests} tone="pending" />
          )}
          {assistant.rejectedRequests > 0 && (
            <RequestPill label="rejected" count={assistant.rejectedRequests} tone="rejected" />
          )}
        </div>
      </td>
      <td className="mono py-4 pr-4 text-xs font-semibold text-[#243e5b]">
        {formatDate(assistant.createdAt)}
      </td>
      <td className="py-4 pr-6">
        <StatusBadge status={assistant.status || 'Active'} />
      </td>
    </tr>
  );
}

export default function StudentAssistancesPage() {
  const [query, setQuery] = useState('');
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAssistants = async () => {
    setLoading(true);
    setError('');
    try {
      const raw = localStorage.getItem('session');
      const session = raw ? JSON.parse(raw) : null;
      if (!session?.access_token) {
        setError('Not authenticated');
        return;
      }
      const res = await fetch('http://localhost:3000/api/assistants', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not load assistants');
        return;
      }
      setAssistants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Load assistants error:', err);
      setError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssistants();
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return assistants;
    return assistants.filter((a) => {
      const haystack = [
        a.name,
        a.email,
        a.course,
        a.studentNumber,
        a.phone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [query, assistants]);

  const totalRequests = assistants.reduce((sum, a) => sum + a.totalRequests, 0);
  const pendingRequests = assistants.reduce((sum, a) => sum + a.pendingRequests, 0);

  return (
    <PortalShell supervisor>
      <main className="px-5 py-7 md:px-8 md:py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="serif text-4xl text-[#10253f]">Student Assistances</h1>
            <p className="mt-2 max-w-lg text-sm text-[#3d5a76]">
              Live roster of every student assistant in the system with their request activity.
            </p>
          </div>
          <button
            type="button"
            onClick={loadAssistants}
            disabled={loading}
            className="focus-ring flex items-center gap-2 rounded-lg border border-[#dce8f2] bg-white px-4 py-2.5 text-sm font-semibold text-[#385570] shadow-sm hover:bg-[#f4f8fb] disabled:opacity-50"
            data-testid="button-refresh-assistants"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-[#fbe4e1] px-4 py-2.5 text-sm font-semibold text-[#d05b48]">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          <StatCard label="Total Assistants" value={assistants.length} icon={<UsersRound size={17} />} />
          <StatCard label="Total Requests" value={totalRequests} icon={<CalendarDays size={17} />} />
          <StatCard label="Pending Review" value={pendingRequests} icon={<Clock3 size={17} />} />
        </div>

        <div className="mt-6">
          <label className="relative block w-full max-w-md" htmlFor="assistants-search">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8aa0b2]"
            />
            <input
              id="assistants-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, course, or student number..."
              className="focus-ring w-full rounded-lg border border-[#dce8f2] bg-white py-2.5 pl-9 pr-3 text-sm text-[#243e5b] outline-none placeholder:text-[#9baebe] focus:border-[#1f70d0]"
              data-testid="input-assistants-search"
            />
          </label>
        </div>

        <div className="mt-5 overflow-x-auto rounded-xl bg-[#f4f8fb]">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="mono text-[10px] font-bold uppercase tracking-[.08em] text-[#8ca0b2]">
                <th className="py-3 pl-6 pr-4 font-bold">Assistant</th>
                <th className="py-3 pr-4 font-bold">Contact</th>
                <th className="py-3 pr-4 font-bold">Requests</th>
                <th className="py-3 pr-4 font-bold">Member Since</th>
                <th className="py-3 pr-6 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-[#7890a4]">
                    <span className="inline-flex items-center gap-2">
                      <RefreshCw size={14} className="animate-spin" /> Loading assistants...
                    </span>
                  </td>
                </tr>
              ) : filtered.length ? (
                filtered.map((assistant) => (
                  <AssistantRow key={assistant.id} assistant={assistant} />
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-[#7890a4]">
                    {assistants.length === 0
                      ? 'No student assistants have registered yet.'
                      : `No assistants match "${query}".`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 flex items-center gap-1.5 text-xs text-[#3d5a76]">
          <CheckCircle2 size={13} /> Counts update automatically whenever students submit or supervisors decide on a request.
        </p>
      </main>
    </PortalShell>
  );
}