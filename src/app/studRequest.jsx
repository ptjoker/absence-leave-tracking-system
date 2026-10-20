// src/app/studRequest.jsx (or wherever your student request form lives)
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
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
  SWAPS,
  SWAP_SUGGESTIONS,
  computeLeaveDates,
  drafts,
  formatLong,
  fromKey,
  isUnavailable,
  toKey,
  useRequests,
} from '../constants/studData';
import { ROUTES, useStudTheme } from '../constants/studTheme';
import { apiFetch } from '../lib/api';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/* ---------------- helpers for parsing stored dateRange strings --------- */
const MONTHS_MAP = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

function parseDateString(s) {
  if (!s) return null;
  const m = String(s).trim().match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/);
  if (!m) return null;
  const month = MONTHS_MAP[m[1].slice(0, 3)];
  if (month === undefined) return null;
  return new Date(Number(m[3]), month, Number(m[2]));
}

function splitRange(dateRange) {
  if (!dateRange) return ['', ''];
  const parts = String(dateRange).split(/\s*[–—-]\s*/).map((s) => s.trim()).filter(Boolean);
  return [parts[0] || '', parts[1] || parts[0] || ''];
}

function swapMeta(request) {
  const text = `${request?.detail || ''} ${request?.reason || ''}`;
  const match = text.match(/Swap from (.+?) to (.+?) with (.+?)(?:\.|$)/i);
  return match ? { from: match[1], to: match[2], with: match[3] } : null;
}

function goBackOrHome(router) {
  if (router.canGoBack()) router.back();
  else router.replace(ROUTES.dashboard);
}

