import { useState } from 'react';
import { Mail, Phone, MapPin, Globe, GraduationCap, Building2, User, CalendarDays, BadgeCheck, ShieldCheck, Pencil, X, Check, Save } from 'lucide-react';
import { PortalShell, FieldLabel } from '@/components/portal/PortalComponents';

const LEVELS = [
  { value: 'first', label: 'First Year' },
  { value: 'second', label: 'Second Year' },
  { value: 'third', label: 'Third Year' },
  { value: 'postgraduate', label: 'Postgraduate' },
];

function getSession() {
  const raw = localStorage.getItem('session');
  return raw ? JSON.parse(raw) : null;
}

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return '—';
  }
}

function SectionHeading({ icon, title }) {
  return (
    <div className="mb-4 flex items-center gap-2 border-b border-[#e2eaf1] pb-3">
      <span className="grid size-7 place-items-center rounded-md bg-[#e7f1fa] text-[#1f70d0]">{icon}</span>
      <h3 className="text-xs font-bold uppercase tracking-[.08em] text-[#385570]">{title}</h3>
    </div>
  );
}

function InfoField({ icon, label, value, bold = false }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[.08em] text-[#8ca0b2]">{label}</p>
      <p className={`mt-1.5 flex items-center gap-2 text-sm text-[#243e5b] ${bold ? 'font-bold' : ''}`}>
        {icon && <span className="text-[#8aa0b2]">{icon}</span>}
        {value || '—'}
      </p>
    </div>
  );
}

function EditableField({ icon, label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <FieldLabel icon={icon}>{label}</FieldLabel>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="focus-ring w-full rounded-lg border border-[#cfdee9] bg-[#fbfdfe] px-3.5 py-3 text-sm text-[#243e5b] outline-none placeholder:text-[#9baebe] focus:border-[#1f70d0]"
      />
    </div>
  );
}

