// src/app/supRequest.jsx
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import logoImg from '@/assets/images/logo.png';
import { apiFetch } from '@/lib/api';

// --- Theme Colors ---
const COLORS = {
  primary: '#2563EB',
  darkBlue: '#1E3A8A',
  textMain: '#111827',
  textMuted: '#6B7280',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E5E7EB',
  danger: '#EF4444',
  success: '#10B981',
};

// --- Bottom Nav Items (Mapped to Pages) ---
const NAV_ITEMS = [
  { name: 'Dashboard',   icon: 'grid-outline',          path: '/supervisorDash' },
  { name: 'Calendar',    icon: 'calendar-outline',      path: '/supCal'         },
  { name: 'Requests',    icon: 'document-text-outline', path: '/supRequest'     },
  { name: 'Assistances', icon: 'people-outline',        path: '/supAssistants'  },
  { name: 'Reports',     icon: 'bar-chart-outline',     path: '/supReport'      },
];

// --- Submission Card Component ---
const SubmissionCard = ({ item, onApprove, onReject, disabled }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={styles.cardHeaderLeft}>
        <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
          <Text style={styles.avatarText}>{item.initials}</Text>
        </View>
        <Text style={styles.studentName}>{item.name}</Text>
      </View>
      <View style={styles.typeBadge}>
        <Text style={styles.typeBadgeText}>{item.type}</Text>
      </View>
    </View>

    <View style={styles.divider} />

    <View style={styles.cardBody}>
      <Text style={styles.requestText}>{item.reason}</Text>
    </View>

    <View style={styles.metaRow}>
      <View style={styles.dateContainer}>
        <Ionicons name="calendar-outline" size={16} color="#718096" style={styles.metaIcon} />
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
      <View style={[
        styles.statusBadge,
        item.status === 'Approved' && styles.statusApproved,
        item.status === 'Rejected' && styles.statusRejected,
        item.status === 'Pending' && styles.statusPending,
      ]}>
        <Ionicons
          name={item.status === 'Pending' ? 'time-outline' : item.status === 'Approved' ? 'checkmark-circle-outline' : 'close-circle-outline'}
          size={12}
          color={item.status === 'Approved' ? '#16A34A' : item.status === 'Rejected' ? '#DC2626' : '#B45309'}
          style={{ marginRight: 4 }}
        />
        <Text style={[
          styles.statusText,
          item.status === 'Approved' && styles.statusTextApproved,
          item.status === 'Rejected' && styles.statusTextRejected,
          item.status === 'Pending' && styles.statusTextPending,
        ]}>
          {item.status.toUpperCase()}
        </Text>
      </View>
    </View>

    {item.status === 'Pending' && (
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onReject(item)}
          disabled={disabled}
        >
          <Ionicons name="close-circle-outline" size={20} color="#DC2626" style={{ marginRight: 6 }} />
          <Text style={styles.rejectText}>REJECT</Text>
        </TouchableOpacity>

        <View style={styles.actionDivider} />

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onApprove(item)}
          disabled={disabled}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#16A34A" style={{ marginRight: 6 }} />
          <Text style={styles.approveText}>APPROVE</Text>
        </TouchableOpacity>
      </View>
    )}
  </View>
);

