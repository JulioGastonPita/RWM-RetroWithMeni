const { cookies } = require('next/headers');
const { getAppSession } = require('./session');

async function getSessionUser() {
  const cookieStore = await cookies();
  const session = await getAppSession(cookieStore);
  return session.user || null;
}

async function requireAuth() {
  const user = await getSessionUser();
  if (!user) {
    const { redirect } = require('next/navigation');
    redirect('/login');
  }
  return user;
}

async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== 'admin') {
    const { redirect } = require('next/navigation');
    redirect('/home');
  }
  return user;
}

module.exports = { getSessionUser, requireAuth, requireAdmin };
