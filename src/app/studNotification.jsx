import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../components/studentDash/ScreenShell';
import { AppButton, Card } from '../components/studentDash/ui';
import { ROUTES, useStudTheme } from '../constants/studTheme';

/* No Notification screenshot was provided, so this is a simple list matching
   the shared look. TODO(API): GET /notifications and PATCH /notifications/:id/read */
const INITIAL = [
  { id: 'n1', icon: 'checkmark-circle', tone: 'ok', title: 'Exam Leave approved', text: 'REQ-003 was approved.', time: 'Today', read: false },
  { id: 'n2', icon: 'sync', tone: 'ok', title: 'Shift swap approved', text: 'Oct 6, 2026 → Oct 8, 2026 with Simphiwe Masanabo.', time: 'Yesterday', read: false },
  { id: 'n3', icon: 'close-circle', tone: 'bad', title: 'Sick Leave rejected', text: 'REQ-001 was rejected.', time: 'This week', read: true },
  { id: 'n4', icon: 'warning', tone: 'warn', title: 'Institutional closure', text: 'Oct 2 and Oct 3 are unavailable due to closures.', time: 'This week', read: true },
];

export default function StudNotification() {
  const router = useRouter();
  const { c } = useStudTheme();
  const [items, setItems] = useState(INITIAL);

  const tone = (t) =>
    t === 'ok' ? { bg: c.okBg, fg: c.okText } : t === 'bad' ? { bg: c.badBg, fg: c.badText } : { bg: c.warnBg, fg: c.warnText };

  const markRead = (id) => setItems((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAll = () => setItems((list) => list.map((n) => ({ ...n, read: true })));

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
          <AppButton icon="checkmark-done" label="Mark all as read" onPress={markAll} />
        </>
      }
    >
      <Card>
        {items.length === 0 ? (
          <Text style={{ color: c.muted }}>You have no notifications.</Text>
        ) : (
          items.map((n, i) => {
            const t = tone(n.tone);
            return (
              <Pressable
                key={n.id}
                onPress={() => markRead(n.id)}
                style={[styles.row, i > 0 ? { borderTopColor: c.border, borderTopWidth: StyleSheet.hairlineWidth } : null]}
              >
                <View style={[styles.icon, { backgroundColor: t.bg }]}>
                  <Ionicons name={n.icon} size={18} color={t.fg} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: c.text, fontWeight: n.read ? '600' : '800', fontSize: 14 }}>{n.title}</Text>
                  <Text style={{ color: c.muted, fontSize: 13, marginTop: 2 }}>{n.text}</Text>
                  <Text style={{ color: c.muted, fontSize: 11, marginTop: 4 }}>{n.time}</Text>
                </View>
                {!n.read ? <View style={[styles.dot, { backgroundColor: c.primary }]} /> : null}
              </Pressable>
            );
          })
        )}
      </Card>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 9, height: 9, borderRadius: 5, marginLeft: 8 },
});