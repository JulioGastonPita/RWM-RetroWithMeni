'use client';

import { useEffect, useReducer, useState } from 'react';
import { useSocket } from '@/components/providers/SocketProvider';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Column } from './Column';
import { CardData } from './Card';
import { PhaseControls } from '@/components/session/PhaseControls';
import { ParticipantList } from '@/components/session/ParticipantList';
import { CountdownTimer } from '@/components/session/CountdownTimer';

interface ColumnDef {
  id: string;
  label: string;
  emoji: string;
  accent: string;
}

interface Participant {
  participantId: string;
  displayName: string;
  isFacilitator: boolean;
  joinedAt: number;
}

interface SessionData {
  id: string;
  name: string;
  format: string;
  phase: string;
  maxVotes: number;
  timerEndsAt: number | null;
}

interface BoardState {
  session: SessionData;
  columns: ColumnDef[];
  cards: CardData[];
  participants: Participant[];
  votesRemaining: number;
  highlightedCardId: string | null;
}

type BoardAction =
  | { type: 'SESSION_STATE'; payload: { session: SessionData; columns: ColumnDef[]; cards: CardData[]; participants: Participant[]; myVotesRemaining: number } }
  | { type: 'CARD_ADDED'; payload: CardData }
  | { type: 'CARD_UPDATED'; payload: CardData }
  | { type: 'CARD_DELETED'; payload: { cardId: string } }
  | { type: 'VOTE_UPDATED'; payload: { cardId: string; voteCount: number; voterIds: string[] } }
  | { type: 'PHASE_CHANGED'; payload: { phase: string; cards: CardData[]; session: SessionData } }
  | { type: 'PARTICIPANTS_UPDATED'; payload: Participant[] }
  | { type: 'TIMER_UPDATED'; payload: { timerEndsAt: number | null } }
  | { type: 'CARDS_CLEARED'; payload: { columnId: string | null } }
  | { type: 'VOTES_REMAINING'; payload: { votesRemaining: number } }
  | { type: 'CARD_HIGHLIGHTED'; payload: { cardId: string | null } };

function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case 'SESSION_STATE':
      return {
        ...state,
        session: action.payload.session,
        columns: action.payload.columns,
        cards: action.payload.cards,
        participants: action.payload.participants,
        votesRemaining: action.payload.myVotesRemaining,
      };
    case 'CARD_ADDED':
      return { ...state, cards: [...state.cards, action.payload] };
    case 'CARD_UPDATED':
      return {
        ...state,
        cards: state.cards.map(c => c.id === action.payload.id ? action.payload : c),
      };
    case 'CARD_DELETED':
      return { ...state, cards: state.cards.filter(c => c.id !== action.payload.cardId) };
    case 'VOTE_UPDATED':
      return {
        ...state,
        cards: state.cards.map(c => {
          if (c.id !== action.payload.cardId) return c;
          return {
            ...c,
            voteCount: action.payload.voteCount,
            hasVoted: action.payload.voterIds.includes(
              state.participants.find(p => p.isFacilitator === false)?.participantId || ''
            ),
          };
        }),
      };
    case 'PHASE_CHANGED':
      return {
        ...state,
        session: action.payload.session,
        cards: action.payload.cards,
        highlightedCardId: null,
      };
    case 'PARTICIPANTS_UPDATED':
      return { ...state, participants: action.payload };
    case 'TIMER_UPDATED':
      return {
        ...state,
        session: { ...state.session, timerEndsAt: action.payload.timerEndsAt },
      };
    case 'CARDS_CLEARED':
      return {
        ...state,
        cards: action.payload.columnId
          ? state.cards.filter(c => c.columnId !== action.payload.columnId)
          : [],
      };
    case 'VOTES_REMAINING':
      return { ...state, votesRemaining: action.payload.votesRemaining };
    case 'CARD_HIGHLIGHTED':
      return { ...state, highlightedCardId: action.payload.cardId };
    default:
      return state;
  }
}

