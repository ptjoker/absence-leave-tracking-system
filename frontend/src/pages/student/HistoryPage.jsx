import { useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { PortalShell, StatusBadge} from '@/components/portal/PortalComponents';
import RequestDetailsDialog from '@/components/portal/RequestDetailsDialog';
import { useRequests } from '@/context/RequestsContext';
import { getSession } from '@/lib/session';

export default function HistoryPage() {
  const [, setLocation] = useLocation();
  const { requests, cancelRequest, decideShiftSwap, loading: requestsLoading } = useRequests();
  const [requestDetails, setRequestDetails] = useState(null);
  const [requestToCancel, setRequestToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [swapDecisionBusy, setSwapDecisionBusy] = useState(null);
  const [swapDecisionError, setSwapDecisionError] = useState('');
  const session = getSession();
  const user = session?.user || {};
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User';
  const incomingSwapOffers = requests.filter((request) =>
    request.workflow === 'shiftSwap'
    && request.isSwapRecipient
    && request.workflowStatus === 'pending_colleague'
  );

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

  const handleSwapDecision = async (request, decision) => {
    if (swapDecisionBusy) return;
    setSwapDecisionBusy(request.rawId);
    setSwapDecisionError('');
    try {
      await decideShiftSwap(request.rawId, decision);
    } catch (error) {
      setSwapDecisionError(error.message || 'Could not respond to this shift swap offer.');
    } finally {
      setSwapDecisionBusy(null);
    }
  };

  return (
    <PortalShell>
      <main className="px-5 py-7 md:px-8 md:py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-3 inline-flex rounded-full bg-[#162c4d] px-3 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-white">Library Log</p>
            <h1 className="serif text-4xl text-[#10253f]">{fullName}&rsquo;s History</h1>
            <p className="mt-2 max-w-lg text-sm text-[#52708b]">View requests you made and shift swap offers sent to you.</p>
          </div>
          <Link href="/dashboard/request" className="focus-ring flex items-center gap-2 rounded-lg bg-[#1f70d0] px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_#1555aa]">
            <Plus size={16}/>New Request
          </Link>
        </div>
        {incomingSwapOffers.length > 0 && (
          <section className="mb-6 rounded-xl border border-[#b9d7ef] bg-white p-5 shadow-[0_3px_8px_rgba(53,91,121,.08)]" aria-labelledby="incoming-swap-offers-heading">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 id="incoming-swap-offers-heading" className="text-lg font-bold text-[#10253f]">Shift swap offers sent to you</h2>
                <p className="mt-1 text-sm text-[#52708b]">Review each offer and accept or decline. Accepted offers still need supervisor approval.</p>
              </div>
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#e7f1fa] text-sm font-bold text-[#1f70d0]">{incomingSwapOffers.length}</span>
            </div>
            <div className="mt-4 space-y-3">
              {incomingSwapOffers.map((offer) => (
                <article key={offer.id} className="rounded-lg border border-[#e2eaf1] bg-[#fbfdfe] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-[#243e5b]">Offer from {offer.name}</p>
                      <p className="mt-1 text-sm text-[#52708b]">{offer.dateRange}</p>
                      <p className="mt-1 text-sm text-[#52708b]">Your shift: {offer.colleagueShiftTime || '—'} · Offered reason: {offer.reason || 'No reason provided.'}</p>
                    </div>
                    <StatusBadge status={offer.status}/>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => setRequestDetails(offer)} className="focus-ring rounded-lg border border-[#d0e0ea] bg-white px-3 py-2 text-xs font-bold text-[#1f70d0] hover:bg-[#e7f1fa]">View offer</button>
                    <button type="button" onClick={() => handleSwapDecision(offer, 'accept')} disabled={swapDecisionBusy !== null} className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-[#1f70d0] px-3 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#1555aa] disabled:opacity-60">
                      <Check size={14}/>{swapDecisionBusy === offer.rawId ? 'Saving…' : 'Accept'}
                    </button>
                    <button type="button" onClick={() => handleSwapDecision(offer, 'decline')} disabled={swapDecisionBusy !== null} className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-[#d05b48] px-3 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#b84233] disabled:opacity-60">
                      <X size={14}/>Decline
                    </button>
                  </div>
                  {swapDecisionError && swapDecisionBusy === null && <p role="alert" className="mt-2 text-xs font-semibold text-[#c54f43]">{swapDecisionError}</p>}
                </article>
              ))}
            </div>
          </section>
        )}
        <div className="bg-[#f4f8fb] p-6">
          <h2 className="text-lg font-bold text-[#10253f]">All Requests</h2>
          {requestsLoading ? (
            <p className="mt-4 rounded-lg bg-white px-4 py-6 text-center text-sm text-[#7890a4]">Loading your requests...</p>
          ) : requests.length === 0 ? (
            <p className="mt-4 rounded-lg bg-white px-4 py-6 text-center text-sm text-[#7890a4]">There are no requests or shift swap offers to show.</p>
          ) : <div className="overflow-x-auto bg-white px-4">
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
                    <td className="py-3 text-[#52708b]">{req.workflow === 'shiftSwap'
                      ? req.isSwapRecipient ? `Shift swap offer from ${req.name}` : `Shift swap offer to ${req.replacement}`
                      : req.type}</td>
                    <td className="py-3"><StatusBadge status={req.status}/></td>
                    <td className="py-3">
                      {req.workflow === 'shiftSwap' && req.isSwapRecipient ? (
                        <button type="button" onClick={() => setRequestDetails(req)} className="focus-ring rounded-lg border border-[#d0e0ea] bg-white px-3 py-2 text-xs font-bold text-[#1f70d0] hover:bg-[#e7f1fa]">View offer</button>
                      ) : req.status === 'Pending' && req.workflow !== 'shiftSwap' ? (
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
          </div>}
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
