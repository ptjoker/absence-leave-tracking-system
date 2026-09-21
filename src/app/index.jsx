import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // Import router
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import lib from "@/assets/images/Icenter.png";
import logoImg from "@/assets/images/logo.png";
// Import the image
const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter(); // Initialize router

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
        
        {/* Header Section */}
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

        {/* Main Content Area */}
        <View style={styles.mainContent}>
          
          {/* Hero Image Container */}
          <View style={styles.imageContainer}>
            <Image
              source={lib}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </View>

          {/* Text Section */}
          <Text style={styles.title}>Centralized Management</Text>
          <Text style={styles.description}>
            The primary tool for managing student leave requests and academic scheduling efficiency.
          </Text>

          {/* Buttons - Mapped to routes */}
          <TouchableOpacity 
            style={styles.primaryButton} 
            activeOpacity={0.8}
            onPress={() => router.push('/signUp')} 
          >
            <Text style={styles.primaryButtonText}>Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton} 
            activeOpacity={0.8}
            onPress={() => router.push('/logIn')}
          >
            <Text style={styles.secondaryButtonText}>Log In</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>INSTITUTIONAL ACCESS</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Need help accessing your account?  </Text>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Contact IT Support</Text>
            </TouchableOpacity>
          </View>

          {/* System Maintenance Banner */}
          <View style={styles.maintenanceBanner}>
            <Ionicons name="information-circle-outline" size={24} color="#1E429F" style={styles.maintenanceIcon} />
            <View style={styles.maintenanceTextContainer}>
              <Text style={styles.maintenanceTitle}>System Maintenance</Text>
              <Text style={styles.maintenanceDesc}>
                The StudentAssist portal will be undergoing scheduled updates this Sunday from 2:00 AM to 4:00 AM EST.
              </Text>
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
  },
  // --- Header Styles ---
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
  
  // --- Main Content Styles ---
  mainContent: {
    flex: 1,
    backgroundColor: '#A0C1DD',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  
  // --- Image Styles ---
  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 30,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },

  // --- Text Styles ---
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
    marginBottom: 40,
  },

  // --- Button Styles ---
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#1E429F',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E429F',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 2,
    borderColor: '#1E429F',
  },
  secondaryButtonText: {
    color: '#1E429F',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonIcon: {
    marginLeft: 8,
  },

  // --- Divider Styles ---
  dividerContainer: {
    width: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  dividerLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    top: '50%',
  },
  badgeContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    zIndex: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 1,
  },

  // --- Footer Styles ---
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
  },
  footerLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E429F',
  },

  // --- Maintenance Banner Styles ---
  maintenanceBanner: {
    flexDirection: 'row',
    backgroundColor: '#B3CEE5',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'flex-start',
  },
  maintenanceIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  maintenanceTextContainer: {
    flex: 1,
  },
  maintenanceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  maintenanceDesc: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
  },
});