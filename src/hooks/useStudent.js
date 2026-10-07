import { getSession } from '@/lib/api';
import { useEffect, useState } from 'react';

/**
 * Reads the logged-in user from the saved session (AsyncStorage).
 * Maps backend field names to the app's expected USER shape.
 * Returns { user, loading }. user is null while loading or if no session.
 */
export function useStudent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const session = await getSession();
        const u = session?.user;
        if (!mounted) return;

        if (!u) {
          setUser(null);
          return;
        }

        const firstName = u.first_name || '';
        const lastName = u.last_name || '';
        const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'U';

        setUser({
          name: `${firstName} ${lastName}`.trim() || 'Student',
          initials,
          role: u.role === 'supervisor' ? 'Supervisor' : 'Student Assist',
          position: u.role === 'supervisor' ? 'Supervisor' : 'Student Assistant',
          accountType: u.role === 'supervisor' ? 'Supervisor' : 'Student',
          studentNumber: u.student_number || '',
          department: u.course || 'Not set',
          email: u.student_email || u.email || '',
          cell: u.cell_number || 'Not provided',
          personalEmail: u.personal_email || '',
          currentYear: u.level_of_study || '',
          enrolledSince: u.created_at || '',
          // Not tracked in DB yet:
          attendanceRate: 0,
          footerContact: 'General: general@tut.ac.za · Contact: +27 (0)86 110 2421',
          footerCopy: '© 2026 Faculty of Information and Communication Technology. All rights reserved.',
        });
      } catch (err) {
        console.error('useStudent error:', err);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { user, loading };
}