import { useState, useEffect, useContext, createContext } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ArrowRight, BadgeCheck, BookOpen, Bell, Building2, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronRight, ClipboardCheck, Clock3, Eye, EyeOff, FileText, GraduationCap, Info, LayoutDashboard, LockKeyhole, LogOut, Mail, MapPin, Menu, Moon, PanelTop, Phone, Plus, RefreshCw, ShieldCheck, Sun, TrendingUp, Trash2, Upload, User, UsersRound, X, } from 'lucide-react';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { RequestsProvider, useRequests } from '@/context/RequestsContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import StudentHistoryPage from '@/pages/student/HistoryPage';
import StudentProfilePage from '@/pages/student/ProfilePage';
import StudentSchedulePage from '@/pages/student/SchedulePage';
import StudentRequestPage from '@/pages/student/RequestPage';
import StudentShiftSwapPage from '@/pages/student/ShiftSwapPage';
import SupervisorDashboard from '@/pages/supervisor/Supervisordashboard';
import SupervisorRequestsPage from '@/pages/supervisor/Requestspage';
import SupervisorAssistancesPage from '@/pages/supervisor/StudentAssistancesPage';
import SupervisorCalendarPage from '@/pages/supervisor/Calendarpage';
import { ModeToggle, PortalShell } from '@/components/portal/PortalComponents';
const queryClient = new QueryClient();

