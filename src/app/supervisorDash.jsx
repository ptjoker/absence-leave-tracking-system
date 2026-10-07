import { Feather, Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Image,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Adjust the number of ../ based on where your assets folder actually is.
import LogoImg from '../../assets/images/logo.png';

// --- Theme Definitions ---
const THEME = {
  light: {
    primary: '#2563EB',
    darkBlue: '#1E3A8A',
    textMain: '#111827',
    textMuted: '#6B7280',
    bg: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E5E7EB',
    pendingBg: '#FEF3C7',
    pendingText: '#D97706',
    iconBg: '#EFF6FF',
    danger: '#EF4444',
    headerBg: '#FFFFFF',
    headerBorder: '#E2E8F0',
    headerTitle: '#1A202C',
    headerIcon: '#1E3A8A',
    navActive: '#2563EB',
    navInactive: '#A0AEC0',
    navText: '#6B7280',
    overlay: 'rgba(255, 255, 255, 0.7)', // Light mode overlay
    workflowBg: '#EFF6FF',
  },
  dark: {
    primary: '#3B82F6',
    darkBlue: '#93C5FD',
    textMain: '#F9FAFB',
    textMuted: '#9CA3AF',
    bg: '#0F172A',
    card: '#1E293B',
    border: '#334155',
    pendingBg: '#78350F',
    pendingText: '#FCD34D',
    iconBg: '#1E3A8A',
    danger: '#F87171',
    headerBg: '#1E293B',
    headerBorder: '#334155',
    headerTitle: '#F9FAFB',
    headerIcon: '#93C5FD',
    navActive: '#60A5FA',
    navInactive: '#64748B',
    navText: '#94A3B8',
    overlay: 'rgba(15, 23, 42, 0.85)', // Dark mode overlay
    workflowBg: '#1E3A8A',
  },
};

// --- Mock Data ---
const metrics = [
  { id: 1, title: 'PENDING APPROVALS', value: '1', icon: 'clock' },
  { id: 2, title: 'APPROVED', value: '6', icon: 'check-circle' },
  { id: 3, title: 'ASSISTANTS', value: '3', icon: 'users' },
  { id: 4, title: 'TOTAL REQUESTS', value: '15', icon: 'clipboard' },
];

// --- Bottom Nav Items (Mapped to Pages) ---
const NAV_ITEMS = [
  { name: 'Dashboard',   icon: 'grid-outline',          path: '/supervisorDash' },
  { name: 'Calendar',    icon: 'calendar-outline',      path: '/supCal'         },
  { name: 'Requests',    icon: 'document-text-outline', path: '/supRequest', badge: 1 },
  { name: 'Assistances', icon: 'people-outline',        path: '/supAssistants'  },
  { name: 'Reports',     icon: 'bar-chart-outline',     path: '/supReport'      },
];

export default function SupervisorDashboard() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const theme = isDarkMode ? THEME.dark : THEME.light;
  const styles = useMemo(() => getStyles(theme), [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1590&auto=format&fit=crop' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Overlay changes color based on mode */}
        <View style={styles.overlay} />

        {/* --- HEADER --- */}
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
              <Feather
                name={isDarkMode ? 'sun' : 'moon'}
                size={22}
                color={theme.headerIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push('/supNotif')}
            >
              <Ionicons name="notifications-outline" size={22} color={theme.headerIcon} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push('/logOut')}
            >
              <Ionicons name="log-out-outline" size={22} color={theme.headerIcon} />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- MAIN CONTENT --- */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>SUPERVISOR PORTAL</Text>
            </View>
            <Text style={styles.heroTitle}>Supervisor dashboard</Text>
            <Text style={styles.heroSubtitle}>
              Monitor incoming student assistant requests and keep operational decisions synchronized.
            </Text>
          </View>

          {/* Metrics Grid */}
          <View style={styles.metricsGrid}>
            {metrics.map((item) => (
              <View key={item.id} style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricTitle}>{item.title}</Text>
                  <Feather name={item.icon} size={16} color={theme.primary} />
                </View>
                <Text style={styles.metricValue}>{item.value}</Text>
              </View>
            ))}
          </View>

          {/* Awaiting Review */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AWAITING YOUR REVIEW</Text>
            <TouchableOpacity onPress={() => router.push('/supRequest')}>
              <Text style={styles.viewAllText}>VIEW ALL</Text>
            </TouchableOpacity>
          </View>

          {/* Request Item */}
          <View style={styles.requestCard}>
            <View style={styles.requestInfo}>
              <Text style={styles.requestName}>Peter Thomas</Text>
              <Text style={styles.requestDetails}>Personal Issues · Oct 12, 2026 - Oct 13, 2026</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Pending</Text>
            </View>
          </View>

          {/* Operational Note */}
          <View style={styles.noteSection}>
            <Text style={styles.noteTitle}>Operational note</Text>
            <Text style={styles.noteDesc}>
              Approvals and rejections made from Operational Requests are written to the shared request store, so the student dashboard and history reflect the latest decision.
            </Text>
          </View>

          {/* Workflow Card */}
          <View style={styles.workflowCard}>
            <View style={styles.workflowIcon}>
              <Feather name="refresh-cw" size={20} color={theme.primary} />
            </View>
            <View style={styles.workflowTextContainer}>
              <Text style={styles.workflowTitle}>Current workflow</Text>
              <Text style={styles.workflowSteps}>STUDENT → SUPERVISOR → STUDENT</Text>
            </View>
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
                    color={isActive ? theme.navActive : theme.navInactive}
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

// --- Styles Generator (rebuilds on theme change) ---
const getStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },

    // Background Image & Overlay
    backgroundImage: {
      flex: 1,
      width: '100%',
      height: '100%',
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.overlay,
    },

    // Header
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: theme.headerBg,
      borderBottomWidth: 1,
      borderBottomColor: theme.headerBorder,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    logoImage: { width: 40, height: 40, marginRight: 10 },
    headerTextContainer: { justifyContent: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '700', color: theme.headerTitle },
    headerSubtitle: {
      fontSize: 9,
      fontWeight: '600',
      color: 'red',
      letterSpacing: 1,
      marginTop: 2,
    },
    headerRight: { flexDirection: 'row', alignItems: 'center' },
    iconButton: { marginLeft: 14 },

    // Scroll Content
    scrollContent: { padding: 16 },

    // Hero Section
    heroSection: { marginBottom: 20 },
    tag: {
      backgroundColor: theme.iconBg,
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      marginBottom: 8,
    },
    tagText: { fontSize: 10, fontWeight: 'bold', color: theme.primary, letterSpacing: 1 },
    heroTitle: {
      fontSize: 26,
      fontWeight: 'bold',
      color: theme.darkBlue,
      fontFamily: 'serif',
      marginBottom: 8,
    },
    heroSubtitle: { fontSize: 14, color: theme.textMuted, lineHeight: 20 },

    // Metrics Grid
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    metricCard: {
      width: '48%',
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    metricHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    metricTitle: {
      fontSize: 10,
      fontWeight: 'bold',
      color: theme.textMain,
      letterSpacing: 0.5,
    },
    metricValue: { fontSize: 28, fontWeight: 'bold', color: theme.darkBlue },

    // Awaiting Review
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: 'bold',
      color: theme.textMain,
      letterSpacing: 1,
    },
    viewAllText: { fontSize: 12, fontWeight: 'bold', color: theme.textMain },
    requestCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.card,
      padding: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 24,
    },
    requestInfo: { flex: 1 },
    requestName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.textMain,
      marginBottom: 4,
    },
    requestDetails: { fontSize: 12, color: theme.textMuted },
    statusBadge: {
      backgroundColor: theme.pendingBg,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: { color: theme.pendingText, fontSize: 12, fontWeight: 'bold' },

    // Operational Note
    noteSection: { marginBottom: 24 },
    noteTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      fontStyle: 'italic',
      color: theme.textMain,
      marginBottom: 8,
    },
    noteDesc: { fontSize: 13, color: theme.textMuted, lineHeight: 20 },

    // Workflow Card
    workflowCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    workflowIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.workflowBg,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    workflowTextContainer: { flex: 1 },
    workflowTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.textMain,
      marginBottom: 4,
    },
    workflowSteps: {
      fontSize: 12,
      fontWeight: 'bold',
      color: theme.textMain,
      letterSpacing: 0.5,
    },

    // Bottom Navigation Bar
    bottomNav: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: theme.card,
      borderTopWidth: 1,
      borderTopColor: theme.border,
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
      backgroundColor: theme.danger,
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      paddingHorizontal: 3,
      justifyContent: 'center',
      alignItems: 'center',
    },
    navBadgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
    navText: { fontSize: 10, color: theme.navText, marginTop: 4 },
    navTextActive: { color: theme.navActive, fontWeight: 'bold' },
  });