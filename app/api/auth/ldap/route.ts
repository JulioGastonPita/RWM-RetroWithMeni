import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const { isLdapConfigured, ldapAuthenticate } = require('@/lib/ldap');
const { getAppSession } = require('@/lib/session');
const { upsertExternalUser, sessionPayload } = require('@/lib/auth-helpers');

export async function POST(request: NextRequest) {
  if (!isLdapConfigured()) {
    return NextResponse.json({ error: 'LDAP not configured' }, { status: 503 });
  }

  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
  }

  try {
    const ldapUser = await ldapAuthenticate(username, password);
    if (process.env.NODE_ENV !== 'production') console.log('[RWM] LDAP user:', { email: ldapUser.email, displayName: ldapUser.displayName });
    const user = upsertExternalUser({ ...ldapUser, provider: 'ldap' });
    if (process.env.NODE_ENV !== 'production') console.log('[RWM] DB user:', { display_name: user.display_name, email: user.email });

    if (!user.is_active) {
      return NextResponse.json({ error: 'Account is disabled' }, { status: 403 });
    }

    const cookieStore = await cookies();
    const session = await getAppSession(cookieStore);
    session.user = sessionPayload(user);
    await session.save();

    return NextResponse.json({ ok: true, user: session.user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'LDAP authentication failed';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
