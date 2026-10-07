import { useRouter } from 'expo-router';
import { Text } from 'react-native';
import ScreenShell from '../components/studentDash/ScreenShell';
import { AppButton, Card, RequestsTable } from '../components/studentDash/ui';
import { USER, useRequests } from '../constants/studData';
import { ROUTES, useStudTheme } from '../constants/studTheme';

export default function StudHistory() {
  const router = useRouter();
  const { c } = useStudTheme();
  const requests = useRequests(); // TODO(API): GET /requests (all requests for this student)

  return (
    <ScreenShell
      active="history"
      pill="STUDENT PORTAL"
      title={`${USER.name}’s History`}
      subtitle="View all the requests you made."
      headerRight={<AppButton icon="add" label="New Request" onPress={() => router.push(ROUTES.requests)} />}
    >
      <Card>
        <Text style={{ color: c.text, fontSize: 18, fontWeight: '700', marginBottom: 10 }}>All Leave Requests</Text>
        <RequestsTable rows={requests} idColor={c.text} />
      </Card>
    </ScreenShell>
  );
}