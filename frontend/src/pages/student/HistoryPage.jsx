import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { PortalShell, StatusBadge} from '@/components/portal/PortalComponents';
import RequestDetailsDialog from '@/components/portal/RequestDetailsDialog';
import { useRequests } from '@/context/RequestsContext';

export default function HistoryPage() {
  const [, setLocation] = useLocation();
  const { requests, cancelRequest } = useRequests();
  const [requestDetails, setRequestDetails] = useState(null);
  const [requestToCancel, setRequestToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const stored = localStorage.getItem('session');
  const session = stored ? JSON.parse(stored) : null;
  const user = session?.user || {};
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User';

  const handleEdit = (request) => {
    const targetPath = String(request.type || '').toLowerCase().includes('shift swap')
      ? '/dashboard/shift-swap'
      : '/dashboard/request';
    setLocation(`${targetPath}?edit=${encodeURIComponent(request.rawId)}&from=history`);
  };

  const handleCancel = async () => {
    if (!requestToCancel || cancelling) return;
    setCancelling(true);
    setCancelError('');
    try {
      await cancelRequest(requestToCancel.id);
      setRequestToCancel(null);
    } catch (error) {
      setCancelError(error.message || 'Could not cancel this request. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <PortalShell>
      <main className="px-5 py-7 md:px-8 md:py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-3 inline-flex rounded-full bg-[#162c4d] px-3 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-white">Student Portal</p>
            <h1 className="serif text-4xl text-[#10253f]">{fullName}&rsquo;s History</h1>
            <p className="mt-2 max-w-lg text-sm text-[#52708b]">View all the requests you made.</p>
          </div>
          <Link href="/dashboard/request" className="focus-ring flex items-center gap-2 rounded-lg bg-[#1f70d0] px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_#1555aa]">
            <Plus size={16}/>New Request
          </Link>
        </div>
        <div className="rounded-xl bg-[#f4f8fb] p-6">
          <h2 className="text-lg font-bold text-[#10253f]">All Requests</h2>
          <div className="overflow-x-auto">
            <table className="mt-5 w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-[.08em] text-[#8ca0b2]">
                  <th className="pb-3">Reference</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-t border-[#e2eaf1]">
                    <td className="py-3 font-semibold text-[#243e5b]">
                      <button type="button" onClick={() => setRequestDetails(req)} className="focus-ring rounded font-semibold text-[#1f70d0] hover:text-[#1555aa] hover:underline">{req.id}</button>
                    </td>
                    <td className="py-3 text-[#52708b]">{req.type}</td>
                    <td className="py-3"><StatusBadge status={req.status}/></td>
                    <td className="py-3">
                      {req.status === 'Pending' ? (
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => handleEdit(req)} className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-[#1f70d0] px-3 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#1555aa]">
                            <Pencil size={14}/>Edit
                          </button>
                          <button type="button" onClick={() => { setCancelError(''); setRequestToCancel(req); }} className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-[#d05b48] px-3 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#b84233]">
                            <Trash2 size={14}/>Cancel
                          </button>
                        </div>
                      ) : <span className="text-xs font-semibold text-[#7890a4]">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      {requestDetails && <RequestDetailsDialog request={requestDetails} onClose={() => setRequestDetails(null)} />}
      {requestToCancel && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !cancelling) setRequestToCancel(null);
          }}
        >
          <section className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-[0_18px_45px_rgba(43,81,119,.25)]" role="alertdialog" aria-modal="true" aria-labelledby="history-cancel-title">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#fbe4e1] text-[#d05b48]"><Trash2 size={22}/></div>
            <h3 id="history-cancel-title" className="serif mt-4 text-center text-2xl text-[#162c4d]">Cancel request?</h3>
            <p className="mt-2 text-center text-sm text-[#60768c]">
              Cancel {requestToCancel.id}? It will remain in your request history with Cancelled status.
            </p>
            {cancelError && <p role="alert" className="mt-3 text-center text-sm font-semibold text-[#c54f43]">{cancelError}</p>}
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setRequestToCancel(null)} disabled={cancelling} className="focus-ring flex-1 rounded-lg border border-[#cfdee9] bg-white px-4 py-2.5 text-sm font-bold text-[#385570] transition-colors hover:bg-[#f4f8fb] disabled:cursor-not-allowed disabled:opacity-60">Keep request</button>
              <button type="button" onClick={handleCancel} disabled={cancelling} className="focus-ring flex-1 rounded-lg bg-[#d05b48] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#b84233] disabled:cursor-not-allowed disabled:opacity-60">{cancelling ? 'Cancelling…' : 'Yes, cancel'}</button>
            </div>
          </section>
        </div>
      )}
    </PortalShell>
  );
}
