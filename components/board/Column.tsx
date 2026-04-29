'use client';

import { useState } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Card, CardData } from './Card';
import { CardForm } from './CardForm';

interface ColumnDefinition {
  id: string;
  label: string;
  emoji: string;
  accent: string;
}

interface ColumnProps {
  column: ColumnDefinition;
  cards: CardData[];
  phase: string;
  format: string;
  votesRemaining: number;
  highlightedCardId: string | null;
  onAddCard: (columnId: string, content: string) => void;
  onEditCard: (cardId: string, content: string) => void;
  onDeleteCard: (cardId: string) => void;
  onVote: (cardId: string) => void;
  onUnvote: (cardId: string) => void;
}

export function Column({
  column,
  cards,
  phase,
  format,
  votesRemaining,
  highlightedCardId,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onVote,
  onUnvote,
}: ColumnProps) {
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);

  const sortedCards = phase === 'discuss'
    ? [...cards].sort((a, b) => b.voteCount - a.voteCount)
    : cards;

  return (
    <div className="flex flex-col overflow-hidden min-w-0"
      style={{ borderRadius: '14px', border: `1px solid ${column.accent}30`, boxShadow: 'var(--panel-shadow)', background: '#ffffff' }}>
      <div className="px-4 py-3 flex items-center justify-between"
        style={{ background: `${column.accent}0d`, borderBottom: `1px solid ${column.accent}20` }}>
        <span className="font-600 text-[13px] tracking-[0.01em]" style={{ color: '#222222' }}>
          {column.emoji} {t(`formats.${format}.${column.id}`) || column.label}
        </span>
        <span className="text-[11px] font-600 px-2 py-0.5 rounded"
          style={{ background: `${column.accent}15`, color: column.accent }}>
          {cards.length}
        </span>
      </div>

      <div className="flex-1 p-3 space-y-2 overflow-y-auto" style={{ minHeight: '200px', maxHeight: '60vh', background: '#f7f7f7' }}>
        {sortedCards.map(card => (
          <Card
            key={card.id}
            card={card}
            phase={phase}
            isHighlighted={card.id === highlightedCardId}
            votesRemaining={votesRemaining}
            onEdit={onEditCard}
            onDelete={onDeleteCard}
            onVote={onVote}
            onUnvote={onUnvote}
          />
        ))}

        {phase === 'write' && (
          showForm ? (
            <div className="rounded-xl p-2" style={{ background: '#ffffff', border: '1px solid #dddddd' }}>
              <CardForm
                onSubmit={(content) => {
                  onAddCard(column.id, content);
                  setShowForm(false);
                }}
                onCancel={() => setShowForm(false)}
                placeholder={t('board.addTo', { column: t(`formats.${format}.${column.id}`) || column.label })}
              />
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full text-[13px] font-500 rounded-xl py-3 transition-all border-2 border-dashed hover:border-[#ff385c] hover:text-[#ff385c]"
              style={{ color: '#929292', borderColor: '#dddddd' }}
            >
              + {t('board.addCard')}
            </button>
          )
        )}
      </div>
    </div>
  );
}
