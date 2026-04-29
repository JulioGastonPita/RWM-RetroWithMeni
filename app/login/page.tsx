'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Tab = 'local' | 'ldap' | 'entraid';

const S = {
  input: {
    background: '#ffffff',
    color: '#222222',
    border: '1px solid #dddddd',
    borderRadius: '8px',
    width: '100%',
    padding: '14px 16px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.1s, box-shadow 0.1s',
  } as React.CSSProperties,
  btnPrimary: {
    background: '#ff385c',
    color: '#ffffff',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '16px',
  } as React.CSSProperties,
  btnMicrosoft: {
    background: '#0078d4',
    color: '#ffffff',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '16px',
  } as React.CSSProperties,
};

function focusInput(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = '#222222';
  e.target.style.boxShadow = '0 0 0 2px #222222';
}
function blurInput(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = '#dddddd';
  e.target.style.boxShadow = 'none';
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>('local');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ldapUsername, setLdapUsername] = useState('');
  const [ldapPassword, setLdapPassword] = useState('');

  useEffect(() => {
    const e = searchParams.get('error');
    if (e) setError(decodeURIComponent(e));
  }, [searchParams]);

  async function handleLocalLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); return; }
      router.push('/home');
    } finally { setLoading(false); }
  }

  async function handleLdapLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/ldap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: ldapUsername, password: ldapPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'LDAP login failed'); return; }
      router.push('/home');
    } finally { setLoading(false); }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'local', label: 'Password' },
    { id: 'ldap', label: 'LDAP' },
    { id: 'entraid', label: 'Microsoft' },
  ];

  return (
    <main className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f7f7f7' }}>
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: '#ff385c' }}>
            <span className="text-white font-bold text-xl">RWM</span>
          </div>
          <p className="text-sm mt-1" style={{ color: '#6a6a6a' }}>Sign in to continue</p>
        </div>

        {/* Card */}
        <div className="px-8 py-8 rounded-2xl bg-white" style={{ boxShadow: 'rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px 0, rgba(0,0,0,0.1) 0 4px 8px 0' }}>
          <h2 className="text-xl font-semibold text-center mb-6" style={{ color: '#222222' }}>Log in</h2>

          {/* Tabs */}
          <div className="flex gap-0 mb-6 rounded-lg overflow-hidden" style={{ border: '1px solid #dddddd' }}>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setError(''); }}
                className="flex-1 py-2 text-sm font-500 transition-all"
                style={tab === t.id
                  ? { background: '#222222', color: '#ffffff' }
                  : { background: '#ffffff', color: '#6a6a6a' }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-5 px-4 py-2.5 rounded-lg text-sm text-center" style={{ background: '#fff0f0', color: '#c13515', border: '1px solid #fcc' }}>
              {error}
            </div>
          )}

          {tab === 'local' && (
            <form onSubmit={handleLocalLogin} className="space-y-4">
              <div>
                <label className="block mb-1.5 text-sm font-500" style={{ color: '#222222' }}>Email address</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Email address"
                  style={S.input}
                  onFocus={focusInput}
                  onBlur={blurInput} />
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-500" style={{ color: '#222222' }}>Password</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  style={S.input}
                  onFocus={focusInput}
                  onBlur={blurInput} />
              </div>
              <button type="submit" disabled={loading || !email || !password}
                className="w-full py-3.5 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                style={S.btnPrimary}>
                {loading ? 'Signing in…' : 'Log in'}
              </button>
            </form>
          )}

          {tab === 'ldap' && (
            <form onSubmit={handleLdapLogin} className="space-y-4">
              <div>
                <label className="block mb-1.5 text-sm font-500" style={{ color: '#222222' }}>Username</label>
                <input type="text" required value={ldapUsername} onChange={e => setLdapUsername(e.target.value)}
                  placeholder="Username"
                  style={S.input}
                  onFocus={focusInput}
                  onBlur={blurInput} />
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-500" style={{ color: '#222222' }}>Password</label>
                <input type="password" required value={ldapPassword} onChange={e => setLdapPassword(e.target.value)}
                  placeholder="Password"
                  style={S.input}
                  onFocus={focusInput}
                  onBlur={blurInput} />
              </div>
              <button type="submit" disabled={loading || !ldapUsername || !ldapPassword}
                className="w-full py-3.5 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                style={S.btnPrimary}>
                {loading ? 'Signing in…' : 'Log in with LDAP'}
              </button>
            </form>
          )}

          {tab === 'entraid' && (
            <div className="space-y-4">
              <p className="text-sm text-center" style={{ color: '#6a6a6a' }}>
                Use your Microsoft account to sign in.
              </p>
              <button onClick={() => { window.location.href = '/api/auth/entraid'; }}
                className="w-full py-3.5 transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-3"
                style={S.btnMicrosoft}>
                <svg width="16" height="16" viewBox="0 0 23 23" fill="none">
                  <path d="M1 1h10v10H1z" fill="#f25022"/>
                  <path d="M12 1h10v10H12z" fill="#7fba00"/>
                  <path d="M1 12h10v10H1z" fill="#00a4ef"/>
                  <path d="M12 12h10v10H12z" fill="#ffb900"/>
                </svg>
                Continue with Microsoft
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#929292' }}>
          v{process.env.NEXT_PUBLIC_APP_VERSION}
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
