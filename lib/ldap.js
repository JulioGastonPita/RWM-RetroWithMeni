const { Client } = require('ldapts');

function isLdapConfigured() {
  return !!(process.env.LDAP_URL && process.env.LDAP_BASE_DN);
}

async function ldapAuthenticate(username, password) {
  if (!isLdapConfigured()) throw new Error('LDAP not configured');

  const isLdaps = process.env.LDAP_URL.startsWith('ldaps://');
  const client = new Client({
    url: process.env.LDAP_URL,
    ...(isLdaps ? { tlsOptions: { rejectUnauthorized: process.env.NODE_ENV === 'production' } } : {}),
  });

  try {
    // If a service account password is provided, bind with it; otherwise search anonymously
    if (process.env.LDAP_BIND_DN && process.env.LDAP_BIND_PASSWORD) {
      const bindDn = process.env.LDAP_BIND_DN.replace('{{username}}', username);
      await client.bind(bindDn, process.env.LDAP_BIND_PASSWORD);
    }

    const filter = (process.env.LDAP_USER_FILTER || '(sAMAccountName={{username}})').replace('{{username}}', username);

    const { searchEntries } = await client.search(process.env.LDAP_BASE_DN, {
      scope: 'sub',
      filter,
      attributes: ['dn', 'mail', 'displayName', 'cn', 'uid', 'sAMAccountName', 'givenName', 'sn', 'gecos'],
    });

    if (!searchEntries.length) throw new Error('User not found');

    const entry = searchEntries[0];
    if (process.env.NODE_ENV !== 'production') console.log('[RWM] LDAP raw entry:', JSON.stringify(entry));
    const userDn = entry.dn;

    // Bind as the found user to verify their password
    await client.unbind();
    await client.bind(userDn, password);

    return {
      dn: userDn,
      email: (entry.mail || entry.userPrincipalName || `${entry.uid || username}@unknown`).toString(),
      displayName: ([entry.displayName, entry.cn, entry.gecos, entry.givenName, entry.uid, username].map(v => (v || '').toString().trim()).find(v => v) || username),
      providerId: userDn,
    };
  } finally {
    await client.unbind().catch(() => {});
  }
}

module.exports = { isLdapConfigured, ldapAuthenticate };
