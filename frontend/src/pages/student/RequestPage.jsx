import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { FileText, RefreshCw, Upload, Trash2, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { PortalShell, DatePicker, FieldLabel, SuggestionBox } from '@/components/portal/PortalComponents';
import { useRequests } from '@/context/RequestsContext';
import { approvedLeaveDates } from '@/lib/schedule';

const CATEGORIES = [
  { key: 'day-off', label: 'Day-off Request', text: 'Standard scheduled time away' },
  { key: 'sick', label: 'Sick Leave', text: 'Medical or health related absence' },
  { key: 'exam', label: 'Exam Leave', text: 'Absence for scheduled examinations' },
  { key: 'personal', label: 'Personal Issues', text: 'Urgent family or personal matters' },
];

export default function RequestPage() {
  const [, setLocation] = useLocation();
  const { addRequest, requests } = useRequests();
  const [category, setCategory] = useState('sick');
  const [dates, setDates] = useState({});
  const [comments, setComments] = useState('');
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const blockedDates = useMemo(() => approvedLeaveDates(requests), [requests]);

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!dates?.from || !dates?.to) next.dateRange = 'Select a start and end date in this month.';
    setErrors(next);
    if (Object.keys(next).length) return;
    try {
      await addRequest({
        type: CATEGORIES.find(c => c.key === category)?.label || 'Leave Request',
        dateRange: `${format(dates.from, 'MMM d, yyyy')} – ${format(dates.to, 'MMM d, yyyy')}`,
        detail: comments.trim() || CATEGORIES.find(c => c.key === category)?.text || 'Leave request submitted by the student assistant.',
        comments: comments.trim(),
      });
      setLocation('/dashboard');
    } catch (err) {
      setErrors({ submit: err.message || 'Could not submit the leave request.' });
    }
  };

  return <PortalShell><main className="px-5 py-7 md:px-8 md:py-8">
    <p className="mb-3 inline-flex rounded-full bg-[#162c4d] px-3 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-white">Student Portal</p>
    <h1 className="serif text-4xl text-[#10253f]">Submit a Request</h1>
    <p className="mt-2 max-w-xl text-sm text-[#52708b]">Please provide the details for your absence or scheduling change. Approved leave dates become unavailable automatically.</p>
    <form onSubmit={submit} className="mt-6 rounded-xl bg-white p-5 shadow-[0_3px_8px_rgba(53,91,121,.08)] md:p-6" noValidate>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e2eaf1] pb-5">
        <div><h2 className="text-lg font-bold text-[#10253f]">Request Details</h2><p className="mt-1 text-sm text-[#52708b]">Select the type of request you wish to submit.</p></div>
        <div className="flex rounded-lg bg-[#edf4f8] p-1"><span className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-bold text-[#1f70d0]"><FileText size={18}/>Leave Request</span><Link href="/dashboard/shift-swap" className="focus-ring flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-black hover:text-[#385570]"><RefreshCw size={18}/>Shift Swapping</Link></div>
      </div>
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div><div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[.08em] text-black">Absence Category</span><span className="rounded-full border border-[#d0e0ea] px-2.5 py-0.5 text-sm font-semibold text-black">Select one</span></div><div className="space-y-3">{CATEGORIES.map(cat => <button type="button" key={cat.key} onClick={() => setCategory(cat.key)} className={`focus-ring block w-full rounded-lg border px-4 py-3 text-left ${category === cat.key ? 'border-[#1f70d0] bg-[#e7f1fa]' : 'border-[#d0e0ea] hover:border-[#9cc0dd]'}`}><span className="block text-sm font-bold text-[#243e5b]">{cat.label}</span><span className="mt-0.5 block text-sm text-black">{cat.text}</span></button>)}</div></div>
        <div><DatePicker value={dates} onChange={setDates} range label="Date Range" error={errors.dateRange} blockedDates={blockedDates} helper="Choose both dates from the current month. Past dates, Sundays, public holidays and approved leave are disabled."/><div className="mt-6"><FieldLabel icon={<Upload size={16} className="text-black"/>}>Attach Supporting Document</FieldLabel><div className="rounded-lg border border-[#d0e0ea] bg-[#f4f8fb] p-5"><label htmlFor="request-file" className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#c6dcec] py-8 text-center"><Upload size={26} className="text-black"/><span className="text-sm font-semibold text-[#243e5b]">{file ? file.name : 'Drop files here'}</span><span className="text-sm text-black">Supported format: PNG, JPG</span><input id="request-file" type="file" accept="image/png,image/jpeg" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)}/></label><div className="mt-4 flex justify-end gap-3">{file && <button type="button" onClick={() => setFile(null)} className="focus-ring flex items-center gap-1.5 rounded-lg border border-[#d05b48] px-3 py-1.5 text-sm font-bold text-[#d05b48]"><Trash2 size={16}/>Remove</button>}<label htmlFor="request-file" className="focus-ring cursor-pointer rounded-lg bg-[#1f70d0] px-4 py-1.5 text-sm font-bold text-white">Upload</label></div></div></div></div>
      </div>
      <div className="mt-6"><label htmlFor="request-comments"><FieldLabel>Justification &amp; Comments</FieldLabel><textarea id="request-comments" rows={4} value={comments} onChange={e => setComments(e.target.value)} placeholder="Example: I need leave to attend a scheduled examination / medical appointment. I will complete my assigned hours before or after this period." className="focus-ring w-full rounded-lg border border-[#cfdee9] bg-[#fbfdfe] px-3.5 py-3 text-sm text-[#243e5b] outline-none placeholder:text-black focus:border-[#1f70d0]"/></label><SuggestionBox title="Suggested text" suggestions={["Medical appointment and recovery", "Scheduled examination", "Family or personal commitment", "University-related activity"]}/></div>
      {errors.submit && <p className="mt-4 rounded-lg bg-[#fbe4e1] px-4 py-3 text-sm font-bold text-[#c54f43]">{errors.submit}</p>}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#e2eaf1] pt-6"><span className="flex items-center gap-1.5 text-sm font-semibold text-black"><CheckCircle2 size={16}/>Draft is kept while you complete the form.</span><div className="flex gap-3"><button type="button" onClick={() => setLocation('/dashboard')} className="focus-ring rounded-lg bg-[#d05b48] px-6 py-2.5 text-sm font-bold text-white">Cancel</button><button type="submit" className="focus-ring flex items-center gap-2 rounded-lg bg-[#1f70d0] px-6 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_#1555aa]">Submit Leave Request<ChevronRight size={18}/></button></div></div>
    </form>
  </main></PortalShell>;
}
