// src/app/supNotif.jsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import logoImg from "@/assets/images/logo.png";

// ---------------- DUMMY NOTIFICATION DATA ----------------
const initialNotifications = [
  {
    id: 1,
    sender: 'EasyEquities',
    subject: 'Reminder: banking details',
    preview: 'Before you get back to being the CEO of inve...',
    fullMessage: 'H so our info.\n\nRegards,\nThe EasyEquities Team',
    date: '28 Sept',
    avatarColor: '#E0E7FF',
    avatarText: 'E',
    unread: true,
    type: 'report',
  },
  {
    id: 2,
    sender: 'ChatGPT',
    subject: 'Check your route before you go',
    preview: 'A simple plan with things to double-ch...',
    fullMessage: 'Hey  StudentAssist portal\n• Bring your student ID card\n• Report any absence at least 2 hours in advance\n\nSafe travels!\nChatGPT',
    date: '28 Sept',
    avatarColor: '#10A37F',
    avatarText: 'C',
    unread: true,
    type: 'calendar',
  },
  {
    id: 3,
    sender: 'Forage',
    subject: 'Forage / Sibekezelo',
    preview: 'Our job is to help you use your experience in the Del...',
    fullMessage: 'Hell.\n\nYou have been shortlisted for the upcoming weekend workshop. Please confirm your attendance by replying to this notification.\n\nBest,\nForage Team',
    date: '27 Sept',
    avatarColor: '#F3E8FF',
    avatarText: 'F',
    unread: true,
    type: 'request',
  },
  {
    id: 4,
    sender: 'Grok',
    subject: 'Talk it through in Voice',
    preview: 'Out loud, in real time, in the same conversation...',
    fullMessage: 'Quick ng a shift handover, give it a try.\n\n– Grok',
    date: '25 Sept',
    avatarColor: '#000000',
    avatarText: 'G',
    unread: false,
    type: 'request',
  },
  {
    id: 5,
    sender: 'ChatGPT',
    subject: 'Look what you can do now',
    preview: 'Fresh ways to create, think out loud, and exp...',
    fullMessage: 'Hi,\nFresh ways to create, think out loud, and explore are here. Try the new capabilities in your workflow today.\n\n– ChatGPT',
    date: '23 Sept',
    avatarColor: '#10A37F',
    avatarText: 'C',
    unread: false,
    type: 'report',
  },
  {
    id: 6,
    sender: 'EasyEquities',
    subject: 'We need some more info from you SIBEKEZELO',
    preview: 'You\'ve recently sold o...',
    fullMessage: 'Hi  verify your ID and address in the app.\n\nRegards,\nEasyEquities',
    date: '23 Sept',
    avatarColor: '#E0E7FF',
    avatarText: 'E',
    unread: false,
    type: 'request',
  },
  {
    id: 7,
    sender: 'Forage',
    subject: 'Build skills that will get you hired',
    preview: 'As a Forager, you\'ll stand out when a...',
    fullMessage: 'As current simulation to unlock the certificate.\n\n– Forage',
    date: '22 Sept',
    avatarColor: '#F3E8FF',
    avatarText: 'F',
    unread: false,
    type: 'calendar',
  },
  {
    id: 8,
    sender: 'Forage',
    subject: 'Welcome to the Deloitte Australia Data Analytics job simulation',
    preview: 'You\'r...',
    fullMessage: 'Welcome earn a badge to add to your LinkedIn profile.\n\n– Forage',
    date: '20 Sept',
    avatarColor: '#F3E8FF',
    avatarText: 'F',
    unread: false,
    type: 'report',
  },
  {
    id: 9,
    sender: 'Forage',
    subject: 'Welcome to Forage!',
    preview: 'Explore job simulations to learn the skills you need t...',
    fullMessage: 'Welcome  your dream internship. Start with any company you like.\n\n– The Forage Team',
    date: '20 Sept',
    avatarColor: '#F3E8FF',
    avatarText: 'F',
    unread: false,
    type: 'request',
  },
  {
    id: 10,
    sender: 'Spotify',
    subject: 'Enjoy RO for 3 months of Spotify Premium',
    preview: 'Treat your ears to ad-free m...',
    fullMessage: 'Treat your ears to ad-free music with 3 months of Spotify Premium. Offer valid for students only.\n\n– Spotify',
    date: '18 Sept',
    avatarColor: '#1DB954',
    avatarText: 'S',
    unread: false,
    type: 'calendar',
  },
  {
    id: 11,
    sender: 'GitHub',
    subject: '[GitHub] A first-party GitHub OAuth application has been added to y...',
    preview: '',
    fullMessage: 'A first-party GitHub OAuth application has been added to your account. If this was not you, please revoke access immediately from Settings > Applications.\n\n– GitHub',
    date: '17 Sept',
    avatarColor: '#24292E',
    avatarText: 'G',
    unread: false,
    type: 'report',
  },
  {
    id: 13,
    sender: 'EasyEquities',
    subject: 'Follow Up Important Notice: Security Incident',
    preview: '',
    fullMessage: 'This is a follow-up to our earlier notice about a security incident. Please change your password and enable 2FA immediately.\n\n– EasyEquities Security',
    date: '16 Sept',
    avatarColor: '#E0E7FF',
    avatarText: 'E',
    unread: false,
    type: 'report',
    hasActions: true,
  },
  {
    id: 14,
    sender: 'Thabang Maangoato',
    subject: 'ptjoker invited you to ptjoker/absence-leave-tracking-system',
    preview: '',
    fullMessage: 'Hey Sibekezelo,\n\nptjoker invited you to collaborate on the GitHub repository ptjoker/absence-leave-tracking-system. Accept the invitation to view commits and contribute.\n\n– GitHub',
    date: '16 Sept',
    avatarColor: '#8B5CF6',
    avatarText: 'T',
    unread: false,
    type: 'request',
    hasActions: true,
  },
  {
    id: 15,
    sender: 'Google',
    subject: 'Security alert for sphem065@gmail.com',
    preview: 'This is a copy of a security al...',
    fullMessage: 'This is a copy of a security alert sent to sphem065@gmail.com. A new sign-in was detected on a Windows device. If this was not you, secure your account immediately.\n\n– Google',
    date: '14 Sept',
    avatarColor: '#EA4335',
    avatarText: 'G',
    unread: false,
    type: 'calendar',
  },
  {
    id: 16,
    sender: 'Compliance Team',
    subject: 'Important Notice: Cyber Security Incident: Potential Compromise of Your Account',
    preview: '',
    fullMessage: 'Our compliance team has detected suspicious activity on your account. Please reset your password and review your recent activity.\n\n– Compliance Team',
    date: '12 Sept',
    avatarColor: '#DC2626',
    avatarText: 'C',
    unread: false,
    type: 'report',
  },
  {
    id: 17,
    sender: 'Amazon Web Services',
    subject: 'Sibekezelo! You just earned a badge from Amazon Web Services Training',
    preview: '',
    fullMessage: 'Congratulations Sibekezelo! You just earned a badge from Amazon Web Services Training. Add it to your LinkedIn profile and show off your new skills.\n\n– AWS Training',
    date: '12 Sept',
    avatarColor: '#FF9900',
    avatarText: 'A',
    unread: false,
    type: 'request',
  },
];

