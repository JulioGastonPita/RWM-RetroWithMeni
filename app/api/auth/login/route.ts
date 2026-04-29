import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const { getUserByEmail } = require('@/lib/db-queries');
const { getAppSession } = require('@/lib/session');
const { sessionPayload } = require('@/lib/auth-helpers');

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const user = getUserByEmail(email.toLowerCase().trim());

  if (!user || user.provider !== 'local' || !user.password_hash) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  if (!user.is_active) {
    return NextResponse.json({ error: 'Account is disabled' }, { status: 403 });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const cookieStore = await cookies();
  const session = await getAppSession(cookieStore);
  session.user = sessionPayload(user);
  await session.save();

  return NextResponse.json({ ok: true, user: session.user });
}
