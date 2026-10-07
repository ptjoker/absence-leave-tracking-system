import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../components/studentDash/ScreenShell';
import {
    AppButton,
    Card,
    DateField,
    FieldLabel,
    HelperText,
    SelectField,
    SuggestedText,
    TextArea,
} from '../components/studentDash/ui';
import {
    AVAILABLE_ASSISTANTS,
    LEAVE_CATEGORIES,
    LEAVE_SUGGESTIONS,
    SHIFT_OPTIONS,
    SWAPS,
    SWAP_SUGGESTIONS,
    addRequest,
    computeLeaveDates,
    drafts,
    formatLong,
    fromKey,
    isUnavailable,
} from '../constants/studData';
import { ROUTES, useStudTheme } from '../constants/studTheme';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // TODO(API): confirm real attachment limit

function goBackOrHome(router) {
  if (router.canGoBack()) router.back();
  else router.replace(ROUTES.dashboard);
}

function FormFooter({ submitLabel, onCancel, onSubmit }) {
  const { c } = useStudTheme();
  return (
    <View style={[styles.footer, { borderTopColor: c.border }]}>
      <View style={styles.draftRow}>
        <Ionicons name="checkmark-circle-outline" size={14} color={c.text} />
        <Text style={{ color: c.text, fontSize: 12, fontWeight: '600', marginLeft: 6, flex: 1 }}>
          Draft is kept while you complete the form.
        </Text>
      </View>
      <View style={styles.footerBtns}>
        <AppButton variant="danger" label="Cancel" onPress={onCancel} style={{ marginRight: 10 }} />
        <AppButton label={submitLabel} iconRight="chevron-forward" onPress={onSubmit} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

/* ============================ LEAVE FORM ============================ */
function LeaveForm({ onSwitch }) {
  const router = useRouter();
  const { c } = useStudTheme();
  const saved = drafts.leave || {};
  const [category, setCategory] = useState(saved.category || 'Sick Leave');
  const [days, setDays] = useState(saved.days || 1);
  const [startKey, setStartKey] = useState(saved.startKey || '');
  const [reason, setReason] = useState(saved.reason || '');
  const [file, setFile] = useState(saved.file || null);
  const [attached, setAttached] = useState(saved.attached || false);

  useEffect(() => {
    drafts.leave = { category, days, startKey, reason, file, attached };
  }, [category, days, startKey, reason, file, attached]);

  const cat = LEAVE_CATEGORIES.find((x) => x.value === category) || LEAVE_CATEGORIES[0];
  const dayOptions = Array.from({ length: cat.maxDays }, (_, i) => ({
    value: i + 1,
    label: `${i + 1} day${i === 0 ? '' : 's'}`,
  }));

  const covered = useMemo(() => (startKey ? computeLeaveDates(startKey, days) : []), [startKey, days]);

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/png', 'image/jpeg'],
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;
      const f = res.assets[0];
      if (f.size && f.size > MAX_IMAGE_BYTES) {
        Alert.alert('File too large', 'Please choose a PNG or JPG under 5 MB.');
        return;
      }
      setFile({ name: f.name, uri: f.uri });
      setAttached(false);
    } catch (e) {
      Alert.alert('Could not open files', 'Please try again.');
    }
  };

  const upload = () => {
    if (!file) return;
    // TODO(API): POST /leave-requests/attachments (multipart/form-data) with `file`
    setAttached(true);
    Alert.alert('Document attached', `${file.name} will be submitted with your request.`);
  };

  const submit = () => {
    if (!startKey) {
      Alert.alert('Date required', 'Please select a start date.');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Justification required', 'Please add a short justification for your request.');
      return;
    }
    // TODO(API): POST /leave-requests { category, days, dates: covered, reason, attachment }
    const id = addRequest(category);
    drafts.leave = null;
    Alert.alert('Request submitted', `${id} (${category}) was submitted and is pending approval.`, [
      { text: 'OK', onPress: () => router.replace(ROUTES.history) },
    ]);
  };

  const cancel = () => {
    drafts.leave = null;
    goBackOrHome(router);
  };

  return (
    <Card>
      <View style={styles.cardHead}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: c.text }]}>Request Details</Text>
          <Text style={{ color: c.text, fontSize: 13 }}>Select the type of request you wish to submit.</Text>
        </View>
      </View>
      <Toggle mode="leave" onSwitch={onSwitch} />

      <SelectField
        upper
        label="Absence Category"
        value={category}
        options={LEAVE_CATEGORIES.map((x) => ({ value: x.value, label: x.value }))}
        onChange={(v) => {
          setCategory(v);
          const max = LEAVE_CATEGORIES.find((x) => x.value === v).maxDays;
          if (days > max) setDays(max);
        }}
        helper={cat.description}
      />
      <SelectField
        upper
        label="Number of Days"
        value={days}
        options={dayOptions}
        onChange={setDays}
        helper={`${cat.value} is limited to ${cat.maxDays} days per request.`}
      />
      <DateField
        label="Date Range"
        icon="calendar-outline"
        required
        value={startKey}
        onChange={setStartKey}
        isDisabled={(d) => isUnavailable(d)}
        placeholder="Select start date"
        helper="Choose how many days you need, then pick your start date. Past dates, Sundays, public holidays, approved leave, approved swaps and institutional closures are skipped."
      />
      {covered.length > 0 ? (
        <View style={[styles.preview, { backgroundColor: c.primarySoft }]}>
          <Text style={{ color: c.primary, fontSize: 12, fontWeight: '700' }}>
            {formatLong(fromKey(covered[0]))}
            {covered.length > 1 ? ` → ${formatLong(fromKey(covered[covered.length - 1]))}` : ''} · {covered.length}{' '}
            working day{covered.length === 1 ? '' : 's'}
          </Text>
        </View>
      ) : null}

      <FieldLabel text="Attach Supporting Document" icon="cloud-upload-outline" />
      <Pressable
        onPress={pickFile}
        accessibilityRole="button"
        style={[styles.drop, { borderColor: c.inputBorder, backgroundColor: c.panel }]}
      >
        <Ionicons name="cloud-upload-outline" size={22} color={c.text} />
        <Text style={{ color: c.primary, fontWeight: '600', marginTop: 6 }}>
          {file ? file.name : 'Tap to choose a file'}
        </Text>
        <Text style={{ color: c.text, fontSize: 12, marginTop: 4 }}>Supported format: PNG, JPG</Text>
      </Pressable>
      <View style={{ alignItems: 'flex-end', marginBottom: 16 }}>
        <AppButton label={attached ? 'Attached' : 'Upload'} onPress={upload} disabled={!file || attached} />
      </View>

      <FieldLabel text="Justification & Comments" />
      <TextArea
        value={reason}
        onChangeText={setReason}
        placeholder="Example: I need leave to attend a scheduled examination / medical appointment. I will complete my assigned hours before or after this period."
      />
      <View style={{ height: 12 }} />
      <SuggestedText items={LEAVE_SUGGESTIONS} onPick={(t) => setReason(t)} />

      <FormFooter submitLabel="Submit Leave Request" onCancel={cancel} onSubmit={submit} />
    </Card>
  );
}

