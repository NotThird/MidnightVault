/**
 * File Purpose: Express server for Midnight Vault (parallel branches version)
 * High-Level Summary: 4 parallel branches, hub unlock at 2, meta at 4
 * Dependencies: express, cookie-parser, ./db.js, ./puzzles.js
 * Semantic Tags: server, express, branches, game-logic
 * Version: 2.0.0
 */

const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const db = require('./db');
const puzzles = require('./puzzles');

const app = express();

// Configuration
const PORT = process.env.PORT || 3000;
const VAULT_CODE = process.env.VAULT_CODE || '194082';
const PRIZE_CLUE = process.env.PRIZE_CLUE || 'The treasure awaits in the freezer behind the ice cream! Gather everyone!';
const ADMIN_KEY = process.env.ADMIN_KEY || 'supersecret2024';

// NYE Countdown state (in-memory)
let nyeCountdownStart = null; // Timestamp when 10-second countdown started

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure participant exists
function ensureParticipant(req, res, next) {
  let participantId = req.cookies.participant_id;
  let participant = participantId ? db.getParticipant(participantId) : null;
  
  if (!participant) {
    participant = db.createParticipant();
    res.cookie('participant_id', participant.id, {
      maxAge: 365 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'lax'
    });
  }
  
  req.participant = participant;
  next();
}

