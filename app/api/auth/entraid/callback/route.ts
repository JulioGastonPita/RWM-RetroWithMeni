import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const { acquireTokenByCode } = require('@/lib/entraid');
const { getAppSession } = require('@/lib/session');
const { upsertExternalUser, sessionPayload } = require('@/lib/auth-helpers');

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const returnedState = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', request.url));
  }

  const storedState = request.cookies.get('entraid_state')?.value;
  if (!storedState || storedState !== returnedState) {
    return NextResponse.redirect(new URL('/login?error=state_mismatch', request.url));
  }

  try {
    const entraUser = await acquireTokenByCode(code);
    const user = upsertExternalUser({ ...entraUser, provider: 'entraid' });

    if (!user.is_active) {
      return NextResponse.redirect(new URL('/login?error=account_disabled', request.url));
    }

    const cookieStore = await cookies();
    const session = await getAppSession(cookieStore);
    session.user = sessionPayload(user);
    await session.save();

    const response = NextResponse.redirect(new URL('/home', request.url));
    response.cookies.delete('entraid_state');
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'auth_failed';
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, request.url));
  }
}
