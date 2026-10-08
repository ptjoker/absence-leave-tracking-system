// src/app/supCal.jsx
import { apiFetch, getSession } from '@/lib/api';
import { Feather, Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  Modal,
  RefreshControl,
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
const SHIFT_COLORS = ['#F59E0B', '#8B5CF6', '#3B82F6', '#10B981', '#EC4899'];

const colorForUser = (userId) => {
  if (!userId) return SHIFT_COLORS[0];
  const colorIndex = String(userId)
    .split('')
    .reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return SHIFT_COLORS[colorIndex % SHIFT_COLORS.length];
};

const textColorForBg = (hex) => {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return '#FFFFFF';
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.65 ? '#111827' : '#FFFFFF';
};

// ============================================================
// --- HOLIDAY UTILITIES ---
// ============================================================
const pad = (n) => String(n).padStart(2, '0');
const dateKeyFromDate = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const getEasterSunday = (year) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const buildHolidaysForYear = (year) => {
  const easter = getEasterSunday(year);
  const goodFriday = addDays(easter, -2);
  const familyDay = addDays(easter, 1);

  const list = [
    { date: new Date(year, 0, 1),   name: "New Year's Day" },
    { date: new Date(year, 2, 21),  name: 'Human Rights Day' },
    { date: goodFriday,             name: 'Good Friday' },
    { date: familyDay,              name: 'Family Day' },
    { date: new Date(year, 3, 27),  name: 'Freedom Day' },
    { date: new Date(year, 4, 1),   name: "Workers' Day" },
    { date: new Date(year, 5, 16),  name: 'Youth Day' },
    { date: new Date(year, 7, 9),   name: "Women's Day" },
    { date: new Date(year, 8, 24),  name: 'Heritage Day' },
    { date: new Date(year, 11, 16), name: 'Day of Reconciliation' },
    { date: new Date(year, 11, 25), name: 'Christmas Day' },
    { date: new Date(year, 11, 26), name: 'Day of Goodwill' },
  ];

  const map = {};
  list.forEach((h) => {
    map[dateKeyFromDate(h.date)] = h.name;
  });
  return map;
};

const _holidayCache = {};
const getHolidayName = (dateKey) => {
  if (!dateKey) return null;
  const year = Number(String(dateKey).slice(0, 4));
  if (!year) return null;
  if (!_holidayCache[year]) {
    _holidayCache[year] = buildHolidaysForYear(year);
  }
  return _holidayCache[year][dateKey] || null;
};

const startOfToday = () => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
};
const isPastDate = (year, monthIndex, day) => {
  const d = new Date(year, monthIndex, day);
  d.setHours(0, 0, 0, 0);
  return d < startOfToday();
};

const CLOSURE_OPTIONS = [
  { label: 'Library closure', icon: 'book-open' },
  { label: 'Strike', icon: 'alert-triangle' },
];

const POSITION_OPTIONS = ['iCenter', 'Circular2'];

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

const NAV_ITEMS = [
  { name: 'Dashboard',   icon: 'grid-outline',          path: '/supervisorDash' },
  { name: 'Calendar',    icon: 'calendar-outline',      path: '/supCal'         },
  { name: 'Requests',    icon: 'document-text-outline', path: '/supRequest', badge: 1 },
  { name: 'Assistances', icon: 'people-outline',        path: '/supAssistants'  },
  { name: 'Reports',     icon: 'bar-chart-outline',     path: '/supReport'      },
];

