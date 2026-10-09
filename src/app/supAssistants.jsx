// src/app/supAssistants.jsx
import { Feather, Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import LogoImg from '@/assets/images/logo.png';
import { apiFetch } from '@/lib/api';
import { useSupervisorStyles, useSupervisorTheme } from '@/contexts/SupervisorThemeContext';

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
  activeBg: '#D1FAE5',
  activeText: '#059669',
  pendingBg: '#FEF3C7',
  pendingText: '#D97706',
  rejectedBg: '#FEE2E2',
  rejectedText: '#EF4444',
  approvedBg: '#D1FAE5',
  approvedText: '#059669',
  grayLight: '#F3F4F6',
  avatarColors: ['#E0E7FF', '#FEF3C7', '#D1FAE5', '#FCE7F3', '#DBEAFE'],
  avatarTextColors: ['#4F46E5', '#D97706', '#059669', '#DB2777', '#2563EB'],
};

// ✅ UPDATED: Added Profile item — matches supervisor navigation
const NAV_ITEMS = [
  { name: 'Dashboard',   icon: 'grid-outline',          path: '/supervisorDash' },
  { name: 'Calendar',    icon: 'calendar-outline',      path: '/supCal'         },
  { name: 'Requests',    icon: 'document-text-outline', path: '/supRequest'     },
  { name: 'Assistances', icon: 'people-outline',        path: '/supAssistants'  },
  { name: 'Reports',     icon: 'bar-chart-outline',     path: '/supReport'      },
  { name: 'Profile',     icon: 'person-outline',        path: '/supProfile'     }, // 👈 NEW
];

function initialsFromName(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function formatMemberSince(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return String(iso);
  }
}

