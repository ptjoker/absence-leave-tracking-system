import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SupervisorRequestHistory() {
  const router = useRouter();
  const { submissions: submissionsParam } = useLocalSearchParams();
  let submissions = [];

  if (typeof submissionsParam === 'string') {
    try {
      const parsedSubmissions = JSON.parse(submissionsParam);
      if (Array.isArray(parsedSubmissions)) {
        submissions = parsedSubmissions;
      }
    } catch {
      submissions = [];
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel="Go back to requests"
          onPress={() => router.replace('/supRequest')}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color="#1E3A8A" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Request History</Text>
          <Text style={styles.subtitle}>ALL SUBMISSIONS</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {submissions.length ? submissions.map((item, index) => {
          const status = item.status || 'PENDING';
          const statusStyle = status === 'APPROVED'
            ? styles.approved
            : status === 'REJECTED'
              ? styles.rejected
              : styles.pending;

          return (
            <View key={item.id ?? `${item.name}-${index}`} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.nameContainer}>
                  <Text style={styles.studentName}>{item.name}</Text>
                  <Text style={styles.type}>{item.type}</Text>
                </View>
                <View style={[styles.statusBadge, statusStyle]}>
                  <Text style={styles.statusText}>{status}</Text>
                </View>
              </View>
              <Text style={styles.reason}>{item.reason}</Text>
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={16} color="#718096" />
                <Text style={styles.date}>{item.date}</Text>
              </View>
            </View>
          );
        }) : (
          <View style={styles.emptyState}>
            <Ionicons name="file-tray-outline" size={32} color="#718096" />
            <Text style={styles.emptyTitle}>No request history</Text>
            <Text style={styles.emptyMessage}>Submitted requests will appear here.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#8FB3D9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    color: '#1A202C',
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: '#718096',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 3,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  nameContainer: {
    flex: 1,
    marginRight: 10,
  },
  studentName: {
    color: '#1A202C',
    fontSize: 15,
    fontWeight: '700',
  },
  type: {
    color: '#4A5568',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 5,
  },
  statusBadge: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  pending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  approved: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  rejected: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
  },
  statusText: {
    color: '#1A202C',
    fontSize: 10,
    fontWeight: '700',
  },
  reason: {
    color: '#4A5568',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    color: '#718096',
    fontSize: 13,
    marginLeft: 7,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: 24,
  },
  emptyTitle: {
    color: '#1A202C',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptyMessage: {
    color: '#4A5568',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
});