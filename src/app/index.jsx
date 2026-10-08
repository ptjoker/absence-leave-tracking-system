// --- Image assets ---
// Use require() so Metro bundles the images and TypeScript doesn't need
// a module declaration for every .png / .jpg file.
const pic = require('@/assets/images/Icenter.png');
const pic2 = require('@/assets/images/library.jpg');

import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LogoImg from '@/assets/images/logo.png';

// --- Theme Colors ---
const COLORS = {
  primary: '#1E3A8A',
  accent: '#2563EB',
  textMain: '#111827',
  textMuted: '#6B7280',
  bg: '#FFFFFF',
  bgAlt: '#F3F4F6',
  footerBg: '#DBEAFE',
  border: '#E5E7EB',
  success: '#10B981',
};

export default function LandingPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  const router = useRouter();

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* --- STANDARD HEADER (only Theme Toggle) --- */}
        <View style={[styles.header, isDarkMode && styles.headerDark]}>
          <View style={styles.headerLeft}>
            <Image source={LogoImg} style={styles.logoImage} resizeMode="contain" />
            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerTitle, isDarkMode && styles.textDark]}>iCenter</Text>
              <Text style={styles.headerSubtitle}>ABSENCE & LEAVE TRACKER</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            {/* Theme Toggle Only — No Notifications, No Logout */}
            <TouchableOpacity style={styles.iconButton} onPress={toggleTheme}>
              <Feather
                name={isDarkMode ? 'sun' : 'moon'}
                size={22}
                color={COLORS.accent}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- HERO SECTION --- */}
        <View style={styles.section}>
          <Text style={styles.tag}>University Portal</Text>
          <Text style={[styles.heroTitle, isDarkMode && styles.textDark]}>
            Student Assistant <Text style={styles.heroTitleAccent}>Absence & Leave</Text> Tracking system
          </Text>
          <Text style={[styles.heroSubtitle, isDarkMode && styles.textDarkMuted]}>
            A centralized platform for managing attendance, absences, and leave requests, making work easier for everyone.
          </Text>

          <View style={styles.heroButtons}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/logIn')}
            >
              <Text style={styles.primaryButtonText}>Login</Text>
              <Feather name="arrow-right" size={16} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/signStud')}
            >
              <Text style={styles.secondaryButtonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Hero Image */}
          <Image source={pic} style={styles.heroImage} resizeMode="cover" />
        </View>

        {/* --- FEATURE 1: Dashboard --- */}
        <View style={[styles.section, styles.bgAlt, isDarkMode && styles.bgAltDark]}>
          <View style={styles.featureContent}>
            <View style={styles.mockupContainer}>
              <View style={styles.mockupHeader}>
                <Text style={styles.mockupTitle}>STUDENT STAFF HUB</Text>
              </View>
              <View style={styles.mockupBody}>
                <Text style={styles.mockupLabel}>APPROVED LEAVE</Text>
                <View style={styles.mockupCalendar}>
                  {['OCT', 'NOV', 'DEC'].map((month, i) => (
                    <View key={i} style={styles.mockupMonth}>
                      <Text style={styles.mockupMonthText}>{month}</Text>
                      <View style={styles.mockupDays}>
                        {[1, 2, 3].map((day) => (
                          <View key={day} style={styles.mockupDay}>
                            <Text style={styles.mockupDayText}>{day}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
                <View style={styles.mockupStats}>
                  <View style={styles.mockupStatBox}>
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                    <View style={styles.mockupStatText}>
                      <Text style={styles.mockupStatNumber}>12</Text>
                      <Text style={styles.mockupStatLabel}>TOTAL REQUESTS</Text>
                    </View>
                  </View>
                  <View style={styles.mockupStatBox}>
                    <Ionicons name="time" size={24} color={COLORS.accent} />
                    <View style={styles.mockupStatText}>
                      <Text style={styles.mockupStatNumber}>1</Text>
                      <Text style={styles.mockupStatLabel}>PENDING APPROVAL</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.featureText}>
            <Text style={styles.tag}>Real-time management</Text>
            <Text style={[styles.sectionTitle, isDarkMode && styles.textDark]}>
              Effortless Absence & Leave Monitoring
            </Text>
            <Text style={[styles.sectionDesc, isDarkMode && styles.textDarkMuted]}>
              Ditch the spreadsheets. Our digital dashboard allows supervisors to view check-ins,
              verify absences, and manage leave requests in a single, high-contrast interface
              designed for quick scanning.
            </Text>
            <View style={styles.bulletList}>
              {[
                'Visual calendar for department-wide scheduling',
                'One-click verification for medical leaves',
                'Historical logs for payroll reconciliation',
                'Customized leave categories (Sick, Personal, Research)',
              ].map((item, index) => (
                <View key={index} style={styles.bulletItem}>
                  <Ionicons name="checkmark" size={16} color={COLORS.accent} />
                  <Text style={[styles.bulletText, isDarkMode && styles.textDarkMuted]}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* --- FEATURE 2: Alerts --- */}
        <View style={styles.section}>
          <View style={styles.featureText}>
            <Text style={styles.tag}>Stay informed</Text>
            <Text style={[styles.sectionTitle, isDarkMode && styles.textDark]}>
              Automated Notifications & Alerts
            </Text>
            <Text style={[styles.sectionDesc, isDarkMode && styles.textDarkMuted]}>
              Ensure no request goes unnoticed. StudentAssist proactively notifies relevant staff
              via email and app alerts whenever a student assistant logs an absence or submits a
              time-off request.
            </Text>
          </View>

          <View style={styles.alertCards}>
            <View style={[styles.alertCard, isDarkMode && styles.cardDark]}>
              <Feather name="clock" size={24} color={COLORS.accent} />
              <Text style={[styles.alertCardTitle, isDarkMode && styles.textDark]}>Instant Alerts</Text>
              <Text style={[styles.alertCardDesc, isDarkMode && styles.textDarkMuted]}>
                Receive real-time push notifications for last-minute scheduling changes.
              </Text>
            </View>
            <View style={[styles.alertCard, isDarkMode && styles.cardDark]}>
              <Feather name="shield" size={24} color={COLORS.accent} />
              <Text style={[styles.alertCardTitle, isDarkMode && styles.textDark]}>Status Updates</Text>
              <Text style={[styles.alertCardDesc, isDarkMode && styles.textDarkMuted]}>
                Students are automatically notified when their leave status changes.
              </Text>
            </View>
          </View>

          <Image source={pic2} style={styles.featureImage} resizeMode="cover" />
        </View>

        {/* --- ROLES SECTION --- */}
        <View style={[styles.section, styles.bgAlt, isDarkMode && styles.bgAltDark]}>
          <Text style={[styles.sectionTitleCenter, isDarkMode && styles.textDark]}>
            Built for Every Role
          </Text>
          <Text style={[styles.sectionDescCenter, isDarkMode && styles.textDarkMuted]}>
            {"Whether you're a department head or a student worker, Student Assistant Tracker simplifies your workflow."}
          </Text>

          <View style={styles.rolesContainer}>
            <View style={[styles.roleCard, isDarkMode && styles.cardDark]}>
              <View style={[styles.roleIconContainer, { backgroundColor: '#E0E7FF' }]}>
                <Ionicons name="people-outline" size={28} color="#4F46E5" />
              </View>
              <Text style={[styles.roleTitle, isDarkMode && styles.textDark]}>Administrators</Text>
              <Text style={[styles.roleDesc, isDarkMode && styles.textDarkMuted]}>
                Oversee department-wide attendance, generate payroll reports, and manage staffing
                levels with comprehensive analytics.
              </Text>
              <TouchableOpacity style={styles.learnMore}>
                <Text style={styles.learnMoreText}>Learn More</Text>
                <Feather name="chevron-right" size={16} color={COLORS.accent} />
              </TouchableOpacity>
            </View>

            <View style={[styles.roleCard, isDarkMode && styles.cardDark]}>
              <View style={[styles.roleIconContainer, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="clipboard-outline" size={28} color="#D97706" />
              </View>
              <Text style={[styles.roleTitle, isDarkMode && styles.textDark]}>Supervisors</Text>
              <Text style={[styles.roleDesc, isDarkMode && styles.textDarkMuted]}>
                Approve or deny leave requests in seconds, view daily team schedules, and
                communicate directly with your student staff.
              </Text>
              <TouchableOpacity style={styles.learnMore}>
                <Text style={styles.learnMoreText}>Learn More</Text>
                <Feather name="chevron-right" size={16} color={COLORS.accent} />
              </TouchableOpacity>
            </View>

            <View style={[styles.roleCard, isDarkMode && styles.cardDark]}>
              <View style={[styles.roleIconContainer, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="checkmark-circle-outline" size={28} color="#059669" />
              </View>
              <Text style={[styles.roleTitle, isDarkMode && styles.textDark]}>Student Assistant</Text>
              <Text style={[styles.roleDesc, isDarkMode && styles.textDarkMuted]}>
                Easily log absences, track remaining leave balance, and receive instant status
                updates on pending requests via mobile.
              </Text>
              <TouchableOpacity style={styles.learnMore}>
                <Text style={styles.learnMoreText}>Learn More</Text>
                <Feather name="chevron-right" size={16} color={COLORS.accent} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.contactButton}>
            <Text style={styles.contactButtonText}>Contact Sales</Text>
          </TouchableOpacity>
        </View>

        {/* --- FOOTER --- */}
        <View style={styles.footer}>
          <View style={styles.footerColumns}>
            <View style={styles.footerColumn}>
              <Text style={styles.footerTitle}>Contact Us</Text>
              <Text style={styles.footerText}>
                19 OR Tambo, Witbank, Emalahleni, 1034, South Africa.
              </Text>
              <Text style={styles.footerText}>+27 (0)86 110 2421</Text>
              <Text style={styles.footerText}>general@tut.ac.za</Text>
            </View>
            <View style={styles.footerColumn}>
              <Text style={styles.footerTitle}>Platform</Text>
              <Text style={styles.footerLink}>Features</Text>
              <Text style={styles.footerLink}>Documentation</Text>
              <Text style={styles.footerLink}>Support Center</Text>
              <Text style={styles.footerLink}>Status</Text>
            </View>
            <View style={styles.footerColumn}>
              <Text style={styles.footerTitle}>Legal</Text>
              <Text style={styles.footerLink}>Privacy Policy</Text>
              <Text style={styles.footerLink}>Terms of Service</Text>
              <Text style={styles.footerLink}>Security</Text>
              <Text style={styles.footerLink}>Compliance</Text>
            </View>
            <View style={styles.footerColumn}>
              <Text style={styles.footerTitle}>Connect</Text>
              <View style={styles.socialIcons}>
                <Feather name="facebook" size={18} color="#1E3A8A" style={styles.socialIcon} />
                <Feather name="twitter" size={18} color="#1E3A8A" style={styles.socialIcon} />
                <Feather name="youtube" size={18} color="#1E3A8A" style={styles.socialIcon} />
              </View>
              <Text style={styles.footerText}>
                Ensuring seamless academic scheduling and management for all departments.
              </Text>
            </View>
          </View>

          <View style={styles.footerBottom}>
            <Text style={styles.footerBottomText}>
              © 2026 Student Assistance Absence Tracker. All rights reserved.
            </Text>
            <View style={styles.footerBottomLinks}>
              <Text style={styles.footerBottomLink}>Accessibility</Text>
              <Text style={styles.footerBottomLink}>Contact Support</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  containerDark: { backgroundColor: '#111827' },
  textDark: { color: '#F9FAFB' },
  textDarkMuted: { color: '#9CA3AF' },

  // --- STANDARD HEADER STYLES ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  headerDark: { backgroundColor: '#1F2937', borderBottomColor: '#374151' },
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

  // Sections
  section: { paddingHorizontal: 20, paddingVertical: 32 },
  bgAlt: { backgroundColor: COLORS.bgAlt },
  bgAltDark: { backgroundColor: '#1F2937' },

  // Hero
  tag: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontFamily: 'serif',
    lineHeight: 40,
    marginBottom: 12,
  },
  heroTitleAccent: { color: COLORS.accent },
  heroSubtitle: { fontSize: 14, color: COLORS.textMuted, lineHeight: 22, marginBottom: 24 },
  heroButtons: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  secondaryButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: { color: COLORS.textMain, fontWeight: '600', fontSize: 14 },
  heroImage: { width: '100%', height: 200, borderRadius: 12, marginTop: 16 },

  // Feature 1: Mockup
  featureContent: { marginBottom: 24 },
  mockupContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mockupHeader: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  mockupTitle: { fontSize: 10, fontWeight: 'bold', color: COLORS.primary, letterSpacing: 1 },
  mockupBody: { padding: 16 },
  mockupLabel: { fontSize: 10, fontWeight: 'bold', color: COLORS.textMuted, marginBottom: 8 },
  mockupCalendar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  mockupMonth: { alignItems: 'center', flex: 1 },
  mockupMonthText: { fontSize: 10, fontWeight: 'bold', color: COLORS.textMuted, marginBottom: 4 },
  mockupDays: { flexDirection: 'row', gap: 4 },
  mockupDay: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockupDayText: { fontSize: 10, color: COLORS.textMain },
  mockupStats: { gap: 8 },
  mockupStatBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    gap: 8,
  },
  mockupStatText: { flex: 1 },
  mockupStatNumber: { fontSize: 14, fontWeight: 'bold', color: COLORS.textMain },
  mockupStatLabel: { fontSize: 8, color: COLORS.textMuted, textTransform: 'uppercase' },

  // Feature 2: Alerts
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontFamily: 'serif',
    marginBottom: 12,
  },
  sectionDesc: { fontSize: 14, color: COLORS.textMuted, lineHeight: 22, marginBottom: 20 },
  bulletList: { gap: 10 },
  bulletItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletText: { fontSize: 14, color: COLORS.textMuted, flex: 1 },
  alertCards: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  alertCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardDark: { backgroundColor: '#374151', borderColor: '#4B5563' },
  alertCardTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.textMain, marginTop: 8, marginBottom: 4 },
  alertCardDesc: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18 },
  featureImage: { width: '100%', height: 200, borderRadius: 12 },

  // Roles
  sectionTitleCenter: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontFamily: 'serif',
    textAlign: 'center',
    marginBottom: 12,
  },
  sectionDescCenter: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  rolesContainer: { gap: 16, marginBottom: 24 },
  roleCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  roleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  roleTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 },
  roleDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  learnMore: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  learnMoreText: { fontSize: 13, fontWeight: '600', color: COLORS.accent },
  contactButton: {
    backgroundColor: '#FFF',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  contactButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.textMain },

  // Footer
  footer: { backgroundColor: COLORS.footerBg, padding: 20, paddingBottom: 40 },
  footerColumns: { gap: 24, marginBottom: 32 },
  footerColumn: { gap: 8 },
  footerTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary, marginBottom: 4 },
  footerText: { fontSize: 12, color: '#1E40AF', lineHeight: 18 },
  footerLink: { fontSize: 12, color: '#1E40AF', marginBottom: 4 },
  socialIcons: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  socialIcon: { backgroundColor: '#FFF', padding: 8, borderRadius: 20, overflow: 'hidden' },
  footerBottom: { borderTopWidth: 1, borderTopColor: '#BFDBFE', paddingTop: 20, gap: 12 },
  footerBottomText: { fontSize: 10, color: '#1E40AF', textAlign: 'center' },
  footerBottomLinks: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  footerBottomLink: { fontSize: 10, color: '#1E40AF', fontWeight: '600' },
});