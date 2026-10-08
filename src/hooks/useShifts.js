import { apiFetch } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';

/**
 * Fetches the logged-in student's shifts from the backend and returns them
 * as a keyed object matching the shape expected by getDayInfo():
 *   { '2026-10-15': { slot: 'Morning', time: '08:00 AM – 04:00 PM', role, location } }
 */
export function useShifts() {
  const [shifts, setShifts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/shifts');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Could not load shifts');
        return;
      }
      const data = await res.json();
      const map = {};
      (Array.isArray(data) ? data : []).forEach((s) => {
        const start = s.startTime || '';
        const end = s.endTime || '';
        // Guess the slot from the start time string (e.g. "08:00 AM" → Morning).
        const hourPart = parseInt(String(start).split(':')[0], 10) || 0;
        const isPM = String(start).toUpperCase().includes('PM');
        const isAfternoon = (isPM && hourPart !== 12) || (!isPM && hourPart === 12);
        map[s.shiftDate] = {
          slot: isAfternoon ? 'Afternoon' : 'Morning',
          time: start && end ? `${start} – ${end}` : start || '—',
          role: s.role || '',
          location: s.location || '',
        };
      });
      setShifts(map);
    } catch (err) {
      console.error('useShifts error:', err);
      setError('Could not reach the server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { shifts, loading, error, refresh };
}