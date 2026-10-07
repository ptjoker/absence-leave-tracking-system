import { useEffect, useMemo, useRef, useState } from 'react';
import { format, endOfYear, isBefore, startOfDay, isSameMonth, addDays } from 'date-fns';
import { FileText, RefreshCw, Upload, Trash2, ChevronRight, CheckCircle2, CalendarDays } from 'lucide-react';
import { Link, useLocation, useSearch } from 'wouter';
import { PortalShell, FieldLabel, SuggestionBox } from '@/components/portal/PortalComponents';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useRequests } from '@/context/RequestsContext';
import { approvedLeaveDates, approvedSwapRequests, parseDateRangeKeys, isPublicHoliday, isSunday } from '@/lib/schedule';
import { isSwapRequest } from '@/lib/notifications';
import { useStrikeDays } from '@/lib/strikes';

// Maximum working days allowed in one leave request for each category.
const CATEGORIES = [
  { key: 'day-off', label: 'Day-off Request', text: 'Standard scheduled time away', maxDays: 1 },
  { key: 'sick', label: 'Sick Leave', text: 'Medical or health related absence', maxDays: 5 },
  { key: 'exam', label: 'Exam Leave', text: 'Absence for scheduled examinations', maxDays: 3 },
  { key: 'personal', label: 'Personal Issues', text: 'Urgent family or personal matters', maxDays: 3 },
];

const dayWord = (n) => `${n} ${n === 1 ? 'day' : 'days'}`;

