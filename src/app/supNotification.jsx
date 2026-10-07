// src/app/supNotif.jsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import logoImg from '@/assets/images/logo.png';
import { apiFetch } from '@/lib/api';

function formatDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return String(iso);
  }
}

const NotificationCard = ({ item, onPress }) => (
  <TouchableOpacity
    style={styles.card}
    onPress={() => onPress(item)}
    activeOpacity={0.7}
  >
    <View style={styles.cardHeader}>
      <View style={styles.cardHeaderLeft}>
        <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
          <Text style={styles.avatarText}>{item.initials}</Text>
        </View>
        <Text style={styles.studentName}>{item.name}</Text>
      </View>
      <View style={styles.typeBadge}>
        <Text style={styles.typeBadgeText}>{item.type}</Text>
      </View>
    </View>

    <View style={styles.divider} />

    <View style={styles.cardBody}>
      <Text style={styles.requestText} numberOfLines={2}>
        {item.reason}
      </Text>
    </View>

    <View style={styles.metaRow}>
      <View style={styles.dateContainer}>
        <Ionicons name="calendar-outline" size={16} color="#718096" style={styles.metaIcon} />
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

export default function SupervisorNotifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const loadNotifications = async () => {
    try {
      const res = await apiFetch('/api/requests');
      const data = await res.json();

      if (!res.ok) {
        Alert.alert('Error', data.error || 'Could not load notifications.');
        return;
      }

      const formatted = data
        .slice()
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 20)
        .map((r) => ({
          id: r.rawId || r.id,
          name: r.name || 'Unknown',
          initials: r.initials || '?',
          avatarColor: '#A78BFA',
          type: r.type || 'REQUEST',
          reason: r.reason || r.detail || 'No details provided.',
          date: formatDate(r.createdAt) || r.dateRange || 'Recently',
        }));

      setNotifications(formatted);
    } catch (err) {
      console.error('Load notifications error:', err);
      Alert.alert('Connection error', 'Could not reach the server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleBackPress = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/supervisorDash');
  };

  const handleNotificationPress = (notification) => {
    setSelectedNotification(notification);
    setIsModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="chevron-back-outline" size={24} color="#1A202C" />
          </TouchableOpacity>
          <Image source={logoImg} style={styles.iconContainerLogo} resizeMode="contain" />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSubtitle}>STUDENT ASSISTANCE</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="search-outline" size={22} color="#1E3A8A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/logOut')}>
            <Ionicons name="log-out-outline" size={22} color="#1E3A8A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && (
          <Text style={styles.emptyText}>Loading notifications…</Text>
        )}

        {!loading && notifications.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={60} color="#CBD5E0" />
            <Text style={styles.emptyText}>No notifications</Text>
          </View>
        )}

        {!loading && notifications.map((item) => (
          <NotificationCard
            key={item.id}
            item={item}
            onPress={handleNotificationPress}
          />
        ))}
      </ScrollView>

      <View style={styles.footerNote}>
        <Ionicons
          name="information-circle-outline"
          size={16}
          color="#A0AEC0"
          style={{ marginRight: 8, marginTop: 2 }}
        />
        <Text style={styles.footerNoteText}>
          Notifications include student requests, submitted reports, and academic calendar updates.
        </Text>
      </View>

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
                    <View
                      style={[
                        styles.modalAvatar,
                        { backgroundColor: selectedNotification.avatarColor },
                      ]}
                    >
                      <Text style={styles.modalAvatarText}>
                        {selectedNotification.initials}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalSender} numberOfLines={1}>
                        {selectedNotification.name}
                      </Text>
                      <Text style={styles.modalDate}>
                        {selectedNotification.type} • {selectedNotification.date}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                    <Ionicons name="close-circle" size={28} color="#A0AEC0" />
                  </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                <ScrollView style={styles.messageScroll} showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalMessage}>
                    {selectedNotification.reason}
                  </Text>
                </ScrollView>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalPrimaryBtn}
                    onPress={() => setIsModalVisible(false)}
                  >
                    <Ionicons
                      name="checkmark-done-outline"
                      size={18}
                      color="#FFFFFF"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.modalPrimaryText}>Close</Text>
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
  safeArea: { flex: 1, backgroundColor: '#F0F4F8' },
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
  iconContainerLogo: { width: 32, height: 32, marginRight: 10 },
  headerTextContainer: { justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A202C' },
  headerSubtitle: {
    fontSize: 9,
    fontWeight: '600',
    color: '#718096',
    letterSpacing: 1,
    marginTop: 2,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { marginLeft: 16 },
  scrollContent: { padding: 16, paddingBottom: 60 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  studentName: { fontSize: 15, fontWeight: '700', color: '#1A202C' },
  typeBadge: {
    backgroundColor: '#EDF2F7',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4A5568',
    letterSpacing: 0.5,
  },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginHorizontal: 16 },
  cardBody: { padding: 16 },
  requestText: { fontSize: 14, color: '#4A5568', lineHeight: 20 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  dateContainer: { flexDirection: 'row', alignItems: 'center' },
  metaIcon: { marginRight: 6 },
  dateText: { fontSize: 13, color: '#718096' },
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
    textAlign: 'center',
    paddingVertical: 20,
  },
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
  modalAvatarText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  modalSender: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 4,
  },
  modalDate: { fontSize: 12, color: '#718096', fontWeight: '500' },
  messageScroll: { maxHeight: 300, marginBottom: 24 },
  modalMessage: { fontSize: 14, color: '#4A5568', lineHeight: 22 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  modalPrimaryBtn: {
    flexDirection: 'row',
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  modalPrimaryText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});