import { useEffect, useState } from 'react';

const STORAGE_KEY = 'sa_cancelled_shifts_v1';
const CHANGE_EVENT = 'sa-cancelled-shifts-changed';

function read() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function write(value) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch (error) {
    console.error('Could not save cancelled shift:', error);
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function recordCancelledShift(shift, reason = 'Institutional closure') {
  const current = read();
  const entry = {
    ...shift,
    reason,
    cancelledAt: new Date().toISOString(),
  };
  write([entry, ...current.filter((item) => String(item.id) !== String(shift.id))].slice(0, 500));
  return entry;
}

export function getCancelledShifts() {
  return read();
}

export function useCancelledShifts() {
  const [shifts, setShifts] = useState(getCancelledShifts);
  useEffect(() => {
    const refresh = () => setShifts(getCancelledShifts());
    window.addEventListener(CHANGE_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(CHANGE_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);
  return shifts;
}
