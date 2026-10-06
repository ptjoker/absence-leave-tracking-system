import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // Assuming you are using Expo Router
import {
  ImageBackground,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// --- Theme Colors ---
const COLORS = {
  primary: '#2563EB', // Blue button
  darkBlue: '#1E3A8A', // Heading text
  textMain: '#111827',
  textMuted: '#6B7280',
  bg: '#FFFFFF',
  border: '#E5E7EB',
  successBg: '#D1FAE5', // Light green background for icon
  successText: '#059669', // Green icon color
  red: '#EF4444', // "TSHWANE UNIVERSITY..." text
};

export default function LogoutSuccessScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Background Image with Blur and Overlay */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1590&auto=format&fit=crop' }}
        style={styles.backgroundImage}
        blurRadius={8}
      >
        {/* White overlay to lighten the blurred background */}
        <View style={styles.overlay} />

        {/* --- HEADER --- */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Ionicons name="school" size={16} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.logoText}>iCenter</Text>
              <Text style={styles.logoSubtext}>ABSENCE AND LEAVE TRACKER</Text>
            </View>
          </View>
        </View>

        {/* --- MAIN CONTENT (Centered Card) --- */}
        <View style={styles.mainContent}>
          <View style={styles.card}>
            {/* Success Icon */}
            <View style={styles.iconContainer}>
              <Feather name="check" size={24} color={COLORS.successText} />
            </View>

            {/* University Name */}
            <Text style={styles.universityText}>TSHWANE UNIVERSITY OF TECHNOLOGY</Text>

            {/* Main Heading */}
            <Text style={styles.headingText}>You have been logged out.</Text>

            {/* Subtitle */}
            <Text style={styles.subtitleText}>
              Your iCenter session has ended. Please sign in again to access the portal.
            </Text>

            {/* Sign In Button */}
            <TouchableOpacity 
              style={styles.signInButton}
              onPress={() => router.push('/logIn')} // Navigate to your login page
            >
              <Text style={styles.signInButtonText}>Sign in again</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ImageBackground>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // Light overlay to fade the blurred image
  },
  
  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkBlue,
  },
  logoSubtext: {
    fontSize: 8,
    color: COLORS.textMuted,
    letterSpacing: 1,
  },

  // Main Content (Centering the card)
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  // Card
  card: {
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.successBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  universityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.red,
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: 'center',
  },
  headingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkBlue,
    fontFamily: 'serif',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  signInButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    width: '100%',
    alignItems: 'center',
  },
  signInButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});