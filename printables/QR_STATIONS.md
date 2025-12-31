# QR Station Setup Guide (Physical Puzzle Branches)

Each branch starts with a **physical puzzle** that reveals QR #1. After that, puzzles 2 and 3 are found by following clues.

## Branch Overview

| Branch | Physical Task | QR Source | Color | Digits |
|--------|---------------|-----------|-------|--------|
| LEGO | Build a Lego set | Host gives QR #1 | Red | 4, 1 |
| HIDDEN | Find ALL 3 QRs! | All hidden | Purple | 8, 2 |
| JIGSAW | Complete jigsaw | Host gives QR #1 | Blue | 0, 9 |
| PUZZLE BOX | Open puzzle box | QR #1 inside | Green | 5, 3 |

## URL Format

Replace `YOUR_HOST_IP` with your server's IP (e.g., `192.168.1.100:3000`):

```
http://YOUR_HOST_IP/p/1  through  /p/12
```

---

## Branch: LEGO (Red) - Puzzles 1, 2, 3

**Physical Start:** Build any Lego set (150-250 pieces), show host to get QR #1

| Step | ID | Location | Prompt | Answer |
|------|-----|----------|--------|--------|
| 1 | 1 | From host after Lego | Caesar +3 decode "SODBOLVW" | PLAYLIST |
| 2 | 2 | Near the snacks | Unscramble: TPARTY | PARTY |
| 3 | 3 | By the window | Riddle about midnight star | CLOCK |

**Branch completion awards digits: 4, 1**

### Setup Notes
- Have several small Lego sets available (150-250 pieces)
- Player completes ANY one set → shows host → host hands them QR for `/p/1`
- Keep QR codes handy to distribute

---

## Branch: HIDDEN (Purple) - Puzzles 4, 5, 6

**SCAVENGER HUNT BRANCH** - All 3 QR codes are physically hidden!

| Step | ID | Hide Location | Difficulty | Prompt | Answer |
|------|-----|---------------|------------|--------|--------|
| 1 | 4 | Near front door | Obvious | What color is the sky? | BLUE |
| 2 | 5 | Where you sit to relax | Well hidden | How many sides on a triangle? | 3 |
| 3 | 6 | Where drinks stay cold | Super hidden | What is frozen water called? | ICE |

**Branch completion awards digits: 8, 2**

### Setup Notes - CUSTOMIZE THESE LOCATIONS!
The location hints above are placeholders. Decide where YOU will hide each QR:

- **QR #4 (`/p/4`)** - Make this one kinda obvious to get them started
  - Ideas: taped to wall near entrance, on a visible shelf, under a coaster in plain sight

- **QR #5 (`/p/5`)** - Hide this one well
  - Ideas: under couch cushion, behind a picture frame, inside a lampshade

- **QR #6 (`/p/6`)** - Make them really search!
  - Ideas: taped under a table, inside a book, behind the TV, in a drawer

Update the `location_hint` in puzzles.js to match your actual hiding spots!

---

## Branch: JIGSAW (Blue) - Puzzles 7, 8, 9

**Physical Start:** Complete a jigsaw puzzle, show host to get QR #1

| Step | ID | Location | Prompt | Answer |
|------|-----|----------|--------|--------|
| 1 | 7 | From host after jigsaw | Unscramble: RAELGND | GARLAND |
| 2 | 8 | Coffee table | Word meaning jump AND 366-day year | LEAP |
| 3 | 9 | Near the TV | Unscramble: HEWN YARE | NEW YEAR |

**Branch completion awards digits: 0, 9**

### Setup Notes
- Have a jigsaw puzzle available (small enough to complete quickly)
- Player completes puzzle → shows host → host hands them QR for `/p/7`
- Keep QR codes handy to distribute

---

## Branch: PUZZLE BOX (Green) - Puzzles 10, 11, 12

**Physical Start:** Open the puzzle box to get QR #1

| Step | ID | Location | Prompt | Answer |
|------|-----|----------|--------|--------|
| 1 | 10 | Inside puzzle box | Back-of-book list for topics | INDEX |
| 2 | 11 | Behind the couch | Bubbly beverage we toast with | CHAMPAGNE |
| 3 | 12 | Bookshelf | "Falls" on Jan 1st but never hurts | NEW YEARS DAY |

**Branch completion awards digits: 5, 3**

### Setup Notes
- Place QR for `/p/10` inside your puzzle box
- Players must solve the puzzle box mechanism to access
- Could include a small clue card with the QR

---

## QR Code Generation

### Online
1. Visit https://www.qr-code-generator.com/
2. Generate for each URL: `http://YOUR_IP:3000/p/1` through `/p/12`

### Command Line
```bash
for i in {1..12}; do
  qrencode -o "puzzle_$i.png" -s 10 "http://YOUR_HOST_IP:3000/p/$i"
done
```

---

## Vault Math Reference

When all 4 branches complete:
- Digits (L+H+J+P order): `41820953`
- Permutation key: `26153478`
- Permuted: `19408253`
- Vault code (first 6): `194082`

Set your physical lockbox to **194082**.

---

## Flow Summary

```
Players arrive
    ↓
See 4 physical puzzles available:
├── LEGO (build a set → show host → get QR)
├── HIDDEN (search and find the hidden QR)
├── JIGSAW (complete puzzle → show host → get QR)
└── PUZZLE BOX (open it yourself → QR inside)
    ↓
Scan QR #1 → Solve digital puzzle → Get hint for QR #2 location
    ↓
Scan QR #2 → Solve → Get hint for QR #3 location
    ↓
Scan QR #3 → Solve → Branch complete! (+2 digits)
    ↓
All 4 branches done → Go to Hub → Get permutation key → Open vault!
```

## Host Checklist

**QR codes to hand out:**
- [ ] LEGO branch QR #1 (`/p/1`) - give when player completes a Lego set
- [ ] JIGSAW branch QR #1 (`/p/7`) - give when player completes jigsaw

**QR codes to hide (HIDDEN branch - scavenger hunt!):**
- [ ] `/p/4` - Kinda obvious spot (starts the hunt)
- [ ] `/p/5` - Well hidden
- [ ] `/p/6` - Super well hidden

**QR codes to place:**
- [ ] PUZZLE BOX branch QR #1 (`/p/10`) - inside puzzle box
- [ ] LEGO QRs #2-3 (`/p/2`, `/p/3`) - per puzzle hints
- [ ] JIGSAW QRs #2-3 (`/p/8`, `/p/9`) - per puzzle hints
- [ ] PUZZLE BOX QRs #2-3 (`/p/11`, `/p/12`) - per puzzle hints
