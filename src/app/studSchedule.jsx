import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';
import ScreenShell from '../components/studentDash/ScreenShell';
import { AppButton, Card } from '../components/studentDash/ui';
import {
    MONTHS,
    MONTHS_SHORT,
    WEEKDAYS,
    WEEKDAYS_LONG,
    buildMonthGrid,
    fromKey,
    getDayInfo,
    toKey,
} from '../constants/studData';
import { useStudTheme } from '../constants/studTheme';

const CELL_H = 64;
const MAX_BYTES = 2 * 1024 * 1024;

/* Compact tag styles per day kind (full wording shows in "Selected Day"). */
function tagFor(info) {
  switch (info.kind) {
    case 'shift':
      return { text: 'SHIFT', bg: '#dbeafe', fg: '#1d4ed8' };
    case 'leave':
      return { text: 'Leave', bg: '#d1d5db', fg: '#374151' };
    case 'closure':
      return { text: 'Closed', bg: '#d9685a', fg: '#ffffff' };
    case 'holiday':
      return { text: 'Holiday', bg: '#bbf7d0', fg: '#166534' };
    case 'swapFrom':
      return { text: `To ${fromKey(info.swap.to).getDate()} ${MONTHS_SHORT[fromKey(info.swap.to).getMonth()]}`, bg: '#dbeafe', fg: '#1d4ed8' };
    case 'swapTo':
      return { text: `From ${fromKey(info.swap.from).getDate()} ${MONTHS_SHORT[fromKey(info.swap.from).getMonth()]}`, bg: '#d1d5db', fg: '#374151' };
    default:
      return null;
  }
}

function cellBg(kind, c) {
  if (kind === 'closure') return '#f8d9d4';
  if (kind === 'holiday') return '#dcfce7';
  if (kind === 'leave' || kind === 'swapTo') return '#e5e7eb';
  if (kind === 'sunday') return c.panel;
  return c.inputBg;
}

