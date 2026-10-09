import { useSupervisorTheme } from '@/contexts/SupervisorThemeContext';
import { apiFetch, getSession } from '@/lib/api';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Adjust the number of ../ based on where your assets folder actually is.
import LogoImg from '../../assets/images/logo.png';

// --- Theme Definitions ---
const THEME = {
  light: {
    primary: '#2563EB',
    darkBlue: '#1E3A8A',
    textMain: '#111827',
    textMuted: '#6B7280',
    bg: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E5E7EB',
    pendingBg: '#FEF3C7',
    pendingText: '#D97706',
    iconBg: '#EFF6FF',
    danger: '#EF4444',
    success: '#10B981',
    headerBg: '#FFFFFF',
    headerBorder: '#E2E8F0',
    headerTitle: '#1A202C',
    headerIcon: '#1E3A8A',
    navActive: '#2563EB',
    navInactive: '#A0AEC0',
    navText: '#6B7280',
    overlay: 'rgba(255, 255, 255, 0.7)',
    workflowBg: '#EFF6FF',
    filterBg: '#F3F4F6',
    downloadBg: '#DBEAFE',
    downloadIcon: '#2563EB',
    logApprovedBg: '#DCFCE7',
    logApprovedText: '#059669',
    logRejectedBg: '#FEE2E2',
    logRejectedText: '#DC2626',
    logViewedBg: '#DBEAFE',
    logViewedText: '#2563EB',
    logCreatedBg: '#FEF3C7',
    logCreatedText: '#D97706',
  },
  dark: {
    primary: '#3B82F6',
    darkBlue: '#93C5FD',
    textMain: '#F9FAFB',
    textMuted: '#9CA3AF',
    bg: '#0F172A',
    card: '#1E293B',
    border: '#334155',
    pendingBg: '#78350F',
    pendingText: '#FCD34D',
    iconBg: '#1E3A8A',
    danger: '#F87171',
    success: '#34D399',
    headerBg: '#1E293B',
    headerBorder: '#334155',
    headerTitle: '#F9FAFB',
    headerIcon: '#93C5FD',
    navActive: '#60A5FA',
    navInactive: '#64748B',
    navText: '#94A3B8',
    overlay: 'rgba(15, 23, 42, 0.85)',
    workflowBg: '#1E3A8A',
    filterBg: '#334155',
    downloadBg: '#1E3A8A',
    downloadIcon: '#93C5FD',
    logApprovedBg: '#064E3B',
    logApprovedText: '#6EE7B7',
    logRejectedBg: '#7F1D1D',
    logRejectedText: '#FCA5A5',
    logViewedBg: '#1E3A8A',
    logViewedText: '#93C5FD',
    logCreatedBg: '#78350F',
    logCreatedText: '#FCD34D',
  },
};

// --- Bottom Nav Items (Mapped to Pages) ---
const NAV_ITEMS = [
  { name: 'Dashboard',   icon: 'grid-outline',          path: '/supervisorDash' },
  { name: 'Calendar',    icon: 'calendar-outline',      path: '/supCal'         },
  { name: 'Requests',    icon: 'document-text-outline', path: '/supRequest' },
  { name: 'Assistances', icon: 'people-outline',        path: '/supAssistants'  },
  { name: 'Reports',     icon: 'bar-chart-outline',     path: '/supReport'      },
  { name: 'Profile',     icon: 'person-outline',        path: '/supProfile'     },
];

// --- Activity Filter Options ---
const ACTIVITY_FILTERS = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: '7days' },
  { label: 'Last 30 Days', value: '30days' },
  { label: 'All Time', value: 'all' },
];

// --- Mock Activity Logs Data ---
const MOCK_ACTIVITY_LOGS = [
  {
    id: 1,
    action: 'Approved',
    actionType: 'approved',
    description: 'Approved sick leave request for Peter Thomas',
    details: 'Oct 5, 2026 – Oct 5, 2026',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: 2,
    action: 'Rejected',
    actionType: 'rejected',
    description: 'Rejected day-off request for Nothando Nkosi',
    details: 'Sep 30, 2026 – Sep 30, 2026',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
  },
  {
    id: 3,
    action: 'Approved',
    actionType: 'approved',
    description: 'Approved personal leave for Sarah Nkosi',
    details: 'Oct 10, 2026 – Oct 12, 2026',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: 4,
    action: 'Viewed',
    actionType: 'viewed',
    description: 'Reviewed request history for Peter Thomas',
    details: '12 total requests reviewed',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
  },
  {
    id: 5,
    action: 'Created',
    actionType: 'created',
    description: 'Scheduled new shift for Sarah Nkosi',
    details: 'Morning Shift · 4 hours · Main Desk',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
  },
  {
    id: 6,
    action: 'Approved',
    actionType: 'approved',
    description: 'Approved medical leave for John Doe',
    details: 'Oct 1, 2026 – Oct 3, 2026',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
  },
  {
    id: 7,
    action: 'Rejected',
    actionType: 'rejected',
    description: 'Rejected swap request from Peter Thomas',
    details: 'No matching replacement available',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
  },
];

