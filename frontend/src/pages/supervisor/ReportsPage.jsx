import { useEffect, useMemo, useState } from 'react';
import { addDays, endOfDay, format, isAfter, isBefore, isSameDay, startOfDay, startOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { BarChart3, CalendarDays, ChevronDown, Download, FileSpreadsheet, FileText, Filter, Grid2X2, List, Search } from 'lucide-react';
import { PortalShell } from '@/components/portal/PortalComponents';
import { useRequests } from '@/context/RequestsContext';
import { parseDateRangeKeys } from '@/lib/schedule';
import { exportPerformanceReport } from '@/lib/reportExport';

const REPORT_ROSTER = [
  
];

function StatCard({ label, value, icon }) {
  return <div className="rounded-xl border border-[#1f70d0] bg-[#f4f8fb] p-5"><div className="flex items-center justify-between"><p className="mono text-[10px] font-bold uppercase tracking-[.1em] text-black">{label}</p><span className="grid size-8 place-items-center rounded-lg border border-[#d0e0ea] text-[#1f70d0]">{icon}</span></div><p className="serif mt-2 text-4xl text-[#10253f]">{value}</p></div>;
}

function inputDate(date) {
  return format(date, 'yyyy-MM-dd');
}

function displayDate(date) {
  return format(date, 'dd MMM yyyy');
}

function dateFromInput(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function getPeriod(range, rangeFrom, rangeTo) {
  const today = startOfDay(new Date());
  if (range === 'Today') return { start: today, end: endOfDay(today), label: displayDate(today) };
  if (range === 'This Week') return { start: startOfWeek(today, { weekStartsOn: 1 }), end: endOfDay(endOfWeek(today, { weekStartsOn: 1 })), label: `${displayDate(startOfWeek(today, { weekStartsOn: 1 }))} – ${displayDate(endOfWeek(today, { weekStartsOn: 1 }))}` };
  if (range === 'This Month') return { start: startOfMonth(today), end: endOfDay(today), label: `${format(today, 'MMMM yyyy')} (month to date)` };
  if (range === 'Range Dates') {
    const from = startOfDay(dateFromInput(rangeFrom) || today);
    const toDate = dateFromInput(rangeTo) || from;
    const to = endOfDay(isBefore(toDate, from) ? from : toDate);
    return { start: from, end: to, label: `${displayDate(from)} – ${displayDate(to)}` };
  }
  return { start: startOfDay(addDays(today, -6)), end: endOfDay(today), label: `${displayDate(addDays(today, -6))} – ${displayDate(today)}` };
}

function requestMatchesPeriod(request, period) {
  return parseDateRangeKeys(request?.dateRange).some((key) => {
    const date = dateFromInput(key);
    return date && !isBefore(endOfDay(date), period.start) && !isAfter(startOfDay(date), period.end);
  });
}


function shiftMatchesPeriod(shift, period) { const d = dateFromInput(shift?.shiftDate); return d && !isBefore(endOfDay(d), period.start) && !isAfter(startOfDay(d), period.end); }
function shiftHours(shift) { const value = Number(shift?.durationHours); return Number.isFinite(value) && value > 0 ? value : 4; }
function requestDays(request) { return Math.max(parseDateRangeKeys(request?.dateRange).length, 1); }

export default function ReportsPage() {
  const { requests } = useRequests();
  const [shifts, setShifts] = useState([]);
  useEffect(() => { (async () => { try { const session = JSON.parse(localStorage.getItem('session') || 'null'); if (!session?.access_token) return; const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/shifts`, { headers: { Authorization: `Bearer ${session.access_token}` } }); const data = await res.json(); if (res.ok) setShifts(Array.isArray(data) ? data : []); } catch (e) { console.error('Load report shifts error:', e); } })(); }, []);
  const [search, setSearch] = useState('');
  const [range, setRange] = useState('Last 7 Days');
  const [rangeFrom, setRangeFrom] = useState(inputDate(new Date()));
  const [rangeTo, setRangeTo] = useState(inputDate(new Date()));
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState('grid');
  const [exportOpen, setExportOpen] = useState(false);

  const period = useMemo(() => getPeriod(range, rangeFrom, rangeTo), [range, rangeFrom, rangeTo]);

  const periodRequests = useMemo(() => requests.filter((request) => requestMatchesPeriod(request, period)), [requests, period]);

  const periodShifts = useMemo(() => shifts.filter((shift) => shiftMatchesPeriod(shift, period)), [shifts, period]);
  const rows = useMemo(() => {
    const names = new Set([...REPORT_ROSTER.map((p) => p.name), ...periodShifts.map((s) => s.studentName).filter(Boolean), ...periodRequests.map((r) => r.name).filter(Boolean)]);
    return Array.from(names).map((name) => {
      const base = REPORT_ROSTER.find((p) => p.name === name) || { name, site: '—', hours: '0h', days: 0 };
      const personRequests = periodRequests.filter((request) => (request.name || '') === name || request.replacement === name || String(request.type || '').includes(name));
      const personShifts = periodShifts.filter((shift) => shift.studentName === name);
      const hours = personShifts.reduce((sum, shift) => sum + shiftHours(shift), 0);
      const requestDaysTotal = personRequests.reduce((sum, request) => sum + requestDays(request), 0);
      const site = personShifts[0]?.position || personShifts[0]?.role || base.site;
      return { ...base, name, site, hours: `${hours.toFixed(1)}h`, days: personShifts.length, requests: personRequests.length, requestDays: requestDaysTotal, shifts: personShifts.length, shiftHours: hours, shiftDetails: personShifts.map((shift) => `${shift.shiftDate} | ${shift.position || shift.role || '—'} | ${shift.startTime}-${shift.endTime} | ${shiftHours(shift)}h`).join(' ; '), requestDetails: personRequests.map((request) => `${request.type || 'Request'} | ${request.dateRange || 'Date not provided'} | ${requestDays(request)} day(s) | ${request.status || 'Pending'}`).join(' ; ') };
    });
  }, [periodRequests, periodShifts]);

  const filtered = useMemo(() => { const q = search.trim().toLowerCase(); return rows.filter((row) => !q || row.name.toLowerCase().includes(q) || String(row.site || '').toLowerCase().includes(q)); }, [rows, search]);
  const totalHours = useMemo(() => filtered.reduce((sum, row) => sum + Number.parseFloat(row.hours), 0), [filtered]);
  const totalRequests = useMemo(() => filtered.reduce((sum, row) => sum + row.requests, 0), [filtered]);
  const activeReports = filtered.filter((row) => row.requests > 0 || row.shifts > 0).length;

  const download = (formatType) => {
    exportPerformanceReport(formatType, filtered, `Performance Reports — ${period.label}`);
    setExportOpen(false);
  };

  const selectRange = (event) => setRange(event.target.value);

  return (
    <PortalShell supervisor>
      <div className="px-5 py-7 md:px-8 md:py-8">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm font-semibold text-black"><span>Dashboard</span><span>/</span><span>Performance Reports</span></div>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div><h1 className="serif text-4xl text-[#10253f]">Performance Reports</h1><p className="mt-2 max-w-2xl text-sm text-black">Review and analyze student activity and work efficiency metrics. Use the period filter to generate details for today, the current month, the last 7 days, or a specific date range.</p></div>
          <div className="relative flex gap-3">
            <button type="button" onClick={() => download('csv')} className="focus-ring flex items-center gap-2 rounded-lg border border-[#d0d0d0] bg-white px-4 py-2.5 text-sm font-bold text-black"><Download size={16}/>Export CSV</button>
            <button type="button" onClick={() => setExportOpen((open) => !open)} className="focus-ring flex items-center gap-2 rounded-lg bg-[#286ee5] px-5 py-2.5 text-sm font-bold text-white"><FileText size={16}/>Generate New Report<ChevronDown size={15}/></button>
            {exportOpen && <div className="absolute right-0 top-12 z-30 w-64 rounded-xl border border-[#d0e0ea] bg-white p-2 shadow-xl"><p className="px-3 py-2 text-sm font-bold text-black">Choose download format</p><button onClick={() => download('pdf')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-black hover:bg-[#f4f8fb]"><FileText size={17}/>PDF report</button><button onClick={() => download('docx')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-black hover:bg-[#f4f8fb]"><FileText size={17}/>Word document (.docx)</button><button onClick={() => download('excel')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-black hover:bg-[#f4f8fb]"><FileSpreadsheet size={17}/>Excel spreadsheet (.xls)</button></div>}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <StatCard label="Total Hours" value={`${totalHours.toFixed(1)}h`} icon={<BarChart3 size={17}/>} />
          <StatCard label="Requests in Period" value={totalRequests} icon={<FileText size={17}/>} />
          <StatCard label="Assistants with Requests" value={activeReports} icon={<FileText size={17}/>} />
        </div>

        <div className="mt-5 rounded-xl border border-[#1f70d0] bg-white p-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative min-w-[250px] flex-1" htmlFor="report-search"><Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black"/><input id="report-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter by student name or role..." className="w-full rounded-lg border border-[#d0e0ea] bg-white py-2.5 pl-10 pr-3 text-sm font-semibold text-black outline-none"/></label>
            <button type="button" onClick={() => setShowFilters((v) => !v)} className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold ${showFilters ? 'border-[#286ee5] bg-[#e7f1fa] text-[#286ee5]' : 'border-[#d0e0ea] bg-white text-black'}`}><Filter size={16}/>Filters</button>
            <label htmlFor="report-range" className="sr-only">Report date period</label>
            <div className="flex items-center gap-2 rounded-lg border border-[#d0e0ea] bg-white px-3"><CalendarDays size={16} className="text-black"/><select id="report-range" value={range} onChange={selectRange} className="portal-dropdown min-w-[145px] bg-transparent py-2.5 text-sm font-bold text-black outline-none"><option value="Last 7 Days">Last 7 Days</option><option value="Today">Today</option><option value="This Week">This Week</option><option value="This Month">This Month</option><option value="Range Dates">Range Dates</option></select><ChevronDown size={14} className="pointer-events-none text-black"/></div>
            <div className="ml-auto flex rounded-lg border border-[#d0e0ea] bg-white p-1"><button type="button" onClick={() => setView('grid')} className={`rounded p-2 ${view === 'grid' ? 'bg-[#eef4fb] text-[#1f70d0]' : 'text-black'}`} aria-label="Grid view"><Grid2X2 size={17}/></button><button type="button" onClick={() => setView('list')} className={`rounded p-2 ${view === 'list' ? 'bg-[#eef4fb] text-[#1f70d0]' : 'text-black'}`} aria-label="List view"><List size={17}/></button></div>
          </div>
          {range === 'Range Dates' && <div className="mt-3 grid gap-3 rounded-lg bg-[#f4f8fb] p-3 md:grid-cols-2"><label className="text-sm font-bold text-black">From<input type="date" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} className="mt-1.5 block w-full rounded-lg border border-[#cfdee9] bg-white px-3 py-2.5 text-sm font-semibold text-black"/></label><label className="text-sm font-bold text-black">To<input type="date" value={rangeTo} min={rangeFrom} onChange={(e) => setRangeTo(e.target.value)} className="mt-1.5 block w-full rounded-lg border border-[#cfdee9] bg-white px-3 py-2.5 text-sm font-semibold text-black"/></label></div>}
          {showFilters && <div className="mt-3 rounded-lg bg-[#f4f8fb] p-3 text-sm font-semibold text-black">Active report period: <strong>{period.label}</strong>. Student-name search is also active. Generate/export uses the currently filtered results.</div>}
          <div className="mt-3 rounded-lg border border-[#d0e0ea] bg-[#f8fbfd] px-3 py-2.5 text-sm font-bold text-black">Report details for: <span className="text-[#1f70d0]">{period.label}</span></div>
        </div>

        {periodShifts.length > 0 && <div className="mt-5 overflow-x-auto rounded-xl border border-[#1f70d0] bg-white"><div className="border-b border-[#d0e0ea] px-4 py-3"><h2 className="text-base font-bold text-black">Shift details in selected period</h2><p className="mt-1 text-sm text-black">Every scheduled shift contributes its duration to the report totals.</p></div><table className="w-full min-w-[900px] text-left"><thead><tr className="border-b border-[#d0e0ea] text-xs font-bold uppercase tracking-wide text-black"><th className="p-4">Student Assistant</th><th className="p-4">Position</th><th className="p-4">Date</th><th className="p-4">Shift Time</th><th className="p-4">Duration</th></tr></thead><tbody>{periodShifts.map((shift) => <tr key={shift.id} className="border-b border-[#e2eaf1] text-sm text-black"><td className="p-4 font-bold">{shift.studentName}</td><td className="p-4">{shift.position || shift.role || '—'}</td><td className="p-4">{shift.shiftDate}</td><td className="p-4">{shift.startTime} - {shift.endTime}</td><td className="p-4 font-bold">{shiftHours(shift)} hours</td></tr>)}</tbody></table></div>}

        {periodRequests.length > 0 && <div className="mt-5 overflow-x-auto rounded-xl border border-[#1f70d0] bg-white">
          <div className="border-b border-[#d0e0ea] px-4 py-3"><h2 className="text-base font-bold text-black">Request details in selected period</h2><p className="mt-1 text-sm text-black">These requests match the active date filter and are included in the report period.</p></div>
          <table className="w-full min-w-[850px] text-left"><thead><tr className="border-b border-[#d0e0ea] text-xs font-bold uppercase tracking-wide text-black"><th className="p-4">Student Assistant</th><th className="p-4">Request</th><th className="p-4">Date</th><th className="p-4">Status</th></tr></thead><tbody>{periodRequests.map((request) => <tr key={request.rawId || request.id || `${request.name}-${request.dateRange}-${request.type}`} className="border-b border-[#e2eaf1] text-sm text-black"><td className="p-4 font-bold">{request.name || 'Student Assistant'}</td><td className="p-4">{request.type || 'Request'}</td><td className="p-4">{request.dateRange || 'Date not provided'}</td><td className="p-4 font-bold">{request.status || 'Pending'}</td></tr>)}</tbody></table>
        </div>}


        {view === 'grid' ? <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filtered.map((row) => <article key={row.name} className="report-card min-h-[245px] rounded-xl bg-[#c5dced] p-5"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-white text-sm font-bold text-black">{row.name.split(' ').map((part) => part[0]).join('').slice(0,2)}</span><h2 className="text-lg font-bold text-[#10253f]">{row.name}</h2></div><button type="button" aria-label={`More options for ${row.name}`} className="text-xl font-bold text-black">•••</button></div><div className="mt-6 grid grid-cols-2 gap-5"><div><p className="text-[10px] font-bold uppercase tracking-[.08em] text-black">Hours Worked</p><p className="mt-2 text-sm font-semibold text-black">{row.hours}</p></div><div><p className="text-[10px] font-bold uppercase tracking-[.08em] text-black">Requests in Period</p><p className="mt-2 text-sm font-semibold text-black">{row.requests}</p></div></div><div className="mt-7"><p className="text-[10px] font-bold uppercase tracking-[.08em] text-black">{row.site}</p><p className="mt-2 text-sm font-semibold text-black">{row.days} days</p></div></article>)}</div> : <div className="mt-5 overflow-x-auto rounded-xl bg-white"><table className="w-full min-w-[800px] text-left"><thead><tr className="border-b border-[#d0e0ea] text-sm font-bold text-black"><th className="p-4">Student Assistant</th><th className="p-4">Hours Worked</th><th className="p-4">Requests in Period</th><th className="p-4">Site</th><th className="p-4">Days</th></tr></thead><tbody>{filtered.map((row) => <tr key={row.name} className="border-b border-[#e2eaf1] text-sm text-black"><td className="p-4 font-bold">{row.name}</td><td className="p-4">{row.hours}</td><td className="p-4">{row.requests}</td><td className="p-4">{row.site}</td><td className="p-4">{row.days}</td></tr>)}</tbody></table></div>}
        {!filtered.length && <div className="mt-5 rounded-xl bg-white p-10 text-center text-sm font-semibold text-black">No student assistants match your search.</div>}
      </div>
    </PortalShell>
  );
}
