import { createContext, useContext, useEffect, useState } from 'react';

const RequestsContext = createContext({
  requests: [],
  addRequest: () => {},
  updateRequestStatus: () => {},
});

const DEFAULT_REQUESTS = [
  {
    id: 'REQ-001',
    name: 'Nicholas Mathebula',
    initials: 'NM',
    type: 'Medical Leave',
    status: 'Approved',
    dateRange: 'Sep 08 – Sep 09, 2026',
    detail: 'Medical appointment and recovery.',
    filed: 'Filed earlier',
  },
  {
    id: 'REQ-002',
    name: 'Nicholas Mathebula',
    initials: 'NM',
    type: 'Exam Leave',
    status: 'Pending',
    dateRange: 'Sep 22 – Sep 23, 2026',
    detail: 'Scheduled examination.',
    filed: 'Filed recently',
  },
  {
    id: 'REQ-003',
    name: 'Nicholas Mathebula',
    initials: 'NM',
    type: 'Personal Issues',
    status: 'Approved',
    dateRange: 'Sep 04 – Sep 05, 2026',
    detail: 'Family or personal commitment.',
    filed: 'Filed earlier',
  },
  {
    id: 'REQ-004',
    name: 'Nicholas Mathebula',
    initials: 'NM',
    type: 'Sick Leave',
    status: 'Rejected',
    dateRange: 'Aug 18 – Aug 19, 2026',
    detail: 'Sick leave request.',
    filed: 'Filed earlier',
  },
];

function nextRequestId(requests) {
  const highest = requests.reduce((max, request) => {
    const number = Number(String(request.id).replace(/\D/g, '')) || 0;
    return Math.max(max, number);
  }, 0);
  return `REQ-${String(highest + 1).padStart(3, '0')}`;
}

export function RequestsProvider({ children }) {
  const [requests, setRequests] = useState(() => {
    try {
      const stored = window.localStorage.getItem('studentassist-requests');
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEFAULT_REQUESTS;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('studentassist-requests', JSON.stringify(requests));
    } catch {}
  }, [requests]);

  // Keep student and supervisor views synchronized when the portal is open in
  // more than one browser tab/window.
  useEffect(() => {
    const sync = (event) => {
      if (event.key !== 'studentassist-requests' || !event.newValue) return;
      try { setRequests(JSON.parse(event.newValue)); } catch {}
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const addRequest = (entry) => {
    setRequests((current) => [
      {
        id: nextRequestId(current),
        name: 'Nicholas Mathebula',
        initials: 'NM',
        status: 'Pending',
        filed: 'Filed just now',
        ...entry,
      },
      ...current,
    ]);
  };

  const updateRequestStatus = (id, status) => {
    setRequests((current) => current.map((request) => (
      request.id === id ? { ...request, status } : request
    )));
  };

  return (
    <RequestsContext.Provider value={{ requests, addRequest, updateRequestStatus }}>
      {children}
    </RequestsContext.Provider>
  );
}

export function useRequests() {
  return useContext(RequestsContext);
}
