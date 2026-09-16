import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ArrowRight, BadgeCheck, BookOpen, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronRight, ClipboardCheck, Clock3, Eye, EyeOff, GraduationCap, LockKeyhole, Mail, MapPin, Menu, Moon, PanelTop, Phone, ShieldCheck, Sun, UsersRound, X, } from 'lucide-react';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
const queryClient = new QueryClient();
const navItems = [
    { label: 'How it works', href: '#how-it-works' },
    { label: 'For students', href: '#students' },
    { label: 'For supervisors', href: '#supervisors' },
];
function Brand({ light = false }) {
    return (<Link href="/" className="focus-ring flex items-center gap-3" data-testid="link-brand">
      <span className={`tut-logo-mark grid size-10 place-items-center rounded-[5px] ${light ? 'bg-white/12 text-white' : 'bg-[#004b87] text-white'} shadow-sm`}>
        <span className="relative grid size-6 place-items-center rounded-full border-2 border-[#f0b323]">
          <ClipboardCheck size={14} strokeWidth={2.8}/>
        </span>
      </span>
      <span className="leading-none">
        <strong className={`block text-[15px] font-bold tracking-[-.02em] ${light ? 'text-white' : 'text-[#162c4d]'}`}>StudentAssist</strong>
        <span className={`mt-1 block text-[9px] font-bold uppercase tracking-[.18em] ${light ? 'text-blue-100' : 'text-[#6b809a]'}`}>Absence tracker</span>
      </span>
    </Link>);
}
function Header({ darkMode, onToggleMode }) {
    const [open, setOpen] = useState(false);
    return (<header className="homepage-header relative z-20 border-b border-[#d5dfe8] bg-white">
      <div className="mx-auto flex h-[58px] max-w-[1440px] items-center justify-between px-5 sm:px-8">
        <Link href="/" className="focus-ring flex items-center gap-2" data-testid="link-brand">
          <span className="tut-logo-mark grid size-7 place-items-center rounded-[4px] bg-[#004b87] text-white">
            <span className="grid size-[18px] place-items-center rounded-full border border-[#f0b323]">
              <ClipboardCheck size={10} strokeWidth={2.8}/>
            </span>
          </span>
          <span className="leading-none">
            <strong className="block text-[10px] font-bold tracking-[-.02em] text-[#162c4d] sm:text-[11px]">StudentAssist</strong>
            <span className="mt-0.5 block text-[5px] font-bold uppercase tracking-[.13em] text-[#6b809a] sm:text-[6px]">absence and leave tracker</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-14 md:flex" aria-label="Main navigation">
          <a href="#" className="homepage-nav-link focus-ring text-[10px] font-medium text-[#283f59] transition-colors hover:text-[#286ee5]" data-testid="link-nav-homepage">Homepage</a>
          <button type="button" onClick={onToggleMode} aria-pressed={darkMode} className="homepage-nav-link focus-ring inline-flex items-center gap-2 text-[10px] font-medium text-[#283f59] transition-colors hover:text-[#286ee5]" data-testid="button-change-mode">
            {darkMode ? <Sun size={12}/> : <Moon size={12}/>}
            Change mode <span className="font-bold text-[#f0b323]">· {darkMode ? 'Light' : 'Dark'}</span>
          </button>
        </nav>
        <button type="button" className="focus-ring rounded-lg p-2 text-[#203c5d] md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu" data-testid="button-mobile-menu">
          {open ? <X size={22}/> : <Menu size={22}/>}
        </button>
      </div>
      {open && <div className="homepage-mobile-menu border-t border-[#d7e3ee] bg-white px-5 py-4 sm:hidden">
        <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
          <a href="#" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-semibold text-[#48627d] hover:bg-[#eff6fb]">Homepage</a>
          <button type="button" onClick={() => { onToggleMode(); setOpen(false); }} aria-pressed={darkMode} className="flex items-center gap-2 rounded-lg px-3 py-3 text-left text-sm font-semibold text-[#48627d] hover:bg-[#eff6fb]" data-testid="button-mobile-change-mode">
            {darkMode ? <Sun size={15}/> : <Moon size={15}/>}
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
              <p className="flex gap-2"><MapPin size={13} className="shrink-0"/>19 OR Tambo, Witbank, Emalahleni,<br />1034, South Africa.</p>
              <p className="flex gap-2"><Phone size={13} className="shrink-0"/>+27 (0)86 110 2421</p>
              <p className="flex gap-2"><Mail size={13} className="shrink-0"/>general@tut.ac.za</p>
            </div>
          </div>
          <FooterGroup title="Platform" links={['Features', 'Documentation', 'Support Center', 'Status']}/>
          <FooterGroup title="Legal" links={['Privacy Policy', 'Terms of Service', 'Security', 'Compliance']}/>
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
    const [darkMode, setDarkMode] = useState(false);
    return (<div className={`homepage-shell min-h-[100dvh] bg-[#90bddb] ${darkMode ? 'homepage-dark' : 'homepage-light'}`}>
      <Header darkMode={darkMode} onToggleMode={() => setDarkMode((current) => !current)}/>
      <main className="homepage-main">
        <section className="mx-auto grid max-w-[1180px] items-center gap-12 px-8 pb-24 pt-20 sm:px-12 lg:grid-cols-[.95fr_1.05fr] lg:gap-20 lg:pb-32 lg:pt-24">
          <div className="animate-rise">
            <p className="homepage-eyebrow mb-5 inline-flex rounded-full bg-[#b7d7eb] px-3 py-1 text-[8px] font-semibold text-[#286ee5]">University Portal</p>
            <h1 className="serif max-w-[570px] text-[47px] leading-[.91] tracking-[-.045em] text-[#10253f] sm:text-[62px]">Student<br />Assistant <span className="text-[#286ee5]">Absence &amp; Leave</span><br />Tracking system</h1>
            <p className="mt-6 max-w-[430px] text-[11px] leading-5 text-[#52708b]">A centralized platform for managing attendance, absences, and leave requests, making work easier for everyone.</p>
            <div className="mt-8 flex gap-4">
              <Link href="/login" className="homepage-primary-button focus-ring rounded-[2px] bg-[#286ee5] px-8 py-3 text-[10px] font-bold text-white shadow-[0_3px_5px_rgba(31,88,183,.3)] transition-transform hover:-translate-y-0.5" data-testid="link-hero-signin">Login <ArrowRight className="ml-1 inline" size={11}/></Link>
              <Link href="/signup" className="homepage-secondary-button focus-ring rounded-[2px] border border-[#dce4ea] bg-white px-8 py-3 text-[10px] font-bold text-[#6a7180] transition-colors hover:border-[#286ee5] hover:text-[#286ee5]" data-testid="link-hero-signup">Sign Up</Link>
            </div>
          </div>
          <div className="animate-rise-delay-1 mx-auto w-full max-w-[510px]">
            <div className="overflow-hidden rounded-md border-[10px] border-white bg-white shadow-[0_10px_25px_rgba(48,83,111,.1)]">
              <img src="/assets/tut-library.jpg" alt="TUT student assistants collaborating in a library" className="block aspect-[1.42] h-full w-full object-cover" data-testid="img-hero-campus"/>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto grid max-w-[1180px] items-center gap-12 px-8 py-20 sm:px-12 lg:grid-cols-[1fr_1fr] lg:gap-20 lg:py-24">
          <div className="order-2 lg:order-1">
            <div className="mx-auto max-w-[475px] overflow-hidden rounded-lg border-[10px] border-[#d8e9f5] bg-[#eef5f9]">
              <img src="/assets/home-dashboard-hd.png" alt="Student staff hub showing an approved leave calendar" className="block w-full" data-testid="img-dashboard"/>
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
              <InfoCard icon={<Clock3 size={16}/>} title="Instant Alerts" text="Receive real-time push notifications for last-minute scheduling changes."/>
              <InfoCard icon={<ShieldCheck size={16}/>} title="Status Updates" text="Students are automatically notified when their leave status changes."/>
            </div>
          </div>
          <div className="mx-auto w-full max-w-[390px] overflow-hidden">
            <img src="/assets/home-phone-hd.png" alt="Mobile leave request update notification" className="block w-full" data-testid="img-phone"/>
          </div>
        </section>

        <section id="supervisors" className="mx-auto max-w-[1180px] px-8 pb-20 pt-16 text-center sm:px-12 lg:pb-24 lg:pt-20">
          <h2 className="serif text-[31px] leading-none tracking-[-.03em] text-[#10253f] sm:text-[38px]">Built for Every Role</h2>
          <p className="mx-auto mt-4 max-w-[510px] text-[11px] leading-5 text-[#52708b]">Whether you're a department head or a student worker, Student Assistant Tracker simplifies your workflow.</p>
          <div className="mx-auto mt-10 grid max-w-[940px] gap-5 md:grid-cols-3">
            <RoleCard icon={<UsersRound size={22}/>} iconClass="bg-[#dce5fb] text-[#286ee5]" title="Administrators" text="Oversee department-wide attendance, generate payroll reports, and manage staffing levels with comprehensive analytics."/>
            <RoleCard icon={<ClipboardCheck size={22}/>} iconClass="bg-[#fff0d8] text-[#f2aa00]" title="Supervisors" text="Approve or deny leave requests in seconds, view daily team schedules, and communicate directly with your student staff."/>
            <RoleCard icon={<CheckCircle2 size={22}/>} iconClass="bg-[#d4f5e7] text-[#22b78b]" title="Student Assistant" text="Easily log absences, track remaining leave balance, and receive instant status updates on pending requests via mobile."/>
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
    return <li className="flex items-start gap-3"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#d7edfb] text-[#1f70d0]"><Check size={12} strokeWidth={3}/></span><span>{children}</span></li>;
}
function Feature({ icon, title }) {
    return <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-[#e8f3fb] text-[#1f70d0]">{icon}</span><span className="text-sm font-bold text-[#385570]">{title}</span></div>;
}
function InfoCard({ icon, title, text }) {
    return <div className="homepage-info-card rounded-md bg-[#eaf3f9] p-4 text-left"><span className="grid size-7 place-items-center rounded-full bg-white text-[#286ee5]">{icon}</span><h3 className="mt-3 text-[10px] font-bold text-[#243e5b]">{title}</h3><p className="mt-1 text-[9px] leading-4 text-[#60768c]">{text}</p></div>;
}
function RoleCard({ icon, iconClass, title, text }) {
    return <article className="homepage-role-card rounded-md bg-[#f4f8fb] px-6 py-6 shadow-[0_3px_8px_rgba(53,91,121,.08)]"><span className={`mx-auto grid size-11 place-items-center rounded-full ${iconClass}`}>{icon}</span><h3 className="mt-5 text-[14px] font-bold text-[#172d48]">{title}</h3><p className="mt-3 min-h-[58px] text-[10px] leading-4 text-[#60768c]">{text}</p><a href="#learn-more" className="mt-5 inline-flex items-center gap-2 text-[10px] font-bold text-[#286ee5]">Learn More <ChevronRight size={13}/></a></article>;
}
function AuthHeader() {
    return <header className="border-b border-[#d7e3ee] bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-10"><Brand /><div className="flex items-center gap-3 text-sm text-[#71869a]"><span className="hidden sm:inline">New to StudentAssist?</span><Link href="/signup" className="focus-ring font-bold text-[#1f70d0] hover:text-[#1555aa]" data-testid="link-auth-signup">Create account <ArrowRight className="ml-1 inline" size={14}/></Link></div></div></header>;
}
function AuthFooter() {
    return <div className="mt-auto border-t border-[#d7e3ee] bg-white/70 px-5 py-5 text-center text-xs text-[#71869a]"><span>Need help? </span><a href="mailto:support@studentassist.edu" className="font-bold text-[#1f70d0]" data-testid="link-auth-support">Contact StudentAssist support</a><span className="mx-2 text-[#bdccd8]">·</span><Link href="/" className="hover:text-[#1f70d0]" data-testid="link-auth-home">Return home</Link></div>;
}
function AuthShell({ children, eyebrow, title, copy }) {
    return <div className="flex min-h-[100dvh] flex-col bg-[#eef6fb]"><AuthHeader /><main className="relative flex flex-1 items-center overflow-hidden px-5 py-12 sm:py-16"><div className="absolute -left-28 top-12 size-72 rounded-full bg-[#dbeefa] blur-3xl"/><div className="absolute -right-24 bottom-0 size-72 rounded-full bg-[#f6df8c]/30 blur-3xl"/><div className="relative mx-auto grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[.88fr_1.12fr]">{<div className="hidden lg:block"><span className="mono inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.16em] text-[#1f70d0]"><span className="size-2 rounded-full bg-[#f5ce58]"/> {eyebrow}</span><h1 className="serif mt-5 text-5xl leading-[1.02] tracking-[-.035em] text-[#162c4d]">{title}</h1><p className="mt-5 max-w-sm leading-7 text-[#60768c]">{copy}</p><div className="mt-10 flex items-center gap-3 text-xs text-[#6c8196]"><ShieldCheck size={17} className="text-[#1f70d0]"/> Your information is protected by institutional security.</div></div>}<div className="animate-rise">{children}</div></div></main><AuthFooter /></div>;
}
function Field({ label, id, type = 'text', placeholder, value, onChange, error, required = true, icon }) {
    return <label className="block" htmlFor={id}><span className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#385570]">{icon}{label}{required && <em className="not-italic text-[#d05b48]">*</em>}</span><span className="relative block">{icon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8aa0b2]">{icon}</span>}<input id={id} type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={`focus-ring w-full rounded-lg border bg-[#fbfdfe] px-3.5 py-3 text-sm text-[#243e5b] outline-none transition-colors placeholder:text-[#9baebe] ${icon ? 'pl-10' : ''} ${error ? 'border-[#d05b48]' : 'border-[#cfdee9] focus:border-[#1f70d0]'}`} data-testid={`input-${id}`}/> </span>{error && <span className="mt-1.5 block text-xs font-medium text-[#c54f43]" data-testid={`error-${id}`}>{error}</span>}</label>;
}
function PasswordField({ label, id, value, onChange, error }) {
    const [show, setShow] = useState(false);
    return <label className="block" htmlFor={id}><span className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#385570]"><LockKeyhole size={14} className="text-[#8aa0b2]"/>{label}<em className="not-italic text-[#d05b48]">*</em></span><span className="relative block"><input id={id} type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} className={`focus-ring w-full rounded-lg border bg-[#fbfdfe] px-3.5 py-3 pr-11 text-sm text-[#243e5b] outline-none transition-colors placeholder:text-[#9baebe] ${error ? 'border-[#d05b48]' : 'border-[#cfdee9] focus:border-[#1f70d0]'}`} placeholder="Enter your password" data-testid={`input-${id}`}/><button type="button" onClick={() => setShow(!show)} className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 text-[#7890a4] hover:text-[#1f70d0]" aria-label={show ? 'Hide password' : 'Show password'} data-testid={`button-toggle-${id}`}>{show ? <EyeOff size={17}/> : <Eye size={17}/>}</button></span>{error && <span className="mt-1.5 block text-xs font-medium text-[#c54f43]" data-testid={`error-${id}`}>{error}</span>}</label>;
}
function LoginPage() {
    const [role, setRole] = useState('student');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState(false);
    const [location, setLocation] = useLocation();
    const submit = (e) => { e.preventDefault(); const next = {}; if (!email.includes('@'))
        next.email = 'Enter your university email address.'; if (password.length < 6)
        next.password = 'Password must be at least 6 characters.'; setErrors(next); if (!Object.keys(next).length)
        setSuccess(true); };
    if (success)
        return <div className="flex min-h-[100dvh] flex-col bg-[#eef6fb]"><AuthHeader /><main className="flex flex-1 items-center justify-center px-5 py-14"><div className="w-full max-w-md animate-rise rounded-2xl border border-[#d0e0ea] bg-white p-8 text-center shadow-[0_18px_45px_rgba(43,81,119,.12)] sm:p-10"><span className="mx-auto grid size-16 place-items-center rounded-full bg-[#e3f7ec] text-[#19885d]"><CheckCircle2 size={30}/></span><h1 className="serif mt-6 text-4xl text-[#162c4d]">You’re signed in.</h1><p className="mt-3 leading-7 text-[#60768c]">Your {role === 'student' ? 'student assistant' : 'supervisor'} portal is ready. This demo keeps the welcome flow local while your institution connects its account system.</p><button type="button" onClick={() => setLocation('/')} className="focus-ring mt-7 w-full rounded-lg bg-[#1f70d0] px-5 py-3.5 text-sm font-bold text-white shadow-[0_4px_0_#1555aa] hover:bg-[#256fc6] active:translate-y-0.5 active:shadow-none" data-testid="button-success-home">Return to home</button></div></main><AuthFooter /></div>;
    return <AuthShell eyebrow="Secure portal" title={role === 'student' ? 'Welcome back, student.' : 'Welcome back, supervisor.'} copy="Sign in to keep attendance records moving, requests clear, and your next step close at hand."><div className="rounded-2xl border border-[#d0e0ea] bg-white p-6 shadow-[0_18px_45px_rgba(43,81,119,.12)] sm:p-9"><div className="mb-7"><p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#1f70d0]">Portal access</p><h2 className="serif mt-2 text-3xl tracking-[-.025em] text-[#162c4d]">Sign in to StudentAssist</h2><p className="mt-2 text-sm text-[#71869a]">Choose your account type to continue.</p></div><div className="mb-7 grid grid-cols-2 rounded-lg bg-[#edf4f8] p-1"><RoleTab active={role === 'student'} onClick={() => { setRole('student'); setErrors({}); }} icon={<GraduationCap size={16}/>} label="Student assistant" testId="button-role-student"/><RoleTab active={role === 'supervisor'} onClick={() => { setRole('supervisor'); setErrors({}); }} icon={<UsersRound size={16}/>} label="Supervisor" testId="button-role-supervisor"/></div><form onSubmit={submit} className="space-y-5" noValidate><Field label={role === 'student' ? 'University email' : 'Work email'} id="login-email" type="email" placeholder={role === 'student' ? 'studentnumber@tut4life.ac.za' : 'surname.initials@tut.ac.za'} value={email} onChange={setEmail} error={errors.email} icon={<Mail size={15}/>}/><PasswordField label="Password" id="login-password" value={password} onChange={setPassword} error={errors.password}/><div className="flex items-center justify-between gap-3 text-xs"><label className="flex cursor-pointer items-center gap-2 text-[#71869a]"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-4 accent-[#1f70d0]" data-testid="input-remember"/> Keep me signed in</label><button type="button" onClick={() => window.alert('Password reset instructions will be sent to your institutional email.')} className="font-bold text-[#1f70d0] hover:text-[#1555aa]" data-testid="button-forgot-password">Forgot password?</button></div><button type="submit" className="focus-ring group w-full rounded-lg bg-[#1f70d0] px-5 py-3.5 text-sm font-bold text-white shadow-[0_4px_0_#1555aa] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-none" data-testid="button-submit-login">Sign in as {role === 'student' ? 'student' : 'supervisor'} <ArrowRight className="ml-2 inline transition-transform group-hover:translate-x-1" size={16}/></button></form><div className="mt-7 border-t border-[#e4edf3] pt-5 text-center text-xs text-[#71869a]">Don’t have an account? <Link href="/signup" className="font-bold text-[#1f70d0]" data-testid="link-login-signup">Register here</Link></div></div></AuthShell>;
}
function RoleTab({ active, onClick, icon, label, testId }) {
    return <button type="button" onClick={onClick} className={`focus-ring flex items-center justify-center gap-2 rounded-md px-2 py-2.5 text-xs font-bold transition-all ${active ? 'bg-white text-[#1f70d0] shadow-sm' : 'text-[#71869a] hover:text-[#385570]'}`} data-testid={testId}>{icon}{label}</button>;
}
function SignupPage() {
    const [role, setRole] = useState('student');
    const [form, setForm] = useState({ first: '', last: '', email: '', studentNumber: '', course: '', year: '', password: '', confirm: '' });
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState(false);
    const update = (key) => (value) => setForm((old) => ({ ...old, [key]: value }));
    const submit = (e) => { e.preventDefault(); const next = {}; if (!form.first.trim())
        next.first = 'First name is required.'; if (!form.last.trim())
        next.last = 'Last name is required.'; if (!form.email.includes('@'))
        next.email = 'Use a valid institutional email.'; if (role === 'student' && !form.studentNumber.trim())
        next.studentNumber = 'Student number is required.'; if (role === 'student' && !form.course.trim())
        next.course = 'Course is required.'; if (role === 'student' && !form.year)
        next.year = 'Choose your current year.'; if (form.password.length < 8)
        next.password = 'Use at least 8 characters.'; if (form.password !== form.confirm)
        next.confirm = 'Passwords do not match.'; setErrors(next); if (!Object.keys(next).length)
        setSuccess(true); };
    if (success)
        return <div className="flex min-h-[100dvh] flex-col bg-[#eef6fb]"><AuthHeader /><main className="flex flex-1 items-center justify-center px-5 py-14"><div className="w-full max-w-md animate-rise rounded-2xl border border-[#d0e0ea] bg-white p-8 text-center shadow-[0_18px_45px_rgba(43,81,119,.12)] sm:p-10"><span className="mx-auto grid size-16 place-items-center rounded-full bg-[#e3f7ec] text-[#19885d]"><CheckCircle2 size={30}/></span><h1 className="serif mt-6 text-4xl text-[#162c4d]">Account request received.</h1><p className="mt-3 leading-7 text-[#60768c]">We’ve prepared your {role === 'student' ? 'student assistant' : 'supervisor'} profile. Check your institutional inbox to verify your email and finish setting up.</p><Link href="/login" className="focus-ring mt-7 block w-full rounded-lg bg-[#1f70d0] px-5 py-3.5 text-sm font-bold text-white shadow-[0_4px_0_#1555aa] hover:bg-[#256fc6]" data-testid="link-success-login">Continue to sign in</Link></div></main><AuthFooter /></div>;
    return <AuthShell eyebrow="Join the portal" title="A better way to keep your records in order." copy="Create one account for the attendance details that matter — with the right tools for your role and the people you work with."><div className="rounded-2xl border border-[#d0e0ea] bg-white p-6 shadow-[0_18px_45px_rgba(43,81,119,.12)] sm:p-9"><div className="mb-6"><p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#1f70d0]">Account registration</p><h2 className="serif mt-2 text-3xl tracking-[-.025em] text-[#162c4d]">Create your account</h2></div><div className="mb-7 grid grid-cols-2 rounded-lg bg-[#edf4f8] p-1"><RoleTab active={role === 'student'} onClick={() => { setRole('student'); setErrors({}); }} icon={<GraduationCap size={16}/>} label="Student assistant" testId="button-signup-student"/><RoleTab active={role === 'supervisor'} onClick={() => { setRole('supervisor'); setErrors({}); }} icon={<UsersRound size={16}/>} label="Supervisor" testId="button-signup-supervisor"/></div><form onSubmit={submit} className="space-y-5" noValidate><div className="grid gap-5 sm:grid-cols-2"><Field label="First name" id="signup-first" placeholder="e.g. Sarah" value={form.first} onChange={update('first')} error={errors.first}/><Field label="Last name" id="signup-last" placeholder="e.g. Nkosi" value={form.last} onChange={update('last')} error={errors.last}/></div><Field label={role === 'student' ? 'University email' : 'Work email'} id="signup-email" type="email" placeholder={role === 'student' ? 'studentnumber@tut4life.ac.za' : 'surname.initials@tut.ac.za'} value={form.email} onChange={update('email')} error={errors.email} icon={<Mail size={15}/>}/>{role === 'student' ? <><Field label="Student number" id="signup-student-number" placeholder="e.g. 20240123" value={form.studentNumber} onChange={update('studentNumber')} error={errors.studentNumber} icon={<BadgeCheck size={15}/>}/><div className="grid gap-5 sm:grid-cols-2"><Field label="Course or department" id="signup-course" placeholder="e.g. Information Technology" value={form.course} onChange={update('course')} error={errors.course} icon={<BookOpen size={15}/>}/><label className="block" htmlFor="signup-year"><span className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#385570]"><CalendarDays size={14} className="text-[#8aa0b2]"/>Current year<em className="not-italic text-[#d05b48]">*</em></span><span className="relative block"><select id="signup-year" value={form.year} onChange={(e) => update('year')(e.target.value)} className={`focus-ring w-full appearance-none rounded-lg border bg-[#fbfdfe] px-3.5 py-3 text-sm text-[#243e5b] outline-none ${errors.year ? 'border-[#d05b48]' : 'border-[#cfdee9] focus:border-[#1f70d0]'}`} data-testid="input-signup-year"><option value="">Select year</option><option value="first">First year</option><option value="second">Second year</option><option value="third">Third year</option><option value="postgraduate">Postgraduate</option></select><ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7890a4]"/></span>{errors.year && <span className="mt-1.5 block text-xs font-medium text-[#c54f43]" data-testid="error-signup-year">{errors.year}</span>}</label></div></> : <Field label="Department or faculty" id="signup-course" placeholder="e.g. Faculty of Information and Communication Technology" value={form.course} onChange={update('course')} error={errors.course} icon={<PanelTop size={15}/>}/>}<div className="grid gap-5 sm:grid-cols-2"><PasswordField label="Password" id="signup-password" value={form.password} onChange={update('password')} error={errors.password}/><PasswordField label="Confirm password" id="signup-confirm" value={form.confirm} onChange={update('confirm')} error={errors.confirm}/></div><label className="flex items-start gap-2 text-xs leading-5 text-[#71869a]"><input type="checkbox" required className="mt-1 size-4 shrink-0 accent-[#1f70d0]" data-testid="input-terms"/>I agree to the StudentAssist <a href="#terms" className="font-bold text-[#1f70d0]">terms and privacy policy</a>.</label><button type="submit" className="focus-ring group w-full rounded-lg bg-[#1f70d0] px-5 py-3.5 text-sm font-bold text-white shadow-[0_4px_0_#1555aa] transition-all hover:-translate-y-0.5 hover:bg-[#256fc6] active:translate-y-0 active:shadow-none" data-testid="button-submit-signup">Create {role === 'student' ? 'student' : 'supervisor'} account <ArrowRight className="ml-2 inline transition-transform group-hover:translate-x-1" size={16}/></button></form><div className="mt-6 border-t border-[#e4edf3] pt-5 text-center text-xs text-[#71869a]">Already have an account? <Link href="/login" className="font-bold text-[#1f70d0]" data-testid="link-signup-login">Sign in</Link></div></div></AuthShell>;
}
function NotFound() {
    return <div className="grid min-h-[100dvh] place-items-center bg-[#eef6fb] px-5 text-center"><div><p className="mono text-xs font-bold uppercase tracking-[.15em] text-[#1f70d0]">404 · Page not found</p><h1 className="serif mt-4 text-5xl text-[#162c4d]">That page took a day off.</h1><p className="mx-auto mt-4 max-w-md text-[#60768c]">The page you’re looking for isn’t part of this semester’s schedule.</p><Link href="/" className="focus-ring mt-7 inline-flex items-center gap-2 rounded-lg bg-[#1f70d0] px-5 py-3 text-sm font-bold text-white" data-testid="link-404-home">Back to StudentAssist <ArrowRight size={16}/></Link></div></div>;
}
function Router() {
    return <Switch><Route path="/" component={Home}/><Route path="/login" component={LoginPage}/><Route path="/signup" component={SignupPage}/><Route component={NotFound}/></Switch>;
}
function RoutedErrorBoundary({ children }) {
    const [location] = useLocation();
    return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}
function App() {
    return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><RoutedErrorBoundary><Router /></RoutedErrorBoundary></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}
export default App;