/* ============================ SWAP FORM ============================= */
function SwapForm() {
  const router = useRouter();
  const { c } = useStudTheme();
  const saved = drafts.swap || {};
  const [currentKey, setCurrentKey] = useState(saved.currentKey || SHIFT_OPTIONS[0].value);
  const [newKey, setNewKey] = useState(saved.newKey || '');
  const [assistant, setAssistant] = useState(saved.assistant || '');
  const [reason, setReason] = useState(saved.reason || '');

  useEffect(() => {
    drafts.swap = { currentKey, newKey, assistant, reason };
  }, [currentKey, newKey, assistant, reason]);

  const submit = () => {
    if (!newKey) {
      Alert.alert('New shift date required', 'Please select a new shift date.');
      return;
    }
    if (!assistant) {
      Alert.alert('Choose a student assistant', 'Select an available student assistant to swap with.');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Reason required', 'Please give a reason for the swap.');
      return;
    }
    // TODO(API): POST /swap-requests { currentShift: currentKey, newDate: newKey, withAssistant: assistant, reason }
    const id = addRequest(`Shift Swap – ${assistant}`);
    drafts.swap = null;
    Alert.alert('Swap request submitted', `${id} was sent for department lead approval.`, [
      { text: 'OK', onPress: () => router.replace(ROUTES.history) },
    ]);
  };

  const cancel = () => {
    drafts.swap = null;
    goBackOrHome(router);
  };

  return (
    <>
      <Card>
        <Text style={[styles.cardTitleSm, { color: c.text }]}>Approved shift swaps</Text>
        {/* TODO(API): GET /swap-requests?status=approved */}
        {SWAPS.map((s) => (
          <View key={s.from} style={[styles.swapRow, { backgroundColor: c.panel }]}>
            <Text style={{ color: c.text, fontSize: 13 }}>
              {formatLong(fromKey(s.from))} → {formatLong(fromKey(s.to))} with{' '}
              <Text style={{ fontWeight: '800' }}>{s.with}</Text>
            </Text>
          </View>
        ))}
      </Card>

      <Card>
        <View style={styles.cardHead}>
          <View style={[styles.swapIcon, { backgroundColor: c.primarySoft }]}>
            <Ionicons name="sync" size={16} color={c.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.cardTitle, { color: c.text }]}>New Swap Request</Text>
            <Text style={{ color: c.text, fontSize: 12 }}>Fill in the details for your proposed shift exchange.</Text>
          </View>
        </View>

        <Text style={[styles.step, { color: c.text }]}>1. SELECT YOUR CURRENT SHIFT</Text>
        <SelectField
          label="Current shift"
          icon="time-outline"
          value={currentKey}
          options={SHIFT_OPTIONS}
          onChange={(v) => {
            setCurrentKey(v);
            if (newKey === v) setNewKey('');
          }}
        />

        <Text style={[styles.step, { color: c.text }]}>2. NEW SHIFT DATE</Text>
        <DateField
          label="New shift date"
          icon="calendar-outline"
          required
          value={newKey}
          onChange={(k) => {
            setNewKey(k);
            setAssistant('');
          }}
          isDisabled={(d) => isUnavailable(d, currentKey)}
          placeholder="Select a date"
          helper="Use the arrows to browse any month of 2026. Past dates, Sundays, holidays, approved leave, approved swaps and your selected current shift are unavailable."
        />

        <Text style={[styles.step, { color: c.text }]}>3. AVAILABLE STUDENT ASSISTANTS</Text>
        <FieldLabel text="Student Assistant" icon="people-outline" />
        {!newKey ? (
          <View style={[styles.dashed, { borderColor: c.inputBorder, backgroundColor: c.panel }]}>
            <Text style={{ color: c.text, fontSize: 13 }}>
              Select a new shift date to see which student assistants are available.
            </Text>
          </View>
        ) : (
          <View style={{ marginBottom: 16 }}>
            {/* TODO(API): GET /shifts/available-assistants?date={newKey} */}
            {AVAILABLE_ASSISTANTS.map((name) => {
              const on = name === assistant;
              return (
                <Pressable
                  key={name}
                  onPress={() => setAssistant(name)}
                  style={[
                    styles.assistant,
                    { borderColor: on ? c.primary : c.inputBorder, backgroundColor: on ? c.primarySoft : c.inputBg },
                  ]}
                >
                  <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={18} color={on ? c.primary : c.muted} />
                  <Text style={{ color: c.text, fontSize: 14, marginLeft: 10 }}>{name}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <FieldLabel text="Reason for Swap" icon="document-text-outline" />
        <TextArea
          value={reason}
          onChangeText={setReason}
          placeholder="Example: I need to exchange this shift with an available colleague because of a university timetable conflict."
        />
        <View style={{ height: 12 }} />
        <SuggestedText items={SWAP_SUGGESTIONS} onPick={(t) => setReason(t)} />

        <View style={[styles.policy, { backgroundColor: c.primarySoft, borderColor: c.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons name="information-circle-outline" size={16} color={c.primary} />
            <Text style={{ color: c.primary, fontWeight: '700', marginLeft: 6 }}>Swap Policy Notice</Text>
          </View>
          <HelperText>
            All swaps are subject to department lead approval. Approved swaps are shown on your schedule and the swapped dates become unavailable for another request.
          </HelperText>
        </View>

        <FormFooter submitLabel="Submit Swap Request" onCancel={cancel} onSubmit={submit} />
      </Card>
    </>
  );
}

/* ============================== TOGGLE ============================== */
function Toggle({ mode, onSwitch }) {
  const { c } = useStudTheme();
  const items = [
    { key: 'leave', label: 'Leave Request', icon: 'document-text-outline' },
    { key: 'swap', label: 'Shift Swapping', icon: 'sync-outline' },
  ];
  return (
    <View style={[styles.toggle, { backgroundColor: c.panel, borderColor: c.border }]}>
      {items.map((it) => {
        const on = it.key === mode;
        return (
          <Pressable
            key={it.key}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onSwitch(it.key)}
            style={[styles.toggleItem, on ? { backgroundColor: c.inputBg } : null]}
          >
            <Ionicons name={it.icon} size={14} color={on ? c.primary : c.text} />
            <Text style={{ marginLeft: 6, fontSize: 13, fontWeight: '700', color: on ? c.primary : c.text }}>
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* =============================== SCREEN ============================= */
export default function StudRequest() {
  const { c } = useStudTheme();
  const params = useLocalSearchParams();
  const [mode, setMode] = useState(params.mode === 'swap' ? 'swap' : 'leave');

  useEffect(() => {
    if (params.mode === 'swap') setMode('swap');
    if (params.mode === 'leave') setMode('leave');
  }, [params.mode]);

  if (mode === 'swap') {
    return (
      <ScreenShell
        active="requests"
        pill="SCHEDULING MANAGEMENT"
        title="Shift Swapping Request"
        subtitle="Choose an upcoming shift, then choose a new working date. The student assistants available on that date will be listed for you to pick from."
        back={
          <Pressable onPress={() => setMode('leave')} style={styles.back} accessibilityRole="button">
            <Ionicons name="chevron-back" size={14} color={c.title} />
            <Text style={{ color: c.title, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>
              BACK TO REQUEST LEAVE
            </Text>
          </Pressable>
        }
      >
        <SwapForm />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      active="requests"
      pill="STUDENT PORTAL"
      title="Submit a Request"
      subtitle="Please provide the details for your absence or scheduling change. Approved leave dates become unavailable automatically."
    >
      <LeaveForm onSwitch={setMode} />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  cardHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  cardTitleSm: { fontSize: 14, fontWeight: '800', marginBottom: 8 },
  toggle: { flexDirection: 'row', borderWidth: 1, borderRadius: 8, padding: 3, marginBottom: 16 },
  toggleItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 6 },
  drop: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 8, alignItems: 'center', paddingVertical: 24, paddingHorizontal: 12, marginBottom: 10 },
  preview: { borderRadius: 6, padding: 10, marginBottom: 16, marginTop: -6 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14, marginTop: 6 },
  draftRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  footerBtns: { flexDirection: 'row' },
  swapRow: { borderRadius: 6, padding: 12 },
  swapIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  step: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 10, marginTop: 4 },
  dashed: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 6, padding: 14, marginBottom: 16 },
  assistant: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 6, padding: 12, marginBottom: 8 },
  policy: { borderWidth: 1, borderRadius: 6, padding: 12, marginBottom: 12 },
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, alignSelf: 'flex-start' },
});
