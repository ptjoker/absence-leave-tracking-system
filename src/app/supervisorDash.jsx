import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import logoImg from '@/assets/images/logo.png';
import { apiFetch, clearSession, getSession } from '@/lib/api';



const StatCard = ({ title, value, iconName }) => (
  <View style={styles.statCard}>
    <View style={styles.statHeader}>
      <Text style={styles.statTitle}>{title}</Text>
      <Ionicons name={iconName} size={16} color="#8FB3D9" />
    </View>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

export default function SupervisorDashboard() {
  const router = useRouter();

  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assistantCount, setAssistantCount] = useState(0);

  // Load requests + assistant count on mount.
  useEffect(() => {
    const load = async () => {
      try {
        const session = await getSession();
        if (!session?.user) {
          router.replace('/logIn');
          return;
        }
        setUser(session.user);

        const res = await apiFetch('/api/requests');
        if (res.status === 401) {
          await clearSession();
          router.replace('/logIn');
          return;
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error || 'Could not load requests');
          return;
        }
        const data = await res.json();

        const mapped = (Array.isArray(data) ? data : []).map((r) => ({
          id: r.rawId,
          displayId: r.id,
          name: r.name,
          initials: r.initials,
          studentId: r.studentNumber || '',
          email: r.email || '',
          reason: r.reason || r.type || '',
          type: (r.type || '').toLowerCase().includes('shift') ? 'SHIFT SWAP' : 'LEAVE',
          date: r.createdAt
            ? new Date(r.createdAt)
                .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                .toUpperCase()
            : '',
          period: r.dateRange || '',
          duration: '',
          color: '#E9D8FD',
          avatarColor: '#8B5CF6',
          description: r.detail || r.reason || 'No description provided.',
          status:
            r.status === 'Pending'
              ? 'PENDING'
              : r.status === 'Approved'
              ? 'APPROVED'
              : 'DECLINED',
        }));

        setRequests(mapped);

        // Fetch assistant count separately (doesn't block the list).
        try {
          const aRes = await apiFetch('/api/assistants');
          if (aRes.ok) {
            const aData = await aRes.json();
            setAssistantCount(Array.isArray(aData) ? aData.length : 0);
          }
        } catch {}
      } catch (err) {
        console.error('Supervisor dashboard load error:', err);
        setError('Could not reach the server.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  // Count pending dynamically
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const approvedCount = requests.filter((r) => r.status === 'APPROVED').length;

  // Open modal with the selected request
  const handleRequestPress = (item) => {
    setSelectedRequest(item);
    setIsModalVisible(true);
  };

  // Approve or decline handler — persists to backend.
  const handleDecision = async (id, newStatus) => {
    const backendStatus = newStatus === 'APPROVED' ? 'Approved' : 'Rejected';

    try {
      const res = await apiFetch(`/api/requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: backendStatus }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        Alert.alert('Error', body.error || 'Could not update request');
        return;
      }

      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
      setIsModalVisible(false);
      setSelectedRequest(null);

      Alert.alert(
        newStatus === 'APPROVED' ? 'Request Approved' : 'Request Declined',
        `The request has been ${newStatus.toLowerCase()} successfully.`
      );
    } catch (err) {
      console.error('Decision error:', err);
      Alert.alert('Connection error', 'Could not reach the server.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
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

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/supNotification')}
          >
            <Ionicons name="notifications-outline" size={22} color="#1E3A8A" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/logOut')}>
            <Ionicons name="log-out-outline" size={22} color="#1E3A8A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Supervisor Dashboard</Text>
          <Text style={styles.welcomeSubtitle}>
            Manage student leave and absence tracking for the current semester.
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard title="PENDING REVIEW" value={String(pendingCount)} iconName="time-outline" />
          <StatCard title="APPROVED" value={String(approvedCount)} iconName="checkmark-circle-outline" />
          <StatCard title="ASSISTANTS" value={String(assistantCount)} iconName="people-outline" />
          <StatCard title="SHIFT SWAPS" value={String(requests.filter((r) => r.type === 'SHIFT SWAP').length)} iconName="swap-horizontal-outline" />
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="time-outline" size={16} color="#1E3A8A" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>AWAITING YOUR REVIEW</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>VIEW ALL</Text>
          </TouchableOpacity>
        </View>

        {/* Review List */}
        <View style={styles.listContainer}>
          {loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color="#1E3A8A" />
              <Text style={styles.emptyStateText}>Loading requests…</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyState}>
              <Ionicons name="alert-circle-outline" size={48} color="#DC2626" />
              <Text style={[styles.emptyStateText, { color: '#DC2626' }]}>{error}</Text>
            </View>
          ) : requests.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-circle-outline" size={48} color="#CBD5E0" />
              <Text style={styles.emptyStateText}>No pending requests</Text>
            </View>
          ) : (
            requests.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.listItem}
                activeOpacity={0.7}
                onPress={() => handleRequestPress(item)}
              >
                {/* Avatar */}
                <View style={[styles.avatar, { backgroundColor: item.color }]}>
                  <Text style={styles.avatarText}>{item.initials}</Text>
                </View>

                {/* Details */}
                <View style={styles.listItemDetails}>
                  <Text style={styles.listItemName}>{item.name}</Text>
                  <Text style={styles.listItemReason}>{item.reason}</Text>
                  <Text style={styles.listItemDate}>{item.date}</Text>
                </View>

                {/* Status Badge & Arrow */}
                <View style={styles.listItemRight}>
                  <View
                    style={[
                      styles.badge,
                      item.status === 'APPROVED' && styles.badgeApproved,
                      item.status === 'DECLINED' && styles.badgeDeclined,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        item.status === 'APPROVED' && styles.badgeTextApproved,
                        item.status === 'DECLINED' && styles.badgeTextDeclined,
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#A0AEC0" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Footer Note */}
        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>
            *Reviewing these requests ensures the iCenter remains adequately staffed during academic peak periods.
          </Text>
        </View>

      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="grid-outline" size={22} color="#1E3A8A" />
          <Text style={styles.navTextActive}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/supRequest')}>
          <View style={styles.navIconContainer}>
            <Ionicons name="document-text-outline" size={22} color="#A0AEC0" />
            <View style={styles.navBadge}>
              <Text style={styles.navBadgeText}>1</Text>
            </View>
          </View>
          <Text style={styles.navText}>Requests</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/supCal')}>
          <Ionicons name="calendar-outline" size={24} color="#6B7280" />
          <Text style={styles.navText}>Calendar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/supReport')}>
          <Ionicons name="bar-chart-outline" size={22} color="#A0AEC0" />
          <Text style={styles.navText}>Reports</Text>
        </TouchableOpacity>
      </View>

      {/* --- REQUEST DETAILS MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {selectedRequest && (
              <>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderLeft}>
                    <View
                      style={[
                        styles.modalAvatar,
                        { backgroundColor: selectedRequest.avatarColor },
                      ]}
                    >
                      <Text style={styles.modalAvatarText}>{selectedRequest.initials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalName} numberOfLines={1}>
                        {selectedRequest.name}
                      </Text>
                      <Text style={styles.modalStudentId}>
                        {selectedRequest.studentId}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                    <Ionicons name="close-circle" size={28} color="#A0AEC0" />
                  </TouchableOpacity>
                </View>

                {/* Type Badge + Status */}
                <View style={styles.badgeRow}>
                  <View style={styles.typeBadge}>
                    <Ionicons
                      name={
                        selectedRequest.type === 'LEAVE'
                          ? 'calendar-clear-outline'
                          : 'swap-horizontal-outline'
                      }
                      size={13}
                      color="#1E3A8A"
                      style={{ marginRight: 5 }}
                    />
                    <Text style={styles.typeBadgeText}>{selectedRequest.type}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      selectedRequest.status === 'APPROVED' && styles.statusPillApproved,
                      selectedRequest.status === 'DECLINED' && styles.statusPillDeclined,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        selectedRequest.status === 'APPROVED' &&
                          styles.statusPillTextApproved,
                        selectedRequest.status === 'DECLINED' &&
                          styles.statusPillTextDeclined,
                      ]}
                    >
                      {selectedRequest.status}
                    </Text>
                  </View>
                </View>

                {/* Info Rows */}
                <View style={styles.infoSection}>
                  <View style={styles.infoRow}>
                    <Ionicons name="mail-outline" size={16} color="#718096" />
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue} numberOfLines={1}>
                      {selectedRequest.email}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={16} color="#718096" />
                    <Text style={styles.infoLabel}>Period</Text>
                    <Text style={styles.infoValue} numberOfLines={1}>
                      {selectedRequest.period}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons name="hourglass-outline" size={16} color="#718096" />
                    <Text style={styles.infoLabel}>Duration</Text>
                    <Text style={styles.infoValue}>{selectedRequest.duration}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons name="pricetag-outline" size={16} color="#718096" />
                    <Text style={styles.infoLabel}>Reason</Text>
                    <Text style={styles.infoValue}>{selectedRequest.reason}</Text>
                  </View>
                </View>

                {/* Description */}
                <Text style={styles.descriptionTitle}>Description</Text>
                <ScrollView style={styles.descriptionScroll} showsVerticalScrollIndicator={false}>
                  <Text style={styles.descriptionText}>{selectedRequest.description}</Text>
                </ScrollView>

                {/* Actions - only show if still pending */}
                {selectedRequest.status === 'PENDING' ? (
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.declineButton}
                      onPress={() => handleDecision(selectedRequest.id, 'DECLINED')}
                    >
                      <Ionicons name="close-circle-outline" size={18} color="#DC2626" style={{ marginRight: 6 }} />
                      <Text style={styles.declineButtonText}>Decline</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={() => handleDecision(selectedRequest.id, 'APPROVED')}
                    >
                      <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setIsModalVisible(false)}
                  >
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

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
  iconContainer: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  headerTextContainer: {
    justifyContent: 'center',
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
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 16,
  },
  // --- Content ---
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
  },
  // --- Stats Grid ---
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#718096',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A202C',
  },
  // --- Section Header ---
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: 0.5,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  // --- List ---
  listContainer: {
    marginBottom: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B46C1',
  },
  listItemDetails: {
    flex: 1,
  },
  listItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 2,
  },
  listItemReason: {
    fontSize: 12,
    color: '#4A5568',
    marginBottom: 2,
  },
  listItemDate: {
    fontSize: 11,
    color: '#A0AEC0',
  },
  listItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    borderWidth: 1,
    borderColor: '#1E3A8A',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  badgeApproved: {
    borderColor: '#16A34A',
  },
  badgeDeclined: {
    borderColor: '#DC2626',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1E3A8A',
    letterSpacing: 0.5,
  },
  badgeTextApproved: {
    color: '#16A34A',
  },
  badgeTextDeclined: {
    color: '#DC2626',
  },
  // --- Empty State ---
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#A0AEC0',
    marginTop: 10,
    fontStyle: 'italic',
  },
  // --- Footer Note ---
  footerNote: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    padding: 16,
    marginTop: 10,
  },
  footerNoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#2D3748',
    textAlign: 'center',
    lineHeight: 18,
  },
  // --- Bottom Navigation ---
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 10,
    paddingBottom: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconContainer: {
    position: 'relative',
  },
  navText: {
    fontSize: 10,
    color: '#A0AEC0',
    marginTop: 4,
    fontWeight: '600',
  },
  navTextActive: {
    fontSize: 10,
    color: '#1E3A8A',
    marginTop: 4,
    fontWeight: '700',
  },
  navBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#E53E3E',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },

  // --- Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  modalAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 2,
  },
  modalStudentId: {
    fontSize: 11,
    color: '#718096',
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Badge Row
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 8,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: 0.5,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
  },
  statusPillApproved: {
    backgroundColor: '#DCFCE7',
  },
  statusPillDeclined: {
    backgroundColor: '#FEE2E2',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  statusPillTextApproved: {
    color: '#16A34A',
  },
  statusPillTextDeclined: {
    color: '#DC2626',
  },

  // Info Section
  infoSection: {
    backgroundColor: '#F7FAFC',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#718096',
    marginLeft: 8,
    width: 70,
  },
  infoValue: {
    flex: 1,
    fontSize: 12,
    color: '#1A202C',
    fontWeight: '600',
    textAlign: 'right',
  },

  // Description
  descriptionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  descriptionScroll: {
    maxHeight: 120,
    marginBottom: 18,
  },
  descriptionText: {
    fontSize: 13,
    color: '#4A5568',
    lineHeight: 20,
  },

  // Modal Actions
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#16A34A',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    backgroundColor: '#EDF2F7',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A5568',
  },
});