/**
 * File Purpose: SQLite database operations for Midnight Vault (parallel branches)
 * High-Level Summary: Manages participants, solves, global keys, and branch state
 * Dependencies: better-sqlite3
 * Semantic Tags: database, storage, branches
 * Version: 2.0.0
 */

const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

// Fun adjectives and nouns for random nicknames
const ADJECTIVES = [
  'Swift', 'Clever', 'Happy', 'Lucky', 'Brave', 'Jolly', 'Merry', 'Witty',
  'Zesty', 'Cosmic', 'Stellar', 'Sparkly', 'Nifty', 'Groovy', 'Funky', 'Snazzy'
];
const NOUNS = [
  'Otter', 'Penguin', 'Fox', 'Owl', 'Dolphin', 'Panda', 'Koala', 'Rabbit',
  'Falcon', 'Phoenix', 'Dragon', 'Unicorn', 'Tiger', 'Bear', 'Wolf', 'Eagle'
];

const db = new Database(path.join(__dirname, 'midnight_vault.db'));
db.pragma('journal_mode = WAL');

/**
 * Initialize database schema
 */
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      nickname TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS solves (
      participant_id TEXT NOT NULL,
      puzzle_id INTEGER NOT NULL,
      solved_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (participant_id, puzzle_id),
      FOREIGN KEY (participant_id) REFERENCES participants(id)
    );

    CREATE TABLE IF NOT EXISTS global_keys (
      key TEXT PRIMARY KEY,
      unlocked_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS global_values (
      name TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_solves_puzzle ON solves(puzzle_id);
    CREATE INDEX IF NOT EXISTS idx_solves_participant ON solves(participant_id);
    CREATE INDEX IF NOT EXISTS idx_solves_time ON solves(solved_at DESC);

    CREATE TABLE IF NOT EXISTS puzzle_overrides (
      puzzle_id INTEGER PRIMARY KEY,
      location_hint TEXT,
      prompt TEXT,
      answer TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  
  // Initialize permutation key if not exists
  const permStmt = db.prepare('INSERT OR IGNORE INTO global_values (name, value) VALUES (?, ?)');
  permStmt.run('perm', '26153478');
}

// =============================================================================
// NICKNAME GENERATION
// =============================================================================

function generateNickname() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  return `${adj}-${noun}-${num}`;
}

function generateId() {
  return crypto.randomUUID();
}

// =============================================================================
// PARTICIPANTS
// =============================================================================

function createParticipant(nickname = null) {
  const id = generateId();
  const name = nickname || generateNickname();
  const stmt = db.prepare('INSERT INTO participants (id, nickname) VALUES (?, ?)');
  stmt.run(id, name);
  return { id, nickname: name };
}

function getParticipant(id) {
  const stmt = db.prepare('SELECT id, nickname, created_at FROM participants WHERE id = ?');
  return stmt.get(id) || null;
}

function updateNickname(id, nickname) {
  const stmt = db.prepare('UPDATE participants SET nickname = ? WHERE id = ?');
  const result = stmt.run(nickname, id);
  return result.changes > 0;
}

// =============================================================================
// SOLVES
// =============================================================================

function recordSolve(participantId, puzzleId) {
  // Check if already solved by this participant
  const checkStmt = db.prepare('SELECT 1 FROM solves WHERE participant_id = ? AND puzzle_id = ?');
  if (checkStmt.get(participantId, puzzleId)) {
    return { success: false, isFirst: false, alreadySolved: true };
  }
  
  // Check if this is the first global solve
  const firstCheckStmt = db.prepare('SELECT 1 FROM solves WHERE puzzle_id = ? LIMIT 1');
  const isFirst = !firstCheckStmt.get(puzzleId);
  
  // Record the solve
  const insertStmt = db.prepare('INSERT INTO solves (participant_id, puzzle_id) VALUES (?, ?)');
  insertStmt.run(participantId, puzzleId);
  
  return { success: true, isFirst, alreadySolved: false };
}

function hasParticipantSolved(participantId, puzzleId) {
  const stmt = db.prepare('SELECT 1 FROM solves WHERE participant_id = ? AND puzzle_id = ?');
  return !!stmt.get(participantId, puzzleId);
}

function isPuzzleSolvedGlobally(puzzleId) {
  const stmt = db.prepare('SELECT 1 FROM solves WHERE puzzle_id = ? LIMIT 1');
  return !!stmt.get(puzzleId);
}

function getGlobalSolvedPuzzleIds() {
  const stmt = db.prepare('SELECT DISTINCT puzzle_id FROM solves ORDER BY puzzle_id');
  return stmt.all().map(row => row.puzzle_id);
}

function getGlobalSolvedCount() {
  const stmt = db.prepare('SELECT COUNT(DISTINCT puzzle_id) as count FROM solves');
  return stmt.get().count;
}

function getRecentSolves(limit = 12) {
  const stmt = db.prepare(`
    SELECT s.puzzle_id, s.solved_at, p.nickname
    FROM solves s
    JOIN participants p ON s.participant_id = p.id
    ORDER BY s.solved_at DESC
    LIMIT ?
  `);
  return stmt.all(limit);
}

function getContributors(limit = 10) {
  const stmt = db.prepare(`
    SELECT p.nickname, COUNT(*) as solves
    FROM solves s
    JOIN participants p ON s.participant_id = p.id
    GROUP BY s.participant_id
    ORDER BY solves DESC, p.nickname ASC
    LIMIT ?
  `);
  return stmt.all(limit);
}

function getParticipantSolveCount(participantId) {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM solves WHERE participant_id = ?');
  return stmt.get(participantId).count;
}

function getParticipantSolvedPuzzles(participantId) {
  const stmt = db.prepare('SELECT puzzle_id FROM solves WHERE participant_id = ? ORDER BY puzzle_id');
  return stmt.all(participantId).map(row => row.puzzle_id);
}

// =============================================================================
// GLOBAL KEYS (branch completion flags)
// =============================================================================

function setGlobalKey(key) {
  const stmt = db.prepare('INSERT OR IGNORE INTO global_keys (key) VALUES (?)');
  stmt.run(key);
}

function hasGlobalKey(key) {
  const stmt = db.prepare('SELECT 1 FROM global_keys WHERE key = ?');
  return !!stmt.get(key);
}

function getGlobalKeys() {
  const stmt = db.prepare('SELECT key, unlocked_at FROM global_keys');
  return stmt.all();
}

function countDoneKeys() {
  const stmt = db.prepare("SELECT COUNT(*) as count FROM global_keys WHERE key LIKE '%_DONE'");
  return stmt.get().count;
}

function getCompletedBranches() {
  const stmt = db.prepare("SELECT key FROM global_keys WHERE key LIKE '%_DONE'");
  return stmt.all().map(row => row.key.replace('_DONE', ''));
}

// =============================================================================
// GLOBAL VALUES (permutation key, etc.)
// =============================================================================

function setGlobalValue(name, value) {
  const stmt = db.prepare(`
    INSERT INTO global_values (name, value, updated_at) 
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(name) DO UPDATE SET value = ?, updated_at = datetime('now')
  `);
  stmt.run(name, value, value);
}

function getGlobalValue(name) {
  const stmt = db.prepare('SELECT value FROM global_values WHERE name = ?');
  const row = stmt.get(name);
  return row ? row.value : null;
}

function getPermutationKey() {
  return getGlobalValue('perm') || '26153478';
}

// =============================================================================
// BRANCH STATUS
// =============================================================================

/**
 * Get the completion status for each branch
 * @param {object} puzzles - The puzzles module
 * @returns {object} - { F: { steps: [bool,bool,bool], done: bool }, ... }
 */
function getBranchStatus(puzzles) {
  const solvedIds = getGlobalSolvedPuzzleIds();
  const status = {};
  
  for (const branch of puzzles.BRANCH_ORDER) {
    const branchPuzzles = puzzles.getPuzzlesByBranch(branch);
    const steps = branchPuzzles.map(p => solvedIds.includes(p.id));
    const done = hasGlobalKey(`${branch}_DONE`);
    status[branch] = { steps, done };
  }
  
  return status;
}

// =============================================================================
// ADMIN
// =============================================================================

function resetAllData() {
  db.exec('DELETE FROM solves');
  db.exec('DELETE FROM participants');
  db.exec('DELETE FROM global_keys');
  // Keep perm value but reset others
  db.exec("DELETE FROM global_values WHERE name != 'perm'");
}

function getAllSolves() {
  const stmt = db.prepare(`
    SELECT s.puzzle_id, s.solved_at, s.participant_id, p.nickname
    FROM solves s
    JOIN participants p ON s.participant_id = p.id
    ORDER BY s.solved_at DESC
  `);
  return stmt.all();
}

// =============================================================================
// PUZZLE OVERRIDES
// =============================================================================

function getPuzzleOverride(puzzleId) {
  const stmt = db.prepare('SELECT * FROM puzzle_overrides WHERE puzzle_id = ?');
  return stmt.get(puzzleId) || null;
}

function getAllPuzzleOverrides() {
  const stmt = db.prepare('SELECT * FROM puzzle_overrides');
  return stmt.all();
}

function setPuzzleOverride(puzzleId, { location_hint, prompt, answer }) {
  const stmt = db.prepare(`
    INSERT INTO puzzle_overrides (puzzle_id, location_hint, prompt, answer, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(puzzle_id) DO UPDATE SET
      location_hint = COALESCE(?, location_hint),
      prompt = COALESCE(?, prompt),
      answer = COALESCE(?, answer),
      updated_at = datetime('now')
  `);
  stmt.run(puzzleId, location_hint, prompt, answer, location_hint, prompt, answer);
}

function clearPuzzleOverride(puzzleId) {
  const stmt = db.prepare('DELETE FROM puzzle_overrides WHERE puzzle_id = ?');
  stmt.run(puzzleId);
}

// Swap solves between two puzzles
function swapPuzzleSolves(fromId, toId) {
  // Use a temp value to swap
  const tempId = 99999;
  db.prepare('UPDATE solves SET puzzle_id = ? WHERE puzzle_id = ?').run(tempId, fromId);
  db.prepare('UPDATE solves SET puzzle_id = ? WHERE puzzle_id = ?').run(fromId, toId);
  db.prepare('UPDATE solves SET puzzle_id = ? WHERE puzzle_id = ?').run(toId, tempId);
}

// Initialize schema on module load
initSchema();

module.exports = {
  // Participants
  createParticipant,
  getParticipant,
  updateNickname,
  generateNickname,
  
  // Solves
  recordSolve,
  hasParticipantSolved,
  isPuzzleSolvedGlobally,
  getGlobalSolvedPuzzleIds,
  getGlobalSolvedCount,
  getRecentSolves,
  getContributors,
  getParticipantSolveCount,
  getParticipantSolvedPuzzles,
  
  // Global keys
  setGlobalKey,
  hasGlobalKey,
  getGlobalKeys,
  countDoneKeys,
  getCompletedBranches,
  
  // Global values
  setGlobalValue,
  getGlobalValue,
  getPermutationKey,
  
  // Branch status
  getBranchStatus,
  
  // Admin
  resetAllData,
  getAllSolves,
  swapPuzzleSolves,

  // Puzzle overrides
  getPuzzleOverride,
  getAllPuzzleOverrides,
  setPuzzleOverride,
  clearPuzzleOverride
};
