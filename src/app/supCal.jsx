// src/app/supCal.jsx
import { Feather, Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import logoImg from '@/assets/images/logo.png';


const formatDate = (date) => {
  if (!date) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

// --- Theme Colors ---
const COLORS = {
  primary: '#2563EB',
  darkBlue: '#1E3A8A',
  textMain: '#111827',
  textMuted: '#6B7280',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E5E7EB',
  success: '#10B981',
  danger: '#EF4444',
  purpleLight: '#E0E7FF',
  purpleText: '#4F46E5',
  grayLight: '#F3F4F6',
  grayText: '#4B5563',
};

// --- Mock Data for Calendar ---
const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const calendarDays = [
  { day: '27', current: false }, { day: '28', current: false }, { day: '29', current: false },
  { day: '30', current: false }, { day: '1', current: true }, { day: '2', current: true },
  { day: '3', current: true }, { day: '4', current: true }, { day: '5', current: true },
  { day: '6', current: true, selected: true }, { day: '7', current: true },
  { day: '8', current: true }, { day: '9', current: true }, { day: '10', current: true },
  { day: '11', current: true }, { day: '12', current: true }, { day: '13', current: true },
  { day: '14', current: true }, { day: '15', current: true }, { day: '16', current: true },
  { day: '17', current: true }, { day: '18', current: true }, { day: '19', current: true },
  { day: '20', current: true }, { day: '21', current: true }, { day: '22', current: true },
  { day: '23', current: true }, { day: '24', current: true }, { day: '25', current: true },
  { day: '26', current: true }, { day: '27', current: true }, { day: '28', current: true },
  { day: '29', current: true }, { day: '30', current: true }, { day: '31', current: true },
];

// --- Bottom Nav Items (Mapped to Pages) ---
const NAV_ITEMS = [
  { name: 'Dashboard',   icon: 'grid-outline',          path: '/supervisorDash' },
  { name: 'Calendar',    icon: 'calendar-outline',      path: '/supCal'         },
  { name: 'Requests',    icon: 'document-text-outline', path: '/supRequest', badge: 1 },
  { name: 'Assistances', icon: 'people-outline',        path: '/supAssistants'  },
  { name: 'Reports',     icon: 'bar-chart-outline',     path: '/supReport'      },
];

export default function MasterSchedule() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Background Image with 70% White Overlay */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1590&auto=format&fit=crop' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* --- HEADER --- */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.themeToggle}>
              <Feather name="moon" size={16} color={COLORS.textMuted} />
              <Text style={styles.themeText}>
                Change mode <Text style={{ color: '#F59E0B' }}>Dark</Text>
              </Text>
            </TouchableOpacity>

            <View style={styles.userProfile}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>Sbongile Monta</Text>
                <Text style={styles.userRole}>Supervisor</Text>
              </View>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>SM</Text>
              </View>
            </View>
          </View>

          {/* --- TITLE & ACTIONS --- */}
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <Text style={styles.pageTitle}>Master Schedule</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.refreshButton}>
                  <Feather name="refresh-cw" size={14} color={COLORS.textMain} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.newShiftButton}>
                  <Feather name="plus" size={14} color="#FFF" />
                  <Text style={styles.newShiftText}>New Shift</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.pageSubtitle}>
              {"Manage every student assistant's shifts from a single monthly view. Each student has a unique color."}
            </Text>
          </View>

          {/* --- STATS ROW --- */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIndicator, { backgroundColor: COLORS.primary }]} />
              <View>
                <Text style={styles.statLabel}>TOTAL SHIFTS</Text>
                <Text style={styles.statValue}>6</Text>
              </View>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIndicator, { backgroundColor: COLORS.success }]} />
              <View>
                <Text style={styles.statLabel}>ACTIVE ASSISTANTS</Text>
                <Text style={styles.statValue}>3</Text>
              </View>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIndicator, { backgroundColor: '#F59E0B' }]} />
              <View>
                <Text style={styles.statLabel}>UPCOMING</Text>
                <Text style={styles.statValue}>2</Text>
              </View>
            </View>
          </View>

          {/* --- CALENDAR CARD --- */}
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <View style={styles.calendarTitleRow}>
                <View style={styles.calendarIcon}>
                  <Feather name="calendar" size={18} color="#FFF" />
                </View>
                <View>
                  <Text style={styles.calendarTitle}>October 2026</Text>
                  <Text style={styles.calendarSubtitle}>Library Resource Unit</Text>
                </View>
              </View>
              <View style={styles.calendarControls}>
                <TouchableOpacity style={styles.calendarNavBtn}><Feather name="chevron-left" size={16} color={COLORS.textMuted} /></TouchableOpacity>
                <TouchableOpacity style={styles.todayBtn}><Text style={styles.todayBtnText}>TODAY</Text></TouchableOpacity>
                <TouchableOpacity style={styles.calendarNavBtn}><Feather name="chevron-right" size={16} color={COLORS.textMuted} /></TouchableOpacity>
              </View>
            </View>

            {/* Calendar Grid */}
            <View style={styles.gridContainer}>
              {/* Week Days */}
              <View style={styles.weekRow}>
                {weekDays.map((day) => (
                  <Text key={day} style={styles.weekDayText}>{day}</Text>
                ))}
              </View>
              {/* Days */}
              <View style={styles.daysContainer}>
                {calendarDays.map((item, index) => (
                  <View key={index} style={[styles.dayCell, item.selected && styles.dayCellSelected]}>
                    <Text style={[styles.dayText, !item.current && styles.dayTextMuted]}>{item.day}</Text>
                    {/* Mock Event Tags */}
                    {item.day === '28' && <View style={[styles.eventTag, { backgroundColor: COLORS.purpleLight }]}><Text style={[styles.eventText, { color: COLORS.purpleText }]} numberOfLines={1}>PETER THOMAS</Text></View>}
                    {item.day === '29' && <View style={[styles.eventTag, { backgroundColor: COLORS.grayLight }]}><Text style={[styles.eventText, { color: COLORS.grayText }]} numberOfLines={1}>APPROVED LEA...</Text></View>}
                    {item.day === '30' && <View style={[styles.eventTag, { backgroundColor: COLORS.purpleLight }]}><Text style={[styles.eventText, { color: COLORS.purpleText }]} numberOfLines={1}>PETER THOMAS</Text></View>}
                    {item.day === '7' && <View style={[styles.eventTag, { backgroundColor: COLORS.grayLight }]}><Text style={[styles.eventText, { color: COLORS.grayText }]} numberOfLines={1}>APPROVED LEA...</Text></View>}
                    {item.day === '15' && <View style={[styles.eventTag, { backgroundColor: COLORS.purpleLight }]}><Text style={[styles.eventText, { color: COLORS.purpleText }]} numberOfLines={1}>SARAH NKOSI</Text></View>}
                    {item.day === '15' && <View style={[styles.eventTag, { backgroundColor: COLORS.purpleLight, marginTop: 2 }]}><Text style={[styles.eventText, { color: COLORS.purpleText }]} numberOfLines={1}>PETER THOMAS</Text></View>}
                  </View>
                ))}
              </View>
            </View>

            {/* Legend */}
            <View style={styles.legendContainer}>
              <Text style={styles.legendTitle}>LEGEND</Text>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} /><Text style={styles.legendText}>John Doe</Text></View>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} /><Text style={styles.legendText}>Peter Thomas</Text></View>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} /><Text style={styles.legendText}>Sarah Nkosi</Text></View>
              </View>
              <View style={styles.legendDescRow}>
                <Text style={styles.legendDesc}><Text style={{ color: '#10B981' }}>■</Text> Green box - Holiday</Text>
                <Text style={styles.legendDesc}><Text style={{ color: '#EF4444' }}>■</Text> Red box - Institutional closure</Text>
                <Text style={styles.legendDesc}><Text style={{ color: '#9CA3AF' }}>■</Text> Grey box - date swapped to</Text>
                <Text style={styles.legendDesc}><Text style={{ color: '#3B82F6' }}>□</Text> Blue box - date swapped from</Text>
              </View>
            </View>
          </View>

          {/* --- SIDEBAR PANELS (Stacked on Mobile) --- */}
          <View style={styles.sidePanel}>
            {/* Selected Day Card */}
            <View style={styles.panelCard}>
              <Text style={styles.panelDate}>6 October 2026</Text>
              <Text style={styles.panelSubtitle}>0 shifts scheduled</Text>

              <TouchableOpacity style={styles.closureButton}>
                <Feather name="bell" size={14} color={COLORS.danger} />
                <Text style={styles.closureButtonText}>Declare institutional closure</Text>
              </TouchableOpacity>

              <View style={styles.noShiftsBox}>
                <Text style={styles.noShiftsText}>No shifts scheduled for this date.</Text>
              </View>
            </View>

            {/* Scheduling Tips */}
            <View style={[styles.panelCard, styles.tipsCard]}>
              <View style={styles.panelHeader}>
                <Feather name="shield" size={16} color={COLORS.success} />
                <Text style={styles.panelTitle}>Scheduling Tips</Text>
              </View>
              <Text style={styles.tipText}>• Each student has a unique color for quick scanning.</Text>
              <Text style={styles.tipText}>• Days show up to 2 shifts before collapsing.</Text>
            </View>

            {/* View Timetable */}
            <View style={styles.panelCard}>
              <View style={styles.panelHeader}>
                <Feather name="clock" size={16} color={COLORS.primary} />
                <Text style={styles.panelTitle}>View Student Timetable</Text>
              </View>
              <Text style={styles.panelSubtitle}>Recent timetable uploads</Text>
              <View style={styles.noShiftsBox}>
                <Text style={styles.noShiftsText}>No timetables uploaded yet.</Text>
              </View>
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View all uploads</Text>
              </TouchableOpacity>
            </View>
          </View>

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
                    color={isActive ? COLORS.primary : '#A0AEC0'}
                  />
                  {item.badge ? (
                    <View style={styles.navBadge}>
                      <Text style={styles.navBadgeText}>{item.badge}</Text>
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
  container: { flex: 1, backgroundColor: COLORS.bg },
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  scrollContent: { padding: 16 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  themeToggle: { flexDirection: 'row', alignItems: 'center' },
  themeText: { marginLeft: 6, fontSize: 12, color: COLORS.textMuted },
  userProfile: { flexDirection: 'row', alignItems: 'center' },
  userInfo: { alignItems: 'flex-end', marginRight: 8 },
  userName: { fontSize: 12, fontWeight: 'bold', color: COLORS.textMain },
  userRole: { fontSize: 10, color: COLORS.textMuted },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

  // Title Section
  titleSection: { marginBottom: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.darkBlue, fontFamily: 'serif' },
  actionButtons: { flexDirection: 'row' },
  refreshButton: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: COLORS.border,
    padding: 8, borderRadius: 6, marginRight: 8,
  },
  newShiftButton: {
    backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6,
  },
  newShiftText: { color: '#FFF', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  pageSubtitle: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },

  // Stats Row
  statsRow: { flexDirection: 'row', marginBottom: 16, justifyContent: 'space-between' },
  statCard: {
    flex: 1, backgroundColor: COLORS.card, padding: 12, borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 4,
  },
  statIndicator: { width: 4, height: 24, borderRadius: 2, marginRight: 8 },
  statLabel: { fontSize: 8, fontWeight: 'bold', color: COLORS.textMuted, letterSpacing: 0.5 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.darkBlue },

  // Calendar Card
  calendarCard: {
    backgroundColor: COLORS.card, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  calendarTitleRow: { flexDirection: 'row', alignItems: 'center' },
  calendarIcon: {
    width: 32, height: 32, borderRadius: 6, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: 8,
  },
  calendarTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.darkBlue },
  calendarSubtitle: { fontSize: 11, color: COLORS.textMuted },
  calendarControls: { flexDirection: 'row', alignItems: 'center' },
  calendarNavBtn: {
    padding: 6, backgroundColor: COLORS.grayLight, borderRadius: 4,
  },
  todayBtn: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 8, paddingVertical: 6, borderRadius: 4, marginHorizontal: 4,
  },
  todayBtnText: { fontSize: 10, fontWeight: 'bold', color: COLORS.textMain },

  // Calendar Grid
  gridContainer: { marginBottom: 16 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  weekDayText: { fontSize: 9, fontWeight: 'bold', color: COLORS.textMuted, width: '14.28%', textAlign: 'center' },
  daysContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: '14.28%', height: 55, borderBottomWidth: 1, borderRightWidth: 1,
    borderColor: COLORS.border, padding: 2, alignItems: 'center',
  },
  dayCellSelected: { backgroundColor: '#EFF6FF' },
  dayText: { fontSize: 11, fontWeight: 'bold', color: COLORS.textMain, marginTop: 2 },
  dayTextMuted: { color: '#D1D5DB' },
  eventTag: { width: '100%', padding: 1, borderRadius: 2, marginTop: 2, alignItems: 'center' },
  eventText: { fontSize: 5, fontWeight: 'bold' },

  // Legend
  legendContainer: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  legendTitle: { fontSize: 10, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 8 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  legendDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  legendText: { fontSize: 10, color: COLORS.textMuted },
  legendDescRow: { flexDirection: 'row', flexWrap: 'wrap' },
  legendDesc: { fontSize: 9, color: COLORS.textMuted, marginRight: 8, marginBottom: 4 },

  // Side Panel (Stacked Cards)
  sidePanel: { marginBottom: 16 },
  panelCard: {
    backgroundColor: COLORS.card, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  panelDate: { fontSize: 18, fontWeight: 'bold', color: COLORS.darkBlue, marginBottom: 4 },
  panelSubtitle: { fontSize: 12, color: COLORS.textMuted, marginBottom: 12 },
  closureButton: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.danger, borderRadius: 6,
    paddingVertical: 8, marginBottom: 12,
  },
  closureButtonText: { color: COLORS.danger, fontSize: 12, fontWeight: 'bold', marginLeft: 6 },
  noShiftsBox: {
    backgroundColor: '#F9FAFB', padding: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  noShiftsText: { fontSize: 12, color: COLORS.textMuted },

  // Tips Card
  tipsCard: { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' },
  panelHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  panelTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.textMain, marginLeft: 8 },
  tipText: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4, lineHeight: 16 },

  // View Timetable Card
  viewAllButton: {
    backgroundColor: COLORS.primary, paddingVertical: 10,
    borderRadius: 6, alignItems: 'center', marginTop: 12,
  },
  viewAllText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },

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
    padding: 4,
    minWidth: 55,
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
  navBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  navText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  navTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});