const msal = require('@azure/msal-node');

function isEntraIdConfigured() {
  return !!(process.env.ENTRAID_TENANT_ID && process.env.ENTRAID_CLIENT_ID && process.env.ENTRAID_CLIENT_SECRET);
}

function getMsalClient() {
  return new msal.ConfidentialClientApplication({
    auth: {
      clientId: process.env.ENTRAID_CLIENT_ID,
      clientSecret: process.env.ENTRAID_CLIENT_SECRET,
      authority: `https://login.microsoftonline.com/${process.env.ENTRAID_TENANT_ID}`,
    },
  });
}

async function getAuthCodeUrl(state) {
  if (!isEntraIdConfigured()) throw new Error('EntraID not configured');
  const client = getMsalClient();
  return client.getAuthCodeUrl({
    scopes: ['openid', 'profile', 'email', 'User.Read'],
    redirectUri: process.env.ENTRAID_REDIRECT_URI,
    state,
  });
}

async function acquireTokenByCode(code) {
  if (!isEntraIdConfigured()) throw new Error('EntraID not configured');
  const client = getMsalClient();
  const result = await client.acquireTokenByCode({
    code,
    scopes: ['openid', 'profile', 'email', 'User.Read'],
    redirectUri: process.env.ENTRAID_REDIRECT_URI,
  });

  const claims = result.idTokenClaims;
  return {
    providerId: claims.oid || claims.sub,
    email: claims.email || claims.preferred_username,
    displayName: claims.name || claims.preferred_username,
  };
}

module.exports = { isEntraIdConfigured, getAuthCodeUrl, acquireTokenByCode };
