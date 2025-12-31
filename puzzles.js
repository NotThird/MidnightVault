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
  L: { name: 'LEGO', icon: '🧱', color: '#e74c3c', digits: [4, 1], codeWord: 'MIDNIGHT', hint: 'Build a Lego set, show the host' },
  H: { name: 'HIDDEN', icon: '🔍', color: '#9b59b6', digits: [8, 2], codeWord: 'BREAK', hint: 'Find all 4 hidden QR codes!' },
  J: { name: 'JIGSAW', icon: '🧩', color: '#3498db', digits: [0, 9], codeWord: 'FEARLESS', hint: 'Complete the jigsaw, show the host' },
  P: { name: 'PUZZLE BOX', icon: '📦', color: '#27ae60', digits: [5, 3], codeWord: 'AGAIN', hint: 'Open the puzzle box to get QR' }
};

// Final phrase when all branches complete: "MIDNIGHT FEARLESS BREAK AGAIN"
const FINAL_PHRASE = ['MIDNIGHT', 'FEARLESS', 'BREAK', 'AGAIN'];

// Permutation key (1-indexed positions) - revealed at hub
const PERMUTATION_KEY = '26153478';

// 12 puzzles: 3 per branch, sequential steps within each branch
// Physical puzzle (Lego/Hidden/Jigsaw/Puzzle Box) reveals QR1, then chain continues
const PUZZULAR = [
  // LEGO branch (L1, L2, L3) - Chain puzzles, collect letters → MIDNIGHT
  // Build Lego set, get QR from host. Each puzzle gives letters.
  {
    id: 1,
    branch: 'L',
    step: 1,
    title: 'Lego Chain 1',
    location_hint: 'Complete a Lego set, show the host!',
    prompt: 'What Taylor Swift album came out in 2022? (One word, starts with M)',
    answer: 'MIDNIGHTS',
    collectLetters: ['M', 'I', 'D'],
    successMessage: 'Collect these letters: M, I, D - Write them down!'
  },
  {
    id: 2,
    branch: 'L',
    step: 2,
    title: 'Lego Chain 2',
    location_hint: 'Check near the snacks',
    prompt: 'Taylor\'s lucky number is?',
    answer: '13',
    collectLetters: ['N', 'I', 'G'],
    successMessage: 'Collect these letters: N, I, G - Add them to your list!'
  },
  {
    id: 3,
    branch: 'L',
    step: 3,
    title: 'Lego Chain 3',
    location_hint: 'Look by the window',
    prompt: 'Unscramble all 8 letters you collected (M,I,D,N,I,G,H,T) for a Taylor Swift album!',
    answer: 'MIDNIGHT',
    collectLetters: ['H', 'T'],
    successMessage: 'MIDNIGHT! You cracked the LEGO chain!'
  },

  // HIDDEN branch (H1, H2, H3, H4) - All 4 QRs physically hidden, scavenger hunt style
  // Puzzles are easy - the challenge is FINDING the QR codes. Clues lead to next location.
  // User will provide actual hiding spots and clues later
  {
    id: 4,
    branch: 'H',
    step: 1,
    title: 'Hidden Hunt 1',
    location_hint: 'TBD - user will set hiding spot',
    prompt: 'You found the first one! Answer this to get a clue to the next.',
    answer: 'TBD'
  },
  {
    id: 5,
    branch: 'H',
    step: 2,
    title: 'Hidden Hunt 2',
    location_hint: 'TBD - clue from puzzle 1',
    prompt: 'Nice hunting! Answer this for the next clue.',
    answer: 'TBD'
  },
  {
    id: 6,
    branch: 'H',
    step: 3,
    title: 'Hidden Hunt 3',
    location_hint: 'TBD - clue from puzzle 2',
    prompt: 'Getting close! Answer for the final clue.',
    answer: 'TBD'
  },
  {
    id: 13,
    branch: 'H',
    step: 4,
    title: 'Hidden Hunt 4',
    location_hint: 'TBD - clue from puzzle 3',
    prompt: 'Final hidden QR! Unscramble your letters to complete the branch.',
    answer: 'BREAK'
  },

  // JIGSAW branch (J1, J2, J3) - Word puzzles, collect letters → FEARLESS
  // Complete jigsaw, get QR from host. Each puzzle is a word game.
  {
    id: 7,
    branch: 'J',
    step: 1,
    title: 'Word Puzzle 1',
    location_hint: 'Complete the jigsaw, show the host!',
    prompt: 'Unscramble: YORTALS TIWSF (Famous singer)',
    answer: 'TAYLOR SWIFT',
    collectLetters: ['F', 'E', 'A'],
    successMessage: 'Collect these letters: F, E, A - Write them down!'
  },
  {
    id: 8,
    branch: 'J',
    step: 2,
    title: 'Word Puzzle 2',
    location_hint: 'Check the coffee table',
    prompt: 'Fill in the blank: Taylor\'s debut album was ______ (same as her name)',
    answer: 'TAYLOR SWIFT',
    collectLetters: ['R', 'L', 'E'],
    successMessage: 'Collect these letters: R, L, E - Add them to your list!'
  },
  {
    id: 9,
    branch: 'J',
    step: 3,
    title: 'Word Puzzle 3',
    location_hint: 'Near the TV',
    prompt: 'Unscramble all 8 letters (F,E,A,R,L,E,S,S) for a Taylor Swift album about being brave!',
    answer: 'FEARLESS',
    collectLetters: ['S', 'S'],
    successMessage: 'FEARLESS! You conquered the JIGSAW word puzzles!'
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
    location_hint: 'Behind the couch',
    prompt: 'At midnight we pop these, drink up, and toast. What bubbly beverage do we love the most?',
    answer: 'CHAMPAGNE'
  },
  {
    id: 12,
    branch: 'P',
    step: 3,
    title: 'Puzzle Box 3',
    location_hint: 'Check the bookshelf',
    prompt: 'I fall on January 1st, but I never get hurt. What am I?',
    answer: 'NEW YEARS DAY'
  },

  // SUPER HIDDEN PRIZE - Special bonus QR for top earner
  {
    id: 14,
    branch: 'X',
    step: 1,
    title: 'Super Hidden Prize',
    location_hint: 'SUPER SECRET LOCATION',
    prompt: 'Congratulations! You found the super secret prize! Show this to the host to claim your reward!',
    answer: 'WINNER'
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
  FINAL_PHRASE,
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
