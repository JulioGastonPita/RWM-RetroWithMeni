'use client';

import { useState } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { VoteButton } from './VoteButton';
import { CardForm } from './CardForm';

export interface CardData {
  id: string;
  columnId: string;
  authorId: string;
  authorName: string;
  content: string;
  isHidden: boolean;
  isOwn: boolean;
  voteCount: number;
  hasVoted: boolean;
  position: number;
  createdAt: number;
}

interface CardProps {
  card: CardData;
  phase: string;
  isHighlighted: boolean;
  votesRemaining: number;
  onEdit?: (cardId: string, content: string) => void;
  onDelete?: (cardId: string) => void;
  onVote?: (cardId: string) => void;
  onUnvote?: (cardId: string) => void;
}

export function Card({
  card,
  phase,
  isHighlighted,
  votesRemaining,
  onEdit,
  onDelete,
  onVote,
  onUnvote,
}: CardProps) {
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);

  const canEdit = card.isOwn && phase === 'write' && onEdit;
  const canDelete = card.isOwn && phase === 'write' && onDelete;
  const showVote = phase === 'vote' && onVote && onUnvote;

  if (card.isHidden && !card.isOwn) {
    return (
      <div className={`rounded-xl p-3 transition-all ${isHighlighted ? 'ring-2 ring-[#ff385c]' : ''}`}
        style={{ background: '#f7f7f7', border: '1px solid #dddddd', borderLeft: '3px solid #dddddd', boxShadow: 'var(--card-shadow)' }}>
        <div className="h-2.5 rounded animate-pulse mb-2 w-3/4" style={{ background: '#dddddd' }} />
        <div className="h-2.5 rounded animate-pulse w-1/2" style={{ background: '#dddddd' }} />
        <p className="text-xs mt-2 italic" style={{ color: '#929292' }}>{t('board.hiddenUntilReveal')}</p>
      </div>
    );
  }

  if (editing && canEdit) {
    return (
      <div className="rounded-xl p-3" style={{ background: '#ffffff', border: '1px solid #dddddd', boxShadow: '0 0 0 2px #222222' }}>
        <CardForm
          initialValue={card.content}
          onSubmit={(content) => { onEdit!(card.id, content); setEditing(false); }}
          onCancel={() => setEditing(false)}
          submitLabel={t('board.save')}
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl p-3 transition-all ${isHighlighted ? 'scale-[1.02] ring-2 ring-[#ff385c]' : 'hover:-translate-y-0.5'}`}
      style={{
        background: '#ffffff',
        border: '1px solid #dddddd',
        borderLeft: '3px solid #ff385c',
        boxShadow: isHighlighted ? '0 4px 12px rgba(255,56,92,0.15)' : 'var(--card-shadow)',
      }}
    >
      <p className="text-[13.5px] whitespace-pre-wrap break-words leading-relaxed" style={{ color: '#222222' }}>{card.content}</p>

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs" style={{ color: '#929292' }}>{card.authorName}</span>

        <div className="flex items-center gap-1">
          {showVote && (
            <VoteButton
              count={card.voteCount}
              hasVoted={card.hasVoted}
              votesRemaining={votesRemaining}
              onVote={() => onVote!(card.id)}
              onUnvote={() => onUnvote!(card.id)}
            />
          )}
          {phase === 'discuss' && (
            <span className="flex items-center gap-1 text-xs font-500"
              style={{ background: 'rgba(255,56,92,0.08)', color: '#ff385c', borderRadius: '20px', padding: '2px 8px' }}>
              👍 {card.voteCount}
            </span>
          )}
          {canEdit && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs p-1 rounded-full transition-colors hover:text-[#222222]"
              style={{ color: '#929292' }}
              title={t('board.editCard')}
            >
              ✏
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete!(card.id)}
              className="text-sm font-bold p-1 rounded-full transition-colors hover:text-[#c13515]"
              style={{ color: '#929292' }}
              title={t('board.deleteCard')}
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
