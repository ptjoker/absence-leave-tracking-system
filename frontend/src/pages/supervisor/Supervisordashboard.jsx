import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, ClipboardList, Clock3, Download, UsersRound } from 'lucide-react';
import { useLocation } from 'wouter';
import { PortalShell, StatusBadge } from '@/components/portal/PortalComponents';
import { useRequests } from '@/context/RequestsContext';
import { useNotifications } from '@/context/NotificationsContext';
import { exportActivityLogPdf } from '@/lib/reportExport';
import { recordActivity, useActivityLog } from '@/lib/activityLog';
import { getSession } from '@/lib/session';

const PERIODS = ['Today', 'This week', 'This month', 'All time'];
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function StatCard({ label, value, icon }) {
  return <div className="rounded-xl bg-[#f4f8fb] p-5"><div className="flex items-center justify-between"><p className="mono text-[10px] font-bold uppercase tracking-[.1em] text-[#7890a4]">{label}</p><span className="text-[#1f70d0]">{icon}</span></div><p className="serif mt-2 text-4xl text-[#10253f]">{value}</p></div>;
}

function inPeriod(value, period) {
  if (period === 'All time') return true;
  const date = new Date(value);
  const now = new Date();
  if (Number.isNaN(date.getTime())) return false;
  if (period === 'Today') return date.toDateString() === now.toDateString();
  const start = new Date(now);
  if (period === 'This week') {
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
  } else {
    start.setDate(1);
  }
  start.setHours(0, 0, 0, 0);
  return date >= start;
}

function relativeTime(value) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function activityTone(activity) {
  if (activity.type === 'request_accepted') return 'APPROVED';
  if (activity.type === 'request_rejected') return 'REJECTED';
  if (activity.type === 'report_downloaded') return 'DOWNLOADED';
  if (activity.type === 'shift_assigned') return 'ASSIGNED';
  if (activity.type === 'shift_cancelled') return 'CANCELLED';
  if (activity.type === 'closure_declared') return 'DECLARED';
  if (activity.type === 'closure_cancelled') return 'CANCELLED';
  return 'RECEIVED';
}

function toneClass(tone) {
  if (tone === 'APPROVED') return 'bg-[#d9f7e6] text-[#07834f]';
  if (tone === 'REJECTED' || tone === 'CANCELLED') return 'bg-[#fee2e2] text-[#c62828]';
  if (tone === 'ASSIGNED' || tone === 'DECLARED') return 'bg-[#fff1c7] text-[#b76a00]';
  if (tone === 'DOWNLOADED') return 'bg-[#dbeafe] text-[#245bd6]';
  return 'bg-[#e4efff] text-[#245bd6]';
}

