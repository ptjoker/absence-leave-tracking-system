// src/app/signStud.jsx
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import LogoImg from '@/assets/images/logo.png';

// --- Theme Colors ---
const COLORS = {
  primary: '#2563EB',
  darkBlue: '#1E3A8A',
  textMain: '#111827',
  textMuted: '#6B7280',
  bg: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E5E7EB',
  inputBg: '#F9FAFB',
  toggleBg: '#F3F4F6',
  danger: '#EF4444',
};

export default function SignUpScreen() {
  const router = useRouter();
  const [accountType, setAccountType] = useState('student');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [course, setCourse] = useState('');
  const [currentYear, setCurrentYear] = useState('');
  const [cellNumber, setCellNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Background Image with Light Blue Overlay for better text contrast */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1590&auto=format&fit=crop' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* --- STANDARD HEADER (No icons on the right) --- */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Image source={LogoImg} style={styles.logoImage} resizeMode="contain" />
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>iCenter</Text>
                <Text style={styles.headerSubtitle}>ABSENCE & LEAVE TRACKER</Text>
              </View>
            </View>
          </View>

          {/* --- WELCOME SECTION (Left side on web) --- */}
          <View style={styles.welcomeSection}>
            <View style={styles.tag}>
              <Text style={styles.tagDot}>●</Text>
              <Text style={styles.tagText}>JOIN THE PORTAL</Text>
            </View>
            <Text style={styles.welcomeTitle}>A better way to keep your records in order.</Text>
            <Text style={styles.welcomeSubtitle}>
              Create one account for the attendance details that matter — with the right tools for your role and the people you work with.
            </Text>
            <View style={styles.securityNote}>
              <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.primary} />
              <Text style={styles.securityText}>
                Your information is protected by institutional security.
              </Text>
            </View>
          </View>

          {/* --- REGISTRATION CARD (Right side on web) --- */}
          <View style={styles.card}>
            <Text style={styles.cardTag}>ACCOUNT REGISTRATION</Text>
            <Text style={styles.cardTitle}>Create your account</Text>

            {/* Account Type Toggle */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, accountType === 'student' && styles.toggleButtonActive]}
                onPress={() => setAccountType('student')}
              >
                <Feather name="user" size={14} color={accountType === 'student' ? COLORS.primary : COLORS.textMuted} />
                <Text style={[styles.toggleText, accountType === 'student' && styles.toggleTextActive]}>
                  Student assistant
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, accountType === 'supervisor' && styles.toggleButtonActive]}
                onPress={() => setAccountType('supervisor')}
              >
                <Feather name="users" size={14} color={accountType === 'supervisor' ? COLORS.primary : COLORS.textMuted} />
                <Text style={[styles.toggleText, accountType === 'supervisor' && styles.toggleTextActive]}>
                  Supervisor
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth, { marginRight: 8 }]}>
                <Text style={styles.label}>First name <Text style={styles.required}>*</Text></Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Sarah"
                    placeholderTextColor="#9CA3AF"
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                </View>
              </View>
              <View style={[styles.inputGroup, styles.halfWidth, { marginLeft: 8 }]}>
                <Text style={styles.label}>Last name <Text style={styles.required}>*</Text></Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Nkosi"
                    placeholderTextColor="#9CA3AF"
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>University email <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <Feather name="mail" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="studentnumber@tut4life.ac.za"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Student number <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <Feather name="hash" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 20240123"
                  placeholderTextColor="#9CA3AF"
                  value={studentNumber}
                  onChangeText={setStudentNumber}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth, { marginRight: 8 }]}>
                <Text style={styles.label}>Course or department <Text style={styles.required}>*</Text></Text>
                <View style={styles.inputWrapper}>
                  <Feather name="book" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Information Te..."
                    placeholderTextColor="#9CA3AF"
                    value={course}
                    onChangeText={setCourse}
                  />
                </View>
              </View>
              <View style={[styles.inputGroup, styles.halfWidth, { marginLeft: 8 }]}>
                <Text style={styles.label}>Current year <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity style={styles.inputWrapper}>
                  <Text style={[styles.input, !currentYear && { color: '#9CA3AF' }]}>
                    {currentYear || 'Select year'}
                  </Text>
                  <Feather name="chevron-down" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cell number <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <Feather name="phone" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 076 123 4567"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  value={cellNumber}
                  onChangeText={setCellNumber}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth, { marginRight: 8 }]}>
                <Text style={styles.label}>Password <Text style={styles.required}>*</Text></Text>
                <View style={styles.inputWrapper}>
                  <Feather name="lock" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your passwo..."
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                  <Feather name="eye" size={16} color={COLORS.textMuted} />
                </View>
              </View>
              <View style={[styles.inputGroup, styles.halfWidth, { marginLeft: 8 }]}>
                <Text style={styles.label}>Confirm password <Text style={styles.required}>*</Text></Text>
                <View style={styles.inputWrapper}>
                  <Feather name="lock" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your passwo..."
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <Feather name="eye" size={16} color={COLORS.textMuted} />
                </View>
              </View>
            </View>

            {/* Terms Checkbox */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAgreeTerms(!agreeTerms)}
            >
              <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                {agreeTerms && <Feather name="check" size={12} color="#FFF" />}
              </View>
              <Text style={styles.checkboxText}>
                I agree to the StudentAssist <Text style={styles.linkText}>terms and privacy policy</Text> .
              </Text>
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>
                Create {accountType === 'student' ? 'student' : 'supervisor'} account
              </Text>
              <Feather name="arrow-right" size={16} color="#FFF" />
            </TouchableOpacity>

            {/* Card Footer */}
            <View style={styles.cardFooter}>
              <Text style={styles.cardFooterText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/logIn')}>
                <Text style={styles.registerLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* --- PAGE FOOTER --- */}
          <View style={styles.pageFooter}>
            <Text style={styles.footerText}>Need help? </Text>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Contact iCenter support</Text>
            </TouchableOpacity>
            <Text style={styles.footerText}> • </Text>
            <TouchableOpacity onPress={() => router.push('/')}>
              <Text style={styles.footerLink}>Return home</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
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
    // Light blue tint (instead of pure white) for better text color contrast
    backgroundColor: 'rgba(219, 234, 254, 0.75)',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 0,
    justifyContent: 'space-between',
  },

  // --- STANDARD HEADER ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 24,
    marginHorizontal: -20, // Negative margin to stretch edge-to-edge
    marginTop: -20,
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

  // Welcome Section
  welcomeSection: { marginBottom: 24 },
  tag: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  tagDot: { color: COLORS.primary, fontSize: 10, marginRight: 6 },
  tagText: { fontSize: 10, fontWeight: 'bold', color: COLORS.primary, letterSpacing: 1 },
  welcomeTitle: {
    fontSize: 28, fontWeight: 'bold', color: COLORS.darkBlue,
    fontFamily: 'serif', marginBottom: 12, lineHeight: 34,
  },
  welcomeSubtitle: { fontSize: 13, color: COLORS.textMuted, lineHeight: 20, marginBottom: 16 },
  securityNote: { flexDirection: 'row', alignItems: 'flex-start' },
  securityText: { fontSize: 11, color: COLORS.textMuted, flex: 1, lineHeight: 16, marginLeft: 8 },

  // Card
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardTag: { fontSize: 10, fontWeight: 'bold', color: COLORS.primary, letterSpacing: 1, marginBottom: 6 },
  cardTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.darkBlue, fontFamily: 'serif', marginBottom: 20 },

  // Toggle
  toggleContainer: {
    flexDirection: 'row', backgroundColor: COLORS.toggleBg,
    borderRadius: 8, padding: 4, marginBottom: 20,
  },
  toggleButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  toggleText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, marginLeft: 6 },
  toggleTextActive: { color: COLORS.primary },

  // Form Layout
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfWidth: { width: '48%' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 6 },
  required: { color: COLORS.danger },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBg,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 12, fontSize: 14, color: COLORS.textMain },

  // Checkbox
  checkboxContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20, marginTop: 8 },
  checkbox: {
    width: 18, height: 18, borderRadius: 4, borderWidth: 1,
    borderColor: COLORS.textMuted, justifyContent: 'center',
    alignItems: 'center', marginRight: 8, marginTop: 2,
  },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkboxText: { fontSize: 12, color: COLORS.textMuted, flex: 1, lineHeight: 18 },
  linkText: { color: COLORS.primary, fontWeight: 'bold' },

  // Button
  primaryButton: {
    backgroundColor: COLORS.primary, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center',
    paddingVertical: 14, borderRadius: 8, marginBottom: 20,
  },
  primaryButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginRight: 8 },

  // Card Footer
  cardFooter: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  cardFooterText: { fontSize: 12, color: COLORS.textMuted },
  registerLink: { fontSize: 12, color: COLORS.primary, fontWeight: 'bold' },

  // Page Footer
  pageFooter: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', marginTop: 24, flexWrap: 'wrap',
  },
  footerText: { fontSize: 11, color: COLORS.textMuted },
  footerLink: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
});