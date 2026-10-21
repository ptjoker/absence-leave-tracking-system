import { useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useStudTheme } from '../../constants/studTheme';
import RequestDetailsModal from './RequestDetailsModal';

export default function RequestsTableWithActions({
  rows = [],
  idColor,
  onEdit,
  onCancel,
  cancellingId,
  emptyLabel = 'No requests found.',
  onPressId // Prop passed from dashboard and history
}) {
  const { c } = useStudTheme();
  const [selectedReq, setSelectedReq] = useState(null);

  const getStatusStyle = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('reject') || s.includes('declin')) return { bg: '#FEE2E2', text: '#991B1B' };
    if (s.includes('cancel')) return { bg: '#F3F4F6', text: '#374151' };
    if (s.includes('awaiting') || s.includes('colleague')) return { bg: '#E8EEFB', text: '#1E2A4A' };
    if (s.includes('approved')) return { bg: '#D1FAE5', text: '#065F46' };
    if (s.includes('pending')) return { bg: '#FEF3C7', text: '#92400E' };
    return { bg: '#F3F4F6', text: '#374151' };
  };

  const handleIdClick = (req) => {
    if (onPressId) {
      onPressId(req);
    } else {
      setSelectedReq(req);
    }
  };

  if (!rows || rows.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={{ color: c.text, textAlign: 'center' }}>{emptyLabel}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Table Header */}
      <View style={[styles.headerRow, { borderBottomColor: c.border }]}>
        <Text style={[styles.headerCell, styles.colId, { color: c.text }]}>ID</Text>
        <Text style={[styles.headerCell, styles.colType, { color: c.text }]}>TYPE</Text>
        <Text style={[styles.headerCell, styles.colStatus, { color: c.text }]}>STATUS</Text>
        <Text style={[styles.headerCell, styles.colActions, { color: c.text }]}>ACTIONS</Text>
      </View>

      {/* Table Rows */}
      {rows.map((req) => {
        const statusStyle = getStatusStyle(req.status);
        const isCancelling = cancellingId === req.id;

        const canEdit = Boolean(onEdit) && req.status === 'Pending';
        const canCancel = Boolean(onCancel) && (req.status === 'Pending' || req.status === 'Approved');
        const hasActions = canEdit || canCancel;

        return (
          <View key={req.rawId || req.id} style={[styles.row, { borderBottomColor: c.border }]}>

            {/* CLICKABLE ID COLUMN */}
            <TouchableOpacity
              style={styles.colId}
              onPress={() => handleIdClick(req)}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              activeOpacity={0.6}
            >
              <Text style={[styles.idText, { color: idColor || c.primary, textDecorationLine: 'underline' }]}>
                {req.id}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.cell, styles.colType, { color: c.text }]} numberOfLines={2}>
              {req.type}
            </Text>

            <View style={styles.colStatus}>
              <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                <Text style={[styles.statusText, { color: statusStyle.text }]}>
                  {req.status}
                </Text>
              </View>
            </View>

            {/* ACTIONS: text labels, or a dash when nothing can be done */}
            <View style={[styles.colActions, styles.actionsRow]}>
              {isCancelling ? (
                <Text style={{ fontSize: 12, color: c.text }}>...</Text>
              ) : hasActions ? (
                <>
                  {canEdit && (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => onEdit(req)}
                      style={styles.actionBtn}
                      hitSlop={6}
                    >
                      <Text style={[styles.actionText, { color: c.primary }]}>Edit</Text>
                    </Pressable>
                  )}
                  {canCancel && (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => onCancel(req)}
                      style={styles.actionBtn}
                      hitSlop={6}
                    >
                      <Text style={[styles.actionText, { color: c.danger || '#EF4444' }]}>Cancel</Text>
                    </Pressable>
                  )}
                </>
              ) : (
                <Text style={[styles.dashText, { color: c.muted || c.text }]}>—</Text>
              )}
            </View>
          </View>
        );
      })}

      {/* Internal fallback modal if used independently without a custom onPressId */}
      {!onPressId && (
        <RequestDetailsModal
          visible={!!selectedReq}
          request={selectedReq}
          onClose={() => setSelectedReq(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', marginTop: 10 },
  emptyContainer: { padding: 20, alignItems: 'center' },
  headerRow: { flexDirection: 'row', paddingBottom: 10, borderBottomWidth: 1, marginBottom: 8 },
  headerCell: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  cell: { fontSize: 13 },
  idText: { fontSize: 13, fontWeight: '700' },
  colId: { flex: 1.2, justifyContent: 'center' },
  colType: { flex: 2 },
  colStatus: { flex: 1.3, alignItems: 'flex-start' },
  colActions: { flex: 1.5, alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  actionBtn: { paddingVertical: 4, paddingHorizontal: 6, marginLeft: 6 },
  actionText: { fontSize: 12, fontWeight: '700' },
  dashText: { fontSize: 14, fontWeight: '700', paddingRight: 6 },
});