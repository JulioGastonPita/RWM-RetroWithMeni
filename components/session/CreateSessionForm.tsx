'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RETRO_FORMATS } from '@/lib/retro-formats';
import { useLanguage } from '@/components/providers/LanguageProvider';

const FORMAT_IDS = Object.keys(RETRO_FORMATS) as Array<keyof typeof RETRO_FORMATS>;

function focusEl(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.target.style.borderColor = '#222222';
  e.target.style.boxShadow = '0 0 0 2px #222222';
}
function blurEl(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.target.style.borderColor = '#dddddd';
  e.target.style.boxShadow = 'none';
}

export function CreateSessionForm() {
  const router = useRouter();
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [format, setFormat] = useState('went-well-improve');
  const [maxVotes, setMaxVotes] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, format, maxVotes }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t('form.failedToCreate'));
        return;
      }

      const { sessionId, facilitatorToken } = await res.json();
      localStorage.setItem(`facilitator_${sessionId}`, facilitatorToken);
      router.push(`/session/${sessionId}`);
    } catch {
      setError(t('form.networkError'));
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    border: '1px solid #dddddd',
    borderRadius: '8px',
    background: '#ffffff',
    color: '#222222',
    outline: 'none',
    transition: 'border-color 0.1s, box-shadow 0.1s',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-500 mb-1.5" style={{ color: '#222222' }}>
          {t('form.sessionName')}
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('form.sessionNamePlaceholder')}
          required
          maxLength={100}
          className="w-full px-3 py-2.5 text-sm"
          style={inputStyle}
          onFocus={focusEl}
          onBlur={blurEl}
        />
      </div>

      <div>
        <label className="block text-sm font-500 mb-1.5" style={{ color: '#222222' }}>
          {t('form.format')}
        </label>
        <div className="grid grid-cols-1 gap-2">
          {FORMAT_IDS.map(id => {
            const fmt = RETRO_FORMATS[id];
            const selected = format === id;
            return (
              <label
                key={id}
                className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all"
                style={{
                  border: selected ? '1.5px solid #ff385c' : '1.5px solid #dddddd',
                  background: selected ? 'rgba(255,56,92,0.04)' : '#ffffff',
                  boxShadow: selected ? '0 0 0 3px rgba(255,56,92,0.08)' : 'none',
                }}
              >
                <input
                  type="radio"
                  name="format"
                  value={id}
                  checked={selected}
                  onChange={() => setFormat(id)}
                  className="mt-0.5 accent-[#ff385c]"
                />
                <div>
                  <div className="font-500 text-sm" style={{ color: '#222222' }}>{t(`formats.${id}.label`)}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#6a6a6a' }}>{t(`formats.${id}.description`)}</div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {fmt.columns.map(col => (
                      <span
                        key={col.id}
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ background: `${col.accent}12`, color: col.accent, border: `1px solid ${col.accent}30` }}
                      >
                        {col.emoji} {col.label}
                      </span>
                    ))}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-500 mb-1.5" style={{ color: '#222222' }}>
          {t('form.votesPerPerson')}
        </label>
        <select
          value={maxVotes}
          onChange={e => setMaxVotes(Number(e.target.value))}
          className="px-3 py-2.5 text-sm"
          style={inputStyle}
          onFocus={focusEl}
          onBlur={blurEl}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 10].map(n => (
            <option key={n} value={n}>{n} {n !== 1 ? t('form.votes') : t('form.vote')}</option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-sm px-3 py-2 rounded-lg" style={{ color: '#c13515', background: '#fff0f0', border: '1px solid #fcc' }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="w-full py-3 px-4 text-sm font-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90"
        style={{ background: '#ff385c', color: '#ffffff' }}
      >
        {loading ? t('form.creating') : t('form.createSession')}
      </button>
    </form>
  );
}
