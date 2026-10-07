import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, Check, ChevronDown, Clock3, Filter, Search, ShieldCheck, X, RefreshCw, XCircle } from 'lucide-react';
import { PortalShell, StatusBadge} from '@/components/portal/PortalComponents';
import { useRequests } from '@/context/RequestsContext';

const typeOptions = ['All Types', 'Shift Swap', 'Leave'];

function SupervisorStatus({ status }) {
  const studentStatus = status === 'Pending Review' ? 'Pending' : status;
  return <StatusBadge status={studentStatus} />;
}

function RequestRow({ request, onApprove, onDecline, busy }) {
  const pending = request.status === 'Pending';
  return (
    <tr className="border-t border-[#e2eaf1] align-top">
      <td className="py-4 pr-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#dce5fb] text-xs font-bold text-[#1f70d0]">{request.initials || 'NM'}</span>
          <strong className="text-sm font-bold text-[#162c4d]">{request.name || 'Nicholas Mathebula'}</strong>
        </div>
      </td>
      <td className="py-4 pr-4"><span className="mono rounded bg-[#eef2f6] px-2 py-1 text-[10px] font-bold uppercase tracking-[.05em] text-[#52708b]">{request.type?.startsWith('Shift Swap') ? 'Shift Swap' : 'Leave'}</span></td>
      <td className="max-w-sm py-4 pr-4">
        {request.replacement && <p className="text-xs text-[#7890a4]">Replacement: <span className="font-semibold text-[#1f70d0]">{request.replacement}</span></p>}
        <p className="mt-1 text-sm italic leading-5 text-[#243e5b]">“{request.detail || request.reason || 'Request submitted by the student assistant.'}”</p>
        {request.dateRange && <p className="mt-1.5 flex items-center gap-1 text-[11px] text-[#7890a4]"><CalendarDays size={11} />{request.dateRange}</p>}
        <p className="mt-1 flex items-center gap-1 text-[11px] text-[#9aabb9]"><Clock3 size={11} />{request.filed || 'Filed recently'}</p>
        {request.status === 'Rejected' && request.declineReason && <p className="mt-2 rounded-md bg-[#fbe4e1] px-2.5 py-1.5 text-xs leading-5 text-[#8f3a2d]"><strong className="font-bold">Declined: </strong>{request.declineReason}</p>}
      </td>
      <td className="py-4 pr-4"><SupervisorStatus status={request.status} /></td>
      <td className="py-4">
        {pending ? (
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={() => onDecline(request)} className="focus-ring flex items-center gap-1.5 rounded-lg bg-[#d05b48] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#bd4c3a] disabled:opacity-50" data-testid={`button-reject-${request.id}`}><X size={14}/>Decline</button>
            <button type="button" disabled={busy} onClick={() => onApprove(request.id)} className="focus-ring flex items-center gap-1.5 rounded-lg bg-[#1f70d0] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#256fc6] disabled:opacity-50" data-testid={`button-approve-${request.id}`}><Check size={14}/>{busy ? 'Saving…' : 'Approve'}</button>
          </div>
        ) : <span className="text-xs font-semibold text-[#7890a4]">Decision recorded</span>}
      </td>
    </tr>
  );
}