function YearRangePicker({ value, onChange, label, error, helper, blockedDates = [], numDays = 1 }) {
  const [open, setOpen] = useState(false);
  const today = startOfDay(new Date());
  const yearStart = startOfDay(new Date(today.getFullYear(), 0, 1));
  const yearEnd = endOfYear(today);
  const blocked = new Set(blockedDates || []);
  const swapTo = new Set(blocked.swapTo || []);
  const swapFrom = new Set(blocked.swapFrom || []);
  const closure = new Set(blocked.closure || blocked.strike || []);
  const keyOf = (d) => format(startOfDay(d), 'yyyy-MM-dd');
  const isOff = (d) => isPublicHoliday(d) || isSunday(d) || blocked.has(keyOf(d)) || swapTo.has(keyOf(d)) || swapFrom.has(keyOf(d)) || closure.has(keyOf(d));

  const buildRange = (start) => {
    const from = startOfDay(start);
    let cur = from;
    let last = from;
    let count = 0;
    while (count < numDays) {
      if (!isSameMonth(cur, from) || cur > yearEnd) return null;
      if (!isOff(cur)) { count += 1; last = cur; }
      cur = addDays(cur, 1);
    }
    return { from, to: last };
  };

  const disabled = (date) => {
    const day = startOfDay(date);
    if (isBefore(day, today) || day > yearEnd) return true;
    if (isOff(day)) return true;
    return buildRange(day) === null;
  };

  const display = value?.from
    ? `${format(value.from, 'MMM d, yyyy')}${value.to && value.to.getTime() !== value.from.getTime() ? ` – ${format(value.to, 'MMM d, yyyy')}` : ''}`
    : '';

  const onDayClick = (day) => {
    const range = buildRange(day);
    if (!range) return;
    onChange(range);
    setOpen(false);
  };

  return <div>
    <FieldLabel required icon={<CalendarDays size={14} className="text-black" />}>{label}</FieldLabel>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label={label} className={`focus-ring flex w-full items-center justify-between rounded-lg border bg-[#fbfdfe] px-3.5 py-3 text-left text-sm outline-none ${error ? 'border-[#d05b48]' : 'border-[#cfdee9] hover:border-[#9cc0dd]'}`}>
          <span className="request-date-display min-w-0 flex-1 break-words font-semibold text-black">{display || 'Select start date'}</span>
          <CalendarDays size={18} className="shrink-0 text-black" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" align="center" sideOffset={16} collisionPadding={16} className="date-picker-popover z-[100] w-auto max-w-[92vw] bg-white p-3">
        <Calendar
          mode="range"
          selected={value}
          onDayClick={onDayClick}
          defaultMonth={value?.from || today}
          startMonth={yearStart}
          endMonth={yearEnd}
          disabled={disabled}
          modifiers={{
            holiday: (d) => isPublicHoliday(d),
            blocked: (d) => blocked.has(keyOf(d)),
            swappedTo: (d) => swapTo.has(keyOf(d)),
            swappedFrom: (d) => swapFrom.has(keyOf(d)),
            closure: (d) => closure.has(keyOf(d)),
            pastDay: (d) => isBefore(startOfDay(d), today),
            sundayDay: (d) => isSunday(d),
          }}
          modifiersClassNames={{
            holiday: '!opacity-100 rounded-md border border-[#2c9b62] bg-[#d9f3e3] [&_button]:text-[#246b45]',
            blocked: '!opacity-100 rounded-md border border-[#aeb6bf] bg-[#d9dde2] [&_button]:text-black',
            swappedTo: '!opacity-100 rounded-md border border-[#aeb6bf] bg-[#d9dde2] [&_button]:text-black',
            swappedFrom: '!opacity-100 rounded-md border border-[#2b67c9] bg-[#dce9ff] [&_button]:text-[#163f8a]',
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
          <span className="flex items-center gap-1.5"><span className="size-3 rounded border border-[#2c9b62] bg-[#d9f3e3]" />Green box - Holiday</span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-[#d9dde2]" />Grey box - date swapped to</span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded border border-[#2b67c9] bg-[#dce9ff]" />Blue box - date swapped from</span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-[#d05b48]" />Red box - Institutional closure</span>
        </div>
        <p className="mt-2 max-w-[308px] px-2 text-sm font-semibold text-black">Click your start date. The end date is set automatically from the {dayWord(numDays)} selected.</p>
        <p className="mt-1 max-w-[308px] px-2 text-xs font-semibold text-black">Sundays, public holidays, approved leave, approved swaps and institutional closures cannot be selected.</p>
      </PopoverContent>
    </Popover>
    {helper && <p className="mt-1.5 text-sm italic text-black">{helper}</p>}
    {error && <p className="mt-1.5 text-sm font-medium text-[#c54f43]">{error}</p>}
  </div>;
}

export default function RequestPage() {
  const [, setLocation] = useLocation();
  const { addRequest, updateRequest, requests } = useRequests();
  const strikeDays = useStrikeDays();
  const search = new URLSearchParams(useSearch());
  const editId = search.get('edit');
  const returnTo = search.get('from') === 'history' ? '/dashboard/history' : '/dashboard';
  const editTarget = editId ? requests.find((r) => r.rawId === editId) : null;
  const editing = Boolean(editTarget && editTarget.status === 'Pending' && !isSwapRequest(editTarget));
  const loadedFor = useRef(null);
  const [waited, setWaited] = useState(false);
  const [category, setCategory] = useState('sick');
  const [days, setDays] = useState(1);
  const [dates, setDates] = useState({});
  const [comments, setComments] = useState('');
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const approvedSwaps = useMemo(() => approvedSwapRequests(requests), [requests]);
  const swapDates = useMemo(() => {
    const to = [];
    const from = [];
    approvedSwaps.forEach((request) => {
      parseDateRangeKeys(request.dateRange).forEach((key) => to.push(key));
      const text = `${request.detail || ''} ${request.reason || ''}`;
      const match = text.match(/Swap from (.+?) to (.+?) with (.+?)(?:\.|$)/i);
      if (match) {
        const d = new Date(match[1]);
        if (!Number.isNaN(d.getTime())) from.push(format(d, 'yyyy-MM-dd'));
      }
    });
    return { to: [...new Set(to)], from: [...new Set(from)] };
  }, [approvedSwaps]);
  const closureDates = Object.keys(strikeDays);
  const blockedDates = useMemo(() => {
    const dates = [...approvedLeaveDates(requests), ...closureDates];
    return Object.assign(dates, { swapTo: swapDates.to, swapFrom: swapDates.from, closure: closureDates, strike: closureDates });
  }, [requests, closureDates.join(','), swapDates]);

  const currentCategory = CATEGORIES.find((c) => c.key === category);
  const maxDays = currentCategory?.maxDays ?? 1;

  useEffect(() => { const t = setTimeout(() => setWaited(true), 800); return () => clearTimeout(t); }, []);

  useEffect(() => {
    if (!editTarget || loadedFor.current === editTarget.rawId) return;
    if (isSwapRequest(editTarget)) {
      setLocation(`/dashboard/shift-swap?edit=${encodeURIComponent(editTarget.rawId)}&from=${search.get('from') || 'dashboard'}`);
      return;
    }
    if (editTarget.status !== 'Pending') return;
    loadedFor.current = editTarget.rawId;
    const match = CATEGORIES.find((c) => c.label === editTarget.type);
    if (match) setCategory(match.key);
    const keys = parseDateRangeKeys(editTarget.dateRange);
    if (keys.length) {
      const from = new Date(`${keys[0]}T00:00:00`);
      const to = new Date(`${(keys[1] || keys[0])}T00:00:00`);
      setDates({ from, to });
      let n = 0;
      for (let d = from; d <= to; d = addDays(d, 1)) {
        if (!isSunday(d) && !isPublicHoliday(d)) n += 1;
      }
      setDays(Math.min(Math.max(n, 1), match?.maxDays ?? 1));
    }
    const note = editTarget.reason || editTarget.detail || '';
    setComments(CATEGORIES.some((c) => c.text === note) ? '' : note);
  }, [editTarget]);

  const onCategoryChange = (key) => {
    const next = CATEGORIES.find((c) => c.key === key);
    setCategory(key);
    setDays((d) => Math.min(d, next?.maxDays ?? 1));
    setDates({});
    setErrors({});
  };

  const onDaysChange = (n) => {
    setDays(n);
    setDates({});
    setErrors({});
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!dates?.from || !dates?.to) next.dateRange = 'Select your start date.';
    else if (days > maxDays) next.dateRange = `You can request at most ${dayWord(maxDays)} for ${currentCategory?.label}.`;
    setErrors(next);
    if (Object.keys(next).length) return;
    try {
      const entry = {
        type: currentCategory?.label || 'Leave Request',
        dateRange: `${format(dates.from, 'MMM d, yyyy')} – ${format(dates.to, 'MMM d, yyyy')}`,
        detail: comments.trim() || currentCategory?.text || 'Leave request submitted by the student assistant.',
        comments: comments.trim(),
        reason: comments.trim() || null,
      };
      if (editing && updateRequest) {
        await updateRequest(editTarget.id, entry);
        setLocation(returnTo);
        return;
      }
      await addRequest(entry);
      setLocation('/dashboard');
    } catch (err) {
      setErrors({ submit: err.message || (editing ? 'Could not save your changes.' : 'Could not submit the leave request.') });
    }
  };

  if (editId && !editing && !(editTarget && isSwapRequest(editTarget)) && (editTarget || waited)) {
    return <PortalShell><main className="px-5 py-7 md:px-8 md:py-8">
      <h1 className="serif text-4xl text-[#10253f]">Request can't be edited</h1>
      <p className="mt-2 max-w-xl text-sm text-black">{editTarget ? 'This request has already been approved or declined, so it can no longer be changed.' : 'This request could not be found. It may have been cancelled.'}</p>
      <Link href={returnTo} className="focus-ring mt-5 inline-flex rounded-lg bg-[#1f70d0] px-5 py-2.5 text-sm font-bold text-white">Back to my requests</Link>
    </main></PortalShell>;
  }

  return <PortalShell><main className="px-5 py-7 md:px-8 md:py-8">
    <p className="mb-3 inline-flex rounded-full bg-[#162c4d] px-3 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-white">Student Portal</p>
    <h1 className="serif text-4xl text-[#10253f]">{editing ? `Edit Request ${editTarget.id}` : 'Submit a Request'}</h1>
    <p className="mt-2 max-w-xl text-sm text-black">{editing ? 'Change the type, dates or note, then press Save changes. Your request stays pending until a supervisor decides on it.' : 'Please provide the details for your absence or scheduling change. Approved leave dates become unavailable automatically.'}</p>
    <form onSubmit={submit} className="mt-6 rounded-xl bg-white p-5 shadow-[0_3px_8px_rgba(53,91,121,.08)] md:p-6" noValidate>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e2eaf1] pb-5">
        <div><h2 className="text-lg font-bold text-[#10253f]">Request Details</h2><p className="mt-1 text-sm text-black">{editing ? 'Update the details of your pending request.' : 'Select the type of request you wish to submit.'}</p></div>
        <div className="flex rounded-lg bg-[#edf4f8] p-1"><span className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-bold text-[#1f70d0]"><FileText size={18} />Leave Request</span>{!editing && <Link href="/dashboard/shift-swap" className="focus-ring flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-black hover:text-[#385570]"><RefreshCw size={18} />Shift Swapping</Link>}</div>
      </div>
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div>
            <label htmlFor="request-category" className="mb-2 block text-xs font-bold uppercase tracking-[.08em] text-black">Absence Category</label>
            <select id="request-category" value={category} onChange={e => onCategoryChange(e.target.value)} className="focus-ring w-full rounded-lg border border-[#cfdee9] bg-[#fbfdfe] px-3.5 py-3 text-sm font-semibold text-black outline-none hover:border-[#9cc0dd] focus:border-[#1f70d0]">{CATEGORIES.map(cat => <option key={cat.key} value={cat.key}>{cat.label}</option>)}</select>
            <p className="mt-1.5 text-sm text-black">{currentCategory?.text}</p>
          </div>
          <div>
            <label htmlFor="request-days" className="mb-2 block text-xs font-bold uppercase tracking-[.08em] text-black">Number of Days</label>
            <select id="request-days" value={days} onChange={e => onDaysChange(Number(e.target.value))} className="focus-ring w-full rounded-lg border border-[#cfdee9] bg-[#fbfdfe] px-3.5 py-3 text-sm font-semibold text-black outline-none hover:border-[#9cc0dd] focus:border-[#1f70d0]">
              {Array.from({ length: maxDays }, (_, i) => i + 1).map(n => <option key={n} value={n}>{dayWord(n)}</option>)}
            </select>
            <p className="mt-1.5 text-sm text-black">{currentCategory?.label} is limited to {dayWord(maxDays)} per request.</p>
          </div>
          <YearRangePicker value={dates} onChange={setDates} label="Date Range" error={errors.dateRange} blockedDates={blockedDates} numDays={days} helper="Choose how many days you need, then pick your start date. Past dates, Sundays, public holidays, approved leave, approved swaps and institutional closures are skipped." />
        </div>
        <div><FieldLabel icon={<Upload size={16} className="text-black" />}>Attach Supporting Document</FieldLabel><div className="rounded-lg border border-[#d0e0ea] bg-[#f4f8fb] p-5"><label htmlFor="request-file" className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#c6dcec] py-8 text-center"><Upload size={26} className="text-black" /><span className="text-sm font-semibold text-[#243e5b]">{file ? file.name : 'Drop files here'}</span><span className="text-sm text-black">Supported format: PNG, JPG</span><input id="request-file" type="file" accept="image/png,image/jpeg" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} /></label><div className="mt-4 flex justify-end gap-3">{file && <button type="button" onClick={() => setFile(null)} className="focus-ring flex items-center gap-1.5 rounded-lg border border-[#d05b48] px-3 py-1.5 text-sm font-bold text-[#d05b48]"><Trash2 size={16} />Remove</button>}<label htmlFor="request-file" className="focus-ring cursor-pointer rounded-lg bg-[#1f70d0] px-4 py-1.5 text-sm font-bold text-white">Upload</label></div></div></div>
      </div>
      <div className="mt-6"><label htmlFor="request-comments"><FieldLabel>Justification &amp; Comments</FieldLabel><textarea id="request-comments" rows={4} value={comments} onChange={e => setComments(e.target.value)} placeholder="Example: I need leave to attend a scheduled examination / medical appointment. I will complete my assigned hours before or after this period." className="focus-ring w-full rounded-lg border border-[#cfdee9] bg-[#fbfdfe] px-3.5 py-3 text-sm text-black outline-none placeholder:text-black focus:border-[#1f70d0]" /></label><SuggestionBox title="Suggested text" suggestions={["Medical appointment and recovery", "Scheduled examination", "Family or personal commitment", "University-related activity"]} /></div>
      {errors.submit && <p className="mt-4 rounded-lg bg-[#fbe4e1] px-4 py-3 text-sm font-bold text-[#c54f43]">{errors.submit}</p>}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#e2eaf1] pt-6"><span className="flex items-center gap-1.5 text-sm font-semibold text-black"><CheckCircle2 size={16} />Draft is kept while you complete the form.</span><div className="flex gap-3"><button type="button" onClick={() => setLocation(editing ? returnTo : '/dashboard')} className="focus-ring rounded-lg bg-[#d05b48] px-6 py-2.5 text-sm font-bold text-white">{editing ? 'Stop editing' : 'Cancel'}</button><button type="submit" className="focus-ring flex items-center gap-2 rounded-lg bg-[#1f70d0] px-6 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_#1555aa]">{editing ? 'Save changes' : 'Submit Leave Request'}<ChevronRight size={18} /></button></div></div>
    </form>
  </main></PortalShell>;
}
