import { useMemo, useRef, useState } from 'react';
import { CalendarDays, Clock3, MapPin, ChevronLeft, ChevronRight, CheckCircle2, Upload, FileText, Trash2, Download } from 'lucide-react';
import { PortalShell, STUDENT } from '@/components/portal/PortalComponents';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { useRequests } from '@/context/RequestsContext';
import { useNotifications } from '@/context/NotificationsContext';
import { timetableUploadedNotification } from '@/lib/notifications';
import { useTimetables, saveTimetable, removeTimetable, formatFileSize } from '@/lib/timetables';
import { useStrikeDays } from '@/lib/strikes';
import { generateStudentSchedule, holidayName, isPublicHoliday, approvedLeaveDates, approvedSwapRequests, parseDateRangeKeys } from '@/lib/schedule';

function getStudentNumber() {
  try { return JSON.parse(localStorage.getItem('session') || '{}')?.user?.student_number || STUDENT.number; } catch { return STUDENT.number; }
}

function getStudentName() {
  try {
    const u = JSON.parse(localStorage.getItem('session') || '{}')?.user || {};
    return `${u.first_name || ''} ${u.last_name || ''}`.trim() || STUDENT.name;
  } catch { return STUDENT.name; }
}

function swapMeta(request) {
  const text = `${request.detail || ''} ${request.reason || ''}`;
  const match = text.match(/Swap from (.+?) to (.+?) with (.+?)(?:\.|$)/i);
  return match ? { from: match[1], to: match[2], with: match[3] } : null;
}

