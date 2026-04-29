import { NextRequest, NextResponse } from 'next/server';
import { unsealSession } from './lib/session';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login|api/auth).*)'],
};

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sealedCookie = request.cookies.get('rwm_session')?.value;
  const session = await unsealSession(sealedCookie || null) as { user?: { role?: string } } | null;
  const user = session?.user || null;

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith('/admin') && user.role !== 'admin') {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return NextResponse.next();
}
