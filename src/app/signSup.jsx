// src/app/signSup.jsx
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Image,
  ImageBackground,
  Modal,
  Pressable,
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
import { apiFetch } from '@/lib/api';

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

const CODE_LENGTH = 8;

export default function SupervisorSignUpScreen() {
  const router = useRouter();
  const [accountType, setAccountType] = useState('supervisor');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [cellNumber, setCellNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [isVerifyModalVisible, setVerifyModalVisible] = useState(false);
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(''));
  const [verifyError, setVerifyError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef([]);

  const openVerifyModal = () => {
    setCode(Array(CODE_LENGTH).fill(''));
    setVerifyError('');
    setVerifyModalVisible(true);
    setTimeout(() => {
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    }, 100);
  };

  const closeVerifyModal = () => {
    setVerifyModalVisible(false);
    setCode(Array(CODE_LENGTH).fill(''));
    setVerifyError('');
  };

  const handleCodeChange = (value, index) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (verifyError) setVerifyError('');

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyAndCreate = () => {
    const fullCode = code.join('');
    if (fullCode.length < CODE_LENGTH) {
      setVerifyError('Please enter the full 8-digit code.');
      return;
    }

    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      closeVerifyModal();
      router.replace('/logIn');
    }, 600);
  };

  const handleResend = () => {
    setCode(Array(CODE_LENGTH).fill(''));
    setVerifyError('');
    if (inputRefs.current[0]) inputRefs.current[0].focus();
  };

  const handleRegister = async () => {
    setErrorMsg('');

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !department.trim() || !cellNumber.trim() || !password || !confirmPassword) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    if (!email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('Please agree to the terms and privacy policy.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          student_email: email.trim(),
          student_number: department.trim(),
          course: department.trim(),
          level_of_study: 'supervisor',
          cell_number: cellNumber.trim(),
          password,
          role: 'supervisor',
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMsg(data.error || 'Registration failed. Please try again.');
        return;
      }

      openVerifyModal();
    } catch (err) {
      console.error('Register error:', err);
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
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Image source={LogoImg} style={styles.logoImage} resizeMode="contain" />
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>iCenter</Text>
                <Text style={styles.headerSubtitle}>ABSENCE & LEAVE TRACKER</Text>
              </View>
            </View>
          </View>

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

          <View style={styles.card}>
            <Text style={styles.cardTag}>ACCOUNT REGISTRATION</Text>
            <Text style={styles.cardTitle}>Create your account</Text>

            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, accountType === 'student' && styles.toggleButtonActive]}
                onPress={() => {
                  setAccountType('student');
                  router.replace('/signStud');
                }}
                activeOpacity={0.7}
              >
                <Feather name="user" size={14} color={accountType === 'student' ? COLORS.primary : COLORS.textMuted} />
                <Text style={[styles.toggleText, accountType === 'student' && styles.toggleTextActive]}>
                  Student assistant
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toggleButton, accountType === 'supervisor' && styles.toggleButtonActive]}
                onPress={() => {
                  setAccountType('supervisor');
                }}
                activeOpacity={0.7}
              >
                <Feather name="users" size={14} color={accountType === 'supervisor' ? COLORS.primary : COLORS.textMuted} />
                <Text style={[styles.toggleText, accountType === 'supervisor' && styles.toggleTextActive]}>
                  Supervisor
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth, { marginRight: 8 }]}>
                <Text style={styles.label}>First name <Text style={styles.required}>*</Text></Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Sarah"
                    placeholderTextColor="#9CA3AF"
                    value={firstName}
                    onChangeText={(v) => { setFirstName(v); if (errorMsg) setErrorMsg(''); }}
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
                    onChangeText={(v) => { setLastName(v); if (errorMsg) setErrorMsg(''); }}
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Work email <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="surname.initials@tut.ac.za"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(v) => { setEmail(v); if (errorMsg) setErrorMsg(''); }}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Department or faculty <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="business-outline" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Faculty of Information and Communicator"
                  placeholderTextColor="#9CA3AF"
                  value={department}
                  onChangeText={(v) => { setDepartment(v); if (errorMsg) setErrorMsg(''); }}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cell number <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 076 123 4567"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  value={cellNumber}
                  onChangeText={(v) => { setCellNumber(v); if (errorMsg) setErrorMsg(''); }}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth, { marginRight: 8 }]}>
                <Text style={styles.label}>Password <Text style={styles.required}>*</Text></Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(v) => { setPassword(v); if (errorMsg) setErrorMsg(''); }}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={[styles.inputGroup, styles.halfWidth, { marginLeft: 8 }]}>
                <Text style={styles.label}>Confirm password <Text style={styles.required}>*</Text></Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={(v) => { setConfirmPassword(v); if (errorMsg) setErrorMsg(''); }}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => { setAgreeTerms(!agreeTerms); if (errorMsg) setErrorMsg(''); }}
            >
              <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                {agreeTerms && <Feather name="check" size={12} color="#FFF" />}
              </View>
              <Text style={styles.checkboxText}>
                I agree to the StudentAssist <Text style={styles.linkText}>terms and privacy policy</Text> .
              </Text>
            </TouchableOpacity>

            {errorMsg ? (
              <View style={styles.errorBanner}>
                <Feather name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryButton, loading && { opacity: 0.6 }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>
                {loading
                  ? 'Creating account…'
                  : `Create ${accountType === 'student' ? 'student' : 'supervisor'} account`}
              </Text>
              <Feather name="arrow-right" size={16} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.cardFooter}>
              <Text style={styles.cardFooterText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/logIn')}>
                <Text style={styles.registerLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>

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

      <Modal
        animationType="fade"
        transparent={true}
        visible={isVerifyModalVisible}
        onRequestClose={closeVerifyModal}
      >
        <View style={styles.verifyOverlay}>
          <View style={styles.verifyCard}>
            <View style={styles.verifyIconCircle}>
              <Feather name="shield" size={26} color="#2563EB" />
            </View>

            <Text style={styles.verifyTitle}>Verify your email</Text>
            <Text style={styles.verifySubtitle}>
              We've sent an 8-digit verification code to
            </Text>
            <Text style={styles.verifyEmail}>{email || 'your email'}</Text>

            <View style={styles.codeRow}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  style={[styles.codeInput, digit && styles.codeInputFilled]}
                  value={digit}
                  onChangeText={(v) => handleCodeChange(v, index)}
                  onKeyPress={(e) => handleCodeKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  selectTextOnFocus
                />
              ))}
            </View>

            {verifyError ? (
              <Text style={styles.verifyError}>{verifyError}</Text>
            ) : null}

            <View style={styles.verifyResendRow}>
              <Text style={styles.verifyResendText}>Didn't receive the code? </Text>
              <Pressable onPress={handleResend}>
                <Text style={styles.verifyResendLink}>Resend</Text>
              </Pressable>
            </View>

            <View style={styles.verifyActions}>
              <TouchableOpacity
                style={styles.verifyCancelBtn}
                onPress={closeVerifyModal}
                activeOpacity={0.8}
                disabled={verifying}
              >
                <Text style={styles.verifyCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.verifyCreateBtn, verifying && { opacity: 0.6 }]}
                onPress={handleVerifyAndCreate}
                activeOpacity={0.85}
                disabled={verifying}
              >
                <Feather name="check-circle" size={16} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.verifyCreateText}>
                  {verifying ? 'Verifying…' : 'Verify & Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(219, 234, 254, 0.75)',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 0,
    justifyContent: 'space-between',
  },
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
    marginHorizontal: -20,
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
  checkboxContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20, marginTop: 8 },
  checkbox: {
    width: 18, height: 18, borderRadius: 4, borderWidth: 1,
    borderColor: COLORS.textMuted, justifyContent: 'center',
    alignItems: 'center', marginRight: 8, marginTop: 2,
  },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkboxText: { fontSize: 12, color: COLORS.textMuted, flex: 1, lineHeight: 18 },
  linkText: { color: COLORS.primary, fontWeight: 'bold' },
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
    alignItems: 'center', marginTop: 24, flexWrap: 'wrap',
  },
  footerText: { fontSize: 11, color: COLORS.textMuted },
  footerLink: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },

  // --- Verify email modal ---
  verifyOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  verifyCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  verifyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E7F1FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  verifyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.darkBlue,
    fontFamily: 'serif',
    marginBottom: 10,
    textAlign: 'center',
  },
  verifySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  verifyEmail: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 22,
    textAlign: 'center',
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  codeInput: {
    width: 38,
    height: 48,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    marginHorizontal: 4,
    marginBottom: 8,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textMain,
    backgroundColor: '#FFFFFF',
  },
  codeInputFilled: {
    borderColor: COLORS.primary,
  },
  verifyError: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 12,
    textAlign: 'center',
  },
  verifyResendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  verifyResendText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  verifyResendLink: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  verifyActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  verifyCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  verifyCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  verifyCreateBtn: {
    flex: 1.4,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyCreateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
//nsukushrewdness@gmail.com