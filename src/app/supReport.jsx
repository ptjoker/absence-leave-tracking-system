// src/app/supReport.jsx
import { Feather, Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
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
import { exportReportCsv } from '@/lib/reportExport';

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
  staffCardBg: '#DBEAFE',
  staffCardBorder: '#BFDBFE',
};

// --- Report period options (shown in the dropdown) ---
const PERIOD_OPTIONS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Last 7 Days' },
  { key: 'month', label: 'This Month' },
  { key: 'custom', label: 'Custom Range' },
  { key: 'all', label: 'All Time' },
];

// --- Mock Data ---
// Dates are now real ISO strings (YYYY-MM-DD) so we can filter by them.
const shiftData = [
  {
    id: '1',
    name: 'Peter Thomas',
    position: 'Library Assistant',
    date: '2026-09-30',
    time: '08:00 AM - 04:00 PM',
    hours: 4,
  },
];

const requestData = [
  {
    id: '1',
    name: 'Nothando Nkosi',
    request: 'Sick Leave',
    startDate: '2026-10-05',
    endDate: '2026-10-05',
    status: 'Rejected',
  },
  {
    id: '2',
    name: 'Peter Thomas',
    request: 'Day-off Request',
    startDate: '2026-09-30',
    endDate: '2026-09-30',
    status: 'Rejected',
  },
];

const staffData = [
  { id: '1', initials: 'SM', name: 'Simphiwe Masanabo', location: 'CIRCULAR 2' },
  { id: '2', initials: 'SL', name: 'Segomoto Lencwe', location: 'ICENTER' },
  { id: '3', initials: 'ST', name: 'Shoba Thabiso', location: 'ICENTER' },
  { id: '4', initials: 'MS', name: 'Mawelela Sibusiso', location: 'ICENTER' },
  { id: '5', initials: 'MB', name: 'Mashabela Basetsana', location: 'ICENTER2' },
  { id: '6', initials: 'JD', name: 'Jiyane Duduzile', location: 'ICENTER' },
  { id: '7', initials: 'PT', name: 'Peter Thomas', location: 'LIBRARY ASSISTANT' },
  { id: '8', initials: 'NN', name: 'Nothando Nkosi', location: '—' },
];

const NAV_ITEMS = [
  { name: 'Dashboard',   icon: 'grid-outline',          path: '/supervisorDash' },
  { name: 'Calendar',    icon: 'calendar-outline',      path: '/supCal'         },
  { name: 'Requests',    icon: 'document-text-outline', path: '/supRequest'     },
  { name: 'Assistances', icon: 'people-outline',        path: '/supAssistants'  },
  { name: 'Reports',     icon: 'bar-chart-outline',     path: '/supReport'      },
  { name: 'Profile',     icon: 'person-outline',        path: '/supProfile'     },
];

// --- Small helper functions ---

// Turns "2026-09-30" into a real Date object (midnight, local time)
const toDate = (str) => new Date(`${str}T00:00:00`);

// Checks that text looks like YYYY-MM-DD and is a real date
const isValidDateText = (str) =>
  /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(toDate(str).getTime());

// Turns a Date into "30 Sep 2026"
const formatDate = (d) =>
  d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

// Works out the start and end date for the chosen period.
// Returns null for "All Time" (meaning: no date filter).
const getRange = (period, customStart, customEnd) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (period === 'today') return { start: today, end: today };

  if (period === 'week') {
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    return { start, end: today };
  }

  if (period === 'month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { start, end: today };
  }

  if (period === 'custom') {
    return { start: toDate(customStart), end: toDate(customEnd) };
  }

  return null; // 'all'
};

// Wraps a value in quotes so commas inside it don't break the CSV
const csvCell = (value) => `"${String(value).replace(/"/g, '""')}"`;

