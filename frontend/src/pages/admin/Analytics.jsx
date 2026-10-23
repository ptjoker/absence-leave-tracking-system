import { Activity, Clock3, FileText, LockKeyhole, Users } from 'lucide-react';

function MetricCard({ label, value, note, icon: Icon, tint }) {
  return <article className="rounded-xl border border-[#e6eaee] bg-white p-5 shadow-[0_2px_8px_rgba(30,48,66,.04)]"><span className={`grid size-9 place-items-center rounded-lg ${tint}`}><Icon size={17} /></span><p className="mt-4 text-[11px] font-bold uppercase tracking-[.08em] text-[#75808c]">{label}</p><p className="mt-1 text-2xl font-bold tracking-tight text-[#202a34]">{value}</p><p className="mt-1 text-xs text-[#8b96a1]">{note}</p></article>;
}

export default function Analytics({
  overview, totalUsers, onlineUserCount, analyticsRequests, analyticsLoading, analyticsError,
  analyticsRequestActivity, accountActivity, maxDailyCount, maxDailyRequestCount,
}) {
  return (
    <section id="analytics" className="space-y-5">
      <div><p className="text-xs font-semibold text-[#75808c]"></p><h1 className="mt-2 text-2xl font-bold tracking-tight text-[#202a34]">System Analytics</h1><p className="mt-1 text-sm text-[#77828e]">Live account, presence, and request metrics from the administrator service.</p></div>
      {analyticsError && <div role="alert" className="rounded-lg border border-[#f1c6c3] bg-[#fff1f0] px-4 py-3 text-sm font-semibold text-[#b84233]">{analyticsError}</div>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total users" value={totalUsers} note="Student assistants and supervisors" icon={Users} tint="bg-[#003a6c] text-white" />
        <MetricCard label="Online users" value={onlineUserCount} note="Active within the last five minutes" icon={Activity} tint="bg-[#e8f8f0] text-[#15966a]" />
        <MetricCard label="Pending registrations" value={overview?.pendingRegistrations || 0} note="Waiting for administrator review" icon={Clock3} tint="bg-[#fff5e5] text-[#c17a13]" />
        <MetricCard label="Requests submitted" value={analyticsRequests.length} note="Leave and shift-swap requests · last 7 days" icon={FileText} tint="bg-[#f1ecff] text-[#7450c8]" />
      </div>
      <article className="rounded-xl border border-[#e6eaee] bg-white p-5 shadow-[0_2px_8px_rgba(30,48,66,.04)] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-base font-bold text-[#202a34]">Request submissions</h2><p className="mt-1 text-xs text-[#82909d]">Leave and shift-swap submissions by date · last seven days</p></div><span className="rounded-md bg-[#003a6c] px-2.5 py-1.5 text-[10px] font-bold text-white">{analyticsLoading ? 'Refreshing…' : `${analyticsRequests.length} total`}</span></div>
        <div className="mt-6 flex h-56 items-end gap-3 border-b border-l border-[#e7ebef] px-3" role="img" aria-label="Request submissions for each of the last seven days">
          {analyticsRequestActivity.map((day) => <div key={day.key} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] font-semibold text-[#768391]">{day.count}</span><div className="flex h-[75%] w-full max-w-14 items-end"><div className="w-full rounded-t bg-[#003a6c] transition-all" style={{ height: `${Math.max(day.count ? 10 : 3, (day.count / maxDailyRequestCount) * 100)}%` }} title={`${day.count} request${day.count === 1 ? '' : 's'}`} /></div><span className="pb-2 text-[10px] text-[#8793a0]">{day.label}</span></div>)}
        </div>
      </article>
      <div className="grid gap-5 xl:grid-cols-[1.35fr_.85fr]">
        <article className="rounded-xl border border-[#e6eaee] bg-white p-5 shadow-[0_2px_8px_rgba(30,48,66,.04)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-base font-bold text-[#202a34]">Account creation activity</h2><p className="mt-1 text-xs text-[#82909d]">New student assistant and supervisor accounts · last seven days</p></div><span className="rounded-md bg-[#003a6c] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Accounts</span></div>
          <div className="mt-7 flex h-48 items-end gap-3 border-b border-l border-[#e7ebef] px-3">{accountActivity.map((day) => <div key={day.key} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] font-semibold text-[#768391]">{day.count}</span><div className="flex w-full max-w-12 items-end" style={{ height: '72%' }}><div className="w-full rounded-t bg-[#003a6c] transition-all" style={{ height: `${Math.max(day.count ? 12 : 4, (day.count / maxDailyCount) * 100)}%` }} title={`${day.count} account${day.count === 1 ? '' : 's'}`} /></div><span className="pb-2 text-[10px] text-[#8793a0]">{day.label}</span></div>)}</div>
        </article>
        <article className="rounded-xl border border-[#e6eaee] bg-white p-5 shadow-[0_2px_8px_rgba(30,48,66,.04)] sm:p-6">
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-bold text-[#202a34]">Account health</h2><p className="mt-1 text-xs text-[#82909d]">Live active and disabled student/supervisor accounts</p></div><LockKeyhole size={18} className="text-[#003a6c]" /></div>
          <div className="mt-6 space-y-5">
            <HealthBar label="Active" value={overview?.activeAccounts || 0} total={totalUsers} color="bg-[#27ae7b]" />
            <HealthBar label="Disabled" value={overview?.disabledAccounts || 0} total={totalUsers} color="bg-[#e27369]" />
            <p className="rounded-lg bg-[#f6f8fa] p-3 text-xs leading-5 text-[#687583]">{(overview?.activeAccounts || 0).toLocaleString()} active and {(overview?.disabledAccounts || 0).toLocaleString()} disabled accounts across {(overview?.totalStudentAssistants || 0).toLocaleString()} student assistants and {(overview?.totalSupervisors || 0).toLocaleString()} supervisors.</p>
          </div>
        </article>
      </div>
      <article className="rounded-xl border border-[#e6eaee] bg-white shadow-[0_2px_8px_rgba(30,48,66,.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0f2] px-5 py-4"><div><h2 className="text-base font-bold text-[#202a34]">Recent request activity</h2><p className="mt-1 text-xs text-[#82909d]">Latest requests submitted during the last seven days</p></div><span className="rounded-md bg-[#003a6c] px-2.5 py-1 text-[10px] font-bold text-white">{analyticsRequests.length} requests</span></div>
        {analyticsError ? <p className="px-5 py-8 text-center text-sm text-[#82909d]">Request activity is unavailable.</p> : analyticsLoading && !analyticsRequests.length ? <p className="px-5 py-8 text-center text-sm text-[#82909d]">Loading request activity…</p> : analyticsRequests.length ? <ol className="divide-y divide-[#f0f2f4] px-5">{analyticsRequests.slice(0, 5).map((request) => <li key={`${request.requestType}-${request.rawId}`} className="flex flex-wrap items-start justify-between gap-3 py-4"><div className="min-w-0"><p className="text-xs font-bold text-[#344252]">{request.requestType} · {request.studentAssistant?.name || 'Unknown user'}</p><p className="mt-1 text-[11px] text-[#687583]">{request.reason || 'No reason provided'}</p></div><div className="flex shrink-0 items-center gap-3"><span className="text-[10px] text-[#929daa]">{request.requestDate ? new Date(request.requestDate).toLocaleDateString('en-GB') : '—'}</span><span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${String(request.status).toLowerCase().startsWith('pending') ? 'bg-[#fff5e5] text-[#a56b0b]' : String(request.status).toLowerCase() === 'approved' ? 'bg-[#e8f8f0] text-[#18875f]' : 'bg-[#f1f3f5] text-[#687583]'}`}>{request.status}</span></div></li>)}</ol> : <p className="px-5 py-8 text-center text-sm text-[#82909d]">No requests were submitted during the last seven days.</p>}
      </article>
    </section>
  );
}

function HealthBar({ label, value, total, color }) {
  return <div><div className="mb-2 flex justify-between text-xs"><span className="font-semibold text-[#526171]">{label}</span><span className="font-bold text-[#202a34]">{Number(value).toLocaleString()}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-[#edf0f3]"><div className={`h-full ${color}`} style={{ width: `${total ? (value / total) * 100 : 0}%` }} /></div></div>;
}
