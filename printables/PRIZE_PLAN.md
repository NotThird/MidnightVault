# Midnight Vault - Prize Structure

## Overview

The game supports three prize mechanisms:

---

## A. Group Grand Prize

**Trigger:** Correct vault code entered at `/meta`

**Setup:**
1. Set `PRIZE_CLUE` environment variable to reveal location
2. Hide prize at that location (lockbox recommended)
3. Set lockbox combination to `194082` (the computed vault code)

**Example PRIZE_CLUE values:**
- "The treasure is in the freezer behind the ice cream!"
- "Check the coat closet - top shelf, gold box!"
- "The host has a lockbox. The code you just entered opens it!"

**Prize Ideas:**
- Champagne for midnight toast
- Scratch tickets for everyone
- Party games
- Gift card to split

---

## B. Raffle Entries

**How it works:**
- Each personal solve = 1 raffle entry
- Multiple people can solve same puzzle (each gets credit)
- View counts at `/admin?key=YOUR_KEY`

**Running the raffle:**
1. Check admin panel for contributor list
2. Each person's count = number of entries
3. Draw names proportionally
4. Award 2-3 small prizes

**Raffle Prize Ideas:**
- Gift cards ($10-25)
- Candy/treats
- Small games
- Movie tickets

---

## C. MVP Recognition

**How it works:**
- TV dashboard shows "Top Contributor" automatically
- Updates in real-time
- Not framed as competition - just friendly credit

**Optional MVP prize:**
- Silly crown/hat
- First pick from prize basket
- Special dessert

---

## Timeline

| Time | Action |
|------|--------|
| Start | Announce game, show rules poster |
| Ongoing | Guests solve puzzles in parallel |
| 2 branches | Announce Hub is unlocked! |
| 4 branches | Announce Vault is open! |
| Vault solved | Gather everyone, reveal prize |
| Before midnight | Run raffle |
| Midnight | Toast! |

---

## Vault Math Reference

```
FOOD digits:   4, 1
MUSIC digits:  8, 2
DECOR digits:  0, 9
BOOKS digits:  5, 3

Concatenated (F+M+D+B): 41820953
Permutation key:        26153478
Permuted result:        19408253
Vault code (first 6):   194082
```

Set your lockbox to: **194082**

---

## Checklist

- [ ] Set PRIZE_CLUE in environment
- [ ] Set physical lockbox to 194082
- [ ] Hide grand prize at clue location
- [ ] Prepare raffle prizes
- [ ] Optional: MVP token
- [ ] Print all QR codes and labels
- [ ] Create FOOD acrostic card (letters spell FOOD)
- [ ] Create MUSIC playlist poster (first letters spell COUNTDOWN)
- [ ] Test full flow before guests arrive!
