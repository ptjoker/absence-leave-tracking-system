export function getSession() {
  try {
    const raw = sessionStorage.getItem('session') || localStorage.getItem('session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(data) {
  sessionStorage.setItem('session', JSON.stringify(data));
}

export function rememberSession(data) {
  localStorage.setItem('session', JSON.stringify(data));
}

export function clearSession() {
  console.trace('🔴 clearSession called from:');
  sessionStorage.removeItem('session');
  localStorage.removeItem('session');
}