// HTML escape
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Base layout
function layout(title, content, options = {}) {
  const { fullscreen = false, tv = false, refreshRate = 0 } = options;
  const bodyClass = [fullscreen ? 'fullscreen' : '', tv ? 'tv-mode' : ''].filter(Boolean).join(' ');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${escapeHtml(title)} | Midnight Vault</title>
  <link rel="stylesheet" href="/style.css">
  ${refreshRate > 0 ? `<meta http-equiv="refresh" content="${refreshRate}">` : ''}
</head>
<body class="${bodyClass}">
  ${content}
</body>
</html>`;
}

// Check if a puzzle's location should be visible
// Location is visible if:
// 1. That puzzle has been solved globally (you found it), OR
// 2. The previous step in the SAME branch has been solved globally (hint unlocked)
// 3. It's Step 1 (always visible - entry points)
function isLocationVisible(puzzle, globalSolvedIds) {
  // Step 1 locations are always visible - they're the entry points
  if (puzzle.step === 1) return true;
  
  // If this puzzle is already solved, location is obviously known
  if (globalSolvedIds.includes(puzzle.id)) return true;
  
  // Check if previous step in same branch is solved
  const prevPuzzle = puzzles.getPuzzleByBranchStep(puzzle.branch, puzzle.step - 1);
  if (prevPuzzle && globalSolvedIds.includes(prevPuzzle.id)) return true;
  
  return false;
}

// Branch status helper for templates
function renderBranchStatus(branchStatus) {
  return puzzles.BRANCH_ORDER.map(b => {
    const info = puzzles.BRANCHES[b];
    const status = branchStatus[b];
    const stepsHtml = status.steps.map((s, i) => 
      `<span class="step-dot ${s ? 'solved' : ''}">${i + 1}</span>`
    ).join('');
    return `
      <div class="branch-card ${status.done ? 'branch-done' : ''}" style="--branch-color: ${info.color}">
        <div class="branch-name">${info.name}</div>
        <div class="branch-steps">${stepsHtml}</div>
        ${status.done ? `<div class="branch-digits">+${info.digits.join('')}</div>` : ''}
      </div>`;
  }).join('');
}

// =============================================================================
// ROUTES
// =============================================================================

// GET / - Landing page
app.get('/', ensureParticipant, (req, res) => {
  const participant = req.participant;
  const solveCount = db.getParticipantSolveCount(participant.id);
  const branchStatus = db.getBranchStatus(puzzles);
  const doneCount = db.countDoneKeys();
  
  const content = `
  <div class="container phone-first">
    <header class="hero">
      <h1>Midnight Vault</h1>
      <p class="tagline">A Cooperative New Year's Mystery</p>
    </header>
    
    <section class="card">
      <h2>Welcome, ${escapeHtml(participant.nickname)}!</h2>
      ${solveCount > 0 ? `<p class="stat">You've solved ${solveCount} puzzle${solveCount !== 1 ? 's' : ''}</p>` : ''}
      
      <form action="/set-nickname" method="POST" class="nickname-form">
        <label for="nickname">Change your name:</label>
        <input type="text" id="nickname" name="nickname" placeholder="Nickname..." maxlength="24" value="${escapeHtml(participant.nickname)}">
        <button type="submit">Update</button>
      </form>
    </section>
    
    <section class="card">
      <h3>Branch Progress</h3>
      <div class="branches-grid">
        ${renderBranchStatus(branchStatus)}
      </div>
    </section>
    
    <section class="card instructions">
      <h3>How to Play</h3>
      <ol>
        <li>Find QR codes for each branch (FOOD, MUSIC, DECOR, BOOKS)</li>
        <li>Solve puzzles in sequence within each branch</li>
        <li>Complete 2 branches to unlock the <strong>Hub</strong></li>
        <li>Complete all 4 branches to unlock the <strong>Vault</strong></li>
      </ol>
    </section>
    
    <nav class="nav-links">
      <a href="/me" class="btn btn-secondary">My Progress</a>
      ${doneCount >= 2 ? '<a href="/hub" class="btn btn-primary">Hub</a>' : ''}
      ${doneCount >= 4 ? '<a href="/meta" class="btn btn-gold">Vault</a>' : ''}
    </nav>
  </div>`;
  
  res.send(layout('Welcome', content));
});

// POST /set-nickname
app.post('/set-nickname', ensureParticipant, (req, res) => {
  let nickname = (req.body.nickname || '').trim().slice(0, 24);
  if (!nickname) nickname = db.generateNickname();
  db.updateNickname(req.participant.id, nickname);
  res.redirect('/');
});

// GET /me - Personal progress
app.get('/me', ensureParticipant, (req, res) => {
  const participant = req.participant;
  const solvedIds = db.getParticipantSolvedPuzzles(participant.id);
  const globalSolvedIds = db.getGlobalSolvedPuzzleIds();
  
  const puzzleList = puzzles.BRANCH_ORDER.map(branch => {
    const branchPuzzles = puzzles.getPuzzlesByBranch(branch).map(p => puzzles.getPuzzleWithOverrides(p.id, db));
    const info = puzzles.BRANCHES[branch];
    
    const items = branchPuzzles.map((p, idx) => {
      const userSolved = solvedIds.includes(p.id);
      const globalSolved = globalSolvedIds.includes(p.id);
      const prevSolved = idx === 0 || globalSolvedIds.includes(branchPuzzles[idx - 1].id);
      const unlocked = prevSolved;
      const locationVisible = isLocationVisible(p, globalSolvedIds);
      
      return `
        <li class="${userSolved ? 'solved' : ''} ${!unlocked ? 'locked' : ''}">
          <a href="${unlocked ? `/p/${p.id}` : '#'}">
            <span class="puzzle-step">Step ${p.step}</span>
            <span class="puzzle-loc">${locationVisible ? escapeHtml(p.location_hint) : '???'}</span>
            ${userSolved ? '<span class="badge badge-success">Solved</span>' : 
              globalSolved ? '<span class="badge badge-global">Global</span>' :
              !unlocked ? '<span class="badge badge-locked">Locked</span>' :
              '<span class="badge badge-pending">Open</span>'}
          </a>
        </li>`;
    }).join('');
    
    return `
      <div class="branch-section" style="--branch-color: ${info.color}">
        <h4>${info.name}</h4>
        <ul class="puzzle-list-branch">${items}</ul>
      </div>`;
  }).join('');
  
  const content = `
  <div class="container phone-first">
    <header>
      <a href="/" class="back-link">&larr; Home</a>
      <h1>My Progress</h1>
    </header>
    
    <section class="card">
      <h2>${escapeHtml(participant.nickname)}</h2>
      <p class="big-stat">${solvedIds.length} / 12 puzzles solved</p>
      <p class="sub-stat">${solvedIds.length} raffle entries!</p>
    </section>
    
    <section class="branches-progress">
      ${puzzleList}
    </section>
  </div>`;
  
  res.send(layout('My Progress', content));
});

// GET /p/:id - Puzzle page
app.get('/p/:id', ensureParticipant, (req, res) => {
  const puzzleId = parseInt(req.params.id, 10);
  const puzzle = puzzles.getPuzzleWithOverrides(puzzleId, db);
  
  if (!puzzle) {
    return res.status(404).send(layout('Not Found', '<div class="container"><h1>Puzzle Not Found</h1><a href="/">Go Home</a></div>'));
  }
  
  const participant = req.participant;
  const userSolved = db.hasParticipantSolved(participant.id, puzzleId);
  const globalSolved = db.isPuzzleSolvedGlobally(puzzleId);
  const globalSolvedIds = db.getGlobalSolvedPuzzleIds();
  const locationVisible = isLocationVisible(puzzle, globalSolvedIds);
  
  // Check prerequisite: previous step in same branch must be globally solved
  const branchInfo = puzzles.BRANCHES[puzzle.branch];
  let unlocked = true;
  let lockReason = '';
  
  if (puzzle.step > 1) {
    const prevPuzzle = puzzles.getPuzzleByBranchStep(puzzle.branch, puzzle.step - 1);
    if (prevPuzzle && !globalSolvedIds.includes(prevPuzzle.id)) {
      unlocked = false;
      lockReason = `Step ${puzzle.step - 1} must be solved first.`;
    }
  }
  
  const content = `
  <div class="container phone-first">
    <header>
      <a href="/me" class="back-link">&larr; Progress</a>
      <h1>${branchInfo.name} - Step ${puzzle.step}</h1>
    </header>
    
    <section class="card puzzle-card" style="--branch-color: ${branchInfo.color}">
      <div class="puzzle-header">
        <span class="category-badge" style="background: ${branchInfo.color}">${branchInfo.name}</span>
        <span class="step-badge">Step ${puzzle.step}/3</span>
      </div>
      
      ${locationVisible ? `
        <p class="location-hint">Location: <strong>${escapeHtml(puzzle.location_hint)}</strong></p>
      ` : `
        <p class="location-hint location-hidden">Location: <strong>???</strong></p>
        <p class="discovery-note"><em>Solve ${puzzles.BRANCHES[puzzle.branch].name} Step ${puzzle.step - 1} to reveal this location!</em></p>
      `}
      
      <div class="status-row">
        <span class="status ${globalSolved ? 'status-solved' : 'status-unsolved'}">
          Global: ${globalSolved ? 'SOLVED' : 'OPEN'}
        </span>
        <span class="status ${userSolved ? 'status-solved' : 'status-unsolved'}">
          You: ${userSolved ? 'SOLVED' : 'OPEN'}
        </span>
      </div>
      
      ${!unlocked ? `
        <div class="locked-message">
          <div class="lock-icon">&#128274;</div>
          <p>${escapeHtml(lockReason)}</p>
        </div>
      ` : userSolved ? `
        <div class="already-solved">
          <div class="checkmark">&#10004;</div>
          <p>You already solved this!</p>
        </div>
      ` : `
        <div class="puzzle-prompt">
          <p>${escapeHtml(puzzle.prompt)}</p>
        </div>
        
        <form action="/p/${puzzle.id}/submit" method="POST" class="answer-form">
          <input type="text" name="answer" placeholder="Your answer..." autocomplete="off" required>
          <button type="submit">Submit</button>
        </form>
      `}
    </section>
    
    <nav class="nav-links">
      <a href="/me" class="btn btn-secondary">My Progress</a>
      <a href="/" class="btn btn-secondary">Home</a>
    </nav>
  </div>`;
  
  res.send(layout(`${branchInfo.name} Step ${puzzle.step}`, content));
});

// POST /p/:id/submit - Submit answer
app.post('/p/:id/submit', ensureParticipant, (req, res) => {
  const puzzleId = parseInt(req.params.id, 10);
  const puzzle = puzzles.getPuzzleWithOverrides(puzzleId, db);
  
  if (!puzzle) {
    return res.status(404).send(layout('Not Found', '<div class="container"><h1>Puzzle Not Found</h1></div>'));
  }
  
  const participant = req.participant;
  const answer = req.body.answer || '';
  // Check answer against override if exists, otherwise default
  const normalizedAnswer = puzzles.normalizeAnswer(answer);
  const isCorrect = normalizedAnswer === puzzle.answer;
  const branchInfo = puzzles.BRANCHES[puzzle.branch];
  
  if (isCorrect) {
    const result = db.recordSolve(participant.id, puzzleId);
    
    // Check if this completes the branch (step 3 first solve)
    let branchCompleted = false;
    if (puzzle.step === 3 && result.isFirst) {
      const doneKey = `${puzzle.branch}_DONE`;
      if (!db.hasGlobalKey(doneKey)) {
        db.setGlobalKey(doneKey);
        branchCompleted = true;
      }
    }
    
    const doneCount = db.countDoneKeys();
    const hubUnlocked = doneCount >= 2;
    const metaUnlocked = doneCount >= 4;
    
    let message;
    if (result.alreadySolved) {
      message = "You already solved this!";
    } else if (result.isFirst) {
      message = "FIRST SOLVE! You cracked it!";
    } else {
      message = "Correct! Your solve is recorded.";
    }
    
    const content = `
    <div class="container phone-first">
      <header>
        <h1>Correct!</h1>
      </header>
      
      <section class="card success-card" style="--branch-color: ${branchInfo.color}">
        <div class="checkmark">&#10004;</div>
        <p class="success-message">${escapeHtml(message)}</p>
        
        ${branchCompleted ? `
          <div class="branch-complete-banner">
            <p><strong>${branchInfo.name} BRANCH COMPLETE!</strong></p>
            <p>Digits earned: <span class="digits">${branchInfo.digits.join('')}</span></p>
          </div>
        ` : ''}
        
        ${hubUnlocked && doneCount === 2 ? `
          <div class="unlock-banner hub-unlock">
            <p>&#128275; <strong>HUB UNLOCKED!</strong></p>
            <a href="/hub" class="btn btn-primary">Go to Hub</a>
          </div>
        ` : ''}
        
        ${metaUnlocked && doneCount === 4 ? `
          <div class="unlock-banner meta-unlock">
            <p>&#128275; <strong>VAULT UNLOCKED!</strong></p>
            <a href="/meta" class="btn btn-gold">Go to Vault</a>
          </div>
        ` : ''}
      </section>
      
      <nav class="nav-links">
        <a href="/me" class="btn btn-secondary">My Progress</a>
        <a href="/" class="btn btn-secondary">Find More</a>
        ${hubUnlocked ? '<a href="/hub" class="btn btn-primary">Hub</a>' : ''}
      </nav>
    </div>`;
    
    res.send(layout('Correct!', content));
  } else {
    const content = `
    <div class="container phone-first">
      <header>
        <a href="/p/${puzzleId}" class="back-link">&larr; Try Again</a>
        <h1>Incorrect</h1>
      </header>
      
      <section class="card error-card">
        <div class="xmark">&#10008;</div>
        <p>That's not right. Try again!</p>
      </section>
      
      <nav class="nav-links">
        <a href="/p/${puzzleId}" class="btn btn-primary">Try Again</a>
      </nav>
    </div>`;
    
    res.send(layout('Incorrect', content));
  }
});

// GET /hub - Hub page (unlocks at 2 branches)
app.get('/hub', ensureParticipant, (req, res) => {
  const doneCount = db.countDoneKeys();
  const completedBranches = db.getCompletedBranches();
  const branchStatus = db.getBranchStatus(puzzles);
  const permKey = db.getPermutationKey();
  
  if (doneCount < 2) {
    const content = `
    <div class="container phone-first">
      <header>
        <a href="/" class="back-link">&larr; Home</a>
        <h1>Hub</h1>
      </header>
      
      <section class="card locked-message">
        <div class="lock-icon">&#128274;</div>
        <p>The Hub unlocks when <strong>2 branches</strong> are complete.</p>
        <p>Branches done: ${doneCount} / 2</p>
      </section>
      
      <section class="card">
        <h3>Branch Status</h3>
        <div class="branches-grid">
          ${renderBranchStatus(branchStatus)}
        </div>
      </section>
    </div>`;
    
    return res.send(layout('Hub - Locked', content));
  }
  
  // Hub is unlocked
  const { digits } = puzzles.computeVaultCode(completedBranches);
  
  const content = `
  <div class="container phone-first">
    <header>
      <a href="/" class="back-link">&larr; Home</a>
      <h1>The Hub</h1>
    </header>
    
    <section class="card hub-unlocked">
      <div class="unlock-icon">&#128275;</div>
      <h2>Hub Unlocked!</h2>
      <p>You've completed ${doneCount} branch${doneCount !== 1 ? 'es' : ''}.</p>
    </section>
    
    <section class="card">
      <h3>Branch Status</h3>
      <div class="branches-grid">
        ${renderBranchStatus(branchStatus)}
      </div>
    </section>
    
    <section class="card digits-collected">
      <h3>Digits Collected</h3>
      <p class="digits-string">${digits || '(none yet)'}</p>
      <p class="note">Digits are added in branch order: FOOD, MUSIC, DECOR, BOOKS</p>
    </section>
    
    <section class="card perm-reveal">
      <h3>Permutation Key</h3>
      <p class="perm-key">${permKey}</p>
      <p class="note">When all 4 branches are done, apply this permutation to the digits, then take the first 6 digits for the vault code.</p>
    </section>
    
    ${doneCount >= 4 ? `
      <nav class="nav-links">
        <a href="/meta" class="btn btn-gold">Go to Vault</a>
      </nav>
    ` : `
      <section class="card">
        <p>Complete ${4 - doneCount} more branch${4 - doneCount !== 1 ? 'es' : ''} to unlock the Vault!</p>
      </section>
    `}
  </div>`;
  
  res.send(layout('The Hub', content));
});

// GET /meta - Final vault page (unlocks at 4 branches)
app.get('/meta', ensureParticipant, (req, res) => {
  const doneCount = db.countDoneKeys();
  const completedBranches = db.getCompletedBranches();
  const branchStatus = db.getBranchStatus(puzzles);
  const permKey = db.getPermutationKey();
  
  if (doneCount < 4) {
    const content = `
    <div class="container phone-first">
      <header>
        <a href="/" class="back-link">&larr; Home</a>
        <h1>The Vault</h1>
      </header>
      
      <section class="card locked-message">
        <div class="lock-icon">&#128274;</div>
        <p>The Vault unlocks when <strong>all 4 branches</strong> are complete.</p>
        <p>Branches done: ${doneCount} / 4</p>
      </section>
      
      <section class="card">
        <h3>Branch Status</h3>
        <div class="branches-grid">
          ${renderBranchStatus(branchStatus)}
        </div>
      </section>
      
      ${doneCount >= 2 ? `
        <nav class="nav-links">
          <a href="/hub" class="btn btn-primary">Go to Hub</a>
        </nav>
      ` : ''}
    </div>`;
    
    return res.send(layout('Vault - Locked', content));
  }
  
  // Vault is unlocked
  const { digits, permuted, vaultCode } = puzzles.computeVaultCode(completedBranches);
  
  const content = `
  <div class="container phone-first">
    <header>
      <a href="/" class="back-link">&larr; Home</a>
      <h1>The Vault</h1>
    </header>
    
    <section class="card vault-unlocked">
      <div class="unlock-icon">&#127881;</div>
      <h2>All Branches Complete!</h2>
    </section>
    
    <section class="card vault-math">
      <h3>Vault Code Computation</h3>
      <div class="math-step">
        <span class="label">Digits (F+M+D+B):</span>
        <span class="value">${digits}</span>
      </div>
      <div class="math-step">
        <span class="label">Permutation:</span>
        <span class="value">${permKey}</span>
      </div>
      <div class="math-step">
        <span class="label">Permuted:</span>
        <span class="value">${permuted}</span>
      </div>
      <div class="math-step result">
        <span class="label">Vault Code (first 6):</span>
        <span class="value">${vaultCode}</span>
      </div>
    </section>
    
    <section class="card vault-entry">
      <h3>Enter Vault Code</h3>
      <form action="/meta/submit" method="POST" class="vault-form">
        <input type="text" name="code" placeholder="6-digit code" pattern="[0-9]{6}" maxlength="6" required>
        <button type="submit">Open Vault</button>
      </form>
    </section>
  </div>`;
  
  res.send(layout('The Vault', content));
});

// POST /meta/submit - Submit vault code
app.post('/meta/submit', ensureParticipant, (req, res) => {
  const submittedCode = (req.body.code || '').trim();
  const completedBranches = db.getCompletedBranches();
  const { vaultCode } = puzzles.computeVaultCode(completedBranches);
  
  // Accept either the computed code or the env override
  const isCorrect = submittedCode === vaultCode || submittedCode === VAULT_CODE;
  
  if (isCorrect) {
    const content = `
    <div class="container phone-first">
      <header>
        <h1>VAULT OPENED!</h1>
      </header>
      
      <section class="card prize-reveal">
        <div class="celebration">&#127881; &#127881; &#127881;</div>
        <h2>The Prize Clue</h2>
        <p class="prize-clue">${escapeHtml(PRIZE_CLUE)}</p>
        <p class="instruction">Gather everyone together to claim the prize!</p>
      </section>
      
      <nav class="nav-links">
        <a href="/" class="btn btn-primary">Back to Home</a>
      </nav>
    </div>`;
    
    res.send(layout('Vault Opened!', content));
  } else {
    const content = `
    <div class="container phone-first">
      <header>
        <a href="/meta" class="back-link">&larr; Back</a>
        <h1>Wrong Code</h1>
      </header>
      
      <section class="card error-card">
        <div class="xmark">&#10008;</div>
        <p>That code doesn't work. Check your math!</p>
      </section>
      
      <nav class="nav-links">
        <a href="/meta" class="btn btn-primary">Try Again</a>
      </nav>
    </div>`;
    
    res.send(layout('Wrong Code', content));
  }
});

// GET /tv - Cinematic TV Dashboard (PS5 compatible)
app.get('/tv', (req, res) => {
  // Server-side countdown calculation for PS5 compatibility
  const now = Date.now();
  const targetUTC = Date.UTC(2026, 0, 1, 6, 0, 0); // Midnight Central = 6am UTC
  const diff = targetUTC - now;

  let countdownText = 'HAPPY NEW YEAR!';
  let isMidnight = false;
  let bigCountdownNumber = null; // For the 10-second dramatic countdown

  // Check if admin started a 10-second countdown
  if (nyeCountdownStart) {
    const elapsed = Math.floor((now - nyeCountdownStart) / 1000);
    if (elapsed < 10) {
      bigCountdownNumber = 10 - elapsed;
    } else if (elapsed < 15) {
      // Show celebration for 5 seconds after countdown ends
      isMidnight = true;
      bigCountdownNumber = 0;
    } else {
      // Reset after 15 seconds
      nyeCountdownStart = null;
    }
  }

  if (!bigCountdownNumber && diff > 0) {
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    countdownText = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else if (diff <= 0) {
    isMidnight = true;
  }

  // Server-side taunt selection
  const globalSolved = db.getGlobalSolvedPuzzleIds().length;
  const completedBranches = db.getCompletedBranches();
  const hubUnlocked = completedBranches.length >= 2;
  const vaultUnlocked = completedBranches.length >= 4;

  const taunts = {
    start: ["Tick tock... the Vault grows impatient.", "You think you can outsmart ME?", "My puzzles have stumped greater minds."],
    progress: ["Lucky guesses, nothing more.", "Don't get cocky.", "Beginner's luck won't last."],
    halfway: ["Okay, maybe you're not COMPLETE idiots...", "The Vault trembles... but won't fall!", "Midnight approaches, fools!"],
    nearEnd: ["NO! This cannot be happening!", "IMPOSSIBLE!", "You're cheating! You MUST be!"],
    hubUnlocked: ["The Hub means nothing! NOTHING!", "You'll need ALL FOUR branches!", "Enjoy your tiny victory."],
    vaultReady: ["NO! STAY BACK!", "One wrong code = LOCKED FOREVER!", "This isn't over!"]
  };

  let tauntCategory = 'start';
  if (vaultUnlocked) tauntCategory = 'vaultReady';
  else if (hubUnlocked) tauntCategory = 'hubUnlocked';
  else if (globalSolved >= 10) tauntCategory = 'nearEnd';
  else if (globalSolved >= 6) tauntCategory = 'halfway';
  else if (globalSolved >= 2) tauntCategory = 'progress';

  const tauntList = taunts[tauntCategory];
  const taunt = tauntList[Math.floor(Math.random() * tauntList.length)];

  const content = `
  <div class="tv-split-layout">
    <!-- LEFT: Main Video Area -->
    <div class="tv-video-main">
      <div class="tv-video-wrapper">
        <iframe
          id="yt-player"
          src="https://www.youtube.com/embed/L_LUpnjgPso?autoplay=1&mute=1&loop=1&playlist=L_LUpnjgPso&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&vq=hd1080"
          frameborder="0"
          allow="autoplay; encrypted-media"
          allowfullscreen>
        </iframe>
      </div>

      <!-- Countdown Overlay on Video -->
      <div class="tv-countdown-overlay">
        <div class="nye-label">COUNTDOWN TO MIDNIGHT</div>
        <div class="nye-clock" id="countdown">${countdownText}</div>
        <div class="nye-timezone">CENTRAL TIME</div>
      </div>
    </div>

    <!-- RIGHT: Game Sidebar -->
    <div class="tv-game-sidebar">
      <!-- Header -->
      <div class="sidebar-header">
        <span class="vault-lock" id="vault-lock">&#128274;</span>
        <h1 class="sidebar-title">MIDNIGHT VAULT</h1>
        <p class="sidebar-subtitle">New Year's Eve Mystery</p>
      </div>

      <!-- Progress Ring -->
      <div class="sidebar-progress">
        <div class="progress-ring-container">
          <svg class="progress-ring" viewBox="0 0 200 200">
            <circle class="progress-ring-bg" cx="100" cy="100" r="90"/>
            <circle class="progress-ring-fill" id="progress-ring" cx="100" cy="100" r="90"/>
          </svg>
          <div class="progress-ring-text">
            <span class="progress-number" id="solved-count">0</span>
            <span class="progress-label">of 12</span>
          </div>
        </div>
      </div>

      <!-- Branch Cards -->
      <div class="sidebar-branches">
        <div class="sidebar-branch" id="branch-F" style="--branch-color: #e74c3c">
          <span class="branch-icon">&#127860;</span>
          <span class="branch-name">FOOD</span>
          <div class="branch-dots" id="dots-F"></div>
          <span class="branch-check">&#10004;</span>
        </div>
        <div class="sidebar-branch" id="branch-M" style="--branch-color: #9b59b6">
          <span class="branch-icon">&#127926;</span>
          <span class="branch-name">MUSIC</span>
          <div class="branch-dots" id="dots-M"></div>
          <span class="branch-check">&#10004;</span>
        </div>
        <div class="sidebar-branch" id="branch-D" style="--branch-color: #3498db">
          <span class="branch-icon">&#127880;</span>
          <span class="branch-name">DECOR</span>
          <div class="branch-dots" id="dots-D"></div>
          <span class="branch-check">&#10004;</span>
        </div>
        <div class="sidebar-branch" id="branch-B" style="--branch-color: #27ae60">
          <span class="branch-icon">&#128218;</span>
          <span class="branch-name">BOOKS</span>
          <div class="branch-dots" id="dots-B"></div>
          <span class="branch-check">&#10004;</span>
        </div>
      </div>

      <!-- Unlock Status -->
      <div class="sidebar-unlocks">
        <div class="unlock-item" id="hub-box">
          <span class="unlock-icon" id="hub-icon">&#128274;</span>
          <span class="unlock-text">HUB (2)</span>
        </div>
        <div class="unlock-item" id="vault-box">
          <span class="unlock-icon" id="vault-icon">&#128274;</span>
          <span class="unlock-text">VAULT (4)</span>
        </div>
      </div>

      <!-- Digits -->
      <div class="sidebar-digits" id="digits-section">
        <div class="digits-label">DIGITS</div>
        <div class="digits-value" id="digits-display">????????</div>
      </div>

      <!-- Evil Taunt -->
      <div class="sidebar-taunt">
        <span class="taunt-avatar">&#128520;</span>
        <p class="taunt-message" id="vault-taunt">${taunt}</p>
      </div>

      <!-- MVP & Feed -->
      <div class="sidebar-footer">
        <div class="mvp-row">
          <span class="mvp-crown">&#128081;</span>
          <span class="mvp-name" id="mvp-name">---</span>
        </div>
        <div class="feed-row" id="recent-feed"></div>
      </div>
    </div>

    <!-- Big Countdown Overlay (JS controlled) -->
    <div class="big-countdown-overlay" id="big-countdown">
      <div class="big-countdown-number" id="big-countdown-num"></div>
    </div>

    <!-- Celebration Overlay -->
    <div class="celebration-overlay${isMidnight ? ' active midnight-celebration' : ''}" id="celebration">
      ${isMidnight && vaultUnlocked ? `
      <iframe class="ball-drop-video"
        src="https://www.youtube.com/embed/3CXWDGmXf6k?autoplay=1&mute=0&start=0&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1"
        frameborder="0"
        allow="autoplay; encrypted-media"
        allowfullscreen>
      </iframe>
      ` : ''}
      <div class="confetti-container" id="confetti"></div>
      <div class="celebration-text" id="celebration-text">${isMidnight ? (vaultUnlocked ? '🎉 HAPPY NEW YEAR 2026! 🎉<br>THE VAULT IS OPEN!' : '🎆 HAPPY NEW YEAR 2026! 🎆') : ''}</div>
    </div>
  </div>

  <script>
    const BRANCHES = ${JSON.stringify(puzzles.BRANCHES)};
    const BRANCH_ORDER = ${JSON.stringify(puzzles.BRANCH_ORDER)};

    let lastSolvedCount = 0;
    let lastCompletedBranches = [];
    let lastTauntIndex = -1;
    let currentTauntCategory = 'start';
    let tauntNeedsUpdate = true;

    // Evil Vault Taunts based on progress
    const VAULT_TAUNTS = {
      start: [
        "Tick tock, tick tock... the Vault grows impatient.",
        "You think you can outsmart ME? Adorable.",
        "The secrets within shall remain MINE forever!",
        "Go ahead, try your luck. I could use the entertainment.",
        "Another year, another group of wannabe vault-crackers...",
        "My puzzles have stumped far greater minds than yours."
      ],
      progress: [
        "Hmph. Lucky guesses, nothing more.",
        "Don't get cocky. The REAL puzzles are yet to come.",
        "You solved ONE? I have ELEVEN more waiting!",
        "Beginner's luck. It won't last.",
        "Even a broken clock is right twice a day...",
        "Is that the best you can do? Pathetic."
      ],
      halfway: [
        "Okay, maybe you're not COMPLETE idiots...",
        "The Vault trembles... but it will NOT fall!",
        "Impressive. But can you keep up the pace?",
        "Half done? Midnight approaches, fools!",
        "You're making this too easy. I'm not even trying yet.",
        "The clock is your enemy now, not just me."
      ],
      nearEnd: [
        "NO! This cannot be happening!",
        "IMPOSSIBLE! My puzzles were PERFECT!",
        "You're cheating! You MUST be cheating!",
        "Fine! Take your digits! But you'll NEVER crack the code!",
        "The permutation key will be your UNDOING!",
        "I... I underestimated you. It won't happen again."
      ],
      hubUnlocked: [
        "So you found the Hub. Big deal. The Vault is IMPENETRABLE!",
        "The Hub reveals nothing! NOTHING!",
        "Two branches? You'll need ALL FOUR to face me!",
        "Enjoy your tiny victory. It means NOTHING."
      ],
      vaultReady: [
        "NO! STAY BACK! THE VAULT IS MINE!",
        "You may have the digits, but can you COMPUTE?!",
        "One wrong code and it's LOCKED FOREVER!",
        "I won't go down without a fight!",
        "This isn't over... THIS ISN'T OVER!"
      ],
      defeated: [
        "...Fine. You win. This time.",
        "The Vault... opens. Happy New Year, I suppose.",
        "You've bested me. Enjoy your prize, mortals."
      ]
    };

    function getRandomTaunt(category) {
      const taunts = VAULT_TAUNTS[category];
      let index;
      do {
        index = Math.floor(Math.random() * taunts.length);
      } while (index === lastTauntIndex && taunts.length > 1);
      lastTauntIndex = index;
      return taunts[index];
    }

    function updateTaunt(solved, hubUnlocked, vaultUnlocked, forceUpdate = false) {
      let category;
      if (vaultUnlocked) {
        category = 'vaultReady';
      } else if (hubUnlocked) {
        category = 'hubUnlocked';
      } else if (solved >= 10) {
        category = 'nearEnd';
      } else if (solved >= 6) {
        category = 'halfway';
      } else if (solved >= 2) {
        category = 'progress';
      } else {
        category = 'start';
      }

      // Only update if category changed or forced update
      if (category !== currentTauntCategory || forceUpdate || tauntNeedsUpdate) {
        currentTauntCategory = category;
        tauntNeedsUpdate = false;
        const el = document.getElementById('vault-taunt');
        el.style.animation = 'none';
        el.offsetHeight; // Trigger reflow
        el.style.animation = 'taunt-fade 0.5s ease';
        el.textContent = getRandomTaunt(category);
      }
    }

    // Rotate taunts every 15 seconds
    setInterval(() => { tauntNeedsUpdate = true; }, 15000);

    function updateCountdown() {
      try {
        // Target: Jan 1, 2026 00:00:00 Central Time (UTC-6)
        // Central Standard Time is UTC-6
        const targetUTC = Date.UTC(2026, 0, 1, 6, 0, 0); // Midnight Central = 6am UTC
        const nowUTC = Date.now();
        const diff = targetUTC - nowUTC;

        const el = document.getElementById('countdown');
        if (!el) return;

        if (diff <= 0) {
          el.textContent = 'HAPPY NEW YEAR!';
          el.classList.add('midnight');
          return;
        }

        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);

        el.textContent =
          hours.toString().padStart(2, '0') + ':' +
          mins.toString().padStart(2, '0') + ':' +
          secs.toString().padStart(2, '0');
      } catch (e) {
        console.error('Countdown error:', e);
      }
    }

    function spawnConfetti() {
      const container = document.getElementById('confetti');
      container.innerHTML = '';
      const colors = ['#ffd700', '#e74c3c', '#9b59b6', '#3498db', '#2ecc71', '#fff'];
      for (let i = 0; i < 50; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + '%';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = Math.random() * 0.5 + 's';
        piece.style.animationDuration = (2 + Math.random() * 2) + 's';
        container.appendChild(piece);
      }
    }

    function celebrate(text) {
      const overlay = document.getElementById('celebration');
      const textEl = document.getElementById('celebration-text');
      textEl.innerHTML = text;
      spawnConfetti();
      overlay.classList.add('active');
      setTimeout(() => overlay.classList.remove('active'), 4000);
    }

    async function updateStatus() {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();

        // Progress Ring
        const ring = document.getElementById('progress-ring');
        const circumference = 2 * Math.PI * 90;
        const offset = circumference - (data.globalPct / 100) * circumference;
        ring.style.strokeDasharray = circumference;
        ring.style.strokeDashoffset = offset;

        document.getElementById('solved-count').textContent = data.globalSolved;

        // Check for new solve celebration
        if (data.globalSolved > lastSolvedCount && lastSolvedCount > 0) {
          celebrate('PUZZLE SOLVED!');
        }
        lastSolvedCount = data.globalSolved;

        // Branch Cards
        const completedNow = [];
        for (const b of BRANCH_ORDER) {
          const status = data.branchStatus[b];
          const card = document.getElementById('branch-' + b);
          const dotsEl = document.getElementById('dots-' + b);

          dotsEl.innerHTML = status.steps.map((solved, i) =>
            '<span class="step-pip ' + (solved ? 'solved' : '') + '">' + (i+1) + '</span>'
          ).join('');

          if (status.done) {
            card.classList.add('complete');
            completedNow.push(b);
          } else {
            card.classList.remove('complete');
          }
        }

        // Check for branch completion celebration
        for (const b of completedNow) {
          if (!lastCompletedBranches.includes(b)) {
            celebrate(BRANCHES[b].name.toUpperCase() + ' COMPLETE!<br><span class="celebrate-digits">Digits: ' + BRANCHES[b].digits.join(' ') + '</span>');
          }
        }
        lastCompletedBranches = completedNow;

        // Hub/Vault Status
        const hubBox = document.getElementById('hub-box');
        const vaultBox = document.getElementById('vault-box');
        const hubIcon = document.getElementById('hub-icon');
        const vaultIcon = document.getElementById('vault-icon');
        const vaultLock = document.getElementById('vault-lock');

        if (data.hubUnlocked) {
          hubBox.classList.add('unlocked');
          hubIcon.innerHTML = '&#128275;';
        }
        if (data.metaUnlocked) {
          vaultBox.classList.add('unlocked');
          vaultIcon.innerHTML = '&#128275;';
          vaultLock.innerHTML = '&#128275;';
        }

        // Digits
        const digitsSection = document.getElementById('digits-section');
        if (data.hubUnlocked && data.digits) {
          digitsSection.classList.add('visible');
          document.getElementById('digits-display').textContent = data.digits;
        }

        // MVP
        if (data.contributors.length > 0) {
          const mvp = data.contributors[0];
          document.getElementById('mvp-name').textContent = mvp.nickname + ' (' + mvp.solves + ')';
        }

        // Recent Feed
        const feedHtml = data.recent.slice(0, 8).map(r => {
          const time = new Date(r.solved_at + 'Z').toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          return '<span class="feed-item"><span class="feed-time">' + time + '</span> ' +
                 '<span class="feed-name">' + escapeHtml(r.nickname) + '</span> solved <span class="feed-puzzle">' + r.branch + r.step + '</span></span>';
        }).join('');
        document.getElementById('recent-feed').innerHTML = feedHtml;

        // Update evil vault taunt
        updateTaunt(data.globalSolved, data.hubUnlocked, data.metaUnlocked);

      } catch (e) {
        console.error('Update failed:', e);
      }
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // Init
    updateStatus();
    updateCountdown();
    setInterval(updateStatus, 2000);
    setInterval(updateCountdown, 1000);

    // NYE Big Countdown - poll server and update locally
    let lastDisplay = null;
    const bigCountdownOverlay = document.getElementById('big-countdown');
    const bigCountdownNum = document.getElementById('big-countdown-num');
    const celebrationOverlay = document.getElementById('celebration');
    const celebrationText = document.getElementById('celebration-text');

    async function checkNYECountdown() {
      try {
        const res = await fetch('/api/nye-countdown');
        const data = await res.json();

        if (data.display !== null) {
          // Show countdown overlay
          bigCountdownOverlay.classList.add('active');

          // Update display if changed
          if (data.display !== lastDisplay) {
            bigCountdownNum.textContent = data.display;
            lastDisplay = data.display;

            // Different styling for numbers vs text
            if (data.isNumber) {
              bigCountdownNum.classList.add('is-number');
              bigCountdownNum.classList.remove('is-text');
            } else {
              bigCountdownNum.classList.add('is-text');
              bigCountdownNum.classList.remove('is-number');
            }

            // Trigger pop animation
            bigCountdownNum.style.animation = 'none';
            bigCountdownNum.offsetHeight; // Force reflow
            bigCountdownNum.style.animation = '';
          }
        } else if (data.showCelebration) {
          // Hide countdown, show celebration
          bigCountdownOverlay.classList.remove('active');
          celebrationOverlay.classList.add('active', 'midnight-celebration');
          celebrationText.innerHTML = '🎆 HAPPY NEW YEAR 2026! 🎆';
          lastDisplay = null;
        } else {
          // Nothing active
          bigCountdownOverlay.classList.remove('active');
          celebrationOverlay.classList.remove('active', 'midnight-celebration');
          lastDisplay = null;
        }
      } catch (e) {
        console.error('Countdown check failed:', e);
      }
    }

    // Check countdown frequently (every 100ms for smooth updates)
    setInterval(checkNYECountdown, 100);
    checkNYECountdown();
  </script>`;

  // No page refresh - everything is handled by JS polling
  res.send(layout('Party Wall', content, { fullscreen: true, tv: true, refreshRate: 0 }));
});

// GET /admin - Comprehensive Admin Panel
app.get('/admin', (req, res) => {
  if (req.query.key !== ADMIN_KEY) {
    return res.status(403).send(layout('Access Denied', '<div class="container"><h1>Access Denied</h1><p>Add ?key=YOUR_ADMIN_KEY to the URL</p></div>'));
  }
  
  const branchStatus = db.getBranchStatus(puzzles);
  const completedBranches = db.getCompletedBranches();
  const globalSolvedIds = db.getGlobalSolvedPuzzleIds();
  const { digits, permuted, vaultCode } = puzzles.computeVaultCode(completedBranches);
  const contributors = db.getContributors(20);
  const allSolves = db.getAllSolves();
  const globalKeys = db.getGlobalKeys();
  const allPuzzleOverrides = db.getAllPuzzleOverrides();
  
  // Build puzzle cards by branch with edit forms
  const puzzlesByBranch = puzzles.BRANCH_ORDER.map(branch => {
    const info = puzzles.BRANCHES[branch];
    const branchPuzzles = puzzles.getPuzzlesByBranch(branch);
    const status = branchStatus[branch];
    
    const puzzleCards = branchPuzzles.map(p => {
      const isSolved = globalSolvedIds.includes(p.id);
      const override = allPuzzleOverrides.find(o => o.puzzle_id === p.id);
      const currentLocation = override?.location_hint || p.location_hint;
      const currentPrompt = override?.prompt || p.prompt;
      const currentAnswer = override?.answer || p.answer;
      const hasOverride = !!override;
      
      return `
        <div class="admin-puzzle-card ${isSolved ? 'solved' : ''} ${hasOverride ? 'has-override' : ''}">
          <div class="puzzle-card-header">
            <span class="puzzle-id">#${p.id}</span>
            <span class="puzzle-step">Step ${p.step}</span>
            <span class="puzzle-status">${isSolved ? '&#10004; SOLVED' : '&#9711; OPEN'}</span>
            ${hasOverride ? '<span class="override-badge">EDITED</span>' : ''}
          </div>
          <form action="/admin/puzzle/${p.id}?key=${ADMIN_KEY}" method="POST" class="puzzle-edit-form">
            <div class="form-group">
              <label>Location:</label>
              <input type="text" name="location_hint" value="${escapeHtml(currentLocation)}" placeholder="Where to hide this puzzle">
            </div>
            <div class="form-group">
              <label>Prompt:</label>
              <textarea name="prompt" rows="2" placeholder="The puzzle question">${escapeHtml(currentPrompt)}</textarea>
            </div>
            <div class="form-group">
              <label>Answer:</label>
              <input type="text" name="answer" value="${escapeHtml(currentAnswer)}" placeholder="Correct answer">
            </div>
            <div class="puzzle-actions">
              <button type="submit" class="btn btn-small btn-save">Save</button>
              <a href="/p/${p.id}" target="_blank" class="btn btn-small">View</a>
              ${hasOverride ? `<a href="/admin/puzzle/${p.id}/reset?key=${ADMIN_KEY}" class="btn btn-small btn-reset">Reset</a>` : ''}
            </div>
          </form>
          <div class="puzzle-default"><small>Default: ${escapeHtml(p.location_hint)}</small></div>
        </div>`;
    }).join('');
    
    return `
      <div class="admin-branch" style="--branch-color: ${info.color}">
        <div class="admin-branch-header">
          <h3>${info.name}</h3>
          <span class="branch-status-badge ${status.done ? 'complete' : ''}">
            ${status.done ? 'COMPLETE' : `${status.steps.filter(s=>s).length}/3`}
          </span>
          <span class="branch-digits">Digits: ${info.digits.join(', ')}</span>
        </div>
        <div class="admin-puzzles-grid">
          ${puzzleCards}
        </div>
      </div>`;
  }).join('');
  
  const content = `
  <div class="admin-dashboard">
    <header class="admin-header">
      <h1>Midnight Vault - Admin Dashboard</h1>
      <nav class="admin-nav">
        <a href="/admin/qr?key=${ADMIN_KEY}" class="btn btn-small btn-gold">QR Codes</a>
        <a href="/" target="_blank" class="btn btn-small">Home</a>
        <a href="/tv" target="_blank" class="btn btn-small">TV</a>
        <a href="/hub" target="_blank" class="btn btn-small">Hub</a>
        <a href="/meta" target="_blank" class="btn btn-small">Vault</a>
      </nav>
    </header>
    
    <!-- GAME STATE OVERVIEW -->
    <section class="admin-section admin-overview">
      <h2>Game State Overview</h2>
      <div class="overview-grid">
        <div class="overview-card">
          <div class="overview-label">Puzzles Solved</div>
          <div class="overview-value">${globalSolvedIds.length} / 12</div>
          <div class="progress-bar"><div class="progress-fill" style="width: ${Math.round(globalSolvedIds.length/12*100)}%"></div></div>
        </div>
        <div class="overview-card">
          <div class="overview-label">Branches Complete</div>
          <div class="overview-value">${completedBranches.length} / 4</div>
          <div class="overview-detail">${completedBranches.join(', ') || 'None'}</div>
        </div>
        <div class="overview-card ${completedBranches.length >= 2 ? 'unlocked' : 'locked'}">
          <div class="overview-label">Hub</div>
          <div class="overview-value">${completedBranches.length >= 2 ? '&#128275; UNLOCKED' : '&#128274; LOCKED'}</div>
          <div class="overview-detail">Requires 2 branches</div>
        </div>
        <div class="overview-card ${completedBranches.length >= 4 ? 'unlocked' : 'locked'}">
          <div class="overview-label">Vault</div>
          <div class="overview-value">${completedBranches.length >= 4 ? '&#128275; UNLOCKED' : '&#128274; LOCKED'}</div>
          <div class="overview-detail">Requires 4 branches</div>
        </div>
      </div>
    </section>
    
    <!-- VAULT MATH -->
    <section class="admin-section admin-vault-math">
      <h2>Vault Code Computation</h2>
      <div class="vault-math-display">
        <div class="math-row">
          <span class="math-label">Branch Digits:</span>
          <span class="math-value">
            <span class="digit-group" style="--branch-color: #e74c3c">F: 4,1</span>
            <span class="digit-group" style="--branch-color: #9b59b6">M: 8,2</span>
            <span class="digit-group" style="--branch-color: #3498db">D: 0,9</span>
            <span class="digit-group" style="--branch-color: #27ae60">B: 5,3</span>
          </span>
        </div>
        <div class="math-row">
          <span class="math-label">Current Digits (F+M+D+B order):</span>
          <span class="math-value mono">${digits || '(none yet)'}</span>
        </div>
        <div class="math-row">
          <span class="math-label">Permutation Key:</span>
          <span class="math-value mono">${db.getPermutationKey()}</span>
        </div>
        <div class="math-row">
          <span class="math-label">Permuted Result:</span>
          <span class="math-value mono">${permuted || '(need all 4 branches)'}</span>
        </div>
        <div class="math-row result">
          <span class="math-label">VAULT CODE (first 6):</span>
          <span class="math-value mono big">${vaultCode || '??????'}</span>
        </div>
        <div class="math-row">
          <span class="math-label">ENV Override:</span>
          <span class="math-value mono">${VAULT_CODE}</span>
        </div>
        <div class="math-row">
          <span class="math-label">Prize Clue:</span>
          <span class="math-value">${escapeHtml(PRIZE_CLUE)}</span>
        </div>
      </div>
    </section>
    
    <!-- ALL PUZZLES BY BRANCH -->
    <section class="admin-section admin-all-puzzles">
      <h2>All Puzzles by Branch</h2>
      <div class="admin-branches-container">
        ${puzzlesByBranch}
      </div>
    </section>
    
    <!-- CONTRIBUTORS & SOLVES -->
    <section class="admin-section admin-activity">
      <h2>Activity</h2>
      <div class="activity-grid">
        <div class="activity-panel">
          <h3>Top Contributors (${contributors.length})</h3>
          ${contributors.length > 0 ? `
            <table class="admin-table">
              <thead><tr><th>#</th><th>Nickname</th><th>Solves</th></tr></thead>
              <tbody>
                ${contributors.map((c, i) => `<tr><td>${i+1}</td><td>${escapeHtml(c.nickname)}</td><td>${c.solves}</td></tr>`).join('')}
              </tbody>
            </table>
          ` : '<p class="empty">No contributors yet</p>'}
        </div>
        <div class="activity-panel">
          <h3>Recent Solves (${allSolves.length} total)</h3>
          ${allSolves.length > 0 ? `
            <table class="admin-table">
              <thead><tr><th>Time</th><th>Player</th><th>Puzzle</th></tr></thead>
              <tbody>
                ${allSolves.slice(0, 20).map(s => {
                  const p = puzzles.getPuzzle(s.puzzle_id);
                  return `<tr><td>${s.solved_at}</td><td>${escapeHtml(s.nickname)}</td><td>${p ? p.branch + p.step : '#' + s.puzzle_id}</td></tr>`;
                }).join('')}
              </tbody>
            </table>
          ` : '<p class="empty">No solves yet</p>'}
        </div>
      </div>
    </section>
    
    <!-- GLOBAL KEYS -->
    <section class="admin-section admin-keys">
      <h2>Global Keys</h2>
      <div class="keys-grid">
        ${['F_DONE', 'M_DONE', 'D_DONE', 'B_DONE'].map(key => {
          const hasKey = globalKeys.find(k => k.key === key);
          return `
            <div class="key-card ${hasKey ? 'set' : 'unset'}">
              <span class="key-name">${key}</span>
              <span class="key-status">${hasKey ? '&#10004; ' + hasKey.unlocked_at : '&#9711; Not set'}</span>
            </div>`;
        }).join('')}
      </div>
    </section>
    
    <!-- ADMIN ACTIONS -->
    <section class="admin-section admin-actions">
      <h2>Admin Actions</h2>
      <div class="actions-grid">
        <form action="/admin/start-countdown?key=${ADMIN_KEY}" method="POST">
          <button type="submit" class="btn btn-success btn-large">🎆 START NYE COUNTDOWN 🎆</button>
        </form>
        <form action="/admin/reset-countdown?key=${ADMIN_KEY}" method="POST">
          <button type="submit" class="btn btn-secondary">Reset Countdown</button>
        </form>
        <form action="/admin/reset?key=${ADMIN_KEY}" method="POST" onsubmit="return confirm('This will DELETE ALL game data. Are you sure?')">
          <button type="submit" class="btn btn-danger">Reset All Data</button>
        </form>
        <form action="/admin/solve-all?key=${ADMIN_KEY}" method="POST" onsubmit="return confirm('This will solve ALL puzzles for testing. Continue?')">
          <button type="submit" class="btn btn-warning">Solve All (Testing)</button>
        </form>
      </div>
    </section>
  </div>
  
  <style>
    .admin-dashboard {
      max-width: 1400px;
      margin: 0 auto;
      padding: 1rem;
    }
    .admin-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid var(--accent-gold);
    }
    .admin-header h1 {
      color: var(--accent-gold);
    }
    .admin-nav {
      display: flex;
      gap: 0.5rem;
    }
    .btn-small {
      padding: 0.4rem 0.8rem;
      font-size: 0.85rem;
    }
    .admin-section {
      background: var(--bg-card);
      border-radius: var(--border-radius);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .admin-section h2 {
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    /* Overview Grid */
    .overview-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }
    .overview-card {
      background: rgba(255,255,255,0.05);
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
    }
    .overview-card.unlocked {
      background: rgba(46,204,113,0.2);
      border: 1px solid var(--accent-green);
    }
    .overview-card.locked {
      background: rgba(255,255,255,0.03);
    }
    .overview-label {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin-bottom: 0.25rem;
    }
    .overview-value {
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--accent-gold);
    }
    .overview-detail {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-top: 0.25rem;
    }
    
    /* Vault Math */
    .vault-math-display {
      background: rgba(0,0,0,0.3);
      padding: 1rem;
      border-radius: 8px;
    }
    .math-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .math-row.result {
      background: rgba(255,215,0,0.1);
      margin: 0.5rem -1rem;
      padding: 0.75rem 1rem;
      border: none;
    }
    .math-label {
      color: var(--text-secondary);
    }
    .math-value {
      font-weight: 600;
    }
    .math-value.mono {
      font-family: monospace;
      letter-spacing: 0.1em;
    }
    .math-value.big {
      font-size: 1.5rem;
      color: var(--accent-gold);
    }
    .digit-group {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      margin: 0 0.25rem;
      border-radius: 4px;
      background: rgba(255,255,255,0.1);
      border-left: 3px solid var(--branch-color);
    }
    
    /* Branches */
    .admin-branches-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .admin-branch {
      border-left: 4px solid var(--branch-color);
      padding-left: 1rem;
    }
    .admin-branch-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .admin-branch-header h3 {
      color: var(--branch-color);
      margin: 0;
    }
    .branch-status-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      background: rgba(255,255,255,0.1);
    }
    .branch-status-badge.complete {
      background: var(--accent-green);
      color: white;
    }
    .branch-digits {
      color: var(--text-secondary);
      font-size: 0.85rem;
    }
    .admin-puzzles-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }
    .admin-puzzle-card {
      background: rgba(255,255,255,0.05);
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .admin-puzzle-card.solved {
      border-color: var(--accent-green);
      background: rgba(46,204,113,0.1);
    }
    .puzzle-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .puzzle-id {
      font-weight: bold;
      color: var(--accent-gold);
    }
    .puzzle-step {
      color: var(--text-secondary);
      font-size: 0.85rem;
    }
    .puzzle-status {
      font-size: 0.75rem;
    }
    .admin-puzzle-card.solved .puzzle-status {
      color: var(--accent-green);
    }
    .puzzle-location, .puzzle-prompt, .puzzle-answer {
      font-size: 0.85rem;
      margin-bottom: 0.5rem;
    }
    .puzzle-answer code {
      background: rgba(255,215,0,0.2);
      padding: 0.1rem 0.3rem;
      border-radius: 3px;
      color: var(--accent-gold);
    }
    .puzzle-actions {
      margin-top: 0.75rem;
      padding-top: 0.5rem;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    
    /* Activity */
    .activity-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    .activity-panel {
      background: rgba(255,255,255,0.03);
      padding: 1rem;
      border-radius: 8px;
    }
    .activity-panel h3 {
      margin-bottom: 0.75rem;
      font-size: 1rem;
    }
    .empty {
      color: var(--text-secondary);
      font-style: italic;
    }
    
    /* Keys */
    .keys-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }
    .key-card {
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
    }
    .key-card.set {
      background: rgba(46,204,113,0.2);
      border: 1px solid var(--accent-green);
    }
    .key-card.unset {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.1);
    }
    .key-name {
      display: block;
      font-weight: bold;
      margin-bottom: 0.25rem;
    }
    .key-status {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }
    .key-card.set .key-status {
      color: var(--accent-green);
    }
    
    /* Actions */
    .actions-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .btn-success {
      background: #27ae60;
      color: white;
    }
    .btn-secondary {
      background: #7f8c8d;
      color: white;
    }
    .btn-large {
      font-size: 1.5rem;
      padding: 1rem 2rem;
      animation: glow-pulse 1.5s ease-in-out infinite;
    }
    @keyframes glow-pulse {
      0%, 100% { box-shadow: 0 0 10px rgba(46, 204, 113, 0.5); }
      50% { box-shadow: 0 0 30px rgba(46, 204, 113, 0.8), 0 0 60px rgba(255, 215, 0, 0.5); }
    }
    .btn-warning {
      background: #f39c12;
      color: white;
    }
    
    @media (max-width: 1200px) {
      .overview-grid { grid-template-columns: repeat(2, 1fr); }
      .admin-puzzles-grid { grid-template-columns: repeat(2, 1fr); }
      .keys-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 768px) {
      .overview-grid { grid-template-columns: 1fr; }
      .admin-puzzles-grid { grid-template-columns: 1fr; }
      .activity-grid { grid-template-columns: 1fr; }
      .keys-grid { grid-template-columns: 1fr; }
    }
  </style>`;
  
  res.send(layout('Admin Dashboard', content));
});

// GET /admin/qr - QR Code Generator for all puzzles
app.get('/admin/qr', (req, res) => {
  if (req.query.key !== ADMIN_KEY) {
    return res.status(403).send(layout('Access Denied', '<div class="container"><h1>Access Denied</h1></div>'));
  }

  // Get base URL from request or use custom domain
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const baseUrl = req.query.base || `${protocol}://${host}`;

  const allPuzzles = puzzles.getAllPuzzlesWithOverrides(db);

  const puzzleCards = allPuzzles.map(p => {
    const branchInfo = puzzles.BRANCHES[p.branch];
    const puzzleUrl = `${baseUrl}/p/${p.id}`;

    return `
      <div class="qr-card" style="--branch-color: ${branchInfo.color}" data-id="${p.id}" data-branch="${branchInfo.name}" data-step="${p.step}" data-location="${p.location_hint}">
        <div class="qr-header no-print">
          <span class="qr-branch" style="background: ${branchInfo.color}">${branchInfo.name}</span>
          <span class="qr-step">Step ${p.step}</span>
          <span class="qr-id">#${p.id}</span>
        </div>
        <div class="qr-code" id="qr-${p.id}"></div>
        <div class="qr-location no-print">${p.location_hint}</div>
        <div class="qr-url">${puzzleUrl}</div>
        <button class="btn btn-small download-btn no-print" onclick="downloadQR('${p.id}', '${branchInfo.name}', ${p.step})">Download PNG</button>
      </div>
    `;
  }).join('');

  const content = `
    <div class="qr-page">
      <div class="qr-controls no-print">
        <a href="/admin?key=${ADMIN_KEY}" class="btn btn-secondary">&larr; Back to Admin</a>
        <button onclick="downloadAllQR()" class="btn btn-primary">Download All PNGs</button>
        <button onclick="window.print()" class="btn btn-secondary">Print Sheet</button>
        <div class="base-url-form">
          <label>Base URL:</label>
          <input type="text" id="base-url-input" value="${baseUrl}" style="width: 300px">
          <button onclick="updateBaseUrl()" class="btn btn-secondary">Update URLs</button>
        </div>
      </div>

      <h1 class="qr-title">Midnight Vault - Puzzle QR Codes</h1>
      <p class="qr-instructions">Print and place each QR code at the specified location.</p>

      <div class="qr-grid">
        ${puzzleCards}
      </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
    <script>
      const baseUrl = '${baseUrl}';

      // Generate QR codes
      document.querySelectorAll('.qr-code').forEach(el => {
        const id = el.id.replace('qr-', '');
        const url = baseUrl + '/p/' + id;
        new QRCode(el, {
          text: url,
          width: 200,
          height: 200,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });
      });

      function updateBaseUrl() {
        const newBase = document.getElementById('base-url-input').value;
        window.location.href = '/admin/qr?key=${ADMIN_KEY}&base=' + encodeURIComponent(newBase);
      }

      function downloadQR(id, branch, step) {
        const el = document.getElementById('qr-' + id);
        const canvas = el.querySelector('canvas');
        if (!canvas) return;

        // Create a new canvas with just QR and URL
        const size = 400;
        const padding = 20;
        const urlHeight = 30;
        const newCanvas = document.createElement('canvas');
        newCanvas.width = size;
        newCanvas.height = size + urlHeight + padding;
        const ctx = newCanvas.getContext('2d');

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);

        // Draw QR code scaled up
        ctx.drawImage(canvas, 0, 0, size, size);

        // Draw URL below
        ctx.fillStyle = '#333333';
        ctx.font = '14px Arial, sans-serif';
        ctx.textAlign = 'center';
        const url = baseUrl + '/p/' + id;
        ctx.fillText(url, size / 2, size + urlHeight);

        // Download
        const link = document.createElement('a');
        link.download = 'qr-' + branch.toLowerCase() + '-step' + step + '.png';
        link.href = newCanvas.toDataURL('image/png');
        link.click();
      }

      async function downloadAllQR() {
        const cards = document.querySelectorAll('.qr-card');
        for (const card of cards) {
          const id = card.dataset.id;
          const branch = card.dataset.branch;
          const step = card.dataset.step;
          downloadQR(id, branch, step);
          await new Promise(r => setTimeout(r, 300)); // Small delay between downloads
        }
      }
    </script>

    <style>
      .qr-page { max-width: 1200px; margin: 0 auto; padding: 1rem; }
      .qr-controls { display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; }
      .base-url-form { display: flex; gap: 0.5rem; align-items: center; }
      .qr-title { text-align: center; color: var(--accent-gold); margin-bottom: 0.5rem; }
      .qr-instructions { text-align: center; color: var(--text-secondary); margin-bottom: 2rem; }
      .qr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
      .qr-card {
        background: var(--bg-card);
        border: 2px solid var(--branch-color);
        border-radius: 12px;
        padding: 1rem;
        text-align: center;
        page-break-inside: avoid;
      }
      .qr-header { display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 0.75rem; }
      .qr-branch { padding: 0.25rem 0.75rem; border-radius: 6px; color: white; font-weight: 600; font-size: 0.85rem; }
      .qr-step { background: rgba(255,255,255,0.1); padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.85rem; }
      .qr-id { color: var(--text-secondary); font-size: 0.85rem; padding: 0.25rem 0.5rem; }
      .qr-code { margin: 0.5rem 0; display: flex; justify-content: center; }
      .qr-code canvas, .qr-code img { border-radius: 8px; }
      .qr-location { font-size: 1.1rem; font-weight: 600; color: var(--accent-gold); margin: 0.5rem 0; }
      .qr-url { font-size: 0.7rem; color: var(--text-secondary); word-break: break-all; }
      .btn-small { padding: 0.4rem 0.8rem; font-size: 0.8rem; margin-top: 0.5rem; }
      .download-btn { background: var(--accent-gold); color: #000; border: none; cursor: pointer; border-radius: 6px; }
      .download-btn:hover { opacity: 0.9; }

      /* STICKER PRINT MODE - Clean QR + URL only */
      @media print {
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .no-print { display: none !important; }
        body { background: white !important; color: black !important; margin: 0; padding: 0; }
        .qr-page { padding: 0; max-width: none; }
        .qr-title, .qr-instructions { display: none; }

        .qr-grid {
          display: grid;
          grid-template-columns: repeat(4, 2in);
          gap: 0.15in;
          justify-content: center;
        }

        .qr-card {
          width: 2in;
          height: 2.3in;
          padding: 0.1in;
          margin: 0;
          border: 1px solid #ccc !important;
          border-radius: 4px;
          background: white !important;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          page-break-inside: avoid;
          box-sizing: border-box;
        }

        .qr-code {
          margin: 0;
        }

        .qr-code canvas, .qr-code img {
          width: 1.6in !important;
          height: 1.6in !important;
        }

        .qr-url {
          font-size: 6pt;
          color: #333 !important;
          margin-top: 0.05in;
          text-align: center;
        }
      }
    </style>
  `;

  res.send(layout('QR Code Generator', content));
});