export default function StudentAssistances() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const { isDarkMode, toggleTheme, theme } = useSupervisorTheme();
  const styles = useSupervisorStyles(baseStyles);

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadAssistants = async () => {
    try {
      const res = await apiFetch('/api/assistants');
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        Alert.alert('Error', data?.error || 'Could not load assistants.');
        return;
      }

      const formatted = data.map((a, index) => ({
        id: a.id,
        name: a.name || `${a.firstName || ''} ${a.lastName || ''}`.trim() || 'Unknown',
        initials: a.initials || initialsFromName(a.name || `${a.firstName || ''} ${a.lastName || ''}`),
        course: (a.course || '—').toUpperCase(),
        email: a.email || '—',
        phone: a.phone || '—',
        studNo: a.studentNumber || '—',
        memberSince: formatMemberSince(a.createdAt),
        status: a.status || 'Active',
        requests: {
          total: a.totalRequests || 0,
          approved: a.approvedRequests || 0,
          rejected: a.rejectedRequests || 0,
          pending: a.pendingRequests || 0,
        },
        colorIndex: index % COLORS.avatarColors.length,
      }));

      setStudents(formatted);
    } catch (err) {
      console.error('Load assistants error:', err);
      Alert.alert('Connection error', 'Could not reach the server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAssistants();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAssistants();
  };

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.course.toLowerCase().includes(q) ||
        String(s.studNo).toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  const totalAssistants = students.length;
  const totalRequests = students.reduce((sum, s) => sum + s.requests.total, 0);
  const totalPending = students.reduce((sum, s) => sum + s.requests.pending, 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1590&auto=format&fit=crop' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Image source={LogoImg} style={styles.logoImage} resizeMode="contain" />
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>iCenter</Text>
                <Text style={styles.headerSubtitle}>ABSENCE & LEAVE TRACKER</Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.iconButton} onPress={toggleTheme}>
                <Feather name={isDarkMode ? 'sun' : 'moon'} size={22} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/supNotification')}>
                <Ionicons name="notifications-outline" size={22} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/logOut')}>
                <Ionicons name="log-out-outline" size={22} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <Text style={styles.pageTitle}>Student Assistances</Text>
              <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
                <Feather name="refresh-cw" size={14} color={COLORS.textMain} />
                <Text style={styles.refreshText}>Refresh</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.pageSubtitle}>
              Live roster of every student assistant in the system with their request activity.
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>TOTAL ASSISTANTS</Text>
              <Text style={styles.statValue}>{totalAssistants}</Text>
              <Feather name="users" size={16} color={COLORS.primary} style={styles.statIcon} />
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>TOTAL REQUESTS</Text>
              <Text style={styles.statValue}>{totalRequests}</Text>
              <Feather name="clipboard" size={16} color={COLORS.primary} style={styles.statIcon} />
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>PENDING REVIEW</Text>
              <Text style={styles.statValue}>{totalPending}</Text>
              <Feather name="clock" size={16} color={COLORS.pendingText} style={styles.statIcon} />
            </View>
          </View>

          <View style={styles.searchContainer}>
            <Feather name="search" size={16} color={COLORS.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, email, course, or student"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {loading && (
            <Text style={styles.emptyText}>Loading assistants…</Text>
          )}

          {!loading && filteredStudents.length === 0 && (
            <Text style={styles.emptyText}>
              {searchQuery ? 'No students match your search.' : 'No student assistants registered yet.'}
            </Text>
          )}

          {!loading && filteredStudents.map((student) => (
            <View key={student.id} style={styles.studentCard}>
              <View style={styles.studentHeader}>
                <View style={styles.studentMainInfo}>
                  <View style={[styles.avatarStudent, { backgroundColor: COLORS.avatarColors[student.colorIndex] }]}>
                    <Text style={[styles.avatarStudentText, { color: COLORS.avatarTextColors[student.colorIndex] }]}>
                      {student.initials}
                    </Text>
                  </View>
                  <View style={styles.studentTextInfo}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.studentCourse}>{student.course}</Text>
                  </View>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{student.status}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.contactSection}>
                <View style={styles.contactRow}>
                  <Feather name="mail" size={12} color={COLORS.textMuted} />
                  <Text style={styles.contactText}>{student.email}</Text>
                </View>
                <View style={styles.contactRow}>
                  <Feather name="phone" size={12} color={COLORS.textMuted} />
                  <Text style={styles.contactText}>{student.phone}</Text>
                </View>
                <View style={styles.contactRow}>
                  <Feather name="hash" size={12} color={COLORS.textMuted} />
                  <Text style={styles.contactText}>STUDNO: {student.studNo}</Text>
                </View>
              </View>

              <View style={styles.requestStats}>
                <View style={styles.requestBadgeRow}>
                  <Text style={styles.requestLabel}>Requests:</Text>
                  <View style={[styles.requestBadge, { backgroundColor: COLORS.grayLight }]}>
                    <Text style={[styles.requestBadgeText, { color: COLORS.textMain }]}>
                      {student.requests.total} total
                    </Text>
                  </View>
                  {student.requests.approved > 0 && (
                    <View style={[styles.requestBadge, { backgroundColor: COLORS.approvedBg }]}>
                      <Text style={[styles.requestBadgeText, { color: COLORS.approvedText }]}>
                        {student.requests.approved} approved
                      </Text>
                    </View>
                  )}
                  {student.requests.pending > 0 && (
                    <View style={[styles.requestBadge, { backgroundColor: COLORS.pendingBg }]}>
                      <Text style={[styles.requestBadgeText, { color: COLORS.pendingText }]}>
                        {student.requests.pending} pending
                      </Text>
                    </View>
                  )}
                  {student.requests.rejected > 0 && (
                    <View style={[styles.requestBadge, { backgroundColor: COLORS.rejectedBg }]}>
                      <Text style={[styles.requestBadgeText, { color: COLORS.rejectedText }]}>
                        {student.requests.rejected} rejected
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.studentFooter}>
                <Text style={styles.memberSince}>Member since: {student.memberSince}</Text>
                <TouchableOpacity style={styles.issueStrikeButton}>
                  <Feather name="alert-triangle" size={12} color={COLORS.danger} />
                  <Text style={styles.issueStrikeText}>Issue strike</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <View style={styles.footerNote}>
            <Feather name="info" size={12} color={COLORS.textMuted} />
            <Text style={styles.footerNoteText}>
              Counts update automatically whenever students submit or supervisors decide on a request.
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
            const showBadge = item.name === 'Requests' && totalPending > 0;

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
                    color={isActive ? theme.primary : theme.textMuted}
                  />
                  {showBadge && (
                    <View style={styles.navBadge}>
                      <Text style={styles.navBadgeText}>{totalPending}</Text>
                    </View>
                  )}
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

const baseStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  scrollContent: { padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 20,
    marginHorizontal: -16,
    marginTop: -16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 40, height: 40, marginRight: 10 },
  headerTextContainer: { justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textMain },
  headerSubtitle: {
    fontSize: 9,
    fontWeight: '600',
    color: 'red',
    letterSpacing: 1,
    marginTop: 2,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { marginLeft: 14 },
  titleSection: { marginBottom: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.darkBlue },
  refreshButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 6,
  },
  refreshText: { fontSize: 12, fontWeight: '600', color: COLORS.textMain, marginLeft: 4 },
  pageSubtitle: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },
  statsRow: { flexDirection: 'row', marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: COLORS.card, padding: 12, borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.border, position: 'relative',
    marginHorizontal: 4,
  },
  statLabel: { fontSize: 8, fontWeight: 'bold', color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 4, maxWidth: '80%' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.darkBlue },
  statIcon: { position: 'absolute', top: 10, right: 10 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    paddingHorizontal: 12, marginBottom: 16,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 13, color: COLORS.textMain },
  emptyText: { textAlign: 'center', color: COLORS.textMuted, paddingVertical: 20 },
  studentCard: {
    backgroundColor: COLORS.card, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  studentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  studentMainInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarStudent: {
    width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarStudentText: { fontWeight: 'bold', fontSize: 14 },
  studentTextInfo: { flex: 1, marginRight: 8 },
  studentName: { fontSize: 15, fontWeight: 'bold', color: COLORS.textMain },
  studentCourse: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  statusBadge: {
    backgroundColor: COLORS.activeBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  statusText: { color: COLORS.activeText, fontSize: 11, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  contactSection: { marginBottom: 12 },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  contactText: { fontSize: 12, color: COLORS.textMuted, marginLeft: 8 },
  requestStats: { marginBottom: 12 },
  requestLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 6, fontWeight: '600' },
  requestBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  requestBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginRight: 6, marginBottom: 4 },
  requestBadgeText: { fontSize: 10, fontWeight: 'bold' },
  studentFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12,
  },
  memberSince: { fontSize: 11, color: COLORS.textMuted },
  issueStrikeButton: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.danger,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4,
  },
  issueStrikeText: { color: COLORS.danger, fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
  footerNote: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 },
  footerNoteText: { fontSize: 11, color: COLORS.textMuted, flex: 1, lineHeight: 16, marginLeft: 6 },

  // ✅ UPDATED: Bottom Navigation Bar — matches supervisor dashboard (6 items)
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
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    minWidth: 50,
    flex: 1,
  },
  navIconContainer: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  navBadge: {
    position: 'absolute', top: -4, right: -8, backgroundColor: COLORS.danger,
    borderRadius: 8, minWidth: 16, height: 16, paddingHorizontal: 3,
    justifyContent: 'center', alignItems: 'center',
  },
  navBadgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
  navText: { fontSize: 9, color: COLORS.textMuted, marginTop: 4 },
  navTextActive: { color: COLORS.primary, fontWeight: 'bold' },
});