// --- Main Screen ---
export default function SupervisorRequests() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadRequests = async () => {
    try {
      const res = await apiFetch('/api/requests');
      const data = await res.json();

      if (!res.ok) {
        Alert.alert('Error', data.error || 'Could not load requests.');
        return;
      }

      const formatted = data.map((r) => ({
        id: r.rawId || r.id,
        name: r.name || 'Unknown',
        initials: r.initials || '?',
        avatarColor: '#A78BFA',
        type: r.type || 'REQUEST',
        reason: r.reason || r.detail || 'No details provided.',
        date: r.dateRange || 'No date',
        status: r.status || 'Pending',
      }));

      setSubmissions(formatted);
    } catch (err) {
      console.error('Load requests error:', err);
      Alert.alert('Connection error', 'Could not reach the server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const handleAction = async (item, newStatus) => {
    setBusyId(item.id);
    try {
      const res = await apiFetch(`/api/requests/${item.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert('Update failed', data.error || 'Please try again.');
        return;
      }

      setSubmissions((prev) =>
        prev.map((s) => (s.id === item.id ? { ...s, status: newStatus } : s))
      );
    } catch (err) {
      console.error('Update error:', err);
      Alert.alert('Connection error', 'Could not reach the server.');
    } finally {
      setBusyId(null);
    }
  };

  const filtered = submissions.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = submissions.filter((s) => s.status === 'Pending').length;
  const approvedCount = submissions.filter((s) => s.status === 'Approved').length;
  const total = submissions.length;
  const approvalRate = total > 0 ? ((approvedCount / total) * 100).toFixed(1) : '0.0';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1590&auto=format&fit=crop' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        {/* --- HEADER --- */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image source={logoImg} style={styles.iconContainer} resizeMode="contain" />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>iCenter</Text>
              <Text style={styles.headerSubtitle}>ABSENCE & LEAVE TRACKER</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={22} color="#1E3A8A" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/logOut')}>
              <Ionicons name="log-out-outline" size={22} color="#1E3A8A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- CONTENT --- */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.approvalCard}>
            <View style={styles.approvalIconContainer}>
              <Ionicons name="pie-chart-outline" size={20} color="#1E3A8A" />
            </View>
            <View style={styles.approvalTextContainer}>
              <Text style={styles.approvalLabel}>APPROVAL RATE</Text>
              <Text style={styles.approvalValue}>{approvalRate}%</Text>
            </View>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#A0AEC0" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by student name..."
              placeholderTextColor="#A0AEC0"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.sectionHeader}>
            <Ionicons name="swap-horizontal-outline" size={18} color="#1E3A8A" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>
              RECENT SUBMISSIONS {pendingCount > 0 ? `(${pendingCount} PENDING)` : ''}
            </Text>
          </View>

          {loading && (
            <Text style={styles.emptyText}>Loading requests…</Text>
          )}

          {!loading && filtered.length === 0 && (
            <Text style={styles.emptyText}>No requests to review.</Text>
          )}

          {filtered.map((item) => (
            <SubmissionCard
              key={item.id}
              item={item}
              onApprove={(i) => handleAction(i, 'Approved')}
              onReject={(i) => handleAction(i, 'Rejected')}
              disabled={busyId === item.id}
            />
          ))}

          <View style={styles.footerNote}>
            <Ionicons name="information-circle-outline" size={18} color="#4A5568" style={{ marginRight: 10, marginTop: 2 }} />
            <Text style={styles.footerNoteText}>
              All changes are logged for institutional audit compliance. Decisions made here are final and notified to students immediately.
            </Text>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* --- BOTTOM NAVIGATION BAR --- */}
        <View
          style={[
            styles.bottomNav,
            { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 },
          ]}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path;

            return (
              <TouchableOpacity
                key={item.name}
                style={styles.navItem}
                activeOpacity={0.7}
                onPress={() => router.push(item.path)}
              >
                <View style={styles.navIconContainer}>
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={isActive ? COLORS.primary : '#A0AEC0'}
                  />
                  {item.name === 'Requests' && pendingCount > 0 ? (
                    <View style={styles.navBadge}>
                      <Text style={styles.navBadgeText}>{pendingCount}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.navText, isActive && styles.navTextActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // 70% white overlay
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 40, height: 40, marginRight: 10 },
  headerTextContainer: { justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1A202C' },
  headerSubtitle: { fontSize: 9, fontWeight: '600', color: 'red', letterSpacing: 1, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { marginLeft: 16 },

  // Content
  scrollContent: { padding: 20, paddingBottom: 100 },

  // Approval card
  approvalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '55%',
    marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  approvalIconContainer: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#DBEAFE',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  approvalTextContainer: { flex: 1 },
  approvalLabel: { fontSize: 10, fontWeight: '700', color: '#718096', letterSpacing: 0.5, marginBottom: 2 },
  approvalValue: { fontSize: 22, fontWeight: '800', color: '#1A202C' },

  // Search
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 10, paddingHorizontal: 16, height: 50, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#1A202C' },

  // Section header
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#1E3A8A', letterSpacing: 0.5 },

  // Empty / loading
  emptyText: { textAlign: 'center', color: '#4A5568', paddingVertical: 20 },

  // Card
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  studentName: { fontSize: 15, fontWeight: '700', color: '#1A202C' },
  typeBadge: { backgroundColor: '#EDF2F7', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  typeBadgeText: { fontSize: 10, fontWeight: '700', color: '#4A5568', letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginHorizontal: 16 },
  cardBody: { padding: 16 },
  requestText: { fontSize: 14, color: '#4A5568', lineHeight: 20 },
  metaRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 16,
  },
  dateContainer: { flexDirection: 'row', alignItems: 'center' },
  metaIcon: { marginRight: 6 },
  dateText: { fontSize: 13, color: '#718096' },

  // Status badges
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1,
  },
  statusPending: { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' },
  statusApproved: { backgroundColor: '#DCFCE7', borderColor: '#16A34A' },
  statusRejected: { backgroundColor: '#FEE2E2', borderColor: '#DC2626' },
  statusText: { fontSize: 10, fontWeight: '700' },
  statusTextPending: { color: '#B45309' },
  statusTextApproved: { color: '#16A34A' },
  statusTextRejected: { color: '#DC2626' },

  // Action row (approve / reject)
  actionRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  actionButton: {
    flex: 1, flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', paddingVertical: 14,
  },
  actionDivider: { width: 1, backgroundColor: '#E2E8F0' },
  rejectText: { fontSize: 14, fontWeight: '700', color: '#DC2626' },
  approveText: { fontSize: 14, fontWeight: '700', color: '#16A34A' },

  // Footer note
  footerNote: {
    flexDirection: 'row', backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8, padding: 16, alignItems: 'flex-start', marginTop: 10,
  },
  footerNoteText: { flex: 1, fontSize: 12, color: '#2D3748', lineHeight: 18 },

  // Bottom Navigation Bar
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: { alignItems: 'center', justifyContent: 'center', padding: 4, minWidth: 55 },
  navIconContainer: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  navBadge: {
    position: 'absolute', top: -4, right: -8,
    backgroundColor: COLORS.danger, borderRadius: 8,
    minWidth: 16, height: 16, paddingHorizontal: 3,
    justifyContent: 'center', alignItems: 'center',
  },
  navBadgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
  navText: { fontSize: 10, color: COLORS.textMuted, marginTop: 4 },
  navTextActive: { color: COLORS.primary, fontWeight: 'bold' },
});