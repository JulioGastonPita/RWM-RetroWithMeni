import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const { getAppSession } = require('@/lib/session');

export async function POST() {
  const cookieStore = await cookies();
  const session = await getAppSession(cookieStore);
  session.destroy();
  return NextResponse.json({ ok: true });
}
