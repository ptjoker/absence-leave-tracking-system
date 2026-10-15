import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Clock3, Download, Eye, FileText, Hash, X } from 'lucide-react';
import { StatusBadge } from '@/components/portal/PortalComponents';
import { useRequests } from '@/context/RequestsContext';

function formatSubmittedDate(value) {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Detail({ icon: Icon, label, children }) {
  return (
    <div className="rounded-lg bg-[#f4f8fb] p-4">
      <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.08em] text-[#7890a4]">
        <Icon size={14} />
        {label}
      </dt>
      <dd className="mt-2 break-words text-sm font-semibold leading-6 text-[#243e5b]">{children || '—'}</dd>
    </div>
  );
}

export default function RequestDetailsDialog({
  request,
  onClose,
  supervisor = false,
  focusDocument = false,
  onApprove,
  onDecline,
  busy = false,
  error = '',
}) {
  const { getRequestDocument } = useRequests();
  const [documentData, setDocumentData] = useState(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentError, setDocumentError] = useState('');
  const [documentRequested, setDocumentRequested] = useState(false);
  const documentSectionRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [busy, onClose]);

  useEffect(() => {
    let cancelled = false;
    setDocumentData(null);
    setDocumentError('');
    if (focusDocument) setDocumentRequested(true);
    if (!documentRequested || !request?.rawId) return undefined;

    setDocumentLoading(true);
    getRequestDocument(request.rawId)
      .then((document) => {
        if (!cancelled) setDocumentData(document);
      })
      .catch((error) => {
        if (!cancelled) setDocumentError(error.message || 'Could not load the supporting document.');
      })
      .finally(() => {
        if (!cancelled) setDocumentLoading(false);
      });

    return () => { cancelled = true; };
  }, [getRequestDocument, request?.rawId, documentRequested, focusDocument]);

  useEffect(() => {
    if (focusDocument) {
      documentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [focusDocument, documentLoading, documentData, documentError]);

  if (!request) return null;
  const pending = request.status === 'Pending';
  const reason = request.reason || request.detail;
  const reference = request.id || (request.rawId ? `REQ-${request.rawId}` : 'Not available');
  const submitted = formatSubmittedDate(request.createdAt || request.created_at || request.submittedAt);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        className="my-auto w-full max-w-xl rounded-2xl bg-white p-6 shadow-[0_18px_45px_rgba(43,81,119,.25)] sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-details-title"
        data-testid="dialog-request-details"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#1f70d0]">Request details</p>
            <h2 id="request-details-title" className="serif mt-1 text-2xl text-[#162c4d]">{reference}</h2>
            {supervisor && <p className="mt-1 text-sm text-[#60768c]">{request.name || 'Student assistant'}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close request details"
            className="focus-ring rounded-lg p-2 text-[#60768c] transition-colors hover:bg-[#f4f8fb] hover:text-[#162c4d] disabled:opacity-50"
            data-testid="button-close-request-details"
          >
            <X size={20} />
          </button>
        </div>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          <Detail icon={FileText} label="Type">{request.type}</Detail>
          <div className="rounded-lg bg-[#f4f8fb] p-4">
            <dt className="text-xs font-bold uppercase tracking-[.08em] text-[#7890a4]">Status</dt>
            <dd className="mt-2"><StatusBadge status={request.status} /></dd>
          </div>
          <Detail icon={CalendarDays} label="Dates">{request.dateRange}</Detail>
          <Detail icon={Clock3} label="Submitted">{submitted}</Detail>
          {request.workflow === 'shiftSwap' && (
            <>
              <Detail icon={Clock3} label="Requester shift hours">{request.requesterShiftTime}</Detail>
              <Detail icon={Clock3} label="Offered shift hours">{request.colleagueShiftTime}</Detail>
            </>
          )}
          {supervisor && (
            <div ref={documentSectionRef} className="rounded-lg bg-[#f4f8fb] p-4 sm:col-span-2" data-testid="request-document-section">
              <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.08em] text-[#7890a4]">
                <FileText size={14} />
                Supporting document
              </dt>
              <dd className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className="break-all text-sm font-semibold text-[#243e5b]">
                  {request.supportingDocument?.fileName || (documentRequested && documentError ? 'Attachment unavailable' : 'Open to check for an attachment')}
                </span>
                <button
                  type="button"
                  onClick={() => { setDocumentError(''); setDocumentRequested(true); }}
                  disabled={documentLoading || !request.rawId}
                  className="focus-ring inline-flex items-center gap-2 rounded-lg bg-[#1f70d0] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#1555aa] disabled:cursor-not-allowed disabled:opacity-60"
                  data-testid="button-view-supporting-document"
                >
                  <Eye size={14} />
                  {documentLoading ? 'Loading…' : 'View document'}
                </button>
              </dd>
              {documentLoading && <p className="mt-2 text-sm text-[#60768c]">Loading attachment…</p>}
              {documentError && <p className="mt-2 text-sm font-semibold text-[#b84233]" role="alert">{documentError}</p>}
              {documentData && (
                <div className="mt-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="break-all text-sm font-semibold text-[#243e5b]">{documentData.fileName}</span>
                    <a
                      href={documentData.dataUrl}
                      download={documentData.fileName}
                      className="focus-ring inline-flex items-center gap-2 rounded-lg border border-[#d0e0ea] bg-white px-3 py-2 text-xs font-bold text-[#1f70d0] transition-colors hover:bg-[#e7f1fa]"
                      data-testid="link-download-supporting-document"
                    >
                      <Download size={14} />
                      Download
                    </a>
                  </div>
                  {documentData.contentType?.startsWith('image/') && (
                    <img
                      src={documentData.dataUrl}
                      alt={`Supporting document: ${documentData.fileName}`}
                      className="mt-4 max-h-80 w-full rounded-lg border border-[#dce8f2] bg-white object-contain"
                    />
                  )}
                </div>
              )}
            </div>
          )}
          <Detail icon={Hash} label="Reference">{reference}</Detail>
          <div className="rounded-lg bg-[#f4f8fb] p-4 sm:col-span-2">
            <dt className="text-xs font-bold uppercase tracking-[.08em] text-[#7890a4]">Reason</dt>
            <dd className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#243e5b]">{reason || 'No reason provided.'}</dd>
          </div>
          {request.workflow === 'shiftSwap' && request.workflowStatus === 'pending_supervisor' && (
            <div className="rounded-lg border border-[#c9e8d6] bg-[#f0faf4] p-4 sm:col-span-2">
              <dt className="text-xs font-bold uppercase tracking-[.08em] text-[#19885d]">Colleague decision</dt>
              <dd className="mt-2 text-sm font-semibold leading-6 text-[#246b45]">Accepted. This offer is waiting for the supervisor’s final decision.</dd>
            </div>
          )}
          {request.workflow === 'shiftSwap' && request.workflowStatus === 'pending_colleague' && supervisor && (
            <div className="rounded-lg bg-[#f4f8fb] p-4 sm:col-span-2">
              <dt className="text-xs font-bold uppercase tracking-[.08em] text-[#7890a4]">Colleague decision</dt>
              <dd className="mt-2 text-sm font-semibold leading-6 text-[#243e5b]">Waiting for {request.replacement || 'the invited student'} to respond. Supervisor action is not available yet.</dd>
            </div>
          )}
          {request.replacement && (
            <Detail icon={FileText} label="Replacement">{request.replacement}</Detail>
          )}
          {request.workflow === 'shiftSwap' && request.colleagueReason && (
            <div className="rounded-lg border border-[#f3c7c1] bg-[#fff6f5] p-4 sm:col-span-2">
              <dt className="text-xs font-bold uppercase tracking-[.08em] text-[#b84233]">Colleague response</dt>
              <dd className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#8f3a2d]">{request.colleagueReason}</dd>
            </div>
          )}
          {request.workflow === 'shiftSwap' && request.supervisorReason && (
            <div className="rounded-lg border border-[#f3c7c1] bg-[#fff6f5] p-4 sm:col-span-2">
              <dt className="text-xs font-bold uppercase tracking-[.08em] text-[#b84233]">Supervisor decision</dt>
              <dd className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#8f3a2d]">{request.supervisorReason}</dd>
            </div>
          )}
          {request.workflow !== 'shiftSwap' && request.status === 'Rejected' && request.declineReason && (
            <div className="rounded-lg border border-[#f3c7c1] bg-[#fff6f5] p-4 sm:col-span-2">
              <dt className="text-xs font-bold uppercase tracking-[.08em] text-[#b84233]">Decline reason</dt>
              <dd className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#8f3a2d]">{request.declineReason}</dd>
            </div>
          )}
        </dl>

        {error && <p className="mt-4 rounded-lg bg-[#fbe4e1] px-3 py-2 text-sm font-semibold text-[#d05b48]" role="alert">{error}</p>}

        <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-[#e2eaf1] pt-5">
          {supervisor && pending && (
            <>
              <button
                type="button"
                onClick={() => onDecline(request)}
                disabled={busy}
                className="focus-ring rounded-lg bg-[#d05b48] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#bd4c3a] disabled:opacity-50"
                data-testid={`button-reject-${request.id}`}
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => onApprove(request.id)}
                disabled={busy}
                className="focus-ring rounded-lg bg-[#1f70d0] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1555aa] disabled:opacity-50"
                data-testid={`button-approve-${request.id}`}
              >
                {busy ? 'Saving…' : 'Approve'}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="focus-ring rounded-lg border border-[#cfdee9] bg-white px-4 py-2.5 text-sm font-bold text-[#385570] transition-colors hover:bg-[#f4f8fb] disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </section>
    </div>
  );
}