// POST /admin/reset
app.post('/admin/reset', (req, res) => {
  if (req.query.key !== ADMIN_KEY) {
    return res.status(403).send('Access Denied');
  }
  db.resetAllData();
  res.redirect('/admin?key=' + ADMIN_KEY);
});

// POST /admin/puzzle/:id - Update puzzle override
app.post('/admin/puzzle/:id', (req, res) => {
  if (req.query.key !== ADMIN_KEY) {
    return res.status(403).send('Access Denied');
  }
  
  const puzzleId = parseInt(req.params.id, 10);
  const { location_hint, prompt, answer } = req.body;
  
  db.setPuzzleOverride(puzzleId, {
    location_hint: location_hint || null,
    prompt: prompt || null,
    answer: answer || null
  });
  
  res.redirect('/admin?key=' + ADMIN_KEY + '#puzzle-' + puzzleId);
});

// GET /admin/puzzle/:id/reset - Reset puzzle to defaults
app.get('/admin/puzzle/:id/reset', (req, res) => {
  if (req.query.key !== ADMIN_KEY) {
    return res.status(403).send('Access Denied');
  }
  
  const puzzleId = parseInt(req.params.id, 10);
  db.clearPuzzleOverride(puzzleId);
  
  res.redirect('/admin?key=' + ADMIN_KEY);
});