export default function SchedulePage() {
  const { requests } = useRequests();
  const strikeDays = useStrikeDays();
  const { push } = useNotifications();
  const studentNumber = getStudentNumber();
  const timetables = useTimetables();
  const myTimetable = timetables[studentNumber];
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const handleTimetableChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const name = getStudentName();
      const replaced = Boolean(myTimetable);
      await saveTimetable({ studentNumber, name, file });
      push(timetableUploadedNotification({ studentNumber, name, fileName: file.name, replaced }));
    } catch (err) {
      setUploadError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };
  const year = 2026;
  const today = new Date();
  const [monthDate, setMonthDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today);
  const schedule = useMemo(() => generateStudentSchedule(studentNumber, year), [studentNumber]);
  const approvedLeave = useMemo(() => new Set(approvedLeaveDates(requests)), [requests]);
  const approvedSwaps = useMemo(() => approvedSwapRequests(requests), [requests]);
  const swapByDate = useMemo(() => {
    const map = new Map();
    approvedSwaps.forEach((request) => {
      const meta = swapMeta(request);
      parseDateRangeKeys(request.dateRange).forEach((key) => map.set(key, { request, meta, direction: 'to' }));
      if (meta?.from) {
        const fromDate = new Date(meta.from);
        if (!Number.isNaN(fromDate.getTime())) map.set(format(fromDate, 'yyyy-MM-dd'), { request, meta, direction: 'from' });
      }
    });
    return map;
  }, [approvedSwaps]);

  const days = eachDayOfInterval({ start: startOfMonth(monthDate), end: endOfMonth(monthDate) });
  const leading = (startOfMonth(monthDate).getDay() + 6) % 7;
  const selectedKey = format(selected, 'yyyy-MM-dd');
  const selectedShift = schedule[selectedKey];
  const selectedSwap = swapByDate.get(selectedKey);
  const selectedSwapShift = selectedSwap?.direction === 'to' && selectedSwap.meta?.with
    ? (selectedShift || generateStudentSchedule(selectedSwap.meta.with, year)[selectedKey])
    : selectedShift;
  const selectedHoliday = holidayName(selected);
  const selectedStrike = strikeDays[selectedKey];
  const monthIndex = monthDate.getMonth();
  const canGoPrev = monthIndex > 0;
  const canGoNext = monthIndex < 11;

  const selectMonth = (nextMonth) => {
    const next = new Date(year, nextMonth, 1);
    setMonthDate(next);
    setSelected(next);
  };

  return <PortalShell><main className="px-5 py-7 md:px-8 md:py-8">
    <div className="mb-6"><p className="mb-3 inline-flex rounded-full bg-[#162c4d] px-3 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-white">Student Schedule</p><h1 className="serif text-4xl text-[#10253f]">Library Assistant Shift Management</h1><p className="mt-2 max-w-2xl text-sm text-[#52708b]">Your shifts are generated as a stable individual roster: each student assistant works 2–3 days per week, on either a morning or afternoon shift. Sundays and public holidays are never scheduled.</p></div>
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <section className="rounded-xl bg-[#f4f8fb] p-5 md:p-6">
        <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold text-[#10253f]">{format(monthDate,'MMMM yyyy')}</h2><p className="text-sm text-black">Monthly shift calendar · {year}</p></div><div className="flex gap-2"><button disabled={!canGoPrev} onClick={()=>selectMonth(monthIndex-1)} className="focus-ring rounded-lg border bg-white p-2 text-black disabled:cursor-not-allowed disabled:opacity-30" aria-label="Previous month"><ChevronLeft size={20}/></button><button disabled={!canGoNext} onClick={()=>selectMonth(monthIndex+1)} className="focus-ring rounded-lg border bg-white p-2 text-black disabled:cursor-not-allowed disabled:opacity-30" aria-label="Next month"><ChevronRight size={20}/></button></div></div>
        <div className="mt-5 grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-[#dce5ec] bg-[#dce5ec]"><div className="col-span-7 grid grid-cols-7 bg-white">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=><div key={d} className="p-2 text-center text-sm font-bold uppercase text-black">{d}</div>)}</div>{Array.from({length:leading}).map((_,i)=><div key={'lead'+i} className="min-h-24 bg-[#f8fafc]"/>)}{days.map(day=>{const k=format(day,'yyyy-MM-dd'); const shift=schedule[k]; const holiday=isPublicHoliday(day); const leave=approvedLeave.has(k); const swap=swapByDate.get(k); const strike=Boolean(strikeDays[k]); const past = k < format(today,'yyyy-MM-dd'); const sunday = day.getDay() === 0; const disabledDay = holiday || leave || swap?.direction === 'from' || strike || past || sunday; return <button key={k} disabled={disabledDay} onClick={()=>setSelected(day)} className={`min-h-28 p-2 text-left align-top ${isSameDay(day,selected)?'ring-2 ring-inset ring-[#1f70d0]':''} ${holiday?'bg-[#d9f3e3]':strike?'bg-[#d05b48]':swap?.direction==='from'?'bg-[#dce9ff]':swap?.direction==='to'?'bg-[#d9dde2]':leave?'bg-[#d9dde2]':'bg-white'} ${disabledDay?'opacity-80':''} disabled:cursor-not-allowed`}><div className="flex items-start justify-between"><span className={`calendar-day-number ${past||sunday?'calendar-x-number':''} grid size-8 place-items-center rounded-full text-sm font-bold ${isSameDay(day,selected)?'bg-[#1f70d0] text-white':'text-black'}`}>{format(day,'d')}</span>{holiday&&<span className="rounded px-1.5 py-0.5 text-xs font-bold text-[#246b45]">Holiday</span>}{strike&&<span className="rounded px-1.5 py-0.5 text-xs font-bold text-[#8f3a2d]">Closure</span>}</div>{holiday?<span className="mt-2 block text-xs font-bold leading-4 text-[#246b45]">{holidayName(day)}</span>:strike?<span className="mt-2 block rounded-md bg-[#d05b48] px-2 py-1 text-xs font-bold text-white">Institutional closure{strikeDays[k]?.closureType ? ` · ${strikeDays[k].closureType}` : ''}</span>:leave?<span className="mt-2 block rounded-md bg-[#d9dde2] px-2 py-1 text-xs font-bold text-black">Approved leave</span>:swap?<span className={`mt-2 block rounded-md px-2 py-1 text-xs font-bold ${swap.direction==='from'?'border border-[#2b67c9] bg-[#dce9ff] text-[#163f8a]':'bg-[#d9dde2] text-black'}`}>{swap.direction==='from'?`Swapped to ${swap.meta?.to || 'approved date'}`:`Swapped from ${swap.meta?.from || 'original date'}`}</span>:shift?<span className="schedule-shift-label mt-2 block rounded-md bg-[#e7f1fa] px-2 py-1 text-xs font-bold text-[#1f70d0]">SHIFT</span>:<span className="mt-2 block text-xs font-semibold text-black"></span>}</button>})}</div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-black"><span className="flex items-center gap-2"><span className="size-4 rounded border border-[#2c9b62] bg-[#d9f3e3]"/>Green box - Holiday</span><span className="flex items-center gap-2"><span className="size-4 rounded bg-[#fde0dc] border border-[#c4473d]"/>Red box - Institutional closure</span><span className="flex items-center gap-2"><span className="size-4 rounded bg-[#d9dde2]"/>Grey box - date swapped to</span><span className="flex items-center gap-2"><span className="size-4 rounded bg-[#dce9ff] border border-[#2b67c9]"/>Blue box - date swapped from</span></div>
      </section>
      <aside className="space-y-5"><div className="rounded-xl bg-white p-5 shadow-[0_3px_8px_rgba(53,91,121,.08)]"><div className="flex items-start gap-3"><span className="grid size-10 place-items-center rounded-lg bg-[#e7f1fa] text-[#1f70d0]"><CalendarDays size={20}/></span><div><p className="text-sm font-bold uppercase tracking-[.08em] text-black">Selected day</p><h2 className="mt-1 font-bold text-[#10253f]">{format(selected,'EEEE, MMM d')}</h2></div></div>{selectedHoliday?<div className="mt-5 rounded-lg bg-[#d9f3e3] p-4"><p className="text-sm font-bold text-[#246b45]">{selectedHoliday}</p><p className="mt-1 text-sm text-black">Public holiday — no leave, shift swap or work can be scheduled.</p></div>:selectedStrike?<div className="mt-5 rounded-lg bg-[#fdecea] p-4"><p className="text-sm font-bold text-[#8f3a2d]">Institutional closure{selectedStrike.closureType ? ` · ${selectedStrike.closureType}` : ''}</p><p className="mt-1 text-sm text-black">{selectedStrike.reason || 'This date is unavailable because an institutional closure was declared.'}</p></div>:approvedLeave.has(selectedKey)?<div className="mt-5 rounded-lg bg-[#d9dde2] p-4"><p className="text-sm font-bold text-black">Approved leave</p><p className="mt-1 text-sm text-black">This day is unavailable for another leave or swap request.</p></div>:selectedSwap?<div className="mt-5 rounded-lg bg-[#d9dde2] p-4"><p className="text-sm font-bold text-black">Approved shift swap</p><p className="mt-1 text-sm text-black">{selectedSwap.direction==='from' ? `Swapped out to ${selectedSwap.meta?.to || 'the approved date'}.` : `Swapped from ${selectedSwap.meta?.from || 'the original date'} to this date with ${selectedSwap.meta?.with || 'the colleague'}.`}</p>{selectedSwap.direction==='to' && selectedSwapShift && <div className="mt-3 rounded-lg bg-white p-3"><p className="flex items-center gap-2 text-sm font-bold text-[#243e5b]"><Clock3 size={18}/>{selectedSwapShift.time}</p><p className="mt-1 text-sm text-black"><MapPin size={16} className="mr-1 inline"/>TUT Library · {selectedSwapShift.shift} shift</p></div>}</div>:selectedShift?<div className="mt-5 space-y-3"><div className="rounded-lg bg-[#f4f8fb] p-3"><p className="flex items-center gap-2 text-sm font-bold text-[#243e5b]"><Clock3 size={18}/>{selectedSwapShift.time}</p><p className="mt-1 text-sm text-black"><MapPin size={16} className="mr-1 inline"/>TUT Library · {selectedSwapShift.shift} shift</p></div></div>:<p className="mt-5 text-sm font-semibold text-black">No shift assigned for this date.</p>}</div><div className="rounded-xl bg-[#f4f8fb] p-5"><p className="text-sm font-bold text-[#10253f]">Schedule notes</p><ul className="mt-3 space-y-3 text-sm leading-5 text-black"><li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#22b78b]"/>Approved leave and swaps are reflected here.</li><li className="flex gap-2"><Clock3 size={16} className="mt-0.5 shrink-0 text-[#1f70d0]"/>Arrive 10 minutes before your shift starts.</li><li className="flex gap-2"><CalendarDays size={16} className="mt-0.5 shrink-0 text-[#246b45]"/>Public holidays are automatically excluded.</li></ul></div><div className="rounded-xl bg-white p-5 shadow-[0_3px_8px_rgba(53,91,121,.08)]"><p className="text-sm font-bold text-[#10253f]">Upload timetable</p><p className="mt-1 text-xs leading-5 text-black">Upload your class timetable so your supervisor can see when you have lectures and plan your shifts around them.</p><input ref={fileInputRef} type="file" accept="application/pdf,image/png,image/jpeg,image/webp" onChange={handleTimetableChange} className="hidden" data-testid="input-timetable-file"/>{myTimetable&&<div className="mt-3 flex items-start gap-2 rounded-lg bg-[#f4f8fb] p-3"><FileText size={18} className="mt-0.5 shrink-0 text-[#1f70d0]"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#243e5b]">{myTimetable.fileName}</p><p className="text-xs text-black">{formatFileSize(myTimetable.size)} · Uploaded {format(new Date(myTimetable.uploadedAt),'d MMM yyyy')}</p><div className="mt-2 flex gap-3 text-xs font-bold"><a href={myTimetable.dataUrl} target="_blank" rel="noreferrer" className="text-[#1f70d0] hover:underline">View</a><a href={myTimetable.dataUrl} download={myTimetable.fileName} className="inline-flex items-center gap-1 text-[#1f70d0] hover:underline"><Download size={12}/>Download</a></div></div><button type="button" onClick={()=>removeTimetable(studentNumber)} className="focus-ring rounded-md p-1.5 text-[#d05b48] hover:bg-[#fbe4e1]" aria-label="Remove timetable"><Trash2 size={15}/></button></div>}<button type="button" disabled={uploading} onClick={()=>fileInputRef.current?.click()} className="focus-ring mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#1f70d0] px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_#1555aa] hover:bg-[#256fc6] disabled:opacity-50" data-testid="button-upload-timetable"><Upload size={15}/>{uploading?'Uploading…':myTimetable?'Replace timetable':'Upload timetable'}</button><p className="mt-2 text-[11px] text-black">PDF or image · max 2 MB</p>{uploadError&&<p className="mt-2 rounded-lg bg-[#fbe4e1] px-3 py-2 text-xs font-semibold text-[#d05b48]">{uploadError}</p>}</div></aside>
    </div>
  </main></PortalShell>;
}