function FormFooter({ submitLabel, onCancel, onSubmit, loading }) {
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
        <AppButton variant="danger" label="Cancel" onPress={onCancel} disabled={loading} style={{ marginRight: 10 }} />
        <AppButton
          label={loading ? 'Submitting…' : submitLabel}
          iconRight="chevron-forward"
          onPress={onSubmit}
          disabled={loading}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

/* ============================ LEAVE FORM ============================ */
function LeaveForm({ onSwitch, editTarget, returnTo }) {
  const router = useRouter();
  const { c } = useStudTheme();
  const { updateRequest, addRequest } = useRequests();
  const editing = Boolean(editTarget);
  const loadedFor = useRef(null);

  const saved = editing ? {} : (drafts.leave || {});
  const [category, setCategory] = useState(saved.category || 'Sick Leave');
  const [days, setDays] = useState(saved.days || 1);
  const [startKey, setStartKey] = useState(saved.startKey || '');
  const [reason, setReason] = useState(saved.reason || '');
  const [file, setFile] = useState(saved.file || null);
  const [attached, setAttached] = useState(saved.attached || false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!editTarget || loadedFor.current === editTarget.rawId) return;
    loadedFor.current = editTarget.rawId;

    const matched = LEAVE_CATEGORIES.find((x) => x.value === editTarget.type);
    setCategory(matched ? matched.value : LEAVE_CATEGORIES[0].value);

    const [firstStr, secondStr] = splitRange(editTarget.dateRange);
    const startDate = parseDateString(firstStr);
    const endDate = parseDateString(secondStr);
    if (startDate) {
      setStartKey(toKey(startDate));
      let count = 0;
      for (let d = new Date(startDate); d <= (endDate || startDate); d.setDate(d.getDate() + 1)) {
        if (d.getDay() !== 0) count += 1;
      }
      setDays(Math.max(1, count));
    }

    setReason(editTarget.detail || editTarget.reason || '');

    if (editTarget.supportingDocument?.fileName) {
      setFile({ name: editTarget.supportingDocument.fileName, uri: null, existing: true });
      setAttached(true);
    }
  }, [editTarget]);

  useEffect(() => {
    if (editing) return;
    drafts.leave = { category, days, startKey, reason, file, attached };
  }, [editing, category, days, startKey, reason, file, attached]);

  const cat = LEAVE_CATEGORIES.find((x) => x.value === category) || LEAVE_CATEGORIES[0];
  const dayOptions = Array.from({ length: cat.maxDays }, (_, i) => ({
    value: i + 1,
    label: `${i + 1} day${i === 0 ? '' : 's'}`,
  }));

  const covered = useMemo(() => (startKey ? computeLeaveDates(startKey, days) : []), [startKey, days]);

  const pickFile = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Allow access to your photos to attach a document.');
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (res.canceled) return;
      const asset = res.assets[0];

      if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
        Alert.alert('File too large', 'Please choose a PNG or JPG under 5 MB.');
        return;
      }

      setFile({
        name: asset.fileName || `attachment-${Date.now()}.jpg`,
        uri: asset.uri,
        mimeType: asset.mimeType || 'image/jpeg',
        base64: asset.base64,
      });
      setAttached(false);
    } catch (err) {
      console.error('ImagePicker error:', err);
      Alert.alert('Could not open files', 'Please try again.');
    }
  };

  const upload = () => {
    if (!file) return;
    setAttached(true);
    Alert.alert('Document attached', `${file.name} will be submitted with your request.`);
  };

  const submit = async () => {
    if (!startKey) {
      Alert.alert('Date required', 'Please select a start date.');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Justification required', 'Please add a short justification for your request.');
      return;
    }
    if (covered.length === 0) {
      Alert.alert('Date range invalid', 'Could not compute working days from your start date.');
      return;
    }
    if ((category === 'Sick Leave' || category === 'Exam Leave') && !file) {
      Alert.alert(
        'Supporting document required',
        `A supporting document is required for ${category}. Please attach a PNG or JPG before submitting.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const first = formatLong(fromKey(covered[0]));
      const last = formatLong(fromKey(covered[covered.length - 1]));
      const dateRange = covered.length > 1 ? `${first} – ${last}` : first;

      if (editing) {
        let editDoc = null;
        if (file && file.base64 && !file.existing) {
          editDoc = {
            fileName: file.name,
            dataUrl: `data:${file.mimeType};base64,${file.base64}`,
          };
        }
        await updateRequest(editTarget.id, {
          type: category,
          dateRange,
          detail: reason.trim(),
          reason: reason.trim(),
          supportingDocument: editDoc,
        });
        drafts.leave = null;
        Alert.alert(
          'Request updated',
          `${editTarget.id} has been saved.`,
          [{ text: 'OK', onPress: () => router.replace(returnTo) }],
          { cancelable: false }
        );
        return;
      }

      let supportingDocument = null;
      if (file && file.base64 && !file.existing) {
        supportingDocument = {
          fileName: file.name,
          dataUrl: `data:${file.mimeType};base64,${file.base64}`,
        };
      }

      await addRequest({
        type: category,
        dateRange,
        detail: reason.trim(),
        supportingDocument,
      });

      drafts.leave = null;
      Alert.alert(
        'Request submitted',
        `${category} was submitted and is now pending supervisor approval.`,
        [{ text: 'View my requests', onPress: () => router.replace(ROUTES.history) }],
        { cancelable: false }
      );
    } catch (err) {
      console.error('Submit leave request error:', err);
      Alert.alert('Submission failed', err.message || 'Could not reach the server.');
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = () => {
    if (!editing) drafts.leave = null;
    if (editing) router.replace(returnTo);
    else goBackOrHome(router);
  };

  return (
    <Card>
      <View style={styles.cardHead}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: c.text }]}>
            {editing ? `Edit Request ${editTarget.id}` : 'Request Details'}
          </Text>
          <Text style={{ color: c.text, fontSize: 13 }}>
            {editing
              ? 'Update the details of your pending request.'
              : 'Select the type of request you wish to submit.'}
          </Text>
        </View>
      </View>
      {!editing && <Toggle mode="leave" onSwitch={onSwitch} />}

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
        helper="Choose how many days you need, then pick your start date."
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
        placeholder="Example: I need leave to attend a scheduled examination / medical appointment."
      />
      <View style={{ height: 12 }} />
      <SuggestedText items={LEAVE_SUGGESTIONS} onPick={(t) => setReason(t)} />

      <FormFooter
        submitLabel={editing ? 'Save changes' : 'Submit Leave Request'}
        onCancel={cancel}
        onSubmit={submit}
        loading={submitting}
      />
    </Card>
  );
}

/* ============================ SWAP FORM ============================= */
function SwapForm({ editTarget, returnTo }) {
  const router = useRouter();
  const { c } = useStudTheme();
  const { updateRequest, addRequest } = useRequests();
  const editing = Boolean(editTarget);
  const loadedFor = useRef(null);

  // 🔥 Directly fetch shifts from the backend API so we know it's exactly what is in the DB
  const [shifts, setShifts] = useState([]);
  const [shiftsLoading, setShiftsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/api/shifts');
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && Array.isArray(data)) {
            // Filter to only show shifts from today onwards for the swap dropdown
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const futureShifts = data.filter(s => {
              if (!s.shiftDate) return false;
              const d = new Date(s.shiftDate + 'T00:00:00');
              return d >= today;
            });
            setShifts(futureShifts);
          }
        }
      } catch (err) {
        console.warn('Failed to load shifts for swap:', err);
      } finally {
        if (!cancelled) setShiftsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const dynamicShiftOptions = useMemo(() => {
    return shifts.map((s) => {
      const dateObj = fromKey(s.shiftDate);
      return {
        value: s.shiftDate,
        label: `${formatLong(dateObj)} · ${s.startTime} - ${s.endTime}`,
      };
    });
  }, [shifts]);

  const saved = editing ? {} : (drafts.swap || {});
  const [currentOptions, setCurrentOptions] = useState([]);
  const [assistants, setAssistants] = useState(AVAILABLE_ASSISTANTS);
  const [currentKey, setCurrentKey] = useState(saved.currentKey || '');
  const [newKey, setNewKey] = useState(saved.newKey || '');
  const [assistant, setAssistant] = useState(saved.assistant || '');
  const [reason, setReason] = useState(saved.reason || '');
  const [submitting, setSubmitting] = useState(false);

  // Sync options when shifts load
  useEffect(() => {
    if (!editing) {
      setCurrentOptions(dynamicShiftOptions);
      if (!currentKey && dynamicShiftOptions.length > 0) {
        setCurrentKey(dynamicShiftOptions[0].value);
      }
    }
  }, [dynamicShiftOptions, editing, currentKey]);

  useEffect(() => {
    if (!editTarget || loadedFor.current === editTarget.rawId) return;
    loadedFor.current = editTarget.rawId;

    const meta = swapMeta(editTarget);
    const fromDate = meta ? parseDateString(meta.from) : null;
    const toDate = meta ? parseDateString(meta.to) : parseDateString(editTarget.dateRange);

    if (fromDate) {
      const key = toKey(fromDate);
      setCurrentKey(key);
      if (!dynamicShiftOptions.some((o) => o.value === key)) {
        setCurrentOptions([
          { value: key, label: `${formatLong(fromDate)} · (original shift)` },
          ...dynamicShiftOptions,
        ]);
      }
    }

    if (toDate) setNewKey(toKey(toDate));

    const who = editTarget.replacement || meta?.with || '';
    if (who) {
      setAssistant(who);
      if (!AVAILABLE_ASSISTANTS.includes(who)) {
        setAssistants([who, ...AVAILABLE_ASSISTANTS]);
      }
    }

    setReason(editTarget.reason || '');
  }, [editTarget, dynamicShiftOptions]);

  useEffect(() => {
    if (editing) return;
    drafts.swap = { currentKey, newKey, assistant, reason };
  }, [editing, currentKey, newKey, assistant, reason]);

  const submit = async () => {
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

    setSubmitting(true);
    try {
      const newDateLabel = formatLong(fromKey(newKey));
      const fromLabel = formatLong(fromKey(currentKey));
      const detail = `Swap from ${fromLabel} to ${newDateLabel} with ${assistant}. ${
        reason.trim() || 'Shift swap requested with an eligible colleague.'
      }`;

      if (editing) {
        await updateRequest(editTarget.id, {
          type: `Shift Swap – ${assistant}`,
          replacement: assistant,
          dateRange: newDateLabel,
          detail,
          reason: reason.trim(),
        });
        drafts.swap = null;
        Alert.alert(
          'Swap updated',
          `${editTarget.id} has been saved.`,
          [{ text: 'OK', onPress: () => router.replace(returnTo) }],
          { cancelable: false }
        );
        return;
      }

      await addRequest({
        type: `Shift Swap – ${assistant}`,
        replacement: assistant,
        dateRange: newDateLabel,
        detail,
        reason: reason.trim(),
      });

      drafts.swap = null;
      Alert.alert(
        'Swap request submitted',
        'Your shift swap was sent for department lead approval.',
        [{ text: 'View my requests', onPress: () => router.replace(ROUTES.history) }],
        { cancelable: false }
      );
    } catch (err) {
      console.error('Submit swap request error:', err);
      Alert.alert('Submission failed', err.message || 'Could not reach the server.');
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = () => {
    if (!editing) drafts.swap = null;
    if (editing) router.replace(returnTo);
    else goBackOrHome(router);
  };

  return (
    <>
      <Card>
        <Text style={[styles.cardTitleSm, { color: c.text }]}>Approved shift swaps</Text>
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
            <Text style={[styles.cardTitle, { color: c.text }]}>
              {editing ? `Edit Swap Request ${editTarget.id}` : 'New Swap Request'}
            </Text>
            <Text style={{ color: c.text, fontSize: 12 }}>
              Fill in the details for your proposed shift exchange.
            </Text>
          </View>
        </View>

        <Text style={[styles.step, { color: c.text }]}>1. SELECT YOUR CURRENT SHIFT</Text>
        
        {shiftsLoading ? (
          <View style={{ paddingVertical: 10, marginBottom: 16 }}>
            <ActivityIndicator color={c.primary} size="small" />
          </View>
        ) : currentOptions.length === 0 ? (
          <View style={[styles.dashed, { borderColor: c.border, backgroundColor: c.panel, marginBottom: 16 }]}>
             <Text style={{ color: c.danger, fontSize: 13, fontWeight: '600' }}>
               You don't have any upcoming shifts available to swap.
             </Text>
          </View>
        ) : (
          <SelectField
            label="Current shift"
            icon="time-outline"
            value={currentKey}
            options={currentOptions}
            onChange={(v) => {
              setCurrentKey(v);
              if (newKey === v) setNewKey('');
            }}
          />
        )}

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
          helper="Past dates, Sundays, holidays, approved leave, approved swaps and your selected current shift are unavailable."
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
            {assistants.map((name) => {
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

        <FormFooter
          submitLabel={editing ? 'Save changes' : 'Submit Swap Request'}
          onCancel={cancel}
          onSubmit={submit}
          loading={submitting}
        />
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
  const { requests, loading } = useRequests();

  const editId = params.editId;
  const fromParam = params.from || 'dashboard';
  const returnTo = fromParam === 'history' ? ROUTES.history : ROUTES.dashboard;

  const editTarget = editId ? requests.find((r) => String(r.rawId) === String(editId)) : null;
  const editing = Boolean(editTarget && editTarget.status === 'Pending');
  const isSwapTarget = editTarget && String(editTarget.type || '').toLowerCase().includes('shift swap');

  const [mode, setMode] = useState(
    params.mode === 'swap' || isSwapTarget ? 'swap' : 'leave'
  );

  useEffect(() => {
    if (params.mode === 'swap') setMode('swap');
    else if (params.mode === 'leave') setMode('leave');
    else if (editing && isSwapTarget) setMode('swap');
    else if (editing && !isSwapTarget) setMode('leave');
  }, [params.mode, editing, isSwapTarget]);

  if (editId && !editing && editTarget && editTarget.status !== 'Pending') {
    return (
      <ScreenShell active="requests" pill="STUDENT PORTAL" title="Request can't be edited" subtitle="">
        <Card>
          <Text style={{ color: c.text, fontSize: 14 }}>
            This request is {editTarget.status.toLowerCase()} and can no longer be changed.
          </Text>
          <View style={{ marginTop: 12 }}>
            <AppButton label="Back to my requests" onPress={() => require('expo-router').router.replace(returnTo)} />
          </View>
        </Card>
      </ScreenShell>
    );
  }

  if (editId && !editTarget && loading) {
    return (
      <ScreenShell active="requests" pill="STUDENT PORTAL" title="Loading request…" subtitle="">
        <Card>
          <Text style={{ color: c.text, fontSize: 14 }}>Loading…</Text>
        </Card>
      </ScreenShell>
    );
  }

  if (mode === 'swap') {
    return (
      <ScreenShell
        active="requests"
        pill="SCHEDULING MANAGEMENT"
        title={editing ? 'Edit Shift Swap' : 'Shift Swapping Request'}
        subtitle="Choose an upcoming shift, then choose a new working date. The student assistants available on that date will be listed for you to pick from."
        back={
          <Pressable
            onPress={() => (editing ? require('expo-router').router.replace(returnTo) : setMode('leave'))}
            style={styles.back}
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={14} color={c.title} />
            <Text style={{ color: c.title, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>
              {editing ? 'BACK' : 'BACK TO REQUEST LEAVE'}
            </Text>
          </Pressable>
        }
      >
        <SwapForm editTarget={editing ? editTarget : null} returnTo={returnTo} />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      active="requests"
      pill="STUDENT PORTAL"
      title={editing ? 'Edit Leave Request' : 'Submit a Request'}
      subtitle="Please provide the details for your absence or scheduling change. Approved leave dates become unavailable automatically."
    >
      <LeaveForm onSwitch={setMode} editTarget={editing ? editTarget : null} returnTo={returnTo} />
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