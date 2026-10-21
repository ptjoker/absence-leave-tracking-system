import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    useWindowDimensions,
} from 'react-native';
import { MONTHS, WEEKDAYS, buildMonthGrid, formatLong, fromKey, toKey } from '../../constants/studData';
import { useStudTheme } from '../../constants/studTheme';

/* ------------------------------ Card ------------------------------ */
export function Card({ children, style }) {
  const { c } = useStudTheme();
  return <View style={[styles.card, { backgroundColor: c.card }, style]}>{children}</View>;
}

/* ----------------------------- Button ----------------------------- */
export function AppButton({ label, icon, iconRight, onPress, variant = 'primary', disabled, style }) {
  const { c } = useStudTheme();
  const bg = variant === 'danger' ? c.danger : variant === 'light' ? c.card : c.primary;
  const fg = variant === 'light' ? c.text : '#ffffff';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: bg,
          borderColor: variant === 'light' ? c.border : bg,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={16} color={fg} style={styles.btnIconLeft} /> : null}
      <Text style={[styles.btnText, { color: fg }]}>{label}</Text>
      {iconRight ? <Ionicons name={iconRight} size={14} color={fg} style={styles.btnIconRight} /> : null}
    </Pressable>
  );
}

/* --------------------------- Status pill -------------------------- */
export function StatusPill({ status }) {
  const { c } = useStudTheme();
  const map = {
    Approved: { bg: c.okBg, fg: c.okText },
    Rejected: { bg: c.badBg, fg: c.badText },
    Pending: { bg: c.warnBg, fg: c.warnText },
    Active: { bg: c.okBg, fg: c.okText },
  };
  const s = map[status] || map.Pending;
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <Text style={[styles.pillText, { color: s.fg }]}>{status}</Text>
    </View>
  );
}

/* --------------------------- Field label -------------------------- */
export function FieldLabel({ text, icon, required, upper }) {
  const { c } = useStudTheme();
  return (
    <View style={styles.labelRow}>
      {icon ? <Ionicons name={icon} size={13} color={c.text} style={{ marginRight: 5 }} /> : null}
      <Text style={[upper ? styles.labelUpper : styles.label, { color: c.text }]}>
        {upper ? text.toUpperCase() : text}
        {required ? <Text style={{ color: '#dc2626' }}> *</Text> : null}
      </Text>
    </View>
  );
}

export function HelperText({ children, italic }) {
  const { c } = useStudTheme();
  return (
    <Text style={[styles.helper, { color: c.muted }, italic ? { fontStyle: 'italic' } : null]}>
      {children}
    </Text>
  );
}

