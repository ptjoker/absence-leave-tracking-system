// src/app/supCal.jsx
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import logoImg from '@/assets/images/logo.png';


const formatDate = (date) => {
  if (!date) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

// =====================================================
// CUSTOM DATE PICKER COMPONENT
// =====================================================
const CustomDatePicker = ({ visible, onClose, onSelect, initialDate }) => {
  const [viewDate, setViewDate] = useState(initialDate || new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push('');
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const handleSelectDay = (day) => {
    if (day === '') return;
    const selected = new Date(year, month, day);
    onSelect(selected);
    onClose();
  };

  const isSelected = (day) => {
    if (!initialDate || day === '') return false;
    return (
      day === initialDate.getDate() &&
      month === initialDate.getMonth() &&
      year === initialDate.getFullYear()
    );
  };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={styles.datePickerOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.datePickerContent} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View style={styles.datePickerHeader}>
            <Text style={styles.datePickerTitle}>Select Date</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={26} color="#A0AEC0" />
            </TouchableOpacity>
          </View>

          <View style={styles.datePickerNav}>
            <TouchableOpacity style={styles.datePickerNavBtn} onPress={handlePrevMonth}>
              <Ionicons name="chevron-back" size={18} color="#1E3A8A" />
            </TouchableOpacity>
            <Text style={styles.datePickerMonthText}>{MONTH_NAMES[month]} {year}</Text>
            <TouchableOpacity style={styles.datePickerNavBtn} onPress={handleNextMonth}>
              <Ionicons name="chevron-forward" size={18} color="#1E3A8A" />
            </TouchableOpacity>
          </View>

          <View style={styles.datePickerDaysRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <Text key={i} style={styles.datePickerDayLabel}>{d}</Text>
            ))}
          </View>

          <View style={styles.datePickerGrid}>
            {calendarDays.map((day, index) => (
              <TouchableOpacity key={index} style={styles.datePickerCell} onPress={() => handleSelectDay(day)} disabled={day === ''}>
                {day !== '' && (
                  <View style={[styles.datePickerDateCircle, isSelected(day) && styles.datePickerSelectedCircle]}>
                    <Text style={[styles.datePickerDateText, isSelected(day) && styles.datePickerSelectedText]}>{day}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.datePickerCancelBtn} onPress={onClose}>
            <Text style={styles.datePickerCancelText}>Cancel</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const AssistantCard = ({ item }) => (
  <View style={styles.assistantCard}>
    <View style={[styles.avatar, { backgroundColor: item.color }]}>
      <Text style={styles.avatarText}>{item.initials}</Text>
    </View>
    <View style={styles.assistantInfo}>
      <Text style={styles.assistantName}>{item.name}</Text>
      <Text style={styles.assistantRole}>{item.role}</Text>
    </View>
    <View style={[styles.statusBadge, item.status === 'PENDING' && styles.statusBadgePending]}>
      <Text style={[styles.statusText, item.status === 'PENDING' && styles.statusTextPending]}>{item.status}</Text>
    </View>
  </View>
);

export default function SupervisorDashboard() {
  const router = useRouter();
  
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 5)); 
  
  // STATE: Shift Records and Events
  const [shiftRecords, setShiftRecords] = useState(initialShiftRecords);
  const [events, setEvents] = useState({}); 

  // Add Event Modal
  const [isEventModalVisible, setIsEventModalVisible] = useState(false);
  const [eventDate, setEventDate] = useState(null);
  const [showEventDatePicker, setShowEventDatePicker] = useState(false);
  const [eventType, setEventType] = useState('Strike');
  const [eventTime, setEventTime] = useState('');

  // Assign Shift Modal
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState(assistants[0]?.name || '');
  const [selectedPosition, setSelectedPosition] = useState('Icenter');
  const [shiftDate, setShiftDate] = useState(null);
  const [showShiftDatePicker, setShowShiftDatePicker] = useState(false);
  const [shiftTime, setShiftTime] = useState('');
  const [shiftDuration, setShiftDuration] = useState('');

  // Day Details Modal
  const [isDayModalVisible, setIsDayModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  const monthNames = MONTH_NAMES;
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push('');
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const isToday = (day) => {
    const today = new Date(2026, 7, 5); 
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const getDateKey = (day, m = month, y = year) => {
    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(m + 1).padStart(2, '0');
    return `${y}-${monthStr}-${dayStr}`;
  };

  const handleDayPress = (day) => {
    if (day === '') return;
    const dateKey = getDateKey(day);
    
    setSelectedDay({
      day: day,
      month: monthNames[month],
      year: year,
      dateKey: dateKey,
      shifts: shiftRecords[dateKey] || [],
      events: events[dateKey] || [],
    });
    setIsDayModalVisible(true);
  };

  const handleEventDateSelect = (date) => setEventDate(date);
  const handleShiftDateSelect = (date) => setShiftDate(date);

  const handleAddEvent = () => {
    if (!eventDate || !eventTime) {
      alert("Please fill in the date and time of the event.");
      return;
    }
    
    const m = eventDate.getMonth();
    const y = eventDate.getFullYear();
    const dateKey = getDateKey(eventDate.getDate(), m, y);
    
    const newEvent = {
      id: Date.now(),
      type: eventType,
      time: eventTime,
    };

    setEvents(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), newEvent]
    }));

    alert(`Event Added!\nDate: ${formatDate(eventDate)}\nType: ${eventType}\nTime: ${eventTime}`);
    
    setEventDate(null);
    setEventType('Strike');
    setEventTime('');
    setIsEventModalVisible(false);
  };

  const handleAssignShift = () => {
    if (!shiftDate || !shiftTime || !shiftDuration) {
      alert("Please fill in all fields including the date.");
      return;
    }

    const m = shiftDate.getMonth();
    const y = shiftDate.getFullYear();
    const dateKey = getDateKey(shiftDate.getDate(), m, y);

    const selectedAsst = assistants.find(a => a.name === selectedAssistant) || assistants[0];
    
    const newShift = {
      id: Date.now(),
      assistant: selectedAssistant,
      initials: selectedAsst.initials,
      position: selectedPosition,
      time: shiftTime,
      hours: `${shiftDuration}h`,
      color: selectedAsst.color,
    };

    setShiftRecords(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), newShift]
    }));

    alert(`Shift Assigned!\nAssistant: ${selectedAssistant}\nPosition: ${selectedPosition}\nDate: ${formatDate(shiftDate)}\nTime: ${shiftTime}\nDuration: ${shiftDuration} hours`);
    
    setSelectedPosition('Icenter');
    setShiftDate(null);
    setShiftTime('');
    setShiftDuration('');
    setIsAssignModalVisible(false);
  };

  const getTotalHours = () => {
    if (!selectedDay || !selectedDay.shifts) return 0;
    return selectedDay.shifts.reduce((total, shift) => {
      const hours = parseFloat(shift.hours.replace('h', ''));
      return total + hours;
    }, 0);
  };

  const hasClosingEvent = selectedDay && selectedDay.events && selectedDay.events.some(
    event => event.type === 'Strike' || event.type === 'Library Closure'
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      
      {/* --- UPDATED Header (matches design in the image) --- */}
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
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={22} color="#1E3A8A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/logOut')}>
            <Ionicons name="log-out-outline" size={22} color="#1E3A8A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.portalHeader}>
          <Ionicons name="desktop-outline" size={16} color="#1E3A8A" style={styles.portalIcon} />
          <Text style={styles.portalTitle}>SUPERVISOR PORTAL</Text>
        </View>
        <Text style={styles.pageTitle}>{monthNames[month]} Schedule</Text>
        <Text style={styles.pageSubtitle}>
          Manage student shifts and academic closures for the current term.
        </Text>

        {/* CALENDAR CARD */}
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <View>
              <Text style={styles.calendarMonth}>{monthNames[month]} {year}</Text>
              <Text style={styles.calendarSubtext}>12 ACTIVE SHIFTS</Text>
            </View>
            <View style={styles.calendarNav}>
              <TouchableOpacity style={styles.navArrow} onPress={handlePrevMonth}>
                <Ionicons name="chevron-back" size={16} color="#1E3A8A" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.navArrow} onPress={handleNextMonth}>
                <Ionicons name="chevron-forward" size={16} color="#1E3A8A" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.daysRow}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, index) => (
              <Text key={index} style={styles.dayLabel}>{day}</Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarDays.map((day, index) => {
              const dateKey = day !== '' ? getDateKey(day) : null;
              const hasShift = dateKey && shiftRecords[dateKey] && shiftRecords[dateKey].length > 0;
              const dayEvents = dateKey && events[dateKey] ? events[dateKey] : [];
              const hasEvent = dayEvents.length > 0;

              return (
                <TouchableOpacity 
                  key={index} 
                  style={styles.calendarCell}
                  onPress={() => handleDayPress(day)}
                  disabled={day === ''}
                  activeOpacity={0.7}
                >
                  {day !== '' && (
                    <View style={[styles.dateCircle, isToday(day) && styles.activeDate]}>
                      <Text style={[styles.dateText, isToday(day) && styles.activeDateText]}>
                        {day}
                      </Text>
                    </View>
                  )}
                  
                  {day !== '' && (hasShift || hasEvent) && (
                    <View style={styles.dotContainer}>
                      {hasShift && <View style={[styles.dot, { backgroundColor: '#2563EB' }]} />}
                      {dayEvents.map(e => (
                        <View key={e.id} style={[styles.dot, { backgroundColor: e.type === 'Strike' ? '#1A202C' : '#DC2626' }]} />
                      ))}
                    </View>
                  )}
                  
                  {isToday(day) && <Text style={styles.todayLabel}>TODAY</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#DC2626' }]} />
              <Text style={styles.legendText}>Library Closures</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#1A202C' }]} />
              <Text style={styles.legendText}>Strike</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#2563EB' }]} />
              <Text style={styles.legendText}>Daily Shift</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="people-outline" size={18} color="#1E3A8A" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Student Assistant Assignments</Text>
          </View>
          <View style={styles.assignedBadge}>
            <Text style={styles.assignedBadgeText}>3 Assigned</Text>
          </View>
        </View>

        {assistants.map((item) => (
          <AssistantCard key={item.id} item={item} />
        ))}

        <View style={styles.scheduledCard}>
          <View style={styles.scheduledIconContainer}>
            <Ionicons name="time-outline" size={20} color="#1E3A8A" />
          </View>
          <Text style={styles.scheduledText}>TOTAL SCHEDULED</Text>
          <Text style={styles.scheduledValue}>h</Text>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailsHeader}>
            <View style={styles.detailsIconContainer}>
              <Ionicons name="calendar" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.eventBadge}>
              <Text style={styles.eventBadgeText}>Event</Text>
            </View>
          </View>
          
          <Text style={styles.detailsTitle}>August 5 Details</Text>
          <Text style={styles.detailsSubtitle}>Jordan Workshop</Text>
          
          <Text style={styles.detailsDescription}>
            Standard operation hours. Use the actions below to assign staff or record absence.
          </Text>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity 
              style={styles.assignButton} 
              onPress={() => setIsAssignModalVisible(true)}
            >
              <Ionicons name="person-add-outline" size={18} color="#1E3A8A" style={{ marginRight: 6 }} />
              <Text style={styles.assignButtonText}>Assign</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.addEventButton} 
              onPress={() => setIsEventModalVisible(true)}
            >
              <Ionicons name="add-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.addEventButtonText}>Add Event</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* --- BOTTOM NAVIGATION --- */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => router.push('/supervisorDash')}
        >
          <Ionicons name="grid-outline" size={24} color="#6B7280" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/supRequest')}>
          <View style={styles.navIconContainer}>
            <Ionicons name="document-text-outline" size={24} color="#6B7280" />
            <View style={styles.navBadge}>
              <Text style={styles.navBadgeText}>1</Text>
            </View>
          </View>
          <Text style={styles.navText}>Requests</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="calendar-outline" size={24} color="#6B7280" />
          <Text style={styles.navText}>Calendar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/supReport')}>
          <Ionicons name="bar-chart-outline" size={24} color="#6B7280" />
          <Text style={styles.navText}>Reports</Text>
        </TouchableOpacity>
      </View>

      {/* --- DAY DETAILS MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isDayModalVisible}
        onRequestClose={() => setIsDayModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.dayModalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {selectedDay ? `${selectedDay.month} ${selectedDay.day}, ${selectedDay.year}` : ''}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {selectedDay && (selectedDay.shifts.length > 0 || selectedDay.events.length > 0)
                    ? `${selectedDay.shifts.length} shift(s) & ${selectedDay.events.length} event(s)`
                    : 'Nothing scheduled'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsDayModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#A0AEC0" />
              </TouchableOpacity>
            </View>

            <View style={styles.totalHoursCard}>
              <View style={styles.totalHoursIconContainer}>
                <Ionicons name="time-outline" size={20} color="#1E3A8A" />
              </View>
              <View style={styles.totalHoursTextContainer}>
                <Text style={styles.totalHoursLabel}>TOTAL WORKING HOURS</Text>
                <Text style={styles.totalHoursValue}>{getTotalHours()}h</Text>
              </View>
            </View>

            <ScrollView style={styles.shiftsList} showsVerticalScrollIndicator={false}>
              
              {selectedDay && selectedDay.events.length > 0 && (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionHeaderTitle}>EVENTS</Text>
                  {selectedDay.events.map((event) => (
                    <View key={event.id} style={styles.eventCard}>
                      <View style={styles.eventCardHeader}>
                        <Ionicons 
                          name={event.type === 'Strike' ? 'alert-circle' : 'library'} 
                          size={18} 
                          color={event.type === 'Strike' ? '#1A202C' : '#DC2626'} 
                          style={{ marginRight: 8 }}
                        />
                        <Text style={styles.eventTypeText}>{event.type}</Text>
                      </View>
                      <View style={styles.shiftTimeRow}>
                        <Ionicons name="time-outline" size={14} color="#4A5568" style={{ marginRight: 6 }} />
                        <Text style={styles.shiftTimeText}>{event.time}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {selectedDay && selectedDay.shifts.length > 0 ? (
                selectedDay.shifts.map((shift) => (
                  <View key={shift.id} style={styles.shiftCard}>
                    <View style={styles.shiftHeader}>
                      <View style={styles.shiftHeaderLeft}>
                        <View style={[styles.shiftAvatar, { backgroundColor: shift.color }]}>
                          <Text style={styles.shiftAvatarText}>{shift.initials}</Text>
                        </View>
                        <View>
                          <Text style={styles.shiftAssistantName}>{shift.assistant}</Text>
                          <View style={styles.shiftPositionRow}>
                            <Ionicons name="location-outline" size={12} color="#718096" />
                            <Text style={styles.shiftPosition}>{shift.position}</Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.shiftHoursBadge}>
                        <Text style={styles.shiftHoursText}>{shift.hours}</Text>
                      </View>
                    </View>
                    <View style={styles.shiftTimeRow}>
                      <Ionicons name="time-outline" size={14} color="#4A5568" style={{ marginRight: 6 }} />
                      <Text style={styles.shiftTimeText}>{shift.time}</Text>
                    </View>
                  </View>
                ))
              ) : (
                selectedDay && selectedDay.events.length === 0 && (
                  <View style={styles.emptyState}>
                    <Ionicons name="calendar-outline" size={48} color="#CBD5E0" />
                    <Text style={styles.emptyStateText}>Nothing scheduled for this day</Text>
                  </View>
                )
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.closeModalButton} 
                onPress={() => setIsDayModalVisible(false)}
              >
                <Text style={styles.closeModalButtonText}>Close</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.assignModalButton, hasClosingEvent && styles.disabledButton]} 
                onPress={() => {
                  if (hasClosingEvent) return;
                  setIsDayModalVisible(false);
                  setIsAssignModalVisible(true);
                }}
                disabled={hasClosingEvent}
              >
                <Ionicons 
                  name="add-outline" 
                  size={18} 
                  color={hasClosingEvent ? '#E2E8F0' : '#FFFFFF'} 
                  style={{ marginRight: 6 }} 
                />
                <Text style={[
                  styles.assignModalButtonText, 
                  hasClosingEvent && { color: '#E2E8F0' }
                ]}>
                  Assign Shift
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- ADD EVENT MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEventModalVisible}
        onRequestClose={() => setIsEventModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Event</Text>
              <TouchableOpacity onPress={() => setIsEventModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#A0AEC0" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Date of Event</Text>
            <TouchableOpacity 
              style={styles.inputWrapper} 
              onPress={() => setShowEventDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={18} color="#A0AEC0" style={styles.inputIcon} />
              <Text style={[styles.input, !eventDate && { color: '#A0AEC0' }]}>
                {eventDate ? formatDate(eventDate) : 'Tap to select a date'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#A0AEC0" />
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Event Type</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={eventType}
                onValueChange={(itemValue) => setEventType(itemValue)}
                style={styles.picker}
                dropdownIconColor="#1E3A8A"
              >
                <Picker.Item label="Strike" value="Strike" />
                <Picker.Item label="Library Closure" value="Library Closure" />
              </Picker>
            </View>

            <Text style={styles.inputLabel}>Time of Event</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="time-outline" size={18} color="#A0AEC0" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. 14:00 - 16:00"
                placeholderTextColor="#A0AEC0"
                value={eventTime}
                onChangeText={setEventTime}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEventModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleAddEvent}>
                <Text style={styles.saveButtonText}>Add Event</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- ASSIGN SHIFT MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isAssignModalVisible}
        onRequestClose={() => setIsAssignModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Shift</Text>
              <TouchableOpacity onPress={() => setIsAssignModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#A0AEC0" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Student Assistant</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedAssistant}
                onValueChange={(itemValue) => setSelectedAssistant(itemValue)}
                style={styles.picker}
                dropdownIconColor="#1E3A8A"
              >
                {assistants.map((assistant) => (
                  <Picker.Item key={assistant.id} label={assistant.name} value={assistant.name} />
                ))}
              </Picker>
            </View>

            <Text style={styles.inputLabel}>Position</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedPosition}
                onValueChange={(itemValue) => setSelectedPosition(itemValue)}
                style={styles.picker}
                dropdownIconColor="#1E3A8A"
              >
                <Picker.Item label="Icenter" value="Icenter" />
                <Picker.Item label="Help desk" value="Help desk" />
              </Picker>
            </View>

            <Text style={styles.inputLabel}>Date of Shift</Text>
            <TouchableOpacity 
              style={styles.inputWrapper} 
              onPress={() => setShowShiftDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={18} color="#A0AEC0" style={styles.inputIcon} />
              <Text style={[styles.input, !shiftDate && { color: '#A0AEC0' }]}>
                {shiftDate ? formatDate(shiftDate) : 'Tap to select a date'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#A0AEC0" />
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Shift Time</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="time-outline" size={18} color="#A0AEC0" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. 14:00 - 16:00"
                placeholderTextColor="#A0AEC0"
                value={shiftTime}
                onChangeText={setShiftTime}
              />
            </View>

            <Text style={styles.inputLabel}>Duration (Hours)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="hourglass-outline" size={18} color="#A0AEC0" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. 2"
                placeholderTextColor="#A0AEC0"
                keyboardType="numeric"
                value={shiftDuration}
                onChangeText={setShiftDuration}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setIsAssignModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleAssignShift}>
                <Text style={styles.saveButtonText}>Assign</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- CUSTOM DATE PICKERS --- */}
      <CustomDatePicker
        visible={showEventDatePicker}
        onClose={() => setShowEventDatePicker(false)}
        onSelect={handleEventDateSelect}
        initialDate={eventDate}
      />
      <CustomDatePicker
        visible={showShiftDatePicker}
        onClose={() => setShowShiftDatePicker(false)}
        onSelect={handleShiftDateSelect}
        initialDate={shiftDate}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#8FB3D9' },
  
  // --- UPDATED Header Styles (white background, logo, dark text) ---
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
  
  scrollContent: { padding: 20, paddingBottom: 100 },
  portalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  portalIcon: { marginRight: 6 },
  portalTitle: { fontSize: 11, fontWeight: '800', color: '#1E3A8A', letterSpacing: 0.5 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#1A202C', marginBottom: 6 },
  pageSubtitle: { fontSize: 14, color: '#4A5568', marginBottom: 20 },
  
  calendarCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  calendarMonth: { fontSize: 18, fontWeight: '700', color: '#1A202C' },
  calendarSubtext: { fontSize: 11, fontWeight: '600', color: '#718096', marginTop: 2 },
  calendarNav: { flexDirection: 'row' },
  navArrow: { padding: 8, backgroundColor: '#EDF2F7', borderRadius: 6, marginLeft: 8 },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  dayLabel: { width: '14%', textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#718096' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarCell: { width: '14%', alignItems: 'center', marginBottom: 12, height: 44, justifyContent: 'flex-start' },
  dateCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  activeDate: { backgroundColor: '#1E3A8A' },
  dateText: { fontSize: 13, fontWeight: '600', color: '#1A202C' },
  activeDateText: { color: '#FFFFFF' },
  todayLabel: { fontSize: 8, fontWeight: '800', color: '#1E3A8A', position: 'absolute', bottom: -6 },
  
  dotContainer: { flexDirection: 'row', marginTop: 2, height: 6, alignItems: 'center' },
  dot: { width: 5, height: 5, borderRadius: 2.5, marginHorizontal: 1 },

  legendRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendText: { fontSize: 10, color: '#4A5568', fontWeight: '500' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  sectionIcon: { marginRight: 6 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1E3A8A' },
  assignedBadge: { backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  assignedBadgeText: { fontSize: 11, fontWeight: '700', color: '#1E3A8A' },
  assistantCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#6B46C1' },
  assistantInfo: { flex: 1 },
  assistantName: { fontSize: 15, fontWeight: '700', color: '#1A202C', marginBottom: 2 },
  assistantRole: { fontSize: 12, color: '#718096' },
  statusBadge: { borderWidth: 1, borderColor: '#1E3A8A', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  statusBadgePending: { borderColor: '#A0AEC0' },
  statusText: { fontSize: 9, fontWeight: '700', color: '#1E3A8A', letterSpacing: 0.5 },
  statusTextPending: { color: '#A0AEC0' },
  scheduledCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.4)', borderRadius: 12, padding: 16, marginTop: 6, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.6)' },
  scheduledIconContainer: { marginRight: 12 },
  scheduledText: { flex: 1, fontSize: 12, fontWeight: '800', color: '#1E3A8A', letterSpacing: 0.5 },
  scheduledValue: { fontSize: 20, fontWeight: '800', color: '#1E3A8A' },
  detailsCard: { backgroundColor: '#1E3A8A', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, marginBottom: 20 },
  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  detailsIconContainer: { width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
  eventBadge: { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  eventBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  detailsTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  detailsSubtitle: { fontSize: 14, color: '#A0C1DD', marginBottom: 16 },
  detailsDescription: { fontSize: 13, color: '#E2E8F0', lineHeight: 20, marginBottom: 20 },
  actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  assignButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderRadius: 8, paddingVertical: 14, marginRight: 8 },
  assignButtonText: { fontSize: 14, fontWeight: '700', color: '#1E3A8A' },
  addEventButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', borderWidth: 1, borderColor: '#FFFFFF', borderRadius: 8, paddingVertical: 14, marginLeft: 8 },
  addEventButtonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, justifyContent: 'space-around', alignItems: 'center' },
  navItem: { alignItems: 'center', justifyContent: 'center' },
  navIconContainer: { position: 'relative' },
  navBadge: { position: 'absolute', top: -4, right: -6, backgroundColor: '#EF4444', borderRadius: 8, width: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
  navBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
  navText: { fontSize: 12, color: '#6B7280', marginTop: 4, fontWeight: '500' },
  navTextActive: { color: '#2563EB', fontWeight: '700' },

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
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A202C',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#718096',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 8,
  },
  pickerWrapper: {
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    marginBottom: 20,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 50,
    color: '#1A202C',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
    marginBottom: 24,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1A202C',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#EDF2F7',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A5568',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  dayModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  totalHoursCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  totalHoursIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  totalHoursTextContainer: {
    flex: 1,
  },
  totalHoursLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E3A8A',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  totalHoursValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A202C',
  },
  shiftsList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  shiftCard: {
    backgroundColor: '#F7FAFC',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  shiftHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shiftAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  shiftAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shiftAssistantName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 2,
  },
  shiftPositionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shiftPosition: {
    fontSize: 11,
    color: '#718096',
    marginLeft: 4,
  },
  shiftHoursBadge: {
    backgroundColor: '#1E3A8A',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  shiftHoursText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shiftTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  shiftTimeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A5568',
  },
  
  sectionContainer: { marginBottom: 16 },
  sectionHeaderTitle: { fontSize: 12, fontWeight: '800', color: '#1E3A8A', letterSpacing: 0.5, marginBottom: 8 },
  eventCard: { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#FECACA' },
  eventCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  eventTypeText: { fontSize: 14, fontWeight: '700', color: '#1A202C' },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#A0AEC0',
    marginTop: 10,
    fontStyle: 'italic',
  },
  closeModalButton: {
    flex: 1,
    backgroundColor: '#EDF2F7',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 8,
  },
  closeModalButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A5568',
  },
  assignModalButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  assignModalButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  disabledButton: {
    backgroundColor: '#A0AEC0',
    opacity: 0.7,
  },

  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  datePickerContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  datePickerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A202C',
  },
  datePickerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  datePickerNavBtn: {
    padding: 8,
    backgroundColor: '#EDF2F7',
    borderRadius: 6,
  },
  datePickerMonthText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A202C',
  },
  datePickerDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  datePickerDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#718096',
  },
  datePickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  datePickerCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickerDateCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerSelectedCircle: {
    backgroundColor: '#1E3A8A',
  },
  datePickerDateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A202C',
  },
  datePickerSelectedText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  datePickerCancelBtn: {
    backgroundColor: '#EDF2F7',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  datePickerCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A5568',
  },
});