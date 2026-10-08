// src/app/signSup.jsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { apiFetch } from '@/lib/api';

export default function SupervisorSignUpScreen() {
  const router = useRouter();

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

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !department.trim() || !cellNumber.trim() || !password || !confirmPassword) {
      Alert.alert('Missing details', 'Please fill in all required fields.');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
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

    setLoading(true);
    try {
      const res = await apiFetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          student_email: email.trim(),
          student_number: 'SUP-' + Math.floor(100000 + Math.random() * 900000), // Generate a staff ID for now
          course: department.trim(),
          level_of_study: 'supervisor',
          cell_number: cellNumber.trim(),
          password,
          role: 'supervisor',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert('Registration failed', data.error || 'Please try again.');
        return;
      }

      Alert.alert(
        'Account created',
        'Your supervisor account was created. Please log in to continue.',
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );
    } catch (err) {
      console.error('Register error:', err);
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
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* --- FORM CARD --- */}
          <View style={styles.formContainer}>
            <Text style={styles.cardTag}>ACCOUNT REGISTRATION</Text>
            <Text style={styles.title}>Create your account</Text>

            {/* --- TAB TOGGLE --- */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={styles.tab}
                onPress={() => router.replace('/signStud')}
              >
                <Ionicons name="person-outline" size={16} color="#6B7280" />
                <Text style={styles.tabText}>Student assistant</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, styles.activeTab]}
                onPress={() => {}}
              >
                <Ionicons name="person-outline" size={16} color="#1E429F" />
                <Text style={[styles.tabText, styles.activeTabText]}>Supervisor</Text>
              </TouchableOpacity>
            </View>

            {/* --- NAME ROW --- */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth, { marginRight: 8 }]}>
                <Text style={styles.label}>First name <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Sarah"
                  placeholderTextColor="#9CA3AF"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View style={[styles.inputGroup, styles.halfWidth, { marginLeft: 8 }]}>
                <Text style={styles.label}>Last name <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Nkosi"
                  placeholderTextColor="#9CA3AF"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            {/* --- WORK EMAIL --- */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Work email <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={16} color="#6B7280" style={styles.inputIcon} />
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

            {/* --- DEPARTMENT --- */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Department or faculty <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="business-outline" size={16} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Faculty of Information and Communicator"
                  placeholderTextColor="#9CA3AF"
                  value={department}
                  onChangeText={setDepartment}
                />
              </View>
            </View>

            {/* --- CELL NUMBER --- */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cell number <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={16} color="#6B7280" style={styles.inputIcon} />
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

            {/* --- PASSWORD ROW --- */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth, { marginRight: 8 }]}>
                <Text style={styles.label}>Password <Text style={styles.required}>*</Text></Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={16} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your passwo..."
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={[styles.inputGroup, styles.halfWidth, { marginLeft: 8 }]}>
                <Text style={styles.label}>Confirm password <Text style={styles.required}>*</Text></Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={16} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your passwo..."
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* --- TERMS CHECKBOX --- */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAgreeTerms(!agreeTerms)}
            >
              <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                {agreeTerms && <Ionicons name="checkmark" size={12} color="#FFF" />}
              </View>
              <Text style={styles.checkboxText}>
                I agree to the StudentAssist <Text style={styles.linkText}>terms and privacy policy</Text>.
              </Text>
            </TouchableOpacity>

            {/* --- SUBMIT BUTTON --- */}
            <TouchableOpacity
              style={[styles.submitButton, loading && { opacity: 0.6 }]}
              onPress={handleRegister}
              activeOpacity={0.8}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Creating account…' : 'Create supervisor account'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={styles.submitIcon} />
            </TouchableOpacity>

            {/* --- FOOTER --- */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/login')}>
                <Text style={styles.footerLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* --- BOTTOM LINKS --- */}
          <View style={styles.bottomLinks}>
            <Text style={styles.bottomLinkText}>help? </Text>
            <TouchableOpacity>
              <Text style={styles.bottomLink}>Contact iCenter support</Text>
            </TouchableOpacity>
            <Text style={styles.bottomLinkText}> </Text>
            <TouchableOpacity onPress={() => router.replace('/')}>
              <Text style={styles.bottomLink}>Return home</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },

  // Form Card
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  cardTag: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E429F',
    letterSpacing: 1,
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'serif',
    marginBottom: 24,
  },

  // Toggle
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#1E429F',
  },

  // Form Fields
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },

  // Checkbox
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    marginTop: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#1E429F',
    borderColor: '#1E429F',
  },
  checkboxText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
    lineHeight: 18,
  },
  linkText: {
    color: '#1E429F',
    fontWeight: 'bold',
  },

  // Submit Button
  submitButton: {
    backgroundColor: '#1E429F',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  submitIcon: {
    marginLeft: 8,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#6B7280',
  },
  footerLink: {
    fontSize: 13,
    color: '#1E429F',
    fontWeight: 'bold',
  },

  // Bottom Links
  bottomLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    flexWrap: 'wrap',
  },
  bottomLinkText: {
    fontSize: 12,
    color: '#6B7280',
  },
  bottomLink: {
    fontSize: 12,
    color: '#1E429F',
    fontWeight: '600',
  },
});