function DeclineDialog({ request, onCancel, onConfirm }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const textareaRef = useRef(null);
  const isSwap = request.type?.startsWith('Shift Swap');

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onCancel]);

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setError('A reason is required to decline this request.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onConfirm(trimmed);
    } catch (err) {
      setError(err?.message || 'Could not decline the request. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}>
      <form onSubmit={submit} noValidate role="dialog" aria-modal="true" aria-labelledby="decline-dialog-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_18px_45px_rgba(43,81,119,.25)]" data-testid="dialog-decline">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#fbe4e1] text-[#d05b48]"><XCircle size={22} /></div>
        <h3 id="decline-dialog-title" className="serif mt-4 text-center text-2xl text-[#162c4d]">Decline {isSwap ? 'shift swap' : 'leave'} request</h3>
        <p className="mt-2 text-center text-sm text-[#60768c]">
          {request.name || 'The student'}{request.dateRange ? ` · ${request.dateRange}` : ''}. The student will be notified and will see your reason.
        </p>
        <label htmlFor="decline-reason" className="mt-5 block">
          <span className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#385570]">Reason for declining<em className="not-italic text-[#d05b48]">*</em></span>
          <textarea
            id="decline-reason"
            ref={textareaRef}
            rows={4}
            maxLength={300}
            value={reason}
            onChange={(e) => { setReason(e.target.value); if (error) setError(''); }}
            placeholder="e.g. Not enough staff coverage on these dates."
            className={`focus-ring w-full rounded-lg border bg-[#fbfdfe] px-3.5 py-3 text-sm text-[#243e5b] outline-none placeholder:text-[#9baebe] ${error ? 'border-[#d05b48]' : 'border-[#cfdee9] focus:border-[#1f70d0]'}`}
            data-testid="input-decline-reason"
          />
          <span className="mt-1 flex items-start justify-between gap-3 text-xs">
            <span className="font-medium text-[#c54f43]" role="alert" data-testid="error-decline-reason">{error}</span>
            <span className="shrink-0 text-[#9aabb9]">{reason.length}/300</span>
          </span>
        </label>
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onCancel} disabled={busy} className="focus-ring flex-1 rounded-lg border border-[#cfdee9] bg-white px-4 py-2.5 text-sm font-bold text-[#385570] hover:bg-[#f4f8fb] disabled:opacity-50" data-testid="button-cancel-decline">Cancel</button>
          <button type="submit" disabled={busy} className="focus-ring flex-1 rounded-lg bg-[#d05b48] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#bd4c3a] disabled:opacity-60" data-testid="button-confirm-decline">{busy ? 'Declining…' : 'Decline request'}</button>
        </div>
      </form>
    </div>
  );
}

function FilterDropdown({ label, icon, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className={`focus-ring flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm ${value ? 'bg-[#e7f1fa] text-[#1f70d0]' : 'bg-white text-[#385570]'}`}>
        {icon}{value || label}<ChevronDown size={14} className={open ? 'rotate-180' : ''}/>
      </button>
      {open && <>
        <button type="button" className="fixed inset-0 z-10" aria-label="Close filter" onClick={() => setOpen(false)} />
        <div className="portal-dropdown absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-lg border border-[#e2eaf1] bg-white py-1 shadow-lg">
          {options.map((option) => <button key={option} type="button" onClick={() => { onChange(option); setOpen(false); }} className="portal-dropdown-option block w-full px-4 py-2 text-left text-sm font-semibold text-[#385570] hover:bg-[#f4f8fb]">{option}</button>)}
        </div>
      </>}
    </div>
  );
}

