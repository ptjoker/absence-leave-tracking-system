import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import RequestsTableWithActions from '../components/studentDash/RequestsTableWithActions';
import ScreenShell from '../components/studentDash/ScreenShell';
import { AppButton, Card } from '../components/studentDash/ui';
import { useRequests } from '../constants/studData';
import { ROUTES, useStudTheme } from '../constants/studTheme';
import { useStudent } from '../hooks/useStudent';

function InfoItem({ icon, label, value }) {
  const { c } = useStudTheme();
  return (
    <View style={styles.infoItem}>
      <View style={styles.infoLabelRow}>
        <Ionicons name={icon} size={12} color={c.text} />
        <Text style={[styles.infoLabel, { color: c.text }]}> {label}</Text>
      </View>
      <Text style={[styles.infoValue, { color: c.primary === '#2563eb' ? '#1e3a8a' : c.text }]}>{value}</Text>
    </View>
  );
}

export default function StudDash() {
  const router = useRouter();
  const { c } = useStudTheme();
  const { user: USER } = useStudent();

  const { requests, cancelRequest, loading: requestsLoading } = useRequests();
  const [cancellingId, setCancellingId] = useState(null);

  const handleEdit = (req) => {
    const isSwap = String(req.type || '').toLowerCase().includes('shift swap');
    router.push({
      pathname: ROUTES.requests,
      params: {
        editId: req.rawId || req.id,
        from: 'dashboard',
        mode: isSwap ? 'swap' : 'leave',
      },
    });
  };

  const handleCancel = (req) => {
    Alert.alert(
      'Cancel request',
      `Are you sure you want to cancel ${req.id}? It will remain in your history with Cancelled status.`,
      [
        { text: 'Keep request', style: 'cancel' },
        {
          text: 'Yes, cancel',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(req.id);
            try {
              await cancelRequest(req.rawId || req.id);
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not cancel request.');
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  const rows = requests.slice(0, 3);

  return (
    <ScreenShell
      active="dashboard"
      pill="STUDENT PORTAL"
      title={`Welcome back, ${USER?.name || '...'}`}
      subtitle="Manage your leave requests and track your departmental attendance."
      headerRight={
        <>
          <AppButton
            variant="light"
            icon="time-outline"
            label="View History"
            onPress={() => router.push(ROUTES.history)}
            style={{ marginRight: 10 }}
          />
          <AppButton icon="add" label="New Request" onPress={() => router.push(ROUTES.requests)} />
        </>
      }
    >
      <Card>
        <View style={styles.infoGrid}>
          <InfoItem icon="business-outline" label="DEPARTMENT" value={USER?.department || '—'} />
          <InfoItem icon="trending-up-outline" label="POSITION" value={USER?.position || '—'} />
          <InfoItem icon="mail-outline" label="EMAIL ADDRESS" value={USER?.email || '—'} />
          <InfoItem icon="call-outline" label="PHONE" value={USER?.cell || '—'} />
        </View>
      </Card>

      <Card>
        <View style={styles.perfHead}>
          <Ionicons name="trending-up" size={16} color={c.amber} />
          <Text style={[styles.perfTitle, { color: c.text }]}> Performance</Text>
        </View>
        <Text style={{ color: c.text, fontSize: 13, marginTop: 4 }}>Semester attendance & compliance</Text>
        <View style={styles.rateRow}>
          <Text style={[styles.rateLabel, { color: c.text }]}>Attendance Rate</Text>
          <Text style={[styles.rateValue, { color: c.primary }]}>{USER?.attendanceRate ?? 0}%</Text>
        </View>
        <View style={[styles.track, { backgroundColor: c.border }]}>
          <View style={[styles.fill, { backgroundColor: c.primary, width: `${USER?.attendanceRate ?? 0}%` }]} />
        </View>
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Recent Requests</Text>
        {requestsLoading ? (
          <Text style={{ color: c.text, textAlign: 'center', marginTop: 10 }}>Loading requests...</Text>
        ) : (
          <RequestsTableWithActions
            rows={rows}
            idColor={c.primary}
            onEdit={handleEdit}
            onCancel={handleCancel}
            cancellingId={cancellingId}
          />
        )}
      </Card>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  infoItem: { width: '50%', paddingRight: 8, marginBottom: 14 },
  infoLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  infoLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  infoValue: { fontSize: 14, fontWeight: '700', lineHeight: 19 },
  perfHead: { flexDirection: 'row', alignItems: 'center' },
  perfTitle: { fontSize: 17, fontWeight: '700' },
  rateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16 },
  rateLabel: { fontSize: 14, fontWeight: '600' },
  rateValue: { fontSize: 22, fontWeight: '800' },
  track: { height: 6, borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
});