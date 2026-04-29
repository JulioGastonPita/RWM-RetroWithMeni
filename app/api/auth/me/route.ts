import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const { getAppSession } = require('@/lib/session');

export async function GET() {
  const cookieStore = await cookies();
  const session = await getAppSession(cookieStore);

  if (!session.user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user: session.user });
}
