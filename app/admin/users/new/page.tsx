'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const S = {
  input: {
    background: '#ffffff',
    color: '#222222',
    border: '1px solid #dddddd',
    borderRadius: '8px',
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.1s, box-shadow 0.1s',
  } as React.CSSProperties,
  label: {
    display: 'block',
    marginBottom: '6px',
    color: '#222222',
    fontSize: '14px',
    fontWeight: 500,
  } as React.CSSProperties,
};

function focusInput(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.target.style.borderColor = '#222222';
  e.target.style.boxShadow = '0 0 0 2px #222222';
}
function blurInput(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.target.style.borderColor = '#dddddd';
  e.target.style.boxShadow = 'none';
}

export default function NewUserPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', displayName: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create user'); return; }
      router.push('/admin');
    } finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen p-6 flex items-center justify-center" style={{ background: '#f7f7f7' }}>
      <div className="w-full max-w-[400px]">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-sm font-500" style={{ color: '#6a6a6a' }}>← Users</Link>
        </div>

        <div className="px-8 py-8 rounded-2xl bg-white" style={{ boxShadow: 'rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px 0, rgba(0,0,0,0.1) 0 4px 8px 0' }}>
          <h2 className="text-xl font-semibold mb-6 text-center" style={{ color: '#222222' }}>Add User</h2>

          {error && (
            <div className="mb-5 px-4 py-2.5 rounded-lg text-sm text-center" style={{ background: '#fff0f0', color: '#c13515', border: '1px solid #fcc' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label style={S.label}>Display Name</label>
              <input type="text" required value={form.displayName} onChange={set('displayName')} placeholder="Jane Doe"
                style={S.input} onFocus={focusInput} onBlur={blurInput} />
            </div>
            <div>
              <label style={S.label}>Email</label>
              <input type="email" required value={form.email} onChange={set('email')} placeholder="jane@company.com"
                style={S.input} onFocus={focusInput} onBlur={blurInput} />
            </div>
            <div>
              <label style={S.label}>Password</label>
              <input type="password" required value={form.password} onChange={set('password')} placeholder="••••••••"
                style={S.input} onFocus={focusInput} onBlur={blurInput} />
            </div>
            <div>
              <label style={S.label}>Role</label>
              <select value={form.role} onChange={set('role')}
                style={{ ...S.input, appearance: 'none' as const }}
                onFocus={focusInput} onBlur={blurInput}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 text-sm font-600 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{ background: '#ff385c', color: '#ffffff', borderRadius: '8px' }}>
              {loading ? 'Creating…' : 'Create User'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
