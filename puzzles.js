/**
 * File Purpose: Puzzle data with parallel branch structure for Midnight Vault
 * High-Level Summary: 4 branches (F/M/D/B) x 3 puzzles each, sequential within branch
 * Dependencies: None
 * Semantic Tags: puzzles, branches, game-data
 * Version: 2.0.0
 */

// Branch order for digit concatenation
const BRANCH_ORDER = ['L', 'H', 'J', 'P'];

// Branch metadata
const BRANCHES = {
  L: { name: 'LEGO', icon: '🧱', color: '#e74c3c', digits: [4, 1], hint: 'Build the Lego to find the first QR' },
  H: { name: 'HIDDEN', icon: '🔍', color: '#9b59b6', digits: [8, 2], hint: 'Search carefully to find the hidden QR' },
  J: { name: 'JIGSAW', icon: '🧩', color: '#3498db', digits: [0, 9], hint: 'Complete the jigsaw to reveal the first QR' },
  P: { name: 'PUZZLE BOX', icon: '📦', color: '#27ae60', digits: [5, 3], hint: 'Open the puzzle box to get the first QR' }
};

// Permutation key (1-indexed positions) - revealed at hub
const PERMUTATION_KEY = '26153478';

// 12 puzzles: 3 per branch, sequential steps within each branch
// Physical puzzle (Lego/Hidden/Jigsaw/Puzzle Box) reveals QR1, then chain continues
const PUZZULAR = [
  // LEGO branch (L1, L2, L3) - Build lego to find QR1
  {
    id: 1,
    branch: 'L',
    step: 1,
    title: 'Lego Puzzle 1',
    location_hint: 'Inside the completed Lego build',
    prompt: 'Caesar cipher +3: Decode "SODBOLVW"',
    answer: 'PLAYLIST'
  },
  {
    id: 2,
    branch: 'L',
    step: 2,
    title: 'Lego Puzzle 2',
    location_hint: 'TBD',
    prompt: 'TBD',
    answer: 'TBD'
  },
  {
    id: 3,
    branch: 'L',
    step: 3,
    title: 'Lego Puzzle 3',
    location_hint: 'TBD',
    prompt: 'TBD',
    answer: 'TBD'
  },

  // HIDDEN branch (H1, H2, H3) - Find the hidden QR1
  {
    id: 4,
    branch: 'H',
    step: 1,
    title: 'Hidden Puzzle 1',
    location_hint: 'Somewhere hidden...',
    prompt: 'What part of a song repeats the most?',
    answer: 'CHORUS'
  },
  {
    id: 5,
    branch: 'H',
    step: 2,
    title: 'Hidden Puzzle 2',
    location_hint: 'TBD',
    prompt: 'TBD',
    answer: 'TBD'
  },
  {
    id: 6,
    branch: 'H',
    step: 3,
    title: 'Hidden Puzzle 3',
    location_hint: 'TBD',
    prompt: 'TBD',
    answer: 'TBD'
  },

  // JIGSAW branch (J1, J2, J3) - Complete jigsaw to reveal QR1
  {
    id: 7,
    branch: 'J',
    step: 1,
    title: 'Jigsaw Puzzle 1',
    location_hint: 'On the completed jigsaw',
    prompt: 'Unscramble: RAELGND',
    answer: 'GARLAND'
  },
  {
    id: 8,
    branch: 'J',
    step: 2,
    title: 'Jigsaw Puzzle 2',
    location_hint: 'TBD',
    prompt: 'TBD',
    answer: 'TBD'
  },
  {
    id: 9,
    branch: 'J',
    step: 3,
    title: 'Jigsaw Puzzle 3',
    location_hint: 'TBD',
    prompt: 'TBD',
    answer: 'TBD'
  },

  // PUZZLE BOX branch (P1, P2, P3) - Open puzzle box to get QR1
  {
    id: 10,
    branch: 'P',
    step: 1,
    title: 'Puzzle Box 1',
    location_hint: 'Inside the puzzle box',
    prompt: 'What do you call the back-of-book list used to find topics?',
    answer: 'INDEX'
  },
  {
    id: 11,
    branch: 'P',
    step: 2,
    title: 'Puzzle Box 2',
    location_hint: 'TBD',
    prompt: 'TBD',
    answer: 'TBD'
  },
  {
    id: 12,
    branch: 'P',
    step: 3,
    title: 'Puzzle Box 3',
    location_hint: 'TBD',
    prompt: 'TBD',
    answer: 'TBD'
  }
];

