import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const { isEntraIdConfigured, getAuthCodeUrl } = require('@/lib/entraid');

export async function GET(request: NextRequest) {
  if (!isEntraIdConfigured()) {
    return NextResponse.json({ error: 'EntraID not configured' }, { status: 503 });
  }

  const state = uuidv4();
  const authUrl = await getAuthCodeUrl(state);

  const response = NextResponse.redirect(authUrl);
  // Store state in a short-lived cookie for CSRF validation in the callback
  response.cookies.set('entraid_state', state, {
    httpOnly: true,
    maxAge: 300,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