const MAX_VISIBLE_EVENTS = 3;

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

  const [selectedAssistant, setSelectedAssistant] = useState(null);
  const [isAssistantDropdownOpen, setAssistantDropdownOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState('iCenter');
  const [isPositionDropdownOpen, setPositionDropdownOpen] = useState(false);
  const [shiftDuration, setShiftDuration] = useState('');
  const [shiftStartTime, setShiftStartTime] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');

  const [isClosureModalVisible, setClosureModalVisible] = useState(false);
  const [closureType, setClosureType] = useState('Library closure');
  const [isClosureDropdownOpen, setClosureDropdownOpen] = useState(false);
  const [closureNote, setClosureNote] = useState('');
  const [closureDate, setClosureDate] = useState('');

  const [calendarTarget, setCalendarTarget] = useState(null);

  const [isTimetableListVisible, setTimetableListVisible] = useState(false);
  const [isDocPreviewVisible, setDocPreviewVisible] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [isDarkMode, setIsDarkMode] = useState(false);
  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const [user, setUser] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [closures, setClosures] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [shiftRes, assistantRes] = await Promise.all([
        apiFetch('/api/shifts'),
        apiFetch('/api/assistants'),
      ]);
      const [shiftData, assistantData] = await Promise.all([
        shiftRes.json(),
        assistantRes.json(),
      ]);

      if (shiftRes.ok && Array.isArray(shiftData)) {
        setShifts(shiftData);
      } else if (shiftData?.error) {
        console.warn('Calendar shifts load error:', shiftData.error);
      }
      if (assistantRes.ok && Array.isArray(assistantData)) {
        setAssistants(assistantData);
      } else if (assistantData?.error) {
        console.warn('Calendar assistants load error:', assistantData.error);
      }

      try {
        const closureRes = await apiFetch('/api/closures');
        if (closureRes.ok) {
          const closureData = await closureRes.json();
          if (Array.isArray(closureData)) setClosures(closureData);
        }
      } catch (e) {
        // ignore — closures may not have an endpoint yet
      }
    } catch (err) {
      console.error('Calendar load error:', err);
      Alert.alert('Connection error', 'Could not load schedule data.');
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

  const shiftsByDate = useMemo(() => {
    const byDate = {};
    shifts.forEach((shift) => {
      if (!shift.shiftDate) return;
      const dateKey = String(shift.shiftDate).slice(0, 10);
      if (!byDate[dateKey]) byDate[dateKey] = [];
      const shiftColor = colorForUser(shift.userId);
      const startTime = shift.startTime || shift.start_time || null;
      const endTime = shift.endTime || shift.end_time || null;
      byDate[dateKey].push({
        ...shift,
        title: shift.studentName || shift.name || shift.assistantName || shift.userName || 'Assistant',
        type: startTime && endTime
          ? `${startTime} - ${endTime}`
          : shift.shiftTime || shift.shiftType || 'Shift Scheduled',
        time: startTime || null,
        color: shiftColor,
        textColor: textColorForBg(shiftColor),
      });
    });
    Object.keys(byDate).forEach((k) => {
      byDate[k].sort((a, b) => {
        if (!a.time && !b.time) return 0;
        if (!a.time) return 1;
        if (!b.time) return -1;
        return String(a.time).localeCompare(String(b.time));
      });
    });
    return byDate;
  }, [shifts]);

  const closuresByDate = useMemo(() => {
    const map = {};
    closures.forEach((c) => {
      if (!c?.date) return;
      const key = String(c.date).slice(0, 10);
      map[key] = c;
    });
    return map;
  }, [closures]);

  const getClosureForDate = (dateKey) => closuresByDate[dateKey] || null;

  const totalShifts = shifts.length;
  const activeAssistants = assistants.length;
  const upcomingShifts = shifts.filter((shift) => {
    if (!shift.shiftDate) return false;
    const shiftDate = new Date(`${String(shift.shiftDate).slice(0, 10)}T00:00:00`);
    return !Number.isNaN(shiftDate.getTime()) && shiftDate >= new Date(new Date().setHours(0, 0, 0, 0));
  }).length;
  const displayName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Supervisor'
    : 'Supervisor';

  const handlePrevMonth = () => {
    setDisplayedMonth(new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setDisplayedMonth(new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const handleToday = () => {
    const today = new Date();
    setDisplayedMonth(new Date(today.getFullYear(), today.getMonth(), 1));
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
    const dateKey = `${displayedMonth.getFullYear()}-${String(displayedMonth.getMonth() + 1).padStart(2, '0')}-${String(dayItem.day).padStart(2, '0')}`;
    const holidayName = getHolidayName(dateKey);
    const dayOfWeek = new Date(
      displayedMonth.getFullYear(),
      displayedMonth.getMonth(),
      Number(dayItem.day)
    ).getDay();
    const past = isPastDate(displayedMonth.getFullYear(), displayedMonth.getMonth(), Number(dayItem.day));

    if (dayOfWeek === 0 || holidayName || past) return;

    setSelectedDay(dayItem.day);
    setModalVisible(true);
  };

  const getSelectedDayEvents = () => {
    if (!selectedDay) return [];
    const dateKey = `${displayedMonth.getFullYear()}-${String(displayedMonth.getMonth() + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    return shiftsByDate[dateKey] || [];
  };

  const getSelectedDayHoliday = () => {
    if (!selectedDay) return null;
    const dateKey = `${displayedMonth.getFullYear()}-${String(displayedMonth.getMonth() + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    return getHolidayName(dateKey);
  };

  const getSelectedDayClosure = () => {
    if (!selectedDay) return null;
    const dateKey = `${displayedMonth.getFullYear()}-${String(displayedMonth.getMonth() + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    return getClosureForDate(dateKey);
  };

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = String(dateStr).split('/').map(Number);
    if (!y || !m || !d) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[m - 1]} ${String(d).padStart(2, '0')}, ${y}`;
  };

  const openNewShiftModal = (prefilledDate) => {
    if (prefilledDate) setSelectedDate(prefilledDate);
    setSelectedAssistant(null);
    setAssistantDropdownOpen(false);
    setSelectedPosition('iCenter');
    setPositionDropdownOpen(false);
    setShiftDuration('');
    setShiftStartTime('');
    setShiftNotes('');
    setNewShiftModalVisible(true);
  };

  const handleNewShiftFromPopup = () => {
    if (!selectedDay) return;

    const dateKey = `${displayedMonth.getFullYear()}-${pad(displayedMonth.getMonth() + 1)}-${pad(selectedDay)}`;
    const closure = getClosureForDate(dateKey);

    if (closure) {
      Alert.alert(
        'Closure day',
        `This day is marked as "${closure.type}". You cannot schedule a new shift on a declared closure day.`
      );
      return;
    }

    const dateString = `${displayedMonth.getFullYear()}/${pad(
      displayedMonth.getMonth() + 1
    )}/${pad(selectedDay)}`;
    setCurrentMonth(
      new Date(displayedMonth.getFullYear(), displayedMonth.getMonth(), 1)
    );
    setModalVisible(false);
    openNewShiftModal(dateString);
  };

  const openClosureModal = () => {
    let base;
    if (selectedDay) {
      base = new Date(
        displayedMonth.getFullYear(),
        displayedMonth.getMonth(),
        Number(selectedDay)
      );
      base.setHours(0, 0, 0, 0);
    } else {
      base = startOfToday();
    }
    if (base < startOfToday()) base = startOfToday();

    const dateStr = `${base.getFullYear()}/${pad(base.getMonth() + 1)}/${pad(base.getDate())}`;
    setClosureDate(dateStr);
    setCurrentMonth(new Date(base.getFullYear(), base.getMonth(), 1));
    setClosureDropdownOpen(false);
    setClosureModalVisible(true);
  };

  const openCalendarPicker = (target) => {
    setCalendarTarget(target);
    const source = target === 'closure' ? closureDate : selectedDate;
    if (source) {
      const [y, m] = source.split('/').map(Number);
      if (y && m) {
        setCurrentMonth(new Date(y, m - 1, 1));
      }
    } else {
      const t = startOfToday();
      setCurrentMonth(new Date(t.getFullYear(), t.getMonth(), 1));
    }
    setCalendarVisible(true);
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
      const activeValue = calendarTarget === 'closure' ? closureDate : selectedDate;
      const isSelected = activeValue === dayString;

      const dateKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isHoliday = !!getHolidayName(dateKey);
      const isSunday = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i).getDay() === 0;
      const past = isPastDate(currentMonth.getFullYear(), currentMonth.getMonth(), i);
      const isClosure = !!getClosureForDate(dateKey);

      const isDisabled =
        isHoliday ||
        isSunday ||
        past ||
        (calendarTarget === 'newShift' && isClosure);

      days.push(
        <TouchableOpacity
          key={`day-${i}`}
          style={[
            styles.calendarDayCell,
            isSelected && styles.calendarDayCellSelected,
            isDisabled && styles.calendarDayCellDisabled,
          ]}
          disabled={isDisabled}
          onPress={() => {
            if (isDisabled) return;
            if (calendarTarget === 'closure') {
              setClosureDate(dayString);
            } else {
              setSelectedDate(dayString);
            }
            setCalendarVisible(false);
            setCalendarTarget(null);
          }}
        >
          <Text
            style={[
              styles.calendarDayText,
              isSelected && styles.calendarDayTextSelected,
              isDisabled && styles.calendarDayTextDisabled,
            ]}
          >
            {i}
          </Text>
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

  const selectedHoliday = getSelectedDayHoliday();
  const selectedClosure = getSelectedDayClosure();

  const handleDeclareClosure = async () => {
    if (!closureDate) {
      Alert.alert('Missing date', 'Please pick a date for the closure.');
      return;
    }

    const dateKey = closureDate.replace(/\//g, '-');

    const newClosure = {
      id: `closure-${dateKey}-${Date.now()}`,
      date: dateKey,
      type: closureType,
      note: closureNote,
    };

    setClosures((prev) => {
      const filtered = prev.filter((c) => String(c.date).slice(0, 10) !== dateKey);
      return [...filtered, newClosure];
    });

    try {
      await apiFetch('/api/closures', {
        method: 'POST',
        body: JSON.stringify(newClosure),
      });
    } catch (e) {
      console.warn('Closure POST failed (may not be implemented yet):', e?.message || e);
    }

    setClosureModalVisible(false);
    setClosureDropdownOpen(false);
    setClosureNote('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1590&auto=format&fit=crop' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >

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
                <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
                  <Feather name="refresh-cw" size={14} color={COLORS.textMain} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.pageSubtitle}>
              {`Welcome, ${displayName}. Manage every student assistant's shifts from a single monthly view.`}
            </Text>
          </View>

          {/* --- STATS ROW --- */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIndicator, { backgroundColor: COLORS.primary }]} />
              <View>
                <Text style={styles.statLabel}>TOTAL SHIFTS</Text>
                <Text style={styles.statValue}>{totalShifts}</Text>
              </View>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIndicator, { backgroundColor: COLORS.success }]} />
              <View>
                <Text style={styles.statLabel}>ACTIVE ASSISTANTS</Text>
                <Text style={styles.statValue}>{activeAssistants}</Text>
              </View>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIndicator, { backgroundColor: '#F59E0B' }]} />
              <View>
                <Text style={styles.statLabel}>UPCOMING</Text>
                <Text style={styles.statValue}>{upcomingShifts}</Text>
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
                  const dateKey = `${displayedMonth.getFullYear()}-${String(displayedMonth.getMonth() + 1).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`;
                  const dayEvents = item.current ? shiftsByDate[dateKey] || [] : [];
                  const holidayName = item.current ? getHolidayName(dateKey) : null;
                  const isHoliday = !!holidayName;
                  const closure = item.current ? getClosureForDate(dateKey) : null;
                  const isClosure = !!closure;
                  const isSunday =
                    item.current &&
                    new Date(
                      displayedMonth.getFullYear(),
                      displayedMonth.getMonth(),
                      Number(item.day)
                    ).getDay() === 0;
                  const isPast =
                    item.current &&
                    isPastDate(
                      displayedMonth.getFullYear(),
                      displayedMonth.getMonth(),
                      Number(item.day)
                    );

                  const isInteractive =
                    item.current && !isSunday && !isHoliday && !isPast;
                  const isSelected = isInteractive && selectedDay === item.day;

                  const visibleEvents = isHoliday || isClosure
                    ? dayEvents.slice(0, 1)
                    : dayEvents.slice(0, MAX_VISIBLE_EVENTS);

                  return (
                    <TouchableOpacity
                      key={item.key || index}
                      style={[
                        styles.dayCell,
                        !item.current && styles.dayCellOffMonth,
                        isSunday && styles.dayCellSunday,
                        isHoliday && styles.dayCellHoliday,
                        isClosure && styles.dayCellClosure,
                        isPast && styles.dayCellPast,
                        isSelected && styles.dayCellSelected,
                      ]}
                      onPress={() => handleDayPress(item)}
                      disabled={!isInteractive}
                      activeOpacity={isInteractive ? 0.7 : 1}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          !item.current && styles.dayTextMuted,
                          isSunday && styles.dayTextSunday,
                          isHoliday && styles.dayTextHoliday,
                          isClosure && styles.dayTextClosure,
                          isPast && styles.dayTextPast,
                        ]}
                      >
                        {item.day}
                      </Text>

                      {isHoliday && (
                        <Text style={styles.holidayLabel} numberOfLines={1}>
                          {holidayName.toUpperCase()}
                        </Text>
                      )}

                      {isClosure && (
                        <Text style={styles.closureLabel} numberOfLines={1}>
                          {String(closure.type || 'Closure').toUpperCase()}
                        </Text>
                      )}

                      <View style={styles.eventsStack}>
                        {item.current && visibleEvents.map((event, idx) => (
                          <View
                            key={event.id || idx}
                            style={[
                              styles.eventTag,
                              {
                                backgroundColor: event.color,
                                borderColor: event.color,
                                opacity: isPast ? 0.55 : 1,
                              },
                            ]}
                          >
                            <Text
                              style={[styles.eventText, { color: event.textColor }]}
                              numberOfLines={1}
                            >
                              {event.title}
                            </Text>
                            {!!event.time && (
                              <Text
                                style={[styles.eventTimeText, { color: event.textColor }]}
                                numberOfLines={1}
                              >
                                {event.time}
                              </Text>
                            )}
                          </View>
                        ))}
                      </View>

                      {item.current && dayEvents.length > visibleEvents.length && (
                        <Text style={styles.moreEventsText}>
                          +{dayEvents.length - visibleEvents.length} more
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.legendContainer}>
              <Text style={styles.legendTitle}>LEGEND — ASSISTANT COLOURS</Text>
              <View style={styles.legendRow}>
                {assistants.slice(0, 6).map((assistant) => (
                  <View key={assistant.id} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colorForUser(assistant.id) }]} />
                    <Text style={styles.legendText}>
                      {assistant.name || assistant.first_name || 'Assistant'}
                    </Text>
                  </View>
                ))}
                {assistants.length === 0 && (
                  <Text style={styles.legendText}>No assistants yet</Text>
                )}
              </View>
              <View style={styles.legendDescRow}>
                <Text style={styles.legendDesc}><Text style={{ color: '#10B981' }}>■</Text> Green box - Holiday (locked)</Text>
                <Text style={styles.legendDesc}><Text style={{ color: '#9CA3AF' }}>■</Text> Grey box - Sunday (locked)</Text>
                <Text style={styles.legendDesc}><Text style={{ color: '#E5E7EB' }}>■</Text> Light grey - Past day (locked)</Text>
                <Text style={styles.legendDesc}><Text style={{ color: '#EF4444' }}>■</Text> Red box - Closure (no new shifts)</Text>
              </View>
            </View>
          </View>

          {/* --- SIDEBAR PANELS --- */}
          <View style={styles.sidePanel}>
            {/* Closure management (compact — day info removed) */}
            <View style={styles.panelCard}>
              <View style={styles.panelHeader}>
                <Feather name="bell" size={16} color={COLORS.danger} />
                <Text style={styles.panelTitle}>Closure management</Text>
              </View>
              <Text style={styles.panelSubtitle}>
                Declare a strike or library closure for any future working day.
              </Text>
              <TouchableOpacity
                style={styles.closureButton}
                onPress={openClosureModal}
              >
                <Feather name="bell" size={14} color={COLORS.danger} />
                <Text style={styles.closureButtonText}>Declare institutional closure</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.panelCard, styles.tipsCard]}>
              <View style={styles.panelHeader}>
                <Feather name="shield" size={16} color={COLORS.success} />
                <Text style={styles.panelTitle}>Scheduling Tips</Text>
              </View>
              <Text style={styles.tipText}>• Every assistant has a unique colour used on all their shifts.</Text>
              <Text style={styles.tipText}>• Days show up to {MAX_VISIBLE_EVENTS} shifts before collapsing.</Text>
              <Text style={styles.tipText}>• Past days, Sundays, and holidays are locked for scheduling.</Text>
              <Text style={styles.tipText}>• Closure days (red) block new shifts automatically.</Text>
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

            {selectedHoliday && (
              <View style={styles.holidayBanner}>
                <Feather name="sun" size={16} color="#10B981" />
                <Text style={styles.holidayBannerText}>{selectedHoliday}</Text>
              </View>
            )}

            {selectedClosure && (
              <View style={styles.closureBanner}>
                <Feather name="alert-octagon" size={16} color="#991B1B" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.closureBannerText}>{selectedClosure.type}</Text>
                  {!!selectedClosure.note && (
                    <Text style={styles.closureBannerSub} numberOfLines={2}>
                      {selectedClosure.note}
                    </Text>
                  )}
                </View>
              </View>
            )}

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {getSelectedDayEvents().length === 0 ? (
                <View style={styles.modalEmptyState}>
                  <Feather name="coffee" size={32} color={COLORS.textMuted} />
                  <Text style={styles.modalEmptyText}>No activities scheduled for this day.</Text>
                </View>
              ) : (
                getSelectedDayEvents().map((event, index) => (
                  <View key={index} style={styles.modalEventRow}>
                    <View style={[styles.modalEventIndicator, { backgroundColor: event.color }]} />
                    <View style={styles.modalEventDetails}>
                      <Text style={styles.modalEventTitle}>{event.title}</Text>
                      <Text style={styles.modalEventType}>{event.type}</Text>
                    </View>
                    <View style={[styles.modalEventColorDot, { backgroundColor: event.color }]} />
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCloseButtonOutline}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCloseOutlineText}>Close</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalNewShiftButton,
                  !!selectedClosure && styles.modalNewShiftButtonDisabled,
                ]}
                onPress={handleNewShiftFromPopup}
                disabled={!!selectedClosure}
                activeOpacity={selectedClosure ? 1 : 0.7}
              >
                <Feather
                  name={selectedClosure ? 'lock' : 'plus'}
                  size={16}
                  color="#FFF"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.modalNewShiftText}>
                  {selectedClosure ? 'Closure day' : 'New Shift'}
                </Text>
              </TouchableOpacity>
            </View>
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
              <View style={{ flex: 1 }}>
                <Text style={styles.newShiftTitle}>Schedule New Shift</Text>
                <Text style={styles.newShiftSubtitle}>
                  Assign a shift to a student assistant.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setNewShiftModalVisible(false);
                  setAssistantDropdownOpen(false);
                  setPositionDropdownOpen(false);
                }}
                style={styles.modalCloseIcon}
              >
                <Feather name="x" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.dateChip}>
              <Feather name="calendar" size={14} color={COLORS.primary} />
              <Text style={styles.dateChipText}>
                {formatDateForDisplay(selectedDate) || 'No date selected'}
              </Text>
              <View style={styles.dateChipLocked}>
                <Feather name="lock" size={11} color={COLORS.textMuted} />
                <Text style={styles.dateChipLockedText}>Locked</Text>
              </View>
            </View>

            <ScrollView style={styles.newShiftFormScroll} showsVerticalScrollIndicator={false}>

              <Text style={[styles.formLabel, { marginTop: 8 }]}>
                Student Assistant <Text style={{ color: COLORS.danger }}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.formDropdown}
                onPress={() => {
                  setAssistantDropdownOpen(!isAssistantDropdownOpen);
                  setPositionDropdownOpen(false);
                }}
                activeOpacity={0.7}
              >
                {selectedAssistant ? (
                  <View style={styles.selectedAssistantRow}>
                    <View
                      style={[
                        styles.assistantAvatarSmall,
                        { backgroundColor: colorForUser(selectedAssistant.id) },
                      ]}
                    >
                      <Text style={styles.assistantAvatarText}>
                        {(selectedAssistant.name || selectedAssistant.first_name || 'A')
                          .charAt(0)
                          .toUpperCase()}
                      </Text>
                    </View>
                    <Text
                      style={[styles.formDropdownText, { color: COLORS.textMain }]}
                      numberOfLines={1}
                    >
                      {selectedAssistant.name ||
                        selectedAssistant.first_name ||
                        'Assistant'}
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={[styles.formDropdownText, { color: COLORS.textMuted }]}
                    numberOfLines={1}
                  >
                    {assistants.length === 0
                      ? 'No student assistants available'
                      : 'Select a student assistant...'}
                  </Text>
                )}
                <Feather
                  name={isAssistantDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>

              {isAssistantDropdownOpen && (
                <View style={styles.assistantDropdownList}>
                  {assistants.length === 0 ? (
                    <View style={styles.dropdownEmptyRow}>
                      <Text style={styles.dropdownEmptyText}>
                        No student assistants found.
                      </Text>
                    </View>
                  ) : (
                    assistants.map((assistant) => {
                      const isSelected = selectedAssistant?.id === assistant.id;
                      const label =
                        assistant.name ||
                        `${assistant.first_name || ''} ${assistant.last_name || ''}`.trim() ||
                        'Assistant';
                      const color = colorForUser(assistant.id);
                      return (
                        <TouchableOpacity
                          key={assistant.id}
                          style={[
                            styles.assistantDropdownItem,
                            isSelected && styles.assistantDropdownItemSelected,
                          ]}
                          onPress={() => {
                            setSelectedAssistant(assistant);
                            setAssistantDropdownOpen(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.assistantAvatar,
                              { backgroundColor: color },
                            ]}
                          >
                            <Text style={styles.assistantAvatarText}>
                              {label.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.assistantDropdownText,
                                isSelected && styles.dropdownOptionTextSelected,
                              ]}
                              numberOfLines={1}
                            >
                              {label}
                            </Text>
                            {!!assistant.studentNumber && (
                              <Text style={styles.assistantDropdownMeta}>
                                {assistant.studentNumber}
                              </Text>
                            )}
                          </View>
                          <View style={[styles.assistantColorSwatch, { backgroundColor: color }]} />
                          {isSelected && (
                            <Feather name="check" size={16} color={COLORS.primary} />
                          )}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              )}

              <Text style={styles.formLabel}>Position</Text>
              <TouchableOpacity
                style={styles.formDropdown}
                onPress={() => {
                  setPositionDropdownOpen(!isPositionDropdownOpen);
                  setAssistantDropdownOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.formDropdownText}>{selectedPosition}</Text>
                <Feather
                  name={isPositionDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>

              {isPositionDropdownOpen && (
                <View style={styles.positionDropdownList}>
                  {POSITION_OPTIONS.map((option, index) => {
                    const isSelected = selectedPosition === option;
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.positionDropdownItem,
                          index === POSITION_OPTIONS.length - 1 && { borderBottomWidth: 0 },
                        ]}
                        onPress={() => {
                          setSelectedPosition(option);
                          setPositionDropdownOpen(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            isSelected && styles.dropdownOptionTextSelected,
                          ]}
                        >
                          {option}
                        </Text>
                        {isSelected && (
                          <Feather name="check" size={16} color={COLORS.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Shift duration</Text>
                  <TextInput
                    style={styles.formInputFull}
                    placeholder="e.g. 4 hours"
                    placeholderTextColor={COLORS.textMuted}
                    value={shiftDuration}
                    onChangeText={setShiftDuration}
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Starting time</Text>
                  <TextInput
                    style={styles.formInputFull}
                    placeholder="e.g. 08:00"
                    placeholderTextColor={COLORS.textMuted}
                    value={shiftStartTime}
                    onChangeText={setShiftStartTime}
                  />
                </View>
              </View>

              <Text style={styles.formLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.formInputFull, styles.formTextArea]}
                placeholder="Any additional instructions..."
                placeholderTextColor={COLORS.textMuted}
                multiline={true}
                numberOfLines={4}
                value={shiftNotes}
                onChangeText={setShiftNotes}
              />

            </ScrollView>

            <View style={styles.newShiftFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setNewShiftModalVisible(false);
                  setAssistantDropdownOpen(false);
                  setPositionDropdownOpen(false);
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={() => {
                  if (!selectedAssistant) {
                    Alert.alert('Missing assistant', 'Please select a student assistant.');
                    return;
                  }
                  if (!selectedDate) {
                    Alert.alert('Missing date', 'No date was selected. Please reopen from a calendar day.');
                    return;
                  }
                  const dateKey = String(selectedDate).replace(/\//g, '-');
                  if (getClosureForDate(dateKey)) {
                    Alert.alert(
                      'Closure day',
                      'This day is marked as a closure. Please pick another day.'
                    );
                    return;
                  }
                  // TODO: POST to /api/shifts
                  setNewShiftModalVisible(false);
                  setAssistantDropdownOpen(false);
                  setPositionDropdownOpen(false);
                }}
              >
                <Feather name="plus" size={16} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.submitBtnText}>Create Shift</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      {/* --- DECLARE INSTITUTIONAL CLOSURE MODAL --- */}
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

            <View style={styles.closureIconContainer}>
              <Feather name="bell" size={24} color={COLORS.danger} />
            </View>

            <Text style={styles.closureModalTitle}>Declare institutional closure</Text>

            <Text style={styles.closureModalDescription}>
              {formatDateForDisplay(closureDate) || 'Selected date'} will be marked as an institutional closure on the calendar, blocked for leave and swap requests, and all student assistants will be notified.
            </Text>

            <View style={styles.formLabelContainer}>
              <Text style={styles.formLabel}>
                Closure date <Text style={{ color: COLORS.danger }}>*</Text>
              </Text>
            </View>
            <TouchableOpacity
              style={styles.formInputContainer}
              onPress={() => openCalendarPicker('closure')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.formInput,
                  { color: closureDate ? COLORS.textMain : COLORS.textMuted },
                ]}
              >
                {formatDateForDisplay(closureDate) || 'Pick a date'}
              </Text>
              <Feather
                name="calendar"
                size={16}
                color={COLORS.primary}
                style={styles.formInputIcon}
              />
            </TouchableOpacity>

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
                onPress={handleDeclareClosure}
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

      {/* --- CUSTOM DATE PICKER MODAL (LAST, so it always appears on top) --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isCalendarVisible}
        onRequestClose={() => {
          setCalendarVisible(false);
          setCalendarTarget(null);
        }}
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

            <Text style={styles.calendarHint}>
              Past days, Sundays, holidays and closure days cannot be selected.
            </Text>

            <TouchableOpacity
              style={styles.calendarCloseButton}
              onPress={() => {
                setCalendarVisible(false);
                setCalendarTarget(null);
              }}
            >
              <Text style={styles.calendarCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
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

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 20,
    marginHorizontal: -16, marginTop: -16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 40, height: 40, marginRight: 10 },
  headerTextContainer: { justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textMain },
  headerSubtitle: {
    fontSize: 9, fontWeight: '600', color: 'red', letterSpacing: 1, marginTop: 2,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { marginLeft: 14 },

  titleSection: { marginBottom: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.darkBlue, fontFamily: 'serif' },
  actionButtons: { flexDirection: 'row' },
  refreshButton: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: COLORS.border,
    padding: 8, borderRadius: 6, marginRight: 8,
  },
  pageSubtitle: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },

  statsRow: { flexDirection: 'row', marginBottom: 16, justifyContent: 'space-between' },
  statCard: {
    flex: 1, backgroundColor: COLORS.card, padding: 12, borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 4,
  },
  statIndicator: { width: 4, height: 24, borderRadius: 2, marginRight: 8 },
  statLabel: { fontSize: 8, fontWeight: 'bold', color: COLORS.textMuted, letterSpacing: 0.5 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.darkBlue },

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

  gridContainer: { marginBottom: 16 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  weekDayText: { fontSize: 9, fontWeight: 'bold', color: COLORS.textMuted, width: '14.28%', textAlign: 'center' },
  daysContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: '14.28%', height: 78, borderBottomWidth: 1, borderRightWidth: 1,
    borderColor: COLORS.border, padding: 2, alignItems: 'center',
  },
  dayCellOffMonth: { backgroundColor: '#FAFAFA' },
  dayCellSelected: { backgroundColor: '#EFF6FF' },
  dayCellHoliday: { backgroundColor: '#ECFDF5' },
  dayCellSunday: { backgroundColor: '#F3F4F6' },
  dayCellPast: { backgroundColor: '#F9FAFB' },
  dayCellClosure: { backgroundColor: '#FEF2F2' },
  dayText: { fontSize: 11, fontWeight: 'bold', color: COLORS.textMain, marginTop: 2 },
  dayTextMuted: { color: '#D1D5DB' },
  dayTextHoliday: { color: '#10B981' },
  dayTextSunday: { color: '#9CA3AF' },
  dayTextPast: { color: '#C7CBD1' },
  dayTextClosure: { color: '#B91C1C' },
  holidayLabel: {
    fontSize: 6, color: '#10B981', fontWeight: 'bold',
    marginTop: 1, textAlign: 'center',
  },
  closureLabel: {
    fontSize: 6, color: '#B91C1C', fontWeight: 'bold',
    marginTop: 1, textAlign: 'center',
  },

  eventsStack: {
    width: '100%',
    marginTop: 3,
    gap: 2,
  },
  eventTag: {
    width: '100%',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    borderWidth: 1,
  },
  eventText: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  eventTimeText: {
    fontSize: 6,
    fontWeight: '600',
    opacity: 0.9,
    marginTop: 1,
  },
  moreEventsText: {
    fontSize: 6,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: 'bold',
  },

  legendContainer: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  legendTitle: { fontSize: 10, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 8, letterSpacing: 0.5 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 12, marginBottom: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  legendText: { fontSize: 10, color: COLORS.textMain, fontWeight: '600' },
  legendDescRow: { flexDirection: 'row', flexWrap: 'wrap' },
  legendDesc: { fontSize: 9, color: COLORS.textMuted, marginRight: 8, marginBottom: 4 },

  sidePanel: { marginBottom: 16 },
  panelCard: {
    backgroundColor: COLORS.card, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  panelDate: { fontSize: 18, fontWeight: 'bold', color: COLORS.darkBlue, marginBottom: 4 },
  panelSubtitle: { fontSize: 12, color: COLORS.textMuted, marginBottom: 12 },
  panelHolidayBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5',
    borderWidth: 1, borderColor: '#A7F3D0', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, marginBottom: 12,
  },
  panelHolidayText: { color: '#047857', fontWeight: 'bold', fontSize: 12, marginLeft: 6 },
  panelClosureBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2',
    borderWidth: 1, borderColor: '#FECACA', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, marginBottom: 12,
  },
  panelClosureText: { color: '#991B1B', fontWeight: 'bold', fontSize: 12, marginLeft: 6 },
  closureButton: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.danger, borderRadius: 6,
    paddingVertical: 8, marginBottom: 4,
  },
  closureButtonText: { color: COLORS.danger, fontSize: 12, fontWeight: 'bold', marginLeft: 6 },
  noShiftsBox: {
    backgroundColor: '#F9FAFB', padding: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  noShiftsText: { fontSize: 12, color: COLORS.textMuted },
  eventListRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  eventIndicator: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  eventListText: { fontSize: 12, color: COLORS.textMain, flex: 1 },

  tipsCard: { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' },
  panelHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  panelTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.textMain, marginLeft: 8 },
  tipText: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4, lineHeight: 16 },

  viewAllButton: {
    backgroundColor: COLORS.primary, paddingVertical: 10,
    borderRadius: 6, alignItems: 'center', marginTop: 12,
  },
  viewAllText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },

  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border,
    paddingTop: 10, position: 'absolute', bottom: 0, left: 0, right: 0,
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
  modalEventColorDot: { width: 14, height: 14, borderRadius: 7, marginLeft: 8 },
  modalEventDetails: { flex: 1 },
  modalEventTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 2 },
  modalEventType: { fontSize: 12, color: COLORS.textMuted },
  modalCloseButton: {
    backgroundColor: COLORS.primary, paddingVertical: 12,
    borderRadius: 8, alignItems: 'center',
  },
  modalCloseText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },

  modalFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 14,
  },
  modalCloseButtonOutline: {
    flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1,
    borderColor: COLORS.border, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  modalCloseOutlineText: { color: COLORS.textMain, fontSize: 14, fontWeight: '600' },
  modalNewShiftButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 8,
  },
  modalNewShiftButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  modalNewShiftText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },

  holidayBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5',
    borderWidth: 1, borderColor: '#A7F3D0', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12,
  },
  holidayBannerText: { color: '#047857', fontWeight: 'bold', fontSize: 13, marginLeft: 8 },

  closureBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2',
    borderWidth: 1, borderColor: '#FECACA', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12,
  },
  closureBannerText: { color: '#991B1B', fontWeight: 'bold', fontSize: 13, marginLeft: 8 },
  closureBannerSub: { color: '#7F1D1D', fontSize: 11, marginLeft: 8, marginTop: 2 },

  newShiftModalContainer: {
    width: '100%', maxWidth: 480, backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 8, maxHeight: '90%',
  },
  newShiftHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 14,
  },
  newShiftTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 4 },
  newShiftSubtitle: { fontSize: 14, color: COLORS.textMuted },
  newShiftFormScroll: { marginBottom: 20 },

  dateChip: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 16,
  },
  dateChipText: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginLeft: 8 },
  dateChipLocked: {
    flexDirection: 'row', alignItems: 'center', marginLeft: 10, paddingLeft: 10,
    borderLeftWidth: 1, borderLeftColor: '#BFDBFE',
  },
  dateChipLockedText: {
    fontSize: 10, color: COLORS.textMuted, fontWeight: '600',
    marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5,
  },

  formLabel: { fontSize: 12, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 6 },
  formLabelContainer: { alignSelf: 'flex-start', marginBottom: 6 },
  formInputContainer: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12,
    marginBottom: 16, backgroundColor: '#FFFFFF', width: '100%',
  },
  formInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: COLORS.textMain },
  formInputIcon: { marginLeft: 8 },
  formInputFull: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
    color: COLORS.textMain, marginBottom: 16, backgroundColor: '#FFFFFF',
  },
  formTextArea: { height: 90, textAlignVertical: 'top' },
  formDropdown: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 12, marginBottom: 4, backgroundColor: '#FFFFFF',
  },
  formDropdownText: { fontSize: 14, color: COLORS.textMain, flex: 1, marginRight: 8 },
  formRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  formCol: { flex: 1 },

  selectedAssistantRow: {
    flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 8,
  },
  assistantAvatarSmall: {
    width: 24, height: 24, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 8,
  },

  assistantDropdownList: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    marginBottom: 12, backgroundColor: '#FFFFFF', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 3, maxHeight: 240,
  },
  assistantDropdownItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  assistantDropdownItemSelected: { backgroundColor: '#EFF6FF' },
  assistantAvatar: {
    width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  assistantAvatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  assistantDropdownText: { fontSize: 14, color: COLORS.textMain },
  assistantDropdownMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  assistantColorSwatch: {
    width: 10, height: 10, borderRadius: 5, marginHorizontal: 8,
  },
  dropdownEmptyRow: { paddingVertical: 16, alignItems: 'center' },
  dropdownEmptyText: { fontSize: 13, color: COLORS.textMuted },

  positionDropdownList: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    marginBottom: 12, backgroundColor: '#FFFFFF', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  positionDropdownItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  dropdownOptionText: { fontSize: 14, color: COLORS.textMain },
  dropdownOptionTextSelected: { color: COLORS.primary, fontWeight: 'bold' },

  newShiftFooter: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: 12,
    borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 16,
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
  calendarDayCellDisabled: { opacity: 0.3 },
  calendarDayText: { fontSize: 12, color: COLORS.textMain },
  calendarDayTextSelected: { color: '#FFFFFF', fontWeight: 'bold' },
  calendarDayTextDisabled: { color: COLORS.textMuted },
  calendarHint: {
    fontSize: 11, color: COLORS.textMuted, textAlign: 'center',
    marginTop: 10, marginBottom: -4,
  },
  calendarCloseButton: {
    marginTop: 16, paddingVertical: 12, alignItems: 'center',
    borderRadius: 8, backgroundColor: COLORS.grayLight,
  },
  calendarCloseText: { fontSize: 14, fontWeight: 'bold', color: COLORS.textMain },

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