import { useEffect, useState } from 'react';

/*
 * Client-side store for class timetables uploaded by student assistants.
 * Supervisors read from the same store to view every student's timetable
 * when planning shifts. Data lives in localStorage (keyed by student number).
 */
const KEY = 'sa_student_timetables_v1';
const CHANGE_EVENT = 'sa-timetables-changed';

export const MAX_TIMETABLE_BYTES = 2 * 1024 * 1024; // 2 MB
export const ACCEPTED_TIMETABLE_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

export function getTimetables() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function write(value) {
  localStorage.setItem(KEY, JSON.stringify(value)); // may throw if quota exceeded
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsDataURL(file);
  });
}

/** Saves (or replaces) a student's timetable. Throws an Error with a friendly message on failure. */
export async function saveTimetable({ studentNumber, name, file }) {
  if (!file) throw new Error('Please choose a file.');
  if (!ACCEPTED_TIMETABLE_TYPES.includes(file.type)) throw new Error('Upload a PDF or an image (PNG, JPG, WEBP).');
  if (file.size > MAX_TIMETABLE_BYTES) throw new Error('File is too large. Maximum size is 2 MB.');
  const dataUrl = await readAsDataUrl(file);
  const all = getTimetables();
  all[studentNumber] = {
    studentNumber,
    name,
    fileName: file.name,
    type: file.type,
    size: file.size,
    dataUrl,
    uploadedAt: new Date().toISOString(),
  };
  try {
    write(all);
  } catch {
    throw new Error('Browser storage is full. Try a smaller file.');
  }
}

export function removeTimetable(studentNumber) {
  const all = getTimetables();
  delete all[studentNumber];
  write(all);
}

export function useTimetables() {
  const [value, setValue] = useState(getTimetables);
  useEffect(() => {
    const sync = () => setValue(getTimetables());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return value;
}

export function formatFileSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
