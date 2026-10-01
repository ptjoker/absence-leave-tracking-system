import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import logoImg from '@/assets/images/logo.png';
import { apiFetch, saveSession } from '@/lib/api';


// ============================================================
// FORGOT PASSWORD MODAL (inlined into this file)
// ============================================================
function ForgotPasswordModal({ visible, onClose }) {
  const router = useRouter();

  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!userId.trim() || !email.trim()) {
      Alert.alert('Missing details', 'Please enter both your User ID and email address.');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);

    // Simulate a request — replace with your API call later
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Reset Link Sent',
        `If an account exists for ${email.trim()}, you will receive password reset instructions shortly.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setUserId('');
              setEmail('');
              onClose();
            },
          },
        ]
      );
    }, 800);
  };

  const handleClose = () => {
    setUserId('');
    setEmail('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.modalOverlayTouchable}
          activeOpacity={1}
          onPress={handleClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalSheet}
            onPress={(e) => e.stopPropagation()}
          >
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Ionicons name="close-circle" size={28} color="#A0AEC0" />
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.iconCircle}>
                <Ionicons name="lock-open-outline" size={32} color="#1E429F" />
              </View>

              <Text style={styles.modalTitle}>Forgot your password?</Text>
              <Text style={styles.modalSubtitle}>
                Enter your User ID and registered email address. We'll send you instructions to reset your password.
              </Text>

              <View style={styles.modalInputGroup}>
                <View style={styles.modalLabelRow}>
                  <Ionicons name="person-outline" size={14} color="#6B7280" style={styles.modalLabelIcon} />
                  <Text style={styles.modalLabel}>
                    User ID <Text style={styles.modalRequired}>*</Text>
                  </Text>
                </View>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Staff No. or Student No."
                  placeholderTextColor="#6B7280"
                  value={userId}
                  onChangeText={setUserId}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <View style={styles.modalLabelRow}>
                  <Ionicons name="mail-outline" size={14} color="#6B7280" style={styles.modalLabelIcon} />
                  <Text style={styles.modalLabel}>
                    Email Address <Text style={styles.modalRequired}>*</Text>
                  </Text>
                </View>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 123456789@tut4life.ac.za"
                  placeholderTextColor="#6B7280"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={[styles.modalSubmitButton, loading && { opacity: 0.6 }]}
                onPress={handleSubmit}
                activeOpacity={0.8}
                disabled={loading}
              >
                <Text style={styles.modalSubmitButtonText}>
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={styles.modalSubmitIcon} />
              </TouchableOpacity>

              <View style={styles.modalDivider} />

              <View style={styles.modalHelpBox}>
                <Ionicons name="information-circle-outline" size={22} color="#1E429F" style={styles.modalHelpIcon} />
                <View style={styles.modalHelpTextContainer}>
                  <Text style={styles.modalHelpTitle}>Need more help?</Text>
                  <Text style={styles.modalHelpDesc}>
                    If you don't remember your User ID or email, please{' '}
                    <Text style={styles.modalLinkText}>contact IT Support</Text>.
                  </Text>
                </View>
              </View>

              <View style={styles.modalFooter}>
                <Text style={styles.modalFooterText}>Remember your password? </Text>
                <TouchableOpacity onPress={handleClose}>
                  <Text style={styles.modalFooterLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}


// ============================================================
// MAIN LOGIN SCREEN
// ============================================================
export default function LogInScreen() {
  const router = useRouter();
  
  // State for form
  const [selectedRole, setSelectedRole] = useState('student'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isForgotModalVisible, setIsForgotModalVisible] = useState(false);

  const handleLogIn = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, role: selectedRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert('Login failed', data.error || 'Invalid email or password.');
        return;
      }

      // Save the session for later requests.
      await saveSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        user: data.user,
      });

      // Route based on role.
      if (data.user.role === 'supervisor') {
        router.replace('/supervisorDash');
      } else {
        router.replace('/studDash');
      }
    } catch (err) {
      console.error('Login error:', err);
      Alert.alert('Connection error', 'Could not reach the server. Check the WiFi and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Top Header Bar */}
        <View style={styles.header}>
          <Image
            source={logoImg}
            style={styles.iconContainer}
            resizeMode="contain" 
          />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>iCenter</Text>
            <Text style={styles.headerSubtitle}>ABSENCE & LEAVE TRACKER</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Welcome Text */}
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Access your student assistance portal
            </Text>
          </View>

          {/* Role Selection Cards */}
          <View style={styles.rolesContainer}>
            <TouchableOpacity 
              style={[styles.roleCard, selectedRole === 'student' && styles.roleCardActive]}
              onPress={() => setSelectedRole('student')}
              activeOpacity={0.8}
            >
              <View style={[styles.roleIconContainer, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="person-outline" size={24} color="#2563EB" />
              </View>
              <View style={styles.roleTextContainer}>
                <Text style={styles.roleTitle}>Student Assistant</Text>
                <Text style={styles.roleDesc}>Log your absences & view shifts</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.roleCard, selectedRole === 'supervisor' && styles.roleCardActive]}
              onPress={() => setSelectedRole('supervisor')}
              activeOpacity={0.8}
            >
              <View style={[styles.roleIconContainer, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="people-outline" size={24} color="#9333EA" />
              </View>
              <View style={styles.roleTextContainer}>
                <Text style={styles.roleTitle}>Supervisor</Text>
                <Text style={styles.roleDesc}>Review and approve requests</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            
            {/* Email Input */}
            <Text style={styles.inputLabel}>
              {selectedRole === 'student' ? 'Student Email' : 'Staff Email'}
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. 12345678@tut.ac.za"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password Input */}
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>

            {/* Remember Me & Forgot Password */}
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </View>
                <Text style={styles.checkboxLabel}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setIsForgotModalVisible(true)}>
                <Text style={styles.forgotPassword}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Log In Button */}
            <TouchableOpacity
              style={[styles.logInButton, loading && { opacity: 0.6 }]}
              activeOpacity={0.8}
              onPress={handleLogIn}
              disabled={loading}
            >
              <Text style={styles.logInButtonText}>{loading ? 'Logging in…' : 'Log in'}</Text>
            </TouchableOpacity>

            {/* ✅ ADDED: Don't have an account? Sign Up */}
            <View style={styles.signUpRow}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/signStud')}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password popup */}
      <ForgotPasswordModal
        visible={isForgotModalVisible}
        onClose={() => setIsForgotModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#A0C1DD', 
  },
  keyboardView: {
    flex: 1,
  },
  // --- Top Header Bar ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 8,
    marginRight: 12,
  },
  headerTextContainer: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: 'red',
    letterSpacing: 1,
    marginTop: 2,
  },
  // --- Welcome Text ---
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  welcomeTextContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
  },
  // --- Role Cards ---
  rolesContainer: {
    marginBottom: 20,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  roleCardActive: {
    borderColor: '#2563EB', 
  },
  roleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  roleDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
  // --- Form Container ---
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
    height: 50,
    backgroundColor: '#F9FAFB', 
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  // --- Remember & Forgot ---
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#4B5563',
  },
  forgotPassword: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '700',
  },
  // --- Log In Button ---
  logInButton: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // ✅ ADDED: Sign Up Row Styles
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signUpText: {
    fontSize: 14,
    color: '#6B7280',
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },

  // ============================================================
  // FORGOT PASSWORD MODAL STYLES
  // ============================================================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalOverlayTouchable: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  modalSheet: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 12,
    zIndex: 10,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 26,
    paddingHorizontal: 4,
  },
  modalInputGroup: {
    marginBottom: 16,
  },
  modalLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalLabelIcon: {
    marginRight: 6,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  modalRequired: {
    color: '#EF4444',
  },
  modalInput: {
    backgroundColor: '#93B4D4',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1F2937',
  },
  modalSubmitButton: {
    flexDirection: 'row',
    backgroundColor: '#1E429F',
    borderRadius: 10,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  modalSubmitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalSubmitIcon: {
    marginLeft: 8,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 18,
  },
  modalHelpBox: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 18,
  },
  modalHelpIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  modalHelpTextContainer: {
    flex: 1,
  },
  modalHelpTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  modalHelpDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
  },
  modalLinkText: {
    color: '#1E429F',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFooterText: {
    fontSize: 13,
    color: '#6B7280',
  },
  modalFooterLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E429F',
  },
});