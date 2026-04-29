'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface CardFormProps {
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  initialValue?: string;
  placeholder?: string;
  submitLabel?: string;
}

export function CardForm({
  onSubmit,
  onCancel,
  initialValue = '',
  placeholder,
  submitLabel,
}: CardFormProps) {
  const { t } = useLanguage();
  const [value, setValue] = useState(initialValue);
  const finalPlaceholder = placeholder ?? t('board.addCard');
  const finalSubmitLabel = submitLabel ?? t('board.addCard');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    onSubmit(value.trim());
    setValue('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as unknown as React.FormEvent); }
    if (e.key === 'Escape' && onCancel) onCancel();
  }

  function focusTA(e: React.FocusEvent<HTMLTextAreaElement>) {
    e.target.style.borderColor = '#222222';
    e.target.style.boxShadow = '0 0 0 2px #222222';
  }
  function blurTA(e: React.FocusEvent<HTMLTextAreaElement>) {
    e.target.style.borderColor = '#dddddd';
    e.target.style.boxShadow = 'none';
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={finalPlaceholder}
        rows={3}
        maxLength={500}
        className="w-full px-3 py-2 text-sm rounded-lg outline-none resize-none transition-all"
        style={{ border: '1px solid #dddddd', background: '#ffffff', color: '#222222' }}
        onFocus={focusTA}
        onBlur={blurTA}
      />
      <div className="flex gap-2 mt-1 justify-end">
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="text-sm px-2 py-1 rounded-lg transition-colors hover:bg-gray-50"
            style={{ color: '#6a6a6a' }}>
            ✕ {t('board.cancel')}
          </button>
        )}
        <button
          type="submit"
          disabled={!value.trim()}
          className="text-sm px-3 py-1 rounded-lg font-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:opacity-90"
          style={{ background: '#ff385c', color: '#ffffff' }}
        >
          ✓ {finalSubmitLabel}
        </button>
      </div>
    </form>
  );
}