export default function SupervisorDashboard() {
  const { isDarkMode, toggleTheme } = useSupervisorTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // --- State for Activity Filter ---
  const [activityFilter, setActivityFilter] = useState('7days');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const theme = isDarkMode ? THEME.dark : THEME.light;
  const styles = useMemo(() => getStyles(theme), [isDarkMode]);

  const loadData = async () => {
    try {
      const [reqRes, asstRes] = await Promise.all([
        apiFetch('/api/requests'),
        apiFetch('/api/assistants'),
      ]);
      const [reqData, asstData] = await Promise.all([reqRes.json(), asstRes.json()]);

      if (reqRes.ok && Array.isArray(reqData)) {
        setRequests(reqData);
      } else if (reqData?.error) {
        console.warn('Requests load error:', reqData.error);
      }
      if (asstRes.ok && Array.isArray(asstData)) {
        setAssistants(asstData);
      } else if (asstData?.error) {
        console.warn('Assistants load error:', asstData.error);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
      Alert.alert('Connection error', 'Could not reach the server.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    getSession()
      .then((session) => {
        if (session?.user) setUser(session.user);
      })
      .catch((err) => {
        console.error('Session load error:', err);
      });
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // --- Filter Activity Logs Based on Selected Period ---
  const filteredActivityLogs = useMemo(() => {
    const now = new Date();
    const msPerDay = 1000 * 60 * 60 * 24;

    return MOCK_ACTIVITY_LOGS.filter((log) => {
      const diffDays = (now - log.timestamp) / msPerDay;
      switch (activityFilter) {
        case 'today':
          return diffDays < 1;
        case '7days':
          return diffDays <= 7;
        case '30days':
          return diffDays <= 30;
        case 'all':
        default:
          return true;
      }
    });
  }, [activityFilter]);

  // --- Get Label for Current Filter ---
  const currentFilterLabel = ACTIVITY_FILTERS.find((f) => f.value === activityFilter)?.label || 'Last 7 Days';

  // --- Format Timestamp for Display ---
  const formatTimestamp = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
  };

  // --- Get Badge Style Based on Action Type ---
  const getActionBadgeStyle = (actionType) => {
    switch (actionType) {
      case 'approved':
        return { bg: theme.logApprovedBg, text: theme.logApprovedText };
      case 'rejected':
        return { bg: theme.logRejectedBg, text: theme.logRejectedText };
      case 'viewed':
        return { bg: theme.logViewedBg, text: theme.logViewedText };
      case 'created':
        return { bg: theme.logCreatedBg, text: theme.logCreatedText };
      default:
        return { bg: theme.iconBg, text: theme.primary };
    }
  };

  // =============================================
  // DOWNLOAD ACTIVITY LOGS AS PDF (DIRECT DOWNLOAD)
  // =============================================
  const handleDownloadLogs = async () => {
    if (filteredActivityLogs.length === 0) {
      Alert.alert('No data', 'There are no logs to download for this period.');
      return;
    }

    setIsDownloading(true);

    // --- Build the HTML template ---
    const rowsHtml = filteredActivityLogs
      .map((log) => {
        const badge = getActionBadgeStyle(log.actionType);
        const dateStr = log.timestamp.toLocaleString('en-ZA', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        return `
          <tr>
            <td>
              <span style="
                display:inline-block;
                background:${badge.bg};
                color:${badge.text};
                padding:3px 8px;
                border-radius:4px;
                font-size:9px;
                font-weight:800;
                letter-spacing:0.5px;
              ">${log.action.toUpperCase()}</span>
            </td>
            <td>
              <div style="font-weight:600; color:#111827; font-size:12px;">${log.description}</div>
              <div style="color:#6B7280; font-size:11px; margin-top:3px;">${log.details}</div>
            </td>
            <td style="color:#6B7280; font-size:11px; text-align:right; white-space:nowrap;">${dateStr}</td>
          </tr>
        `;
      })
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Supervisor Activity Logs</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px 32px;
              color: #111827;
              background: #FFFFFF;
            }
            .header { margin-bottom: 28px; border-bottom: 3px solid #1E3A8A; padding-bottom: 16px; }
            .brand { color: #1E3A8A; font-size: 22px; font-weight: 800; margin: 0; }
            .brand-sub { color: #6B7280; font-size: 10px; letter-spacing: 2px; margin-top: 2px; }
            .title { color: #1E3A8A; font-size: 18px; font-weight: 700; margin: 20px 0 4px 0; }
            .meta { color: #6B7280; font-size: 12px; margin-bottom: 24px; }
            .meta strong { color: #2563EB; }
            table { width: 100%; border-collapse: collapse; }
            th {
              text-align: left;
              font-size: 10px;
              letter-spacing: 1px;
              color: #6B7280;
              border-bottom: 2px solid #E5E7EB;
              padding: 10px 8px;
              text-transform: uppercase;
            }
            td {
              padding: 12px 8px;
              border-bottom: 1px solid #E5E7EB;
              vertical-align: top;
            }
            .footer {
              margin-top: 32px;
              padding-top: 16px;
              border-top: 1px solid #E5E7EB;
              color: #9CA3AF;
              font-size: 10px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">iCenter</div>
            <div class="brand-sub">ABSENCE &amp; LEAVE TRACKER</div>
          </div>

          <div class="title">Supervisor Activity Logs</div>
          <div class="meta">
            Period: <strong>${currentFilterLabel}</strong> &nbsp;·&nbsp;
            ${filteredActivityLogs.length} ${filteredActivityLogs.length === 1 ? 'entry' : 'entries'} &nbsp;·&nbsp;
            Generated on ${new Date().toLocaleString('en-ZA')}
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:90px;">Action</th>
                <th>Description</th>
                <th style="width:140px; text-align:right;">Date &amp; Time</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            iCenter · Absence &amp; Leave Tracker · Confidential
          </div>
        </body>
      </html>
    `;

    // --- File name ---
    const fileName = `supervisor-activity-logs-${activityFilter}-${Date.now()}.pdf`;

    try {
      // ======================================
      // WEB: Direct PDF download (no print dialog)
      // ======================================
      if (Platform.OS === 'web') {
        try {
          // Dynamically import html2pdf.js (only loads on web)
          const html2pdfModule = await import('html2pdf.js');
          const html2pdf = html2pdfModule.default || html2pdfModule;

          // Create an off-screen container with the HTML
          const container = document.createElement('div');
          container.innerHTML = html;
          container.style.position = 'fixed';
          container.style.left = '-9999px';
          container.style.top = '0';
          container.style.width = '800px';
          container.style.background = '#FFFFFF';
          document.body.appendChild(container);

          // Generate and download the PDF
          await html2pdf()
            .set({
              margin: 0,
              filename: fileName,
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true, logging: false },
              jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
            })
            .from(container)
            .save();

          // Clean up
          document.body.removeChild(container);

          setIsDownloading(false);
          return;
        } catch (webErr) {
          console.error('Web PDF generation error:', webErr);
          Alert.alert('Download failed', 'Could not generate PDF. Please try again.');
          setIsDownloading(false);
          return;
        }
      }

      // ======================================
      // NATIVE: Generate PDF and auto-save
      // ======================================
      const { uri } = await Print.printToFileAsync({ html, base64: false });

      // ============ ANDROID ============
      if (Platform.OS === 'android') {
        try {
          const permissions =
            await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

          if (permissions.granted) {
            const base64 = await FileSystem.readAsStringAsync(uri, {
              encoding: FileSystem.EncodingType.Base64,
            });

            const newUri = await FileSystem.StorageAccessFramework.createFileAsync(
              permissions.directoryUri,
              fileName,
              'application/pdf'
            );

            await FileSystem.writeAsStringAsync(newUri, base64, {
              encoding: FileSystem.EncodingType.Base64,
            });

            Alert.alert(
              'PDF saved',
              `Your activity log has been saved as:\n\n${fileName}`,
              [{ text: 'OK' }]
            );
          } else {
            const fallbackUri = FileSystem.documentDirectory + fileName;
            await FileSystem.copyAsync({ from: uri, to: fallbackUri });
            Alert.alert(
              'PDF saved',
              `Saved to app storage:\n\n${fileName}`,
              [{ text: 'OK' }]
            );
          }
        } catch (androidErr) {
          console.error('Android save error:', androidErr);
          const fallbackUri = FileSystem.documentDirectory + fileName;
          await FileSystem.copyAsync({ from: uri, to: fallbackUri });
          Alert.alert('PDF saved', `Saved to app storage:\n\n${fileName}`);
        }
        setIsDownloading(false);
        return;
      }

      // ============ iOS ============
      if (Platform.OS === 'ios') {
        const targetUri = FileSystem.documentDirectory + fileName;
        await FileSystem.copyAsync({ from: uri, to: targetUri });
        Alert.alert(
          'PDF saved',
          `Your activity log has been saved to the app's Documents folder as:\n\n${fileName}`,
          [{ text: 'OK' }]
        );
        setIsDownloading(false);
        return;
      }

      setIsDownloading(false);
    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert(
        'Download failed',
        'Could not export activity logs as PDF. Please try again.'
      );
      setIsDownloading(false);
    }
  };

  const pendingCount = requests.filter((request) => request.status === 'Pending').length;
  const approvedCount = requests.filter((request) => request.status === 'Approved').length;
  const metrics = [
    { id: 1, title: 'PENDING APPROVALS', value: String(pendingCount), icon: 'clock' },
    { id: 2, title: 'APPROVED', value: String(approvedCount), icon: 'check-circle' },
    { id: 3, title: 'ASSISTANTS', value: String(assistants.length), icon: 'users' },
    { id: 4, title: 'TOTAL REQUESTS', value: String(requests.length), icon: 'clipboard' },
  ];
  const awaiting = requests.filter((request) => request.status === 'Pending').slice(0, 3);
  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : 'Supervisor';
  const displayRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : 'Supervisor';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1590&auto=format&fit=crop' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        {/* --- HEADER --- */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image source={LogoImg} style={styles.logoImage} resizeMode="contain" />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>iCenter</Text>
              <Text style={styles.headerSubtitle}>ABSENCE & LEAVE TRACKER</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton} onPress={toggleTheme}>
              <Feather
                name={isDarkMode ? 'sun' : 'moon'}
                size={22}
                color={theme.headerIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push('/supNotification')}
            >
              <Ionicons name="notifications-outline" size={22} color={theme.headerIcon} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push('/logOut')}
            >
              <Ionicons name="log-out-outline" size={22} color={theme.headerIcon} />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- MAIN CONTENT --- */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>SUPERVISOR PORTAL</Text>
            </View>
            <Text style={styles.heroTitle}>Supervisor dashboard</Text>
            <Text style={styles.heroSubtitle}>
              Welcome, {displayName} ({displayRole}). Monitor incoming student assistant requests and keep operational decisions synchronized.
            </Text>
          </View>

          {/* Metrics Grid */}
          <View style={styles.metricsGrid}>
            {metrics.map((item) => (
              <View key={item.id} style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricTitle}>{item.title}</Text>
                  <Feather name={item.icon} size={16} color={theme.primary} />
                </View>
                <Text style={styles.metricValue}>{item.value}</Text>
              </View>
            ))}
          </View>

          {/* Awaiting Review */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AWAITING YOUR REVIEW</Text>
            <TouchableOpacity onPress={() => router.push('/supRequest')}>
              <Text style={styles.viewAllText}>VIEW ALL</Text>
            </TouchableOpacity>
          </View>

          {awaiting.length > 0 ? awaiting.map((request) => (
            <View key={request.id || request.rawId || request.name} style={styles.requestCard}>
              <View style={styles.requestInfo}>
                <Text style={styles.requestName}>{request.name || 'Unknown'}</Text>
                <Text style={styles.requestDetails}>
                  {request.reason || request.detail || request.type || 'Leave request'}
                  {request.dateRange ? ` · ${request.dateRange}` : ''}
                </Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Pending</Text>
              </View>
            </View>
          )) : (
            <View style={styles.requestCard}>
              <View style={styles.requestInfo}>
                <Text style={styles.requestName}>No pending requests</Text>
                <Text style={styles.requestDetails}>New requests will appear here.</Text>
              </View>
            </View>
          )}

          {/* Operational Note */}
          <View style={styles.noteSection}>
            <Text style={styles.noteTitle}>Operational note</Text>
            <Text style={styles.noteDesc}>
              Approvals and rejections made from Operational Requests are written to the shared request store, so the student dashboard and history reflect the latest decision.
            </Text>
          </View>

          {/* SUPERVISOR ACTIVITY LOGS */}
          <View style={styles.activitySection}>
            <View style={styles.activityHeader}>
              <View style={styles.activityHeaderLeft}>
                <View style={styles.activityIconContainer}>
                  <Feather name="activity" size={16} color={theme.primary} />
                </View>
                <View>
                  <Text style={styles.activityTitle}>Activity Logs</Text>
                  <Text style={styles.activitySubtitle}>
                    {filteredActivityLogs.length} {filteredActivityLogs.length === 1 ? 'entry' : 'entries'} · {currentFilterLabel}
                  </Text>
                </View>
              </View>

              <View style={styles.activityActions}>
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={() => setIsFilterOpen(!isFilterOpen)}
                  activeOpacity={0.7}
                >
                  <Feather name="filter" size={12} color={theme.textMain} />
                  <Text style={styles.filterButtonText}>{currentFilterLabel}</Text>
                  <Feather
                    name={isFilterOpen ? 'chevron-up' : 'chevron-down'}
                    size={12}
                    color={theme.textMain}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.downloadButton,
                    isDownloading && { opacity: 0.5 },
                  ]}
                  onPress={handleDownloadLogs}
                  activeOpacity={0.7}
                  disabled={isDownloading}
                  accessibilityLabel="Download activity logs as PDF"
                >
                  <Feather
                    name={isDownloading ? 'loader' : 'download'}
                    size={14}
                    color={theme.downloadIcon}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Filter Dropdown */}
            {isFilterOpen && (
              <View style={styles.filterDropdown}>
                {ACTIVITY_FILTERS.map((option, index) => {
                  const isSelected = activityFilter === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.filterOption,
                        index === ACTIVITY_FILTERS.length - 1 && { borderBottomWidth: 0 },
                        isSelected && styles.filterOptionSelected,
                      ]}
                      onPress={() => {
                        setActivityFilter(option.value);
                        setIsFilterOpen(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          isSelected && styles.filterOptionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {isSelected && (
                        <Feather name="check" size={14} color={theme.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Logs List */}
            {filteredActivityLogs.length === 0 ? (
              <View style={styles.emptyLogContainer}>
                <Feather name="inbox" size={28} color={theme.textMuted} />
                <Text style={styles.emptyLogText}>
                  No activity recorded in this period.
                </Text>
              </View>
            ) : (
              filteredActivityLogs.map((log, index) => {
                const badge = getActionBadgeStyle(log.actionType);
                const isLast = index === filteredActivityLogs.length - 1;

                return (
                  <View
                    key={log.id}
                    style={[
                      styles.logItem,
                      isLast && { borderBottomWidth: 0, paddingBottom: 0 },
                    ]}
                  >
                    <View
                      style={[
                        styles.logActionBadge,
                        { backgroundColor: badge.bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.logActionText,
                          { color: badge.text },
                        ]}
                      >
                        {log.action.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.logContent}>
                      <Text style={styles.logDescription}>{log.description}</Text>
                      <Text style={styles.logDetails}>{log.details}</Text>
                    </View>
                    <Text style={styles.logTimestamp}>
                      {formatTimestamp(log.timestamp)}
                    </Text>
                  </View>
                );
              })
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* --- BOTTOM NAVIGATION BAR --- */}
        <View
          style={[
            styles.bottomNav,
            { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 },
          ]}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            const showBadge = item.name === 'Requests' && pendingCount > 0;

            return (
              <TouchableOpacity
                key={item.name}
                style={styles.navItem}
                activeOpacity={0.7}
                onPress={() => router.push(item.path)}
              >
                <View style={styles.navIconContainer}>
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={isActive ? theme.navActive : theme.navInactive}
                  />
                  {showBadge && (
                    <View style={styles.navBadge}>
                      <Text style={styles.navBadgeText}>{pendingCount}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.navText, isActive && styles.navTextActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

// --- Styles Generator ---
const getStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    backgroundImage: { flex: 1, width: '100%', height: '100%' },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.overlay,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: theme.headerBg,
      borderBottomWidth: 1,
      borderBottomColor: theme.headerBorder,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    logoImage: { width: 40, height: 40, marginRight: 10 },
    headerTextContainer: { justifyContent: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '700', color: theme.headerTitle },
    headerSubtitle: {
      fontSize: 9,
      fontWeight: '600',
      color: 'red',
      letterSpacing: 1,
      marginTop: 2,
    },
    headerRight: { flexDirection: 'row', alignItems: 'center' },
    iconButton: { marginLeft: 14 },
    scrollContent: { padding: 16 },
    heroSection: { marginBottom: 20 },
    tag: {
      backgroundColor: theme.iconBg,
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      marginBottom: 8,
    },
    tagText: { fontSize: 10, fontWeight: 'bold', color: theme.primary, letterSpacing: 1 },
    heroTitle: {
      fontSize: 26,
      fontWeight: 'bold',
      color: theme.darkBlue,
      fontFamily: 'serif',
      marginBottom: 8,
    },
    heroSubtitle: { fontSize: 14, color: theme.textMuted, lineHeight: 20 },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    metricCard: {
      width: '48%',
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    metricHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    metricTitle: {
      fontSize: 10,
      fontWeight: 'bold',
      color: theme.textMain,
      letterSpacing: 0.5,
    },
    metricValue: { fontSize: 28, fontWeight: 'bold', color: theme.darkBlue },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: 'bold',
      color: theme.textMain,
      letterSpacing: 1,
    },
    viewAllText: { fontSize: 12, fontWeight: 'bold', color: theme.textMain },
    requestCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.card,
      padding: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 24,
    },
    requestInfo: { flex: 1 },
    requestName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.textMain,
      marginBottom: 4,
    },
    requestDetails: { fontSize: 12, color: theme.textMuted },
    statusBadge: {
      backgroundColor: theme.pendingBg,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: { color: theme.pendingText, fontSize: 12, fontWeight: 'bold' },
    noteSection: { marginBottom: 24 },
    noteTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      fontStyle: 'italic',
      color: theme.textMain,
      marginBottom: 8,
    },
    noteDesc: { fontSize: 13, color: theme.textMuted, lineHeight: 20 },
    activitySection: {
      backgroundColor: theme.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      marginBottom: 16,
    },
    activityHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    activityHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    activityIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.workflowBg,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    activityTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.textMain,
      marginBottom: 2,
    },
    activitySubtitle: {
      fontSize: 11,
      color: theme.textMuted,
    },
    activityActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.filterBg,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.border,
    },
    filterButtonText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textMain,
      marginHorizontal: 6,
    },
    downloadButton: {
      width: 34,
      height: 34,
      borderRadius: 6,
      backgroundColor: theme.downloadBg,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    filterDropdown: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      marginBottom: 12,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
    },
    filterOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    filterOptionSelected: {
      backgroundColor: theme.workflowBg,
    },
    filterOptionText: {
      fontSize: 13,
      color: theme.textMain,
    },
    filterOptionTextSelected: {
      color: theme.primary,
      fontWeight: 'bold',
    },
    logItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    logActionBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
      marginRight: 10,
      marginTop: 2,
      minWidth: 68,
      alignItems: 'center',
    },
    logActionText: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    logContent: {
      flex: 1,
      paddingRight: 8,
    },
    logDescription: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textMain,
      lineHeight: 18,
      marginBottom: 3,
    },
    logDetails: {
      fontSize: 11,
      color: theme.textMuted,
      lineHeight: 15,
    },
    logTimestamp: {
      fontSize: 10,
      color: theme.textMuted,
      fontWeight: '600',
      marginTop: 2,
      minWidth: 50,
      textAlign: 'right',
    },
    emptyLogContainer: {
      alignItems: 'center',
      paddingVertical: 24,
    },
    emptyLogText: {
      fontSize: 13,
      color: theme.textMuted,
      marginTop: 8,
      textAlign: 'center',
    },
    bottomNav: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: theme.card,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingTop: 10,
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    },
    navItem: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 2,
      minWidth: 50,
      flex: 1,
    },
    navIconContainer: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    navBadge: {
      position: 'absolute',
      top: -4,
      right: -8,
      backgroundColor: theme.danger,
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      paddingHorizontal: 3,
      justifyContent: 'center',
      alignItems: 'center',
    },
    navBadgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
    navText: { fontSize: 9, color: theme.navText, marginTop: 4 },
    navTextActive: { color: theme.navActive, fontWeight: 'bold' },
  });