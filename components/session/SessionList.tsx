'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface SessionData {
  id: string;
  name: string;
  format: string;
  phase: string;
  created_at: number;
}

export function SessionList() {
  const { t } = useLanguage();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch('/api/sessions');
        if (!res.ok) { setLoading(false); return; }
        const data = await res.json();
        setSessions(data.sessions || []);
      } catch (err) {
        console.error('Failed to load sessions:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, []);

  if (loading) {
    return <div className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>{t('common.loading')}</div>;
  }

  if (sessions.length === 0) {
    return <p className="text-xs text-center" style={{ color: 'var(--text-subtle)' }}>{t('home.noSessions')}</p>;
  }

  const phaseStyles: Record<string, React.CSSProperties> = {
    write: { background: 'rgba(37,99,235,0.08)', color: '#2563eb' },
    vote: { background: 'rgba(255,56,92,0.08)', color: '#ff385c' },
    discuss: { background: 'rgba(234,88,12,0.08)', color: '#ea580c' },
    done: { background: 'rgba(22,163,74,0.1)', color: '#16a34a' },
  };

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto">
      {sessions.map(session => (
        <Link
          key={session.id}
          href={`/session/${session.id}/view`}
          className="block p-3 rounded-lg transition-all hover:bg-gray-50"
          style={{ background: '#f7f7f7', border: '1px solid #dddddd', textDecoration: 'none' }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-500 text-sm truncate" style={{ color: '#222222' }}>
                {session.name}
              </p>
              <p className="text-xs font-mono truncate" style={{ color: '#929292' }}>
                {session.id}
              </p>
            </div>
            <span className="text-xs px-2 py-1 rounded font-500 uppercase flex-shrink-0"
              style={{ ...(phaseStyles[session.phase] || { background: '#f7f7f7', color: '#6a6a6a' }), letterSpacing: '0.05em' }}>
              {session.phase}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
