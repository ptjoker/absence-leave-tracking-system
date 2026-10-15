import { useState } from 'react';
import { ArrowRight, Grid2X2, LockKeyhole, Mail } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { API_BASE } from '@/lib/api';

export default function AdminLoginPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!email.includes('@') || password.length < 6) {
      setError('Enter a valid email address and a password of at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'admin' }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || 'Could not sign in. Check your administrator credentials.');
        return;
      }
      if (data.user?.role !== 'admin' || !data.session?.access_token) {
        setError('This account is not authorized for administrator access.');
        return;
      }

      localStorage.setItem('session', JSON.stringify({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        user: data.user,
      }));
      setLocation('/admin');
    } catch (requestError) {
      console.error('Administrator login error:', requestError);
      setError('Could not reach the server. Check that the backend is running and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-[#f1f3f5] px-5 py-12">
      <section className="w-full max-w-md rounded-2xl border border-[#dce2e8] bg-white p-7 shadow-[0_18px_45px_rgba(30,48,66,.12)] sm:p-9">
        <Link href="/" className="focus-ring inline-flex items-center gap-2 text-sm font-semibold text-[#526171] hover:text-[#1f70d0]">
          <Grid2X2 size={18} className="text-[#1f70d0]" /> iCenter administration
        </Link>
        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-[#1f70d0]">Administrator access</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#17212b]">Sign in to your account</h1>
          <p className="mt-2 text-sm leading-6 text-[#657383]">Use the administrator account provided for your platform.</p>
        </div>

        <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
          <label htmlFor="admin-email" className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#344252]"><Mail size={16} />Email address</span>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@yourorganisation.org"
              className="focus-ring w-full rounded-lg border border-[#cfd7df] bg-white px-3.5 py-3 text-sm text-[#17212b] outline-none placeholder:text-[#9aa5b1] focus:border-[#1f70d0]"
            />
          </label>
          <label htmlFor="admin-password" className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#344252]"><LockKeyhole size={16} />Password</span>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="focus-ring w-full rounded-lg border border-[#cfd7df] bg-white px-3.5 py-3 text-sm text-[#17212b] outline-none placeholder:text-[#9aa5b1] focus:border-[#1f70d0]"
            />
          </label>
          {error && <p role="alert" className="rounded-lg bg-[#fff0ee] px-3.5 py-3 text-sm font-semibold text-[#b84233]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="focus-ring flex w-full items-center justify-center rounded-lg bg-[#1473e6] px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#095fc5] disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in as administrator'}
            {!loading && <ArrowRight size={16} className="ml-2" />}
          </button>
        </form>
        <p className="mt-6 border-t border-[#e7ebef] pt-5 text-center text-xs text-[#768391]">
          <Link href="/" className="focus-ring rounded font-semibold text-[#526171] hover:text-[#1f70d0]">Return to the iCenter home page</Link>
        </p>
      </section>
    </main>
  );
}