export default function PerformanceReports() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const { isDarkMode, toggleTheme, theme } = useSupervisorTheme();
  const styles = useSupervisorStyles(baseStyles);
  const { pendingRequestCount, unreadNotificationCount } = useSupervisorBadges();

  // --- State: things that can change on screen ---
  const [period, setPeriod] = useState('all');       // which period is selected
  const [menuOpen, setMenuOpen] = useState(false);   // is the dropdown showing?
  const [search, setSearch] = useState('');          // text in the search box
  const [customStart, setCustomStart] = useState('2026-09-30');
  const [customEnd, setCustomEnd] = useState('2026-10-06');

  const customIsValid =
    isValidDateText(customStart) &&
    isValidDateText(customEnd) &&
    toDate(customStart) <= toDate(customEnd);

  // --- Work out what to show (re-runs only when the inputs change) ---
  const report = useMemo(() => {
    const range =
      period === 'custom' && !customIsValid
        ? null
        : getRange(period, customStart, customEnd);

    const query = search.trim().toLowerCase();
    const matchesSearch = (name, extra = '') =>
      !query || `${name} ${extra}`.toLowerCase().includes(query);

    // Keep only shifts inside the period (and matching the search)
    const shifts = shiftData.filter((s) => {
      const d = toDate(s.date);
      const inRange = !range || (d >= range.start && d <= range.end);
      return inRange && matchesSearch(s.name, s.position);
    });

    // Keep requests that overlap the period (and match the search)
    const requests = requestData.filter((r) => {
      const inRange =
        !range || (toDate(r.startDate) <= range.end && toDate(r.endDate) >= range.start);
      return inRange && matchesSearch(r.name, r.request);
    });

    // Build the staff cards from the filtered shifts and requests
    const staff = staffData
      .filter((p) => matchesSearch(p.name, p.location))
      .map((p) => {
        const myShifts = shifts.filter((s) => s.name === p.name);
        const myRequests = requests.filter((r) => r.name === p.name);
        return {
          ...p,
          hours: myShifts.reduce((sum, s) => sum + s.hours, 0),
          requests: myRequests.length,
          days: myShifts.length,
        };
      });

    return {
      range,
      shifts,
      requests,
      staff,
      totalHours: shifts.reduce((sum, s) => sum + s.hours, 0),
      assistantsWithRequests: new Set(requests.map((r) => r.name)).size,
    };
  }, [period, customStart, customEnd, customIsValid, search]);

  const periodLabel = PERIOD_OPTIONS.find((o) => o.key === period).label;

  const rangeText = report.range
    ? `${formatDate(report.range.start)} – ${formatDate(report.range.end)}`
    : 'All time';

  // --- Export CSV ---
  const handleExport = async () => {
    const lines = [];
    lines.push(`Performance Report,${csvCell(rangeText)}`);
    lines.push('');

    lines.push('SHIFTS');
    lines.push('Student Assistant,Position,Date,Shift Time,Duration (hours)');
    report.shifts.forEach((s) =>
      lines.push([s.name, s.position, s.date, s.time, s.hours].map(csvCell).join(','))
    );
    lines.push('');

    lines.push('REQUESTS');
    lines.push('Student Assistant,Request,Start Date,End Date,Status');
    report.requests.forEach((r) =>
      lines.push([r.name, r.request, r.startDate, r.endDate, r.status].map(csvCell).join(','))
    );
    lines.push('');

    lines.push('STAFF SUMMARY');
    lines.push('Name,Location,Hours Worked,Requests');
    report.staff.forEach((p) =>
      lines.push([p.name, p.location, p.hours.toFixed(1), p.requests].map(csvCell).join(','))
    );

    try {
      await exportReportCsv(lines.join('\n'), 'performance-report.csv');
    } catch (error) {
      Alert.alert('Export failed', 'Could not export the report. Please try again.');
    }
  };

  // --- Choosing a period from the dropdown ---
  const handleSelectPeriod = (key) => {
    setPeriod(key);
    // Keep the menu open for "Custom Range" so the user can type dates
    if (key !== 'custom') setMenuOpen(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <View style={styles.pageContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
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
                <Feather name={isDarkMode ? 'sun' : 'moon'} size={22} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push('/supNotification')}
              >
                <Ionicons name="notifications-outline" size={22} color={theme.primary} />
                <CountBadge count={unreadNotificationCount} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/logOut')}>
                <Ionicons name="log-out-outline" size={22} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* --- TITLE SECTION --- */}
          <View style={styles.titleSection}>
            <Text style={styles.pageTitle}>Performance Reports</Text>
            <Text style={styles.pageSubtitle}>
              Review and analyze student activity and work efficiency metrics. Use the period
              filter to generate details for today, the current month, the last 7 days, or a
              specific date range.
            </Text>

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
                <Feather name="download" size={14} color={COLORS.textMain} />
                <Text style={styles.exportText}>Export CSV</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.generateButton} onPress={() => setMenuOpen(!menuOpen)}>
                <Feather name="file-text" size={14} color="#FFF" />
                <Text style={styles.generateText}>Generate New Report</Text>
                <Feather name={menuOpen ? 'chevron-up' : 'chevron-down'} size={14} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* --- DROPDOWN MENU (only shows when menuOpen is true) --- */}
            {menuOpen && (
              <View style={styles.menu}>
                {PERIOD_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.menuItem, period === option.key && styles.menuItemActive]}
                    onPress={() => handleSelectPeriod(option.key)}
                  >
                    <Text
                      style={[styles.menuItemText, period === option.key && styles.menuItemTextActive]}
                    >
                      {option.label}
                    </Text>
                    {period === option.key && (
                      <Feather name="check" size={14} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}

                {/* Date boxes for Custom Range */}
                {period === 'custom' && (
                  <View style={styles.customBox}>
                    <View style={styles.customRow}>
                      <TextInput
                        style={styles.dateInput}
                        value={customStart}
                        onChangeText={setCustomStart}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#9CA3AF"
                        maxLength={10}
                      />
                      <Text style={styles.customTo}>to</Text>
                      <TextInput
                        style={styles.dateInput}
                        value={customEnd}
                        onChangeText={setCustomEnd}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#9CA3AF"
                        maxLength={10}
                      />
                    </View>
                    {!customIsValid && (
                      <Text style={styles.errorText}>
                        Enter valid dates as YYYY-MM-DD (start must be before end).
                      </Text>
                    )}
                    <TouchableOpacity
                      style={[styles.applyButton, !customIsValid && { opacity: 0.5 }]}
                      disabled={!customIsValid}
                      onPress={() => setMenuOpen(false)}
                    >
                      <Text style={styles.applyText}>Apply</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* --- STATS ROW --- */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>TOTAL HOURS</Text>
              <Text style={styles.statValue}>{report.totalHours.toFixed(1)}h</Text>
              <Feather name="bar-chart-2" size={14} color={COLORS.primary} style={styles.statIcon} />
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>REQUESTS IN PERIOD</Text>
              <Text style={styles.statValue}>{report.requests.length}</Text>
              <Feather name="file-text" size={14} color={COLORS.primary} style={styles.statIcon} />
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>ASSISTANTS WITH REQUESTS</Text>
              <Text style={styles.statValue}>{report.assistantsWithRequests}</Text>
              <Feather name="users" size={14} color={COLORS.primary} style={styles.statIcon} />
            </View>
          </View>

          {/* --- FILTER BAR --- */}
          <View style={styles.filterContainer}>
            <View style={styles.searchContainer}>
              <Feather name="search" size={16} color={COLORS.textMuted} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Filter by student name or role..."
                placeholderTextColor="#9CA3AF"
                value={search}
                onChangeText={setSearch}
              />
            </View>
            <View style={styles.filterActions}>
              <TouchableOpacity
                style={[styles.filterButton, { marginRight: 8 }]}
                onPress={() => {
                  setSearch('');
                  setPeriod('all');
                }}
              >
                <Feather name="filter" size={12} color={COLORS.textMain} />
                <Text style={styles.filterText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterButton} onPress={() => setMenuOpen(!menuOpen)}>
                <Feather name="calendar" size={12} color={COLORS.textMain} />
                <Text style={styles.filterText}>{periodLabel}</Text>
                <Feather name="chevron-down" size={12} color={COLORS.textMain} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Range Info */}
          <View style={styles.dateRangeContainer}>
            <Text style={styles.dateRangeText}>
              Report details for: <Text style={styles.dateRangeHighlight}>{rangeText}</Text>
            </Text>
          </View>

          {/* --- SHIFT DETAILS --- */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Shift details in selected period</Text>
            <Text style={styles.sectionSubtitle}>
              Every scheduled shift contributes its duration to the report totals.
            </Text>

            {report.shifts.length === 0 && (
              <Text style={styles.emptyText}>No shifts in this period.</Text>
            )}

            {report.shifts.map((item) => (
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
                  <Text style={[styles.tableValue, { fontWeight: 'bold', color: COLORS.darkBlue }]}>
                    {item.hours} hours
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* --- REQUEST DETAILS --- */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Request details in selected period</Text>
            <Text style={styles.sectionSubtitle}>
              These requests match the active date filter and are included in the report period.
            </Text>

            {report.requests.length === 0 && (
              <Text style={styles.emptyText}>No requests in this period.</Text>
            )}

            {report.requests.map((item) => (
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
                  <Text style={styles.tableValue}>
                    {formatDate(toDate(item.startDate))} – {formatDate(toDate(item.endDate))}
                  </Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>STATUS</Text>
                  <View style={[styles.statusBadge, { backgroundColor: COLORS.rejectedBg }]}>
                    <Text style={[styles.statusText, { color: COLORS.rejectedText }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* --- STAFF GRID --- */}
          <View style={styles.staffGrid}>
            {report.staff.map((staff) => (
              <View key={staff.id} style={styles.staffCard}>
                <View style={styles.staffHeader}>
                  <View style={styles.staffAvatar}>
                    <Text style={styles.staffAvatarText}>{staff.initials}</Text>
                  </View>
                  <Text style={styles.staffName} numberOfLines={1}>{staff.name}</Text>
                  <Feather name="more-horizontal" size={16} color={COLORS.textMuted} />
                </View>

                <View style={styles.staffStatsRow}>
                  <View>
                    <Text style={styles.staffStatLabel}>HOURS WORKED</Text>
                    <Text style={styles.staffStatValue}>{staff.hours.toFixed(1)}h</Text>
                  </View>
                  <View>
                    <Text style={styles.staffStatLabel}>REQUESTS</Text>
                    <Text style={styles.staffStatValue}>{staff.requests}</Text>
                  </View>
                </View>

                <View style={styles.staffFooter}>
                  <Text style={styles.staffLocation}>{staff.location}</Text>
                  <Text style={styles.staffDays}>
                    {staff.days} {staff.days === 1 ? 'day' : 'days'}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* --- BOTTOM NAVIGATION BAR --- */}
        <View style={[styles.bottomNav, { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
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
                  {item.name === 'Requests' && <CountBadge count={pendingRequestCount} />}
                </View>
                <Text style={[styles.navText, isActive && styles.navTextActive]}>{item.name}</Text>
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
  headerSubtitle: { fontSize: 9, fontWeight: '600', color: 'red', letterSpacing: 1, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { marginLeft: 14 },

  // Title Section
  titleSection: { marginBottom: 16 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.darkBlue, fontFamily: 'serif', marginBottom: 8 },
  pageSubtitle: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18, marginBottom: 12 },
  actionButtonsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  exportButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 6, marginRight: 8, marginBottom: 8,
  },
  exportText: { fontSize: 12, fontWeight: '600', color: COLORS.textMain, marginLeft: 6 },
  generateButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, marginBottom: 8,
  },
  generateText: { fontSize: 12, fontWeight: '600', color: '#FFF', marginHorizontal: 6 },

  // Dropdown menu
  menu: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 4,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemActive: { backgroundColor: '#EFF6FF' },
  menuItemText: { fontSize: 13, color: COLORS.textMain },
  menuItemTextActive: { color: COLORS.primary, fontWeight: 'bold' },
  customBox: { padding: 12, backgroundColor: '#F8FAFC' },
  customRow: { flexDirection: 'row', alignItems: 'center' },
  dateInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: COLORS.textMain,
  },
  customTo: { marginHorizontal: 8, fontSize: 12, color: COLORS.textMuted },
  errorText: { fontSize: 11, color: COLORS.danger, marginTop: 8 },
  applyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  applyText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },

  // Stats Row
  statsRow: { flexDirection: 'row', marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: COLORS.card, padding: 12, borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.border, position: 'relative',
    marginHorizontal: 4,
  },
  statLabel: { fontSize: 8, fontWeight: 'bold', color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 4, height: 20, maxWidth: '80%' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.darkBlue },
  statIcon: { position: 'absolute', top: 10, right: 10 },

  // Filter Section
  filterContainer: {
    backgroundColor: COLORS.card, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, padding: 12, marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, paddingHorizontal: 12, marginBottom: 8,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 13, color: COLORS.textMain },
  filterActions: { flexDirection: 'row' },
  filterButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 6,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  filterText: { fontSize: 11, fontWeight: '600', color: COLORS.textMain, marginHorizontal: 6 },

  // Date Range
  dateRangeContainer: {
    backgroundColor: '#EFF6FF', padding: 12, borderRadius: 6, marginBottom: 16,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  dateRangeText: { fontSize: 12, color: COLORS.textMain },
  dateRangeHighlight: { fontWeight: 'bold', color: COLORS.primary },

  // Section Cards
  sectionCard: {
    backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 4 },
  sectionSubtitle: { fontSize: 11, color: COLORS.textMuted, marginBottom: 12, lineHeight: 16 },
  emptyText: { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic', paddingVertical: 8 },

  // Table Card
  tableCard: {
    backgroundColor: '#F8FAFC', borderRadius: 8, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tableLabel: { fontSize: 9, fontWeight: 'bold', color: COLORS.textMuted, letterSpacing: 0.5 },
  tableValue: { fontSize: 12, color: COLORS.textMain, textAlign: 'right', flex: 1, paddingLeft: 16 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: 'bold' },

  // Staff Grid
  staffGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  staffCard: {
    width: '48%', backgroundColor: COLORS.staffCardBg, borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.staffCardBorder, padding: 12, marginBottom: 12,
  },
  staffHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  staffAvatar: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center', marginRight: 6,
  },
  staffAvatarText: { fontSize: 10, fontWeight: 'bold', color: COLORS.textMain },
  staffName: { flex: 1, fontSize: 11, fontWeight: 'bold', color: COLORS.textMain },
  staffStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  staffStatLabel: { fontSize: 8, fontWeight: 'bold', color: COLORS.textMuted, marginBottom: 2 },
  staffStatValue: { fontSize: 12, fontWeight: 'bold', color: COLORS.textMain },
  staffFooter: { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 6 },
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
  navItem: { alignItems: 'center', justifyContent: 'center', padding: 2, minWidth: 50, flex: 1 },
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