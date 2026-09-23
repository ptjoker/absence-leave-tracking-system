import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { RefreshCw, Clock3, FileText, Info, CheckCircle2, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { PortalShell, DatePicker, FieldLabel, SuggestionBox, BackButton, STUDENT } from '@/components/portal/PortalComponents';
import { useRequests } from '@/context/RequestsContext';
import { approvedLeaveDates, approvedSwapRequests, generateStudentSchedule, parseDateRangeKeys, isPublicHoliday } from '@/lib/schedule';

const COLLEAGUES = [
  'Hlongwane Jan',
  'Jiyane Duduzile',
  'Segomotso Lencwe',
  'Shoba Thabiso',
  'Mawelela Sibusiso',
  'Simphiwe Masanabo',
  'Mashabela Basetsana',
];

function dateLabel(key) {
  const d = new Date(`${key}T00:00:00`);
  return Number.isNaN(d.getTime()) ? key : format(d, 'MMM d, yyyy');
}

function swapMeta(request) {
  const text = `${request.detail || ''} ${request.reason || ''}`;
  const match = text.match(/Swap from (.+?) to (.+?) with (.+?)(?:\.|$)/i);
  return match ? { from: match[1], to: match[2], with: match[3] } : null;
}

export default function ShiftSwapPage() {
  const [, setLocation] = useLocation();
  const { addRequest, requests } = useRequests();
  const [shift, setShift] = useState('');
  const [colleague, setColleague] = useState('');
  const [newDate, setNewDate] = useState();
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});
  const studentNumber = (() => {
    try { return JSON.parse(localStorage.getItem('session') || '{}')?.user?.student_number || STUDENT.number; } catch { return STUDENT.number; }
  })();

  const schedule = useMemo(() => generateStudentSchedule(studentNumber, 2026), [studentNumber]);
  const approvedLeaves = useMemo(() => approvedLeaveDates(requests), [requests]);
  const approvedSwaps = useMemo(() => approvedSwapRequests(requests), [requests]);
  const approvedSwapBlocked = useMemo(() => approvedSwaps.flatMap((request) => parseDateRangeKeys(request.dateRange)), [approvedSwaps]);
  const availableCurrentShifts = useMemo(() => Object.values(schedule)
    .filter((item) => item.date >= format(new Date(), 'yyyy-MM-dd') && !isPublicHoliday(new Date(`${item.date}T00:00:00`)) && !approvedSwapBlocked.includes(item.date))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6), [schedule, approvedSwapBlocked]);

  const activeShiftDate = shift || availableCurrentShifts[0]?.date || '';
  const currentShift = availableCurrentShifts.find((item) => item.date === activeShiftDate) || availableCurrentShifts[0];
  const blockedDates = [...approvedLeaves, ...approvedSwapBlocked, ...(currentShift ? [currentShift.date] : [])];

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!colleague) next.colleague = 'Select a colleague from the student assistant roster.';
    if (!currentShift) next.shift = 'Select one of your upcoming assigned shifts.';
    if (!newDate) next.newDate = 'Select a future working date in this month.';
    if (newDate && currentShift && format(newDate, 'yyyy-MM-dd') === currentShift.date) next.newDate = 'The new date must be different from the current shift.';
    setErrors(next);
    if (Object.keys(next).length) return;
    try {
      const newDateLabel = format(newDate, 'MMM d, yyyy');
      const fromLabel = dateLabel(currentShift.date);
      await addRequest({
        type: `Shift Swap – ${colleague}`,
        replacement: colleague,
        dateRange: newDateLabel,
        detail: `Swap from ${fromLabel} to ${newDateLabel} with ${colleague}. ${reason.trim() || 'Shift swap requested with an eligible colleague.'}`,
        reason: reason.trim(),
      });
      setLocation('/dashboard');
    } catch (err) {
      setErrors({ submit: err.message || 'Could not submit the shift swap request.' });
    }
  };

  return <PortalShell><main className="px-5 py-7 md:px-8 md:py-8">
    <BackButton href="/dashboard/request">Back to Request Leave</BackButton>
    <p className="mb-3 inline-flex rounded-full bg-[#162c4d] px-3 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-white">Scheduling Management</p>
    <h1 className="serif text-4xl text-[#10253f]">Shift Swapping Request</h1>
    <p className="mt-2 max-w-xl text-sm text-[#52708b]">Choose an upcoming shift, select the colleague you want to swap with, then choose a working date in the current month.</p>

    {approvedSwaps.length > 0 && <div className="mt-5 rounded-xl border border-[#bfc7cf] bg-[#eef1f4] p-4"><p className="text-sm font-bold text-black">Approved shift swaps</p><div className="mt-3 space-y-2">{approvedSwaps.map((request) => { const meta = swapMeta(request); return <div key={request.id} className="rounded-lg bg-[#dfe3e7] p-3 text-sm text-black"><strong>{meta?.from || 'Original shift'}</strong> → <strong>{meta?.to || request.dateRange}</strong>{meta?.with && <> with <strong>{meta.with}</strong></>}</div>; })}</div></div>}

    <form onSubmit={submit} className="mt-6 rounded-xl bg-white p-5 shadow-[0_3px_8px_rgba(53,91,121,.08)] md:p-6">
      <div className="flex items-center gap-3 border-b border-[#e2eaf1] pb-5"><span className="grid size-9 place-items-center rounded-lg bg-[#e7f1fa] text-[#1f70d0]"><RefreshCw size={20}/></span><div><h2 className="text-lg font-bold text-[#10253f]">New Swap Request</h2><p className="text-sm text-[#52708b]">Fill in the details for your proposed shift exchange.</p></div></div>
      <div className="mt-6">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.08em] text-black"><span className="inline-block h-3.5 w-1 rounded-full bg-[#1f70d0]"/>1. Select Your Current Shift</p>
        {availableCurrentShifts.length ? <div className="grid gap-3 sm:grid-cols-2">{availableCurrentShifts.map(s => <button type="button" key={s.date} onClick={()=>setShift(s.date)} className={`focus-ring flex items-center justify-between rounded-lg border px-4 py-3 text-left ${activeShiftDate===s.date?'border-[#1f70d0] bg-[#e7f1fa]':'border-[#d0e0ea] hover:border-[#9cc0dd]'}`}><span><span className="block text-sm font-bold text-[#243e5b]">{dateLabel(s.date)}</span><span className="mt-1 block text-sm text-black"><Clock3 size={16} className="mr-1 inline"/>{s.time} · {s.shift}</span></span><span className="text-sm font-bold text-[#1f70d0]">{activeShiftDate===s.date?'Selected':'Select'}</span></button>)}</div> : <p className="rounded-lg bg-[#eef1f4] p-4 text-sm font-semibold text-black">No upcoming working shifts are available for swapping.</p>}
        {errors.shift && <p className="mt-2 text-sm font-bold text-[#c54f43]">{errors.shift}</p>}
      </div>
      <div className="mt-7 grid gap-8 lg:grid-cols-2">
        <div>
          <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.08em] text-black"><span className="inline-block h-3.5 w-1 rounded-full bg-[#1f70d0]"/>2. Target Colleague</p>
          <FieldLabel icon={<RefreshCw size={16} className="text-black"/>}>Student Assistant</FieldLabel>
          <select value={colleague} onChange={(e)=>setColleague(e.target.value)} className={`focus-ring w-full rounded-lg border bg-[#fbfdfe] px-3.5 py-3 text-sm font-semibold text-black outline-none ${errors.colleague ? 'border-[#d05b48]' : 'border-[#cfdee9]'}`}>
            <option value="">Select a student assistant…</option>
            {COLLEAGUES.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
          {errors.colleague && <p className="mt-2 text-sm font-bold text-[#c54f43]">{errors.colleague}</p>}
          <p className="mt-2 text-sm text-black">The list uses the student-assistant roster supplied with the project.</p>
        </div>
        <div>
          <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.08em] text-black"><span className="inline-block h-3.5 w-1 rounded-full bg-[#1f70d0]"/>3. New Shift Date</p>
          <DatePicker value={newDate} onChange={setNewDate} label="New shift date" error={errors.newDate} blockedDates={blockedDates} helper="Past dates, Sundays, holidays, approved leave, approved swaps and your selected current shift are unavailable."/>
        </div>
      </div>
      <div className="mt-7"><label htmlFor="swap-reason"><FieldLabel icon={<FileText size={16} className="text-black"/>}>Reason for Swap</FieldLabel><textarea id="swap-reason" rows={4} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Example: I need to exchange this shift with an available colleague because of a university timetable conflict." className="focus-ring w-full rounded-lg border border-[#cfdee9] bg-[#fbfdfe] px-3.5 py-3 text-sm text-[#243e5b] outline-none placeholder:text-black focus:border-[#1f70d0]"/></label><SuggestionBox suggestions={["Medical appointment", "Family commitment", "Academic timetable conflict", "Transport or scheduling issue"]}/></div>
      <div className="mt-6 flex items-start gap-3 rounded-lg border border-[#d0e0ea] bg-[#f4f8fb] p-4"><Info size={20} className="mt-0.5 shrink-0 text-[#1f70d0]"/><div><p className="text-sm font-bold text-[#243e5b]">Swap Policy Notice</p><p className="mt-1 text-sm leading-5 text-black">All swaps are subject to department lead approval. Approved swaps are shown on your schedule and the swapped dates become unavailable for another request.</p></div></div>
      {errors.submit && <p className="mt-4 rounded-lg bg-[#fbe4e1] px-4 py-3 text-sm font-bold text-[#c54f43]">{errors.submit}</p>}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#e2eaf1] pt-6"><span className="flex items-center gap-1.5 text-sm font-semibold text-black"><CheckCircle2 size={16}/>Draft is kept while you complete the form.</span><div className="flex gap-3"><button type="button" onClick={()=>setLocation('/dashboard/request')} className="focus-ring rounded-lg bg-[#d05b48] px-6 py-2.5 text-sm font-bold text-white">Cancel</button><button type="submit" className="focus-ring flex items-center gap-2 rounded-lg bg-[#1f70d0] px-6 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_#1555aa]">Submit Swap Request<ChevronRight size={18}/></button></div></div>
    </form>
  </main></PortalShell>;
}