// POST /admin/solve-all - Solve all puzzles for testing
app.post('/admin/solve-all', (req, res) => {
  if (req.query.key !== ADMIN_KEY) {
    return res.status(403).send('Access Denied');
  }
  
  // Create a test participant if needed
  let testParticipant = db.getParticipant('test-admin');
  if (!testParticipant) {
    const stmt = require('better-sqlite3')(require('path').join(__dirname, 'midnight_vault.db'));
    stmt.exec("INSERT OR IGNORE INTO participants (id, nickname) VALUES ('test-admin', 'Admin-Tester')");
    stmt.close();
  }
  
  // Solve all 12 puzzles
  for (let id = 1; id <= 12; id++) {
    db.recordSolve('test-admin', id);

    // Check if this completes a branch
    const puzzle = puzzles.getPuzzle(id);
    if (puzzle && puzzle.step === 3) {
      const doneKey = `${puzzle.branch}_DONE`;
      if (!db.hasGlobalKey(doneKey)) {
        db.setGlobalKey(doneKey);
      }
    }
  }

  res.redirect('/admin?key=' + ADMIN_KEY);
});

// POST /admin/start-countdown - Start the 10-second NYE countdown
app.post('/admin/start-countdown', (req, res) => {
  if (req.query.key !== ADMIN_KEY) {
    return res.status(403).send('Access Denied');
  }
  nyeCountdownStart = Date.now();
  res.redirect('/admin?key=' + ADMIN_KEY + '&countdown=started');
});

