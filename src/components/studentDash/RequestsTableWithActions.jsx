import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useStudTheme } from '../../constants/studTheme';

const STATUS_STYLES = {
  approved: { bg: '#dcfce7', fg: '#15803d', label: 'Approved' },
  rejected: { bg: '#fee2e2', fg: '#b91c1c', label: 'Rejected' },
  pending: { bg: '#fef3c7', fg: '#b45309', label: 'Pending' },
  cancelled: { bg: '#e5e7eb', fg: '#4b5563', label: 'Cancelled' },
};

export function StatusBadge({ status }) {
  const s = STATUS_STYLES[String(status).toLowerCase()] || STATUS_STYLES.pending;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
}

export default function RequestsTableWithActions({
  rows,
  idColor,
  onEdit,
  onCancel,
  cancellingId,
  emptyLabel = 'No requests yet.',
}) {
  const { c } = useStudTheme();

  if (!rows || rows.length === 0) {
    return (
      <Text style={{ color: c.text, textAlign: 'center', marginTop: 10, fontSize: 13 }}>
        {emptyLabel}
      </Text>
    );
  }

  return (
    <View>
      <View style={styles.tHead}>
        <Text style={[styles.th, styles.colId, { color: c.text }]}>ID</Text>
        <Text style={[styles.th, styles.colType, { color: c.text }]}>TYPE</Text>
        <Text style={[styles.th, styles.colStatus, { color: c.text }]}>STATUS</Text>
        <Text style={[styles.th, styles.colActions, { color: c.text }]}>ACTIONS</Text>
      </View>

      {rows.map((r) => {
        const isPending = String(r.status).toLowerCase() === 'pending';
        const isCancelling = cancellingId === r.id;
        return (
          <View key={r.id} style={[styles.tRow, { borderTopColor: c.border }]}>
            <Text style={[styles.td, styles.colId, { color: idColor }]}>{r.id}</Text>
            <Text style={[styles.td, styles.colType, { color: c.text }]} numberOfLines={2}>
              {r.type}
            </Text>
            <View style={styles.colStatus}>
              <StatusBadge status={r.status} />
            </View>
            <View style={[styles.colActions, styles.actionsCell]}>
              {isPending ? (
                <>
                  <TouchableOpacity onPress={() => onEdit(r)} disabled={isCancelling}>
                    <Text
                      style={[
                        styles.actionText,
                        { color: c.primary, opacity: isCancelling ? 0.5 : 1 },
                      ]}
                    >
                      Edit
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onCancel(r)}
                    style={{ marginLeft: 10 }}
                    disabled={isCancelling}
                  >
                    <Text
                      style={[
                        styles.actionText,
                        { color: '#dc2626', opacity: isCancelling ? 0.5 : 1 },
                      ]}
                    >
                      {isCancelling ? 'Cancelling…' : 'Cancel'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={{ color: c.text }}>—</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tHead: { flexDirection: 'row', alignItems: 'center', paddingBottom: 8 },
  th: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  tRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  td: { fontSize: 13 },
  colId: { flex: 1.1 },
  colType: { flex: 1.6, paddingRight: 6 },
  colStatus: { flex: 1.3, alignItems: 'flex-start' },
  colActions: { flex: 1.4 },
  actionsCell: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  actionText: { fontSize: 13, fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700' },
});