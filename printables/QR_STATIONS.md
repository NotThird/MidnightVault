# QR Station Setup Guide (Parallel Branches)

Each branch has 3 puzzles that must be solved in order. All 4 branches can be worked simultaneously.

## URL Format

Replace `YOUR_HOST_IP` with your server's IP (e.g., `192.168.1.100:3000`):

```
http://YOUR_HOST_IP/p/1  through  /p/12
```

## Branch: FOOD (Red) - Puzzles 1, 2, 3

| Step | ID | Location | Prompt Summary | Answer |
|------|-----|----------|----------------|--------|
| 1 | 1 | Fridge | Caesar +3 decode | PLAYLIST |
| 2 | 2 | Snack Table | Acrostic card | FOOD |
| 3 | 3 | Drink Cooler | "Twelve at midnight" riddle | GRAPES |

**Branch completion awards digits: 4, 1**

### Setup Notes
- Step 1: Print QR for `/p/1`, place on fridge
- Step 2: Print QR for `/p/2` AND create an acrostic card where first letters spell FOOD
- Step 3: Print QR for `/p/3`, place on drink cooler

## Branch: MUSIC (Purple) - Puzzles 4, 5, 6

| Step | ID | Location | Prompt Summary | Answer |
|------|-----|----------|----------------|--------|
| 1 | 4 | Speaker | "Part of song that repeats" | CHORUS |
| 2 | 5 | TV Remote | Anagram OPMET | TEMPO |
| 3 | 6 | Playlist QR | First letters of 6 songs | COUNTDOWN |

**Branch completion awards digits: 8, 2**

### Setup Notes
- Step 1: Print QR for `/p/4`, place near speaker
- Step 2: Print QR for `/p/5`, attach to TV remote
- Step 3: Print QR for `/p/6` AND create a playlist poster where first 6 songs' first letters spell COUNTDOWN (e.g., Celebration, Orange Blossom, Umbrella, Night Fever, Tonight, Dancing Queen, On The Floor, Wanna Be, Nothing)

## Branch: DECOR (Blue) - Puzzles 7, 8, 9

| Step | ID | Location | Prompt Summary | Answer |
|------|-----|----------|----------------|--------|
| 1 | 7 | Garland Tag | Anagram RAELGND | GARLAND |
| 2 | 8 | Balloons | Party poppers result | CONFETTI |
| 3 | 9 | Mantle/Shelf | "Floats and pops" | BALLOON |

**Branch completion awards digits: 0, 9**

### Setup Notes
- Step 1: Print QR for `/p/7`, attach to garland
- Step 2: Print QR for `/p/8`, place near balloons
- Step 3: Print QR for `/p/9`, place on mantle or decor shelf

## Branch: BOOKS (Green) - Puzzles 10, 11, 12

| Step | ID | Location | Prompt Summary | Answer |
|------|-----|----------|----------------|--------|
| 1 | 10 | Bookshelf "INDEX" | Back-of-book list | INDEX |
| 2 | 11 | Bookmark in Book | Sections of a book | CHAPTER |
| 3 | 12 | Spine-facing Shelf | Part you see on shelf | SPINE |

**Branch completion awards digits: 5, 3**

### Setup Notes
- Step 1: Print QR for `/p/10`, label area "INDEX"
- Step 2: Print QR for `/p/11`, use as a bookmark in a visible book
- Step 3: Print QR for `/p/12`, place facing book spines

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

## Vault Math Reference

When all 4 branches complete:
- Digits (F+M+D+B order): `41820953`
- Permutation key: `26153478`
- Permuted: `19408253`
- Vault code (first 6): `194082`

Set your physical lockbox to **194082**.