// POST /admin/reset-countdown - Reset countdown
app.post('/admin/reset-countdown', (req, res) => {
  if (req.query.key !== ADMIN_KEY) {
    return res.status(403).send('Access Denied');
  }
  nyeCountdownStart = null;
  res.redirect('/admin?key=' + ADMIN_KEY);
});

// GET /api/nye-countdown - Get NYE countdown state for client-side rendering
app.get('/api/nye-countdown', (req, res) => {
  const now = Date.now();
  const targetUTC = Date.UTC(2026, 0, 1, 6, 0, 0); // Midnight Central = 6am UTC
  const msRemaining = targetUTC - now;
  const secsRemaining = Math.floor(msRemaining / 1000);

  let display = null;
  let isNumber = false;
  let showCelebration = false;

  // Check if admin triggered a demo countdown
  if (nyeCountdownStart) {
    const elapsed = Math.floor((now - nyeCountdownStart) / 1000);

    // Demo sequence (faster for testing)
    if (elapsed < 4) {
      display = "30 MINUTES";
    } else if (elapsed < 8) {
      display = "15 MINUTES";
    } else if (elapsed < 12) {
      display = "10 MINUTES";
    } else if (elapsed < 16) {
      display = "5 MINUTES";
    } else if (elapsed < 20) {
      display = "1 MINUTE";
    } else if (elapsed < 23) {
      display = "45";
      isNumber = true;
    } else if (elapsed < 26) {
      display = "30";
      isNumber = true;
    } else if (elapsed < 36) {
      display = String(36 - elapsed);
      isNumber = true;
    } else {
      // Demo ended - show celebration forever
      showCelebration = true;
    }
  }
  // Real midnight countdown (when not in demo mode)
  else if (secsRemaining <= 0) {
    // It's midnight or past - celebrate forever!
    showCelebration = true;
  }
  else if (secsRemaining <= 10) {
    // Final 10 seconds
    display = String(secsRemaining);
    isNumber = true;
  }
  else if (secsRemaining <= 30) {
    display = "30";
    isNumber = true;
  }
  else if (secsRemaining <= 45) {
    display = "45";
    isNumber = true;
  }
  else if (secsRemaining <= 60) {
    display = "1 MINUTE";
  }
  else if (secsRemaining <= 5 * 60) {
    display = "5 MINUTES";
  }
  else if (secsRemaining <= 10 * 60) {
    display = "10 MINUTES";
  }
  else if (secsRemaining <= 15 * 60) {
    display = "15 MINUTES";
  }
  else if (secsRemaining <= 30 * 60) {
    display = "30 MINUTES";
  }
  // else: more than 30 min, show nothing special

  res.json({
    display,
    isNumber,
    showCelebration,
    serverTime: now,
    secsRemaining
  });
});

