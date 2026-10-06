// src/app/signOut.jsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SecureSignOut() {
  const router = useRouter();

  // Handle Confirm Logout -> Navigate to logOut.jsx
  const handleConfirmLogout = () => {
    // TODO: Clear user session / tokens here
    router.replace('/logOut');
  };

  // Handle Cancel Logout -> Go back to previous screen
  const handleCancelLogout = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      
      {/* Top Header */}
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top Icon & Titles */}
        <View style={styles.topSection}>
          <View style={styles.shieldIconContainer}>
            <Ionicons name="shield-checkmark" size={40} color="#1E3A8A" />
          </View>
          <Text style={styles.pageTitle}>Secure Sign Out</Text>
          <Text style={styles.pageSubtitle}>STUDENT PORTAL SESSION MANAGEMENT</Text>
        </View>

        {/* Main Card */}
        <View style={styles.mainCard}>
          <Text style={styles.cardTitle}>Are you sure?</Text>
          <Text style={styles.cardSubtitle}>
            Confirming will end your current session. You will need to re-authenticate to access your student records.
          </Text>

          {/* Warning Box 1: Unsaved Changes */}
          <View style={styles.warningBoxBlue}>
            <View style={styles.warningIconContainerBlue}>
              <Ionicons name="warning" size={18} color="#2563EB" />
            </View>
            <View style={styles.warningTextContainer}>
              <Text style={styles.warningTitleBlue}>UNSAVED CHANGES</Text>
              <Text style={styles.warningTextBlue}>
                Please ensure any open request forms or schedule changes have been submitted before logging out to avoid data loss.
              </Text>
            </View>
          </View>

          {/* Warning Box 2: Public Computer */}
          <View style={styles.warningBoxGrey}>
            <View style={styles.warningIconContainerGrey}>
              <Ionicons name="desktop-outline" size={18} color="#9CA3AF" />
            </View>
            <View style={styles.warningTextContainer}>
              <Text style={styles.warningTitleGrey}>PUBLIC COMPUTER?</Text>
              <Text style={styles.warningTextGrey}>
                If you are using a public or shared device, remember to close all browser windows after signing out for maximum security.
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {/* Confirm Logout Button -> Navigates to logOut.jsx */}
            <TouchableOpacity 
              style={styles.confirmButton} 
              onPress={() => router.push('/endSession')}
            >
                <Ionicons name="log-out-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.confirmButtonText}>Confirm Logout</Text>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={handleCancelLogout}
            >
              <Ionicons name="close-circle-outline" size={20} color="#4A5568" style={{ marginRight: 8 }} />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Note */}
          <View style={styles.footerNote}>
            <Ionicons name="lock-closed-outline" size={12} color="#A0AEC0" style={{ marginRight: 6 }} />
            <Text style={styles.footerNoteText}>UNIVERSITY SECURITY STANDARD PROTOCOL</Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#8FB3D9',
  },
  // --- Header ---
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
  // --- Content ---
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  // --- Top Section ---
  topSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  shieldIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  pageSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 1.5,
  },
  // --- Main Card ---
  mainCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 10,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  // --- Warning Boxes ---
  warningBoxBlue: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  warningIconContainerBlue: {
    marginRight: 12,
    marginTop: 2,
  },
  warningTitleBlue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  warningTextBlue: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 16,
  },
  warningBoxGrey: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  warningIconContainerGrey: {
    marginRight: 12,
    marginTop: 2,
  },
  warningTitleGrey: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4B5563',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  warningTextGrey: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  // --- Action Buttons ---
  actionsContainer: {
    marginBottom: 20,
  },
  confirmButton: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#4A5568',
    fontSize: 16,
    fontWeight: '700',
  },
  // --- Footer Note ---
  footerNote: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerNoteText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A0AEC0',
    letterSpacing: 0.5,
  },
});