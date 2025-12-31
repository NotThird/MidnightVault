/**
 * File Purpose: Puzzle data with parallel branch structure for Midnight Vault
 * High-Level Summary: 4 branches (F/M/D/B) x 3 puzzles each, sequential within branch
 * Dependencies: None
 * Semantic Tags: puzzles, branches, game-data
 * Version: 2.0.0
 */

// Branch order for digit concatenation
const BRANCH_ORDER = ['F', 'M', 'D', 'B'];

// Branch metadata
const BRANCHES = {
  F: { name: 'FOOD', color: '#e74c3c', digits: [4, 1] },
  M: { name: 'MUSIC', color: '#9b59b6', digits: [8, 2] },
  D: { name: 'DECOR', color: '#3498db', digits: [0, 9] },
  B: { name: 'BOOKS', color: '#27ae60', digits: [5, 3] }
};

// Permutation key (1-indexed positions) - revealed at hub
const PERMUTATION_KEY = '26153478';

// 12 puzzles: 3 per branch, sequential steps within each branch
const PUZZULAR = [
  // FOOD branch (F1, F2, F3)
  {
    id: 1,
    branch: 'F',
    step: 1,
    title: 'Food Puzzle 1',
    location_hint: 'Fridge',
    prompt: 'Caesar cipher +3: Decode "SODBOLVW"',
    answer: 'PLAYLIST'
  },
  {
    id: 2,
    branch: 'F',
    step: 2,
    title: 'Food Puzzle 2',
    location_hint: 'Snack Table',
    prompt: 'Read the acrostic on the card nearby. The first letters of each line spell a 4-letter word.',
    answer: 'FOOD'
  },
  {
    id: 3,
    branch: 'F',
    step: 3,
    title: 'Food Puzzle 3',
    location_hint: 'Drink Cooler',
    prompt: 'Riddle: "Twelve at midnight, sweet and round, a Spanish tradition that astounds."',
    answer: 'GRAPES'
  },

  // MUSIC branch (M1, M2, M3)
  {
    id: 4,
    branch: 'M',
    step: 1,
    title: 'Music Puzzle 1',
    location_hint: 'Speaker',
    prompt: 'What part of a song repeats the most?',
    answer: 'CHORUS'
  },
  {
    id: 5,
    branch: 'M',
    step: 2,
    title: 'Music Puzzle 2',
    location_hint: 'TV Remote',
    prompt: 'Unscramble: OPMET',
    answer: 'TEMPO'
  },
  {
    id: 6,
    branch: 'M',
    step: 3,
    title: 'Music Puzzle 3',
    location_hint: 'Playlist QR',
    prompt: 'Look at the playlist posted nearby. The first letters of the first 6 song titles spell what word?',
    answer: 'COUNTDOWN'
  },

  // DECOR branch (D1, D2, D3)
  {
    id: 7,
    branch: 'D',
    step: 1,
    title: 'Decor Puzzle 1',
    location_hint: 'Garland Tag',
    prompt: 'Unscramble: RAELGND',
    answer: 'GARLAND'
  },
  {
    id: 8,
    branch: 'D',
    step: 2,
    title: 'Decor Puzzle 2',
    location_hint: 'Balloons',
    prompt: 'Rebus puzzle: What do you get when party poppers go off?',
    answer: 'CONFETTI'
  },
  {
    id: 9,
    branch: 'D',
    step: 3,
    title: 'Decor Puzzle 3',
    location_hint: 'Mantle / Decor Shelf',
    prompt: 'Party staple that floats and pops (singular)',
    answer: 'BALLOON'
  },

  // BOOKS branch (B1, B2, B3)
  {
    id: 10,
    branch: 'B',
    step: 1,
    title: 'Books Puzzle 1',
    location_hint: 'Bookshelf Label "INDEX"',
    prompt: 'What do you call the back-of-book list used to find topics?',
    answer: 'INDEX'
  },
  {
    id: 11,
    branch: 'B',
    step: 2,
    title: 'Books Puzzle 2',
    location_hint: 'Bookmark in a Book',
    prompt: 'A book is divided into these numbered sections.',
    answer: 'CHAPTER'
  },
  {
    id: 12,
    branch: 'B',
    step: 3,
    title: 'Books Puzzle 3',
    location_hint: 'Spine-Facing Shelf',
    prompt: 'The part of a book you see when it sits on a shelf.',
    answer: 'SPINE'
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
