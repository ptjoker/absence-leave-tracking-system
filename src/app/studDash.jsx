import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../components/studentDash/ScreenShell';
import { AppButton, Card, RequestsTable } from '../components/studentDash/ui';
import { USER, useRequests } from '../constants/studData';
import { ROUTES, useStudTheme } from '../constants/studTheme';

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
  const requests = useRequests(); // TODO(API): GET /requests?limit=3 (recent requests)

  return (
    <ScreenShell
      active="dashboard"
      pill="STUDENT PORTAL"
      title={`Welcome back, ${USER.name}`}
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
          <InfoItem icon="business-outline" label="DEPARTMENT" value={USER.department} />
          <InfoItem icon="trending-up-outline" label="POSITION" value={USER.position} />
          <InfoItem icon="mail-outline" label="EMAIL ADDRESS" value={USER.email} />
          <InfoItem icon="call-outline" label="PHONE" value={USER.cell} />
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
          <Text style={[styles.rateValue, { color: c.primary }]}>{USER.attendanceRate}%</Text>
        </View>
        <View style={[styles.track, { backgroundColor: c.border }]}>
          <View style={[styles.fill, { backgroundColor: c.primary, width: `${USER.attendanceRate}%` }]} />
        </View>
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Recent Leave Requests</Text>
        <RequestsTable rows={requests.slice(0, 3)} idColor={c.primary} />
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