/* ---------------------------- Select field ------------------------ */
export function SelectField({ label, icon, upper, value, options, onChange, placeholder = 'Select', helper }) {
  const { c } = useStudTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.fieldWrap}>
      <FieldLabel text={label} icon={icon} upper={upper} />
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}
      >
        <Text style={[styles.inputText, { color: selected ? c.text : c.muted }]}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={c.text} />
      </Pressable>
      {helper ? <HelperText>{helper}</HelperText> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: c.card }]} onPress={() => {}}>
            <Text style={[styles.sheetTitle, { color: c.text }]}>{label}</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {options.map((o) => {
                const active = o.value === value;
                return (
                  <Pressable
                    key={String(o.value)}
                    onPress={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    style={[
                      styles.option,
                      { borderBottomColor: c.border },
                      active ? { backgroundColor: c.primarySoft } : null,
                    ]}
                  >
                    <Text style={[styles.optionText, { color: active ? c.primary : c.text }]}>{o.label}</Text>
                    {active ? <Ionicons name="checkmark" size={18} color={c.primary} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/* --------------------------- Calendar picker ---------------------- */
export function CalendarPicker({ visible, value, onSelect, onClose, isDisabled, title = 'Select a date' }) {
  const { c } = useStudTheme();
  const { width } = useWindowDimensions();
  const initial = value ? fromKey(value) : new Date();
  const [view, setView] = useState({ y: initial.getFullYear(), m: initial.getMonth() });

  useEffect(() => {
    if (visible) {
      const d = value ? fromKey(value) : new Date();
      setView({ y: d.getFullYear(), m: d.getMonth() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const sheetW = Math.min(width - 32, 380);
  const cell = Math.floor((sheetW - 24) / 7);
  const weeks = useMemo(() => buildMonthGrid(view.y, view.m), [view]);

  const shiftMonth = (n) => {
    const d = new Date(view.y, view.m + n, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: c.card, width: sheetW }]} onPress={() => {}}>
          <Text style={[styles.sheetTitle, { color: c.text }]}>{title}</Text>
          <View style={styles.calHeader}>
            <Pressable
              onPress={() => shiftMonth(-1)}
              style={[styles.navBtn, { borderColor: c.border, backgroundColor: c.inputBg }]}
              accessibilityLabel="Previous month"
            >
              <Ionicons name="chevron-back" size={16} color={c.text} />
            </Pressable>
            <Text style={[styles.calMonth, { color: c.text }]}>
              {MONTHS[view.m]} {view.y}
            </Text>
            <Pressable
              onPress={() => shiftMonth(1)}
              style={[styles.navBtn, { borderColor: c.border, backgroundColor: c.inputBg }]}
              accessibilityLabel="Next month"
            >
              <Ionicons name="chevron-forward" size={16} color={c.text} />
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row' }}>
            {WEEKDAYS.map((w) => (
              <Text key={w} style={[styles.calWeekday, { width: cell, color: c.muted }]}>
                {w}
              </Text>
            ))}
          </View>
          {weeks.map((week, wi) => (
            <View key={`w${wi}`} style={{ flexDirection: 'row' }}>
              {week.map((d, di) => {
                if (!d) return <View key={`e${di}`} style={{ width: cell, height: cell }} />;
                const key = toKey(d);
                const disabled = isDisabled ? isDisabled(d) : false;
                const selected = key === value;
                return (
                  <Pressable
                    key={key}
                    disabled={disabled}
                    onPress={() => {
                      onSelect(key);
                      onClose();
                    }}
                    style={[
                      styles.calDay,
                      { width: cell, height: cell },
                      selected ? { backgroundColor: c.primary } : null,
                    ]}
                  >
                    <Text
                      style={{
                        color: selected ? '#fff' : c.text,
                        opacity: disabled ? 0.3 : 1,
                        fontWeight: selected ? '700' : '500',
                      }}
                    >
                      {d.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
          <HelperText italic>Greyed-out dates are unavailable.</HelperText>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ----------------------------- Date field ------------------------- */
export function DateField({ label, icon = 'calendar-outline', required, value, onChange, isDisabled, placeholder, helper }) {
  const { c } = useStudTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.fieldWrap}>
      <FieldLabel text={label} icon={icon} required={required} />
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}
      >
        <Text style={[styles.inputText, { color: value ? c.text : c.muted }]}>
          {value ? formatLong(fromKey(value)) : placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={16} color={c.text} />
      </Pressable>
      {helper ? <HelperText italic>{helper}</HelperText> : null}
      <CalendarPicker
        visible={open}
        value={value}
        onSelect={onChange}
        onClose={() => setOpen(false)}
        isDisabled={isDisabled}
        title={label}
      />
    </View>
  );
}

/* ----------------------------- Text area -------------------------- */
export function TextArea({ value, onChangeText, placeholder, minHeight = 100 }) {
  const { c } = useStudTheme();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={c.muted}
      multiline
      textAlignVertical="top"
      style={[
        styles.textArea,
        { minHeight, backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text },
      ]}
    />
  );
}

/* -------------------------- Suggested text ------------------------ */
export function SuggestedText({ items, onPick }) {
  const { c } = useStudTheme();
  return (
    <View style={[styles.suggested, { backgroundColor: c.panel, borderColor: c.border }]}>
      <Text style={[styles.suggestedTitle, { color: c.text }]}>SUGGESTED TEXT</Text>
      <View style={styles.chipWrap}>
        {items.map((t) => (
          <Pressable
            key={t}
            onPress={() => onPick(t)}
            style={[styles.chip, { borderColor: c.border, backgroundColor: c.card }]}
          >
            <Text style={{ color: c.text, fontSize: 12 }}>{t}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/* --------------------------- Requests table ----------------------- */
export function RequestsTable({ rows, idColor }) {
  const { c } = useStudTheme();
  return (
    <View>
      <View style={[styles.tr, { borderBottomColor: c.border }]}>
        <Text style={[styles.th, { flex: 1.1, color: c.text }]}>ID</Text>
        <Text style={[styles.th, { flex: 2, color: c.text }]}>TYPE</Text>
        <Text style={[styles.th, { flex: 1.2, color: c.text, textAlign: 'right' }]}>STATUS</Text>
      </View>
      {rows.length === 0 ? (
        <Text style={{ color: c.muted, paddingVertical: 14 }}>No requests yet.</Text>
      ) : (
        rows.map((r) => (
          <View key={r.id} style={[styles.tr, { borderBottomColor: c.border }]}>
            <Text style={[styles.td, { flex: 1.1, color: idColor || c.text }]}>{r.id}</Text>
            <Text style={[styles.td, { flex: 2, color: c.text }]}>{r.type}</Text>
            <View style={{ flex: 1.2, alignItems: 'flex-end' }}>
              <StatusPill status={r.status} />
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
  },
  btnText: { fontSize: 14, fontWeight: '700' },
  btnIconLeft: { marginRight: 6 },
  btnIconRight: { marginLeft: 6 },
  pill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10 },
  pillText: { fontSize: 12, fontWeight: '700' },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '700' },
  labelUpper: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  helper: { fontSize: 12, marginTop: 6, lineHeight: 17 },
  fieldWrap: { marginBottom: 16 },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputText: { flex: 1, fontSize: 14, marginRight: 8 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  sheet: { width: '100%', maxWidth: 420, borderRadius: 14, padding: 12 },
  sheetTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8, paddingHorizontal: 4 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: { flex: 1, fontSize: 14 },
  calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  calMonth: { fontSize: 15, fontWeight: '700' },
  navBtn: { width: 34, height: 34, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  calWeekday: { textAlign: 'center', fontSize: 11, fontWeight: '700', paddingVertical: 6 },
  calDay: { alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  textArea: { borderWidth: 1, borderRadius: 6, padding: 12, fontSize: 14 },
  suggested: { borderWidth: 1, borderRadius: 6, padding: 12, marginBottom: 16 },
  suggestedTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6, marginRight: 6, marginBottom: 6 },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  th: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  td: { fontSize: 14, paddingRight: 6 },
});