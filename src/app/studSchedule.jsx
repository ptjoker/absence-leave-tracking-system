import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useMemo, useState } from 'react';
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
  SHIFT_TEST_MODE,
  SHIFT_TEST_SECONDS_PER_HOUR,
  WEEKDAYS,
  WEEKDAYS_LONG,
  buildMonthGrid,
  formatClock,
  formatCountdown,
  formatDuration,
  fromKey,
  getDayInfo,
  getShiftStatus,
  getShiftWindow,
  startShift,
  toKey,
  useNow,
  useShiftRecords,
} from '../constants/studData';
import { useStudTheme } from '../constants/studTheme';
import { useShifts } from '../hooks/useShifts';

const CELL_H = 64;
const MAX_BYTES = 2 * 1024 * 1024;

/* Compact tag styles per day kind (full wording shows in "Selected Day"). */
function tagFor(info, record) {
  switch (info.kind) {
    case 'shift':
      if (record?.completedAt) return { text: 'DONE', bg: '#bbf7d0', fg: '#166534' };
      if (record) return { text: 'LIVE', bg: '#fde68a', fg: '#92400e' };
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

/* Colours + button text for each shift status, taken from the existing theme. */
function statusLook(status, c) {
  switch (status) {
    case 'available':
      return { label: 'Available to start', bg: c.primarySoft, fg: c.primary, btnLabel: 'Start Shift', btnIcon: 'play', btnBg: c.primary, btnFg: '#ffffff', locked: false };
    case 'inProgress':
      return { label: 'In progress', bg: c.warnBg, fg: c.warnText, btnLabel: 'Shift in Progress', btnIcon: 'timer-outline', btnBg: c.warnBg, btnFg: c.warnText, locked: true };
    case 'completed':
      return { label: 'Completed', bg: c.okBg, fg: c.okText, btnLabel: 'Shift Completed', btnIcon: 'checkmark-circle', btnBg: c.okBg, btnFg: c.okText, locked: true };
    case 'ended':
      return { label: 'Time window closed', bg: c.badBg, fg: c.badText, btnLabel: 'Start Shift', btnIcon: 'play', btnBg: c.panel, btnFg: c.muted, locked: false };
    case 'invalid':
      return { label: 'Time unavailable', bg: c.panel, fg: c.muted, btnLabel: 'Start Shift', btnIcon: 'play', btnBg: c.panel, btnFg: c.muted, locked: false };
    default:
      return { label: 'Upcoming', bg: c.panel, fg: c.muted, btnLabel: 'Start Shift', btnIcon: 'play', btnBg: c.panel, btnFg: c.muted, locked: false };
  }
}

function DayCell({ date, size, selected, onPress, c, shifts, record }) {
  if (!date) {
    return <View style={{ width: size, height: CELL_H, backgroundColor: c.panel }} />;
  }
  const info = getDayInfo(date, shifts);
  const tag = tagFor(info, record);
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

function SelectedDayBody({ date, c, shifts }) {
  const info = getDayInfo(date, shifts);
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

function InfoChip({ label, value, c }) {
  return (
    <View style={[styles.chip, { backgroundColor: c.panel, borderColor: c.border }]}>
      <Text style={{ color: c.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 }}>{label}</Text>
      <Text style={{ color: c.text, fontSize: 13, fontWeight: '700', marginTop: 2 }}>{value}</Text>
    </View>
  );
}

/* "Selected Day" card: heading with the Start Shift button on the right,
   the day's details, and (on shift days) the timetable + countdown panel. */
function SelectedDayCard({ selectedKey, selectedDate, shifts, records, c }) {
  const now = useNow(); // shared 1-second ticker (one interval for the whole app)
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    setNotice(null);
  }, [selectedKey]);

  const info = getDayInfo(selectedDate, shifts);
  const shift = info.kind === 'shift' ? info.shift : null;
  const win = shift ? getShiftWindow(selectedKey, shift) : null;
  const record = shift ? records[selectedKey] : null;
  const status = shift ? getShiftStatus(selectedKey, shift, record, now) : null;
  const look = status ? statusLook(status, c) : null;

  const handleStart = () => {
    const res = startShift(selectedKey, shift);
    setNotice(res.ok ? null : res.message);
  };

  let message = null;
  if (win) {
    if (status === 'available') {
      message = `Ready to start. Your ${formatDuration(win.durationMinutes)} countdown begins when you tap Start Shift.`;
    } else if (status === 'upcoming') {
      message = `This shift opens at ${win.startLabel}. You can start it from then until ${win.endLabel}.`;
    } else if (status === 'ended') {
      message = `The assigned time (${win.startLabel} – ${win.endLabel}) has passed, so this shift can no longer be started.`;
    }
  } else if (status === 'invalid') {
    message = 'This shift has no valid start and end time, so it cannot be started.';
  }

  const remaining = record && status === 'inProgress' ? Math.max(0, record.endsAt - now) : 0;
  const progress = record && record.timerMs ? Math.min(1, Math.max(0, 1 - remaining / record.timerMs)) : 0;

  return (
    <Card>
      <View style={styles.selHead}>
        <View style={[styles.sideHead, { marginBottom: 4, flexShrink: 1, marginRight: 8 }]}>
          <View style={[styles.sideIcon, { backgroundColor: c.primarySoft }]}>
            <Ionicons name="calendar-outline" size={16} color={c.primary} />
          </View>
          <View style={{ marginLeft: 10, flexShrink: 1 }}>
            <Text style={[styles.sideTitle, { color: c.text }]}>SELECTED DAY</Text>
            <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>
              {WEEKDAYS_LONG[selectedDate.getDay()]}, {MONTHS_SHORT[selectedDate.getMonth()]} {selectedDate.getDate()}
            </Text>
          </View>
        </View>

        {look ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={look.btnLabel}
            accessibilityState={{ disabled: look.locked }}
            disabled={look.locked}
            onPress={handleStart}
            style={[styles.shiftBtn, { backgroundColor: look.btnBg }]}
          >
            <Ionicons name={look.btnIcon} size={16} color={look.btnFg} />
            <Text style={[styles.shiftBtnText, { color: look.btnFg }]}>{look.btnLabel}</Text>
          </Pressable>
        ) : null}
      </View>

      <SelectedDayBody date={selectedDate} c={c} shifts={shifts} />

      {look ? (
        <View style={{ marginTop: 12 }}>
          <View style={[styles.statusBadge, { backgroundColor: look.bg }]}>
            <Text style={{ color: look.fg, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 }}>
              {look.label.toUpperCase()}
            </Text>
          </View>

          {win ? (
            <View style={styles.chipRow}>
              <InfoChip label="START" value={win.startLabel} c={c} />
              <InfoChip label="END" value={win.endLabel} c={c} />
              <InfoChip label="DURATION" value={formatDuration(win.durationMinutes)} c={c} />
            </View>
          ) : null}

          {status === 'inProgress' ? (
            <View style={[styles.timerBox, { backgroundColor: c.warnBg }]}>
              <Text style={{ color: c.warnText, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 }}>
                TIME REMAINING
              </Text>
              <Text style={[styles.timerText, { color: c.warnText }]} accessibilityLiveRegion="polite">
                {formatCountdown(remaining)}
              </Text>
              <View style={[styles.progressTrack, { backgroundColor: c.border }]}>
                <View style={[styles.progressFill, { backgroundColor: c.warnText, width: `${Math.round(progress * 100)}%` }]} />
              </View>
              <Text style={{ color: c.warnText, fontSize: 12, marginTop: 6 }}>
                Started {formatClock(new Date(record.startedAt).getHours() * 60 + new Date(record.startedAt).getMinutes())}
                {' · '}Ends {formatClock(new Date(record.endsAt).getHours() * 60 + new Date(record.endsAt).getMinutes())}
              </Text>
            </View>
          ) : null}

          {status === 'completed' ? (
            <View style={[styles.timerBox, { backgroundColor: c.okBg }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="checkmark-circle" size={20} color={c.okText} />
                <Text style={{ color: c.okText, fontSize: 16, fontWeight: '800', marginLeft: 8 }}>Shift Completed</Text>
              </View>
              {record ? (
                <Text style={{ color: c.okText, fontSize: 12, marginTop: 6 }}>
                  Started {formatClock(new Date(record.startedAt).getHours() * 60 + new Date(record.startedAt).getMinutes())}
                  {' · '}Finished {formatClock(new Date(record.endsAt).getHours() * 60 + new Date(record.endsAt).getMinutes())}
                </Text>
              ) : null}
            </View>
          ) : null}

          {message ? (
            <Text style={{ color: c.muted, fontSize: 13, lineHeight: 18, marginTop: 10 }}>{message}</Text>
          ) : null}

          {notice ? (
            <View style={[styles.notice, { backgroundColor: c.badBg, marginTop: 10 }]}>
              <Text style={{ color: c.badText, fontSize: 13, fontWeight: '700', lineHeight: 18 }}>{notice}</Text>
            </View>
          ) : null}

          {SHIFT_TEST_MODE ? (
            <Text style={{ color: c.warnText, fontSize: 11, fontWeight: '700', marginTop: 8 }}>
              TEST MODE · 1 hour counts as {SHIFT_TEST_SECONDS_PER_HOUR} seconds
            </Text>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

/* Shown at the top of the page while a shift is running on a day that is NOT
   currently selected, so the timer stays visible while browsing the calendar. */
function ActiveShiftBanner({ records, selectedKey, onView, c }) {
  const now = useNow();
  const activeKey = Object.keys(records).find(
    (k) => !records[k].completedAt && now < records[k].endsAt,
  );
  if (!activeKey || activeKey === selectedKey) return null;
  const record = records[activeKey];
  const d = fromKey(activeKey);
  return (
    <Card style={{ padding: 12 }}>
      <View style={styles.bannerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1, marginRight: 8 }}>
          <Ionicons name="timer-outline" size={22} color={c.warnText} />
          <View style={{ marginLeft: 10, flexShrink: 1 }}>
            <Text style={{ color: c.text, fontSize: 13, fontWeight: '800' }}>Shift in progress</Text>
            <Text style={{ color: c.muted, fontSize: 12 }}>
              {MONTHS_SHORT[d.getMonth()]} {d.getDate()}
            </Text>
          </View>
        </View>
        <Text style={[styles.bannerTime, { color: c.warnText }]}>{formatCountdown(record.endsAt - now)}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => onView(activeKey)}
          style={[styles.viewBtn, { borderColor: c.border, backgroundColor: c.inputBg }]}
        >
          <Text style={{ color: c.text, fontSize: 12, fontWeight: '700' }}>View</Text>
        </Pressable>
      </View>
    </Card>
  );
}

export default function StudSchedule() {
  const { c } = useStudTheme();
  const { width } = useWindowDimensions();
  const { shifts, loading: shiftsLoading, error: shiftsError } = useShifts();
  const records = useShiftRecords();
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

  /* Jump the calendar to a day (used by the active-shift banner). */
  const viewDay = (key) => {
    const d = fromKey(key);
    setView({ y: d.getFullYear(), m: d.getMonth() });
    setSelectedKey(key);
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
      <ActiveShiftBanner records={records} selectedKey={selectedKey} onView={viewDay} c={c} />

      <Card style={{ padding: 12 }}>
      {shiftsLoading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <ActivityIndicator size="small" color={c.primary} />
            <Text style={{ color: c.muted, fontSize: 12, marginLeft: 8 }}>Loading shifts…</Text>
          </View>
        ) : shiftsError ? (
          <Text style={{ color: '#dc2626', fontSize: 12, marginBottom: 8 }}>{shiftsError}</Text>
        ) : null}
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
                shifts={shifts}
                record={d ? records[toKey(d)] : null}
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

      <SelectedDayCard
        selectedKey={selectedKey}
        selectedDate={selectedDate}
        shifts={shifts}
        records={records}
        c={c}
      />

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

  /* Shift timer */
  selHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 10 },
  shiftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 'auto',
    marginBottom: 4,
  },
  shiftBtnText: { fontSize: 13, fontWeight: '800', marginLeft: 6 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  chip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, marginBottom: 8 },
  timerBox: { borderRadius: 10, padding: 14, marginTop: 4, alignItems: 'center' },
  timerText: { fontSize: 38, fontWeight: '800', marginTop: 4, fontVariant: ['tabular-nums'] },
  progressTrack: { height: 6, borderRadius: 3, alignSelf: 'stretch', marginTop: 8, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  bannerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bannerTime: { fontSize: 20, fontWeight: '800', marginRight: 10, fontVariant: ['tabular-nums'] },
  viewBtn: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8 },
});