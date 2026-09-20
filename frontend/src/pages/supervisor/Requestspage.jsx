import { useMemo, useState } from 'react';
import { CalendarDays, Check, ChevronDown, Clock3, Filter, Search, ShieldCheck, X, MessageSquare } from 'lucide-react';
import { PortalShell, StatusBadge, SUPERVISOR } from '@/components/portal/PortalComponents';
import { useRequests } from '@/context/RequestsContext';

const typeOptions = ['All Types', 'Shift Swap', 'Leave'];

function SupervisorStatus({ status }) {
  const studentStatus = status === 'Pending Review' ? 'Pending' : status;
  return <StatusBadge status={studentStatus} />;
}

function RequestRow({ request, onDecide }) {
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
      </td>
      <td className="py-4 pr-4"><SupervisorStatus status={request.status} /></td>
      <td className="py-4">
        {pending ? (
          <div className="flex gap-2">
            <button type="button" onClick={() => onDecide(request.id, 'Rejected')} className="focus-ring flex items-center gap-1.5 rounded-lg bg-[#d05b48] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#bd4c3a]" data-testid={`button-reject-${request.id}`}><X size={14}/>Reject</button>
            <button type="button" onClick={() => onDecide(request.id, 'Approved')} className="focus-ring flex items-center gap-1.5 rounded-lg bg-[#1f70d0] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#256fc6]" data-testid={`button-approve-${request.id}`}><Check size={14}/>Approve</button>
          </div>
        ) : <span className="text-xs font-semibold text-[#7890a4]">Decision recorded</span>}
      </td>
    </tr>
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
        <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-lg border border-[#e2eaf1] bg-white py-1 shadow-lg">
          {options.map((option) => <button key={option} type="button" onClick={() => { onChange(option); setOpen(false); }} className="block w-full px-4 py-2 text-left text-sm font-semibold text-[#385570] hover:bg-[#f4f8fb]">{option}</button>)}
        </div>
      </>}
    </div>
  );
}

export default function RequestsPage() {
  const { requests, updateRequestStatus } = useRequests();
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');

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
          <div><p className="mb-3 inline-flex rounded-full bg-[#162c4d] px-3 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-white">{SUPERVISOR.name}</p><h1 className="serif text-4xl text-[#10253f]">Operational Requests</h1><p className="mt-2 max-w-lg text-sm text-[#3d5a76]">Manage and process team shift swaps and leave applications submitted by student assistants.</p></div>
          <div className="flex shrink-0 rounded-lg bg-white p-1 shadow-sm">
            <button type="button" onClick={() => setTab('pending')} className={`focus-ring flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold ${tab === 'pending' ? 'bg-[#f4f8fb] text-[#162c4d]' : 'text-[#8ca0b2]'}`}>Awaiting Review <span className="grid size-5 place-items-center rounded-full bg-[#1f70d0] text-[10px] font-bold text-white">{pendingCount}</span></button>
            <button type="button" onClick={() => setTab('all')} className={`focus-ring rounded-md px-4 py-2 text-sm font-bold ${tab === 'all' ? 'bg-[#f4f8fb] text-[#162c4d]' : 'text-[#8ca0b2]'}`}>All Requests</button>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4 rounded-xl bg-[#f4f8fb] px-6 py-4"><span className="grid size-10 place-items-center rounded-full bg-[#e3f7ec] text-[#19885d]"><ShieldCheck size={18}/></span><div><p className="mono text-[10px] font-bold uppercase tracking-[.1em] text-[#7890a4]">Requests in shared workflow</p><p className="serif mt-0.5 text-2xl text-[#10253f]">{operationalRequests.length}</p></div></div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <label className="relative block w-full max-w-md" htmlFor="filter-requests"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8aa0b2]"/><input id="filter-requests" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by student name or request details..." className="focus-ring w-full rounded-lg border border-[#dce8f2] bg-white py-2.5 pl-9 pr-3 text-sm text-[#243e5b] outline-none placeholder:text-[#9baebe]"/></label>
          <div className="flex gap-3"><FilterDropdown label="Filter Type" icon={<Filter size={15}/>} options={typeOptions} value={type} onChange={setType}/><button type="button" className="focus-ring flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#385570] shadow-sm"><MessageSquare size={15}/> Live updates</button></div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-xl bg-[#f4f8fb]"><table className="w-full min-w-[920px] text-left"><thead><tr className="mono text-[10px] font-bold uppercase tracking-[.08em] text-[#8ca0b2]"><th className="px-6 pb-3 pt-5">Requester</th><th className="pb-3 pt-5">Type</th><th className="pb-3 pt-5">Request Details</th><th className="pb-3 pt-5">Status</th><th className="pb-3 pt-5">Actions</th></tr></thead><tbody className="[&>tr>td:first-child]:pl-6">{filtered.length ? filtered.map((request) => <RequestRow key={request.id} request={request} onDecide={updateRequestStatus}/>) : <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-[#7890a4]">No requests match your filters.</td></tr>}</tbody></table></div>
        <p className="mt-4 flex items-center gap-1.5 text-xs text-[#3d5a76]"><ShieldCheck size={13}/> Decisions are stored in the shared StudentAssist request workflow and immediately reflected on student pages.</p>
      </main>
    </PortalShell>
  );
}
