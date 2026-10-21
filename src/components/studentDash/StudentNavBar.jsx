import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NAV_POSITION, ROUTES, useStudTheme } from '../../constants/studTheme';

/* Dashboard | Schedule | Requests | History | Profile
   Same look as the original bar: icon above a bold label, evenly spaced,
   outline icons when inactive, filled icon + indigo label when active.
   History is the only addition. */
const ITEMS = [
  { key: 'dashboard', label: 'Dashboard', route: ROUTES.dashboard, icon: 'grid-outline', activeIcon: 'grid' },
  { key: 'schedule', label: 'Schedule', route: ROUTES.schedule, icon: 'calendar-outline', activeIcon: 'calendar' },
  { key: 'requests', label: 'Requests', route: ROUTES.requests, icon: 'document-text-outline', activeIcon: 'document-text' },
  { key: 'history', label: 'History', route: ROUTES.history, icon: 'time-outline', activeIcon: 'time' },
  { key: 'profile', label: 'Profile', route: ROUTES.profile, icon: 'person-outline', activeIcon: 'person' },
];

export default function StudentNavBar({ active }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { c } = useStudTheme();
  const atBottom = NAV_POSITION === 'bottom';

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: c.navBg,
          borderTopWidth: atBottom ? StyleSheet.hairlineWidth : 0,
          borderBottomWidth: atBottom ? 0 : StyleSheet.hairlineWidth,
          borderColor: c.border,
          paddingBottom: atBottom ? Math.max(insets.bottom, 8) : 8,
        },
      ]}
    >
      {ITEMS.map((item) => {
        const isActive = item.key === active;
        const color = isActive ? c.navActive : c.navInactive;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => {
              if (!isActive) router.replace(item.route);
            }}
            style={styles.item}
          >
            <Ionicons name={isActive ? item.activeIcon : item.icon} size={26} color={color} />
            <Text style={[styles.label, { color }]} numberOfLines={1}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', paddingTop: 8 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  label: { marginTop: 3, fontSize: 11, fontWeight: '700' },
});