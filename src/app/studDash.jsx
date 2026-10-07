import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

const STATUS_STYLES = {
  approved: { bg: '#dcfce7', fg: '#15803d', label: 'Approved' },
  rejected: { bg: '#fee2e2', fg: '#b91c1c', label: 'Rejected' },
  pending: { bg: '#fef3c7', fg: '#b45309', label: 'Pending' },
  cancelled: { bg: '#e5e7eb', fg: '#4b5563', label: 'Cancelled' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[String(status).toLowerCase()] || STATUS_STYLES.pending;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
}

// Recent requests table with an Actions column (Edit / Cancel for pending requests)
function RequestsTableWithActions({ rows, idColor, onEdit, onCancel }) {
  const { c } = useStudTheme();

  return (
    <View>
      <View style={styles.tHead}>
        <Text style={[styles.th, styles.colId, { color: c.text }]}>ID</Text>
        <Text style={[styles.th, styles.colType, { color: c.text }]}>TYPE</Text>
        <Text style={[styles.th, styles.colStatus, { color: c.text }]}>STATUS</Text>
        <Text style={[styles.th, styles.colActions, { color: c.text }]}>ACTIONS</Text>
      </View>

      {rows.map((r) => {
        const isPending = String(r.status).toLowerCase() === 'pending';
        return (
          <View key={r.id} style={[styles.tRow, { borderTopColor: c.border }]}>
            <Text style={[styles.td, styles.colId, { color: idColor }]}>{r.id}</Text>
            <Text style={[styles.td, styles.colType, { color: c.text }]} numberOfLines={2}>
              {r.type}
            </Text>
            <View style={styles.colStatus}>
              <StatusBadge status={r.status} />
            </View>
            <View style={[styles.colActions, styles.actionsCell]}>
              {isPending ? (
                <>
                  <TouchableOpacity onPress={() => onEdit(r)}>
                    <Text style={[styles.actionText, { color: c.primary }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onCancel(r)} style={{ marginLeft: 10 }}>
                    <Text style={[styles.actionText, { color: '#dc2626' }]}>Cancel</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={{ color: c.text }}>—</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function StudDash() {
  const router = useRouter();
  const { c } = useStudTheme();
    const { user: USER, loading: userLoading } = useStudent();
  const requests = useRequests(); // (still mock for now — Phase B fixes this)
  const [cancelledIds, setCancelledIds] = useState([]);

  const handleEdit = (req) => {
    // TODO(API): load request by id on the Requests screen to pre-fill the form
    router.push({ pathname: ROUTES.requests, params: { id: req.id } });
  };

  const handleCancel = (req) => {
    Alert.alert('Cancel request', `Are you sure you want to cancel ${req.id}?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: () => {
          // TODO(API): DELETE /requests/:id  (or PATCH status = 'cancelled')
          setCancelledIds((prev) => [...prev, req.id]);
        },
      },
    ]);
  };

  const rows = requests
    .slice(0, 3)
    .map((r) => (cancelledIds.includes(r.id) ? { ...r, status: 'Cancelled' } : r));

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
          {/* TODO(API): GET /student/attendance-rate */}
                    <Text style={[styles.rateValue, { color: c.primary }]}>{USER?.attendanceRate ?? 0}%</Text>
        </View>
        <View style={[styles.track, { backgroundColor: c.border }]}>
          <View style={[styles.fill, { backgroundColor: c.primary, width: `${USER?.attendanceRate ?? 0}%` }]} />
        </View>
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Recent Leave Requests</Text>
        <RequestsTableWithActions
          rows={rows}
          idColor={c.primary}
          onEdit={handleEdit}
          onCancel={handleCancel}
        />
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

  // Requests table
  tHead: { flexDirection: 'row', alignItems: 'center', paddingBottom: 8 },
  th: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  tRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  td: { fontSize: 13 },
  colId: { flex: 1.1 },
  colType: { flex: 1.6, paddingRight: 6 },
  colStatus: { flex: 1.3, alignItems: 'flex-start' },
  colActions: { flex: 1.4 },
  actionsCell: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  actionText: { fontSize: 13, fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700' },
});