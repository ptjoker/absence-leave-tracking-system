// src/app/logOut.jsx
import logoImg from "@/assets/images/logo.png"; // Import the logo image  
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LogOut() {
  const router = useRouter();

  // Handle Sign In Again
  const handleSignInAgain = () => {
    router.replace('/logIn');
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
        
        {/* Image Section with Badge */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop' }} 
            style={styles.headerImage} 
          />
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          </View>
        </View>

        {/* Status Pill */}
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>SESSION TERMINATED SUCCESSFULLY</Text>
        </View>

        {/* Titles */}
        <Text style={styles.title}>You have been signed out</Text>
        <Text style={styles.subtitle}>
          Thank you for using StudentAssist. Your session has been securely closed to protect your academic data.
        </Text>

        {/* Info Card 1: Encryption Status */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#1E3A8A" style={styles.infoIcon} />
            <Text style={styles.infoCardTitle}>ENCRYPTION STATUS</Text>
          </View>
          <Text style={styles.infoCardText}>
            All temporary browser data and local cache related to your session have been securely cleared.
          </Text>
        </View>

        {/* Info Card 2: Session Duration */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <Ionicons name="time-outline" size={18} color="#1E3A8A" style={styles.infoIcon} />
            <Text style={styles.infoCardTitle}>SESSION DURATION</Text>
          </View>
          <Text style={styles.infoCardText}>
            Your session ended at 09:42 AM. Total active time: 42 minutes across 3 academic modules.
          </Text>
        </View>

        {/* Sign In Again Button */}
        <TouchableOpacity style={styles.primaryButton} onPress={handleSignInAgain}>
          <Ionicons name="log-in-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.primaryButtonText}>SIGN IN AGAIN</Text>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        {/* Secondary Buttons Row */}
        <View style={styles.secondaryButtonsRow}>
          <TouchableOpacity style={styles.secondaryButton}>
            <Ionicons name="open-outline" size={16} color="#1A202C" style={{ marginRight: 6 }} />
            <Text style={styles.secondaryButtonText}>University Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton}>
            <Ionicons name="help-circle-outline" size={16} color="#1A202C" style={{ marginRight: 6 }} />
            <Text style={styles.secondaryButtonText}>Support Desk</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Note */}
        <Text style={styles.footerText}>
          Your browser will automatically redirect to the home page in 30 seconds.
        </Text>

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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 36,
    height: 36,
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
  },
  headerSubtitle: {
    fontSize: 9,
    fontWeight: '600',
    color: 'red',
    letterSpacing: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // --- Content ---
  scrollContent: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },
  // --- Image & Badge ---
  imageContainer: {
    position: 'relative',
    marginBottom: 20,
    marginTop: 10,
  },
  headerImage: {
    width: 250,
    height: 180,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -15,
    right: -15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#22C55E', // Green
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  // --- Status Pill ---
  statusPill: {
    backgroundColor: '#A7C7E7',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: 0.5,
  },
  // --- Text ---
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  // --- Info Cards ---
  infoCard: {
    width: '100%',
    backgroundColor: '#D0E2F3',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#B0C4DE',
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: 0.5,
  },
  infoCardText: {
    fontSize: 12,
    color: '#4A5568',
    lineHeight: 16,
  },
  // --- Primary Button ---
  primaryButton: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#1E3A8A',
    borderRadius: 10,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // --- Secondary Buttons ---
  secondaryButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  secondaryButton: {
    flex: 0.48,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A202C',
  },
  // --- Footer ---
  footerText: {
    fontSize: 11,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
  },
});