import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text } from 'react-native';
import ScreenShell from '../components/studentDash/ScreenShell';
import RequestsTableWithActions from '../components/studentDash/RequestsTableWithActions';
import { AppButton, Card } from '../components/studentDash/ui';
import { useRequests } from '../constants/studData';
import { ROUTES, useStudTheme } from '../constants/studTheme';
import { useStudent } from '../hooks/useStudent';

export default function StudHistory() {
  const router = useRouter();
  const { c } = useStudTheme();
  const { user } = useStudent();

  const { requests, cancelRequest, loading } = useRequests();
  const [cancellingId, setCancellingId] = useState(null);

  const handleEdit = (req) => {
    const isSwap = String(req.type || '').toLowerCase().includes('shift swap');
    router.push({
      pathname: ROUTES.requests,
      params: {
        editId: req.rawId || req.id,
        from: 'history',
        mode: isSwap ? 'swap' : 'leave',
      },
    });
  };

  const handleCancel = (req) => {
    Alert.alert(
      'Cancel request',
      `Are you sure you want to cancel ${req.id}? It will remain in your history with Cancelled status.`,
      [
        { text: 'Keep request', style: 'cancel' },
        {
          text: 'Yes, cancel',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(req.id);
            try {
              await cancelRequest(req.rawId || req.id);
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not cancel request.');
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  const name = user?.name || 'Student';

  return (
    <ScreenShell
      active="history"
      pill="STUDENT PORTAL"
      title={`${name}’s History`}
      subtitle="View all the requests you made."
      headerRight={
        <AppButton
          icon="add"
          label="New Request"
          onPress={() => router.push(ROUTES.requests)}
        />
      }
    >
      <Card>
        <Text
          style={{ color: c.text, fontSize: 18, fontWeight: '700', marginBottom: 10 }}
        >
          All Leave Requests
        </Text>
        <RequestsTableWithActions
          rows={requests}
          idColor={c.primary}
          onEdit={handleEdit}
          onCancel={handleCancel}
          cancellingId={cancellingId}
          emptyLabel={loading ? 'Loading…' : 'No requests yet.'}
        />
      </Card>
    </ScreenShell>
  );
}