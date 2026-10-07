// src/app/signSup.jsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
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

import logoImg from '@/assets/images/logo.png';
import { apiFetch } from '@/lib/api';

export default function SupervisorSignUpScreen() {
  const router = useRouter();

  const [staffNo, setStaffNo] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!staffNo.trim() || !name.trim() || !surname.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
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

    setLoading(true);
    try {
      const res = await apiFetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: name.trim(),
          last_name: surname.trim(),
          student_email: email.trim(),
          student_number: staffNo.trim(),
          course: 'Faculty',
          level_of_study: 'supervisor',
          cell_number: phone.trim(),
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

          <View style={styles.imageContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000&auto=format&fit=crop' }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </View>

          <View style={styles.formContainer}>
            <View style={styles.facultyAccessRow}>
              <Ionicons name="shield-checkmark" size={16} color="#1E429F" />
              <Text style={styles.facultyAccessText}>FACULTY ACCESS</Text>
            </View>

            <Text style={styles.title}>Supervisor Registration</Text>
            <Text style={styles.subtitle}>Provide your staff details to join the portal.</Text>

            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, false && styles.activeTab]}
                onPress={() => router.replace('/signStud')}
              >
                <Ionicons name="school-outline" size={16} color="#6B7280" />
                <Text style={styles.tabText}>Student Assistant</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, styles.activeTab]}
                onPress={() => {}}
              >
                <Ionicons name="person-outline" size={16} color="#1E429F" />
                <Text style={[styles.tabText, styles.activeTabText]}>Supervisor</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="id-card-outline" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.label}>Staff No. <Text style={styles.required}>*</Text></Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="e.g. STF-882910"
                placeholderTextColor="#6B7280"
                value={staffNo}
                onChangeText={setStaffNo}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="person-outline" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.label}>Name <Text style={styles.required}>*</Text></Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="e.g. Jane"
                placeholderTextColor="#6B7280"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="business-outline" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.label}>Surname <Text style={styles.required}>*</Text></Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="e.g. Smith"
                placeholderTextColor="#6B7280"
                value={surname}
                onChangeText={setSurname}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="at-outline" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.label}>University email <Text style={styles.required}>*</Text></Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="e.g. jane.smith@tut.ac.za"
                placeholderTextColor="#6B7280"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="call-outline" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.label}>Cellphone number <Text style={styles.required}>*</Text></Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="e.g. 076 123 4567"
                placeholderTextColor="#6B7280"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="lock-closed-outline" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.label}>Password <Text style={styles.required}>*</Text></Text>
              </View>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#6B7280"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="lock-closed-outline" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.label}>Confirm Password <Text style={styles.required}>*</Text></Text>
              </View>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm your password"
                  placeholderTextColor="#6B7280"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && { opacity: 0.6 }]}
              onPress={handleRegister}
              activeOpacity={0.8}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Registering…' : 'Complete Registration'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={styles.submitIcon} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <Text style={styles.termsText}>
              By clicking "Complete Registration", you agree to the EduRegister Portal{' '}
              <Text style={styles.linkText}>Terms of Service</Text> and{' '}
              <Text style={styles.linkText}>Privacy Policy</Text>.
            </Text>

            <View style={styles.helpBox}>
              <Ionicons name="information-circle-outline" size={24} color="#1E429F" style={styles.helpIcon} />
              <View style={styles.helpTextContainer}>
                <Text style={styles.helpTitle}>Need help with registration?</Text>
                <Text style={styles.helpDesc}>
                  If you encounter any issues with the institutional verification, please{' '}
                  <Text style={styles.linkText}>reach out to our faculty support desk</Text>.
                </Text>
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/login')}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#A0C1DD' },
  keyboardView: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingBottom: 40 },

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
  headerTextContainer: { justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  headerSubtitle: { fontSize: 10, fontWeight: '600', color: '#6B7280', letterSpacing: 1, marginTop: 2 },

  imageContainer: { width: '100%', height: 180, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },

  formContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 24,
    flex: 1,
  },
  facultyAccessRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  facultyAccessText: { fontSize: 12, fontWeight: '700', color: '#1E429F', letterSpacing: 1, marginLeft: 6 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 24 },

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
  tabText: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginLeft: 6 },
  activeTabText: { color: '#1E429F' },

  inputGroup: { marginBottom: 18 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  labelIcon: { marginRight: 6 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  required: { color: '#EF4444' },

  input: {
    backgroundColor: '#93B4D4',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1F2937',
  },

  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#93B4D4',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  passwordInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#1F2937' },

  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#1E429F',
    borderRadius: 10,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  submitIcon: { marginLeft: 8 },

  divider: { height: 1, backgroundColor: '#E5E7EB', marginBottom: 20 },
  termsText: { fontSize: 12, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  linkText: { color: '#1E429F', fontWeight: '600' },

  helpBox: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 30,
  },
  helpIcon: { marginRight: 12, marginTop: 2 },
  helpTextContainer: { flex: 1 },
  helpTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
  helpDesc: { fontSize: 12, color: '#6B7280', lineHeight: 18 },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  footerText: { fontSize: 14, color: '#6B7280' },
  footerLink: { fontSize: 14, fontWeight: '700', color: '#1E429F' },
});