// src/app/home.jsx (or dashboard.jsx, wherever you want this page)
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();

  // Mock data for recent requests
  const recentRequests = [
    { id: '1', code: 'REQ-001', type: 'Medical Leave', status: 'Approved', avatar: 'NM' },
    { id: '2', code: 'REQ-001', type: 'Medical Leave', status: 'Approved', avatar: 'NM' },
    { id: '3', code: 'REQ-003', type: 'Sick Leave', status: 'Pending', avatar: 'NM' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Ionicons name="calendar" size={18} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>StudentAssist</Text>
            <Text style={styles.headerSubtitle}>ABSENCE TRACKER</Text>
          </View>
        </View>
        
        {/* Right side icons - Notice there is NO back arrow here */}
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={24} color="#1E4E8C" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon} onPress={() => router.replace('/')}>
            <Ionicons name="log-out-outline" size={24} color="#1E4E8C" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTextContainer}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>STUDENT PORTAL</Text>
            </View>
            <Text style={styles.heroTitle}>Welcome back,</Text>
            <Text style={styles.heroTitle}>Nicholas</Text>
            <Text style={styles.heroSubtitle}>
              Manage leave requests and track student attendance metrics.
            </Text>
          </View>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1000&auto=format&fit=crop' }} 
            style={styles.heroImage} 
          />
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="search-outline" size={18} color="#4B5563" />
            <Text style={styles.actionButtonText}>Search</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.bellContainer}>
              <Ionicons name="notifications-outline" size={18} color="#4B5563" />
              <View style={styles.notificationDot} />
            </View>
            <Text style={styles.actionButtonText}>Alerts</Text>
          </TouchableOpacity>
        </View>

        {/* At a Glance Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>AT A GLANCE</Text>
          <TouchableOpacity>
            <Text style={styles.sectionLink}>VIEW HISTORY</Text>
          </TouchableOpacity>
        </View>

        {/* Performance Card */}
        <View style={styles.performanceCard}>
          <View style={styles.performanceLeft}>
            <View style={styles.performanceLabelRow}>
              <Ionicons name="trending-up" size={16} color="#D97706" />
              <Text style={styles.performanceLabel}>PERFORMANCE</Text>
            </View>
            <Text style={styles.performanceValue}>94%</Text>
            <Text style={styles.performanceSub}>Semester Attendance Rate</Text>
          </View>
          {/* Circular Progress Placeholder */}
          <View style={styles.circularProgress}>
            <View style={styles.circularProgressInner} />
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {/* Pending Card */}
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="time-outline" size={20} color="#2563EB" />
            </View>
            <View style={styles.statBadge}>
              <Text style={styles.statBadgeText}>+12%</Text>
            </View>
            <Text style={styles.statLabel}>PENDING</Text>
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>REQ-03</Text>
              <Text style={styles.statSubValue}>New</Text>
            </View>
          </View>

          {/* Approved Card */}
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#2563EB" />
            </View>
            <Text style={styles.statLabel}>APPROVED</Text>
            <Text style={styles.statValue}>12</Text>
          </View>
        </View>

        {/* Recent Requests Card */}
        <View style={styles.recentRequestsCard}>
          <View style={styles.recentHeader}>
            <View style={styles.recentHeaderLeft}>
              <Ionicons name="document-text-outline" size={20} color="#1E4E8C" />
              <Text style={styles.recentTitle}>Recent Requests</Text>
            </View>
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>3 NEW</Text>
            </View>
          </View>
          <Text style={styles.recentSubtitle}>Latest submissions from your department.</Text>

          {/* Request List */}
          <View style={styles.requestList}>
            {recentRequests.map((item, index) => (
              <View key={item.id} style={[styles.requestItem, index !== recentRequests.length - 1 && styles.requestItemBorder]}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.avatar}</Text>
                </View>
                <View style={styles.requestInfo}>
                  <Text style={styles.requestCode}>{item.code}</Text>
                  <Text style={styles.requestType}>{item.type}</Text>
                </View>
                <View style={[styles.statusBadge, item.status === 'Approved' ? styles.statusApproved : styles.statusPending]}>
                  <Text style={[styles.statusText, item.status === 'Approved' ? styles.statusTextApproved : styles.statusTextPending]}>
                    {item.status}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" style={styles.requestArrow} />
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.seeAllButton}>
            <Text style={styles.seeAllText}>SEE ALL ACTIVITY</Text>
          </TouchableOpacity>
        </View>

        {/* Academic Integrity Footer */}
        <View style={styles.footerContainer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>ACADEMIC INTEGRITY</Text>
          <View style={styles.footerLine} />
        </View>

      </ScrollView>

      {/* Bottom Tab Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="grid" size={24} color="#2563EB" />
          <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navIconContainer}>
            <Ionicons name="clipboard-outline" size={24} color="#6B7280" />
            <View style={styles.navRedDot} />
          </View>
          <Text style={styles.navText}>Requests</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="people-outline" size={24} color="#6B7280" />
          <Text style={styles.navText}>Account</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="calendar-outline" size={24} color="#6B7280" />
          <Text style={styles.navText}>Schedule</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#A0C1DD',
  },
  // --- Header ---
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    backgroundColor: '#2563EB',
    padding: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginLeft: 15,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  // --- Hero Banner ---
  heroBanner: {
    flexDirection: 'row',
    backgroundColor: '#1E4E8C',
    borderRadius: 16,
    marginTop: 20,
    overflow: 'hidden',
    height: 160,
  },
  heroTextContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  heroBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
  heroSubtitle: {
    color: '#A9C1D9',
    fontSize: 11,
    marginTop: 6,
    lineHeight: 16,
  },
  heroImage: {
    width: '40%',
    height: '100%',
  },
  // --- Quick Actions ---
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    marginHorizontal: 5,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginLeft: 8,
  },
  bellContainer: {
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  // --- At a Glance Section ---
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E4E8C',
    letterSpacing: 1,
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  // --- Performance Card ---
  performanceCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  performanceLeft: {
    flex: 1,
  },
  performanceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  performanceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginLeft: 6,
    letterSpacing: 1,
  },
  performanceValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#111827',
  },
  performanceSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  circularProgress: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 6,
    borderColor: '#FDE047', // Yellow
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularProgressInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
  },
  // --- Stats Row ---
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 0.48,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  statSubValue: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  // --- Recent Requests ---
  recentRequestsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  recentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
  },
  newBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  recentSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 20,
  },
  requestList: {
    marginBottom: 10,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  requestItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6D28D9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  requestInfo: {
    flex: 1,
  },
  requestCode: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  requestType: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 10,
  },
  statusApproved: {
    backgroundColor: '#DCFCE7',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextApproved: {
    color: '#16A34A',
  },
  statusTextPending: {
    color: '#D97706',
  },
  requestArrow: {
    marginLeft: 5,
  },
  seeAllButton: {
    alignItems: 'center',
    paddingTop: 10,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E4E8C',
    letterSpacing: 1,
  },
  // --- Footer ---
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  footerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#9CA3AF',
    opacity: 0.3,
  },
  footerText: {
    marginHorizontal: 10,
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 1,
  },
  // --- Bottom Navigation ---
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  navText: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
  },
  navTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  navIconContainer: {
    position: 'relative',
  },
  navRedDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
});