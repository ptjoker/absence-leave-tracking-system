import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ImageBackground,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { apiFetch, saveSession } from '@/lib/api';

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
  modalOverlay: 'rgba(0, 0, 0, 0.5)',
  resetBtnBg: '#DBEAFE',
  resetBtnText: '#1E3A8A',
  danger: '#EF4444',
};

export default function LoginScreen() {
  const router = useRouter();
  const [accountType, setAccountType] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [isForgotModalVisible, setIsForgotModalVisible] = useState(false);
  const [staffNo, setStaffNo] = useState('');
  const [resetEmail, setResetEmail] = useState('');

  const handleLogIn = async () => {
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          role: accountType,
        }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        if (res.status === 401) {
          setErrorMsg('Wrong email or password. Please try again.');
        } else if (res.status === 403) {
          setErrorMsg('Incorrect account type. Pick the right role above.');
        } else if (res.status === 429) {
          setErrorMsg('Too many attempts. Please wait a minute and try again.');
        } else {
          setErrorMsg(data.error || 'Login failed. Please try again.');
        }
        return;
      }

      await saveSession({
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        expires_at: data.session?.expires_at,
        user: data.user,
      });

      const userRole = data.user?.role;
      if (userRole === 'supervisor') {
        router.replace('/supervisorDash');
      } else {
        router.replace('/studDash');
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1590&auto=format&fit=crop' }}
        style={styles.backgroundImage}
        blurRadius={4}
      >
        <View style={styles.overlay} />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="school" size={28} color={COLORS.primary} />
              <View style={styles.logoTextContainer}>
                <Text style={styles.logoTitle}>iCenter</Text>
                <Text style={styles.logoSubtitle}>ABSENCE AND LEAVE TRACKER</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.themeToggle}>
              <Feather name="moon" size={14} color={COLORS.textMuted} />
              <Text style={styles.themeText}>
                Change mode <Text style={{ color: '#F59E0B' }}>Dark</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mainContent}>
            <View style={styles.welcomeSection}>
              <View style={styles.tag}>
                <Text style={styles.tagDot}>●</Text>
                <Text style={styles.tagText}>SECURE PORTAL</Text>
              </View>
              <Text style={styles.welcomeTitle}>
                {accountType === 'student'
                  ? 'Welcome back, student.'
                  : 'Welcome back, supervisor.'}
              </Text>
              <Text style={styles.welcomeSubtitle}>
                Sign in to keep attendance records moving, requests clear, and your next step close at hand.
              </Text>
              <View style={styles.securityNote}>
                <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.primary} />
                <Text style={styles.securityText}>
                  Your information is protected by institutional security.
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTag}>PORTAL ACCESS</Text>
              <Text style={styles.cardTitle}>Sign in to iCenter</Text>
              <Text style={styles.cardSubtitle}>Choose your account type to continue.</Text>

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

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {accountType === 'student' ? 'University email' : 'Staff email'}{' '}
                  <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Feather name="mail" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={accountType === 'student' ? 'studentnumber@tut4life.ac.za' : 'surname.initials@tut.ac.za'}
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={(value) => {
                      setEmail(value);
                      if (errorMsg) setErrorMsg('');
                    }}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Password <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Feather name="lock" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(value) => {
                      setPassword(value);
                      if (errorMsg) setErrorMsg('');
                    }}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <Feather name={showPassword ? 'eye-off' : 'eye'} size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setKeepSignedIn(!keepSignedIn)}
                >
                  <View style={[styles.checkbox, keepSignedIn && styles.checkboxChecked]}>
                    {keepSignedIn && <Feather name="check" size={12} color="#FFF" />}
                  </View>
                  <Text style={styles.checkboxText}>Keep me signed in</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setIsForgotModalVisible(true)}>
                  <Text style={styles.forgotPassword}>Forgot password?</Text>
                </TouchableOpacity>
              </View>

              {errorMsg ? (
                <View style={styles.errorBanner}>
                  <Feather name="alert-circle" size={16} color="#DC2626" />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.primaryButton, loading && { opacity: 0.6 }]}
                onPress={handleLogIn}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>
                  {loading
                    ? 'Signing in…'
                    : `Sign in as ${accountType === 'student' ? 'student' : 'supervisor'}`}
                </Text>
                <Feather name="arrow-right" size={16} color="#FFF" />
              </TouchableOpacity>

              <View style={styles.cardFooter}>
                <Text style={styles.cardFooterText}>{"Don't have an account? "}</Text>
                <TouchableOpacity onPress={() => router.push('/signStud')}>
                  <Text style={styles.registerLink}>Register here</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.pageFooter}>
            <Text style={styles.footerText}>Need help? </Text>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Contact iCenter support</Text>
            </TouchableOpacity>
            <Text style={styles.footerText}> • </Text>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Return home</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </ImageBackground>

      <Modal
        animationType="fade"
        transparent={true}
        visible={isForgotModalVisible}
        onRequestClose={() => setIsForgotModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Forgot your password?</Text>
              <TouchableOpacity onPress={() => setIsForgotModalVisible(false)} style={styles.closeButton}>
                <Feather name="x" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              {"Enter your Staff/Student No. and registered email address. We'll send you instructions to reset your password."}
            </Text>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>
                Staff/Student No. <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.modalInputWrapper}>
                <Feather name="user" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Staff No. or Student No."
                  placeholderTextColor="#9CA3AF"
                  value={staffNo}
                  onChangeText={setStaffNo}
                />
              </View>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>
                Email Address <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.modalInputWrapper}>
                <Feather name="mail" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="123456789@tut4life.ac.za"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={resetEmail}
                  onChangeText={setResetEmail}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalSubmitButton}
              onPress={() => {
                setIsForgotModalVisible(false);
              }}
            >
              <Text style={styles.modalSubmitText}>Send Reset Link</Text>
              <Feather name="arrow-right" size={16} color={COLORS.resetBtnText} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoTextContainer: { marginLeft: 8 },
  logoTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.darkBlue },
  logoSubtitle: { fontSize: 8, color: COLORS.textMuted, letterSpacing: 1 },
  themeToggle: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border,
  },
  themeText: { fontSize: 10, color: COLORS.textMuted, marginLeft: 4 },
  mainContent: { flex: 1, justifyContent: 'center' },
  welcomeSection: { marginBottom: 32 },
  tag: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  tagDot: { color: COLORS.primary, fontSize: 10, marginRight: 6 },
  tagText: { fontSize: 10, fontWeight: 'bold', color: COLORS.primary, letterSpacing: 1 },
  welcomeTitle: {
    fontSize: 28, fontWeight: 'bold', color: COLORS.darkBlue,
    marginBottom: 12, lineHeight: 34,
  },
  welcomeSubtitle: { fontSize: 13, color: COLORS.textMuted, lineHeight: 20, marginBottom: 16 },
  securityNote: { flexDirection: 'row', alignItems: 'flex-start' },
  securityText: { fontSize: 11, color: COLORS.textMuted, flex: 1, lineHeight: 16, marginLeft: 8 },
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
  cardTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.darkBlue, marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: COLORS.textMuted, marginBottom: 20 },
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
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 6 },
  required: { color: COLORS.danger },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBg,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 12, fontSize: 14, color: COLORS.textMain },
  eyeIcon: { padding: 4 },
  optionsRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 24,
  },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 16, height: 16, borderRadius: 4, borderWidth: 1,
    borderColor: COLORS.textMuted, justifyContent: 'center',
    alignItems: 'center', marginRight: 8,
  },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkboxText: { fontSize: 12, color: COLORS.textMuted },
  forgotPassword: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  primaryButton: {
    backgroundColor: COLORS.primary, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center',
    paddingVertical: 14, borderRadius: 8, marginBottom: 20,
  },
  primaryButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginRight: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  cardFooterText: { fontSize: 12, color: COLORS.textMuted },
  registerLink: { fontSize: 12, color: COLORS.primary, fontWeight: 'bold' },
  pageFooter: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', marginTop: 32, flexWrap: 'wrap',
  },
  footerText: { fontSize: 11, color: COLORS.textMuted },
  footerLink: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textMain,
    flex: 1,
  },
  closeButton: { padding: 4, marginLeft: 8 },
  modalDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalInputGroup: { marginBottom: 16 },
  modalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textMain,
    marginBottom: 6,
  },
  modalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  modalInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.textMain,
  },
  modalSubmitButton: {
    backgroundColor: COLORS.resetBtnBg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  modalSubmitText: {
    color: COLORS.resetBtnText,
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
});