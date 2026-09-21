import { Plus } from 'lucide-react';
import { Link } from 'wouter';
import { PortalShell, StatusBadge} from '@/components/portal/PortalComponents';
import { useRequests } from '@/context/RequestsContext';

export default function HistoryPage() {
  const { requests } = useRequests();
  const stored = localStorage.getItem('session');
  const session = stored ? JSON.parse(stored) : null;
  const user = session?.user || {};
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User';
  return  <PortalShell><main className="px-5 py-7 md:px-8 md:py-8">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><p className="mb-3 inline-flex rounded-full bg-[#162c4d] px-3 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-white">Student Portal</p><h1 className="serif text-4xl text-[#10253f]">{fullName}&rsquo;s History</h1><p className="mt-2 max-w-lg text-sm text-[#52708b]">View all the requests you made.</p></div><Link href="/dashboard/request" className="focus-ring flex items-center gap-2 rounded-lg bg-[#1f70d0] px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_#1555aa]"><Plus size={16}/>New Request</Link></div>
    <div className="rounded-xl bg-[#f4f8fb] p-6"><h2 className="text-lg font-bold text-[#10253f]">All Leave Requests</h2><div className="overflow-x-auto"><table className="mt-5 w-full min-w-[560px] text-left text-sm"><thead><tr className="text-[10px] font-bold uppercase tracking-[.08em] text-[#8ca0b2]"><th className="pb-3">ID</th><th className="pb-3">Type</th><th className="pb-3">Status</th></tr></thead><tbody>{requests.map(req => <tr key={req.id} className="border-t border-[#e2eaf1]"><td className="py-3 font-semibold text-[#243e5b]">{req.id}</td><td className="py-3 text-[#52708b]">{req.type}</td><td className="py-3"><StatusBadge status={req.status}/></td></tr>)}</tbody></table></div></div>
  </main></PortalShell>;
}
