// src/app/supReport.jsx
import { Feather, Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Image,
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
import { CountBadge, useSupervisorBadges } from '@/components/supervisor/SupervisorBadges';
import { useSupervisorStyles, useSupervisorTheme } from '@/contexts/SupervisorThemeContext';

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
  rejectedBg: '#FEE2E2',
  rejectedText: '#EF4444',
  approvedBg: '#D1FAE5',
  approvedText: '#059669',
  pendingBg: '#FEF3C7',
  pendingText: '#D97706',
  neutralBg: '#F3F4F6',
  staffCardBg: '#DBEAFE',
  staffCardBorder: '#BFDBFE',
};

// ✅ Hard-coded NAV paths remain (routing config, not data)
const NAV_ITEMS = [
  { name: 'Dashboard',   icon: 'grid-outline',          path: '/supervisorDash' },
  { name: 'Calendar',    icon: 'calendar-outline',      path: '/supCal'         },
  { name: 'Requests',    icon: 'document-text-outline', path: '/supRequest'     },
  { name: 'Assistances', icon: 'people-outline',        path: '/supAssistants'  },
  { name: 'Reports',     icon: 'bar-chart-outline',     path: '/supReport'      },
  { name: 'Profile',     icon: 'person-outline',        path: '/supProfile'     },
];

// --- Helper: derive status pill colors from a status string ---
const getStatusColors = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'rejected':
      return { bg: COLORS.rejectedBg, text: COLORS.rejectedText };
    case 'approved':
      return { bg: COLORS.approvedBg, text: COLORS.approvedText };
    case 'pending':
      return { bg: COLORS.pendingBg, text: COLORS.pendingText };
    default:
      return { bg: COLORS.neutralBg, text: COLORS.textMuted };
  }
};

// --- Helper: parse "4 hours" / "1.5h" → number of hours ---
const parseHours = (duration) => {
  if (!duration) return 0;
  const match = String(duration).match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
};

