// src/app/supRequestHistory.jsx
import { Feather, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import LogoImg from '@/assets/images/logo.png';
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
};

// ✅ Supervisor navigation with Profile
const NAV_ITEMS = [
  { name: 'Dashboard',   icon: 'grid-outline',          path: '/supervisorDash' },
  { name: 'Calendar',    icon: 'calendar-outline',      path: '/supCal'         },
  { name: 'Requests',    icon: 'document-text-outline', path: '/supRequest'     },
  { name: 'Assistances', icon: 'people-outline',        path: '/supAssistants'  },
  { name: 'Reports',     icon: 'bar-chart-outline',     path: '/supReport'      },
  { name: 'Profile',     icon: 'person-outline',        path: '/supProfile'     },
];

export default function SupervisorRequestHistory() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { submissions: submissionsParam } = useLocalSearchParams();
  
  const { isDarkMode, toggleTheme, theme } = useSupervisorTheme();
  const styles = useSupervisorStyles(baseStyles);

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
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Background Image with 70% White Overlay */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1590&auto=format&fit=crop' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        {/* --- STANDARD HEADER --- */}
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
                color={theme.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push('/supNotification')}
            >
              <Ionicons name="notifications-outline" size={22} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push('/logOut')}
            >
              <Ionicons name="log-out-outline" size={22} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- PAGE TITLE BAR (with back button) --- */}
        <View style={styles.pageTitleBar}>
          <TouchableOpacity
            accessibilityLabel="Go back to requests"
            onPress={() => router.replace('/supRequest')}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={22} color={theme.darkBlue} />
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
                  <Ionicons name="calendar-outline" size={16} color={theme.textMuted} />
                  <Text style={styles.date}>{item.date}</Text>
                </View>
              </View>
            );
          }) : (
            <View style={styles.emptyState}>
              <Ionicons name="file-tray-outline" size={32} color={theme.textMuted} />
              <Text style={styles.emptyTitle}>No request history</Text>
              <Text style={styles.emptyMessage}>Submitted requests will appear here.</Text>
            </View>
          )}

          {/* Extra padding so content doesn't hide behind bottom nav */}
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
            // ✅ Keep "Requests" tab active on the Request History page
            const isActive =
              pathname === item.path ||
              (item.name === 'Requests' && pathname === '/supRequestHistory');

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
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },

  // --- STANDARD HEADER STYLES ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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

  // --- PAGE TITLE BAR ---
  pageTitleBar: {
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

  // --- CONTENT ---
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

  // --- Bottom Navigation Bar ---
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
  navText: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  navTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});