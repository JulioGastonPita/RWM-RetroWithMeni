import { NextRequest, NextResponse } from 'next/server';
import { getSession, getCardsBySession, getVotesBySession, validateFacilitator } from '@/lib/db-queries';
import { getColumns } from '@/lib/retro-formats';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const token = req.headers.get('x-facilitator-token');
  if (!token || !validateFacilitator(sessionId, token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const cards = getCardsBySession(sessionId);
  const votes = getVotesBySession(sessionId);
  const columns = getColumns(session.format);

  const exportCards = (cards as any[]).map((card: any) => ({
    column: (columns as any[]).find((c: any) => c.id === card.column_id)?.label || card.column_id,
    content: card.content,
    author: card.author_name,
    votes: (votes as any[]).filter((v: any) => v.card_id === card.id).length,
    createdAt: new Date(card.created_at).toISOString(),
  }));

  const format = req.nextUrl.searchParams.get('format') || 'json';

  if (format === 'csv') {
    const header = 'Column,Content,Author,Votes,Created At\n';
    const rows = exportCards
      .map(c => `"${c.column}","${c.content.replace(/"/g, '""')}","${c.author}",${c.votes},"${c.createdAt}"`)
      .join('\n');
    return new NextResponse(header + rows, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="retro-${sessionId}.csv"`,
      },
    });
  }

  return NextResponse.json({
    session: {
      id: session.id,
      name: session.name,
      format: session.format,
      phase: session.phase,
      createdAt: new Date(session.created_at).toISOString(),
    },
    columns,
    cards: exportCards,
  });
}
