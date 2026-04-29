'use client';

import { useState } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';

const PHASES = ['write', 'vote', 'discuss', 'done'] as const;
type Phase = typeof PHASES[number];

interface PhaseControlsProps {
  sessionId: string;
  phase: string;
  timerEndsAt: number | null;
  maxVotes: number;
  votesRemaining: number;
  isFacilitator: boolean;
  facilitatorToken: string | null;
  onPhaseAdvance: (targetPhase: string, token: string) => void;
  onTimerSet: (durationMs: number | null, token: string) => void;
  onClearCards: (token: string) => void;
  onExport: (token: string) => void;
}

export function PhaseControls({
  sessionId,
  phase,
  timerEndsAt,
  maxVotes,
  votesRemaining,
  isFacilitator,
  facilitatorToken,
  onPhaseAdvance,
  onTimerSet,
  onClearCards,
  onExport,
}: PhaseControlsProps) {
  const { t } = useLanguage();
  const [confirmClear, setConfirmClear] = useState(false);

  const PHASE_LABELS: Record<Phase, string> = {
    write: `✍️ ${t('phase.write')}`,
    vote: `🗳️ ${t('phase.vote')}`,
    discuss: `💬 ${t('phase.discuss')}`,
    done: `✅ ${t('phase.done')}`,
  };

  const NEXT_PHASE_LABEL: Record<string, string> = {
    write: t('phase.revealAndVote'),
    vote: t('phase.startDiscussion'),
    discuss: t('phase.finishSession'),
  };

  const currentPhaseIdx = PHASES.indexOf(phase as Phase);
  const nextPhase = PHASES[currentPhaseIdx + 1] as Phase | undefined;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
      {/* Phase stepper */}
      <div className="flex items-center gap-1">
        {PHASES.filter(p => p !== 'done').map((p, i) => (
          <div key={p} className="flex items-center gap-1">
            <span
              className="text-xs px-2 py-1 rounded font-500"
              style={
                p === phase
                  ? { background: '#ff385c', color: '#ffffff' }
                  : PHASES.indexOf(p) < currentPhaseIdx
                  ? { background: 'rgba(255,56,92,0.08)', color: '#ff385c' }
                  : { background: '#f7f7f7', color: '#929292' }
              }
            >
              {PHASE_LABELS[p]}
            </span>
            {i < 2 && <span className="text-xs" style={{ color: '#929292' }}>→</span>}
          </div>
        ))}
        {phase === 'done' && (
          <span className="text-xs px-2 py-1 rounded font-500" style={{ background: '#ff385c', color: '#ffffff' }}>
            {PHASE_LABELS.done}
          </span>
        )}
      </div>

      {/* Votes remaining badge (non-facilitator) */}
      {!isFacilitator && phase === 'vote' && (
        <span className="text-xs px-2 py-1 rounded font-500" style={{ background: 'rgba(234,88,12,0.08)', color: '#ea580c' }}>
          🗳️ {votesRemaining} {votesRemaining !== 1 ? t('board.votesRemaining') : t('board.voteRemaining')}
        </span>
      )}

      {/* Facilitator controls */}
      {isFacilitator && facilitatorToken && (
        <div className="flex flex-wrap gap-2 ml-auto">
          {/* Export */}
          {(phase === 'discuss' || phase === 'done') && (
            <button
              onClick={() => onExport(facilitatorToken)}
              className="text-xs px-3 py-1.5 font-500 transition-all hover:opacity-80 rounded-lg"
              style={{ border: '1px solid #ff385c', color: '#ff385c', background: 'transparent' }}
            >
              {t('phase.exportJson')}
            </button>
          )}

          {/* Clear cards */}
          {phase === 'write' && (
            confirmClear ? (
              <div className="flex gap-1">
                <button
                  onClick={() => { onClearCards(facilitatorToken); setConfirmClear(false); }}
                  className="text-xs px-3 py-1.5 rounded-lg font-500 transition-all hover:opacity-90"
                  style={{ background: '#c13515', color: '#ffffff' }}
                >
                  {t('phase.confirmClear')}
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="text-xs px-3 py-1.5 rounded-lg font-500 transition-all hover:bg-gray-50"
                  style={{ border: '1px solid #dddddd', color: '#6a6a6a', background: 'transparent' }}
                >
                  {t('phase.cancel')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="text-xs px-3 py-1.5 rounded-lg font-500 transition-all hover:opacity-80"
                style={{ border: '1px solid rgba(193,53,21,0.4)', color: '#c13515', background: 'transparent' }}
              >
                {t('phase.clearCards')}
              </button>
            )
          )}

          {/* Advance phase */}
          {nextPhase && (
            <button
              onClick={() => onPhaseAdvance(nextPhase, facilitatorToken)}
              className="text-xs px-3 py-1.5 rounded-lg font-600 transition-all hover:opacity-90"
              style={{ background: '#ff385c', color: '#ffffff' }}
            >
              {NEXT_PHASE_LABEL[phase]} →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
