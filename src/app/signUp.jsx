import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
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

import logoImg from "@/assets/images/logo.png"; // Import the image

export default function SignUpScreen() {
  const router = useRouter();
  
  // State for form fields
  const [activeTab, setActiveTab] = useState('Student');
  const [studentNo, setStudentNo] = useState('');
  const [name, setName] = useState('John');
  const [surname, setSurname] = useState('Doe');
  const [course, setCourse] = useState('Dip Computer Science');
  const [levelOfStudy, setLevelOfStudy] = useState('Year 1 Undergraduate');
  const [email, setEmail] = useState('john.doe@university.edu');
  const [phone, setPhone] = useState('+1 (555) 000-0000');
  const [password, setPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);


  const handleRegister = () => {
    // Add your student registration logic here
    console.log('Registering Student:', { studentNo, name, surname, course, levelOfStudy, email, phone, password });
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
                                   resizeMode="cover"
                                 />
                     <View style={styles.headerTextContainer}>
                          <Text style={styles.headerTitle}>StudentAssistance</Text>
                          <Text style={styles.headerSubtitle}>ABSENCE TRACKER</Text>
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
                onPress={() => {setActiveTab('Student');
                  router.push('/signUp');} // Navigates to Student Registration
                }
              >
                <Ionicons name="school-outline" size={16} color={activeTab === 'Student' ? '#1E429F' : '#6B7280'} />
                <Text style={[styles.tabText, activeTab === 'Student' && styles.activeTabText]}>Student/Assistant</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'Supervisor' && styles.activeTab]}
                onPress={() => {
                  setActiveTab('Supervisor');
                  router.push('/supReg'); // Navigates to Supervisor Registration
                }}
              >
                <Ionicons name="person-outline" size={16} color={activeTab === 'Supervisor' ? '#1E429F' : '#6B7280'} />
                <Text style={[styles.tabText, activeTab === 'Supervisor' && styles.activeTabText]}>Supervisor</Text>
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="hash-outline" size={14} color="#6B7280" style={styles.labelIcon} />
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
              <TextInput style={styles.input} value={name} onChangeText={setName} />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="person-outline" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.label}>Surname <Text style={styles.required}>*</Text></Text>
              </View>
              <TextInput style={styles.input} value={surname} onChangeText={setSurname} />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="book-outline" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.label}>Course <Text style={styles.required}>*</Text></Text>
              </View>
              <TextInput style={styles.input} value={course} onChangeText={setCourse} />
            </View>

            {/* Level of Study (Dropdown Look) */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="layers-outline" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.label}>Level of Study <Text style={styles.required}>*</Text></Text>
              </View>
              <TouchableOpacity style={styles.dropdownInput} activeOpacity={0.8}>
                <Text style={styles.dropdownText}>{levelOfStudy}</Text>
                <Ionicons name="chevron-down" size={18} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="mail-outline" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.label}>Student Email <Text style={styles.required}>*</Text></Text>
              </View>
              <TextInput
                style={styles.input}
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

            {/* Submit Button */}
            <TouchableOpacity style={styles.submitButton} onPress={handleRegister} activeOpacity={0.8}>
              <Text style={styles.submitButtonText}>Complete Registration</Text>
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
    color: '#6B7280',
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