// --- Helper: format a JS Date → "DD MMM YYYY" ---
const formatDate = (value) => {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function PerformanceReports() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const { isDarkMode, toggleTheme, theme } = useSupervisorTheme();
  const styles = useSupervisorStyles(baseStyles);
  const { pendingRequestCount, unreadNotificationCount } = useSupervisorBadges();

  // ---------------------------------------------------------------------------
  // Report data — populate these via your API / route params / props.
  // ---------------------------------------------------------------------------
  const [shiftData] = useState([]);      // [{ id, name, position, date, time, duration }]
  const [requestData] = useState([]);    // [{ id, name, request, date, status }]
  const [staffData] = useState([]);      // [{ id, initials, name, hours, requests, location, days }]

  // ---------------------------------------------------------------------------
  // Period / filter selection — no more hard-coded "Last 7 Days" or date range.
  // ---------------------------------------------------------------------------
  const [periodLabel, setPeriodLabel] = useState(null); // e.g. "Last 7 Days"
  const [dateRange, setDateRange] = useState({ start: null, end: null });

  // ---------------------------------------------------------------------------
  // Derived stats (replaces the hard-coded 4.0h / 2 / 2)
  // ---------------------------------------------------------------------------
  const totalHours = useMemo(
    () =>
      shiftData.reduce((sum, shift) => sum + parseHours(shift.duration), 0),
    [shiftData]
  );

  const requestCount = requestData.length;

  const assistantsWithRequests = useMemo(
    () => new Set(requestData.map((r) => r.name)).size,
    [requestData]
  );

  const hasDateRange = Boolean(dateRange.start && dateRange.end);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <View style={styles.pageContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* --- HEADER --- */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Image source={LogoImg} style={styles.logoImage} resizeMode="contain" />
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>Library Log</Text>
                <Text style={styles.headerSubtitle}>supervisor portal</Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.iconButton} onPress={toggleTheme}>
                <Feather
                  name={isDarkMode ? 'sun' : 'moon'}
                  size={22}
                  color={theme.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push('/supNotification')}
              >
                <Ionicons name="notifications-outline" size={22} color={theme.primary} />
                <CountBadge count={unreadNotificationCount} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push('/logOut')}
              >
                <Ionicons name="log-out-outline" size={22} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* --- TITLE SECTION --- */}
          <View style={styles.titleSection}>
            <Text style={styles.pageTitle}>Performance Reports</Text>
            <Text style={styles.pageSubtitle}>
              Review and analyze student activity and work efficiency metrics. Use the
              period filter to generate details for today, the current month, the last 7
              days, or a specific date range.
            </Text>

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity style={styles.exportButton}>
                <Feather name="download" size={14} color={COLORS.textMain} />
                <Text style={styles.exportText}>Export CSV</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.generateButton}>
                <Feather name="file-text" size={14} color="#FFF" />
                <Text style={styles.generateText}>Generate New Report</Text>
                <Feather name="chevron-down" size={14} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* --- STATS ROW (computed from data) --- */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>TOTAL HOURS</Text>
              <Text style={styles.statValue}>{totalHours.toFixed(1)}h</Text>
              <Feather
                name="bar-chart-2"
                size={14}
                color={COLORS.primary}
                style={styles.statIcon}
              />
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>REQUESTS IN PERIOD</Text>
              <Text style={styles.statValue}>{requestCount}</Text>
              <Feather
                name="file-text"
                size={14}
                color={COLORS.primary}
                style={styles.statIcon}
              />
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>ASSISTANTS WITH REQUESTS</Text>
              <Text style={styles.statValue}>{assistantsWithRequests}</Text>
              <Feather
                name="users"
                size={14}
                color={COLORS.primary}
                style={styles.statIcon}
              />
            </View>
          </View>

          {/* --- FILTER BAR --- */}
          <View style={styles.filterContainer}>
            <View style={styles.searchContainer}>
              <Feather
                name="search"
                size={16}
                color={COLORS.textMuted}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Filter by student name or role..."
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={styles.filterActions}>
              <TouchableOpacity style={[styles.filterButton, { marginRight: 8 }]}>
                <Feather name="filter" size={12} color={COLORS.textMain} />
                <Text style={styles.filterText}>Filters</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterButton}>
                <Feather name="calendar" size={12} color={COLORS.textMain} />
                <Text style={styles.filterText}>{periodLabel || 'Select period'}</Text>
                <Feather name="chevron-down" size={12} color={COLORS.textMain} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Range Info — only shown when a real range is selected */}
          {hasDateRange && (
            <View style={styles.dateRangeContainer}>
              <Text style={styles.dateRangeText}>
                Report details for:{' '}
                <Text style={styles.dateRangeHighlight}>
                  {formatDate(dateRange.start)} – {formatDate(dateRange.end)}
                </Text>
              </Text>
            </View>
          )}

          {/* --- SHIFT DETAILS --- */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Shift details in selected period</Text>
            <Text style={styles.sectionSubtitle}>
              Every scheduled shift contributes its duration to the report totals.
            </Text>

            {shiftData.length === 0 ? (
              <Text style={styles.emptyText}>No shifts recorded in this period.</Text>
            ) : (
              shiftData.map((item) => (
                <View key={item.id} style={styles.tableCard}>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>STUDENT ASSISTANT</Text>
                    <Text style={styles.tableValue}>{item.name}</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>POSITION</Text>
                    <Text style={styles.tableValue}>{item.position}</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>DATE</Text>
                    <Text style={styles.tableValue}>{item.date}</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>SHIFT TIME</Text>
                    <Text style={styles.tableValue}>{item.time}</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>DURATION</Text>
                    <Text
                      style={[
                        styles.tableValue,
                        { fontWeight: 'bold', color: COLORS.darkBlue },
                      ]}
                    >
                      {item.duration}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* --- REQUEST DETAILS --- */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Request details in selected period</Text>
            <Text style={styles.sectionSubtitle}>
              These requests match the active date filter and are included in the report
              period.
            </Text>

            {requestData.length === 0 ? (
              <Text style={styles.emptyText}>No requests in this period.</Text>
            ) : (
              requestData.map((item) => {
                const statusColors = getStatusColors(item.status);
                return (
                  <View key={item.id} style={styles.tableCard}>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableLabel}>STUDENT ASSISTANT</Text>
                      <Text style={styles.tableValue}>{item.name}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableLabel}>REQUEST</Text>
                      <Text style={styles.tableValue}>{item.request}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableLabel}>DATE</Text>
                      <Text style={styles.tableValue}>{item.date}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableLabel}>STATUS</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: statusColors.bg },
                        ]}
                      >
                        <Text
                          style={[styles.statusText, { color: statusColors.text }]}
                        >
                          {item.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* --- STAFF GRID --- */}
          {staffData.length === 0 ? (
            <View style={styles.sectionCard}>
              <Text style={styles.emptyText}>No staff data available.</Text>
            </View>
          ) : (
            <View style={styles.staffGrid}>
              {staffData.map((staff) => (
                <View key={staff.id} style={styles.staffCard}>
                  <View style={styles.staffHeader}>
                    <View style={styles.staffAvatar}>
                      <Text style={styles.staffAvatarText}>{staff.initials}</Text>
                    </View>
                    <Text style={styles.staffName} numberOfLines={1}>
                      {staff.name}
                    </Text>
                    <Feather
                      name="more-horizontal"
                      size={16}
                      color={COLORS.textMuted}
                    />
                  </View>

                  <View style={styles.staffStatsRow}>
                    <View>
                      <Text style={styles.staffStatLabel}>HOURS WORKED</Text>
                      <Text style={styles.staffStatValue}>{staff.hours}</Text>
                    </View>
                    <View>
                      <Text style={styles.staffStatLabel}>REQUESTS</Text>
                      <Text style={styles.staffStatValue}>{staff.requests}</Text>
                    </View>
                  </View>

                  <View style={styles.staffFooter}>
                    <Text style={styles.staffLocation}>{staff.location}</Text>
                    <Text style={styles.staffDays}>{staff.days}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Padding for bottom nav */}
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
                    color={isActive ? theme.primary : theme.textMuted}
                  />
                  {item.name === 'Requests' && (
                    <CountBadge count={pendingRequestCount} />
                  )}
                </View>
                <Text style={[styles.navText, isActive && styles.navTextActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

// --- Styles ---
const baseStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  pageContainer: { flex: 1, width: '100%', height: '100%' },
  scrollContent: { padding: 16 },

  // Header
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

  // Title Section
  titleSection: { marginBottom: 16 },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkBlue,
    fontFamily: 'serif',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  actionButtonsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  exportText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMain,
    marginLeft: 6,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  generateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
    marginHorizontal: 6,
  },

  // Stats Row
  statsRow: { flexDirection: 'row', marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
    marginHorizontal: 4,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
    height: 20,
    maxWidth: '80%',
  },
  statValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.darkBlue },
  statIcon: { position: 'absolute', top: 10, right: 10 },

  // Filter Section
  filterContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textMain,
  },
  filterActions: { flexDirection: 'row' },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMain,
    marginHorizontal: 6,
  },

  // Date Range
  dateRangeContainer: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  dateRangeText: { fontSize: 12, color: COLORS.textMain },
  dateRangeHighlight: { fontWeight: 'bold', color: COLORS.primary },

  // Section Cards
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textMain,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 12,
    lineHeight: 16,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },

  // Table Card
  tableCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tableLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  tableValue: {
    fontSize: 12,
    color: COLORS.textMain,
    textAlign: 'right',
    flex: 1,
    paddingLeft: 16,
  },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: 'bold' },

  // Staff Grid
  staffGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  staffCard: {
    width: '48%',
    backgroundColor: COLORS.staffCardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.staffCardBorder,
    padding: 12,
    marginBottom: 12,
  },
  staffHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  staffAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  staffAvatarText: { fontSize: 10, fontWeight: 'bold', color: COLORS.textMain },
  staffName: {
    flex: 1,
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textMain,
  },
  staffStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  staffStatLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  staffStatValue: { fontSize: 12, fontWeight: 'bold', color: COLORS.textMain },
  staffFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 6,
  },
  staffLocation: { fontSize: 10, color: COLORS.textMuted, marginBottom: 2 },
  staffDays: { fontSize: 10, fontWeight: 'bold', color: COLORS.textMain },

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
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    minWidth: 50,
    flex: 1,
  },
  navIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBadgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
  navText: { fontSize: 9, color: COLORS.textMuted, marginTop: 4 },
  navTextActive: { color: COLORS.primary, fontWeight: 'bold' },
});