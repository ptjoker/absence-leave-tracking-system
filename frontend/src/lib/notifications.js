/* Pure helpers that build notification objects for the notification store. */

export const isSwapRequest = (request) =>
  String(request?.type || '').toLowerCase().startsWith('shift swap');

export const requesterKeys = (request) =>
  [request?.userId, request?.user_id, request?.studentId, request?.student_id, request?.email].filter(Boolean);

export const declineReasonOf = (request) =>
  request?.declineReason ||
  request?.decline_reason ||
  request?.rejectionReason ||
  request?.rejection_reason ||
  request?.decisionReason ||
  request?.decision_reason ||
  '';

const kindLabel = (request) => (isSwapRequest(request) ? 'shift swap' : 'leave');

export function formatLongDate(dateKey) {
  const d = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateKey;
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/** Supervisor is told a student submitted a leave / swap request. */
export function requestSubmittedNotification(request) {
  const who = request.name || 'A student assistant';
  return {
    id: `submitted:${request.rawId || request.id}`,
    recipientRole: 'supervisor',
    recipients: null,
    type: 'request_submitted',
    title: isSwapRequest(request) ? 'New shift swap request' : 'New leave request',
    message: `${who} submitted a ${kindLabel(request)} request${request.dateRange ? ` for ${request.dateRange}` : ''}.`,
    link: '/supervisor/requests',
  };
}

/** Student is told their request was approved / declined (with reason). */
export function requestDecisionNotification(request, status, reason = '') {
  const approved = status === 'Approved';
  const label = isSwapRequest(request) ? 'Shift swap' : 'Leave request';
  const keys = requesterKeys(request);
  return {
    id: `decision:${request.rawId || request.id}:${status}`,
    recipientRole: 'student',
    recipients: keys.length ? keys : null,
    type: approved ? 'request_approved' : 'request_declined',
    title: `${label} ${approved ? 'approved' : 'declined'}`,
    message: `Your ${kindLabel(request)} request${request.dateRange ? ` for ${request.dateRange}` : ''} has been ${approved ? 'approved' : 'declined'}.`,
    reason: approved ? '' : reason,
    link: '/dashboard/history',
  };
}

/** Student is told they received a strike. */
export function strikeNotification({ studentKeys, reason, count }) {
  return {
    id: `strike:${studentKeys[0] || 'student'}:${Date.now()}`,
    recipientRole: 'student',
    recipients: studentKeys.length ? studentKeys : null,
    type: 'strike',
    title: 'You received a strike',
    message: `A supervisor issued you a strike. You now have ${count} strike${count === 1 ? '' : 's'} on record.`,
    reason,
    link: '/dashboard',
  };
}

/** All students are told about a declared (or cancelled) institutional strike day. */
export function institutionalStrikeNotification(dateKey, reason = '', cancelled = false, closureType = 'Strike') {
  const label = closureType || 'Strike';
  return {
    id: `institutional-closure:${dateKey}:${cancelled ? 'cancelled' : 'declared'}:${Date.now()}`,
    recipientRole: 'student',
    recipients: null,
    type: cancelled ? 'institutional_closure_cancelled' : 'institutional_closure',
    title: cancelled ? 'Institutional closure cancelled' : 'Institutional closure declared',
    message: cancelled
      ? `${formatLongDate(dateKey)} is no longer an institutional closure.`
      : `${formatLongDate(dateKey)} has been declared an institutional closure (${label}). Leave and shift swap requests cannot be made for this date.`,
    reason: cancelled ? '' : reason,
    link: '/dashboard/schedule',
  };
}

/** Supervisor is told a student uploaded (or replaced) their class timetable. */
export function timetableUploadedNotification({ studentNumber, name, fileName, replaced = false }) {
  const who = name || 'A student assistant';
  return {
    id: `timetable:${studentNumber}:${Date.now()}`,
    recipientRole: 'supervisor',
    recipients: null,
    type: 'timetable_uploaded',
    title: replaced ? 'Timetable updated' : 'New timetable uploaded',
    message: `${who}${studentNumber ? ` (${studentNumber})` : ''} ${replaced ? 'updated their' : 'uploaded a'} class timetable${fileName ? `: ${fileName}` : ''}. View it under Scheduling Tips on the calendar.`,
    link: '/supervisor/calendar?timetables=1',
  };
}
