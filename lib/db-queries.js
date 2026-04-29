const { getDb } = require('./db');
const { v4: uuidv4 } = require('uuid');

// ─── Sessions ─────────────────────────────────────────────────────────────────

function createSession({ id, name, format, facilitatorToken, maxVotes = 3 }) {
  const db = getDb();
  const now = Date.now();
  db.prepare(`
    INSERT INTO sessions (id, name, format, phase, facilitator_token, max_votes, created_at, updated_at)
    VALUES (?, ?, ?, 'write', ?, ?, ?, ?)
  `).run(id, name, format, facilitatorToken, maxVotes, now, now);
  return getSession(id);
}

function getSession(sessionId) {
  const db = getDb();
  return db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
}

function updateSession(sessionId, updates) {
  const db = getDb();
  const fields = [];
  const values = [];

  if (updates.phase !== undefined) { fields.push('phase = ?'); values.push(updates.phase); }
  if (updates.maxVotes !== undefined) { fields.push('max_votes = ?'); values.push(updates.maxVotes); }
  if (updates.timerEndsAt !== undefined) { fields.push('timer_ends_at = ?'); values.push(updates.timerEndsAt); }

  if (fields.length === 0) return getSession(sessionId);

  fields.push('updated_at = ?');
  values.push(Date.now());
  values.push(sessionId);

  db.prepare(`UPDATE sessions SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getSession(sessionId);
}

function validateFacilitator(sessionId, facilitatorToken) {
  const db = getDb();
  const row = db.prepare('SELECT facilitator_token FROM sessions WHERE id = ?').get(sessionId);
  return row && row.facilitator_token === facilitatorToken;
}

function getAllSessions() {
  const db = getDb();
  return db.prepare('SELECT id, name, format, phase, created_at FROM sessions ORDER BY created_at DESC').all();
}

// ─── Cards ─────────────────────────────────────────────────────────────────────

function createCard({ sessionId, columnId, authorId, authorName, content }) {
  const db = getDb();
  const id = uuidv4();
  const now = Date.now();
  // position = next position in column
  const pos = db.prepare(
    'SELECT COUNT(*) as cnt FROM cards WHERE session_id = ? AND column_id = ?'
  ).get(sessionId, columnId).cnt;

  db.prepare(`
    INSERT INTO cards (id, session_id, column_id, author_id, author_name, content, is_hidden, position, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
  `).run(id, sessionId, columnId, authorId, authorName, content, pos, now, now);

  return getCard(id);
}

function getCard(cardId) {
  const db = getDb();
  return db.prepare('SELECT * FROM cards WHERE id = ?').get(cardId);
}

function getCardsBySession(sessionId) {
  const db = getDb();
  return db.prepare('SELECT * FROM cards WHERE session_id = ? ORDER BY column_id, position, created_at').all(sessionId);
}

function updateCard(cardId, updates) {
  const db = getDb();
  const fields = [];
  const values = [];

  if (updates.content !== undefined) { fields.push('content = ?'); values.push(updates.content); }
  if (updates.isHidden !== undefined) { fields.push('is_hidden = ?'); values.push(updates.isHidden ? 1 : 0); }
  if (updates.position !== undefined) { fields.push('position = ?'); values.push(updates.position); }

  if (fields.length === 0) return getCard(cardId);

  fields.push('updated_at = ?');
  values.push(Date.now());
  values.push(cardId);

  db.prepare(`UPDATE cards SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getCard(cardId);
}

function deleteCard(cardId) {
  const db = getDb();
  db.prepare('DELETE FROM cards WHERE id = ?').run(cardId);
}

function revealAllCards(sessionId) {
  const db = getDb();
  db.prepare('UPDATE cards SET is_hidden = 0 WHERE session_id = ?').run(sessionId);
}

function clearCards(sessionId, columnId) {
  const db = getDb();
  if (columnId) {
    db.prepare('DELETE FROM cards WHERE session_id = ? AND column_id = ?').run(sessionId, columnId);
  } else {
    db.prepare('DELETE FROM cards WHERE session_id = ?').run(sessionId);
  }
}

// ─── Votes ─────────────────────────────────────────────────────────────────────

function castVote({ sessionId, cardId, voterId }) {
  const db = getDb();
  const id = uuidv4();
  const now = Date.now();
  db.prepare(`
    INSERT INTO votes (id, session_id, card_id, voter_id, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, sessionId, cardId, voterId, now);
  return { id, sessionId, cardId, voterId, createdAt: now };
}

function removeVote(cardId, voterId) {
  const db = getDb();
  db.prepare('DELETE FROM votes WHERE card_id = ? AND voter_id = ?').run(cardId, voterId);
}

function getVoteCount(cardId) {
  const db = getDb();
  return db.prepare('SELECT COUNT(*) as cnt FROM votes WHERE card_id = ?').get(cardId).cnt;
}

function getVoterIdsForCard(cardId) {
  const db = getDb();
  return db.prepare('SELECT voter_id FROM votes WHERE card_id = ?').all(cardId).map(r => r.voter_id);
}

function getVotesBySession(sessionId) {
  const db = getDb();
  return db.prepare('SELECT card_id, voter_id FROM votes WHERE session_id = ?').all(sessionId);
}

function getVoterVoteCount(sessionId, voterId) {
  const db = getDb();
  return db.prepare(
    'SELECT COUNT(*) as cnt FROM votes WHERE session_id = ? AND voter_id = ?'
  ).get(sessionId, voterId).cnt;
}

// ─── Users ─────────────────────────────────────────────────────────────────────

function createUser({ id, email, displayName, passwordHash = null, provider = 'local', providerId = null, role = 'user' }) {
  const db = getDb();
  const now = Date.now();
  db.prepare(`
    INSERT INTO users (id, email, display_name, password_hash, provider, provider_id, role, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(id, email, displayName, passwordHash, provider, providerId, role, now, now);
  return getUserById(id);
}

function getUserById(id) {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function getUserByEmail(email) {
  return getDb().prepare('SELECT * FROM users WHERE email = ?').get(email);
}

function listUsers() {
  return getDb().prepare('SELECT id, email, display_name, provider, role, is_active, created_at FROM users ORDER BY created_at DESC').all();
}

function updateUser(id, updates) {
  const db = getDb();
  const fields = [];
  const values = [];

  if (updates.displayName !== undefined) { fields.push('display_name = ?'); values.push(updates.displayName); }
  if (updates.passwordHash !== undefined) { fields.push('password_hash = ?'); values.push(updates.passwordHash); }
  if (updates.role !== undefined) { fields.push('role = ?'); values.push(updates.role); }
  if (updates.isActive !== undefined) { fields.push('is_active = ?'); values.push(updates.isActive ? 1 : 0); }
  if (updates.providerId !== undefined) { fields.push('provider_id = ?'); values.push(updates.providerId); }

  if (fields.length === 0) return getUserById(id);

  fields.push('updated_at = ?');
  values.push(Date.now());
  values.push(id);

  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getUserById(id);
}

module.exports = {
  createSession, getSession, updateSession, validateFacilitator, getAllSessions,
  createCard, getCard, getCardsBySession, updateCard, deleteCard, revealAllCards, clearCards,
  castVote, removeVote, getVoteCount, getVoterIdsForCard, getVotesBySession, getVoterVoteCount,
  createUser, getUserById, getUserByEmail, listUsers, updateUser,
};