// GET /api/status - JSON status for TV polling
app.get('/api/status', (req, res) => {
  const globalSolvedIds = db.getGlobalSolvedPuzzleIds();
  const globalSolved = globalSolvedIds.length;
  const globalPct = Math.round(globalSolved / 12 * 100);
  const branchStatus = db.getBranchStatus(puzzles);
  const completedBranches = db.getCompletedBranches();
  const doneCount = completedBranches.length;
  const { digits } = puzzles.computeVaultCode(completedBranches);
  const contributors = db.getContributors(10);
  const recentSolves = db.getRecentSolves(12);
  
  // Enrich recent solves
  const recent = recentSolves.map(s => {
    const puzzle = puzzles.getPuzzle(s.puzzle_id);
    return {
      solved_at: s.solved_at,
      nickname: s.nickname,
      puzzle_id: s.puzzle_id,
      branch: puzzle ? puzzle.branch : '?',
      step: puzzle ? puzzle.step : '?'
    };
  });
  
  res.json({
    now: new Date().toISOString(),
    totalPuzzles: 12,
    globalSolved,
    globalPct,
    branchStatus,
    completedBranches,
    hubUnlocked: doneCount >= 2,
    metaUnlocked: doneCount >= 4,
    digits,
    contributors,
    recent
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Midnight Vault running at http://localhost:${PORT}`);
  console.log(`TV: http://localhost:${PORT}/tv`);
  console.log(`Admin: http://localhost:${PORT}/admin?key=${ADMIN_KEY}`);
});