function DayCell({ date, size, selected, onPress, c }) {
  if (!date) {
    return <View style={{ width: size, height: CELL_H, backgroundColor: c.panel }} />;
  }
  const info = getDayInfo(date);
  const tag = tagFor(info);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${date.getDate()} ${MONTHS[date.getMonth()]}`}
      onPress={onPress}
      style={[
        styles.cell,
        {
          width: size,
          height: CELL_H,
          backgroundColor: cellBg(info.kind, c),
          borderColor: selected ? c.primary : info.kind === 'swapFrom' ? '#3b82f6' : info.kind === 'holiday' ? '#22c55e' : c.border,
          borderWidth: selected ? 2 : info.kind === 'swapFrom' || info.kind === 'holiday' ? 1.5 : StyleSheet.hairlineWidth,
        },
      ]}
    >
      <View style={[styles.dateBadge, selected ? { backgroundColor: c.primary } : null]}>
        <Text style={[styles.dateText, { color: selected ? '#fff' : '#111827' }]}>{date.getDate()}</Text>
      </View>
      {tag ? (
        <View style={[styles.tag, { backgroundColor: tag.bg }]}>
          <Text style={[styles.tagText, { color: tag.fg }]} numberOfLines={1}>
            {tag.text}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function SelectedDayBody({ date, c }) {
  const info = getDayInfo(date);
  if (info.kind === 'closure') {
    return (
      <View style={[styles.notice, { backgroundColor: '#fbe4e1' }]}>
        <Text style={[styles.noticeTitle, { color: '#b42318' }]}>{info.label}</Text>
        <Text style={{ color: '#475569', fontSize: 13, marginTop: 4, lineHeight: 18 }}>
          This date is unavailable because an institutional closure was declared.
        </Text>
      </View>
    );
  }
  let title = info.label;
  let text = '';
  if (info.kind === 'shift') {
    title = `Shift · ${info.shift.slot}`;
    text = `${info.shift.time}. Arrive 10 minutes before your shift starts.`;
  } else if (info.kind === 'leave') {
    text = 'Your leave request for this date was approved.';
  } else if (info.kind === 'holiday') {
    text = 'Public holidays are automatically excluded from the roster.';
  } else if (info.kind === 'swapFrom' || info.kind === 'swapTo') {
    text = `Approved swap with ${info.swap.with}.`;
  } else if (info.kind === 'sunday') {
    title = 'Sunday';
    text = 'Sundays are never scheduled.';
  } else {
    text = 'You are not rostered on this date.';
  }
  return (
    <View style={[styles.notice, { backgroundColor: c.panel }]}>
      <Text style={[styles.noticeTitle, { color: c.text }]}>{title}</Text>
      <Text style={{ color: c.muted, fontSize: 13, marginTop: 4, lineHeight: 18 }}>{text}</Text>
    </View>
  );
}

export default function StudSchedule() {
  const { c } = useStudTheme();
  const { width } = useWindowDimensions();
  const today = new Date();
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selectedKey, setSelectedKey] = useState(toKey(today));

  /* Timetable state:
     - timetable: the selected file ({ name, uri, size, mimeType }) or null
     - submitting: true while the submit request is running
     - timetableSubmitted: true once the current file was submitted successfully.
       TODO(ATTENDANCE): use `timetableSubmitted` to enable your Confirm Attendance
       action (it should only be allowed after a timetable has been submitted). */
  const [timetable, setTimetable] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [timetableSubmitted, setTimetableSubmitted] = useState(false);

  const size = Math.floor((width - 32 - 24) / 7);
  const weeks = useMemo(() => buildMonthGrid(view.y, view.m), [view]);
  const selectedDate = fromKey(selectedKey);

  const shiftMonth = (n) => {
    const d = new Date(view.y, view.m + n, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  };

  const pickTimetable = async () => {
    if (submitting) return;
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;
      const file = res.assets[0];
      if (file.size && file.size > MAX_BYTES) {
        Alert.alert('File too large', 'Please choose a PDF or image that is 2 MB or smaller.');
        return;
      }
      setTimetable({ name: file.name, uri: file.uri, size: file.size, mimeType: file.mimeType });
      // A newly chosen file has not been submitted yet.
      setTimetableSubmitted(false);
    } catch (e) {
      Alert.alert('Upload failed', 'Could not open the file picker. Please try again.');
    }
  };

  const submitTimetable = async () => {
    if (submitting) return;
    if (!timetable) {
      Alert.alert('No file selected', 'Please choose your timetable (PDF or image) before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      // TODO(API): POST /student/timetable (multipart/form-data) with `file`.
      // Example:
      //   const form = new FormData();
      //   form.append('file', { uri: timetable.uri, name: timetable.name, type: timetable.mimeType || 'application/octet-stream' });
      //   const res = await fetch(`${API_URL}/student/timetable`, { method: 'POST', body: form, headers: { Authorization: `Bearer ${token}` } });
      //   if (!res.ok) throw new Error('Upload failed');
      // Placeholder delay so the loading state is visible until the API is connected:
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setTimetableSubmitted(true);
    } catch (e) {
      Alert.alert('Submission failed', 'Your timetable could not be submitted. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const legend = [
    { color: '#22c55e', text: 'Green box - Holiday' },
    { color: '#ef4444', text: 'Red box - Institutional closure' },
    { color: '#9ca3af', text: 'Grey box - date swapped to' },
    { color: '#3b82f6', text: 'Blue box - date swapped from' },
  ];

  return (
    <ScreenShell
      active="schedule"
      pill="STUDENT SCHEDULE"
      title="Library Assistant Shift Management"
      subtitle="Your shifts are generated as a stable individual roster: each student assistant works 2–3 days per week, on either a morning or afternoon shift. Sundays and public holidays are never scheduled."
    >
      <Card style={{ padding: 12 }}>
        <View style={styles.calHead}>
          <View>
            <Text style={[styles.calTitle, { color: c.text }]}>
              {MONTHS[view.m]} {view.y}
            </Text>
            <Text style={{ color: c.muted, fontSize: 12 }}>Monthly shift calendar · {view.y}</Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <Pressable
              onPress={() => shiftMonth(-1)}
              accessibilityLabel="Previous month"
              style={[styles.navBtn, { borderColor: c.border, backgroundColor: c.inputBg }]}
            >
              <Ionicons name="chevron-back" size={16} color={c.text} />
            </Pressable>
            <Pressable
              onPress={() => shiftMonth(1)}
              accessibilityLabel="Next month"
              style={[styles.navBtn, { borderColor: c.border, backgroundColor: c.inputBg, marginLeft: 6 }]}
            >
              <Ionicons name="chevron-forward" size={16} color={c.text} />
            </Pressable>
          </View>
        </View>

        <View style={{ flexDirection: 'row' }}>
          {WEEKDAYS.map((w) => (
            <Text key={w} style={[styles.weekday, { width: size, color: c.text }]}>
              {w.toUpperCase()}
            </Text>
          ))}
        </View>
        {weeks.map((week, wi) => (
          <View key={`w${wi}`} style={{ flexDirection: 'row' }}>
            {week.map((d, di) => (
              <DayCell
                key={d ? toKey(d) : `e${wi}-${di}`}
                date={d}
                size={size}
                c={c}
                selected={d ? toKey(d) === selectedKey : false}
                onPress={() => d && setSelectedKey(toKey(d))}
              />
            ))}
          </View>
        ))}

        <View style={styles.legend}>
          {legend.map((l) => (
            <View key={l.text} style={styles.legendItem}>
              <View style={[styles.legendBox, { borderColor: l.color }]} />
              <Text style={{ color: c.text, fontSize: 11 }}>{l.text}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <View style={styles.sideHead}>
          <View style={[styles.sideIcon, { backgroundColor: c.primarySoft }]}>
            <Ionicons name="calendar-outline" size={16} color={c.primary} />
          </View>
          <View style={{ marginLeft: 10 }}>
            <Text style={[styles.sideTitle, { color: c.text }]}>SELECTED DAY</Text>
            <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>
              {WEEKDAYS_LONG[selectedDate.getDay()]}, {MONTHS_SHORT[selectedDate.getMonth()]} {selectedDate.getDate()}
            </Text>
          </View>
        </View>
        <SelectedDayBody date={selectedDate} c={c} />
      </Card>

      <Card>
        <Text style={[styles.cardTitle, { color: c.text }]}>Schedule notes</Text>
        {[
          { icon: 'checkmark-circle-outline', color: '#16a34a', text: 'Approved leave and swaps are reflected here.' },
          { icon: 'time-outline', color: c.primary, text: 'Arrive 10 minutes before your shift starts.' },
          { icon: 'calendar-outline', color: '#16a34a', text: 'Public holidays are automatically excluded.' },
        ].map((n) => (
          <View key={n.text} style={styles.noteRow}>
            <Ionicons name={n.icon} size={14} color={n.color} style={{ marginTop: 2 }} />
            <Text style={{ color: c.text, fontSize: 13, marginLeft: 8, flex: 1, lineHeight: 18 }}>{n.text}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={[styles.cardTitle, { color: c.text }]}>Upload timetable</Text>
        <Text style={{ color: c.text, fontSize: 12, lineHeight: 17, marginBottom: 12 }}>
          Upload your class timetable so your supervisor can see when you have lectures and plan your shifts around them.
        </Text>
        <AppButton
          icon="cloud-upload-outline"
          label={timetable ? 'Choose a different timetable' : 'Upload timetable'}
          variant={timetable ? 'light' : 'primary'}
          onPress={pickTimetable}
          disabled={submitting}
        />
        <Text style={{ color: c.muted, fontSize: 11, marginTop: 8 }}>PDF or image · max 2 MB</Text>

        {/* Selected file: stays visible before and after submission. */}
        {timetable ? (
          <View style={[styles.fileRow, { backgroundColor: c.panel, borderColor: c.border }]}>
            <Ionicons
              name={timetableSubmitted ? 'checkmark-circle' : 'document-attach-outline'}
              size={20}
              color={timetableSubmitted ? c.okText : c.primary}
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={{ color: c.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
                {timetable.name}
              </Text>
              <Text style={{ color: timetableSubmitted ? c.okText : c.muted, fontSize: 11, marginTop: 2 }}>
                {timetableSubmitted ? 'Submitted' : 'Ready to submit'}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Submit button: only shown once a timetable has been selected. */}
        {timetable && !timetableSubmitted ? (
          <View style={styles.submitRow}>
            {submitting ? <ActivityIndicator color={c.primary} style={{ marginRight: 10 }} /> : null}
            <AppButton
              icon={submitting ? undefined : 'paper-plane-outline'}
              label={submitting ? 'Submitting timetable…' : 'Submit Timetable'}
              onPress={submitTimetable}
              disabled={submitting}
              style={{ flex: 1 }}
            />
          </View>
        ) : null}

        {timetableSubmitted ? (
          <View style={[styles.successBox, { backgroundColor: c.okBg }]}>
            <Ionicons name="checkmark-circle" size={18} color={c.okText} />
            <Text style={{ color: c.okText, fontSize: 13, fontWeight: '700', marginLeft: 8, flex: 1 }}>
              Timetable submitted successfully.
            </Text>
          </View>
        ) : null}
      </Card>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  calHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  calTitle: { fontSize: 17, fontWeight: '700' },
  navBtn: { width: 34, height: 34, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  weekday: { textAlign: 'center', fontSize: 9, fontWeight: '800', paddingVertical: 8 },
  cell: { padding: 3 },
  dateBadge: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dateText: { fontSize: 11, fontWeight: '700' },
  tag: { marginTop: 4, borderRadius: 3, paddingHorizontal: 2, paddingVertical: 1 },
  tagText: { fontSize: 7.5, fontWeight: '800', textAlign: 'center' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 12, marginBottom: 6 },
  legendBox: { width: 10, height: 10, borderWidth: 1.5, borderRadius: 2, marginRight: 5 },
  sideHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sideIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sideTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  notice: { borderRadius: 6, padding: 12 },
  noticeTitle: { fontSize: 13, fontWeight: '700' },
  cardTitle: { fontSize: 14, fontWeight: '800', marginBottom: 8 },
  noteRow: { flexDirection: 'row', marginBottom: 8 },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 14,
  },
  submitRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
});