import { useEffect, useState } from 'react';

/*
 * Shared browser store for institutional closures and individual student strikes.
 * Institutional closures are shown in red and block leave, shift swaps and work.
 */
const DAYS_KEY = 'sa_strike_days_v1';
const STRIKES_KEY = 'sa_student_strikes_v1';
const CHANGE_EVENT = 'sa-strikes-changed';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : fallback;
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable – ignore */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function getStrikeDays() {
  return read(DAYS_KEY, {});
}

/**
 * Stores an institutional closure. `closureType` can be Strike, Library closure,
 * or another institutional closure reason selected by the supervisor.
 */
export function declareInstitutionalClosure(dateKey, closureType = 'Strike', reason = '') {
  const days = getStrikeDays();
  days[dateKey] = {
    closureType: closureType || 'Strike',
    reason: String(reason || '').trim(),
    declaredAt: new Date().toISOString(),
  };
  write(DAYS_KEY, days);
}

export function removeInstitutionalClosure(dateKey) {
  const days = getStrikeDays();
  delete days[dateKey];
  write(DAYS_KEY, days);
}

// Backward-compatible aliases so older pages/data keep working.
export const declareStrikeDay = (dateKey, reason = '') => declareInstitutionalClosure(dateKey, 'Strike', reason);
export const removeStrikeDay = removeInstitutionalClosure;

export function getStudentStrikes() {
  return read(STRIKES_KEY, {});
}

export function addStudentStrike(studentKey, reason) {
  const all = getStudentStrikes();
  const list = Array.isArray(all[studentKey]) ? all[studentKey] : [];
  list.push({ reason: reason.trim(), issuedAt: new Date().toISOString() });
  all[studentKey] = list;
  write(STRIKES_KEY, all);
  return list.length;
}

function useStore(getter) {
  const [value, setValue] = useState(getter);
  useEffect(() => {
    const sync = () => setValue(getter());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [getter]);
  return value;
}

export const useStrikeDays = () => useStore(getStrikeDays);
export const useStudentStrikes = () => useStore(getStudentStrikes);