export default function SupervisorDashboard() {
  const [, setLocation] = useLocation();
  const { requests } = useRequests();
  const { notifications } = useNotifications();
  const storedActivities = useActivityLog();
  const [shifts, setShifts] = useState([]);
  const [period, setPeriod] = useState('Today');
  const pending = requests.filter((request) => request.status === 'Pending');
  const approved = requests.filter((request) => request.status === 'Approved');
  const assistants = new Set(requests.map((request) => request.name || 'Nicholas Mathebula')).size;
  useEffect(() => {
    const loadShifts = async () => {
      try {
        const session = getSession();
        if (!session?.access_token) return;
        const response = await fetch(`${API_BASE}/api/shifts`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!response.ok) return;
        const data = await response.json();
        setShifts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Load activity log shifts error:', error);
      }
    };
    loadShifts();
  }, []);
  const activities = useMemo(() => {
    const notificationActivities = notifications.map((notification) => ({
      id: `notification:${notification.id}`,
      occurredAt: notification.createdAt,
      title: 'Notification received',
      description: notification.message || notification.title,
      details: notification.title,
    }));
    return [...storedActivities, ...notificationActivities]
      .filter((activity) => inPeriod(activity.occurredAt, period))
      .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
      .slice(0, 20);
  }, [notifications, period, storedActivities]);
  const filteredShiftDetails = useMemo(() => storedActivities
    .filter((activity) => (activity.type === 'shift_assigned' || activity.type === 'shift_cancelled') && inPeriod(activity.occurredAt, period))
    .map((activity) => ({
      student: activity.student || 'Student assistant',
      action: activity.type === 'shift_assigned' ? 'Assigned' : 'Cancelled',
      shiftDate: activity.date || 'Date not provided',
      details: activity.details || activity.description,
    })), [period, storedActivities]);
  const currentShiftDetails = useMemo(() => shifts
    .filter((shift) => inPeriod(shift.createdAt || shift.shiftDate, period))
    .map((shift) => ({
      student: shift.studentName || 'Student assistant',
      action: 'Assigned',
      shiftDate: shift.shiftDate || 'Date not provided',
      details: `${shift.startTime || ''}–${shift.endTime || ''} · ${shift.role || 'Shift'} · ${shift.location || 'Location not provided'}`,
    })), [period, shifts]);
  const studentShiftDetails = useMemo(() => {
    const seen = new Set();
    return [...filteredShiftDetails, ...currentShiftDetails].filter((shift) => {
      const key = `${shift.student}|${shift.action}|${shift.shiftDate}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [currentShiftDetails, filteredShiftDetails]);
  const download = () => {
    const rows = activities.map((activity) => ({
      date: new Date(activity.occurredAt).toLocaleString('en-ZA'),
      title: activity.title,
      description: activity.description,
      details: activity.details,
    }));
    exportActivityLogPdf(rows, period, studentShiftDetails);
    recordActivity({ type: 'report_downloaded', title: 'Activity report downloaded', description: `Downloaded the ${period} activity log report.`, details: 'PDF' });
  };

  return (
    <PortalShell supervisor>
      <main className="px-5 py-7 md:px-8 md:py-8">
        <p className="mb-3 inline-flex rounded-full bg-[#162c4d] px-3 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-white">iCenter</p>
        <h1 className="serif text-4xl text-[#10253f]">Supervisor dashboard</h1>
        <p className="mt-2 max-w-xl text-sm text-[#52708b]">Monitor incoming student assistant requests and keep operational decisions synchronized.</p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Pending Approvals" value={pending.length} icon={<Clock3 size={17} />} />
          <StatCard label="Approved" value={approved.length} icon={<CheckCircle2 size={17} />} />
          <StatCard label="Assistants" value={assistants} icon={<UsersRound size={17} />} />
          <StatCard label="Total Requests" value={requests.length} icon={<ClipboardList size={17} />} />
        </div>
        <div className="mt-8 flex items-center justify-between"><h2 className="mono text-xs font-bold uppercase tracking-[.14em] text-[#10253f]">Awaiting your review</h2><button type="button" onClick={() => setLocation('/supervisor/requests')} className="focus-ring mono text-xs font-bold uppercase tracking-[.08em] text-[#152d49] hover:text-[#1f70d0]">View all</button></div>
        <div className="mt-4 overflow-hidden rounded-xl bg-[#f4f8fb]">
          {pending.length ? pending.slice(0, 6).map((request) => <button key={request.id} type="button" onClick={() => setLocation('/supervisor/requests')} className="flex w-full items-center justify-between gap-4 border-t border-[#e2eaf1] px-6 py-4 text-left first:border-t-0 hover:bg-white"><div><strong className="block text-sm font-bold text-[#162c4d]">{request.name || 'Nicholas Mathebula'}</strong><span className="mt-1 block text-xs text-[#7890a4]">{request.type} · {request.dateRange || 'Date not specified'}</span></div><StatusBadge status="Pending" /></button>) : <div className="px-6 py-8 text-sm text-[#7890a4]">No new requests are awaiting your review.</div>}
        </div>
        <div className="mt-8 grid gap-6 border-t border-white/40 pt-8 lg:grid-cols-[1.3fr_1fr]">
          <div><h2 className="text-base font-bold italic text-[#10253f]">Operational note</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#243e5b]">Approvals, rejections, closures, notifications, and scheduling changes are recorded in the activity log.</p></div>
          <div className="rounded-2xl border border-[#dbe5ef] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(43,81,119,.08)] sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#eef5ff] text-[#1f70d0]"><CalendarDays size={18} /></span><div><strong className="block text-sm font-bold text-[#162c4d]">Activity Log</strong><span className="text-xs text-[#7890a4]">{activities.length} {activities.length === 1 ? 'entry' : 'entries'} · {period}</span></div></div>
              <div className="flex items-center gap-2"><select value={period} onChange={(event) => setPeriod(event.target.value)} className="focus-ring rounded-md border border-[#dce8f2] bg-white px-2 py-1.5 text-xs font-semibold text-[#385570]" aria-label="Activity log period">{PERIODS.map((option) => <option key={option}>{option}</option>)}</select><button type="button" onClick={download} className="focus-ring rounded-md p-1.5 text-[#1f70d0] hover:bg-white" aria-label={`Download ${period} activity log PDF`} title="Download PDF"><Download size={16} /></button></div>
            </div>
            <div className="mt-4">
              {activities.length ? activities.slice(0, 5).map((activity) => {
                const tone = activityTone(activity);
                return <div key={activity.id} className="flex items-start gap-2.5 border-t border-[#e2eaf1] py-3 first:border-t-0"><span className={`mt-0.5 shrink-0 rounded px-2 py-1 text-[9px] font-bold tracking-[.04em] ${toneClass(tone)}`}>{tone}</span><div className="min-w-0 flex-1"><p className="text-sm font-semibold leading-5 text-[#182338]">{activity.title}</p><p className="mt-0.5 truncate text-xs text-[#6b7890]">{activity.details || activity.description}</p></div><time className="shrink-0 pt-0.5 text-[10px] text-[#6b7890]" title={new Date(activity.occurredAt).toLocaleString('en-ZA')}>{relativeTime(activity.occurredAt)}</time></div>;
              }) : <p className="py-4 text-xs text-[#7890a4]">No activity for this period.</p>}
            </div>
          </div>
        </div>
      </main>
    </PortalShell>
  );
}
