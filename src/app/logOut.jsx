import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ImageBackground,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LogoutModal({ visible, onClose, onConfirm }) {
  const router = useRouter();

  // Handle Cancel: Dismiss the modal, revealing the previous page underneath
  const handleCancel = () => {
    if (onClose) {
      onClose(); // This hides the modal and returns the user to the dashboard
    }
  };

  // Handle Confirm: Trigger logout logic and navigate to endSession
  const handleConfirm = () => {
    if (onConfirm) onConfirm(); 
    // router.replace prevents the user from hitting the back button to return to the dashboard
    router.replace('/endSession'); 
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleCancel} // Handles Android hardware back button
    >
      <View style={styles.modalOverlay}>
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1000&auto=format&fit=crop' }}
          style={styles.modalContainer}
          imageStyle={{ borderRadius: 16 }}
        >
          {/* 70% White Overlay */}
          <View style={styles.imageOverlay} />

          {/* Content Wrapper */}
          <View style={styles.modalContent}>
            
            {/* Icon */}
            <View style={styles.modalIconContainer}>
              <Feather name="log-out" size={24} color="#EF4444" />
            </View>

            {/* Text Content */}
            <Text style={styles.modalTitle}>Log out?</Text>
            <Text style={styles.modalSubtitle}>
              {"You'll need to sign in again to access your dashboard."}
            </Text>

            {/* Buttons */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={handleCancel}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalLogoutButton}
                onPress={handleConfirm}
              >
                <Text style={styles.modalLogoutText}>Log out</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ImageBackground>
      </View>
    </Modal>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark overlay behind the modal
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    backgroundColor: '#FFFFFF', // Fallback color
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden', 
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // 70% White Overlay
    borderRadius: 16,
  },
  modalContent: {
    padding: 24,
    alignItems: 'center',
    zIndex: 1, 
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2', 
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827', 
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280', 
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalActionRow: {
    flexDirection: 'row',
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB', 
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 6, 
  },
  modalCancelText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  modalLogoutButton: {
    flex: 1,
    backgroundColor: '#2563EB', 
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 6, 
  },
  modalLogoutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});