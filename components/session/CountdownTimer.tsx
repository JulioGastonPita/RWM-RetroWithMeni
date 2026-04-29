'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';

const DURATION_OPTIONS = [5, 10, 15] as const;

interface CountdownTimerProps {
  sessionId: string;
  timerEndsAt: number | null;
  onTimerSet: (durationMs: number | null) => void;
}

export function CountdownTimer({ sessionId, timerEndsAt, onTimerSet }: CountdownTimerProps) {
  const { t } = useLanguage();
  const [selectedMinutes, setSelectedMinutes] = useState<number>(5);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isRunning = timerEndsAt !== null;

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (!timerEndsAt) {
      setTimeLeft(null);
      return;
    }

    const update = () => {
      const remaining = timerEndsAt - Date.now();
      setTimeLeft(remaining > 0 ? remaining : 0);
    };
    update();
    intervalRef.current = setInterval(update, 500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerEndsAt]);

  function handleToggle() {
    if (isRunning) {
      onTimerSet(null);
    } else {
      onTimerSet(selectedMinutes * 60 * 1000);
    }
  }

  function formatTime(ms: number) {
    const totalSeconds = Math.ceil(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  const displayMs = timeLeft ?? selectedMinutes * 60 * 1000;
  const isCritical = timeLeft !== null && timeLeft < 30000;
  const isDone = timeLeft === 0;

  return (
    <div className="py-3 flex justify-center" style={{ borderTop: '1px solid #dddddd', background: '#ffffff' }}>
      <div className="flex items-center gap-4 px-6 py-2.5 rounded-2xl"
        style={{ background: '#f7f7f7', border: '1px solid #dddddd', boxShadow: 'rgba(0,0,0,0.04) 0px 2px 6px' }}>
        {/* Duration options */}
        <div className="flex gap-1.5">
          {DURATION_OPTIONS.map(min => (
            <button
              key={min}
              onClick={() => setSelectedMinutes(min)}
              disabled={isRunning}
              className="text-xs px-3 py-1.5 rounded-lg font-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={selectedMinutes === min && !isRunning
                ? { background: '#222222', color: '#ffffff' }
                : { border: '1px solid #dddddd', color: '#6a6a6a', background: '#ffffff' }}
            >
              {min}m
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-6" style={{ background: '#dddddd' }} />

        {/* Countdown display */}
        <span
          className="text-3xl font-mono font-bold w-20 text-center tabular-nums transition-colors"
          style={{ color: isDone ? '#ff385c' : isCritical ? '#c13515' : '#222222' }}
        >
          {isDone ? '0:00' : formatTime(displayMs)}
        </span>

        {/* Divider */}
        <div className="w-px h-6" style={{ background: '#dddddd' }} />

        {/* Start / Stop button */}
        <button
          onClick={handleToggle}
          className="text-sm font-600 px-5 py-2 rounded-lg transition-all hover:opacity-90"
          style={isRunning
            ? { background: '#c13515', color: '#ffffff' }
            : { background: '#ff385c', color: '#ffffff' }}
        >
          {isRunning ? t('timer.stop') : isDone ? t('timer.restart') : t('timer.start')}
        </button>
      </div>
    </div>
  );
}
