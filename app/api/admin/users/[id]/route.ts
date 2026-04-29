import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const { getAppSession } = require('@/lib/session');
const { getUserById, updateUser } = require('@/lib/db-queries');

async function getAdmin() {
  const cookieStore = await cookies();
  const session = await getAppSession(cookieStore);
  return session.user?.role === 'admin' ? session.user : null;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const user = getUserById(id);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.displayName !== undefined) updates.displayName = body.displayName;
  if (body.role !== undefined) updates.role = body.role === 'admin' ? 'admin' : 'user';
  if (body.isActive !== undefined) updates.isActive = !!body.isActive;
  if (body.password) updates.passwordHash = await bcrypt.hash(body.password, 12);

  const updated = updateUser(id, updates);
  return NextResponse.json({ user: updated });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  // Prevent self-deactivation
  if (admin.userId === id) return NextResponse.json({ error: 'Cannot deactivate your own account' }, { status: 400 });

  const user = getUserById(id);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  updateUser(id, { isActive: false });
  return NextResponse.json({ ok: true });
}