/* Fixed, page-independent background photo shown behind every route. */
function PhotoBackdrop() {
  return <div aria-hidden="true" className="app-photo-backdrop" />;
}
const navItems = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'For students', href: '#students' },
  { label: 'For supervisors', href: '#supervisors' },
];
function Brand({ light = false }) {
  return (<Link href="/" className="focus-ring flex items-center gap-3" data-testid="link-brand">
    <img src="/tut-logo.png" alt="TUT logo" className="size-10 rounded-[5px] object-contain shadow-sm" />
    <span className="leading-none">
      <strong className={`block text-[15px] font-bold tracking-[-.02em] ${light ? 'text-white' : 'text-[#162c4d]'}`}>StudentAssist</strong>
      <span className="mt-1 block text-[9px] font-bold uppercase tracking-[.18em] text-[#c8102e]">ABSENCE AND LEAVE TRACKER</span>
    </span>
  </Link>);
}
function Header() {
  const { darkMode, toggleDarkMode } = useTheme();
  const onToggleMode = toggleDarkMode;
  const [open, setOpen] = useState(false);
  return (<header className="homepage-header relative z-20 border-b border-[#d5dfe8] bg-white">
    <div className="mx-auto flex h-[58px] max-w-[1440px] items-center justify-between px-5 sm:px-8">
      <Link href="/" className="focus-ring flex items-center gap-2" data-testid="link-brand">
        <img src="/tut-logo.png" alt="TUT logo" className="size-7 rounded-[4px] object-contain" />
        <span className="leading-none">
          <strong className="block text-[10px] font-bold tracking-[-.02em] text-[#162c4d] sm:text-[11px]">StudentAssist</strong>
          <span className="mt-0.5 block text-[5px] font-bold uppercase tracking-[.13em] text-[#c8102e] sm:text-[6px]">ABSENCE AND LEAVE TRACKER</span>
        </span>
      </Link>
      <nav className="hidden items-center gap-14 md:flex" aria-label="Main navigation">
        <a href="#" className="homepage-nav-link focus-ring text-[10px] font-medium text-[#283f59] transition-colors hover:text-[#286ee5]" data-testid="link-nav-homepage">Homepage</a>
        <button type="button" onClick={onToggleMode} aria-pressed={darkMode} className="homepage-nav-link focus-ring inline-flex items-center gap-2 text-[10px] font-medium text-[#283f59] transition-colors hover:text-[#286ee5]" data-testid="button-change-mode">
          {darkMode ? <Sun size={12} /> : <Moon size={12} />}
          Change mode <span className="font-bold text-[#f0b323]">· {darkMode ? 'Light' : 'Dark'}</span>
        </button>
      </nav>
      <button type="button" className="focus-ring rounded-lg p-2 text-[#203c5d] md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu" data-testid="button-mobile-menu">
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>
    </div>
    {open && <div className="homepage-mobile-menu border-t border-[#d7e3ee] bg-white px-5 py-4 sm:hidden">
      <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
        <a href="#" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-semibold text-[#48627d] hover:bg-[#eff6fb]">Homepage</a>
        <button type="button" onClick={() => { onToggleMode(); setOpen(false); }} aria-pressed={darkMode} className="flex items-center gap-2 rounded-lg px-3 py-3 text-left text-sm font-semibold text-[#48627d] hover:bg-[#eff6fb]" data-testid="button-mobile-change-mode">
          {darkMode ? <Sun size={15} /> : <Moon size={15} />}
          Change mode <span className="font-bold text-[#f0b323]">· {darkMode ? 'Light' : 'Dark'}</span>
        </button>
      </nav>
    </div>}
  </header>);
}
function Footer() {
  return (<footer className="homepage-footer bg-[#a9d0ea] text-[#29445f]">
    <div className="mx-auto max-w-[1180px] px-8 py-12 sm:px-12 lg:py-14">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.15fr_1fr_1fr_1.2fr]">
        <div>
          <p className="text-[13px] font-bold text-[#152d49]">Contact Us</p>
          <div className="mt-5 space-y-3 text-[11px] leading-4 text-[#52708b]">
            <p className="flex gap-2"><MapPin size={13} className="shrink-0" />19 OR Tambo, Witbank, Emalahleni,<br />1034, South Africa.</p>
            <p className="flex gap-2"><Phone size={13} className="shrink-0" />+27 (0)86 110 2421</p>
            <p className="flex gap-2"><Mail size={13} className="shrink-0" />general@tut.ac.za</p>
          </div>
        </div>
        <FooterGroup title="Platform" links={['Features', 'Documentation', 'Support Center', 'Status']} />
        <FooterGroup title="Legal" links={['Privacy Policy', 'Terms of Service', 'Security', 'Compliance']} />
        <div>
          <p className="text-[13px] font-bold text-[#152d49]">Connect</p>
          <div className="mt-5 flex gap-4 text-[#52708b]" aria-label="Social links">
            <a href="#twitter" aria-label="Twitter" className="hover:text-[#286ee5]">♥</a>
            <a href="#linkedin" aria-label="LinkedIn" className="hover:text-[#286ee5]">in</a>
            <a href="#github" aria-label="GitHub" className="hover:text-[#286ee5]">◆</a>
            <a href="#website" aria-label="Website" className="hover:text-[#286ee5]">◎</a>
          </div>
          <p className="mt-5 max-w-[220px] text-[11px] leading-4 text-[#52708b]">Ensuring seamless academic scheduling and management for all departments.</p>
        </div>
      </div>
    </div>
    <div className="border-t border-[#91bfdc]">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-3 px-8 py-5 text-[10px] text-[#52708b] sm:flex-row sm:items-center sm:justify-between sm:px-12">
        <span>© 2026 Student Assistance Absence Tracker. All rights reserved.</span>
        <span className="flex gap-5"><a href="#accessibility" className="hover:text-[#286ee5]" data-testid="link-footer-accessibility">Accessibility</a><a href="#support" className="hover:text-[#286ee5]">Contact Support</a></span>
      </div>
    </div>
  </footer>);
}
function FooterGroup({ title, links }) {
  return <div><p className="text-[13px] font-bold text-[#152d49]">{title}</p><div className="mt-5 flex flex-col gap-3">{links.map((link) => <a key={link} href={`#${link.toLowerCase().replaceAll(' ', '-')}`} className="text-[11px] text-[#52708b] transition-colors hover:text-[#286ee5]" data-testid={`link-footer-${link.toLowerCase().replaceAll(' ', '-')}`}>{link}</a>)}</div></div>;
}
function Home() {
  const { darkMode } = useTheme();
  return (<div className={`homepage-shell min-h-[100dvh] ${darkMode ? 'homepage-dark' : 'homepage-light'}`}>
    <Header />
    <main className="homepage-main">
      <section className="mx-auto grid max-w-[1180px] items-center gap-12 px-8 pb-24 pt-20 sm:px-12 lg:grid-cols-[.95fr_1.05fr] lg:gap-20 lg:pb-32 lg:pt-24">
        <div className="animate-rise">
          <p className="homepage-eyebrow mb-5 inline-flex rounded-full bg-[#b7d7eb] px-3 py-1 text-[8px] font-semibold text-[#286ee5]">University Portal</p>
          <h1 className="serif max-w-[570px] text-[47px] leading-[.91] tracking-[-.045em] text-[#10253f] sm:text-[62px]">Student<br />Assistant <span className="text-[#286ee5]">Absence &amp; Leave</span><br />Tracking system</h1>
          <p className="mt-6 max-w-[430px] text-[11px] leading-5 text-[#52708b]">A centralized platform for managing attendance, absences, and leave requests, making work easier for everyone.</p>
          <div className="mt-8 flex gap-4">
            <Link href="/login" className="homepage-primary-button focus-ring rounded-[2px] bg-[#286ee5] px-8 py-3 text-[10px] font-bold text-white shadow-[0_3px_5px_rgba(31,88,183,.3)] transition-transform hover:-translate-y-0.5" data-testid="link-hero-signin">Login <ArrowRight className="ml-1 inline" size={11} /></Link>
            <Link href="/signup" className="homepage-secondary-button focus-ring rounded-[2px] border border-[#dce4ea] bg-white px-8 py-3 text-[10px] font-bold text-[#6a7180] transition-colors hover:border-[#286ee5] hover:text-[#286ee5]" data-testid="link-hero-signup">Sign Up</Link>
          </div>
        </div>
        <div className="animate-rise-delay-1 mx-auto w-full max-w-[510px]">
          <div className="overflow-hidden rounded-md border-[10px] border-white bg-white shadow-[0_10px_25px_rgba(48,83,111,.1)]">
            <img src="/assets/tut-library.jpg" alt="TUT student assistants collaborating in a library" className="block aspect-[1.42] h-full w-full object-cover" data-testid="img-hero-campus" />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto grid max-w-[1180px] items-center gap-12 px-8 py-20 sm:px-12 lg:grid-cols-[1fr_1fr] lg:gap-20 lg:py-24">
        <div className="order-2 lg:order-1">
          <div className="mx-auto max-w-[475px] overflow-hidden rounded-lg border-[10px] border-[#d8e9f5] bg-[#eef5f9]">
            <img src="/assets/home-dashboard-hd.png" alt="Student staff hub showing an approved leave calendar" className="block w-full" data-testid="img-dashboard" />
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <p className="text-[9px] font-bold uppercase tracking-[.15em] text-[#286ee5]">Real-time management</p>
          <h2 className="serif mt-4 max-w-[440px] text-[31px] leading-[1.04] tracking-[-.03em] text-[#10253f] sm:text-[38px]">Effortless Absence &amp; Leave Monitoring</h2>
          <p className="mt-5 max-w-[440px] text-[11px] leading-5 text-[#52708b]">Ditch the spreadsheets. Our digital dashboard allows supervisors to view check-ins, verify absences, and manage leave requests in a single, high-contrast interface designed for quick scanning.</p>
          <ul className="mt-6 space-y-3 text-[10px] text-[#385570]">
            <Bullet>Visual calendar for department-wide scheduling</Bullet>
            <Bullet>One-click verification for medical leaves</Bullet>
            <Bullet>Historical logs for payroll reconciliation</Bullet>
            <Bullet>Customized leave categories (Sick, Personal, Research)</Bullet>
          </ul>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1180px] items-center gap-12 px-8 py-20 sm:px-12 lg:grid-cols-[1.1fr_.9fr] lg:gap-20 lg:py-24">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[.15em] text-[#f2aa00]">Stay informed</p>
          <h2 className="serif mt-4 max-w-[520px] text-[31px] leading-[1.04] tracking-[-.03em] text-[#10253f] sm:text-[38px]">Automated Notifications &amp; Alerts</h2>
          <p className="mt-5 max-w-[470px] text-[11px] leading-5 text-[#52708b]">Ensure no request goes unnoticed. StudentAssist proactively notifies relevant staff via email and app alerts whenever a student assistant logs an absence or submits a time-off request.</p>
          <div className="mt-7 grid max-w-[470px] gap-3 sm:grid-cols-2">
            <InfoCard icon={<Clock3 size={16} />} title="Instant Alerts" text="Receive real-time push notifications for last-minute scheduling changes." />
            <InfoCard icon={<ShieldCheck size={16} />} title="Status Updates" text="Students are automatically notified when their leave status changes." />
          </div>
        </div>
        <div className="mx-auto w-full max-w-[390px] overflow-hidden">
          <img src="/assets/home-phone-hd.png" alt="Mobile leave request update notification" className="block w-full" data-testid="img-phone" />
        </div>
      </section>

      <section id="supervisors" className="mx-auto max-w-[1180px] px-8 pb-20 pt-16 text-center sm:px-12 lg:pb-24 lg:pt-20">
        <h2 className="serif text-[31px] leading-none tracking-[-.03em] text-[#10253f] sm:text-[38px]">Built for Every Role</h2>
        <p className="mx-auto mt-4 max-w-[510px] text-[11px] leading-5 text-[#52708b]">Whether you're a department head or a student worker, Student Assistant Tracker simplifies your workflow.</p>
        <div className="mx-auto mt-10 grid max-w-[940px] gap-5 md:grid-cols-3">
          <RoleCard icon={<UsersRound size={22} />} iconClass="bg-[#dce5fb] text-[#286ee5]" title="Administrators" text="Oversee department-wide attendance, generate payroll reports, and manage staffing levels with comprehensive analytics." />
          <RoleCard icon={<ClipboardCheck size={22} />} iconClass="bg-[#fff0d8] text-[#f2aa00]" title="Supervisors" text="Approve or deny leave requests in seconds, view daily team schedules, and communicate directly with your student staff." />
          <RoleCard icon={<CheckCircle2 size={22} />} iconClass="bg-[#d4f5e7] text-[#22b78b]" title="Student Assistant" text="Easily log absences, track remaining leave balance, and receive instant status updates on pending requests via mobile." />
        </div>
        <a href="mailto:sales@studentassist.edu" className="focus-ring mt-10 inline-block rounded-[4px] border border-white/70 px-7 py-3 text-[10px] font-bold text-white transition-colors hover:bg-white/15">Contact Sales</a>
      </section>
    </main>
    <Footer />
  </div>);
}
function Step({ number, icon, title, text }) {
  return <div className="relative rounded-xl border border-[#d7e3ee] bg-white p-5 transition-transform hover:-translate-y-1 hover:shadow-[0_12px_26px_rgba(43,81,119,.1)]"><div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-lg bg-[#e7f2fa] text-[#1f70d0]">{icon}</span><span className="mono text-[10px] font-bold text-[#9bb0c1]">{number}</span></div><h3 className="mt-5 font-bold text-[#203e5c]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#6b8297]">{text}</p></div>;
}
function MiniStat({ label, value, color }) {
  return <div className={`rounded-lg p-3 ${color === 'green' ? 'bg-[#eaf8f0]' : 'bg-[#e9f3fb]'}`}><p className="text-[10px] font-bold uppercase tracking-[.08em] text-[#7890a4]">{label}</p><p className={`mt-1 text-sm font-bold ${color === 'green' ? 'text-[#19885d]' : 'text-[#1f70d0]'}`}>{value}</p></div>;
}
function Bullet({ children }) {
  return <li className="flex items-start gap-3"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#d7edfb] text-[#1f70d0]"><Check size={12} strokeWidth={3} /></span><span>{children}</span></li>;
}
function Feature({ icon, title }) {
  return <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-[#e8f3fb] text-[#1f70d0]">{icon}</span><span className="text-sm font-bold text-[#385570]">{title}</span></div>;
}
function InfoCard({ icon, title, text }) {
  return <div className="homepage-info-card rounded-md bg-[#eaf3f9] p-4 text-left"><span className="grid size-7 place-items-center rounded-full bg-white text-[#286ee5]">{icon}</span><h3 className="mt-3 text-[10px] font-bold text-[#243e5b]">{title}</h3><p className="mt-1 text-[9px] leading-4 text-[#60768c]">{text}</p></div>;
}
function RoleCard({ icon, iconClass, title, text }) {
  return <article className="homepage-role-card rounded-md bg-[#f4f8fb] px-6 py-6 shadow-[0_3px_8px_rgba(53,91,121,.08)]"><span className={`mx-auto grid size-11 place-items-center rounded-full ${iconClass}`}>{icon}</span><h3 className="mt-5 text-[14px] font-bold text-[#172d48]">{title}</h3><p className="mt-3 min-h-[58px] text-[10px] leading-4 text-[#60768c]">{text}</p><a href="#learn-more" className="mt-5 inline-flex items-center gap-2 text-[10px] font-bold text-[#286ee5]">Learn More <ChevronRight size={13} /></a></article>;
}
function AuthHeader() {
  return <header className="border-b border-[#d7e3ee] bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-10"><Brand /><div className="flex items-center gap-3 text-sm text-[#71869a]"><ModeToggle size="compact" /><span className="hidden sm:inline">New to StudentAssist?</span><Link href="/signup" className="focus-ring font-bold text-[#1f70d0] hover:text-[#1555aa]" data-testid="link-auth-signup">Create account <ArrowRight className="ml-1 inline" size={14} /></Link></div></div></header>;
}
function AuthFooter() {
  return <div className="mt-auto border-t border-[#d7e3ee] bg-white/70 px-5 py-5 text-center text-xs text-[#71869a]"><span>Need help? </span><a href="mailto:support@studentassist.edu" className="font-bold text-[#1f70d0]" data-testid="link-auth-support">Contact StudentAssist support</a><span className="mx-2 text-[#bdccd8]">·</span><Link href="/" className="hover:text-[#1f70d0]" data-testid="link-auth-home">Return home</Link></div>;
}
function AuthShell({ children, eyebrow, title, copy }) {
  return <div className="flex min-h-[100dvh] flex-col bg-[#eef6fb]"><AuthHeader /><main className="relative flex flex-1 items-center overflow-hidden px-5 py-12 sm:py-16"><div className="absolute -left-28 top-12 size-72 rounded-full bg-[#dbeefa] blur-3xl" /><div className="absolute -right-24 bottom-0 size-72 rounded-full bg-[#f6df8c]/30 blur-3xl" /><div className="relative mx-auto grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[.88fr_1.12fr]">{<div className="hidden lg:block"><span className="mono inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.16em] text-[#1f70d0]"><span className="size-2 rounded-full bg-[#f5ce58]" /> {eyebrow}</span><h1 className="serif mt-5 text-5xl leading-[1.02] tracking-[-.035em] text-[#162c4d]">{title}</h1><p className="mt-5 max-w-sm leading-7 text-[#60768c]">{copy}</p><div className="mt-10 flex items-center gap-3 text-xs text-[#6c8196]"><ShieldCheck size={17} className="text-[#1f70d0]" /> Your information is protected by institutional security.</div></div>}<div className="animate-rise">{children}</div></div></main><AuthFooter /></div>;
}
function Field({ label, id, type = 'text', placeholder, value, onChange, error, required = true, icon }) {
  return <label className="block" htmlFor={id}><span className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#385570]">{icon}{label}{required && <em className="not-italic text-[#d05b48]">*</em>}</span><span className="relative block">{icon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8aa0b2]">{icon}</span>}<input id={id} type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={`focus-ring w-full rounded-lg border bg-[#fbfdfe] px-3.5 py-3 text-sm text-[#243e5b] outline-none transition-colors placeholder:text-[#9baebe] ${icon ? 'pl-10' : ''} ${error ? 'border-[#d05b48]' : 'border-[#cfdee9] focus:border-[#1f70d0]'}`} data-testid={`input-${id}`} /> </span>{error && <span className="mt-1.5 block text-xs font-medium text-[#c54f43]" data-testid={`error-${id}`}>{error}</span>}</label>;
}
function PasswordField({ label, id, value, onChange, error }) {
  const [show, setShow] = useState(false);
  return <label className="block" htmlFor={id}><span className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#385570]"><LockKeyhole size={14} className="text-[#8aa0b2]" />{label}<em className="not-italic text-[#d05b48]">*</em></span><span className="relative block"><input id={id} type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} className={`focus-ring w-full rounded-lg border bg-[#fbfdfe] px-3.5 py-3 pr-11 text-sm text-[#243e5b] outline-none transition-colors placeholder:text-[#9baebe] ${error ? 'border-[#d05b48]' : 'border-[#cfdee9] focus:border-[#1f70d0]'}`} placeholder="Enter your password" data-testid={`input-${id}`} /><button type="button" onClick={() => setShow(!show)} className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 text-[#7890a4] hover:text-[#1f70d0]" aria-label={show ? 'Hide password' : 'Show password'} data-testid={`button-toggle-${id}`}>{show ? <EyeOff size={17} /> : <Eye size={17} />}</button></span>{error && <span className="mt-1.5 block text-xs font-medium text-[#c54f43]" data-testid={`error-${id}`}>{error}</span>}</label>;
}
function LoginPage() {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({});
   const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [location, setLocation] = useLocation();
  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!email.includes('@')) next.email = 'Enter your university email address.';
    if (password.length < 6) next.password = 'Password must be at least 6 characters.';
    setErrors(next);
    setServerError('');
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await response.json();
      if (!response.ok) {
        setServerError(data.error || 'Login failed. Please try again.');
        return;
      }
      localStorage.setItem('session', JSON.stringify({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        user: data.user,
      }));
      if (role === 'student') {
        setLocation('/dashboard');
      } else {
        setLocation('/supervisor');
      }
    } catch (err) {
      console.error('Login error:', err);
      setServerError('Could not reach the server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };
  if (success)
    return <div className="flex min-h-[100dvh] flex-col bg-[#eef6fb]"><AuthHeader />
    <main className="flex flex-1 items-center justify-center px-5 py-14">
    <div className="w-full max-w-md animate-rise rounded-2xl border border-[#d0e0ea] bg-white p-8 text-center shadow-[0_18px_45px_rgba(43,81,119,.12)] sm:p-10"><span className="mx-auto grid size-16 place-items-center rounded-full bg-[#e3f7ec] text-[#19885d]"><CheckCircle2 size={30} /></span><h1 className="serif mt-6 text-4xl text-[#162c4d]">You’re signed in.</h1><p className="mt-3 leading-7 text-[#60768c]">Your {role === 'student' ? 'student assistant' : 'supervisor'} portal is ready. This demo keeps the welcome flow local while your institution connects its account system.</p><button type="button" onClick={() => setLocation('/')} className="focus-ring mt-7 w-full rounded-lg bg-[#1f70d0] px-5 py-3.5 text-sm font-bold text-white shadow-[0_4px_0_#1555aa] hover:bg-[#256fc6] active:translate-y-0.5 active:shadow-none" data-testid="button-success-home">Return to home</button></div></main><AuthFooter /></div>;
  return <AuthShell eyebrow="Secure portal" title={role === 'student' ? 'Welcome back, student.' : 'Welcome back, supervisor.'} copy="Sign in to keep attendance records moving, requests clear, and your next step close at hand."><div className="rounded-2xl border border-[#d0e0ea] bg-white p-6 shadow-[0_18px_45px_rgba(43,81,119,.12)] sm:p-9"><div className="mb-7"><p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#1f70d0]">Portal access</p><h2 className="serif mt-2 text-3xl tracking-[-.025em] text-[#162c4d]">Sign in to StudentAssist</h2><p className="mt-2 text-sm text-[#71869a]">Choose your account type to continue.</p></div><div className="mb-7 grid grid-cols-2 rounded-lg bg-[#edf4f8] p-1"><RoleTab active={role === 'student'} onClick={() => { setRole('student'); setErrors({}); }} icon={<GraduationCap size={16} />} label="Student assistant" testId="button-role-student" /><RoleTab active={role === 'supervisor'} onClick={() => { setRole('supervisor'); setErrors({}); }} icon={<UsersRound size={16} />} label="Supervisor" testId="button-role-supervisor" /></div><form onSubmit={submit} className="space-y-5" noValidate><Field label={role === 'student' ? 'University email' : 'Work email'} id="login-email" type="email" placeholder={role === 'student' ? 'studentnumber@tut4life.ac.za' : 'surnameinitials@tut4life.ac.za'} value={email} onChange={setEmail} error={errors.email} icon={<Mail size={15} />} /><PasswordField label="Password" id="login-password" value={password} onChange={setPassword} error={errors.password} /><div className="flex items-center justify-between gap-3 text-xs"><label className="flex cursor-pointer items-center gap-2 text-[#71869a]"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-4 accent-[#1f70d0]" data-testid="input-remember" /> Keep me signed in</label><button type="button" onClick={() => window.alert('Password reset instructions will be sent to your institutional email.')} className="font-bold text-[#1f70d0] hover:text-[#1555aa]" data-testid="button-forgot-password">Forgot password?</button></div>{serverError && <p className="rounded-lg bg-[#fbe4e1] px-3 py-2 text-xs font-semibold text-[#d05b48]" data-testid="error-server">{serverError}</p>}<button type="submit" disabled={loading} className="focus-ring group w-full rounded-lg bg-[#1f70d0] px-5 py-3.5 text-sm font-bold text-white shadow-[0_4px_0_#1555aa] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-none disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0" data-testid="button-submit-login">{loading ? 'Signing in...' : `Sign in as ${role === 'student' ? 'student' : 'supervisor'}`}{!loading && <ArrowRight className="ml-2 inline transition-transform group-hover:translate-x-1" size={16} />}</button></form><div className="mt-7 border-t border-[#e4edf3] pt-5 text-center text-xs text-[#71869a]">Don’t have an account? <Link href="/signup" className="font-bold text-[#1f70d0]" data-testid="link-login-signup">Register here</Link></div></div></AuthShell>;
}
function RoleTab({ active, onClick, icon, label, testId }) {
  return <button type="button" onClick={onClick} className={`focus-ring flex items-center justify-center gap-2 rounded-md px-2 py-2.5 text-xs font-bold transition-all ${active ? 'bg-white text-[#1f70d0] shadow-sm' : 'text-[#71869a] hover:text-[#385570]'}`} data-testid={testId}>{icon}{label}</button>;
}
function SignupPage() {
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ first: '', last: '', email: '', studentNumber: '', course: '', year: '', cellNumber: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const update = (key) => (value) => setForm((old) => ({ ...old, [key]: value }));
   const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.first.trim()) next.first = 'First name is required.';
    if (!form.last.trim()) next.last = 'Last name is required.';
    if (!form.email.includes('@')) next.email = 'Use a valid institutional email.';
    if (role === 'student' && !form.studentNumber.trim()) next.studentNumber = 'Student number is required.';
    if (role === 'student' && !form.course.trim()) next.course = 'Course is required.';
    if (role === 'student' && !form.year) next.year = 'Choose your current year.';
    if (!form.cellNumber.trim()) next.cellNumber = 'Cell number is required.';
    if (form.password.length < 8) next.password = 'Use at least 8 characters.';
    if (form.password !== form.confirm) next.confirm = 'Passwords do not match.';
    setErrors(next);
    setServerError('');
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.first,
          last_name: form.last,
          student_email: form.email,
          student_number: form.studentNumber,
          course: form.course,
          level_of_study: form.year,
          cell_number: form.cellNumber,
          password: form.password,
          role: role,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setServerError(data.error || 'Registration failed. Please try again.');
        return;
      }
      setSuccess(true);
    } catch (err) {
      console.error('Registration error:', err);
      setServerError('Could not reach the server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  if (success)
    return <div className="flex min-h-[100dvh] flex-col bg-[#eef6fb]"><AuthHeader /><main className="flex flex-1 items-center justify-center px-5 py-14"><div className="w-full max-w-md animate-rise rounded-2xl border border-[#d0e0ea] bg-white p-8 text-center shadow-[0_18px_45px_rgba(43,81,119,.12)] sm:p-10"><span className="mx-auto grid size-16 place-items-center rounded-full bg-[#e3f7ec] text-[#19885d]"><CheckCircle2 size={30} /></span><h1 className="serif mt-6 text-4xl text-[#162c4d]">Account request received.</h1><p className="mt-3 leading-7 text-[#60768c]">We’ve prepared your {role === 'student' ? 'student assistant' : 'supervisor'} profile. Check your institutional inbox to verify your email and finish setting up.</p><Link href="/login" className="focus-ring mt-7 block w-full rounded-lg bg-[#1f70d0] px-5 py-3.5 text-sm font-bold text-white shadow-[0_4px_0_#1555aa] hover:bg-[#256fc6]" data-testid="link-success-login">Continue to sign in</Link></div></main><AuthFooter /></div>;
  return <AuthShell eyebrow="Join the portal" title="A better way to keep your records in order." copy="Create one account for the attendance details that matter — with the right tools for your role and the people you work with."><div className="rounded-2xl border border-[#d0e0ea] bg-white p-6 shadow-[0_18px_45px_rgba(43,81,119,.12)] sm:p-9"><div className="mb-6"><p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#1f70d0]">Account registration</p><h2 className="serif mt-2 text-3xl tracking-[-.025em] text-[#162c4d]">Create your account</h2></div><div className="mb-7 grid grid-cols-2 rounded-lg bg-[#edf4f8] p-1"><RoleTab active={role === 'student'} onClick={() => { setRole('student'); setErrors({}); }} icon={<GraduationCap size={16} />} label="Student assistant" testId="button-signup-student" /><RoleTab active={role === 'supervisor'} onClick={() => { setRole('supervisor'); setErrors({}); }} icon={<UsersRound size={16} />} label="Supervisor" testId="button-signup-supervisor" /></div><form onSubmit={submit} className="space-y-5" noValidate><div className="grid gap-5 sm:grid-cols-2"><Field label="First name" id="signup-first" placeholder="e.g. Sarah" value={form.first} onChange={update('first')} error={errors.first} /><Field label="Last name" id="signup-last" placeholder="e.g. Nkosi" value={form.last} onChange={update('last')} error={errors.last} /></div><Field label={role === 'student' ? 'University email' : 'Work email'} id="signup-email" type="email" placeholder="studentnumber@tut4life.ac.za" value={form.email} onChange={update('email')} error={errors.email} icon={<Mail size={15} />} />{role === 'student' ? <><Field label="Student number" id="signup-student-number" placeholder="e.g. 20240123" value={form.studentNumber} onChange={update('studentNumber')} error={errors.studentNumber} icon={<BadgeCheck size={15} />} /><div className="grid gap-5 sm:grid-cols-2"><Field label="Course or department" id="signup-course" placeholder="e.g. Information Technology" value={form.course} onChange={update('course')} error={errors.course} icon={<BookOpen size={15} />} /><label className="block" htmlFor="signup-year"><span className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#385570]"><CalendarDays size={14} className="text-[#8aa0b2]" />Current year<em className="not-italic text-[#d05b48]">*</em></span><span className="relative block"><select id="signup-year" value={form.year} onChange={(e) => update('year')(e.target.value)} className={`focus-ring w-full appearance-none rounded-lg border bg-[#fbfdfe] px-3.5 py-3 text-sm text-[#243e5b] outline-none ${errors.year ? 'border-[#d05b48]' : 'border-[#cfdee9] focus:border-[#1f70d0]'}`} data-testid="input-signup-year"><option value="">Select year</option><option value="first">First year</option><option value="second">Second year</option><option value="third">Third year</option><option value="postgraduate">Postgraduate</option></select><ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7890a4]" /></span>{errors.year && <span className="mt-1.5 block text-xs font-medium text-[#c54f43]" data-testid="error-signup-year">{errors.year}</span>}</label></div></> : <Field label="Department or faculty" id="signup-course" placeholder="e.g. Faculty of Information and Communication Technology" value={form.course} onChange={update('course')} error={errors.course} icon={<PanelTop size={15} />} />}<Field label="Cell number" id="signup-cell-number" type="tel" placeholder="e.g. 076 123 4567" value={form.cellNumber} onChange={update('cellNumber')} error={errors.cellNumber} icon={<Phone size={15} />} /><div className="grid gap-5 sm:grid-cols-2"><PasswordField label="Password" id="signup-password" value={form.password} onChange={update('password')} error={errors.password} /><PasswordField label="Confirm password" id="signup-confirm" value={form.confirm} onChange={update('confirm')} error={errors.confirm} /></div><label className="flex items-start gap-2 text-xs leading-5 text-[#71869a]"><input type="checkbox" required className="mt-1 size-4 shrink-0 accent-[#1f70d0]" data-testid="input-terms" />I agree to the StudentAssist <a href="#terms" className="font-bold text-[#1f70d0]">terms and privacy policy</a>.</label>{serverError && <p className="rounded-lg bg-[#fbe4e1] px-3 py-2 text-xs font-semibold text-[#d05b48]" data-testid="error-server">{serverError}</p>}<button type="submit" disabled={loading} className="focus-ring group w-full rounded-lg bg-[#1f70d0] px-5 py-3.5 text-sm font-bold text-white shadow-[0_4px_0_#1555aa] transition-all hover:-translate-y-0.5 hover:bg-[#256fc6] active:translate-y-0 active:shadow-none disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0" data-testid="button-submit-signup">{loading ? 'Creating account...' : `Create ${role === 'student' ? 'student' : 'supervisor'} account`}{!loading && <ArrowRight className="ml-2 inline transition-transform group-hover:translate-x-1" size={16} />}</button></form><div className="mt-6 border-t border-[#e4edf3] pt-5 text-center text-xs text-[#71869a]">Already have an account? <Link href="/login" className="font-bold text-[#1f70d0]" data-testid="link-signup-login">Sign in</Link></div></div></AuthShell>;
}
function LogoutSuccessPage() {
  return <div className="flex min-h-[100dvh] flex-col bg-[#eef6fb]">
    <header className="border-b border-[#d7e3ee] bg-white px-5 py-4 lg:px-10"><Brand /></header>
    <main className="grid flex-1 place-items-center px-5 py-14">
      <div className="w-full max-w-xl rounded-2xl border border-[#d0e0ea] bg-white p-8 text-center shadow-[0_18px_45px_rgba(43,81,119,.12)] sm:p-12">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#e3f7ec] text-[#19885d]"><CheckCircle2 size={32}/></span>
        <p className="mt-6 text-sm font-bold uppercase tracking-[.14em] text-[#c8102e]">TSHWANE UNIVERSITY OF TECHNOLOGY</p>
        <h1 className="serif mt-3 text-4xl text-[#162c4d]">You have been logged out.</h1>
        <p className="mt-4 text-base leading-7 text-black">Your StudentAssist session has ended. Please sign in again to access the portal.</p>
        <Link href="/login" className="focus-ring mt-8 inline-flex rounded-lg bg-[#1f70d0] px-7 py-3.5 text-base font-bold text-white shadow-[0_4px_0_#1555aa]">Sign in again</Link>
      </div>
    </main>
  </div>;
}

function NotFound() {
  return <div className="flex min-h-[100dvh] flex-col bg-[#eef6fb]"><header className="flex items-center justify-between border-b border-[#d7e3ee] bg-white px-5 py-4 lg:px-10"><Brand /><ModeToggle size="compact" /></header><div className="grid flex-1 place-items-center px-5 text-center"><div><p className="mono text-xs font-bold uppercase tracking-[.15em] text-[#1f70d0]">404 · Page not found</p><h1 className="serif mt-4 text-5xl text-[#162c4d]">That page took a day off.</h1><p className="mx-auto mt-4 max-w-md text-[#60768c]">The page you’re looking for isn’t part of this semester’s schedule.</p><Link href="/" className="focus-ring mt-7 inline-flex items-center gap-2 rounded-lg bg-[#1f70d0] px-5 py-3 text-sm font-bold text-white" data-testid="link-404-home">Back to StudentAssist <ArrowRight size={16} /></Link></div></div></div>;
}

function Sidebar() {
  const [location] = useLocation();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, href: '/dashboard' },
    { key: 'request', label: 'Request', icon: <Plus size={18} />, href: '/dashboard/request' },
    { key: 'history', label: 'History', icon: <Clock3 size={18} />, href: '/dashboard/history' },
    { key: 'schedule', label: 'Schedule', icon: <CalendarDays size={18} />, href: '/dashboard/schedule' },
    { key: 'profile', label: 'Profile', icon: <User size={18} />, href: '/profile' },
  ];
  const isActive = (item) => {
    if (item.key === 'request') return location.startsWith('/dashboard/request') || location.startsWith('/dashboard/shift-swap');
    return location === item.href;
  };
  return (
    <aside className="flex h-[100dvh] w-64 shrink-0 flex-col justify-between border-r border-[#e2eaf1] bg-white px-4 py-6">
      <div>
        <Link href="/" className="focus-ring mb-8 flex items-center gap-2 px-2" data-testid="link-sidebar-brand">
          <img src="/tut-logo.png" alt="TUT logo" className="size-9 rounded-lg object-contain" />
          <span className="text-[15px] font-bold text-[#162c4d]">Student Portal</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`focus-ring flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                isActive(item) ? 'bg-[#e7f1fa] text-[#1f70d0]' : 'text-[#52708b] hover:bg-[#f4f8fb] hover:text-[#286ee5]'
              }`}
              data-testid={`link-sidebar-${item.key}`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex flex-col gap-2">
        <button type="button" className="focus-ring flex items-center gap-3 rounded-lg bg-[#eef4fb] px-3 py-2.5 text-sm font-semibold text-[#52708b] hover:bg-[#e5eef8]" data-testid="button-notification">
          <Bell size={18} />
          Notification
        </button>
        <button
        type="button"
        onClick={() => setShowLogoutConfirm(true)}
        className="focus-ring flex items-center gap-3 rounded-lg bg-[#1f70d0] px-3 py-2.5 text-sm font-bold text-white hover:bg-[#256fc6]"
        data-testid="button-logout"
      >
        <LogOut size={18} />
        Logout
      </button>
      </div>
            {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-[0_18px_45px_rgba(43,81,119,.25)]">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#fbe4e1] text-[#d05b48]">
              <LogOut size={22} />
            </div>
            <h3 className="serif mt-4 text-center text-2xl text-[#162c4d]">Log out?</h3>
            <p className="mt-2 text-center text-sm text-[#60768c]">
              You'll need to sign in again to access your dashboard.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="focus-ring flex-1 rounded-lg border border-[#cfdee9] bg-white px-4 py-2.5 text-sm font-bold text-[#385570] hover:bg-[#f4f8fb]"
                data-testid="button-cancel-logout"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('session');
                  window.location.href = '/logout-success';
                }}
                className="focus-ring flex-1 rounded-lg bg-[#1f70d0] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#256fc6]"
                data-testid="button-confirm-logout"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

