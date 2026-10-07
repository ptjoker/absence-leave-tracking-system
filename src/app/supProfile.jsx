import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { apiFetch, getSession } from '@/lib/api';

const COLORS = {
  primary: '#2563EB',
  darkBlue: '#1E3A8A',
  textMain: '#111827',
  textMuted: '#6B7280',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E5E7EB',
  activeBg: '#D1FAE5',
  activeText: '#059669',
  studentBadgeBg: '#DBEAFE',
  studentBadgeText: '#2563EB',
};

function initialsFromName(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return String(iso);
  }
}

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProfile = async () => {
    try {
      const session = await getSession();
      if (session?.user) setUser(session.user);

      const res = await apiFetch('/api/requests');
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        // Not needed for display, just confirms the session works
      }
    } catch (err) {
      console.error('Profile load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const name = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User'
    : 'User';
  const initials = initialsFromName(name);
  const role = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Student';
  const studentNumber = user?.student_number || '—';
  const course = user?.course || '—';
  const studentEmail = user?.student_email || user?.email || '—';
  const personalEmail = user?.personal_email || '—';
  const cellNumber = user?.cell_number || '—';
  const currentYear = user?.level_of_study || '—';
  const memberSince = formatDate(user?.created_at);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.themeToggle}>
          <Feather name="moon" size={16} color={COLORS.textMuted} />
          <Text style={styles.themeText}>
            Change mode <Text style={{ color: '#F59E0B' }}>Dark</Text>
          </Text>
        </TouchableOpacity>

        <View style={styles.userProfile}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{name}</Text>
            <Text style={styles.userRole}>Student Assist</Text>
          </View>
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarSmallText}>{initials}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>My Profile</Text>
          <View style={styles.actionRow}>
            <View style={styles.activeBadge}>
              <Feather name="check-circle" size={12} color={COLORS.activeText} />
              <Text style={styles.activeText}>Active</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Feather name="edit-2" size={14} color="#FFF" />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>{initials}</Text>
            </View>
            <View style={styles.profileHeaderText}>
              <View style={styles.nameRow}>
                <Text style={styles.profileName}>{name}</Text>
                <View style={styles.studentBadge}>
                  <Text style={styles.studentBadgeText}>{role}</Text>
                </View>
              </View>
              <View style={styles.metaRow}>
                <Feather name="hash" size={12} color={COLORS.textMuted} />
                <Text style={styles.metaText}>StudNo: {studentNumber}</Text>
                <Feather name="book" size={12} color={COLORS.textMuted} style={{ marginLeft: 12 }} />
                <Text style={styles.metaText}>{course}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="mail" size={14} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>CONTACT INFORMATION</Text>
            </View>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>STUDENT EMAIL</Text>
                <View style={styles.infoValueRow}>
                  <Feather name="mail" size={12} color={COLORS.textMuted} />
                  <Text style={styles.infoValue}>{studentEmail}</Text>
                </View>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>PERSONAL EMAIL</Text>
                <View style={styles.infoValueRow}>
                  <Feather name="mail" size={12} color={COLORS.textMuted} />
                  <Text style={styles.infoValue}>{personalEmail}</Text>
                </View>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>CELL NUMBER</Text>
                <View style={styles.infoValueRow}>
                  <Feather name="phone" size={12} color={COLORS.textMuted} />
                  <Text style={styles.infoValue}>{cellNumber}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="briefcase" size={14} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>ACADEMIC DETAILS</Text>
            </View>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>COURSE / DEPARTMENT</Text>
                <View style={styles.infoValueRow}>
                  <Feather name="book" size={12} color={COLORS.textMuted} />
                  <Text style={styles.infoValue}>{course}</Text>
                </View>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>CURRENT YEAR</Text>
                <View style={styles.infoValueRow}>
                  <Feather name="calendar" size={12} color={COLORS.textMuted} />
                  <Text style={styles.infoValue}>{currentYear}</Text>
                </View>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>MEMBER SINCE</Text>
                <View style={styles.infoValueRow}>
                  <Feather name="calendar" size={12} color={COLORS.textMuted} />
                  <Text style={styles.infoValue}>{memberSince}</Text>
                </View>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>ACCOUNT TYPE</Text>
                <View style={styles.infoValueRow}>
                  <Feather name="user" size={12} color={COLORS.textMuted} />
                  <Text style={styles.infoValue}>{role}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="info" size={14} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Data Privacy Notice</Text>
            </View>
            <Text style={styles.privacyText}>
              Identity and academic fields are managed by the University Registrar and cannot be edited here. Contact the Student Affairs Office if any details are incorrect.
            </Text>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.cardFooterLabel}>VERIFIED PROFILE</Text>
            <Text style={styles.cardFooterDate}>Member since {memberSince}</Text>
          </View>
        </View>

        <View style={styles.pageFooter}>
          <Text style={styles.pageFooterText}>General: general@tut.ac.za • Contact: +27 (0)86 110 2421</Text>
          <Text style={styles.pageFooterText}>© 2026 Faculty of Information and Communication Technology. All rights reserved.</Text>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      <View style={styles.bottomNav}>
        {[
          { name: 'Dashboard', icon: 'grid', path: '/studentDash' },
          { name: 'Request', icon: 'plus-circle', path: '/studentDash' },
          { name: 'History', icon: 'clock', path: '/studentDash' },
          { name: 'Schedule', icon: 'calendar', path: '/studentCal' },
          { name: 'Profile', icon: 'user', path: '/profile' },
        ].map((item) => (
          <TouchableOpacity
            key={item.name}
            style={styles.navItem}
            onPress={() => router.push(item.path)}
          >
            <Feather
              name={item.icon}
              size={20}
              color={item.name === 'Profile' ? COLORS.primary : COLORS.textMuted}
            />
            <Text
              style={[
                styles.navText,
                item.name === 'Profile' && styles.navTextActive,
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  themeToggle: { flexDirection: 'row', alignItems: 'center' },
  themeText: { marginLeft: 6, fontSize: 12, color: COLORS.textMuted },
  userProfile: { flexDirection: 'row', alignItems: 'center' },
  userInfo: { alignItems: 'flex-end', marginRight: 8 },
  userName: { fontSize: 12, fontWeight: 'bold', color: COLORS.textMain },
  userRole: { fontSize: 10, color: COLORS.textMuted },
  avatarSmall: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarSmallText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  scrollContent: { padding: 16 },
  titleSection: { marginBottom: 16 },
  pageTitle: { fontSize: 26, fontWeight: 'bold', color: COLORS.darkBlue, marginBottom: 12 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.activeBg,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4,
  },
  activeText: { color: COLORS.activeText, fontSize: 12, fontWeight: 'bold' },
  editButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, gap: 6,
  },
  editButtonText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  profileCard: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
  },
  profileHeader: { flexDirection: 'row', marginBottom: 16 },
  avatarLarge: {
    width: 60, height: 60, borderRadius: 12, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  avatarLargeText: { color: '#FFF', fontWeight: 'bold', fontSize: 24 },
  profileHeaderText: { flex: 1, justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  profileName: { fontSize: 20, fontWeight: 'bold', color: COLORS.darkBlue, marginRight: 8 },
  studentBadge: {
    backgroundColor: COLORS.studentBadgeBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
  },
  studentBadgeText: { color: COLORS.studentBadgeText, fontSize: 10, fontWeight: 'bold' },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  metaText: { fontSize: 12, color: COLORS.textMuted, marginLeft: 4 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  section: { marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: COLORS.darkBlue, letterSpacing: 1 },
  infoGrid: { gap: 12 },
  infoItem: { marginBottom: 4 },
  infoLabel: { fontSize: 10, fontWeight: 'bold', color: COLORS.textMuted, marginBottom: 4, letterSpacing: 0.5 },
  infoValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoValue: { fontSize: 13, color: COLORS.textMain, flex: 1 },
  privacyText: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18 },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  cardFooterLabel: { fontSize: 10, fontWeight: 'bold', color: COLORS.primary, letterSpacing: 1 },
  cardFooterDate: { fontSize: 10, color: COLORS.textMuted, fontStyle: 'italic' },
  pageFooter: { marginTop: 24, alignItems: 'center' },
  pageFooterText: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center', marginBottom: 4 },
  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border,
    paddingVertical: 10, paddingBottom: 20,
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  navItem: { alignItems: 'center', justifyContent: 'center', padding: 4 },
  navText: { fontSize: 10, color: COLORS.textMuted, marginTop: 4 },
  navTextActive: { color: COLORS.primary, fontWeight: 'bold' },
});