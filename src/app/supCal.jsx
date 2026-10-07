// src/app/supCal.jsx
import { Feather, Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  ImageBackground,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import LogoImg from '@/assets/images/logo.png';

const formatDate = (date) => {
  if (!date) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
};

// --- Theme Colors ---
const COLORS = {
  primary: '#2563EB',
  darkBlue: '#1E3A8A',
  textMain: '#111827',
  textMuted: '#6B7280',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E5E7EB',
  success: '#10B981',
  danger: '#E53935',
  purpleLight: '#E0E7FF',
  purpleText: '#4F46E5',
  grayLight: '#F3F4F6',
  grayText: '#4B5563',
};

// --- Week Days ---
const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// --- Closure Event Type Options ---
const CLOSURE_OPTIONS = [
  { label: 'Library closure', icon: 'book-open' },
  { label: 'Strike', icon: 'alert-triangle' },
];

// --- Structured Event Data ---
const SHIFTS_DATA = {
  '28': [{ id: 1, title: 'Peter Thomas', type: 'Shift Scheduled', color: COLORS.purpleLight, textColor: COLORS.purpleText }],
  '29': [{ id: 2, title: 'Approved Leave', type: 'Leave', color: COLORS.grayLight, textColor: COLORS.grayText }],
  '30': [{ id: 3, title: 'Peter Thomas', type: 'Shift Scheduled', color: COLORS.purpleLight, textColor: COLORS.purpleText }],
  '7':  [{ id: 4, title: 'Approved Leave', type: 'Leave', color: COLORS.grayLight, textColor: COLORS.grayText }],
  '15': [
    { id: 5, title: 'Sarah Nkosi', type: 'Shift Scheduled', color: COLORS.purpleLight, textColor: COLORS.purpleText },
    { id: 6, title: 'Peter Thomas', type: 'Shift Scheduled', color: COLORS.purpleLight, textColor: COLORS.purpleText }
  ],
  '6':  []
};

// --- Mock Data for Timetables ---
const TIMETABLES_DATA = [
  { 
    id: 1, 
    name: 'Thabiso Shoba', 
    studentNumber: '235645633', 
    fileName: 'LOGSHEET-1.pdf', 
    fileSize: '84 KB', 
    uploadDate: '7 Oct 2026',
    fileUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=1000&auto=format&fit=crop'
  },
  { 
    id: 2, 
    name: 'Peter Thomas', 
    studentNumber: '235645634', 
    fileName: 'Timetable_Sem1.pdf', 
    fileSize: '120 KB', 
    uploadDate: '6 Oct 2026',
    fileUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=1000&auto=format&fit=crop'
  }
];

// --- Bottom Nav Items (Mapped to Pages) ---
const NAV_ITEMS = [
  { name: 'Dashboard',   icon: 'grid-outline',          path: '/supervisorDash' },
  { name: 'Calendar',    icon: 'calendar-outline',      path: '/supCal'         },
  { name: 'Requests',    icon: 'document-text-outline', path: '/supRequest', badge: 1 },
  { name: 'Assistances', icon: 'people-outline',        path: '/supAssistants'  },
  { name: 'Reports',     icon: 'bar-chart-outline',     path: '/supReport'      },
];

export default function MasterSchedule() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [displayedMonth, setDisplayedMonth] = useState(new Date(2026, 9, 1));

  const [isNewShiftModalVisible, setNewShiftModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState('2026/10/07');
  const [isCalendarVisible, setCalendarVisible] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 9, 1));
  const [selectedPosition, setSelectedPosition] = useState('iCenter');
  const [isPositionDropdownOpen, setPositionDropdownOpen] = useState(false);
  const [selectedShiftTime, setSelectedShiftTime] = useState('Morning Shift');
  const [isShiftTimeDropdownOpen, setShiftTimeDropdownOpen] = useState(false);

  const [isClosureModalVisible, setClosureModalVisible] = useState(false);
  const [closureType, setClosureType] = useState('Library closure');
  const [isClosureDropdownOpen, setClosureDropdownOpen] = useState(false);
  const [closureNote, setClosureNote] = useState('');

  const [isTimetableListVisible, setTimetableListVisible] = useState(false);
  const [isDocPreviewVisible, setDocPreviewVisible] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [isDarkMode, setIsDarkMode] = useState(false);
  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // ==========================================
  // CALENDAR HEADER CONTROL FUNCTIONS
  // ==========================================
  const handlePrevMonth = () => {
    setDisplayedMonth(new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setDisplayedMonth(new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setDisplayedMonth(new Date(2026, 9, 1));
    setSelectedDay(null);
  };

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const getMonthName = (date) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const renderMainCalendarDays = () => {
    const daysInMonth = getDaysInMonth(displayedMonth);
    const firstDay = getFirstDayOfMonth(displayedMonth);
    const prevMonthDays = getDaysInMonth(
      new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() - 1, 1)
    );

    const gridItems = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      gridItems.push({ day: String(dayNum), current: false, key: `prev-${dayNum}` });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      gridItems.push({ day: String(i), current: true, key: `curr-${i}` });
    }

    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const remainingCells = totalCells - (firstDay + daysInMonth);
    for (let i = 1; i <= remainingCells; i++) {
      gridItems.push({ day: String(i), current: false, key: `next-${i}` });
    }

    return gridItems;
  };

  const handleDayPress = (dayItem) => {
    if (!dayItem.current) return;
    setSelectedDay(dayItem.day);
    setModalVisible(true);
  };

  const getSelectedDayEvents = () => {
    if (!selectedDay) return [];
    return SHIFTS_DATA[selectedDay] || [];
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDayCell} />);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dayString = `${currentMonth.getFullYear()}/${String(currentMonth.getMonth() + 1).padStart(2, '0')}/${String(i).padStart(2, '0')}`;
      const isSelected = selectedDate === dayString;

      days.push(
        <TouchableOpacity 
          key={`day-${i}`} 
          style={[styles.calendarDayCell, isSelected && styles.calendarDayCellSelected]}
          onPress={() => {
            setSelectedDate(dayString);
            setCalendarVisible(false);
          }}
        >
          <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextSelected]}>{i}</Text>
        </TouchableOpacity>
      );
    }
    return days;
  };

  const changeMonth = (increment) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + increment, 1));
  };

  const filteredTimetables = TIMETABLES_DATA.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.studentNumber.includes(searchQuery)
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1590&auto=format&fit=crop' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

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
                <Feather name={isDarkMode ? 'sun' : 'moon'} size={22} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/supNotif')}>
                <Ionicons name="notifications-outline" size={22} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/logOut')}>
                <Ionicons name="log-out-outline" size={22} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* --- TITLE & ACTIONS --- */}
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <Text style={styles.pageTitle}>Master Schedule</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.refreshButton}>
                  <Feather name="refresh-cw" size={14} color={COLORS.textMain} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.newShiftButton}
                  onPress={() => setNewShiftModalVisible(true)}
                >
                  <Feather name="plus" size={14} color="#FFF" />
                  <Text style={styles.newShiftText}>New Shift</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.pageSubtitle}>
              {"Manage every student assistant's shifts from a single monthly view. Each student has a unique color."}
            </Text>
          </View>

          {/* --- STATS ROW --- */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIndicator, { backgroundColor: COLORS.primary }]} />
              <View>
                <Text style={styles.statLabel}>TOTAL SHIFTS</Text>
                <Text style={styles.statValue}>6</Text>
              </View>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIndicator, { backgroundColor: COLORS.success }]} />
              <View>
                <Text style={styles.statLabel}>ACTIVE ASSISTANTS</Text>
                <Text style={styles.statValue}>3</Text>
              </View>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIndicator, { backgroundColor: '#F59E0B' }]} />
              <View>
                <Text style={styles.statLabel}>UPCOMING</Text>
                <Text style={styles.statValue}>2</Text>
              </View>
            </View>
          </View>

          {/* --- CALENDAR CARD --- */}
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <View style={styles.calendarTitleRow}>
                <View style={styles.calendarIcon}>
                  <Feather name="calendar" size={18} color="#FFF" />
                </View>
                <View>
                  <Text style={styles.calendarTitle}>{getMonthName(displayedMonth)}</Text>
                  <Text style={styles.calendarSubtitle}>Library Resource Unit</Text>
                </View>
              </View>
              <View style={styles.calendarControls}>
                <TouchableOpacity style={styles.calendarNavBtn} onPress={handlePrevMonth}>
                  <Feather name="chevron-left" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.todayBtn} onPress={handleToday}>
                  <Text style={styles.todayBtnText}>TODAY</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.calendarNavBtn} onPress={handleNextMonth}>
                  <Feather name="chevron-right" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.gridContainer}>
              <View style={styles.weekRow}>
                {weekDays.map((day) => (
                  <Text key={day} style={styles.weekDayText}>{day}</Text>
                ))}
              </View>
              <View style={styles.daysContainer}>
                {renderMainCalendarDays().map((item, index) => {
                  const dayEvents = SHIFTS_DATA[item.day] || [];
                  const isSelected = selectedDay === item.day && item.current;
                  
                  return (
                    <TouchableOpacity
                      key={item.key || index}
                      style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                      onPress={() => handleDayPress(item)}
                      disabled={!item.current}
                    >
                      <Text style={[styles.dayText, !item.current && styles.dayTextMuted]}>{item.day}</Text>
                      
                      {item.current && dayEvents.slice(0, 2).map((event, idx) => (
                        <View key={idx} style={[styles.eventTag, { backgroundColor: event.color, marginTop: idx === 0 ? 2 : 1 }]}>
                          <Text style={[styles.eventText, { color: event.textColor }]} numberOfLines={1}>{event.title.toUpperCase()}</Text>
                        </View>
                      ))}
                      
                      {item.current && dayEvents.length > 2 && (
                        <Text style={styles.moreEventsText}>+{dayEvents.length - 2} more</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.legendContainer}>
              <Text style={styles.legendTitle}>LEGEND</Text>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} /><Text style={styles.legendText}>John Doe</Text></View>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} /><Text style={styles.legendText}>Peter Thomas</Text></View>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} /><Text style={styles.legendText}>Sarah Nkosi</Text></View>
              </View>
              <View style={styles.legendDescRow}>
                <Text style={styles.legendDesc}><Text style={{ color: '#10B981' }}>■</Text> Green box - Holiday</Text>
                <Text style={styles.legendDesc}><Text style={{ color: '#EF4444' }}>■</Text> Red box - Institutional closure</Text>
                <Text style={styles.legendDesc}><Text style={{ color: '#9CA3AF' }}>■</Text> Grey box - date swapped to</Text>
                <Text style={styles.legendDesc}><Text style={{ color: '#3B82F6' }}>□</Text> Blue box - date swapped from</Text>
              </View>
            </View>
          </View>

          {/* --- SIDEBAR PANELS --- */}
          <View style={styles.sidePanel}>
            <View style={styles.panelCard}>
              <Text style={styles.panelDate}>{selectedDay ? `${selectedDay} ${getMonthName(displayedMonth).split(' ')[0]} ${displayedMonth.getFullYear()}` : `6 ${getMonthName(displayedMonth).split(' ')[0]} ${displayedMonth.getFullYear()}`}</Text>
              <Text style={styles.panelSubtitle}>
                {getSelectedDayEvents().length} shift{getSelectedDayEvents().length !== 1 ? 's' : ''} scheduled
              </Text>

              <TouchableOpacity 
                style={styles.closureButton}
                onPress={() => setClosureModalVisible(true)}
              >
                <Feather name="bell" size={14} color={COLORS.danger} />
                <Text style={styles.closureButtonText}>Declare institutional closure</Text>
              </TouchableOpacity>

              {getSelectedDayEvents().length === 0 ? (
                <View style={styles.noShiftsBox}>
                  <Text style={styles.noShiftsText}>No shifts scheduled for this date.</Text>
                </View>
              ) : (
                getSelectedDayEvents().map((event, idx) => (
                  <View key={idx} style={styles.eventListRow}>
                    <View style={[styles.eventIndicator, { backgroundColor: event.textColor }]} />
                    <Text style={styles.eventListText}>{event.title} - {event.type}</Text>
                  </View>
                ))
              )}
            </View>

            <View style={[styles.panelCard, styles.tipsCard]}>
              <View style={styles.panelHeader}>
                <Feather name="shield" size={16} color={COLORS.success} />
                <Text style={styles.panelTitle}>Scheduling Tips</Text>
              </View>
              <Text style={styles.tipText}>• Each student has a unique color for quick scanning.</Text>
              <Text style={styles.tipText}>• Days show up to 2 shifts before collapsing.</Text>
            </View>

            <View style={styles.panelCard}>
              <View style={styles.panelHeader}>
                <Feather name="clock" size={16} color={COLORS.primary} />
                <Text style={styles.panelTitle}>View Student Timetable</Text>
              </View>
              <Text style={styles.panelSubtitle}>Recent timetable uploads</Text>
              <View style={styles.noShiftsBox}>
                <Text style={styles.noShiftsText}>No timetables uploaded yet.</Text>
              </View>
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => setTimetableListVisible(true)}
              >
                <Text style={styles.viewAllText}>View all uploads</Text>
              </TouchableOpacity>
            </View>
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
                    color={isActive ? COLORS.primary : '#A0AEC0'}
                  />
                  {item.badge ? (
                    <View style={styles.navBadge}>
                      <Text style={styles.navBadgeText}>{item.badge}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.navText, isActive && styles.navTextActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ImageBackground>

      {/* --- ACTIVITY POP-UP MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Feather name="calendar" size={18} color={COLORS.primary} />
                <Text style={styles.modalDateText}>
                  {selectedDay} {getMonthName(displayedMonth).split(' ')[0]} {displayedMonth.getFullYear()}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseIcon}>
                <Feather name="x" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {getSelectedDayEvents().length === 0 ? (
                <View style={styles.modalEmptyState}>
                  <Feather name="coffee" size={32} color={COLORS.textMuted} />
                  <Text style={styles.modalEmptyText}>No activities scheduled for this day.</Text>
                </View>
              ) : (
                getSelectedDayEvents().map((event, index) => (
                  <View key={index} style={styles.modalEventRow}>
                    <View style={[styles.modalEventIndicator, { backgroundColor: event.textColor }]} />
                    <View style={styles.modalEventDetails}>
                      <Text style={styles.modalEventTitle}>{event.title}</Text>
                      <Text style={styles.modalEventType}>{event.type}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity 
              style={styles.modalCloseButton} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- NEW SHIFT FORM MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isNewShiftModalVisible}
        onRequestClose={() => setNewShiftModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.newShiftModalContainer}>
            <View style={styles.newShiftHeader}>
              <View>
                <Text style={styles.newShiftTitle}>Schedule New Shift</Text>
                <Text style={styles.newShiftSubtitle}>Assign a shift to a student assistant.</Text>
              </View>
              <TouchableOpacity onPress={() => setNewShiftModalVisible(false)} style={styles.modalCloseIcon}>
                <Feather name="x" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.newShiftFormScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Student Assistant <Text style={{color: COLORS.danger}}>*</Text></Text>
              <TouchableOpacity style={styles.formDropdown}>
                <Text style={styles.formDropdownText}>Select a student assistant...</Text>
                <Feather name="chevron-down" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Date of shift <Text style={{color: COLORS.danger}}>*</Text></Text>
                  <TouchableOpacity 
                    style={styles.formInputContainer}
                    onPress={() => setCalendarVisible(true)}
                  >
                    <Text style={[styles.formInput, { color: selectedDate ? COLORS.textMain : COLORS.textMuted }]}>
                      {selectedDate || "Select date"}
                    </Text>
                    <Feather name="calendar" size={16} color={COLORS.textMuted} style={styles.formInputIcon} />
                  </TouchableOpacity>
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Position</Text>
                  <TouchableOpacity 
                    style={styles.formDropdown}
                    onPress={() => setPositionDropdownOpen(!isPositionDropdownOpen)}
                  >
                    <Text style={styles.formDropdownText}>{selectedPosition}</Text>
                    <Feather name={isPositionDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                  {isPositionDropdownOpen && (
                    <View style={styles.dropdownOptions}>
                      {['iCenter', 'Circular2'].map((option) => (
                        <TouchableOpacity 
                          key={option} 
                          style={styles.dropdownOptionItem}
                          onPress={() => {
                            setSelectedPosition(option);
                            setPositionDropdownOpen(false);
                          }}
                        >
                          <Text style={[styles.dropdownOptionText, selectedPosition === option && styles.dropdownOptionTextSelected]}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Shift Time <Text style={{color: COLORS.danger}}>*</Text></Text>
                  <TouchableOpacity 
                    style={styles.formDropdown}
                    onPress={() => setShiftTimeDropdownOpen(!isShiftTimeDropdownOpen)}
                  >
                    <Text style={styles.formDropdownText}>{selectedShiftTime}</Text>
                    <Feather name={isShiftTimeDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                  {isShiftTimeDropdownOpen && (
                    <View style={styles.dropdownOptions}>
                      {['Morning Shift', 'Day Shift'].map((option) => (
                        <TouchableOpacity 
                          key={option} 
                          style={styles.dropdownOptionItem}
                          onPress={() => {
                            setSelectedShiftTime(option);
                            setShiftTimeDropdownOpen(false);
                          }}
                        >
                          <Text style={[styles.dropdownOptionText, selectedShiftTime === option && styles.dropdownOptionTextSelected]}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Duration</Text>
                  <TouchableOpacity style={styles.formDropdown}>
                    <Text style={styles.formDropdownText}>4 hours</Text>
                    <Feather name="chevron-down" size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.formLabel}>Location</Text>
              <TextInput 
                style={styles.formInputFull} 
                placeholder="Main Desk" 
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={styles.formLabel}>Notes (optional)</Text>
              <TextInput 
                style={[styles.formInputFull, styles.formTextArea]} 
                placeholder="Any additional instructions..." 
                placeholderTextColor={COLORS.textMuted}
                multiline={true}
                numberOfLines={4}
              />

            </ScrollView>

            <View style={styles.newShiftFooter}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setNewShiftModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={() => {
                  setNewShiftModalVisible(false);
                }}
              >
                <Feather name="plus" size={16} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.submitBtnText}>Create Shift</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      {/* --- CUSTOM DATE PICKER MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isCalendarVisible}
        onRequestClose={() => setCalendarVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModalContainer}>
            <View style={styles.calendarModalHeader}>
              <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.calendarNavButton}>
                <Feather name="chevron-left" size={20} color={COLORS.textMain} />
              </TouchableOpacity>
              <Text style={styles.calendarModalTitle}>{getMonthName(currentMonth)}</Text>
              <TouchableOpacity onPress={() => changeMonth(1)} style={styles.calendarNavButton}>
                <Feather name="chevron-right" size={20} color={COLORS.textMain} />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarWeekRow}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <Text key={index} style={styles.calendarWeekDay}>{day}</Text>
              ))}
            </View>

            <View style={styles.calendarDaysGrid}>
              {renderCalendarDays()}
            </View>

            <TouchableOpacity 
              style={styles.calendarCloseButton}
              onPress={() => setCalendarVisible(false)}
            >
              <Text style={styles.calendarCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- DECLARE INSTITUTIONAL CLOSURE MODAL (UPDATED DROPDOWN) --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isClosureModalVisible}
        onRequestClose={() => {
          setClosureModalVisible(false);
          setClosureDropdownOpen(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.closureModalContainer}>
            
            {/* Icon */}
            <View style={styles.closureIconContainer}>
              <Feather name="bell" size={24} color={COLORS.danger} />
            </View>

            {/* Title */}
            <Text style={styles.closureModalTitle}>Declare institutional closure</Text>

            {/* Description */}
            <Text style={styles.closureModalDescription}>
              {selectedDay 
                ? `Wednesday, ${selectedDay} ${getMonthName(displayedMonth).split(' ')[0]} ${displayedMonth.getFullYear()}` 
                : 'Wednesday, 7 October 2026'
              } will be marked as an institutional closure on the calendar, blocked for leave and swap requests, and all student assistants will be notified.
            </Text>

            {/* Event Type Dropdown */}
            <View style={styles.formLabelContainer}>
              <Text style={styles.formLabel}>
                Event type <Text style={{ color: COLORS.danger }}>*</Text>
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.closureDropdown}
              onPress={() => setClosureDropdownOpen(!isClosureDropdownOpen)}
              activeOpacity={0.7}
            >
              <View style={styles.closureDropdownValue}>
                <Feather 
                  name={CLOSURE_OPTIONS.find(o => o.label === closureType)?.icon || 'calendar'} 
                  size={16} 
                  color={COLORS.primary} 
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.formDropdownText}>{closureType}</Text>
              </View>
              <Feather 
                name={isClosureDropdownOpen ? "chevron-up" : "chevron-down"} 
                size={16} 
                color={COLORS.textMain} 
              />
            </TouchableOpacity>

            {isClosureDropdownOpen && (
              <View style={styles.closureDropdownOptions}>
                {CLOSURE_OPTIONS.map((option, index) => {
                  const isSelected = closureType === option.label;
                  return (
                    <TouchableOpacity 
                      key={option.label} 
                      style={[
                        styles.closureDropdownItem,
                        index === CLOSURE_OPTIONS.length - 1 && { borderBottomWidth: 0 }
                      ]}
                      onPress={() => {
                        setClosureType(option.label);
                        setClosureDropdownOpen(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.closureDropdownItemLeft}>
                        <Feather 
                          name={option.icon} 
                          size={16} 
                          color={isSelected ? COLORS.primary : COLORS.textMuted} 
                          style={{ marginRight: 10 }}
                        />
                        <Text style={[
                          styles.closureDropdownItemText,
                          isSelected && styles.closureDropdownItemTextSelected
                        ]}>
                          {option.label}
                        </Text>
                      </View>
                      {isSelected && (
                        <Feather name="check" size={16} color={COLORS.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Note Input */}
            <View style={[styles.formLabelContainer, { marginTop: 16 }]}>
              <Text style={styles.formLabel}>Note for students (optional)</Text>
            </View>
            <TextInput 
              style={styles.closureTextArea} 
              placeholder="e.g. Campus closed due to the national shutdown." 
              placeholderTextColor={COLORS.textMuted}
              multiline={true}
              numberOfLines={4}
              value={closureNote}
              onChangeText={setClosureNote}
            />

            {/* Footer Buttons */}
            <View style={styles.closureFooter}>
              <TouchableOpacity 
                style={styles.cancelClosureBtn} 
                onPress={() => {
                  setClosureModalVisible(false);
                  setClosureDropdownOpen(false);
                }}
              >
                <Text style={styles.cancelClosureText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.declareClosureBtn} 
                onPress={() => {
                  setClosureModalVisible(false);
                  setClosureDropdownOpen(false);
                }}
              >
                <Text style={styles.declareClosureText}>Declare closure</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      {/* --- STUDENT TIMETABLES LIST MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isTimetableListVisible}
        onRequestClose={() => setTimetableListVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.timetableModalContainer}>
            <View style={styles.timetableHeader}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.timetableTitle}>Student timetables</Text>
                <Text style={styles.timetableSubtitle}>
                  Class timetables uploaded by student assistants. Use them to avoid clashes when setting shifts.
                </Text>
              </View>
              
              <TouchableOpacity 
                onPress={() => setTimetableListVisible(false)} 
                style={styles.timetableCloseButton}
              >
                <Feather name="x" size={20} color={COLORS.textMain} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBarContainer}>
              <Feather name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
              <TextInput 
                style={styles.searchInput}
                placeholder="Search by name or student number"
                placeholderTextColor={COLORS.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <ScrollView style={styles.timetableList} showsVerticalScrollIndicator={false}>
              {filteredTimetables.length === 0 ? (
                <View style={styles.noUploadsContainer}>
                  <Text style={styles.noUploadsText}>No timetables found matching your search.</Text>
                </View>
              ) : (
                filteredTimetables.map((item) => (
                  <View key={item.id} style={styles.timetableItem}>
                    <View style={styles.timetableIconContainer}>
                      <Feather name="file-text" size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.timetableDetails}>
                      <Text style={styles.timetableName}>{item.name}</Text>
                      <Text style={styles.timetableMeta}>
                        {item.studentNumber} · {item.fileName} · {item.fileSize} · Uploaded {item.uploadDate}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.viewButton}
                      onPress={() => {
                        setSelectedTimetable(item);
                        setDocPreviewVisible(true);
                      }}
                    >
                      <Text style={styles.viewButtonText}>View</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- DOCUMENT PREVIEW MODAL --- */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={isDocPreviewVisible}
        onRequestClose={() => setDocPreviewVisible(false)}
      >
        <SafeAreaView style={styles.docPreviewContainer}>
          <View style={styles.docPreviewHeader}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => setDocPreviewVisible(false)}
            >
              <Feather name="chevron-left" size={20} color={COLORS.primary} />
              <Text style={styles.backButtonText}>All students</Text>
            </TouchableOpacity>
            
            <View style={styles.docPreviewTitleContainer}>
              <Text style={styles.docPreviewTitle}>
                {selectedTimetable?.name} - {selectedTimetable?.studentNumber}
              </Text>
            </View>

            <View style={styles.docPreviewRightActions}>
              <TouchableOpacity style={styles.downloadButton}>
                <Feather name="download" size={16} color={COLORS.textMain} />
                <Text style={styles.downloadButtonText}>Download</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.docPreviewCloseButton} 
                onPress={() => setDocPreviewVisible(false)}
              >
                <Feather name="x" size={24} color={COLORS.textMain} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.docViewer}>
            {selectedTimetable && (
              <Image 
                source={{ uri: selectedTimetable.fileUrl }} 
                style={styles.docImage} 
                resizeMode="contain"
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  scrollContent: { padding: 16 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 20,
    marginHorizontal: -16,
    marginTop: -16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 40, height: 40, marginRight: 10 },
  headerTextContainer: { justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textMain },
  headerSubtitle: {
    fontSize: 9,
    fontWeight: '600',
    color: 'red',
    letterSpacing: 1,
    marginTop: 2,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { marginLeft: 14 },

  // Title Section
  titleSection: { marginBottom: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.darkBlue, fontFamily: 'serif' },
  actionButtons: { flexDirection: 'row' },
  refreshButton: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: COLORS.border,
    padding: 8, borderRadius: 6, marginRight: 8,
  },
  newShiftButton: {
    backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6,
  },
  newShiftText: { color: '#FFF', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  pageSubtitle: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },

  // Stats Row
  statsRow: { flexDirection: 'row', marginBottom: 16, justifyContent: 'space-between' },
  statCard: {
    flex: 1, backgroundColor: COLORS.card, padding: 12, borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 4,
  },
  statIndicator: { width: 4, height: 24, borderRadius: 2, marginRight: 8 },
  statLabel: { fontSize: 8, fontWeight: 'bold', color: COLORS.textMuted, letterSpacing: 0.5 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.darkBlue },

  // Calendar Card
  calendarCard: {
    backgroundColor: COLORS.card, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  calendarTitleRow: { flexDirection: 'row', alignItems: 'center' },
  calendarIcon: {
    width: 32, height: 32, borderRadius: 6, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: 8,
  },
  calendarTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.darkBlue },
  calendarSubtitle: { fontSize: 11, color: COLORS.textMuted },
  calendarControls: { flexDirection: 'row', alignItems: 'center' },
  calendarNavBtn: { padding: 6, backgroundColor: COLORS.grayLight, borderRadius: 4 },
  todayBtn: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 8, paddingVertical: 6, borderRadius: 4, marginHorizontal: 4,
  },
  todayBtnText: { fontSize: 10, fontWeight: 'bold', color: COLORS.textMain },

  // Calendar Grid
  gridContainer: { marginBottom: 16 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  weekDayText: { fontSize: 9, fontWeight: 'bold', color: COLORS.textMuted, width: '14.28%', textAlign: 'center' },
  daysContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: '14.28%', height: 55, borderBottomWidth: 1, borderRightWidth: 1,
    borderColor: COLORS.border, padding: 2, alignItems: 'center',
  },
  dayCellSelected: { backgroundColor: '#EFF6FF' },
  dayText: { fontSize: 11, fontWeight: 'bold', color: COLORS.textMain, marginTop: 2 },
  dayTextMuted: { color: '#D1D5DB' },
  eventTag: { width: '100%', padding: 1, borderRadius: 2, alignItems: 'center' },
  eventText: { fontSize: 5, fontWeight: 'bold' },
  moreEventsText: { fontSize: 6, color: COLORS.textMuted, marginTop: 1, fontWeight: 'bold' },

  // Legend
  legendContainer: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  legendTitle: { fontSize: 10, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 8 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  legendDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  legendText: { fontSize: 10, color: COLORS.textMuted },
  legendDescRow: { flexDirection: 'row', flexWrap: 'wrap' },
  legendDesc: { fontSize: 9, color: COLORS.textMuted, marginRight: 8, marginBottom: 4 },

  // Side Panel (Stacked Cards)
  sidePanel: { marginBottom: 16 },
  panelCard: {
    backgroundColor: COLORS.card, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  panelDate: { fontSize: 18, fontWeight: 'bold', color: COLORS.darkBlue, marginBottom: 4 },
  panelSubtitle: { fontSize: 12, color: COLORS.textMuted, marginBottom: 12 },
  closureButton: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.danger, borderRadius: 6,
    paddingVertical: 8, marginBottom: 12,
  },
  closureButtonText: { color: COLORS.danger, fontSize: 12, fontWeight: 'bold', marginLeft: 6 },
  noShiftsBox: {
    backgroundColor: '#F9FAFB', padding: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  noShiftsText: { fontSize: 12, color: COLORS.textMuted },
  eventListRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  eventIndicator: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  eventListText: { fontSize: 12, color: COLORS.textMain },

  // Tips Card
  tipsCard: { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' },
  panelHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  panelTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.textMain, marginLeft: 8 },
  tipText: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4, lineHeight: 16 },

  // View Timetable Card
  viewAllButton: {
    backgroundColor: COLORS.primary, paddingVertical: 10,
    borderRadius: 6, alignItems: 'center', marginTop: 12,
  },
  viewAllText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },

  // Bottom Navigation Bar
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: { alignItems: 'center', justifyContent: 'center', padding: 4, minWidth: 55 },
  navIconContainer: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  navBadge: {
    position: 'absolute', top: -4, right: -8, backgroundColor: COLORS.danger,
    borderRadius: 8, minWidth: 16, height: 16, paddingHorizontal: 3,
    justifyContent: 'center', alignItems: 'center',
  },
  navBadgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
  navText: { fontSize: 10, color: COLORS.textMuted, marginTop: 4 },
  navTextActive: { color: COLORS.primary, fontWeight: 'bold' },

  // --- Modal Styles ---
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  modalContainer: {
    width: '100%', maxWidth: 400, backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 8, maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 12, marginBottom: 16,
  },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center' },
  modalDateText: { fontSize: 18, fontWeight: 'bold', color: COLORS.darkBlue, marginLeft: 8 },
  modalCloseIcon: { padding: 4 },
  modalScroll: { marginBottom: 16 },
  modalEmptyState: { alignItems: 'center', paddingVertical: 30 },
  modalEmptyText: { fontSize: 14, color: COLORS.textMuted, marginTop: 12, textAlign: 'center' },
  modalEventRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC',
    padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  modalEventIndicator: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  modalEventDetails: { flex: 1 },
  modalEventTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 2 },
  modalEventType: { fontSize: 12, color: COLORS.textMuted },
  modalCloseButton: {
    backgroundColor: COLORS.primary, paddingVertical: 12,
    borderRadius: 8, alignItems: 'center',
  },
  modalCloseText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },

  // --- NEW SHIFT MODAL STYLES ---
  newShiftModalContainer: {
    width: '100%', maxWidth: 480, backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 8, maxHeight: '90%',
  },
  newShiftHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 20,
  },
  newShiftTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 4 },
  newShiftSubtitle: { fontSize: 14, color: COLORS.textMuted },
  newShiftFormScroll: { marginBottom: 20, zIndex: 1 },
  formLabel: { fontSize: 12, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 6 },
  formLabelContainer: { alignSelf: 'flex-start', marginBottom: 6 },
  formInputContainer: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12,
    marginBottom: 16, backgroundColor: '#FFFFFF',
  },
  formInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: COLORS.textMain },
  formInputIcon: { marginLeft: 8 },
  formInputFull: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
    color: COLORS.textMain, marginBottom: 16, backgroundColor: '#FFFFFF',
  },
  formTextArea: { height: 80, textAlignVertical: 'top' },
  formDropdown: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 12, marginBottom: 16, backgroundColor: '#FFFFFF',
  },
  formDropdownText: { fontSize: 14, color: COLORS.textMain },
  formRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, zIndex: 10 },
  formCol: { flex: 1, zIndex: 20 },
  newShiftFooter: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: 12,
    borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 16, zIndex: 0,
  },
  cancelBtn: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#FFFFFF',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textMain },
  submitBtn: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8,
    backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center',
  },
  submitBtnText: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' },

  // --- Dropdown Options Styles (for New Shift Modal) ---
  dropdownOptions: {
    position: 'absolute', top: 60, left: 0, right: 0,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 8, paddingVertical: 4, zIndex: 100,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 5,
  },
  dropdownOptionItem: { paddingVertical: 10, paddingHorizontal: 12 },
  dropdownOptionText: { fontSize: 14, color: COLORS.textMain },
  dropdownOptionTextSelected: { color: COLORS.primary, fontWeight: 'bold' },

  // --- Custom Calendar Picker Styles ---
  calendarModalContainer: {
    width: '100%', maxWidth: 360, backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  calendarModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  calendarModalTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textMain },
  calendarNavButton: { padding: 8, borderRadius: 8, backgroundColor: COLORS.grayLight },
  calendarWeekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  calendarWeekDay: { fontSize: 10, fontWeight: 'bold', color: COLORS.textMuted, width: '14.28%', textAlign: 'center' },
  calendarDaysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDayCell: {
    width: '14.28%', height: 40, justifyContent: 'center',
    alignItems: 'center', borderRadius: 8, marginBottom: 4,
  },
  calendarDayCellSelected: { backgroundColor: COLORS.primary },
  calendarDayText: { fontSize: 12, color: COLORS.textMain },
  calendarDayTextSelected: { color: '#FFFFFF', fontWeight: 'bold' },
  calendarCloseButton: {
    marginTop: 16, paddingVertical: 12, alignItems: 'center',
    borderRadius: 8, backgroundColor: COLORS.grayLight,
  },
  calendarCloseText: { fontSize: 14, fontWeight: 'bold', color: COLORS.textMain },

  // --- DECLARE INSTITUTIONAL CLOSURE MODAL STYLES ---
  closureModalContainer: {
    width: '100%', maxWidth: 420, backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 24, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  closureIconContainer: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#FCE4E4',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  closureModalTitle: {
    fontSize: 20, fontWeight: 'bold', color: COLORS.darkBlue,
    marginBottom: 12, textAlign: 'center',
  },
  closureModalDescription: {
    fontSize: 14, color: COLORS.textMain, textAlign: 'center',
    lineHeight: 20, marginBottom: 20,
  },
  closureDropdown: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: '#FFFFFF', width: '100%',
  },
  closureDropdownValue: {
    flexDirection: 'row', alignItems: 'center', flex: 1,
  },
  closureDropdownOptions: {
    width: '100%', backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    marginTop: 6, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 5,
  },
  closureDropdownItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  closureDropdownItemLeft: {
    flexDirection: 'row', alignItems: 'center', flex: 1,
  },
  closureDropdownItemText: {
    fontSize: 14, color: COLORS.textMain,
  },
  closureDropdownItemTextSelected: {
    color: COLORS.primary, fontWeight: 'bold',
  },
  closureTextArea: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
    color: COLORS.textMain, marginBottom: 24, backgroundColor: '#FFFFFF',
    width: '100%', height: 80, textAlignVertical: 'top',
  },
  closureFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
    width: '100%', gap: 12,
  },
  cancelClosureBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1,
    borderColor: COLORS.border, alignItems: 'center', backgroundColor: '#FFFFFF',
  },
  cancelClosureText: { fontSize: 14, fontWeight: '600', color: COLORS.textMain },
  declareClosureBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 8,
    backgroundColor: '#E53935', alignItems: 'center',
  },
  declareClosureText: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' },

  // --- STUDENT TIMETABLES LIST MODAL STYLES ---
  timetableModalContainer: {
    width: '100%', maxWidth: 600, backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 8, maxHeight: '80%',
  },
  timetableHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 20,
  },
  timetableTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 4 },
  timetableSubtitle: { fontSize: 14, color: COLORS.textMain, lineHeight: 20 },
  timetableCloseButton: {
    padding: 6, borderRadius: 6, backgroundColor: '#F3F4F6', marginLeft: 10,
  },
  searchBarContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    paddingHorizontal: 12, marginBottom: 20,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: COLORS.textMain },
  timetableList: { maxHeight: 300 },
  timetableItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  timetableIconContainer: {
    width: 40, height: 40, borderRadius: 8, backgroundColor: '#EFF6FF',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  timetableDetails: { flex: 1 },
  timetableName: { fontSize: 16, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 4 },
  timetableMeta: { fontSize: 12, color: COLORS.textMuted },
  viewButton: {
    backgroundColor: COLORS.primary, paddingHorizontal: 16,
    paddingVertical: 8, borderRadius: 6,
  },
  viewButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  noUploadsContainer: { paddingVertical: 30, alignItems: 'center' },
  noUploadsText: { fontSize: 14, color: COLORS.textMuted },

  // --- DOCUMENT PREVIEW MODAL STYLES ---
  docPreviewContainer: { flex: 1, backgroundColor: '#2D2D2D' },
  docPreviewHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  backButtonText: {
    fontSize: 16, color: COLORS.primary, fontWeight: '600', marginLeft: 4,
  },
  docPreviewTitleContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 16 },
  docPreviewTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textMain },
  docPreviewRightActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  downloadButton: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderColor: COLORS.border, borderRadius: 6, paddingHorizontal: 12,
    paddingVertical: 6, backgroundColor: '#FFFFFF',
  },
  downloadButtonText: {
    fontSize: 14, fontWeight: '600', color: COLORS.textMain, marginLeft: 6,
  },
  docPreviewCloseButton: {
    padding: 6, borderRadius: 6, backgroundColor: '#F3F4F6',
  },
  docViewer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  docImage: { width: '100%', height: '100%' },
});