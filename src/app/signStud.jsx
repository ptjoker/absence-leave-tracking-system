// src/app/signStud.jsx
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  Keyboard,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
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
  success: '#10B981',
  selectedBg: '#EFF6FF',
};

// --- Year Options (with icons) ---
const YEAR_OPTIONS = [
  { label: 'Second year',   icon: 'trending-up' },
  { label: 'Third year',    icon: 'award' },
  { label: 'Post Graduate', icon: 'star' },
];

// High zIndex used on the row that owns the dropdown so it renders above later siblings
const Z_TOP = 1000;

const CODE_LENGTH = 8;

export default function SignUpScreen() {
  const router = useRouter();
  const [accountType, setAccountType] = useState('student');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [course, setCourse] = useState('');
  const [currentYear, setCurrentYear] = useState('');
  const [isYearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [cellNumber, setCellNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // --- Verification Modal State ---
  const [isVerifyModalVisible, setVerifyModalVisible] = useState(false);
  const [verificationCode, setVerificationCode] = useState(Array(CODE_LENGTH).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef([]);

  const selectedYear = YEAR_OPTIONS.find((y) => y.label === currentYear);

  // --- Handle clicking "Create account" ---
  const handleCreateAccount = () => {
    // Basic validation
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Missing details', 'Please enter your first and last name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Invalid email', 'Please enter a valid university email.');
      return;
    }
    if (!studentNumber.trim()) {
      Alert.alert('Missing details', 'Please enter your student number.');
      return;
    }
    if (!course.trim()) {
      Alert.alert('Missing details', 'Please enter your course or department.');
      return;
    }
    if (!currentYear) {
      Alert.alert('Missing details', 'Please select your current year.');
      return;
    }
    if (!cellNumber.trim()) {
      Alert.alert('Missing details', 'Please enter your cell number.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Please make sure both passwords are identical.');
      return;
    }
    if (!agreeTerms) {
      Alert.alert('Terms & Conditions', 'Please agree to the terms and privacy policy to continue.');
      return;
    }

    // Reset code and show the verification modal
    setVerificationCode(Array(CODE_LENGTH).fill(''));
    setVerifyModalVisible(true);
    setTimeout(() => inputRefs.current[0]?.focus(), 300);
  };

  // --- Verification code handlers ---
  const handleCodeChange = (text, index) => {
    // Handle paste of full code
    if (text.length > 1) {
      const digits = text.replace(/\D/g, '').slice(0, CODE_LENGTH).split('');
      const newCode = [...verificationCode];
      digits.forEach((d, i) => {
        if (index + i < CODE_LENGTH) newCode[index + i] = d;
      });
      setVerificationCode(newCode);
      const nextIndex = Math.min(index + digits.length, CODE_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    // Single digit typing
    const digit = text.replace(/\D/g, '');
    const newCode = [...verificationCode];
    newCode[index] = digit;
    setVerificationCode(newCode);

    // Auto-advance
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace') {
      if (verificationCode[index]) {
        const newCode = [...verificationCode];
        newCode[index] = '';
        setVerificationCode(newCode);
      } else if (index > 0) {
        const newCode = [...verificationCode];
        newCode[index - 1] = '';
        setVerificationCode(newCode);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleVerify = () => {
    const codeString = verificationCode.join('');
    if (codeString.length !== CODE_LENGTH) {
      Alert.alert('Incomplete code', `Please enter all ${CODE_LENGTH} digits.`);
      return;
    }

    setIsVerifying(true);

    // Simulate verification
    setTimeout(() => {
      setIsVerifying(false);
      setVerifyModalVisible(false);
      Keyboard.dismiss();

      Alert.alert(
        'Account created',
        'Your student assistant account was created successfully. Please log in to continue.',
        [{ text: 'OK', onPress: () => router.replace('/logIn') }]
      );
    }, 800);
  };

  const handleResendCode = () => {
    setVerificationCode(Array(CODE_LENGTH).fill(''));
    setTimeout(() => inputRefs.current[0]?.focus(), 200);
    Alert.alert('Code sent', 'A new 8-digit verification code has been sent to your email.');
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

          {/* --- STANDARD HEADER --- */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Image source={LogoImg} style={styles.logoImage} resizeMode="contain" />
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>iCenter</Text>
                <Text style={styles.headerSubtitle}>ABSENCE & LEAVE TRACKER</Text>
              </View>
            </View>
          </View>

          {/* --- WELCOME SECTION --- */}
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

          {/* --- REGISTRATION CARD --- */}
          <View style={styles.card}>
            <Text style={styles.cardTag}>ACCOUNT REGISTRATION</Text>
            <Text style={styles.cardTitle}>Create your account</Text>

            {/* Account Type Toggle */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, accountType === 'student' && styles.toggleButtonActive]}
                onPress={() => router.replace('/signStud')}
              >
                <Feather name="user" size={14} color={accountType === 'student' ? COLORS.primary : COLORS.textMuted} />
                <Text style={[styles.toggleText, accountType === 'student' && styles.toggleTextActive]}>
                  Student assistant
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toggleButton, accountType === 'supervisor' && styles.toggleButtonActive]}
                onPress={() => router.replace('/signSup')}
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

            {/* ROW WITH DROPDOWN */}
            <View style={[styles.row, { zIndex: Z_TOP, position: 'relative' }]}>
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

                <TouchableOpacity
                  style={[styles.inputWrapper, isYearDropdownOpen && styles.inputWrapperOpen]}
                  onPress={() => setYearDropdownOpen((v) => !v)}
                  activeOpacity={0.7}
                >
                  {selectedYear ? (
                    <View style={styles.selectedYearRow}>
                      <Feather name={selectedYear.icon} size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                      <Text style={[styles.input, { color: COLORS.textMain }]}>{selectedYear.label}</Text>
                    </View>
                  ) : (
                    <Text style={[styles.input, { color: '#9CA3AF' }]}>Select year</Text>
                  )}
                  <Feather
                    name={isYearDropdownOpen ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={isYearDropdownOpen ? COLORS.primary : COLORS.textMuted}
                  />
                </TouchableOpacity>

                {isYearDropdownOpen && (
                  <>
                    <Pressable style={styles.dropdownBackdrop} onPress={() => setYearDropdownOpen(false)} />
                    <View style={styles.dropdownList}>
                      <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                        {YEAR_OPTIONS.map((option, index) => {
                          const isSelected = currentYear === option.label;
                          return (
                            <TouchableOpacity
                              key={option.label}
                              style={[
                                styles.dropdownItem,
                                isSelected && styles.dropdownItemSelected,
                                index === YEAR_OPTIONS.length - 1 && { borderBottomWidth: 0 },
                              ]}
                              onPress={() => {
                                setCurrentYear(option.label);
                                setYearDropdownOpen(false);
                              }}
                              activeOpacity={0.7}
                            >
                              <View style={styles.dropdownItemLeft}>
                                <View style={[styles.dropdownIconCircle, isSelected && styles.dropdownIconCircleSelected]}>
                                  <Feather name={option.icon} size={13} color={isSelected ? '#FFFFFF' : COLORS.primary} />
                                </View>
                                <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>
                                  {option.label}
                                </Text>
                              </View>
                              {isSelected && <Feather name="check" size={14} color={COLORS.primary} />}
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </>
                )}
              </View>
            </View>

            <View style={[styles.inputGroup, { zIndex: 0, position: 'relative' }]}>
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

            <View style={[styles.row, { zIndex: 0, position: 'relative' }]}>
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
              style={[styles.checkboxContainer, { zIndex: 0, position: 'relative' }]}
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
            <TouchableOpacity
              style={[styles.primaryButton, { zIndex: 0, position: 'relative' }]}
              onPress={handleCreateAccount}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>
                Create {accountType === 'student' ? 'student' : 'supervisor'} account
              </Text>
              <Feather name="arrow-right" size={16} color="#FFF" />
            </TouchableOpacity>

            <View style={[styles.cardFooter, { zIndex: 0, position: 'relative' }]}>
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

      {/* ============================================= */}
      {/* 8-DIGIT VERIFICATION CODE MODAL               */}
      {/* ============================================= */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isVerifyModalVisible}
        onRequestClose={() => setVerifyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Icon */}
            <View style={styles.modalIconContainer}>
              <Feather name="shield" size={26} color={COLORS.primary} />
            </View>

            {/* Title */}
            <Text style={styles.modalTitle}>Verify your email</Text>
            <Text style={styles.modalSubtitle}>
              We've sent an 8-digit verification code to{'\n'}
              <Text style={styles.modalEmail}>{email || 'your email'}</Text>
            </Text>

            {/* Code Input Boxes */}
            <View style={styles.codeRow}>
              {Array(CODE_LENGTH).fill(0).map((_, index) => (
                <TextInput
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  style={[
                    styles.codeBox,
                    verificationCode[index] && styles.codeBoxFilled,
                  ]}
                  value={verificationCode[index]}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={(e) => handleCodeKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!isVerifying}
                />
              ))}
            </View>

            {/* Resend */}
            <TouchableOpacity onPress={handleResendCode} style={styles.resendRow}>
              <Text style={styles.resendText}>
                Didn't receive the code? <Text style={styles.resendLink}>Resend</Text>
              </Text>
            </TouchableOpacity>

            {/* Footer Buttons */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setVerifyModalVisible(false);
                  Keyboard.dismiss();
                }}
                disabled={isVerifying}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.verifyBtn, isVerifying && { opacity: 0.6 }]}
                onPress={handleVerify}
                disabled={isVerifying}
                activeOpacity={0.8}
              >
                <Feather name={isVerifying ? 'loader' : 'check-circle'} size={16} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.verifyBtnText}>
                  {isVerifying ? 'Verifying…' : 'Verify & Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// --- Styles ---
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
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    paddingHorizontal: 12, minHeight: 44,
  },
  inputWrapperOpen: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFFFFF',
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 12, fontSize: 14, color: COLORS.textMain },
  selectedYearRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },

  dropdownBackdrop: {
    position: 'absolute',
    top: -2000, bottom: -2000, left: -2000, right: -2000,
    zIndex: 90,
  },
  dropdownList: {
    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
    maxHeight: 220, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 16, elevation: 20, zIndex: 200,
  },
  dropdownItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  dropdownItemSelected: { backgroundColor: COLORS.selectedBg },
  dropdownItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dropdownIconCircle: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  dropdownIconCircleSelected: { backgroundColor: COLORS.primary },
  dropdownItemText: { fontSize: 14, color: COLORS.textMain },
  dropdownItemTextSelected: { color: COLORS.primary, fontWeight: 'bold' },

  checkboxContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20, marginTop: 8 },
  checkbox: {
    width: 18, height: 18, borderRadius: 4, borderWidth: 1,
    borderColor: COLORS.textMuted, justifyContent: 'center',
    alignItems: 'center', marginRight: 8, marginTop: 2,
  },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkboxText: { fontSize: 12, color: COLORS.textMuted, flex: 1, lineHeight: 18 },
  linkText: { color: COLORS.primary, fontWeight: 'bold' },

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

  // =============================================
  // VERIFICATION MODAL STYLES
  // =============================================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  modalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.darkBlue,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'serif',
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalEmail: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 6,
  },
  codeBox: {
    width: 38,
    height: 48,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBg,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textMain,
    paddingVertical: 0,
  },
  codeBoxFilled: {
    borderColor: COLORS.primary,
    backgroundColor: '#EFF6FF',
    color: COLORS.primary,
  },
  resendRow: {
    marginBottom: 20,
  },
  resendText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  resendLink: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  verifyBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  verifyBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});