// Helper: Type label + color
const getTypeInfo = (type) => {
  switch (type) {
    case 'request':
      return { label: 'REQUEST', color: '#2563EB', bg: '#DBEAFE', icon: 'document-text' };
    case 'report':
      return { label: 'REPORT', color: '#16A34A', bg: '#DCFCE7', icon: 'bar-chart' };
    case 'calendar':
      return { label: 'CALENDAR', color: '#B45309', bg: '#FEF3C7', icon: 'calendar' };
    default:
      return { label: 'NOTIFICATION', color: '#4A5568', bg: '#EDF2F7', icon: 'notifications' };
  }
};

// ---------------- COMPONENTS ----------------
const NotificationRow = ({ item, onPress, isSelected, onToggleSelect, onDeleteSingle }) => (
  <TouchableOpacity
    style={[styles.row, isSelected && styles.rowSelected]}
    onPress={() => onPress(item)}
    activeOpacity={0.6}
  >
    {/* Checkbox */}
    <TouchableOpacity
      style={styles.checkboxContainer}
      onPress={() => onToggleSelect(item.id)}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons
        name={isSelected ? 'checkbox' : 'square-outline'}
        size={20}
        color={isSelected ? '#1E3A8A' : '#A0AEC0'}
      />
    </TouchableOpacity>

    {/* Star */}
    <TouchableOpacity style={styles.starContainer}>
      <Ionicons name="star-outline" size={20} color="#A0AEC0" />
    </TouchableOpacity>

    {/* Avatar */}
    <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
      <Text style={styles.avatarText}>{item.avatarText}</Text>
    </View>

    {/* Content */}
    <View style={styles.contentContainer}>
      <View style={styles.contentTopRow}>
        <Text style={[styles.senderName, item.unread && styles.unreadText]} numberOfLines={1}>
          {item.sender}
        </Text>
        <Text style={[styles.subjectText, item.unread && styles.unreadText]} numberOfLines={1}>
          {item.subject}
        </Text>
      </View>
      <Text style={styles.previewText} numberOfLines={1}>
        {item.preview}
      </Text>
    </View>

    {/* Delete icon for selected row */}
    {isSelected ? (
      <TouchableOpacity
        style={styles.deleteIconButton}
        onPress={() => onDeleteSingle(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="trash-outline" size={20} color="#DC2626" />
      </TouchableOpacity>
    ) : (
      item.hasActions && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionIcon}>
            <Ionicons name="mail-outline" size={18} color="#718096" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionIcon}
            onPress={() => onDeleteSingle(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color="#718096" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}>
            <Ionicons name="archive-outline" size={18} color="#718096" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}>
            <Ionicons name="time-outline" size={18} color="#718096" />
          </TouchableOpacity>
        </View>
      )
    )}

    {/* Date */}
    <Text style={styles.dateText}>{item.date}</Text>
  </TouchableOpacity>
);

