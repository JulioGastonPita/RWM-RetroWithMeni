'use client';

import { useLanguage } from '@/components/providers/LanguageProvider';

interface VoteButtonProps {
  count: number;
  hasVoted: boolean;
  votesRemaining: number;
  onVote: () => void;
  onUnvote: () => void;
}

export function VoteButton({ count, hasVoted, votesRemaining, onVote, onUnvote }: VoteButtonProps) {
  const { t } = useLanguage();
  const canVote = !hasVoted && votesRemaining > 0;

  const titleText = hasVoted ? t('board.removeVote') : votesRemaining === 0 ? t('board.noVotesLeft') : t('board.voteForCard');

  return (
    <button
      onClick={hasVoted ? onUnvote : onVote}
      disabled={!canVote && !hasVoted}
      title={titleText}
      className="flex items-center gap-1 text-xs px-2 py-1 rounded-full font-500 transition-all hover:-translate-y-px"
      style={
        hasVoted
          ? { background: '#ff385c', color: '#ffffff', border: 'none', boxShadow: '0 2px 6px rgba(255,56,92,0.25)' }
          : canVote
          ? { background: '#ffffff', color: '#6a6a6a', border: '1px solid #dddddd' }
          : { background: '#f7f7f7', color: '#929292', border: '1px solid #f7f7f7', cursor: 'not-allowed' }
      }
    >
      <span>▲</span>
      <span>{count}</span>
    </button>
  );
}
