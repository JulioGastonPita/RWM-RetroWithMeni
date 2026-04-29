'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/providers/LanguageProvider';

function focusEl(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = '#222222';
  e.target.style.boxShadow = '0 0 0 2px #222222';
}
function blurEl(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = '#dddddd';
  e.target.style.boxShadow = 'none';
}

export function LookupSessionForm() {
  const router = useRouter();
  const { t } = useLanguage();
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = sessionId.trim();
    if (!id) return;
    setLoading(true);
    setError('');
    const res = await fetch(`/api/sessions/${id}`);
    if (!res.ok) {
      setError(t('form.sessionNotFound'));
      setLoading(false);
      return;
    }
    router.push(`/session/${id}/view`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={sessionId}
          onChange={e => setSessionId(e.target.value)}
          placeholder={t('form.pasteSessionId')}
          className="flex-1 px-3 py-2.5 text-sm rounded-lg outline-none transition-all"
          style={{ border: '1px solid #dddddd', background: '#ffffff', color: '#222222' }}
          onFocus={focusEl}
          onBlur={blurEl}
        />
        <button
          type="submit"
          disabled={loading || !sessionId.trim()}
          className="text-sm font-500 px-4 py-2 rounded-lg disabled:opacity-50 transition-all hover:bg-gray-50"
          style={{ border: '1px solid #dddddd', background: '#ffffff', color: '#6a6a6a' }}
        >
          {loading ? '…' : t('form.view')}
        </button>
      </div>
      {error && <p className="text-xs px-3 py-1.5 rounded-lg" style={{ color: '#c13515', background: '#fff0f0' }}>{error}</p>}
    </form>
  );
}
