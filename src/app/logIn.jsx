// src/app/logIn.jsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image, // 👈 1. Added missing Image import
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

export default function LogInScreen() {
  const router = useRouter();
  
  // State for form
  const [selectedRole, setSelectedRole] = useState('student'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogIn = () => {
    // Add your authentication logic here
    console.log(`Logging in as ${selectedRole} with:`, { email, password, rememberMe });
    
    // Example: Navigate to home page after successful login
    // router.replace('/home');
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
            resizeMode="contain" // 👈 2. Changed to contain so the logo fits nicely
          />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>StudentAssistance</Text>
            <Text style={styles.headerSubtitle}>ABSENCE TRACKER</Text>
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
            {/* Student Assistant Card */}
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

            {/* Supervisor Card */}
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

              <TouchableOpacity>
                <Text style={styles.forgotPassword}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Log In Button */}
            <TouchableOpacity
              style={styles.logInButton}
              activeOpacity={0.8}
              onPress={handleLogIn}
            >
              <Text style={styles.logInButtonText}>Log in</Text>
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
    color: '#6B7280',
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
});