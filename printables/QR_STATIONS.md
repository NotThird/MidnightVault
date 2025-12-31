# QR Station Setup Guide (Physical Puzzle Branches)

Each branch starts with a **physical puzzle** that reveals QR #1. After that, puzzles 2 and 3 are found by following clues.

## Branch Overview

| Branch | Physical Start | Color | Digits | QR Chain |
|--------|----------------|-------|--------|----------|
| LEGO | Build the Lego to find QR1 | Red | 4, 1 | L1 → L2 → L3 |
| HIDDEN | Find the hidden QR1 | Purple | 8, 2 | H1 → H2 → H3 |
| JIGSAW | Complete jigsaw to reveal QR1 | Blue | 0, 9 | J1 → J2 → J3 |
| PUZZLE BOX | Open puzzle box to get QR1 | Green | 5, 3 | P1 → P2 → P3 |

## URL Format

Replace `YOUR_HOST_IP` with your server's IP (e.g., `192.168.1.100:3000`):

```
http://YOUR_HOST_IP/p/1  through  /p/12
```

---

## Branch: LEGO (Red) - Puzzles 1, 2, 3

**Physical Start:** Build/complete a Lego set to find QR #1

| Step | ID | Location | Prompt | Answer |
|------|-----|----------|--------|--------|
| 1 | 1 | Inside completed Lego build | Caesar +3 decode "SODBOLVW" | PLAYLIST |
| 2 | 2 | TBD | TBD | TBD |
| 3 | 3 | TBD | TBD | TBD |

**Branch completion awards digits: 4, 1**

### Setup Notes
- Hide QR for `/p/1` inside or under the Lego build
- Players must complete the Lego to access the first QR
- Subsequent QRs are placed based on puzzle answers/hints

---

## Branch: HIDDEN (Purple) - Puzzles 4, 5, 6

**Physical Start:** Search and find the hidden QR #1

| Step | ID | Location | Prompt | Answer |
|------|-----|----------|--------|--------|
| 1 | 4 | Somewhere hidden... | What part of a song repeats the most? | CHORUS |
| 2 | 5 | TBD | TBD | TBD |
| 3 | 6 | TBD | TBD | TBD |

**Branch completion awards digits: 8, 2**

### Setup Notes
- Hide QR for `/p/4` in a non-obvious location
- Ideas: under a coaster, behind a picture frame, inside a book, taped under a table
- Make it findable but requires searching

---

## Branch: JIGSAW (Blue) - Puzzles 7, 8, 9

**Physical Start:** Complete a small jigsaw puzzle to reveal QR #1

| Step | ID | Location | Prompt | Answer |
|------|-----|----------|--------|--------|
| 1 | 7 | On completed jigsaw | Unscramble: RAELGND | GARLAND |
| 2 | 8 | TBD | TBD | TBD |
| 3 | 9 | TBD | TBD | TBD |

**Branch completion awards digits: 0, 9**

### Setup Notes
- Print QR for `/p/7` as part of the jigsaw image, or place under completed puzzle
- Use a small puzzle (20-50 pieces) so it's quick
- Could print a custom image with QR embedded

---

## Branch: PUZZLE BOX (Green) - Puzzles 10, 11, 12

**Physical Start:** Open the puzzle box to get QR #1

| Step | ID | Location | Prompt | Answer |
|------|-----|----------|--------|--------|
| 1 | 10 | Inside puzzle box | What do you call the back-of-book list used to find topics? | INDEX |
| 2 | 11 | TBD | TBD | TBD |
| 3 | 12 | TBD | TBD | TBD |

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
├── LEGO (build it)
├── HIDDEN (find it)
├── JIGSAW (complete it)
└── PUZZLE BOX (open it)
    ↓
Each physical puzzle reveals QR #1 for that branch
    ↓
Scan QR → Solve digital puzzle → Get hint for QR #2 location
    ↓
Scan QR #2 → Solve → Get hint for QR #3 location
    ↓
Scan QR #3 → Solve → Branch complete! (+2 digits)
    ↓
All 4 branches done → Go to Hub → Get permutation key → Open vault!
```
