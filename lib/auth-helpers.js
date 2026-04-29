const { v4: uuidv4 } = require('uuid');
const { getUserByEmail, createUser, updateUser } = require('./db-queries');

// Upsert a user from an external provider (ldap or entraid).
// Promotes to admin if email matches ADMIN_EMAIL env var.
function upsertExternalUser({ email, displayName, provider, providerId }) {
  let user = getUserByEmail(email);
  const isAdmin = process.env.ADMIN_EMAIL && email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();

  if (!user) {
    user = createUser({
      id: uuidv4(),
      email,
      displayName,
      provider,
      providerId,
      role: isAdmin ? 'admin' : 'user',
    });
  } else {
    const updates = { displayName };
    if (isAdmin && user.role !== 'admin') updates.role = 'admin';
    if (providerId && user.provider_id !== providerId) updates.providerId = providerId;
    user = updateUser(user.id, updates);
  }

  return user;
}

function sessionPayload(user) {
  return {
    userId: user.id,
    email: user.email,
    displayName: user.display_name,
    role: user.role,
  };
}

module.exports = { upsertExternalUser, sessionPayload };
