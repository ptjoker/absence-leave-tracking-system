import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useStudTheme } from '../../constants/studTheme';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// "16 October 2026 at 09:50" (manual formatting so it is identical on web/iOS/Android)
const formatSubmitted = (value) => {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()} at ${hh}:${mm}`;
};

// Pill colours that match the screenshots
const getStatusStyle = (status) => {
  const s = String(status || '').toLowerCase();
  if (s.includes('reject') || s.includes('declin')) return { bg: '#FEE2E2', text: '#B91C1C' };
  if (s.includes('cancel')) return { bg: '#F3F4F6', text: '#374151' };
  if (s.includes('awaiting') || s.includes('colleague')) return { bg: '#E8EEFB', text: '#1E2A4A' };
  if (s.includes('approved')) return { bg: '#D1FAE5', text: '#065F46' };
  if (s.includes('pending')) return { bg: '#FEF3C7', text: '#D97706' };
  return { bg: '#F3F4F6', text: '#374151' };
};

// Colleague decision box for shift swaps, driven by the request status
const getColleagueDecision = (status) => {
  const s = String(status || '').toLowerCase();
  if (s.includes('colleague') && (s.includes('reject') || s.includes('declin'))) {
    return {
      text: 'Declined. The colleague rejected this swap offer.',
      bg: '#FEF2F2', border: '#EF4444', color: '#991B1B',
    };
  }
  if (s.includes('awaiting colleague') || s === 'pending') {
    return {
      text: 'Waiting for your colleague to respond to this offer.',
      bg: '#FFFBEB', border: '#F59E0B', color: '#92400E',
    };
  }
  if (s.includes('approved') && !s.includes('colleague')) {
    return {
      text: 'Accepted. The supervisor has approved this swap.',
      bg: '#ECFDF5', border: '#10B981', color: '#065F46',
    };
  }
  if (s.includes('reject')) {
    return {
      text: "Accepted by colleague. The supervisor did not approve this swap.",
      bg: '#ECFDF5', border: '#10B981', color: '#065F46',
    };
  }
  return {
    text: "Accepted. This offer is waiting for the supervisor's final decision.",
    bg: '#ECFDF5', border: '#10B981', color: '#065F46',
  };
};

export default function RequestDetailsModal({ visible, request, onClose }) {
  const { c } = useStudTheme();

  if (!request) return null;

  const boxBg = c.inputBg || '#F3F4F6';
  const isSwap = String(request.type || '').toLowerCase().includes('shift swap');

  // "Swap from X to Y with NAME."
  const swapMatch = `${request.detail || ''} ${request.reason || ''}`.match(
    /Swap from (.+?) to (.+?) with (.+?)(?:\.|$)/i
  );
  const replacement = request.replacement || request.swapWith || (swapMatch ? swapMatch[3] : null);

  const dates =
    request.dateRange ||
    (isSwap && swapMatch ? `Swap from ${swapMatch[1]} to ${swapMatch[2]}` : 'N/A');

  const requesterHours =
    request.requesterShiftHours || request.requesterShift || request.shiftHours || '08:00–12:00';
  const offeredHours =
    request.offeredShiftHours || request.offeredShift || request.shiftHours || '08:00–12:00';

  const statusStyle = getStatusStyle(request.status);
  const decision = isSwap ? getColleagueDecision(request.status) : null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: c.panel || c.card || '#fff' }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: c.primary }]}>REQUEST DETAILS</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close details">
              <Ionicons name="close" size={20} color={c.text} />
            </Pressable>
          </View>
          <Text style={[styles.requestId, { color: c.text }]}>{request.id}</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.grid}>
              {/* TYPE */}
              <View style={[styles.box, { backgroundColor: boxBg }]}>
                <View style={styles.boxHeader}>
                  <Ionicons name="document-text-outline" size={13} color={c.text} />
                  <Text style={[styles.boxLabel, { color: c.text }]}>TYPE</Text>
                </View>
                <Text style={[styles.boxValue, { color: c.text }]}>{request.type || 'N/A'}</Text>
              </View>

              {/* STATUS (pill) */}
              <View style={[styles.box, { backgroundColor: boxBg }]}>
                <Text style={[styles.boxLabel, styles.noIconLabel, { color: c.text }]}>STATUS</Text>
                <View style={[styles.pill, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[styles.pillText, { color: statusStyle.text }]}>
                    {request.status || 'Unknown'}
                  </Text>
                </View>
              </View>

              {/* DATES */}
              <View style={[styles.box, { backgroundColor: boxBg }]}>
                <View style={styles.boxHeader}>
                  <Ionicons name="calendar-outline" size={13} color={c.text} />
                  <Text style={[styles.boxLabel, { color: c.text }]}>DATES</Text>
                </View>
                <Text style={[styles.boxValue, { color: c.text }]}>{dates}</Text>
              </View>

              {/* SUBMITTED */}
              <View style={[styles.box, { backgroundColor: boxBg }]}>
                <View style={styles.boxHeader}>
                  <Ionicons name="time-outline" size={13} color={c.text} />
                  <Text style={[styles.boxLabel, { color: c.text }]}>SUBMITTED</Text>
                </View>
                <Text style={[styles.boxValue, { color: c.text }]}>
                  {formatSubmitted(request.submittedAt)}
                </Text>
              </View>

              {/* SWAP: shift hours */}
              {isSwap && (
                <>
                  <View style={[styles.box, { backgroundColor: boxBg }]}>
                    <View style={styles.boxHeader}>
                      <Ionicons name="time-outline" size={13} color={c.text} />
                      <Text style={[styles.boxLabel, { color: c.text }]}>REQUESTER SHIFT HOURS</Text>
                    </View>
                    <Text style={[styles.boxValue, { color: c.text }]}>{requesterHours}</Text>
                  </View>
                  <View style={[styles.box, { backgroundColor: boxBg }]}>
                    <View style={styles.boxHeader}>
                      <Ionicons name="time-outline" size={13} color={c.text} />
                      <Text style={[styles.boxLabel, { color: c.text }]}>OFFERED SHIFT HOURS</Text>
                    </View>
                    <Text style={[styles.boxValue, { color: c.text }]}>{offeredHours}</Text>
                  </View>
                </>
              )}

              {/* REFERENCE */}
              <View style={[styles.box, { backgroundColor: boxBg }]}>
                <View style={styles.boxHeader}>
                  <Ionicons name="pricetag-outline" size={13} color={c.text} />
                  <Text style={[styles.boxLabel, { color: c.text }]}>REFERENCE</Text>
                </View>
                <Text style={[styles.boxValue, { color: c.text }]}>{request.id}</Text>
              </View>
            </View>

            {/* REASON */}
            <View style={[styles.fullBox, { backgroundColor: boxBg }]}>
              <Text style={[styles.boxLabel, styles.noIconLabel, { color: c.text }]}>REASON</Text>
              <Text style={[styles.boxValue, styles.reasonValue, { color: c.text }]}>
                {request.reason || request.detail || 'N/A'}
              </Text>
            </View>

            {/* SWAP: colleague decision */}
            {isSwap && decision && (
              <View
                style={[
                  styles.fullBox,
                  { backgroundColor: decision.bg, borderColor: decision.border, borderWidth: 1 },
                ]}
              >
                <Text style={[styles.boxLabel, styles.noIconLabel, { color: decision.color }]}>
                  COLLEAGUE DECISION
                </Text>
                <Text style={[styles.boxValue, { color: decision.color }]}>{decision.text}</Text>
              </View>
            )}

            {/* SWAP: replacement */}
            {isSwap && replacement ? (
              <View style={[styles.box, { backgroundColor: boxBg }]}>
                <View style={styles.boxHeader}>
                  <Ionicons name="person-outline" size={13} color={c.text} />
                  <Text style={[styles.boxLabel, { color: c.text }]}>REPLACEMENT</Text>
                </View>
                <Text style={[styles.boxValue, { color: c.text }]}>{replacement}</Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: c.border || '#E5E7EB' }]}>
            <Pressable
              accessibilityRole="button"
              style={[styles.closeBtn, { borderColor: c.border || '#E5E7EB', backgroundColor: c.card || '#fff' }]}
              onPress={onClose}
            >
              <Text style={{ color: c.text, fontWeight: '700', fontSize: 14 }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '92%',
    borderRadius: 14,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  requestId: { fontSize: 24, fontWeight: '800', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  box: { width: '48.5%', padding: 14, borderRadius: 8, marginBottom: 10 },
  fullBox: { width: '100%', padding: 14, borderRadius: 8, marginBottom: 10 },
  boxHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  boxLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8, marginLeft: 6 },
  noIconLabel: { marginLeft: 0, marginBottom: 6 },
  boxValue: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  reasonValue: { fontWeight: '500' },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillText: { fontSize: 13, fontWeight: '700' },
  footer: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
  },
  closeBtn: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderRadius: 6,
  },
});