interface RetroBoardProps {
  sessionId: string;
  initialSession: SessionData;
  initialColumns: ColumnDef[];
}

export function RetroBoard({ sessionId, initialSession, initialColumns }: RetroBoardProps) {
  const { socket, isConnected, participantId, isFacilitator, facilitatorToken, displayName, setDisplayName } = useSocket();
  const { t } = useLanguage();
  const [nameInput, setNameInput] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  const [state, dispatch] = useReducer(boardReducer, {
    session: initialSession,
    columns: initialColumns,
    cards: [],
    participants: [],
    votesRemaining: initialSession.maxVotes,
    highlightedCardId: null,
  });

  useEffect(() => {
    if (!socket) return;

    socket.on('session_state', (data) => dispatch({ type: 'SESSION_STATE', payload: data }));
    socket.on('card_added', (card) => dispatch({ type: 'CARD_ADDED', payload: card }));
    socket.on('card_updated', (card) => dispatch({ type: 'CARD_UPDATED', payload: card }));
    socket.on('card_deleted', ({ cardId }) => dispatch({ type: 'CARD_DELETED', payload: { cardId } }));
    socket.on('vote_updated', (data) => dispatch({ type: 'VOTE_UPDATED', payload: data }));
    socket.on('phase_changed', (data) => dispatch({ type: 'PHASE_CHANGED', payload: data }));
    socket.on('timer_updated', ({ timerEndsAt }) => dispatch({ type: 'TIMER_UPDATED', payload: { timerEndsAt } }));
    socket.on('cards_cleared', ({ columnId }) => dispatch({ type: 'CARDS_CLEARED', payload: { columnId } }));
    socket.on('votes_remaining', ({ votesRemaining }) => dispatch({ type: 'VOTES_REMAINING', payload: { votesRemaining } }));
    socket.on('card_highlighted', ({ cardId }) => dispatch({ type: 'CARD_HIGHLIGHTED', payload: { cardId } }));

    socket.on('participant_joined', (p) => {
      dispatch({ type: 'PARTICIPANTS_UPDATED', payload: [...state.participants.filter(x => x.participantId !== p.participantId), p] });
    });
    socket.on('participant_left', ({ participantId: pid }) => {
      dispatch({ type: 'PARTICIPANTS_UPDATED', payload: state.participants.filter(p => p.participantId !== pid) });
    });
    socket.on('participant_renamed', ({ participantId: pid, displayName: newName }) => {
      dispatch({
        type: 'PARTICIPANTS_UPDATED',
        payload: state.participants.map(p => p.participantId === pid ? { ...p, displayName: newName } : p),
      });
    });

    return () => {
      socket.off('session_state');
      socket.off('card_added');
      socket.off('card_updated');
      socket.off('card_deleted');
      socket.off('vote_updated');
      socket.off('phase_changed');
      socket.off('timer_updated');
      socket.off('cards_cleared');
      socket.off('votes_remaining');
      socket.off('card_highlighted');
      socket.off('participant_joined');
      socket.off('participant_left');
      socket.off('participant_renamed');
    };
  }, [socket, state.participants]);

  // Fix: update hasVoted per participant after vote_updated using participantId
  useEffect(() => {
    if (!socket) return;
    const handler = (data: { cardId: string; voteCount: number; voterIds: string[] }) => {
      dispatch({
        type: 'CARD_UPDATED',
        payload: {
          ...state.cards.find(c => c.id === data.cardId)!,
          voteCount: data.voteCount,
          hasVoted: data.voterIds.includes(participantId),
        },
      });
    };
    socket.on('vote_updated', handler);
    return () => { socket.off('vote_updated', handler); };
  }, [socket, state.cards, participantId]);

  function handleAddCard(columnId: string, content: string) {
    socket?.emit('card_add', { sessionId, columnId, content });
  }

  function handleEditCard(cardId: string, content: string) {
    socket?.emit('card_edit', { sessionId, cardId, content });
  }

  function handleDeleteCard(cardId: string) {
    socket?.emit('card_delete', { sessionId, cardId });
  }

  function handleVote(cardId: string) {
    socket?.emit('card_vote', { sessionId, cardId });
  }

  function handleUnvote(cardId: string) {
    socket?.emit('card_unvote', { sessionId, cardId });
  }

  function handlePhaseAdvance(targetPhase: string, token: string) {
    socket?.emit('phase_advance', { sessionId, facilitatorToken: token, targetPhase });
  }

  function handleTimerSet(durationMs: number | null, token: string) {
    socket?.emit('timer_set', { sessionId, facilitatorToken: token, durationMs });
  }

  function handleSharedTimerSet(durationMs: number | null) {
    socket?.emit('shared_timer_set', { sessionId, durationMs });
  }

  function handleClearCards(token: string) {
    socket?.emit('cards_clear', { sessionId, facilitatorToken: token });
  }

  async function handleExport(token: string) {
    const res = await fetch(`/api/sessions/${sessionId}/export`, {
      headers: { 'x-facilitator-token': token },
    });
    if (!res.ok) return;
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `retro-${sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleHighlight(cardId: string) {
    if (isFacilitator && facilitatorToken && state.session.phase === 'discuss') {
      socket?.emit('discuss_highlight', { sessionId, facilitatorToken, cardId });
    }
  }

  function handleShareUrl() {
  const url = window.location.href;
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    navigator.clipboard.writeText(url)
      .then(() => {
        showToast();
      })
      .catch(() => {
        fallbackCopy(url);
        showToast();
      });
  } else {
    fallbackCopy(url);
    showToast();
  }
}

// Función auxiliar para no repetir lógica
function showToast() {
  setShareToast(true);
  setTimeout(() => setShareToast(false), 2000);
}

  
  function fallbackCopy(text: string) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }

  const cardsForColumn = (colId: string) => state.cards.filter(c => c.columnId === colId);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="px-4 py-3 flex flex-col gap-2 relative z-10"
        style={{ background: 'var(--surface)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', boxShadow: 'var(--header-shadow)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#ff385c' }}>
                <span className="text-white font-bold text-[10px]">RWM</span>
              </div>
            </div>
            <h2 className="text-sm font-semibold truncate max-w-xs" style={{ color: 'var(--text)' }}>{state.session.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: isConnected ? '#16a34a' : '#c13515' }} />
            <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>{isConnected ? t('board.connected') : t('board.disconnected')}</span>
            <button
              onClick={() => { setNameInput(displayName); setShowNameModal(true); }}
              className="text-xs px-3 py-1.5 rounded-lg font-500 transition-all hover:bg-gray-50"
              style={{ border: '1px solid #dddddd', color: '#6a6a6a', background: '#ffffff' }}
              title={t('board.changeName')}
            >
              👥 {displayName || t('board.setName')}
            </button>
            <button
              onClick={handleShareUrl}
              className="text-xs px-3 py-1.5 rounded-lg font-600 transition-all hover:opacity-90 relative"
              style={{ background: '#ff385c', color: '#ffffff' }}
            >
              🔗 {t('board.share')}
              {shareToast && (
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs px-2 py-1 rounded-lg whitespace-nowrap" style={{ background: '#222222', color: '#ffffff' }}>
                  {t('board.copied')}
                </span>
              )}
            </button>
            <button
              onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/login'; }}
              className="text-xs px-3 py-1.5 rounded-lg transition-all hover:bg-gray-50"
              style={{ border: '1px solid #dddddd', color: '#6a6a6a', background: '#ffffff' }}
              title="Logout"
            >
              ↪ {t('board.logout') || 'Logout'}
            </button>
          </div>
        </div>

        <PhaseControls
          sessionId={sessionId}
          phase={state.session.phase}
          timerEndsAt={state.session.timerEndsAt}
          maxVotes={state.session.maxVotes}
          votesRemaining={state.votesRemaining}
          isFacilitator={isFacilitator}
          facilitatorToken={facilitatorToken}
          onPhaseAdvance={handlePhaseAdvance}
          onTimerSet={handleTimerSet}
          onClearCards={handleClearCards}
          onExport={handleExport}
        />

        <ParticipantList participants={state.participants} />
      </header>

      {/* Board */}
      <main className="flex-1 overflow-auto p-4 relative z-10">
        {state.session.phase === 'done' ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="text-5xl">🎉</div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{t('board.retroComplete')}</h2>
            <p style={{ color: 'var(--text-muted)' }}>{t('board.greatWork')}</p>
            {isFacilitator && facilitatorToken && (
              <button
                onClick={() => handleExport(facilitatorToken)}
                className="px-6 py-2.5 rounded-lg font-600 transition-all hover:opacity-90"
                style={{ background: '#ff385c', color: '#ffffff' }}
              >
                {t('board.downloadExport')}
              </button>
            )}
          </div>
        ) : (
          <div
            className="grid gap-4 h-full"
            style={{ gridTemplateColumns: `repeat(${state.columns.length}, minmax(0, 1fr))` }}
          >
            {state.columns.map(col => (
              <Column
                key={col.id}
                column={col}
                cards={cardsForColumn(col.id)}
                phase={state.session.phase}
                format={state.session.format}
                votesRemaining={state.votesRemaining}
                highlightedCardId={state.highlightedCardId}
                onAddCard={handleAddCard}
                onEditCard={handleEditCard}
                onDeleteCard={handleDeleteCard}
                onVote={handleVote}
                onUnvote={handleUnvote}
              />
            ))}
          </div>
        )}
      </main>

      {/* Discuss: click on cards to highlight — hint bar */}
      {state.session.phase === 'discuss' && isFacilitator && (
        <div className="text-xs text-center py-2" style={{ background: '#fff9f5', borderTop: '1px solid #fde8d3', color: '#c45500' }}>
          {t('board.discussionHint')}
        </div>
      )}

      {/* Countdown Timer */}
      <CountdownTimer
        sessionId={sessionId}
        timerEndsAt={state.session.timerEndsAt}
        onTimerSet={handleSharedTimerSet}
      />

      {/* Name modal */}
      {showNameModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'var(--modal-overlay)', backdropFilter: 'blur(10px)' }}>
          <div className="p-6 w-80"
            style={{ background: 'var(--surface-solid)', borderRadius: '24px', boxShadow: 'var(--modal-shadow)', border: '1px solid var(--border)' }}>
            <h3 className="text-[17px] font-extrabold mb-4" style={{ color: 'var(--text)' }}>{t('board.setDisplayName')}</h3>
            <input
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { setDisplayName(nameInput); setShowNameModal(false); }
                if (e.key === 'Escape') setShowNameModal(false);
              }}
              maxLength={30}
              className="w-full px-3 py-2.5 mb-4 text-sm rounded-lg outline-none transition-all"
              style={{ border: '1px solid #dddddd', background: '#ffffff', color: '#222222' }}
              onFocus={e => { e.target.style.borderColor = '#222222'; e.target.style.boxShadow = '0 0 0 2px #222222'; }}
              onBlur={e => { e.target.style.borderColor = '#dddddd'; e.target.style.boxShadow = 'none'; }}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNameModal(false)}
                className="text-sm px-3 py-1.5 rounded-xl transition-colors"
                style={{ color: 'var(--text-muted)' }}>
                ✕ {t('board.cancel')}
              </button>
              <button
                onClick={() => { setDisplayName(nameInput); setShowNameModal(false); }}
                disabled={!nameInput.trim()}
                className="text-sm text-white px-4 py-1.5 rounded-xl font-semibold disabled:opacity-50 transition-all hover:-translate-y-px"
                style={{ background: '#ff385c', color: '#ffffff', borderRadius: '8px' }}
              >
                ✓ {t('board.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