/**
 * Normalize an answer for comparison
 * @param {string} input - User's answer
 * @returns {string} - Normalized: trimmed, uppercased, alphanumeric only
 */
function normalizeAnswer(input) {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Get a puzzle by ID
 * @param {number} id - Puzzle ID (1-12)
 * @returns {object|null}
 */
function getPuzzle(id) {
  return PUZZULAR.find(p => p.id === id) || null;
}

/**
 * Get all puzzles for a branch
 * @param {string} branch - Branch letter (F/M/D/B)
 * @returns {object[]}
 */
function getPuzzlesByBranch(branch) {
  return PUZZULAR.filter(p => p.branch === branch).sort((a, b) => a.step - b.step);
}

/**
 * Get puzzle by branch and step
 * @param {string} branch - Branch letter
 * @param {number} step - Step number (1-3)
 * @returns {object|null}
 */
function getPuzzleByBranchStep(branch, step) {
  return PUZZULAR.find(p => p.branch === branch && p.step === step) || null;
}

/**
 * Check if an answer is correct
 * @param {number} puzzleId
 * @param {string} userAnswer
 * @returns {boolean}
 */
function checkAnswer(puzzleId, userAnswer) {
  const puzzle = getPuzzle(puzzleId);
  if (!puzzle) return false;
  return normalizeAnswer(userAnswer) === normalizeAnswer(puzzle.answer);
}

/**
 * Build the digits string from completed branches
 * @param {string[]} completedBranches - Array of completed branch letters
 * @returns {string} - Digits string in fixed branch order
 */
function buildDigitsString(completedBranches) {
  let digits = '';
  for (const branch of BRANCH_ORDER) {
    if (completedBranches.includes(branch)) {
      digits += BRANCHES[branch].digits.join('');
    }
  }
  return digits;
}

/**
 * Apply permutation to digits string
 * @param {string} digits - 8-digit string
 * @param {string} perm - Permutation key (1-indexed positions)
 * @returns {string} - Permuted string
 */
function applyPermutation(digits, perm = PERMUTATION_KEY) {
  if (digits.length !== 8 || perm.length !== 8) return null;
  let result = '';
  for (const pos of perm) {
    const idx = parseInt(pos, 10) - 1; // Convert to 0-indexed
    result += digits[idx];
  }
  return result;
}

/**
 * Compute the vault code from completed branches
 * @param {string[]} completedBranches - Array of completed branch letters
 * @returns {object} - { digits, permuted, vaultCode } or nulls if incomplete
 */
function computeVaultCode(completedBranches) {
  const digits = buildDigitsString(completedBranches);
  
  if (digits.length < 8) {
    return { digits, permuted: null, vaultCode: null };
  }
  
  const permuted = applyPermutation(digits);
  const vaultCode = permuted ? permuted.slice(0, 6) : null;
  
  return { digits, permuted, vaultCode };
}

/**
 * Get all puzzles
 * @returns {object[]}
 */
function getAllPuzzles() {
  return PUZZULAR;
}

/**
 * Get puzzle with database overrides applied
 * @param {number} id - Puzzle ID
 * @param {object} db - Database module
 * @returns {object|null}
 */
function getPuzzleWithOverrides(id, db) {
  const base = getPuzzle(id);
  if (!base) return null;
  
  const override = db.getPuzzleOverride(id);
  if (!override) return base;
  
  return {
    ...base,
    location_hint: override.location_hint || base.location_hint,
    prompt: override.prompt || base.prompt,
    answer: override.answer ? override.answer.toUpperCase().replace(/[^A-Z0-9]/g, '') : base.answer
  };
}

/**
 * Get all puzzles with overrides applied
 * @param {object} db - Database module
 * @returns {object[]}
 */
function getAllPuzzlesWithOverrides(db) {
  return PUZZULAR.map(p => getPuzzleWithOverrides(p.id, db));
}

module.exports = {
  BRANCH_ORDER,
  BRANCHES,
  PERMUTATION_KEY,
  PUZZLES: PUZZULAR,
  normalizeAnswer,
  getPuzzle,
  getPuzzlesByBranch,
  getPuzzleByBranchStep,
  checkAnswer,
  buildDigitsString,
  applyPermutation,
  computeVaultCode,
  getAllPuzzles,
  getPuzzleWithOverrides,
  getAllPuzzlesWithOverrides
};
