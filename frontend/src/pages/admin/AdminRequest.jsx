import { useEffect, useState } from 'react';
import { Activity, CalendarDays, ChevronDown, Clock3, Download, FileText, Filter, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { exportAdminRequestsReport } from '@/lib/reportExport';

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : format(date, 'd MMM yyyy, HH:mm');
}

function Detail({ label, children }) {
  return <div className="rounded-lg bg-[#f4f6f8] p-4"><dt className="text-[10px] font-bold uppercase tracking-[.08em] text-[#82909d]">{label}</dt><dd className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#344252]">{children || '—'}</dd></div>;
}

function RequestDetailsDialog({ request, onClose }) {
  useEffect(() => {
    const onKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  if (!request) return null;
  const details = request.details || {};
  const isShiftSwap = request.requestType === 'Shift Swap';
  const originalShift = details.originalShift || {};
  const proposedShift = details.proposedShift || {};

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="my-auto w-full max-w-2xl rounded-2xl bg-white p-6 shadow-[0_18px_45px_rgba(43,81,119,.25)] sm:p-8" role="dialog" aria-modal="true" aria-labelledby="admin-request-details-title" data-testid="dialog-admin-request-details">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#1473e6]">Request details</p><h2 id="admin-request-details-title" className="mt-1 text-2xl font-bold text-[#202a34]">{request.id}</h2><p className="mt-1 text-sm text-[#687583]">{request.requestType}</p></div>
          <button type="button" onClick={onClose} aria-label="Close request details" className="focus-ring rounded-lg p-2 text-[#60768c] hover:bg-[#f4f8fb]" data-testid="button-close-admin-request-details"><X size={20} /></button>
        </div>
        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          <Detail label="Status">{request.status}</Detail>
          <Detail label="Submitted">{formatDateTime(request.requestDate)}</Detail>
          <Detail label="Requested date">{request.requestedDate}</Detail>
          <Detail label="Assistant name">{request.studentAssistant?.name}</Detail>
          <Detail label="Student number">{request.studentAssistant?.studentNumber}</Detail>
          <Detail label="Email">{request.studentAssistant?.email}</Detail>
          <Detail label="Reason">{request.reason || 'No reason provided.'}</Detail>
          {isShiftSwap ? <>
            <Detail label="Original shift">{[originalShift.date, [originalShift.start, originalShift.end].filter(Boolean).join(' - ')].filter(Boolean).join(' · ')}</Detail>
            <Detail label="Proposed shift">{[proposedShift.date, [proposedShift.start, proposedShift.end].filter(Boolean).join(' - ')].filter(Boolean).join(' · ')}</Detail>
            <Detail label="Replacement assistant">{details.replacementStudentAssistant}</Detail>
            <Detail label="Replacement response">{details.replacementResponse}</Detail>
          </> : <>
            <Detail label="Leave type">{details.leaveType}</Detail>
            <Detail label="Leave dates">{details.dates}</Detail>
            <Detail label="Replacement">{details.replacement}</Detail>
          </>}
          <Detail label="Supervisor decision">{request.supervisorDecision?.decision || 'No decision recorded'}</Detail>
          <Detail label="Supervisor">{request.supervisorDecision?.supervisor}</Detail>
          <Detail label="Decision date">{formatDateTime(request.supervisorDecision?.decisionDate)}</Detail>
          <Detail label="Supervisor comments">{request.supervisorDecision?.comments}</Detail>
          <Detail label="Supporting document">{request.supportingDocument ? `${request.supportingDocument.fileName || 'Attachment'} · ${request.supportingDocument.contentType || 'Unknown type'}${request.supportingDocument.size ? ` · ${(request.supportingDocument.size / 1024).toFixed(1)} KB` : ''}` : 'No attachment'}</Detail>
          <div className="rounded-lg bg-[#f4f6f8] p-4 sm:col-span-2">
            <dt className="text-[10px] font-bold uppercase tracking-[.08em] text-[#82909d]">Approval history</dt>
            {request.approvalHistory?.length ? <ol className="mt-3 space-y-2">{request.approvalHistory.map((item, index) => <li key={`${item.status}-${index}`} className="flex flex-wrap justify-between gap-2 border-t border-[#e1e5e9] pt-2 text-sm"><span className="font-semibold text-[#344252]">{item.status}</span><span className="text-[#687583]">{formatDateTime(item.date)}</span></li>)}</ol> : <dd className="mt-2 text-sm text-[#687583]">No approval history available.</dd>}
          </div>
        </dl>
        <div className="mt-6 flex justify-end"><button type="button" onClick={onClose} className="focus-ring rounded-md border border-[#d7dde3] px-4 py-2.5 text-xs font-bold text-[#526171] hover:bg-[#f6f8fa]">Close</button></div>
      </section>
    </div>
  );
}

export default function AdminRequest({
  requests, loading, error, search, setSearch, status, setStatus, type, setType,
  from, setFrom, to, setTo, onRefresh,
}) {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);

  const filters = { q: search.trim(), status, type, from, to };
  const exportRequests = (formatType) => {
    exportAdminRequestsReport(formatType, requests, filters);
    setExportOpen(false);
  };
  const pendingCount = requests.filter((request) => String(request.status || '').toLowerCase().startsWith('pending')).length;
  const leaveCount = requests.filter((request) => request.requestType === 'Leave').length;
  const swapCount = requests.filter((request) => request.requestType === 'Shift Swap').length;

  return (
    <section id="requests" className="rounded-xl border border-[#e6eaee] bg-white p-5 shadow-[0_2px_8px_rgba(30,48,66,.04)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-semibold text-[#75808c]"></p><h1 className="mt-2 text-2xl font-bold tracking-tight text-[#202a34]">All requests</h1><p className="mt-1 text-sm text-[#82909d]">Review leave and shift-swap requests submitted by student assistants.</p></div>
        <div className="relative flex flex-wrap gap-2">
          <button type="button" onClick={() => exportRequests('csv')} disabled={!requests.length} className="focus-ring inline-flex items-center gap-2 rounded-md border border-[#d7dde3] bg-white px-3 py-2 text-xs font-bold text-[#3f4b58] hover:bg-[#f6f8fa] disabled:cursor-not-allowed disabled:opacity-50"><Download size={14} />Export CSV</button>
          <button type="button" onClick={() => setExportOpen((open) => !open)} disabled={!requests.length} className="focus-ring inline-flex items-center gap-2 rounded-md bg-[#1473e6] px-3 py-2 text-xs font-bold text-white hover:bg-[#095fc5] disabled:cursor-not-allowed disabled:opacity-50"><FileText size={14} />Generate report<ChevronDown size={14} /></button>
          {exportOpen && <div className="absolute right-0 top-11 z-30 w-56 rounded-lg border border-[#d7dde3] bg-white p-2 shadow-xl"><p className="px-2 py-1.5 text-xs font-bold text-[#526171]">Choose report format</p><button type="button" onClick={() => exportRequests('pdf')} className="focus-ring flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs font-semibold text-[#344252] hover:bg-[#f4f6f8]"><FileText size={14} />PDF report</button></div>}
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Matching requests" value={requests.length} note="Based on selected filters" icon={FileText} tint="bg-[#eaf3ff] text-[#1473e6]" />
        <Metric label="Pending" value={pendingCount} note="Awaiting a decision" icon={Clock3} tint="bg-[#fff5e5] text-[#c17a13]" />
        <Metric label="Leave requests" value={leaveCount} note="Leave submissions" icon={CalendarDays} tint="bg-[#f1ecff] text-[#7450c8]" />
        <Metric label="Shift swaps" value={swapCount} note="Shift-swap submissions" icon={Activity} tint="bg-[#e8f8f0] text-[#15966a]" />
      </div>
      <div className="mt-5 grid gap-3 rounded-lg bg-[#f7f8f9] p-3 sm:grid-cols-2 xl:grid-cols-6">
        <label className="relative sm:col-span-2" htmlFor="admin-request-search"><Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8b96a1]" /><input id="admin-request-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search user, type, reason…" className="focus-ring w-full rounded-md border border-[#d7dde3] bg-white py-2.5 pl-9 pr-3 text-xs outline-none focus:border-[#1473e6]" /></label>
        <label className="sr-only" htmlFor="admin-request-status">Filter by status</label><select id="admin-request-status" value={status} onChange={(event) => setStatus(event.target.value)} className="focus-ring rounded-md border border-[#d7dde3] bg-white px-3 py-2.5 text-xs text-[#344252]"><option value="">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="declined">Declined</option><option value="cancelled">Cancelled</option></select>
        <label className="sr-only" htmlFor="admin-request-type">Filter by request type</label><select id="admin-request-type" value={type} onChange={(event) => setType(event.target.value)} className="focus-ring rounded-md border border-[#d7dde3] bg-white px-3 py-2.5 text-xs text-[#344252]"><option value="">All types</option><option value="leave">Leave</option><option value="shift-swap">Shift swap</option></select>
        <label className="flex items-center gap-2 rounded-md border border-[#d7dde3] bg-white px-2.5 text-[10px] font-semibold text-[#82909d]">From<input aria-label="Requests created from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="min-w-0 flex-1 py-2 text-xs text-[#344252] outline-none" /></label>
        <label className="flex items-center gap-2 rounded-md border border-[#d7dde3] bg-white px-2.5 text-[10px] font-semibold text-[#82909d]">To<input aria-label="Requests created to" type="date" value={to} onChange={(event) => setTo(event.target.value)} className="min-w-0 flex-1 py-2 text-xs text-[#344252] outline-none" /></label>
        <button type="button" onClick={() => { setSearch(''); setStatus(''); setType(''); setFrom(''); setTo(''); }} className="focus-ring inline-flex items-center justify-center gap-1.5 rounded-md border border-[#d7dde3] bg-white px-3 py-2 text-xs font-semibold text-[#526171] hover:bg-[#f6f8fa]"><Filter size={13} />Reset filters</button>
      </div>
      {error && <div role="alert" className="mt-4 rounded-md border border-[#f1c6c3] bg-[#fff1f0] px-3 py-2.5 text-sm font-semibold text-[#b84233]">{error}</div>}
      <div className="mt-4 flex justify-end"><button type="button" onClick={onRefresh} disabled={loading} className="focus-ring inline-flex items-center gap-2 rounded-md border border-[#d7dde3] px-3 py-2 text-xs font-semibold text-[#526171] hover:bg-[#f6f8fa] disabled:opacity-60"><Activity size={14} />Refresh requests</button></div>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[1050px] text-left text-sm">
          <thead><tr className="border-y border-[#e8ecef] bg-[#f7f8f9] text-[10px] font-bold uppercase tracking-[.08em] text-[#82909d]"><th className="px-3 py-3">Request</th><th className="px-3 py-3">Student assistant</th><th className="px-3 py-3">Submitted</th><th className="px-3 py-3">Requested date</th><th className="px-3 py-3">Reason / details</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Details</th></tr></thead>
          <tbody>
            {requests.map((request) => <tr key={`${request.requestType}-${request.rawId}`} className="border-b border-[#edf0f2] align-top last:border-0 hover:bg-[#fafbfc]">
              <td className="px-3 py-3"><span className="font-semibold text-[#344252]">{request.id}</span><span className="mt-1 block text-[11px] text-[#82909d]">{request.requestType}</span></td>
              <td className="px-3 py-3"><span className="font-semibold text-[#344252]">{request.studentAssistant?.name || 'Unknown'}</span><span className="mt-1 block text-[11px] text-[#82909d]">{request.studentAssistant?.studentNumber || 'No student number'}</span><span className="mt-0.5 block text-[11px] text-[#82909d]">{request.studentAssistant?.email || 'No email'}</span></td>
              <td className="whitespace-nowrap px-3 py-3 text-xs text-[#687583]">{formatDateTime(request.requestDate)}</td><td className="px-3 py-3 text-xs text-[#687583]">{request.requestedDate || '—'}</td>
              <td className="max-w-sm px-3 py-3 text-xs text-[#526171]"><p>{request.reason || 'No reason provided'}</p><p className="mt-1 text-[11px] text-[#82909d]">{request.requestType === 'Shift Swap' ? `Replacement: ${request.details?.replacementStudentAssistant || '—'}` : `${request.details?.leaveType || 'Leave'}${request.details?.replacement ? ` · Replacement: ${request.details.replacement}` : ''}`}</p></td>
              <td className="px-3 py-3"><span className={`rounded px-2 py-1 text-[9px] font-bold uppercase ${String(request.status).toLowerCase().startsWith('pending') ? 'bg-[#fff5e5] text-[#a56b0b]' : String(request.status).toLowerCase() === 'approved' ? 'bg-[#e8f8f0] text-[#18875f]' : 'bg-[#f1f3f5] text-[#687583]'}`}>{request.status}</span></td>
              <td className="px-3 py-3 text-xs"><button type="button" onClick={() => setSelectedRequest(request)} className="focus-ring whitespace-nowrap rounded-md border border-[#d7dde3] bg-white px-3 py-2 text-xs font-bold text-[#1473e6] hover:bg-[#eaf3ff]" data-testid={`button-view-admin-request-${request.id}`}>View details</button></td>
            </tr>)}
            {!loading && !requests.length && <tr><td colSpan={7} className="py-10 text-center text-sm text-[#82909d]">{error ? 'Requests could not be loaded.' : 'No requests match these filters.'}</td></tr>}
            {loading && <tr><td colSpan={7} className="py-10 text-center text-sm text-[#82909d]">Loading requests…</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-[#82909d]">Showing {requests.length} request{requests.length === 1 ? '' : 's'}. Date filters apply to when each request was submitted.</p>
      <RequestDetailsDialog request={selectedRequest} onClose={() => setSelectedRequest(null)} />
    </section>
  );
}

function Metric({ label, value, note, icon: Icon, tint }) {
  return <article className="rounded-xl border border-[#e6eaee] bg-white p-5 shadow-[0_2px_8px_rgba(30,48,66,.04)]"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[.08em] text-[#75808c]">{label}</p><p className="mt-2 text-3xl font-bold tracking-tight text-[#202a34]">{Number(value || 0).toLocaleString()}</p></div><span className={`grid size-9 place-items-center rounded-lg ${tint}`}><Icon size={18} /></span></div><p className="mt-3 text-xs text-[#8b96a1]">{note}</p></article>;
}
