import { Feather } from '@expo/vector-icons';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LogoutModal({ visible, onClose, onConfirm }) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          
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
              onPress={onClose}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalLogoutButton}
              onPress={onConfirm}   // ✅ FIXED: Passes the onConfirm handler
            >
              <Text style={styles.modalLogoutText}>Log out</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark overlay
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2', // Light red background
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827', // Dark text
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280', // Muted text
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalActionRow: {
    flexDirection: 'row',
    width: '100%',
    // Removed gap: 12 (Replaced with margins below for compatibility)
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB', // Light gray border
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 6, // ✅ Added (replaces gap)
  },
  modalCancelText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  modalLogoutButton: {
    flex: 1,
    backgroundColor: '#2563EB', // Primary blue
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 6, // ✅ Added (replaces gap)
  },
  modalLogoutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});