// ---------------- MAIN COMPONENT ----------------
export default function SupervisorNotifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // ✅ NEW: Track selected (checkbox) notification ids
  const [selectedIds, setSelectedIds] = useState([]);

  // ✅ NEW: Functional back navigation
  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/supervisorDash');
    }
  };

  // ✅ NEW: Toggle a single notification's selected state
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ✅ NEW: Select all / deselect all
  const toggleSelectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map((n) => n.id));
    }
  };

  // ✅ NEW: Delete a single notification (works from row trash icon or selected state)
  const deleteSingle = (id) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
            setSelectedIds((prev) => prev.filter((x) => x !== id));
          },
        },
      ]
    );
  };

  // ✅ NEW: Delete all selected notifications
  const deleteSelected = () => {
    const count = selectedIds.length;
    Alert.alert(
      'Delete Notifications',
      `Are you sure you want to delete ${count} notification${count > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setNotifications((prev) => prev.filter((n) => !selectedIds.includes(n.id)));
            setSelectedIds([]);
          },
        },
      ]
    );
  };

  const handleNotificationPress = (notification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, unread: false } : n))
    );
    setSelectedNotification(notification);
    setIsModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="chevron-back-outline" size={24} color="#1A202C" />
          </TouchableOpacity>
          <Image source={logoImg} style={styles.iconContainer} resizeMode="contain" />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              {selectedIds.length > 0
                ? `${selectedIds.length} Selected`
                : 'Notifications'}
            </Text>
            <Text style={styles.headerSubtitle}>STUDENT ASSISTANCE</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {/* ✅ Select All / Deselect All toggle */}
          <TouchableOpacity style={styles.iconButton} onPress={toggleSelectAll}>
            <Ionicons
              name={selectedIds.length === notifications.length ? 'checkbox' : 'checkmark-circle-outline'}
              size={22}
              color="#1E3A8A"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="search-outline" size={22} color="#1E3A8A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/logOut')}>
            <Ionicons name="log-out-outline" size={22} color="#1E3A8A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Notification List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={60} color="#CBD5E0" />
            <Text style={styles.emptyText}>No notifications</Text>
          </View>
        ) : (
          notifications.map((item) => (
            <NotificationRow
              key={item.id}
              item={item}
              isSelected={selectedIds.includes(item.id)}
              onToggleSelect={toggleSelect}
              onDeleteSingle={deleteSingle}
              onPress={handleNotificationPress}
            />
          ))
        )}
      </ScrollView>

      {/* Footer Note OR Delete Action Bar */}
      {selectedIds.length > 0 ? (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.actionBarButton}
            onPress={() => setSelectedIds([])}
          >
            <Ionicons name="close-outline" size={20} color="#4A5568" />
            <Text style={styles.actionBarButtonText}>Cancel</Text>
          </TouchableOpacity>

          <Text style={styles.actionBarCount}>
            {selectedIds.length} selected
          </Text>

          <TouchableOpacity
            style={[styles.actionBarButton, styles.actionBarDelete]}
            onPress={deleteSelected}
          >
            <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionBarDeleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.footerNote}>
          <Ionicons name="information-circle-outline" size={16} color="#A0AEC0" style={{ marginRight: 8, marginTop: 2 }} />
          <Text style={styles.footerNoteText}>
            Notifications include student requests, submitted reports, and academic calendar updates.
          </Text>
        </View>
      )}

      {/* --- NOTIFICATION DETAILS MODAL --- */}
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
            {selectedNotification && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderLeft}>
                    <View style={[styles.modalAvatar, { backgroundColor: selectedNotification.avatarColor }]}>
                      <Text style={styles.modalAvatarText}>{selectedNotification.avatarText}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalSender} numberOfLines={1}>
                        {selectedNotification.sender}
                      </Text>
                      <Text style={styles.modalDate}>
                        {selectedNotification.date || 'Recently'} • {getTypeInfo(selectedNotification.type).label}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                    <Ionicons name="close-circle" size={28} color="#A0AEC0" />
                  </TouchableOpacity>
                </View>

                <View style={styles.typeBadgeWrapper}>
                  <View
                    style={[
                      styles.typeBadge,
                      { backgroundColor: getTypeInfo(selectedNotification.type).bg },
                    ]}
                  >
                    <Ionicons
                      name={getTypeInfo(selectedNotification.type).icon}
                      size={14}
                      color={getTypeInfo(selectedNotification.type).color}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.typeBadgeText,
                        { color: getTypeInfo(selectedNotification.type).color },
                      ]}
                    >
                      {getTypeInfo(selectedNotification.type).label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.modalSubject}>{selectedNotification.subject}</Text>

                <View style={styles.divider} />

                <ScrollView style={styles.messageScroll} showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalMessage}>
                    {selectedNotification.fullMessage ||
                      selectedNotification.preview ||
                      'No message content available.'}
                  </Text>
                </ScrollView>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalSecondaryBtn}
                    onPress={() => setIsModalVisible(false)}
                  >
                    <Ionicons name="close-outline" size={18} color="#4A5568" style={{ marginRight: 6 }} />
                    <Text style={styles.modalSecondaryText}>Close</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalPrimaryBtn}
                    onPress={() => setIsModalVisible(false)}
                  >
                    <Ionicons name="checkmark-done-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.modalPrimaryText}>Mark as Handled</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7FAFC' },

  // --- Header ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backButton: { marginRight: 8 },
  iconContainer: { width: 32, height: 32, marginRight: 10 },
  headerTextContainer: { justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A202C' },
  headerSubtitle: { fontSize: 9, fontWeight: '600', color: '#718096', letterSpacing: 1, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { marginLeft: 16 },

  // --- Notification List ---
  scrollContent: { paddingBottom: 60 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  rowSelected: {
    backgroundColor: '#EFF6FF', // Highlight selected row
  },
  checkboxContainer: { marginRight: 8 },
  starContainer: { marginRight: 8 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  contentContainer: { flex: 1, marginRight: 8 },
  contentTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  senderName: { fontSize: 13, fontWeight: '600', color: '#1A202C', marginRight: 6, flexShrink: 1 },
  subjectText: { fontSize: 13, fontWeight: '600', color: '#1A202C', flexShrink: 1 },
  unreadText: { fontWeight: '800', color: '#000000' },
  previewText: { fontSize: 12, color: '#718096' },
  actionsContainer: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  actionIcon: { marginLeft: 8 },
  deleteIconButton: {
    padding: 6,
    marginRight: 4,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  dateText: { fontSize: 12, color: '#718096', fontWeight: '500', minWidth: 50, textAlign: 'right' },

  // --- Empty State ---
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 14,
    color: '#A0AEC0',
    marginTop: 12,
    fontWeight: '600',
  },

  // --- Footer Note ---
  footerNote: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'flex-start',
  },
  footerNoteText: { flex: 1, fontSize: 11, color: '#718096', lineHeight: 16 },

  // --- Delete Action Bar (appears when items are selected) ---
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1E3A8A',
    borderTopWidth: 1,
    borderTopColor: '#0F1F3D',
    paddingBottom: Platform.OS === 'ios' ? 25 : 12,
  },
  actionBarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  actionBarButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  actionBarCount: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  actionBarDelete: {
    backgroundColor: '#DC2626',
  },
  actionBarDeleteText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
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
    maxHeight: '85%',
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
    marginBottom: 16,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  modalAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalSender: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 2,
  },
  modalDate: {
    fontSize: 11,
    color: '#718096',
    fontWeight: '500',
  },

  typeBadgeWrapper: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  modalSubject: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A202C',
    lineHeight: 24,
    marginBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 14,
  },

  messageScroll: {
    maxHeight: 260,
    marginBottom: 20,
  },
  modalMessage: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 22,
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#EDF2F7',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  modalSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A5568',
  },
  modalPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  modalPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
