# Midnight Vault

A cooperative escape-room-style party game for New Year's Eve. Players work in parallel across 4 branches, each with 3 sequential puzzles. Complete branches to earn digits, then use the permutation key to compute the vault code.

## Quick Start

```bash
npm install
npm start
```

Server runs at `http://localhost:3000`

## Game Structure

```
    FOOD          MUSIC         DECOR         BOOKS
   (Red)        (Purple)       (Blue)        (Green)
     |             |             |             |
  Step 1        Step 1        Step 1        Step 1
     |             |             |             |
  Step 2        Step 2        Step 2        Step 2
     |             |             |             |
  Step 3        Step 3        Step 3        Step 3
     |             |             |             |
  [4,1]         [8,2]         [0,9]         [5,3]
```

- **4 parallel branches** can be worked simultaneously
- **3 sequential steps** within each branch
- **Global unlocks**: Once anyone solves Step 1, Step 2 unlocks for everyone
- **Hub** unlocks at 2 branches complete (reveals permutation key)
- **Vault** unlocks at 4 branches complete

## Vault Code Computation

```
Digits (F+M+D+B): 41820953
Permutation:      26153478
Permuted:         19408253
Vault code:       194082
```

## Configuration

Copy `.env.example` to `.env`:

```env
PORT=3000
VAULT_CODE=194082
PRIZE_CLUE=The treasure is in the freezer!
ADMIN_KEY=supersecret2024
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Home - nickname, branch status |
| `/me` | Personal progress |
| `/p/:id` | Puzzle page (1-12) |
| `/hub` | Hub page (unlocks at 2 branches) |
| `/meta` | Vault page (unlocks at 4 branches) |
| `/tv` | TV dashboard |
| `/admin?key=KEY` | Admin panel |

## Puzzles by Branch

### FOOD (Steps 1-3, IDs 1-3)
1. **Fridge**: Caesar +3 decode → PLAYLIST
2. **Snack Table**: Acrostic card → FOOD
3. **Drink Cooler**: "Twelve at midnight" riddle → GRAPES

### MUSIC (Steps 1-3, IDs 4-6)
1. **Speaker**: Part of song that repeats → CHORUS
2. **TV Remote**: Anagram OPMET → TEMPO
3. **Playlist QR**: First letters of 6 songs → COUNTDOWN

### DECOR (Steps 1-3, IDs 7-9)
1. **Garland Tag**: Anagram RAELGND → GARLAND
2. **Balloons**: Party poppers result → CONFETTI
3. **Mantle/Shelf**: Floats and pops → BALLOON

### BOOKS (Steps 1-3, IDs 10-12)
1. **Bookshelf "INDEX"**: Back-of-book list → INDEX
2. **Bookmark in Book**: Book sections → CHAPTER
3. **Spine-facing Shelf**: Part you see on shelf → SPINE

## Setup Checklist

1. **Network**: Find your host IP (`ipconfig` on Windows)
2. **QR Codes**: Generate for `/p/1` through `/p/12`
3. **Props**:
   - FOOD Step 2: Create acrostic card (lines starting F-O-O-D)
   - MUSIC Step 3: Create playlist poster (6 songs starting C-O-U-N-T-D...)
4. **Lockbox**: Set combination to `194082`
5. **Prize**: Hide at location mentioned in PRIZE_CLUE
6. **TV**: Open `http://YOUR_IP:3000/tv` on your TV

## Finding Your Host IP

**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" (e.g., `192.168.1.100`)

**Mac/Linux:**
```bash
hostname -I
# or
ipconfig getifaddr en0
```

## Printables

See `/printables` folder:
- `QR_STATIONS.md` - Full setup guide with locations
- `RULES_POSTER.md` - Print and display
- `LABELS.md` - Labels for each station
- `PRIZE_PLAN.md` - Prize structure and timeline

## Database

SQLite stored in `midnight_vault.db`. Tables:
- `participants` - Player identities
- `solves` - Puzzle completions
- `global_keys` - Branch completion flags (F_DONE, M_DONE, etc.)
- `global_values` - Permutation key storage

Reset via admin panel or delete the `.db` file.

## License

MIT
