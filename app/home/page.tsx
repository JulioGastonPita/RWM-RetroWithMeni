'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CreateSessionForm } from '@/components/session/CreateSessionForm';
import { JoinSessionForm } from '@/components/session/JoinSessionForm';
import { LookupSessionForm } from '@/components/session/LookupSessionForm';
import { SessionList } from '@/components/session/SessionList';
import { useLanguage } from '@/components/providers/LanguageProvider';

type SessionUser = { userId: string; email: string; displayName: string; role: string };

export default function HomePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [showSessions, setShowSessions] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => setUser(d?.user || null)).catch(() => {});
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f7f7f7' }}>
      <div className="w-full max-w-lg">
        {user && (
          <div className="flex items-center justify-between mb-6 px-1">
            <span className="text-sm" style={{ color: '#6a6a6a' }}>
              {user.displayName}
            </span>
            <div className="flex gap-2">
              {user.role === 'admin' && (
                <Link href="/admin"
                  className="text-sm px-3 py-1 rounded-lg font-500 transition-all hover:opacity-80"
                  style={{ background: 'rgba(255,56,92,0.08)', color: '#ff385c', border: '1px solid rgba(255,56,92,0.2)' }}>
                  Admin
                </Link>
              )}
              <button onClick={logout}
                className="text-sm px-3 py-1 rounded-lg font-500 transition-all hover:opacity-80"
                style={{ border: '1px solid #dddddd', color: '#6a6a6a', background: '#ffffff' }}>
                Log out
              </button>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: '#ff385c' }}>
            <span className="text-white font-bold text-lg">RWM</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#222222' }}>RWM</h1>
          <p className="text-sm mt-1" style={{ color: '#6a6a6a' }}>{t('home.subtitle')}</p>
        </div>

        <div className="p-6 rounded-2xl bg-white" style={{ boxShadow: 'var(--panel-shadow)' }}>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#222222' }}>{t('home.createSession')}</h2>
          <CreateSessionForm />
        </div>

        <div className="p-5 mt-4 rounded-2xl bg-white" style={{ boxShadow: 'var(--panel-shadow)' }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#6a6a6a' }}>{t('home.joinSession')}</h2>
          <JoinSessionForm />
        </div>

        <div className="p-5 mt-4 rounded-2xl bg-white" style={{ boxShadow: 'var(--panel-shadow)' }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#6a6a6a' }}>{t('home.viewSession')}</h2>
          <LookupSessionForm />
        </div>

        <button
          onClick={() => setShowSessions(s => !s)}
          className="w-full mt-4 text-sm px-4 py-2.5 rounded-xl font-500 transition-all hover:bg-gray-50"
          style={{ background: '#ffffff', border: '1px solid #dddddd', color: '#6a6a6a', borderRadius: '8px' }}
        >
          {t('home.browseSessions')}
        </button>

        {showSessions && (
          <div className="p-5 mt-4 rounded-2xl bg-white" style={{ boxShadow: 'var(--panel-shadow)' }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: '#6a6a6a' }}>{t('home.allSessions')}</h2>
            <SessionList />
          </div>
        )}
      </div>
    </main>
  );
}
