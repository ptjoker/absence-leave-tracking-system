import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../components/studentDash/ScreenShell';
import { AppButton, Card } from '../components/studentDash/ui';
import { useNotifications } from '../constants/notifications';
import { ROUTES, useStudTheme } from '../constants/studTheme';

function getNotificationStyle(type, c) {
  switch (type) {
    case 'leave_request_approved':
    case 'shift_swap_approved':
      return { icon: 'checkmark-circle', bg: c.okBg, fg: c.okText };
    case 'leave_request_rejected':
    case 'shift_swap_rejected':
      return { icon: 'close-circle', bg: c.badBg, fg: c.badText };
    case 'shift_swap_colleague_accepted':
    case 'shift_swap_pending_supervisor':
      return { icon: 'sync', bg: c.primarySoft, fg: c.primary };
    case 'registration_pending':
      return { icon: 'person-add', bg: c.warnBg, fg: c.warnText };
    case 'leave_request_submitted':
    case 'leave_request_pending':
    default:
      return { icon: 'document-text', bg: c.primarySoft, fg: c.primary };
  }
}

function timeAgo(isoString) {
  const date = new Date(isoString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function StudNotification() {
  const router = useRouter();
  const { c } = useStudTheme();
  const { notifications, loading, markRead, markAllRead, unreadCount } = useNotifications();

  return (
    <ScreenShell
      active={null}
      pill="STUDENT PORTAL"
      title="Notifications"
      subtitle="Updates about your requests and schedule."
      headerRight={
        <>
          <AppButton
            variant="light"
            icon="chevron-back"
            label="Back"
            onPress={() => (router.canGoBack() ? router.back() : router.replace(ROUTES.dashboard))}
            style={{ marginRight: 10 }}
          />
          <AppButton
            icon="checkmark-done"
            label="Mark all as read"
            onPress={markAllRead}
            disabled={unreadCount === 0}
          />
        </>
      }
    >
      <Card>
        {loading && notifications.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <ActivityIndicator color={c.primary} />
          </View>
        ) : notifications.length === 0 ? (
          <Text style={{ color: c.muted, textAlign: 'center', paddingVertical: 20 }}>
            You have no notifications.
          </Text>
        ) : (
          notifications.map((n, i) => {
            const style = getNotificationStyle(n.type, c);
            return (
              <Pressable
                key={n.id}
                onPress={() => !n.isRead && markRead(n.id)}
                style={[
                  styles.row,
                  i > 0 ? { borderTopColor: c.border, borderTopWidth: StyleSheet.hairlineWidth } : null,
                  !n.isRead ? { backgroundColor: c.panel } : null // Highlight unread
                ]}
              >
                <View style={[styles.icon, { backgroundColor: style.bg }]}>
                  <Ionicons name={style.icon} size={18} color={style.fg} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: c.text, fontWeight: n.isRead ? '600' : '800', fontSize: 14 }}>
                    {n.title}
                  </Text>
                  <Text style={{ color: c.muted, fontSize: 13, marginTop: 2 }}>{n.message}</Text>
                  <Text style={{ color: c.muted, fontSize: 11, marginTop: 4 }}>{timeAgo(n.createdAt)}</Text>
                </View>
                {!n.isRead ? <View style={[styles.dot, { backgroundColor: c.primary }]} /> : null}
              </Pressable>
            );
          })
        )}
      </Card>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8 },
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 9, height: 9, borderRadius: 5, marginLeft: 8 },
});