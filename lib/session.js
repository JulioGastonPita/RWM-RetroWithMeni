const { getIronSession, unsealData } = require('iron-session');

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET || 'dev-only-secret-do-not-use-in-prod!!',
  cookieName: 'rwm_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  },
};

// For use in App Router Route Handlers — pass cookies() from next/headers
async function getAppSession(cookieStore) {
  return getIronSession(cookieStore, SESSION_OPTIONS);
}

// For use in middleware — manually unseal the cookie value
async function unsealSession(sealedValue) {
  if (!sealedValue) return null;
  try {
    return await unsealData(sealedValue, { password: SESSION_OPTIONS.password });
  } catch {
    return null;
  }
}

module.exports = { SESSION_OPTIONS, getAppSession, unsealSession };
