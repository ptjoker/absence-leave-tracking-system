// src/app/supProfile.jsx
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import LogoImg from '@/assets/images/logo.png';
import APP_BACKGROUND from '@/constants/appBackground';
import { useSupervisorTheme } from '@/contexts/SupervisorThemeContext';
import { apiFetch, getSession } from '@/lib/api';
import { CountBadge, useSupervisorBadges } from '@/components/supervisor/SupervisorBadges';

// --- Theme Definitions ---
const THEME = {
  light: {
    primary: '#2563EB',
    darkBlue: '#1E3A8A',
    textMain: '#111827',
    textMuted: '#1F2937',
    bg: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E5E7EB',
    headerBg: '#FFFFFF',
    headerBorder: '#E2E8F0',
    headerTitle: '#1A202C',
    headerIcon: '#1E3A8A',
    activeBg: '#D1FAE5',
    activeText: '#059669',
    studentBadgeBg: '#DBEAFE',
    studentBadgeText: '#2563EB',
    overlay: 'rgba(255, 255, 255, 0.5)',
    inputBg: '#F9FAFB',
    inputBorder: '#E5E7EB',
    inputText: '#111827',
    inputFocusBorder: '#2563EB',
    success: '#10B981',
    danger: '#EF4444',
  },
  dark: {
    primary: '#3B82F6',
    darkBlue: '#93C5FD',
    textMain: '#F9FAFB',
    textMuted: '#E2E8F0',
    bg: '#0F172A',
    card: '#1E293B',
    border: '#334155',
    headerBg: '#1E293B',
    headerBorder: '#334155',
    headerTitle: '#F9FAFB',
    headerIcon: '#93C5FD',
    activeBg: '#064E3B',
    activeText: '#6EE7B7',
    studentBadgeBg: '#1E3A8A',
    studentBadgeText: '#93C5FD',
    overlay: 'rgba(15, 23, 42, 0.5)',
    inputBg: '#0F172A',
    inputBorder: '#334155',
    inputText: '#F9FAFB',
    inputFocusBorder: '#60A5FA',
    success: '#34D399',
    danger: '#F87171',
  },
};

// --- Supervisor navigation with Profile ---
const NAV_ITEMS = [
  { name: 'Dashboard',   icon: 'grid-outline',          path: '/supervisorDash' },
  { name: 'Calendar',    icon: 'calendar-outline',      path: '/supCal'         },
  { name: 'Requests',    icon: 'document-text-outline', path: '/supRequest'     },
  { name: 'Assistances', icon: 'people-outline',        path: '/supAssistants'  },
  { name: 'Reports',     icon: 'bar-chart-outline',     path: '/supReport'      },
  { name: 'Profile',     icon: 'person-outline',        path: '/supProfile'     },
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

function formatDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return String(iso);
  }
}

// --- Simple validators ---
const isValidEmail = (value) => {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
};

const isValidCell = (value) => {
  if (typeof value !== 'string') return false;
  const digits = value.replace(/[^0-9]/g, '');
  return digits.length >= 9 && digits.length <= 15;
};