export default function ProfilePage() {
  const [session, setSession] = useState(() => getSession());
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const user = session?.user || {};

  const [draft, setDraft] = useState({
    personal_email: user.personal_email || '',
    course: user.course || '',
    level_of_study: user.level_of_study || '',
    cell_number: user.cell_number || '',
  });

  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User';
  const initials = `${(user.first_name || 'U')[0]}${(user.last_name || '')[0] || ''}`.toUpperCase();
  const roleLabel = user.role === 'supervisor' ? 'Supervisor' : 'Student';
  const levelLabel = LEVELS.find((l) => l.value === user.level_of_study)?.label || user.level_of_study || '—';

  const startEdit = () => {
    setDraft({
      personal_email: user.personal_email || '',
      course: user.course || '',
      level_of_study: user.level_of_study || '',
      cell_number: user.cell_number || '',
    });
    setError('');
    setSuccess('');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError('');
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('http://localhost:3000/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not save profile');
        return;
      }
      // Merge new data into session and localStorage
      const updatedUser = { ...user, ...data.profile };
      const updatedSession = { ...session, user: updatedUser };
      localStorage.setItem('session', JSON.stringify(updatedSession));
      setSession(updatedSession);
      setEditing(false);
      setSuccess('Profile updated successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Save profile error:', err);
      setError('Could not reach the server.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PortalShell>
      <main className="px-5 py-7 md:px-8 md:py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="serif text-4xl text-[#10253f]">My Profile</h1>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e3f7ec] px-3 py-1 text-xs font-bold text-[#19885d]">
              <span className="size-1.5 rounded-full bg-[#19885d]" /> Active
            </span>
            {!editing ? (
              <button
                type="button"
                onClick={startEdit}
                className="focus-ring flex items-center gap-2 rounded-lg bg-[#1f70d0] px-4 py-2 text-sm font-bold text-white shadow-[0_4px_0_#1555aa] hover:bg-[#256fc6]"
              >
                <Pencil size={15} /> Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                  className="focus-ring flex items-center gap-2 rounded-lg border border-[#cfdee9] bg-white px-4 py-2 text-sm font-bold text-[#385570] hover:bg-[#f4f8fb] disabled:opacity-50"
                >
                  <X size={15} /> Cancel
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="focus-ring flex items-center gap-2 rounded-lg bg-[#1f70d0] px-4 py-2 text-sm font-bold text-white shadow-[0_4px_0_#1555aa] hover:bg-[#256fc6] disabled:opacity-50"
                >
                  <Save size={15} /> {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-[#fbe4e1] px-4 py-2.5 text-sm font-semibold text-[#d05b48]">{error}</div>
        )}
        {success && (
          <div className="mb-4 rounded-lg bg-[#e3f7ec] px-4 py-2.5 text-sm font-semibold text-[#19885d]">{success}</div>
        )}

        <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white shadow-[0_10px_25px_rgba(48,83,111,.1)]">
          <div className="h-24 bg-gradient-to-r from-[#e7f1fa] to-[#f4f8fb]" />
          <div className="px-6 md:px-8">
            <div className="-mt-14 flex items-end gap-5">
              <div className="grid size-24 place-items-center rounded-2xl border-4 border-white bg-[#1f70d0] text-2xl font-bold text-white shadow-sm">
                {initials}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl font-bold text-[#10253f]">{fullName}</h2>
              <span className="rounded-full bg-[#e7f1fa] px-2.5 py-0.5 text-xs font-bold text-[#1f70d0]">{roleLabel}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-[#52708b]">
              {user.student_number && (
                <span className="flex items-center gap-1.5">
                  <BadgeCheck size={14} /> StudNo: {user.student_number}
                </span>
              )}
              {user.course && (
                <span className="flex items-center gap-1.5">
                  <Building2 size={14} /> {user.course}
                </span>
              )}
            </div>

            {/* Contact Information */}
            <div className="mt-8">
              <SectionHeading icon={<Mail size={14} />} title="Contact Information" />
              <div className="grid gap-6 sm:grid-cols-2">
                <InfoField icon={<Mail size={14} />} label="Student Email" value={user.student_email || user.email} bold />
                {editing ? (
                  <>
                    <EditableField
                      icon={<Phone size={14} />}
                      label="Cell Number"
                      value={draft.cell_number}
                      onChange={(v) => setDraft((d) => ({ ...d, cell_number: v }))}
                      placeholder="e.g. 076 123 4567"
                    />
                    <EditableField
                      icon={<Globe size={14} />}
                      label="Personal Email"
                      type="email"
                      value={draft.personal_email}
                      onChange={(v) => setDraft((d) => ({ ...d, personal_email: v }))}
                      placeholder="e.g. yourname@gmail.com"
                    />
                  </>
                ) : (
                  <>
                    <InfoField icon={<Phone size={14} />} label="Cell Number" value={user.cell_number} bold />
                    <InfoField icon={<Globe size={14} />} label="Personal Email" value={user.personal_email} />
                  </>
                )}
              </div>
            </div>

            {/* Academic Details */}
            <div className="mt-8">
              <SectionHeading icon={<GraduationCap size={14} />} title="Academic Details" />
              <div className="grid gap-6 sm:grid-cols-2">
                {editing ? (
                  <>
                    <EditableField
                      icon={<Building2 size={14} />}
                      label="Course / Department"
                      value={draft.course}
                      onChange={(v) => setDraft((d) => ({ ...d, course: v }))}
                      placeholder="e.g. Dip Computer Science"
                    />
                    <div>
                      <FieldLabel icon={<GraduationCap size={14} />}>Current Year</FieldLabel>
                      <select
                        value={draft.level_of_study}
                        onChange={(e) => setDraft((d) => ({ ...d, level_of_study: e.target.value }))}
                        className="focus-ring w-full rounded-lg border border-[#cfdee9] bg-[#fbfdfe] px-3.5 py-3 text-sm text-[#243e5b] outline-none focus:border-[#1f70d0]"
                      >
                        <option value="">Select year</option>
                        {LEVELS.map((l) => (
                          <option key={l.value} value={l.value}>{l.label}</option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <InfoField icon={<Building2 size={14} />} label="Course / Department" value={user.course} />
                    <InfoField icon={<GraduationCap size={14} />} label="Current Year" value={levelLabel} />
                  </>
                )}
                <InfoField icon={<CalendarDays size={14} />} label="Enrolled Since" value={formatDate(user.created_at)} />
                <InfoField icon={<User size={14} />} label="Account Type" value={roleLabel} />
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-[#e2eaf1] bg-[#f4f8fb] px-6 py-5 md:px-8">
            <div className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-[#1f70d0]">
                <ShieldCheck size={16} />
              </span>
              <div>
                <p className="text-sm font-bold text-[#243e5b]">Data Privacy Notice</p>
                <p className="mt-1 max-w-xl text-xs leading-5 text-[#60768c]">
                  Identity fields (name, student number, role, and student email) are managed by the University Registrar and cannot be edited here. Contact the Student Affairs Office if any of those details are incorrect.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#e2eaf1] px-6 py-4 md:px-8">
            <span className="text-xs font-semibold text-[#52708b]">VERIFIED PROFILE</span>
            <span className="text-xs italic text-[#8ca0b2]">Member since {formatDate(user.created_at)}</span>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-[#3f6689]">
          General: general@tut.ac.za · Contact: +27 (0)86 110 2421
          <br />© 2026 Faculty of Information and Communication Technology. All rights reserved.
        </p>
      </main>
    </PortalShell>
  );
}