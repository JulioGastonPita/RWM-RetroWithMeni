'use client';

interface Participant {
  participantId: string;
  displayName: string;
  isFacilitator: boolean;
  joinedAt: number;
}

interface ParticipantListProps {
  participants: Participant[];
}

export function ParticipantList({ participants }: ParticipantListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {participants.map(p => (
        <span
          key={p.participantId}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
          style={p.isFacilitator
            ? { background: 'rgba(255,56,92,0.08)', color: '#ff385c', border: '1px solid rgba(255,56,92,0.2)' }
            : { background: '#f7f7f7', color: '#6a6a6a', border: '1px solid #dddddd' }}
        >
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#16a34a' }} />
          {p.displayName}
          {p.isFacilitator && <span style={{ color: '#ff385c' }}>★</span>}
        </span>
      ))}
    </div>
  );
}
