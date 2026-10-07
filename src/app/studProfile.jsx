import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import ScreenShell from '../components/studentDash/ScreenShell';
import { AppButton, Card, StatusPill } from '../components/studentDash/ui';
import { USER } from '../constants/studData';
import { useStudTheme } from '../constants/studTheme';

function SectionHeader({ icon, title }) {
  const { c } = useStudTheme();
  return (
    <View style={[styles.sectionHead, { borderBottomColor: c.border }]}>
      <View style={[styles.sectionIcon, { backgroundColor: c.primarySoft }]}>
        <Ionicons name={icon} size={13} color={c.primary} />
      </View>
      <Text style={[styles.sectionTitle, { color: c.text }]}>{title}</Text>
    </View>
  );
}

function Field({ label, icon, value, editing, onChangeText, keyboardType, placeholder }) {
  const { c } = useStudTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: c.text }]}>{label}</Text>
      {editing ? (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize="none"
          placeholder={placeholder}
          placeholderTextColor={c.muted}
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
        />
      ) : (
        <View style={styles.valueRow}>
          <Ionicons name={icon} size={12} color={c.text} style={{ marginTop: 3 }} />
          <Text style={[styles.value, { color: c.primary }]}>{value ? value : '—'}</Text>
        </View>
      )}
    </View>
  );
}

export default function Profile() {
  const router = useRouter();
  const { c } = useStudTheme();
  const [editing, setEditing] = useState(false);
  const [cell, setCell] = useState(USER.cell);
  const [personalEmail, setPersonalEmail] = useState(USER.personalEmail);
  const [draftCell, setDraftCell] = useState(USER.cell);
  const [draftEmail, setDraftEmail] = useState(USER.personalEmail);

  const startEdit = () => {
    setDraftCell(cell);
    setDraftEmail(personalEmail);
    setEditing(true);
  };

  const save = () => {
    if (!/^[0-9+()\s-]{7,20}$/.test(draftCell.trim())) {
      Alert.alert('Invalid number', 'Please enter a valid cell number.');
      return;
    }
    if (draftEmail.trim() && !/^\S+@\S+\.\S+$/.test(draftEmail.trim())) {
      Alert.alert('Invalid email', 'Please enter a valid personal email address.');
      return;
    }
    // TODO(API): PATCH /student/profile { cell: draftCell, personalEmail: draftEmail }
    setCell(draftCell.trim());
    setPersonalEmail(draftEmail.trim());
    setEditing(false);
  };

  // Logout button: opens the existing logOut screen (src/app/logOut.jsx -> route "/logOut").
  const logout = () => {
    router.push('/logOut');
  };

  return (
    <ScreenShell
      active="profile"
      pill={null}
      title="My Profile"
      headerRight={
        <>
          <StatusPill status="Active" />
          <View style={{ width: 10 }} />
          {editing ? (
            <>
              <AppButton variant="danger" label="Cancel" onPress={() => setEditing(false)} style={{ marginRight: 8 }} />
              <AppButton icon="checkmark" label="Save" onPress={save} />
            </>
          ) : (
            <AppButton icon="create-outline" label="Edit Profile" onPress={startEdit} />
          )}
        </>
      }
    >
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <View style={[styles.band, { backgroundColor: c.panel }]} />
        <View style={styles.body}>
          <View style={[styles.avatar, { backgroundColor: c.primary }]}>
            <Text style={styles.avatarText}>{USER.initials}</Text>
          </View>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: c.text }]}>{USER.name}</Text>
            <View style={[styles.badge, { backgroundColor: c.primarySoft }]}>
              <Text style={{ color: c.primary, fontSize: 11, fontWeight: '800' }}>Student</Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="ribbon-outline" size={13} color={c.text} />
            <Text style={[styles.meta, { color: c.text }]}>StudNo: {USER.studentNumber}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="business-outline" size={13} color={c.text} />
            <Text style={[styles.meta, { color: c.text }]}>{USER.department}</Text>
          </View>

          <SectionHeader icon="mail-outline" title="CONTACT INFORMATION" />
          <Field label="STUDENT EMAIL" icon="mail-outline" value={USER.email} />
          <Field
            label="CELL NUMBER"
            icon="call-outline"
            value={editing ? draftCell : cell}
            editing={editing}
            onChangeText={setDraftCell}
            keyboardType="phone-pad"
          />
          <Field
            label="PERSONAL EMAIL"
            icon="globe-outline"
            value={editing ? draftEmail : personalEmail}
            editing={editing}
            onChangeText={setDraftEmail}
            keyboardType="email-address"
            placeholder="name@example.com"
          />

          <SectionHeader icon="school-outline" title="ACADEMIC DETAILS" />
          <Field label="COURSE / DEPARTMENT" icon="business-outline" value={USER.department} />
          <Field label="CURRENT YEAR" icon="school-outline" value={USER.currentYear} />
          <Field label="ENROLLED SINCE" icon="calendar-outline" value={USER.enrolledSince} />
          <Field label="ACCOUNT TYPE" icon="person-outline" value={USER.accountType} />
        </View>

        <View style={[styles.privacy, { backgroundColor: c.panel }]}>
          <Ionicons name="shield-checkmark-outline" size={16} color={c.primary} style={{ marginTop: 2 }} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={{ color: c.text, fontWeight: '700', fontSize: 14, marginBottom: 4 }}>Data Privacy Notice</Text>
            <Text style={{ color: c.text, fontSize: 12, lineHeight: 17 }}>
              Identity and academic fields (name, student number, role, student email, course / department, and current year) are managed by the University Registrar and cannot be edited here. Contact the Student Affairs Office if any of those details are incorrect.
            </Text>
          </View>
        </View>
        <View style={[styles.verified, { borderTopColor: c.border }]}>
          <Text style={{ color: c.text, fontSize: 12, fontWeight: '800' }}>VERIFIED PROFILE</Text>
          <Text style={{ color: c.text, fontSize: 12, fontStyle: 'italic' }}>Member since —</Text>
        </View>
      </Card>

      <AppButton icon="log-out-outline" label="Logout" onPress={logout} />

      <Text style={[styles.footer, { color: c.title }]}>{USER.footerContact}</Text>
      <Text style={[styles.footer, { color: c.title }]}>{USER.footerCopy}</Text>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  band: { height: 56 },
  body: { paddingHorizontal: 16, paddingBottom: 8 },
  avatar: { width: 60, height: 60, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: -30, marginBottom: 10 },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  name: { fontSize: 20, fontWeight: '800', marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  meta: { fontSize: 13, marginLeft: 6, flex: 1 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: 8, marginTop: 20, marginBottom: 12 },
  sectionIcon: { width: 22, height: 22, borderRadius: 5, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, marginBottom: 4 },
  valueRow: { flexDirection: 'row' },
  value: { fontSize: 14, fontWeight: '600', marginLeft: 6, flex: 1 },
  input: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 9, fontSize: 14 },
  privacy: { flexDirection: 'row', padding: 16, marginTop: 8 },
  verified: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderTopWidth: StyleSheet.hairlineWidth },
  footer: { textAlign: 'center', fontSize: 11, marginTop: 14 },
});