function PortalTopBar() {
  const stored = localStorage.getItem('session');
  const session = stored ? JSON.parse(stored) : null;
  const user = session?.user || {};
  const firstName = user.first_name || 'User';
  const lastName = user.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'U';
  const email = user.email || '';
  return (
    <header className="flex h-[70px] items-center justify-between border-b border-[#e2eaf1] bg-white px-8">
      <ModeToggle />
      <div className="flex items-center gap-3">
        <span className="text-right leading-tight">
          <strong className="block text-sm font-bold text-[#162c4d]">{fullName}</strong>
          <span className="block text-xs text-[#7890a4]">{email}</span>
        </span>
        <span className="grid size-9 place-items-center rounded-full bg-[#1f70d0] text-sm font-bold text-white">{initials}</span>
      </div>
    </header>
  );
}

function DashboardPage() {
  const { requests } = useRequests();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      const raw = localStorage.getItem('session');
      if (!raw) {
        window.location.href = '/login';
        return false;
      }
      try {
        const s = JSON.parse(raw);
        const isExpired = s.expires_at && (s.expires_at * 1000 < Date.now());
        if (isExpired) {
          localStorage.removeItem('session');
          window.location.href = '/login';
          return false;
        }
      } catch {
        localStorage.removeItem('session');
        window.location.href = '/login';
        return false;
      }
      return true;
    };

    checkAuth();

    const onPageShow = (e) => {
      if (e.persisted) checkAuth();
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  const stored = localStorage.getItem('session');
  if (!stored) return null;
  const session = JSON.parse(stored);
  const user = session?.user || {};
  const firstName = user.first_name || 'User';
  const lastName = user.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const email = user.email || 'Not available';
  const course = user.course || '—';
  const cellNumber = user.cell_number || '—';
  const role = user.role === 'supervisor' ? 'Supervisor' : 'Student Assistant';

  return (
    <div className="flex min-h-[100dvh] bg-[#90bddb]">
      <Sidebar />
      <div className="flex-1">
        <PortalTopBar />
        <main className="px-8 py-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-3 inline-flex rounded-full bg-[#162c4d] px-3 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-white">Student Portal</p>
              <h1 className="serif text-4xl text-[#10253f]">Welcome back, {fullName}</h1>
              <p className="mt-2 max-w-lg text-sm text-[#52708b]">Manage your leave requests and track your departmental attendance.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard/history" className="focus-ring flex items-center gap-2 rounded-lg border border-[#d0e0ea] bg-white px-4 py-2.5 text-sm font-semibold text-[#385570]" data-testid="button-view-history">
                <Clock3 size={16} />
                View History
              </Link>
              <Link href="/dashboard/request" className="focus-ring flex items-center gap-2 rounded-lg bg-[#1f70d0] px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_#1555aa]" data-testid="link-new-request">
                <Plus size={16} />
                New Request
              </Link>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_.6fr]">
            <div className="rounded-xl bg-[#f4f8fb] p-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <DashboardStat icon={<Building2 size={14} />} label="Department" value={course} />
                <DashboardStat icon={<TrendingUp size={14} />} label="Position" value={role} />
                <DashboardStat icon={<Mail size={14} />} label="Email Address" value={email} />
                <DashboardStat icon={<Phone size={14} />} label="Phone" value={cellNumber} />
              </div>
            </div>
            <div className="rounded-xl bg-[#f4f8fb] p-6">
              <p className="flex items-center gap-2 text-base font-bold text-[#10253f]"><TrendingUp size={16} className="text-[#f2aa00]" /> Performance</p>
              <p className="mt-1 text-xs text-[#7890a4]">Semester attendance & compliance</p>
              <div className="mt-6">
                <div className="flex items-center justify-between text-xs font-semibold text-[#52708b]">
                  <span>Attendance Rate</span>
                  <span className="text-lg font-bold text-[#1f70d0]">94%</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-[#dce8f2]">
                  <div className="h-2 rounded-full bg-[#1f70d0]" style={{ width: '94%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-[#f4f8fb] p-6">
            <h2 className="text-lg font-bold text-[#10253f]">Recent Leave Requests</h2>
            <table className="mt-5 w-full text-left text-sm">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-[.08em] text-[#8ca0b2]">
                  <th className="pb-3 font-bold">ID</th>
                  <th className="pb-3 font-bold">Type</th>
                  <th className="pb-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-t border-[#e2eaf1]">
                    <td className="py-3 font-semibold text-[#243e5b]">{req.id}</td>
                    <td className="py-3 text-[#52708b]">{req.type}</td>
                    <td className="py-3"><StatusBadge status={req.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
function DashboardStat({ icon, label, value }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.08em] text-[#8ca0b2]">{icon}{label}</p>
      <p className="mt-1.5 text-sm font-bold text-[#243e5b]">{value}</p>
    </div>
  );
}
function StatusBadge({ status }) {
  const styles = {
    Approved: 'bg-[#e3f7ec] text-[#19885d]',
    Pending: 'bg-[#fff0d8] text-[#f2aa00]',
    Rejected: 'bg-[#fbe4e1] text-[#d05b48]',
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] ?? 'bg-[#eef4fb] text-[#52708b]'}`}>{status}</span>;
}

const ABSENCE_CATEGORIES = [
  { key: 'day-off', label: 'Day-off Request', text: 'Standard scheduled time away' },
  { key: 'sick', label: 'Sick Leave', text: 'Medical or health related absence' },
  { key: 'exam', label: 'Exam Leave', text: 'Absence for scheduled examinations' },
  { key: 'personal', label: 'Personal Issues', text: 'Urgent family or personal matters' },
];

function RequestPage() {
  const [, setLocation] = useLocation();
  const { addRequest } = useRequests();
  const [category, setCategory] = useState('sick');
  const [dateRange, setDateRange] = useState('');
  const [comments, setComments] = useState('');
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState({});

  const handleFiles = (fileList) => {
    const picked = fileList?.[0];
    if (picked) setFile(picked);
  };

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (!category) next.category = 'Choose an absence category.';
    if (!dateRange.trim()) next.dateRange = 'Enter a date range.';
    setErrors(next);
    if (Object.keys(next).length) return;
    const selected = ABSENCE_CATEGORIES.find((c) => c.key === category);
    addRequest({ type: selected?.label ?? 'Leave Request' });
    setLocation('/dashboard');
  };

  return (
    <div className="flex min-h-[100dvh] bg-[#90bddb]">
      <Sidebar />
      <div className="flex-1">
        <PortalTopBar />
        <main className="px-8 py-8">
          <p className="mb-3 inline-flex rounded-full bg-[#162c4d] px-3 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-white">Student Portal</p>
          <h1 className="serif text-4xl text-[#10253f]">Submit a Request</h1>
          <p className="mt-2 max-w-xl text-sm text-[#52708b]">Please provide the details for your absence or scheduling change. Requests are typically reviewed by the department head within 24–48 hours.</p>

          <form onSubmit={submit} className="mt-6 rounded-xl bg-white p-6 shadow-[0_3px_8px_rgba(53,91,121,.08)]" noValidate>
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e2eaf1] pb-5">
              <div>
                <h2 className="text-lg font-bold text-[#10253f]">Request Details</h2>
                <p className="mt-1 text-sm text-[#52708b]">Select the type of request you wish to submit.</p>
              </div>
              <div className="flex rounded-lg bg-[#edf4f8] p-1">
                <span className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-bold text-[#1f70d0] shadow-sm" data-testid="tab-leave-request">
                  <FileText size={15} /> Leave Request
                </span>
                <Link href="/dashboard/shift-swap" className="focus-ring flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-[#71869a] hover:text-[#385570]" data-testid="link-shift-swapping">
                  <RefreshCw size={15} /> Shift Swapping
                </Link>
              </div>
            </div>

            <div className="mt-6 grid gap-8 lg:grid-cols-2">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-[.08em] text-[#8ca0b2]">Absence Category</span>
                  <span className="rounded-full border border-[#d0e0ea] px-2.5 py-0.5 text-[10px] font-semibold text-[#71869a]">Select one</span>
                </div>
                <div className="space-y-3">
                  {ABSENCE_CATEGORIES.map((cat) => (
                    <button
                      type="button"
                      key={cat.key}
                      onClick={() => setCategory(cat.key)}
                      className={`focus-ring block w-full rounded-lg border px-4 py-3 text-left transition-colors ${category === cat.key ? 'border-[#1f70d0] bg-[#e7f1fa]' : 'border-[#d0e0ea] hover:border-[#9cc0dd]'}`}
                      data-testid={`button-category-${cat.key}`}
                    >
                      <span className="block text-sm font-bold text-[#243e5b]">{cat.label}</span>
                      <span className="mt-0.5 block text-xs text-[#71869a]">{cat.text}</span>
                    </button>
                  ))}
                </div>
                {errors.category && <p className="mt-2 text-xs font-medium text-[#c54f43]">{errors.category}</p>}
              </div>

              <div>
                <label className="block" htmlFor="request-date-range">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[.08em] text-[#8ca0b2]">Date Range</span>
                  <span className="relative block">
                    <CalendarDays size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8aa0b2]" />
                    <input id="request-date-range" type="text" value={dateRange} onChange={(e) => setDateRange(e.target.value)} placeholder="Select dates (e.g., Oct 12 - Oct 14)" className={`focus-ring w-full rounded-lg border bg-[#fbfdfe] py-3 pl-10 pr-3.5 text-sm text-[#243e5b] outline-none placeholder:text-[#9baebe] ${errors.dateRange ? 'border-[#d05b48]' : 'border-[#cfdee9] focus:border-[#1f70d0]'}`} data-testid="input-date-range" />
                  </span>
                  {errors.dateRange && <span className="mt-1.5 block text-xs font-medium text-[#c54f43]">{errors.dateRange}</span>}
                </label>

                <div className="mt-6">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[.08em] text-[#8ca0b2]">Attach Supporting Document</span>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                    className={`rounded-lg border p-5 ${dragOver ? 'border-[#1f70d0] bg-[#e7f1fa]' : 'border-[#d0e0ea] bg-[#f4f8fb]'}`}
                  >
                    <label htmlFor="request-file" className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#c6dcec] py-8 text-center">
                      <Upload size={22} className="text-[#8aa0b2]" />
                      <span className="text-sm font-semibold text-[#243e5b]">{file ? file.name : 'Drop files here'}</span>
                      <span className="text-xs text-[#8aa0b2]">Supported format: PNG, JPG</span>
                      <input id="request-file" type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => handleFiles(e.target.files)} data-testid="input-file-upload" />
                    </label>
                    <div className="mt-4 flex items-center justify-end gap-3">
                      {file && <button type="button" onClick={() => setFile(null)} className="focus-ring flex items-center gap-1.5 rounded-lg border border-[#d05b48] px-3 py-1.5 text-xs font-bold text-[#d05b48]" data-testid="button-remove-file"><Trash2 size={13} /> Remove</button>}
                      <label htmlFor="request-file" className="focus-ring cursor-pointer rounded-lg bg-[#1f70d0] px-4 py-1.5 text-xs font-bold text-white" data-testid="label-upload-trigger">Upload</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block" htmlFor="request-comments">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[.08em] text-[#8ca0b2]">Justification & Comments</span>
                <textarea id="request-comments" rows={4} value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Please provide a brief explanation for your request..." className="focus-ring w-full rounded-lg border border-[#cfdee9] bg-[#fbfdfe] px-3.5 py-3 text-sm text-[#243e5b] outline-none placeholder:text-[#9baebe] focus:border-[#1f70d0]" data-testid="input-comments" />
              </label>
            </div>

            <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-[#e2eaf1] pt-6">
              <button type="button" onClick={() => setLocation('/dashboard')} className="focus-ring rounded-lg bg-[#d05b48] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#c24d3c]" data-testid="button-cancel-request">Cancel</button>
              <button type="submit" className="focus-ring rounded-lg bg-[#1f70d0] px-6 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_#1555aa] hover:bg-[#256fc6]" data-testid="button-submit-leave-request">Submit Leave Request</button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

const CURRENT_SHIFTS = [
  { key: 'aug15', date: 'August 15, 2026', time: '08:00 AM - 04:00 PM' },
  { key: 'aug17', date: 'August 17, 2026', time: '08:00 AM - 04:00 PM' },
];

function ShiftSwapPage() {
  const [, setLocation] = useLocation();
  const { addRequest } = useRequests();
  const [shift, setShift] = useState('aug15');
  const [colleague, setColleague] = useState('');
  const [newShift, setNewShift] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});
  const draftSaved = Boolean(colleague || newShift || reason);

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (!colleague.trim()) next.colleague = 'Enter a colleague to swap with.';
    if (!newShift.trim()) next.newShift = 'Select the target shift.';
    setErrors(next);
    if (Object.keys(next).length) return;
    addRequest({ type: `Shift Swap – ${colleague.trim()}` });
    setLocation('/dashboard');
  };

  return (
    <div className="flex min-h-[100dvh] bg-[#90bddb]">
      <Sidebar />
      <div className="flex-1">
        <PortalTopBar />
        <main className="px-8 py-8">
          <p className="mb-3 inline-flex rounded-full bg-[#162c4d] px-3 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-white">Scheduling Management</p>
          <h1 className="serif text-4xl text-[#10253f]">Shift Swapping Request</h1>
          <p className="mt-2 max-w-xl text-sm text-[#52708b]">Need to change your schedule? Use this form to request a shift swap with another eligible team member. Both parties must agree to the swap before final administrative approval.</p>

          <form onSubmit={submit} className="mt-6 rounded-xl bg-white p-6 shadow-[0_3px_8px_rgba(53,91,121,.08)]" noValidate>
            <div className="flex items-center gap-3 border-b border-[#e2eaf1] pb-5">
              <span className="grid size-9 place-items-center rounded-lg bg-[#e7f1fa] text-[#1f70d0]"><RefreshCw size={18} /></span>
              <div>
                <h2 className="text-lg font-bold text-[#10253f]">New Swap Request</h2>
                <p className="text-sm text-[#52708b]">Fill in the details for your proposed shift exchange.</p>
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.08em] text-[#8ca0b2]"><span className="inline-block h-3.5 w-1 rounded-full bg-[#1f70d0]" /> 1. Select Your Current Shift</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {CURRENT_SHIFTS.map((s) => (
                  <button type="button" key={s.key} onClick={() => setShift(s.key)} className={`focus-ring flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${shift === s.key ? 'border-[#1f70d0] bg-[#e7f1fa]' : 'border-[#d0e0ea] hover:border-[#9cc0dd]'}`} data-testid={`button-shift-${s.key}`}>
                    <span>
                      <span className="block text-sm font-bold text-[#243e5b]">{s.date}</span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-xs text-[#71869a]"><Clock3 size={12} /> {s.time}</span>
                    </span>
                    {shift === s.key && <span className="grid size-5 place-items-center rounded-full bg-[#1f70d0] text-white"><Check size={12} strokeWidth={3} /></span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-7">
              <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.08em] text-[#8ca0b2]"><span className="inline-block h-3.5 w-1 rounded-full bg-[#1f70d0]" /> 2. Proposed Swap Details</p>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block" htmlFor="swap-colleague">
                  <span className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#385570]"><FileText size={14} className="text-[#8aa0b2]" />Target Colleague</span>
                  <input id="swap-colleague" type="text" value={colleague} onChange={(e) => setColleague(e.target.value)} placeholder="Search by name or ID..." className={`focus-ring w-full rounded-lg border bg-[#fbfdfe] px-3.5 py-3 text-sm text-[#243e5b] outline-none placeholder:text-[#9baebe] ${errors.colleague ? 'border-[#d05b48]' : 'border-[#cfdee9] focus:border-[#1f70d0]'}`} data-testid="input-target-colleague" />
                  <span className="mt-1.5 block text-xs italic text-[#8aa0b2]">Start typing to see eligible team members for this role.</span>
                  {errors.colleague && <span className="mt-1 block text-xs font-medium text-[#c54f43]">{errors.colleague}</span>}
                </label>
                <label className="block" htmlFor="swap-new-shift">
                  <span className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#385570]"><CalendarDays size={14} className="text-[#8aa0b2]" />New Date / Shift</span>
                  <input id="swap-new-shift" type="text" value={newShift} onChange={(e) => setNewShift(e.target.value)} placeholder="Select the target shift..." className={`focus-ring w-full rounded-lg border bg-[#fbfdfe] px-3.5 py-3 text-sm text-[#243e5b] outline-none placeholder:text-[#9baebe] ${errors.newShift ? 'border-[#d05b48]' : 'border-[#cfdee9] focus:border-[#1f70d0]'}`} data-testid="input-new-shift" />
                  {errors.newShift && <span className="mt-1.5 block text-xs font-medium text-[#c54f43]">{errors.newShift}</span>}
                </label>
              </div>

              <label className="mt-5 block" htmlFor="swap-reason">
                <span className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#385570]"><FileText size={14} className="text-[#8aa0b2]" />Reason for Swap</span>
                <textarea id="swap-reason" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Briefly explain why this swap is necessary (e.g., family commitment, medical appointment)..." className="focus-ring w-full rounded-lg border border-[#cfdee9] bg-[#fbfdfe] px-3.5 py-3 text-sm text-[#243e5b] outline-none placeholder:text-[#9baebe] focus:border-[#1f70d0]" data-testid="input-swap-reason" />
              </label>
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-lg border border-[#d0e0ea] bg-[#f4f8fb] p-4">
              <Info size={18} className="mt-0.5 shrink-0 text-[#1f70d0]" />
              <div>
                <p className="text-sm font-bold text-[#243e5b]">Swap Policy Notice</p>
                <p className="mt-1 text-xs leading-5 text-[#71869a]">All swaps are subject to department lead approval. Swaps cannot exceed weekly hour limits (40h) and must maintain role coverage standards.</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#e2eaf1] pt-6">
              <span className={`flex items-center gap-1.5 text-xs font-semibold ${draftSaved ? 'text-[#19885d]' : 'text-[#8ca0b2]'}`}>
                <CheckCircle2 size={14} /> {draftSaved ? 'Draft automatically saved.' : 'Start typing to save a draft.'}
              </span>
              <div className="flex gap-3">
                <button type="button" onClick={() => setLocation('/dashboard')} className="focus-ring rounded-lg bg-[#d05b48] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#c24d3c]" data-testid="button-cancel-swap">Cancel</button>
                <button type="submit" className="focus-ring flex items-center gap-2 rounded-lg bg-[#1f70d0] px-6 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_#1555aa] hover:bg-[#256fc6]" data-testid="button-submit-swap-request">Submit Swap Request <ChevronRight size={16} /></button>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

function ReportsPage() { return <PortalShell supervisor><main className="px-5 py-7 md:px-8 md:py-8"><p className="mb-3 inline-flex rounded-full bg-[#162c4d] px-3 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-white">Supervisor Portal</p><h1 className="serif text-4xl text-[#10253f]">Reports</h1><p className="mt-2 text-sm text-[#52708b]">Reporting tools are ready for integration with departmental attendance data.</p></main></PortalShell>; }
function Router() {
  return <Switch><Route path="/" component={Home} /><Route path="/login" component={LoginPage} /><Route path="/logout-success" component={LogoutSuccessPage} /><Route path="/signup" component={SignupPage} /><Route path="/dashboard" component={DashboardPage} /><Route path="/dashboard/request" component={StudentRequestPage} /><Route path="/dashboard/shift-swap" component={StudentShiftSwapPage} /><Route path="/dashboard/history" component={StudentHistoryPage} /><Route path="/dashboard/schedule" component={StudentSchedulePage} /><Route path="/profile" component={StudentProfilePage} /><Route path="/supervisor" component={SupervisorDashboard} /><Route path="/supervisor/calendar" component={SupervisorCalendarPage} /><Route path="/supervisor/requests" component={SupervisorRequestsPage} /><Route path="/supervisor/assistances" component={SupervisorAssistancesPage} /><Route path="/supervisor/reports" component={ReportsPage} /><Route component={NotFound} /></Switch>;
}
function RoutedErrorBoundary({ children }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}
function App() {
  return (
    <ThemeProvider>
      <RequestsProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <PhotoBackdrop />
              <div className="app-content-layer">
                <RoutedErrorBoundary>
                  <Router />
                </RoutedErrorBoundary>
              </div>
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </RequestsProvider>
    </ThemeProvider>
  );
}
export default App;
