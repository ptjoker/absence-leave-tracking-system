import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker'; // ✅ added for dropdown
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

import logoImg from "@/assets/images/logo.png";
import { apiFetch } from '@/lib/api';

const LEVEL_OPTIONS = [
  { label: 'First Year', value: 'first' },
  { label: 'Second Year', value: 'second' },
  { label: 'Third Year', value: 'third' },
  { label: 'Postgraduate', value: 'postgraduate' },
];

export default function SignUpScreen() {
  const router = useRouter();
  
  // State for form fields
  const [activeTab, setActiveTab] = useState('Student');
  const [studentNo, setStudentNo] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [course, setCourse] = useState('');
  const [levelOfStudy, setLevelOfStudy] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // ✅ added
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // ✅ added
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Basic validation
    if (!studentNo.trim() || !name.trim() || !surname.trim() || !course.trim() || !levelOfStudy || !email.trim() || !phone.trim() || !password || !confirmPassword) {
      Alert.alert('Missing details', 'Please fill in all required fields.');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Missing cell number', 'Please enter your cell number.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }
    // ✅ added: confirm password match check
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
          student_number: studentNo.trim(),
          course: course.trim(),
          level_of_study: levelOfStudy,
          cell_number: phone.trim(),
          password,
          role: 'student',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert('Registration failed', data.error || 'Please try again.');
        return;
      }

      Alert.alert(
        'Account created',
        'Your account was created successfully. Please log in to continue.',
        [{ text: 'OK', onPress: () => router.replace('/logIn') }]
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
        >
          {/* Hero Image */}
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

          {/* Form Container */}
          <View style={styles.formContainer}>
            
            {/* Portal Access Label */}
            <View style={styles.facultyAccessRow}>
              <Ionicons name="person-add-outline" size={16} color="#1E429F" />
              <Text style={styles.facultyAccessText}>PORTAL ACCESS</Text>
            </View>

            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Select your role and provide your academic details to join the portal.</Text>

            {/* Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'Student' && styles.activeTab]}
                onPress={() => {
                  setActiveTab('Student');
                  // Already on signStud — no navigation needed.
                }}
              >
                <Ionicons name="school-outline" size={16} color={activeTab === 'Student' ? '#1E429F' : '#6B7280'} />
                <Text style={[styles.tabText, activeTab === 'Student' && styles.activeTabText]}>Student/Assistant</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'Supervisor' && styles.activeTab]}
                onPress={() => {
                  setActiveTab('Supervisor');
                  router.push('/signSup');
                }}
              >
                <Ionicons name="person-outline" size={16} color={activeTab === 'Supervisor' ? '#1E429F' : '#6B7280'} />
                <Text style={[styles.tabText, activeTab === 'Supervisor' && styles.activeTabText]}>Supervisor</Text>
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="list-outline" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.label}>Student Number <Text style={styles.required}>*</Text></Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="e.g. 202100123"
                placeholderTextColor="#6B7280"
                value={studentNo}
                onChangeText={setStudentNo}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="person-outline" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.label}>Name <Text style={styles.required}>*</Text></Text>
              </View>
              <TextInput style={styles.input} placeholder="e.g. Sbongile" placeholderTextColor="#6B7280" value={name} onChangeText={setName} />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="person-outline" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.label}>Surname <Text style={styles.required}>*</Text></Text>
              </View>
              <TextInput style={styles.input} placeholder="e.g. Nkosi" placeholderTextColor="#6B7280" value={surname} onChangeText={setSurname} />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="book-outline" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.label}>Course <Text style={styles.required}>*</Text></Text>
              </View>
              <TextInput style={styles.input} placeholder="e.g. Dip Computer Science" placeholderTextColor="#6B7280" value={course} onChangeText={setCourse} />
            </View>

            {/* ✅ UPDATED: Level of Study is now a dropdown */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="layers-outline" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.label}>Level of Study <Text style={styles.required}>*</Text></Text>
              </View>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={levelOfStudy}
                  onValueChange={(value) => setLevelOfStudy(value)}
                  style={styles.picker}
                  dropdownIconColor="#374151"
                >
                  <Picker.Item label="Select level of study" value="" color="#6B7280" />
                  {LEVEL_OPTIONS.map((option) => (
                    <Picker.Item
                      key={option.value}
                      label={option.label}
                      value={option.value}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="mail-outline" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.label}>Student Email <Text style={styles.required}>*</Text></Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="e.g. 123456789@tut4life.ac.za"
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
                <Text style={styles.label}>Cell Number <Text style={styles.required}>*</Text></Text>
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

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="lock-closed-outline" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.label}>Password</Text>
              </View>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
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

            {/* ✅ ADDED: Confirm Password Field */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="lock-closed-outline" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.label}>Confirm Password</Text>
              </View>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
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

            {/* Submit Button */}
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

            {/* Divider */}
            <View style={styles.divider} />

            {/* Terms & Privacy */}
            <Text style={styles.termsText}>
              By clicking "Complete Registration", you agree to the EduRegister Portal{' '}
              <Text style={styles.linkText}>Terms of Service</Text> and{' '}
              <Text style={styles.linkText}>Privacy Policy</Text>.
            </Text>

            {/* Help Box */}
            <View style={styles.helpBox}>
              <Ionicons name="information-circle-outline" size={24} color="#1E429F" style={styles.helpIcon} />
              <View style={styles.helpTextContainer}>
                <Text style={styles.helpTitle}>Need help with registration?</Text>
                <Text style={styles.helpDesc}>
                  If you encounter any issues with the institutional verification or cannot find your course, please{' '}
                  <Text style={styles.linkText}>reach out to our admissions helpdesk</Text>.
                </Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/logIn')}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Branding */}
          <View style={styles.bottomBranding}>
            <View style={styles.brandingLogoRow}>
              <Ionicons name="school-outline" size={20} color="#1F2937" />
              <Text style={styles.brandingTitle}>EduRegister</Text>
            </View>
            <Text style={styles.brandingCopyright}>© 2024 EduRegister Portal Ltd. All rights reserved.</Text>
            <Text style={styles.brandingTagline}>
              Empowering academic institutions with seamless user management and registration workflows.
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  // --- Hero Image ---
  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imageBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#1E429F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  imageBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // --- Form Container ---
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 24,
    flex: 1,
  },
  facultyAccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  facultyAccessText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E429F',
    letterSpacing: 1,
    marginLeft: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 20,
  },

  // --- Tabs ---
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
    paddingVertical: 12,
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

  // --- Input Fields ---
  inputGroup: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelIcon: {
    marginRight: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  required: {
    color: '#EF4444',
  },

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
    backgroundColor: '#2B4E9B',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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

  input: {
    backgroundColor: '#93B4D4',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1F2937',
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#93B4D4',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownText: {
    fontSize: 15,
    color: '#1F2937',
  },
    dropdownPlaceholder: {
    fontSize: 15,
    color: '#6B7280',
  },

  // ✅ ADDED: Picker wrapper styles
  pickerWrapper: {
    backgroundColor: '#93B4D4',
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    height: 52,
  },
  picker: {
    width: '100%',
    height: '100%',
    color: '#1F2937',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  
  // --- Password Field ---
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#93B4D4',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1F2937',
  },

  // --- Submit Button ---
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
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  submitIcon: {
    marginLeft: 8,
  },

  // --- Divider & Terms ---
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 20,
  },
  termsText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  linkText: {
    color: '#1E429F',
    fontWeight: '600',
  },

  // --- Help Box ---
  helpBox: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 30,
  },
  helpIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  helpTextContainer: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  helpDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },

  // --- Footer ---
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E429F',
  },

  // --- Bottom Branding ---
  bottomBranding: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  brandingLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 6,
  },
  brandingCopyright: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  brandingTagline: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
  },
});