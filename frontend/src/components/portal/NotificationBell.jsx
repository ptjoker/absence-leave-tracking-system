import { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  BellOff,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  FileText,
  Megaphone,
  XCircle,
} from 'lucide-react';
import { useLocation } from 'wouter';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotifications } from '@/context/NotificationsContext';

const TYPE_STYLES = {
  request_submitted: { icon: FileText, tone: 'bg-[#dce5fb] text-[#1f70d0]' },
  request_approved: { icon: CheckCircle2, tone: 'bg-[#e3f7ec] text-[#19885d]' },
  request_declined: { icon: XCircle, tone: 'bg-[#fbe4e1] text-[#d05b48]' },
  strike: { icon: AlertTriangle, tone: 'bg-[#fbe4e1] text-[#d05b48]' },
  institutional_strike: { icon: Megaphone, tone: 'bg-[#fff0d8] text-[#c98200]' },
  timetable_uploaded: { icon: CalendarClock, tone: 'bg-[#e7f1fa] text-[#1f70d0]' },
  institutional_strike_cancelled: { icon: CalendarCheck, tone: 'bg-[#e3f7ec] text-[#19885d]' },
};

function timeAgo(iso) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(then).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Small red dot shown when there are unread notifications. */
export function UnreadDot({ className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute size-2.5 rounded-full border-2 border-white bg-[#e5383b] ${className}`}
      data-testid="notification-unread-dot"
    />
  );
}

/** Sidebar "Notification" button that opens the notification panel. */
export function NotificationBell({ onNavigate }) {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications();

  const openNotification = (notification) => {
    if (!notification.read) markRead(notification.id);
    if (notification.link) {
      setOpen(false);
      onNavigate?.();
      setLocation(notification.link);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="focus-ring flex items-center gap-3 rounded-lg bg-[#eef4fb] px-3 py-2.5 text-sm font-semibold text-[#52708b] hover:bg-[#e5eef8]"
          aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
          data-testid="button-notification"
        >
          <span className="relative inline-flex">
            <Bell size={18} />
            {unreadCount > 0 && <UnreadDot className="-right-1 -top-1 !border-[#eef4fb]" />}
          </span>
          Notification
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="end"
        sideOffset={14}
        collisionPadding={12}
        className="w-[380px] max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border border-[#d7e3ee] bg-white p-0 shadow-[0_18px_45px_rgba(43,81,119,.25)]"
        data-testid="notification-panel"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#e2eaf1] px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#10253f]">Notifications</h3>
            {unreadCount > 0 && (
              <span className="rounded-full bg-[#e5383b] px-2 py-0.5 text-[10px] font-bold text-white">{unreadCount} new</span>
            )}
          </div>
          <button
            type="button"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="focus-ring rounded px-1 text-xs font-bold text-[#1f70d0] hover:underline disabled:cursor-not-allowed disabled:text-[#9baebe] disabled:no-underline"
            data-testid="button-mark-all-read"
          >
            Mark all as read
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <span className="grid size-11 place-items-center rounded-full bg-[#f4f8fb] text-[#8aa0b2]"><BellOff size={20} /></span>
            <p className="text-sm font-bold text-[#243e5b]">You're all caught up</p>
            <p className="text-xs text-[#7890a4]">New notifications will appear here.</p>
          </div>
        ) : (
          <ul className="max-h-[420px] overflow-y-auto">
            {notifications.map((n) => {
              const style = TYPE_STYLES[n.type] || TYPE_STYLES.request_submitted;
              const Icon = style.icon;
              return (
                <li key={n.id} className="border-b border-[#e2eaf1] last:border-b-0">
                  <button
                    type="button"
                    onClick={() => openNotification(n)}
                    className={`focus-ring flex w-full gap-3 px-4 py-3 text-left hover:bg-[#f4f8fb] ${n.read ? '' : 'bg-[#f4f8fb]'}`}
                    data-testid={`notification-${n.id}`}
                  >
                    <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ${style.tone}`}><Icon size={16} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <strong className="text-sm font-bold text-[#162c4d]">{n.title}</strong>
                        {!n.read && <span aria-label="Unread" className="mt-1.5 size-2 shrink-0 rounded-full bg-[#e5383b]" />}
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-[#52708b]">{n.message}</span>
                      {n.reason && (
                        <span className="mt-1.5 block rounded-md border border-[#e9c7c2] bg-[#fbe4e1] px-2.5 py-1.5 text-xs leading-5 text-[#8f3a2d]">
                          <strong className="font-bold">Reason: </strong>{n.reason}
                        </span>
                      )}
                      <span className="mt-1.5 block text-[11px] text-[#9aabb9]">{timeAgo(n.createdAt)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {notifications.length > 0 && (
          <div className="border-t border-[#e2eaf1] px-4 py-2.5 text-right">
            <button type="button" onClick={clearAll} className="focus-ring rounded px-1 text-xs font-semibold text-[#7890a4] hover:text-[#d05b48]" data-testid="button-clear-notifications">
              Clear all
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
