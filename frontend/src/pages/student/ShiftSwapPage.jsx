import { useEffect, useMemo, useState } from 'react';
import { format, endOfYear, isBefore, startOfDay } from 'date-fns';
import { RefreshCw, Clock3, FileText, Info, ChevronRight, Users, CalendarDays } from 'lucide-react';
import { useLocation, useSearch } from 'wouter';
import { PortalShell, FieldLabel, SuggestionBox, BackButton } from '@/components/portal/PortalComponents';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useRequests } from '@/context/RequestsContext';
import { apiFetch } from '@/lib/api';
import { approvedLeaveDates, approvedSwapRequests, parseDateRangeKeys, isPublicHoliday, isSunday } from '@/lib/schedule';
import { useStrikeDays } from '@/lib/strikes';

const MAX_JUSTIFICATION_LENGTH = 100;

function dateLabel(key) {
  const d = new Date(`${key}T00:00:00`);
  return Number.isNaN(d.getTime()) ? key : format(d, 'MMM d, yyyy');
}

function swapMeta(request) {
  const text = `${request.detail || ''} ${request.reason || ''}`;
  const match = text.match(/Swap from (.+?) to (.+?) with (.+?)(?:\.|$)/i);
  return match ? { from: match[1], to: match[2], with: match[3] } : null;
}

