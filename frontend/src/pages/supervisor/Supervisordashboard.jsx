import { CalendarDays, ClipboardList, UsersRound, CheckCircle2, Clock3 } from 'lucide-react';
import { useLocation } from 'wouter';
import { PortalShell, StatusBadge } from '@/components/portal/PortalComponents';
import { useRequests } from '@/context/RequestsContext';

function StatCard({ label, value, icon }) {
  return <div className="rounded-xl bg-[#f4f8fb] p-5"><div className="flex items-center justify-between"><p className="mono text-[10px] font-bold uppercase tracking-[.1em] text-[#7890a4]">{label}</p><span className="text-[#1f70d0]">{icon}</span></div><p className="serif mt-2 text-4xl text-[#10253f]">{value}</p></div>;
}

export default function SupervisorDashboard() {
  const [, setLocation] = useLocation();
  const { requests } = useRequests();
  const pending = requests.filter((request) => request.status === 'Pending');
  const approved = requests.filter((request) => request.status === 'Approved');
  const assistants = new Set(requests.map((request) => request.name || 'Nicholas Mathebula')).size;

  return (
    <PortalShell supervisor>
      <main className="px-5 py-7 md:px-8 md:py-8">
        <p className="mb-3 inline-flex rounded-full bg-[#162c4d] px-3 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-white">Supervisor Portal</p>
        <h1 className="serif text-4xl text-[#10253f]">Supervisor dashboard</h1>
        <p className="mt-2 max-w-xl text-sm text-[#52708b]">Monitor incoming student assistant requests and keep operational decisions synchronized.</p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Pending Approvals" value={pending.length} icon={<Clock3 size={17}/>} />
          <StatCard label="Approved" value={approved.length} icon={<CheckCircle2 size={17}/>} />
          <StatCard label="Assistants" value={assistants} icon={<UsersRound size={17}/>} />
          <StatCard label="Total Requests" value={requests.length} icon={<ClipboardList size={17}/>} />
        </div>

        <div className="mt-8 flex items-center justify-between"><h2 className="mono text-xs font-bold uppercase tracking-[.14em] text-[#10253f]">Awaiting your review</h2><button type="button" onClick={() => setLocation('/supervisor/requests')} className="focus-ring mono text-xs font-bold uppercase tracking-[.08em] text-[#152d49] hover:text-[#1f70d0]">View all</button></div>
        <div className="mt-4 overflow-hidden rounded-xl bg-[#f4f8fb]">
          {pending.length ? pending.slice(0, 6).map((request) => (
            <button key={request.id} type="button" onClick={() => setLocation('/supervisor/requests')} className="flex w-full items-center justify-between gap-4 border-t border-[#e2eaf1] px-6 py-4 text-left first:border-t-0 hover:bg-white">
              <div><strong className="block text-sm font-bold text-[#162c4d]">{request.name || 'Nicholas Mathebula'}</strong><span className="mt-1 block text-xs text-[#7890a4]">{request.type} · {request.dateRange || 'Date not specified'}</span></div><StatusBadge status="Pending" />
            </button>
          )) : <div className="px-6 py-8 text-sm text-[#7890a4]">No new requests are awaiting your review.</div>}
        </div>

        <div className="mt-8 grid gap-6 border-t border-white/40 pt-8 lg:grid-cols-[1.3fr_1fr]">
          <div><h2 className="text-base font-bold italic text-[#10253f]">Operational note</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#243e5b]">Approvals and rejections made from Operational Requests are written to the shared request store, so the student dashboard and history reflect the latest decision.</p></div>
          <div className="flex items-center gap-4 rounded-xl bg-[#f4f8fb] px-5 py-4"><span className="grid size-11 shrink-0 place-items-center rounded-lg bg-white text-[#1f70d0]"><CalendarDays size={20}/></span><div><strong className="block text-sm font-bold text-[#162c4d]">Current workflow</strong><span className="mono mt-1 block text-[11px] font-bold uppercase tracking-[.06em] text-[#7890a4]">Student → Supervisor → Student</span></div></div>
        </div>
      </main>
    </PortalShell>
  );
}
