'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  participantId: string;
  isFacilitator: boolean;
  facilitatorToken: string | null;
  displayName: string;
  setDisplayName: (name: string) => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  participantId: '',
  isFacilitator: false,
  facilitatorToken: null,
  displayName: '',
  setDisplayName: () => {},
});

function getOrCreate(key: string, factory: () => string): string {
  if (typeof window === 'undefined') return '';
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const value = factory();
  localStorage.setItem(key, value);
  return value;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for non-secure (HTTP) contexts where randomUUID is unavailable
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

interface SocketProviderProps {
  sessionId: string;
  children: React.ReactNode;
}

export function SocketProvider({ sessionId, children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [displayName, setDisplayNameState] = useState('');
  const participantIdRef = useRef('');
  const facilitatorTokenRef = useRef<string | null>(null);
  const isFacilitatorRef = useRef(false);

  useEffect(() => {
    const pid = getOrCreate(`participant_id_${sessionId}`, generateId);
    participantIdRef.current = pid;

    const token = localStorage.getItem(`facilitator_${sessionId}`) || null;
    facilitatorTokenRef.current = token;
    isFacilitatorRef.current = !!token;

    let s: Socket;

    // Resolve display name before connecting so join_session carries the right name
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .catch(() => null)
      .then(data => {
        const isAuthenticated = !!data?.user;
        const sessionName = data?.user?.displayName || '';
        // If authenticated, always clear localStorage — it may hold a stale auto-generated name.
        if (isAuthenticated) {
          localStorage.removeItem(`display_name_${sessionId}`);
        }
        const storedName = localStorage.getItem(`display_name_${sessionId}`);
        // Prefer session name; fall back to localStorage only for unauthenticated guests.
        const resolvedName = sessionName || (!isAuthenticated ? storedName : '') || '';
        setDisplayNameState(resolvedName);

        const socketUrl = typeof window !== 'undefined' ? window.location.origin : '';
        s = io(socketUrl, { path: '/socket.io', transports: ['websocket', 'polling'] });

        s.on('connect_error', (err) => {
          console.error('[RWM] Socket connect_error:', err.message, err);
        });

        s.on('connect', () => {
          setIsConnected(true);
          s.emit('join_session', {
            sessionId,
            participantId: pid,
            displayName: resolvedName || undefined,
            facilitatorToken: token || undefined,
          });
          // If we have a session-authenticated name, rename immediately in case
          // a stale server-side entry already has an auto-generated "Participant N".
          if (resolvedName) {
            s.emit('rename_participant', { sessionId, displayName: resolvedName });
          }
        });

        s.on('disconnect', () => setIsConnected(false));

        setSocket(s);
      });

    return () => {
      s?.disconnect();
    };
  }, [sessionId]);

  const setDisplayName = (name: string) => {
    setDisplayNameState(name);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`display_name_${sessionId}`, name);
    }
    if (socket?.connected) {
      socket.emit('rename_participant', { sessionId, displayName: name });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        participantId: participantIdRef.current,
        isFacilitator: isFacilitatorRef.current,
        facilitatorToken: facilitatorTokenRef.current,
        displayName,
        setDisplayName,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