// Compact calendar that lets the student browse every month of the current year (2026).
function YearDatePicker({ value, onChange, label, error, helper, blockedDates = [] }) {
  const [open, setOpen] = useState(false);
  const today = startOfDay(new Date());
  const yearStart = startOfDay(new Date(today.getFullYear(), 0, 1));
  const yearEnd = endOfYear(today);
  const blocked = new Set(blockedDates || []);
  const swapTo = new Set(blocked.swapTo || []);
  const swapFrom = new Set(blocked.swapFrom || []);
  const strike = new Set(blocked.strike || []);
  const keyOf = (d) => format(startOfDay(d), 'yyyy-MM-dd');
  const disabled = (date) => {
    const day = startOfDay(date);
    return isBefore(day, today) || day > yearEnd || isPublicHoliday(day) || isSunday(day) || blocked.has(keyOf(day)) || swapTo.has(keyOf(day)) || swapFrom.has(keyOf(day)) || strike.has(keyOf(day));
  };
  const display = value ? format(value, 'EEE, MMM d, yyyy') : '';
  return <div>
    <FieldLabel required icon={<CalendarDays size={14} className="text-[#8aa0b2]" />}>{label}</FieldLabel>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label={label} className={`focus-ring flex w-full items-center justify-between rounded-lg border bg-[#fbfdfe] px-3.5 py-3 text-left text-sm outline-none ${error ? 'border-[#d05b48]' : 'border-[#cfdee9] hover:border-[#9cc0dd]'}`}>
          <span className={display ? 'text-[#243e5b]' : 'text-black'}>{display || 'Select a date'}</span><CalendarDays size={18} className="shrink-0 text-black" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" align="center" sideOffset={16} collisionPadding={16} className="z-[100] w-auto max-w-[92vw] bg-white p-3">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d) => { if (!d) return; onChange(d); setOpen(false); }}
          defaultMonth={value || today}
          startMonth={yearStart}
          endMonth={yearEnd}
          disabled={disabled}
          modifiers={{ holiday: (d) => isPublicHoliday(d), blocked: (d) => blocked.has(keyOf(d)), swappedTo: (d) => swapTo.has(keyOf(d)), swappedFrom: (d) => swapFrom.has(keyOf(d)), strike: (d) => strike.has(keyOf(d)), closure: (d) => strike.has(keyOf(d)) }}
          modifiersClassNames={{
            holiday: '!opacity-100 rounded-md border border-[#2c9b62] bg-[#d9f3e3] [&_button]:text-[#246b45]',
            blocked: '!opacity-100 rounded-md border border-[#aeb6bf] bg-[#d9dde2] [&_button]:text-black',
            swappedTo: '!opacity-100 rounded-md border border-[#aeb6bf] bg-[#d9dde2] [&_button]:text-black',
            swappedFrom: '!opacity-100 rounded-md border border-[#2b67c9] bg-[#dce9ff] [&_button]:text-[#163f8a]',
            strike: '!opacity-100 rounded-md border border-[#c4473d] bg-[#d05b48] [&_button]:text-white',
            closure: '!opacity-100 rounded-md border border-[#c4473d] bg-[#d05b48] [&_button]:text-white',
            pastDay: 'calendar-x-day !opacity-100 bg-[#eef1f4] [&_button]:text-[#6b7785]',
            sundayDay: 'calendar-x-day !opacity-100 bg-[#eef1f4] [&_button]:text-[#6b7785]',
          }}
          className="!bg-white p-1"
          classNames={{
            months: 'relative flex flex-col',
            month: 'flex w-full flex-col gap-2',
            month_caption: 'flex h-11 w-full items-center justify-center',
            caption_label: 'text-base font-bold text-[#10253f]',
            nav: 'absolute inset-x-0 top-0 flex h-11 w-full items-center justify-between',
            button_previous: 'inline-flex size-11 items-center justify-center rounded-md text-[#10253f] hover:bg-[#edf4f8] aria-disabled:opacity-40',
            button_next: 'inline-flex size-11 items-center justify-center rounded-md text-[#10253f] hover:bg-[#edf4f8] aria-disabled:opacity-40',
            weekdays: 'flex',
            weekday: 'w-11 text-center text-xs font-bold text-[#52708b]',
            week: 'mt-1 flex w-full',
            day: 'size-11 p-0 text-center text-sm',
          }}
          initialFocus
        />
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-[#e2eaf1] px-2 pt-2 text-xs font-semibold text-black">
          <span className="flex items-center gap-1.5"><span className="size-3 rounded border border-[#2c9b62] bg-[#d9f3e3]" />Holiday</span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-[#d9dde2]" />Grey box - date swapped to</span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded border border-[#2b67c9] bg-[#dce9ff]" />Blue box - date swapped from</span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-[#d05b48]" />Red box - Institutional closure</span>
        </div>
        <p className="mt-2 max-w-[308px] px-2 text-sm font-semibold text-black">Sundays and public holidays cannot be selected.</p>
        <p className="mt-1 max-w-[308px] px-2 text-xs font-bold text-[#2c7d4e]">Public holidays are shown in green and are unavailable for leave, swaps and shifts.</p>
      </PopoverContent>
    </Popover>
    {helper && <p className="mt-1.5 text-sm italic text-black">{helper}</p>}
    {error && <p className="mt-1.5 text-sm font-medium text-[#c54f43]">{error}</p>}
  </div>;
}

export default function ShiftSwapPage() {
  const [, setLocation] = useLocation();
  const { addShiftSwapRequest, updateRequest, requests } = useRequests();
  const strikeDays = useStrikeDays();
  const [shift, setShift] = useState('');
  const [colleague, setColleague] = useState('');
  const [newDate, setNewDate] = useState();
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});
  const [assignedShifts, setAssignedShifts] = useState([]);
  const [shiftsLoading, setShiftsLoading] = useState(true);
  const [shiftsError, setShiftsError] = useState('');
  const [availableStudents, setAvailableStudents] = useState([]);
  const [colleaguesLoading, setColleaguesLoading] = useState(false);
  const [colleaguesError, setColleaguesError] = useState('');
  const search = new URLSearchParams(useSearch());
  const editId = search.get('edit');
  const returnTo = search.get('from') === 'history' ? '/dashboard/history' : '/dashboard';
  const editTarget = editId ? requests.find((r) => String(r.rawId) === String(editId)) : null;
  const editing = Boolean(editTarget && editTarget.status === 'Pending');

  useEffect(() => {
    let cancelled = false;
    setShiftsLoading(true);
    setShiftsError('');
    apiFetch('/api/shifts')
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Could not load your assigned shifts.');
        if (!cancelled) setAssignedShifts(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        if (!cancelled) setShiftsError(error.message || 'Could not load your assigned shifts.');
      })
      .finally(() => { if (!cancelled) setShiftsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const approvedLeaves = useMemo(() => approvedLeaveDates(requests), [requests]);
  const approvedSwaps = useMemo(() => approvedSwapRequests(requests), [requests]);
  const approvedSwapBlocked = useMemo(() => approvedSwaps.flatMap((request) => parseDateRangeKeys(request.dateRange)), [approvedSwaps]);
  const availableCurrentShifts = useMemo(() => assignedShifts
    .filter((item) => item.shiftDate >= format(new Date(), 'yyyy-MM-dd')
      && !isPublicHoliday(new Date(`${item.shiftDate}T00:00:00`))
      && !approvedLeaves.includes(item.shiftDate)
      && !approvedSwapBlocked.includes(item.shiftDate)
      && !strikeDays[item.shiftDate])
    .sort((a, b) => a.shiftDate.localeCompare(b.shiftDate) || String(a.startTime).localeCompare(String(b.startTime))), [assignedShifts, approvedLeaves, approvedSwapBlocked, strikeDays]);

  const activeShiftId = shift || availableCurrentShifts[0]?.id || '';
  const currentShift = availableCurrentShifts.find((item) => String(item.id) === String(activeShiftId)) || availableCurrentShifts[0];
  const swapDateMeta = useMemo(() => {
    const to = [...approvedSwapBlocked];
    const from = [];
    approvedSwaps.forEach((request) => {
      const text = `${request.detail || ''} ${request.reason || ''}`;
      const match = text.match(/Swap from (.+?) to (.+?) with (.+?)(?:\.|$)/i);
      if (match) {
        const d = new Date(match[1]);
        if (!Number.isNaN(d.getTime())) from.push(format(d, 'yyyy-MM-dd'));
      }
    });
    return { to: [...new Set(to)], from: [...new Set(from)] };
  }, [approvedSwaps, approvedSwapBlocked]);
  const closureDates = Object.keys(strikeDays);
  const blockedDates = Object.assign([...approvedLeaves, ...approvedSwapBlocked, ...closureDates, ...(currentShift ? [currentShift.shiftDate] : [])], { swapTo: swapDateMeta.to, swapFrom: swapDateMeta.from, strike: closureDates, closure: closureDates });
  const newKey = newDate ? format(newDate, 'yyyy-MM-dd') : '';
  useEffect(() => {
    if (!newKey || !currentShift) {
      setAvailableStudents([]);
      setColleaguesError('');
      setColleaguesLoading(false);
      return undefined;
    }
    let cancelled = false;
    setColleaguesLoading(true);
    setColleaguesError('');
    setAvailableStudents([]);
    const query = new URLSearchParams({
      shift_date: newKey,
      current_shift_date: currentShift.shiftDate,
    });
    apiFetch(`/api/eligible-colleagues?${query}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Could not load available student assistants.');
        const colleagues = Array.isArray(data.colleagues) ? data.colleagues.map((item) => ({
          id: item.colleague_id,
          shiftId: item.shift_id,
          date: item.shift_date,
          name: `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Student assistant',
          time: `${String(item.start_time || '').slice(0, 5)}–${String(item.end_time || '').slice(0, 5)}`,
        })) : [];
        if (!cancelled) setAvailableStudents(colleagues);
      })
      .catch((error) => {
        if (!cancelled) setColleaguesError(error.message || 'Could not load available student assistants.');
      })
      .finally(() => { if (!cancelled) setColleaguesLoading(false); });
    return () => { cancelled = true; };
  }, [newKey, currentShift?.id, currentShift?.shiftDate]);

  useEffect(() => {
    if (!editing) return;
    const meta = swapMeta(editTarget);
    if (meta?.from) {
      const shiftForDate = availableCurrentShifts.find((item) => item.shiftDate === format(new Date(meta.from), 'yyyy-MM-dd'));
      if (shiftForDate) setShift(shiftForDate.id);
    }
    const toKeys = parseDateRangeKeys(editTarget.dateRange);
    if (toKeys[0]) setNewDate(new Date(`${toKeys[0]}T00:00:00`));
    setReason(editTarget.reason || '');
  }, [editing, editTarget?.rawId, availableCurrentShifts]);

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!currentShift) next.shift = 'Select one of your upcoming assigned shifts.';
    if (!newDate) next.newDate = 'Select a future working date in 2026.';
    if (newDate && currentShift && format(newDate, 'yyyy-MM-dd') === currentShift.shiftDate) next.newDate = 'The new date must be different from the current shift.';
    if (!colleague || !availableStudents.some((item) => String(item.id) === String(colleague))) next.colleague = newDate ? 'Select one of the available student assistants.' : 'Choose a new shift date first, then select an available student assistant.';
    if (reason.length > MAX_JUSTIFICATION_LENGTH) next.reason = `Justification and comments must be ${MAX_JUSTIFICATION_LENGTH} characters or fewer.`;
    setErrors(next);
    if (Object.keys(next).length) return;
    try {
      const newDateLabel = format(newDate, 'MMM d, yyyy');
      const selectedColleague = availableStudents.find((item) => String(item.id) === String(colleague));
      if (!selectedColleague) throw new Error('Choose an available student assistant before submitting.');
      const fromLabel = dateLabel(currentShift.shiftDate);
      const entry = { type: `Shift Swap – ${selectedColleague.name}`, replacement: selectedColleague.name, dateRange: newDateLabel, detail: `Swap from ${fromLabel} to ${newDateLabel} with ${selectedColleague.name}. ${reason.trim() || 'Shift swap requested with an eligible colleague.'}`, reason: reason.trim() };
      if (editing) await updateRequest(editTarget.id, entry);
      else await addShiftSwapRequest({
        requesterShiftId: currentShift.id,
        colleagueUserId: selectedColleague.id,
        colleagueShiftId: selectedColleague.shiftId,
        reason: reason.trim(),
      });
      setLocation(editing ? returnTo : '/dashboard');
    } catch (err) {
      setErrors({ submit: err.message || 'Could not submit the shift swap request.' });
    }
  };

  return <PortalShell><main className="px-5 py-7 md:px-8 md:py-8">
    <BackButton href={editing && returnTo === '/dashboard/history' ? returnTo : '/dashboard/request'}>{editing && returnTo === '/dashboard/history' ? 'Back to History' : 'Back to Request Leave'}</BackButton>
    <p className="mb-3 inline-flex rounded-full bg-[#162c4d] px-3 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-white">Scheduling Management</p>
    <h1 className="serif text-4xl text-[#10253f]">Shift Swapping Request</h1>
    <p className="mt-2 max-w-xl text-sm text-[#52708b]">Choose an upcoming shift, then choose a new working date. The student assistants available on that date will be listed for you to pick from.</p>

    {approvedSwaps.length > 0 && <div className="mt-5 rounded-xl border border-[#bfc7cf] bg-[#eef1f4] p-4"><p className="text-sm font-bold text-black">Approved shift swaps</p><div className="mt-3 space-y-2">{approvedSwaps.map((request) => { const meta = swapMeta(request); return <div key={request.id} className="rounded-lg bg-[#dfe3e7] p-3 text-sm text-black"><strong>{meta?.from || 'Original shift'}</strong> → <strong>{meta?.to || request.dateRange}</strong>{meta?.with && <> with <strong>{meta.with}</strong></>}</div>; })}</div></div>}

    <form onSubmit={submit} className="mt-6 rounded-xl bg-white p-5 shadow-[0_3px_8px_rgba(53,91,121,.08)] md:p-6">
      <div className="flex items-center gap-3 border-b border-[#e2eaf1] pb-5"><span className="grid size-9 place-items-center rounded-lg bg-[#e7f1fa] text-[#1f70d0]"><RefreshCw size={20}/></span><div><h2 className="text-lg font-bold text-[#10253f]">{editing ? `Edit Swap Request ${editTarget.id}` : 'New Swap Request'}</h2><p className="text-sm text-[#52708b]">Fill in the details for your proposed shift exchange.</p></div></div>
      <div className="mt-6 max-w-xl">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.08em] text-black"><span className="inline-block h-3.5 w-1 rounded-full bg-[#1f70d0]"/>1. Choose the shift you want to swap</p>
        {shiftsLoading ? <p className="rounded-lg bg-[#eef1f4] p-4 text-sm font-semibold text-black">Loading your assigned shifts...</p>
          : shiftsError ? <p role="alert" className="rounded-lg bg-[#fbe4e1] p-4 text-sm font-semibold text-[#c54f43]">{shiftsError}</p>
            : availableCurrentShifts.length ? <>
          <FieldLabel icon={<Clock3 size={16} className="text-black"/>}>Shift to swap</FieldLabel>
          <select id="swap-current-shift" value={activeShiftId} onChange={(e)=>{ setShift(e.target.value); setColleague(''); }} className={`focus-ring w-full rounded-lg border bg-[#fbfdfe] px-3.5 py-3 text-sm font-semibold text-black outline-none ${errors.shift ? 'border-[#d05b48]' : 'border-[#cfdee9]'}`}>
            {availableCurrentShifts.map(s => <option key={s.id} value={s.id}>{dateLabel(s.shiftDate)} · {String(s.startTime).slice(0, 5)}–{String(s.endTime).slice(0, 5)}</option>)}
          </select>
        </> : <p className="rounded-lg bg-[#eef1f4] p-4 text-sm font-semibold text-black">No upcoming working shifts are available for swapping.</p>}
        {errors.shift && <p className="mt-2 text-sm font-bold text-[#c54f43]">{errors.shift}</p>}
      </div>
      <div className="mt-7 grid gap-8 lg:grid-cols-2">
        <div>
          <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.08em] text-black"><span className="inline-block h-3.5 w-1 rounded-full bg-[#1f70d0]"/>2. New Shift Date</p>
          <YearDatePicker value={newDate} onChange={(d)=>{ setNewDate(d); setColleague(''); }} label="New shift date" error={errors.newDate} blockedDates={blockedDates} helper="Use the arrows to browse any month of 2026. Past dates, Sundays, holidays, approved leave, approved swaps and your selected current shift are unavailable."/>
        </div>
        <div>
          <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.08em] text-black"><span className="inline-block h-3.5 w-1 rounded-full bg-[#1f70d0]"/>3. Available Student Assistants</p>
          <FieldLabel icon={<Users size={16} className="text-black"/>}>Student Assistant</FieldLabel>
          {!newDate ? <p className="rounded-lg border border-dashed border-[#cfdee9] bg-[#f4f8fb] p-4 text-sm text-black">Select a new shift date to see which student assistants are available.</p>
            : availableStudents.length ? <>
              <p className="mb-2 text-sm text-black">Working on <strong>{dateLabel(newKey)}</strong> and free on <strong>{dateLabel(currentShift.shiftDate)}</strong>:</p>
              <div role="radiogroup" aria-label="Available student assistants" className="grid gap-2">
                {availableStudents.map(item => <button type="button" role="radio" aria-checked={String(colleague) === String(item.id)} key={item.id} onClick={()=>setColleague(item.id)} className={`focus-ring flex items-center justify-between rounded-lg border px-4 py-3 text-left ${String(colleague) === String(item.id)?'border-[#1f70d0] bg-[#e7f1fa]':errors.colleague?'border-[#d05b48] hover:border-[#9cc0dd]':'border-[#d0e0ea] hover:border-[#9cc0dd]'}`}><span><span className="block text-sm font-bold text-[#243e5b]">{item.name}</span><span className="mt-1 block text-sm text-black"><Clock3 size={16} className="mr-1 inline"/>{item.time}</span></span><span className="text-sm font-bold text-[#1f70d0]">{String(colleague) === String(item.id)?'Selected':'Select'}</span></button>)}
              </div>
            </> : colleaguesLoading ? <p className="rounded-lg bg-[#eef1f4] p-4 text-sm font-semibold text-black">Checking available student assistants...</p>
              : colleaguesError ? <p role="alert" className="rounded-lg bg-[#fbe4e1] p-4 text-sm font-semibold text-[#c54f43]">{colleaguesError}</p>
                : <p className="rounded-lg bg-[#eef1f4] p-4 text-sm font-semibold text-black">No student assistants are available on {dateLabel(newKey)}. Please choose another date.</p>}
          {errors.colleague && <p className="mt-2 text-sm font-bold text-[#c54f43]">{errors.colleague}</p>}
        </div>
      </div>
      <div className="mt-7">
        <label htmlFor="swap-reason"><FieldLabel icon={<FileText size={16} className="text-black"/>}>Justification &amp; Comments</FieldLabel><textarea id="swap-reason" rows={4} maxLength={MAX_JUSTIFICATION_LENGTH} value={reason} onChange={e=>{ setReason(e.target.value); setErrors(prev => ({ ...prev, reason: '' })); }} aria-describedby="swap-reason-count" placeholder="Example: I need to exchange this shift with an available colleague because of a university timetable conflict." className="focus-ring w-full rounded-lg border border-[#cfdee9] bg-[#fbfdfe] px-3.5 py-3 text-sm text-[#243e5b] outline-none placeholder:text-black focus:border-[#1f70d0]"/></label>
        <div className="mt-1 flex justify-between text-xs text-[#718196]"><p id="swap-reason-count">{reason.length}/{MAX_JUSTIFICATION_LENGTH} characters</p>{errors.reason && <p className="font-medium text-[#c54f43]" role="alert">{errors.reason}</p>}</div>
        <SuggestionBox title="Suggested text" suggestions={["Medical appointment", "Family commitment", "Academic timetable conflict", "Transport or scheduling issue"]} onSelect={(text) => { setReason(text); setErrors(prev => ({ ...prev, reason: '' })); }} />
      </div>
      <div className="mt-6 flex items-start gap-3 rounded-lg border border-[#d0e0ea] bg-[#f4f8fb] p-4"><Info size={20} className="mt-0.5 shrink-0 text-[#1f70d0]"/><div><p className="text-sm font-bold text-[#243e5b]">Swap Policy Notice</p><p className="mt-1 text-sm leading-5 text-black">All swaps are subject to department lead approval. Approved swaps are shown on your schedule and the swapped dates become unavailable for another request.</p></div></div>
      {errors.submit && <p className="mt-4 rounded-lg bg-[#fbe4e1] px-4 py-3 text-sm font-bold text-[#c54f43]">{errors.submit}</p>}
      <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-[#e2eaf1] pt-6"><div className="flex gap-3"><button type="button" onClick={()=>setLocation(editing ? returnTo : '/dashboard/request')} className="focus-ring rounded-lg bg-[#d05b48] px-6 py-2.5 text-sm font-bold text-white">Cancel</button><button type="submit" className="focus-ring flex items-center gap-2 rounded-lg bg-[#1f70d0] px-6 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_#1555aa]">{editing ? 'Save changes' : 'Submit Swap Request'}<ChevronRight size={18}/></button></div></div>
    </form>
  </main></PortalShell>;
}