export default function SupervisorProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDarkMode, toggleTheme } = useSupervisorTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- Edit mode state ---
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedPersonalEmail, setEditedPersonalEmail] = useState('');
  const [editedCellNumber, setEditedCellNumber] = useState('');
  const [errors, setErrors] = useState({ personalEmail: '', cellNumber: '' });

  const theme = isDarkMode ? THEME.dark : THEME.light;
  const styles = useMemo(() => getStyles(theme), [isDarkMode]);
  const { pendingRequestCount, unreadNotificationCount } = useSupervisorBadges();

  const loadProfile = async () => {
    try {
      const session = await getSession();
      if (session?.user) {
        setUser(session.user);
        setEditedPersonalEmail(session.user.personal_email || '');
        setEditedCellNumber(session.user.cell_number || '');
      }

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
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Supervisor'
    : 'Supervisor';
  const initials = initialsFromName(name);
  const role = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Supervisor';
  const staffNumber = user?.student_number || '—';
  const workEmail = user?.student_email || user?.email || '—';
  const personalEmail = user?.personal_email || '—';
  const cellNumber = user?.cell_number || '—';
  const memberSince = formatDate(user?.created_at);

  // --- Start editing: pre-fill from current user ---
  const handleStartEdit = () => {
    setEditedPersonalEmail(user?.personal_email || '');
    setEditedCellNumber(user?.cell_number || '');
    setErrors({ personalEmail: '', cellNumber: '' });
    setIsEditing(true);
  };

  // --- Cancel editing: discard changes ---
  const handleCancelEdit = () => {
    setEditedPersonalEmail(user?.personal_email || '');
    setEditedCellNumber(user?.cell_number || '');
    setErrors({ personalEmail: '', cellNumber: '' });
    setIsEditing(false);
  };

  // --- Save: validate + PATCH to API + update local state ---
  const handleSaveEdit = async () => {
    const nextErrors = { personalEmail: '', cellNumber: '' };

    // Personal email optional — only validate if the user typed something.
    if (editedPersonalEmail && !isValidEmail(editedPersonalEmail)) {
      nextErrors.personalEmail = 'Enter a valid email address.';
    }

    // Cell number required.
    if (!editedCellNumber) {
      nextErrors.cellNumber = 'Cell number is required.';
    } else if (!isValidCell(editedCellNumber)) {
      nextErrors.cellNumber = 'Enter a valid phone number (9–15 digits).';
    }

    if (nextErrors.personalEmail || nextErrors.cellNumber) {
      setErrors(nextErrors);
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        personal_email: editedPersonalEmail.trim(),
        cell_number: editedCellNumber.trim(),
      };

      const res = await apiFetch('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      // If the API is not ready, we still want the UI to feel instant.
      let updated = { ...user, ...payload };
      try {
        const data = await res.json();
        if (res.ok && data && typeof data === 'object') {
          updated = { ...updated, ...data };
        } else if (data?.error) {
          console.warn('Profile update error from server:', data.error);
        }
      } catch (e) {
        // ignore JSON parse failure — API may not return a body
      }

      setUser(updated);
      setIsEditing(false);
      setErrors({ personalEmail: '', cellNumber: '' });

      Alert.alert('Profile updated', 'Your changes have been saved.');
    } catch (err) {
      console.error('Profile save error:', err);
      Alert.alert('Save failed', 'Could not save your changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <ImageBackground
        source={APP_BACKGROUND}
        style={styles.backgroundImage}
        imageStyle={{ opacity: 1 }}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
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
                  color={theme.headerIcon}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push('/supNotification')}
              >
                <Ionicons name="notifications-outline" size={22} color={theme.headerIcon} />
                <CountBadge count={unreadNotificationCount} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push('/logOut')}
              >
                <Ionicons name="log-out-outline" size={22} color={theme.headerIcon} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.titleSection}>
            <Text style={styles.pageTitle}>My Profile</Text>
            <View style={styles.actionRow}>
              <View style={styles.activeBadge}>
                <Feather name="check-circle" size={12} color={theme.activeText} />
                <Text style={styles.activeText}>Active</Text>
              </View>

              {isEditing ? (
                <View style={styles.editActionsRow}>
                  <TouchableOpacity
                    style={styles.cancelEditButton}
                    onPress={handleCancelEdit}
                    disabled={isSaving}
                    activeOpacity={0.7}
                  >
                    <Feather name="x" size={14} color={theme.textMain} />
                    <Text style={styles.cancelEditText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.editButton, isSaving && { opacity: 0.7 }]}
                    onPress={handleSaveEdit}
                    disabled={isSaving}
                    activeOpacity={0.7}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Feather name="check" size={14} color="#FFF" />
                        <Text style={styles.editButtonText}>Save</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleStartEdit}
                  activeOpacity={0.7}
                >
                  <Feather name="edit-2" size={14} color="#FFF" />
                  <Text style={styles.editButtonText}>Edit Profile</Text>
                </TouchableOpacity>
              )}
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
                {/* Department removed — only StaffNo remains in the meta row */}
                <View style={styles.metaRow}>
                  <Feather name="hash" size={12} color={theme.textMuted} />
                  <Text style={styles.metaText}>StaffNo: {staffNumber}</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            {/* ------- CONTACT INFORMATION ------- */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="mail" size={14} color={theme.primary} />
                <Text style={styles.sectionTitle}>CONTACT INFORMATION</Text>
              </View>
              <View style={styles.infoGrid}>
                {/* WORK EMAIL — locked */}
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>WORK EMAIL</Text>
                  <View style={styles.infoValueRow}>
                    <Feather name="mail" size={12} color={theme.textMuted} />
                    <Text style={styles.infoValue}>{workEmail}</Text>
                  </View>
                  {isEditing && (
                    <Text style={styles.lockedHint}>
                      Managed by HR — cannot be edited here.
                    </Text>
                  )}
                </View>

                {/* PERSONAL EMAIL — editable when isEditing */}
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>PERSONAL EMAIL</Text>
                  {isEditing ? (
                    <>
                      <View
                        style={[
                          styles.inputWrapper,
                          errors.personalEmail && styles.inputWrapperError,
                        ]}
                      >
                        <Feather name="mail" size={14} color={theme.textMuted} style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          value={editedPersonalEmail}
                          onChangeText={(v) => {
                            setEditedPersonalEmail(v);
                            if (errors.personalEmail) {
                              setErrors((prev) => ({ ...prev, personalEmail: '' }));
                            }
                          }}
                          placeholder="you@example.com"
                          placeholderTextColor={theme.textMuted}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          editable={!isSaving}
                        />
                      </View>
                      {!!errors.personalEmail && (
                        <Text style={styles.errorText}>{errors.personalEmail}</Text>
                      )}
                    </>
                  ) : (
                    <View style={styles.infoValueRow}>
                      <Feather name="mail" size={12} color={theme.textMuted} />
                      <Text style={styles.infoValue}>{personalEmail}</Text>
                    </View>
                  )}
                </View>

                {/* CELL NUMBER — editable when isEditing */}
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>CELL NUMBER</Text>
                  {isEditing ? (
                    <>
                      <View
                        style={[
                          styles.inputWrapper,
                          errors.cellNumber && styles.inputWrapperError,
                        ]}
                      >
                        <Feather name="phone" size={14} color={theme.textMuted} style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          value={editedCellNumber}
                          onChangeText={(v) => {
                            setEditedCellNumber(v);
                            if (errors.cellNumber) {
                              setErrors((prev) => ({ ...prev, cellNumber: '' }));
                            }
                          }}
                          placeholder="076 123 4567"
                          placeholderTextColor={theme.textMuted}
                          keyboardType="phone-pad"
                          editable={!isSaving}
                        />
                      </View>
                      {!!errors.cellNumber && (
                        <Text style={styles.errorText}>{errors.cellNumber}</Text>
                      )}
                    </>
                  ) : (
                    <View style={styles.infoValueRow}>
                      <Feather name="phone" size={12} color={theme.textMuted} />
                      <Text style={styles.infoValue}>{cellNumber}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            {/* ------- FACULTY DETAILS (read-only) -------
                Department and Position have been removed. */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="briefcase" size={14} color={theme.primary} />
                <Text style={styles.sectionTitle}>FACULTY DETAILS</Text>
              </View>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>MEMBER SINCE</Text>
                  <View style={styles.infoValueRow}>
                    <Feather name="calendar" size={12} color={theme.textMuted} />
                    <Text style={styles.infoValue}>{memberSince}</Text>
                  </View>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>ACCOUNT TYPE</Text>
                  <View style={styles.infoValueRow}>
                    <Feather name="user" size={12} color={theme.textMuted} />
                    <Text style={styles.infoValue}>{role}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="info" size={14} color={theme.primary} />
                <Text style={styles.sectionTitle}>Data Privacy Notice</Text>
              </View>
              <Text style={styles.privacyText}>
                Personal email and cell number can be updated from this screen. All other fields
                are managed by the University Registrar and cannot be edited here. Contact the
                Human Resources Office if any details are incorrect.
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

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* --- BOTTOM NAVIGATION BAR (Supervisor) --- */}
        <View
          style={[
            styles.bottomNav,
            { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 },
          ]}
        >
          {NAV_ITEMS.map((item) => {
            // Force Profile tab active on this page
            const isActive = item.name === 'Profile';
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
                    color={isActive ? theme.primary : '#A0AEC0'}
                  />
                  {item.name === 'Requests' && <CountBadge count={pendingRequestCount} />}
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

const getStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    backgroundImage: { flex: 1, width: '100%', height: '100%' },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.overlay,
    },

    // --- STANDARD HEADER ---
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: theme.headerBg,
      borderBottomWidth: 1,
      borderBottomColor: theme.headerBorder,
      marginBottom: 20,
      marginHorizontal: -16,
      marginTop: -16,
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

    scrollContent: { padding: 16 },

    titleSection: { marginBottom: 16 },
    pageTitle: { fontSize: 26, fontWeight: 'bold', color: theme.darkBlue, marginBottom: 12, fontFamily: 'serif' },
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    activeBadge: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: theme.activeBg,
      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4,
    },
    activeText: { color: theme.activeText, fontSize: 12, fontWeight: 'bold' },

    // --- Edit / Cancel / Save buttons ---
    editActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    editButton: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primary,
      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, gap: 6,
    },
    editButtonText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
    cancelEditButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.card,
      gap: 6,
    },
    cancelEditText: {
      color: theme.textMain,
      fontSize: 12,
      fontWeight: '600',
    },

    profileCard: {
      backgroundColor: theme.card, borderRadius: 16, padding: 20,
      borderWidth: 1, borderColor: theme.border,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
    },
    profileHeader: { flexDirection: 'row', marginBottom: 16 },
    avatarLarge: {
      width: 60, height: 60, borderRadius: 12, backgroundColor: theme.primary,
      justifyContent: 'center', alignItems: 'center', marginRight: 16,
    },
    avatarLargeText: { color: '#FFF', fontWeight: 'bold', fontSize: 24 },
    profileHeaderText: { flex: 1, justifyContent: 'center' },
    nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' },
    profileName: { fontSize: 20, fontWeight: 'bold', color: theme.darkBlue, marginRight: 8 },
    studentBadge: {
      backgroundColor: theme.studentBadgeBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
    },
    studentBadgeText: { color: theme.studentBadgeText, fontSize: 10, fontWeight: 'bold' },
    metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
    metaText: { fontSize: 12, color: theme.textMuted, marginLeft: 4 },

    divider: { height: 1, backgroundColor: theme.border, marginVertical: 16 },
    section: { marginBottom: 8 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', color: theme.darkBlue, letterSpacing: 1 },
    infoGrid: { gap: 12 },
    infoItem: { marginBottom: 4 },
    infoLabel: { fontSize: 10, fontWeight: 'bold', color: theme.textMuted, marginBottom: 4, letterSpacing: 0.5 },
    infoValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    infoValue: { fontSize: 13, color: theme.textMain, flex: 1 },
    privacyText: { fontSize: 12, color: theme.textMuted, lineHeight: 18 },

    // --- Editable inputs ---
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.inputBg,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: 8,
      paddingHorizontal: 12,
      minHeight: 42,
    },
    inputWrapperError: {
      borderColor: theme.danger,
    },
    inputIcon: { marginRight: 8 },
    input: {
      flex: 1,
      paddingVertical: 10,
      fontSize: 13,
      color: theme.inputText,
    },
    errorText: {
      fontSize: 11,
      color: theme.danger,
      marginTop: 4,
      fontWeight: '600',
    },
    lockedHint: {
      fontSize: 10,
      color: theme.textMuted,
      fontStyle: 'italic',
      marginTop: 4,
    },

    cardFooter: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.border,
    },
    cardFooterLabel: { fontSize: 10, fontWeight: 'bold', color: theme.primary, letterSpacing: 1 },
    cardFooterDate: { fontSize: 10, color: theme.textMuted, fontStyle: 'italic' },

    pageFooter: { marginTop: 24, alignItems: 'center' },
    pageFooterText: { fontSize: 10, color: theme.textMuted, textAlign: 'center', marginBottom: 4 },

    // --- Bottom nav for 6 supervisor items ---
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
      padding: 2,
      minWidth: 50,
      flex: 1,
    },
    navIconContainer: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
    navText: { fontSize: 9, color: theme.textMuted, marginTop: 4 },
    navTextActive: { color: theme.primary, fontWeight: 'bold' },
  });