import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import RequestsTableWithActions from '../components/studentDash/RequestsTableWithActions';
import ScreenShell from '../components/studentDash/ScreenShell';
import { AppButton, Card } from '../components/studentDash/ui';
import { useRequests } from '../constants/studData';
import { ROUTES, useStudTheme } from '../constants/studTheme';
import { useStudent } from '../hooks/useStudent';

// Unique identifier of a request: the backend row id (rawId), falling back to the display id.
const requestKey = (r) => String(r?.rawId ?? r?.id);

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
  const [pendingCancel, setPendingCancel] = useState(null); // request waiting for confirmation
  const [hiddenIds, setHiddenIds] = useState([]); // unique keys of cancelled requests removed from Recent Requests

  // If a different student is logged in, never carry over another student's pop-up or hidden list.
  useEffect(() => {
    setHiddenIds([]);
    setPendingCancel(null);
    setCancellingId(null);
  }, [USER?.email]);

  // A request may only be cancelled by the student it belongs to.
  // The backend must enforce this too; this is an extra check on the app side.
  const belongsToUser = (req) => {
    if (!req?.email || !USER?.email) return true; // no owner info available here, backend decides
    return String(req.email).toLowerCase() === String(USER.email).toLowerCase();
  };

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

  // Cancel button only opens the confirmation pop-up for the selected request.
  const handleCancel = (req) => {
    setPendingCancel(req);
  };

  // "No, Keep Request" (or tapping outside / back button): close without changing anything.
  const dismissCancel = () => {
    setPendingCancel(null);
  };

  // "Yes, Cancel": close the pop-up, cancel only the selected request, remove only that request from the list.
  const confirmCancel = async () => {
    const req = pendingCancel;
    if (!req) return;
    setPendingCancel(null);

    if (!belongsToUser(req)) {
      Alert.alert('Error', 'You can only cancel your own requests.');
      return;
    }
    if (cancellingId === req.id) return; // already cancelling this request

    const key = requestKey(req);
    setCancellingId(req.id);
    try {
      await cancelRequest(req.rawId || req.id);
      setHiddenIds((prev) => (prev.includes(key) ? prev : [...prev, key]));
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not cancel request.');
    } finally {
      setCancellingId(null);
    }
  };

  const rows = requests.filter((r) => !hiddenIds.includes(requestKey(r))).slice(0, 3);

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

      {/* ---------------- cancel confirmation pop-up ---------------- */}
      <Modal
        visible={!!pendingCancel}
        transparent
        animationType="fade"
        onRequestClose={dismissCancel}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={dismissCancel}
            accessibilityLabel="Close dialog"
          />
          <View style={[styles.modalBox, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={[styles.modalIcon, { backgroundColor: c.badBg }]}>
              <Ionicons name="alert-circle-outline" size={26} color={c.badText} />
            </View>
            <Text style={[styles.modalTitle, { color: c.text }]}>Cancel request</Text>
            <Text style={[styles.modalMessage, { color: c.text }]}>
              Are you sure you want to cancel this request?
            </Text>
            {pendingCancel ? (
              <Text style={[styles.modalMeta, { color: c.muted }]}>
                {pendingCancel.id}
                {pendingCancel.type ? ` · ${pendingCancel.type}` : ''}
              </Text>
            ) : null}
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={dismissCancel}
                style={[
                  styles.modalBtn,
                  { backgroundColor: c.inputBg, borderColor: c.inputBorder, borderWidth: 1, marginRight: 10 },
                ]}
              >
                <Text style={[styles.modalBtnText, { color: c.text }]}>No, Keep Request</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={confirmCancel}
                style={[styles.modalBtn, { backgroundColor: c.danger }]}
              >
                <Text style={[styles.modalBtnText, { color: '#ffffff' }]}>Yes, Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    alignItems: 'center',
  },
  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalMessage: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 8 },
  modalMeta: { fontSize: 12, fontWeight: '600', marginTop: 6, textAlign: 'center' },
  modalActions: { flexDirection: 'row', marginTop: 18, alignSelf: 'stretch' },
  modalBtn: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: { fontSize: 14, fontWeight: '700' },
});