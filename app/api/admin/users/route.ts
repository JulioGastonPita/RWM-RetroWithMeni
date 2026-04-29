import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const { getAppSession } = require('@/lib/session');
const { listUsers, createUser, getUserByEmail } = require('@/lib/db-queries');

async function getAdmin() {
  const cookieStore = await cookies();
  const session = await getAppSession(cookieStore);
  return session.user?.role === 'admin' ? session.user : null;
}

export async function GET() {
  if (!await getAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json({ users: listUsers() });
}

export async function POST(request: NextRequest) {
  if (!await getAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { email, displayName, password, role = 'user' } = await request.json();

  if (!email || !displayName || !password) {
    return NextResponse.json({ error: 'email, displayName, and password are required' }, { status: 400 });
  }

  if (getUserByEmail(email.toLowerCase().trim())) {
    return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = createUser({
    id: uuidv4(),
    email: email.toLowerCase().trim(),
    displayName,
    passwordHash,
    provider: 'local',
    role: role === 'admin' ? 'admin' : 'user',
  });

  return NextResponse.json({ user }, { status: 201 });
}
