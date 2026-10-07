import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  LOGO_IMAGE,
  NAV_POSITION,
  ROUTES,
  SERIF,
  useStudTheme,
} from '../../constants/studTheme';
import { useStudent } from '../../hooks/useStudent';
import StudentNavBar from './StudentNavBar';

import logoImg from '@/assets/images/logo.png';

// IMPORTANT: Save your provided image to `assets/images/library.jpg`
// If you saved it with a different name, change 'library.jpg' below to match.
const LIBRARY_BG = require('@/assets/images/library.jpg');

/* Shared screen frame: top bar (logo, bell, logout, theme toggle),
   library background, page heading, scrolling body and the nav bar. */
export default function ScreenShell({ active, pill, title, subtitle, back, headerRight, children }) {
  const router = useRouter();
  const { c, mode, toggle } = useStudTheme();
  const { user: USER } = useStudent();
  const navBottom = NAV_POSITION === 'bottom';

  // Uses LOGO_IMAGE from studTheme.js if it is set, otherwise the project's logo.png.
  const logoSource = LOGO_IMAGE || logoImg;
  // Navy icons in light mode (as in the reference header), readable text colour in dark mode.
  const iconColor = mode === 'dark' ? c.text : '#1e3a8a';

  // Logout icon: opens the existing logOut screen (src/app/logOut.jsx -> route "/logOut").
  const logout = () => {
    router.push('/logOut');
  };

  const body = (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heading}>
        {back}
        {pill ? (
          <View style={[styles.pill, { backgroundColor: 'rgba(255,255,255,0.75)' }]}>
            <Text style={[styles.pillText, { color: c.primary }]}>{pill}</Text>
          </View>
        ) : null}
        <Text style={[styles.title, { color: c.title, fontFamily: SERIF }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: c.title }]}>{subtitle}</Text> : null}
        {headerRight ? <View style={styles.actions}>{headerRight}</View> : null}
      </View>
      {children}
    </ScrollView>
  );

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: c.header }]}
      edges={navBottom ? ['top'] : ['top', 'bottom']}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* ---------------- top bar ---------------- */}
      <View style={[styles.topBar, { backgroundColor: c.header, borderBottomColor: c.border }]}>
        <View style={styles.topRow}>
          <View style={styles.brand}>
            <Image source={logoSource} style={styles.logo} resizeMode="contain" />
            <View style={{ marginLeft: 12, flexShrink: 1 }}>
              <Text style={[styles.brandTitle, { color: c.text }]} numberOfLines={1}>
                Student Assistant
              </Text>
              <Text style={[styles.brandSub, { color: c.muted }]} numberOfLines={1}>
                ABSENCE TRACKER
              </Text>
            </View>
          </View>
          <View style={styles.topRight}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              onPress={() => router.push(ROUTES.notifications)}
              style={styles.iconBtn}
            >
              <Ionicons name="notifications-outline" size={26} color={iconColor} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Log out"
              onPress={logout}
              style={styles.iconBtn}
            >
              <Ionicons name="log-out-outline" size={26} color={iconColor} />
            </Pressable>
          </View>
        </View>
        <View style={styles.topRow}>
          <Pressable onPress={toggle} style={styles.modeBtn} accessibilityRole="button">
            <Ionicons name={mode === 'dark' ? 'sunny-outline' : 'moon-outline'} size={14} color={c.text} />
            <Text style={[styles.modeText, { color: c.text }]}> Change mode </Text>
            <Text style={[styles.modeText, { color: c.amber }]}>· {mode === 'dark' ? 'Light' : 'Dark'}</Text>
          </Pressable>
          <View style={{ alignItems: 'flex-end' }}>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.userName, { color: c.text }]}>{USER?.name || 'Loading...'}</Text>
            <Text style={[styles.userRole, { color: c.muted }]}>
              {USER?.position || ''}
            </Text>
          </View>
          </View>
        </View>
      </View>

      {!navBottom ? <StudentNavBar active={active} /> : null}

      {/* ---------------- background + content ---------------- */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.flex}>
          {LIBRARY_BG ? (
            <ImageBackground
              source={LIBRARY_BG}
              style={styles.flex}
              resizeMode="cover"
              imageStyle={{ opacity: 0.7 }} // <-- 70% opacity as requested
            >
              <View style={[StyleSheet.absoluteFill, { backgroundColor: c.overlay }]} />
              {body}
            </ImageBackground>
          ) : (
            <View style={[styles.flex, { backgroundColor: c.bgFallback }]}>{body}</View>
          )}
        </View>
        {navBottom ? <StudentNavBar active={active} /> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  topBar: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  brand: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  logo: { width: 46, height: 46, borderRadius: 8, backgroundColor: '#ffffff' },
  brandTitle: { fontSize: 20, fontWeight: '800' },
  brandSub: { fontSize: 11, fontWeight: '700', letterSpacing: 1.6, marginTop: 2 },
  topRight: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 8, marginLeft: 6 },
  modeBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  modeText: { fontSize: 12, fontWeight: '600' },
  userName: { fontSize: 12, fontWeight: '700' },
  userRole: { fontSize: 11 },
  scroll: { padding: 16, paddingBottom: 32 },
  heading: { marginBottom: 14 },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  pillText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  title: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 12 },
});