export default function RequestsPage() {
  const { requests, updateRequestStatus, refresh, loading } = useRequests();
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const stored = localStorage.getItem('session');
  const session = stored ? JSON.parse(stored) : null;
  const user = session?.user || {};
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Supervisor';
  const [refreshing, setRefreshing] = useState(false);
  const [declineTarget, setDeclineTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');

  const handleApprove = async (id) => {
    setBusyId(id);
    setActionError('');
    try {
      await updateRequestStatus(id, 'Approved');
    } catch (err) {
      setActionError(err?.message || 'Could not approve the request.');
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmDecline = async (reason) => {
    await updateRequestStatus(declineTarget.id, 'Rejected', reason);
    setDeclineTarget(null);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const operationalRequests = useMemo(() => requests.map((request) => ({
    ...request,
    detail: request.detail || request.reason,
  })), [requests]);

  const pendingCount = operationalRequests.filter((request) => request.status === 'Pending').length;
  const filtered = operationalRequests.filter((request) => {
    if (tab === 'pending' && request.status !== 'Pending') return false;
    if (type && type !== 'All Types') {
      const requestType = request.type?.startsWith('Shift Swap') ? 'Shift Swap' : 'Leave';
      if (requestType !== type) return false;
    }
    const q = search.trim().toLowerCase();
    const haystack = [
      request.name,
      request.email,
      request.type,
      request.detail,
      request.replacement,
      request.reason,
      request.dateRange,
    ].filter(Boolean).join(' ').toLowerCase();
    if (q && !haystack.includes(q)) return false;
    return true;
  });

  return (
    <PortalShell supervisor>
      <main className="px-5 py-7 md:px-8 md:py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="mb-3 inline-flex rounded-full bg-[#162c4d] px-3 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-white">{fullName}</p><h1 className="serif text-4xl text-[#10253f]">Operational Requests</h1><p className="mt-2 max-w-lg text-sm text-[#3d5a76] dark-readable-text">Manage and process team shift swaps and leave applications submitted by student assistants.</p></div>
          <div className="flex shrink-0 rounded-lg bg-white p-1 shadow-sm">
            <button type="button" onClick={() => setTab('pending')} className={`focus-ring flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold ${tab === 'pending' ? 'bg-[#f4f8fb] text-[#162c4d]' : 'text-[#8ca0b2]'}`}>Awaiting Review <span className="grid size-5 place-items-center rounded-full bg-[#1f70d0] text-[10px] font-bold text-white">{pendingCount}</span></button>
            <button type="button" onClick={() => setTab('all')} className={`focus-ring rounded-md px-4 py-2 text-sm font-bold ${tab === 'all' ? 'bg-[#f4f8fb] text-[#162c4d]' : 'text-[#8ca0b2]'}`}>All Requests</button>
           <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="focus-ring flex items-center gap-2 rounded-lg border border-[#dce8f2] bg-white px-4 py-2.5 text-sm font-semibold text-[#385570] shadow-sm hover:bg-[#f4f8fb] disabled:opacity-50"
              data-testid="button-refresh-requests"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {actionError && <div className="mt-4 rounded-lg bg-[#fbe4e1] px-4 py-2.5 text-sm font-semibold text-[#d05b48]" role="alert">{actionError}</div>}

        <div className="mt-6 flex items-center gap-4 rounded-xl bg-[#f4f8fb] px-6 py-4"><span className="grid size-10 place-items-center rounded-full bg-[#e3f7ec] text-[#19885d]"><ShieldCheck size={18}/></span><div><p className="mono text-[10px] font-bold uppercase tracking-[.1em] text-[#7890a4]">Requests in shared workflow</p><p className="serif mt-0.5 text-2xl text-[#10253f]">{operationalRequests.length}</p></div></div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <label className="relative block w-full max-w-md" htmlFor="filter-requests"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8aa0b2]"/><input id="filter-requests" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by student name or request details..." className="focus-ring w-full rounded-lg border border-[#dce8f2] bg-white py-2.5 pl-9 pr-3 text-sm text-[#243e5b] outline-none placeholder:text-[#9baebe]"/></label>
          <div className="flex gap-3"><FilterDropdown label="Filter Type" icon={<Filter size={15}/>} options={typeOptions} value={type} onChange={setType}/></div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-xl bg-[#f4f8fb]"><table className="w-full min-w-[920px] text-left"><thead><tr className="mono text-[10px] font-bold uppercase tracking-[.08em] text-[#8ca0b2]"><th className="px-6 pb-3 pt-5">Requester</th><th className="pb-3 pt-5">Type</th><th className="pb-3 pt-5">Request Details</th><th className="pb-3 pt-5">Status</th><th className="pb-3 pt-5">Actions</th></tr></thead><tbody className="[&>tr>td:first-child]:pl-6">{filtered.length ? filtered.map((request) => <RequestRow key={request.id} request={request} onApprove={handleApprove} onDecline={setDeclineTarget} busy={busyId === request.id}/>) : <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-[#7890a4]">No requests match your filters.</td></tr>}</tbody></table></div>
              </main>
      {declineTarget && <DeclineDialog request={declineTarget} onCancel={() => setDeclineTarget(null)} onConfirm={handleConfirmDecline} />}
    </PortalShell>
  );
}
