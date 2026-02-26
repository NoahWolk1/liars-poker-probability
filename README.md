# Liar's Poker Probability Model

A model that maps the probability of different poker hands existing in the collective pool for **Liar's Poker** (card variant).

## How Liar's Poker Works

- **Setup**: Each player is dealt 2 private hole cards.
- **Bidding**: Players claim a poker hand (e.g., "Three of a kind, Jacks") they believe exists in the collective pool of all cards.
- **Challenge**: Call "bluff" on the previous bid. If the hand exists, the challenger loses; if it doesn't, the bidder loses.

## What This Model Does

Given:
1. **Your cards** (known)
2. **Total board size** (all players' cards combined)
3. **Hand being claimed** (e.g., full house, flush, straight)

It estimates: **P(that hand exists somewhere on the board)**.

---

## Deploy to Vercel

The project is a Next.js app ready for Vercel.

### Option A: Deploy with Vercel CLI

```bash
cd "Poker Model"
npm install
npx vercel
```

Follow the prompts. Your app will be live at `https://your-project.vercel.app`.

### Option B: Deploy via GitHub

1. Create a new GitHub repo and push this folder (as its own repo).
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo.
3. Vercel auto-detects Next.js. Click Deploy.
4. If your repo root is not this folder, set **Root Directory** to the folder containing this project.

---

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Files

| File | Purpose |
|------|---------|
| `app/page.tsx` | Frontend UI |
| `app/api/probability/route.ts` | API endpoint for probability calculation |
| `lib/bluff-poker.ts` | Hand evaluation + Monte Carlo engine (TypeScript) |
| `bluff_poker.py` | Original Python engine (for local scripts) |
| `probability_map.py` | Python lookup table builder |
| `interactive_lookup.py` | Python CLI for quick lookups |

## Hand Types Supported

| Hand | Keyword |
|------|---------|
| One Pair | `pair`, `one_pair` |
| Two Pair | `two_pair` |
| Three of a Kind | `trips`, `three_of_a_kind` |
| Straight | `straight` |
| Flush | `flush` |
| Full House | `full_house`, `boat` |
| Four of a Kind | `quads`, `four_of_a_kind` |
| Straight Flush | `straight_flush` |
| Royal Flush | `royal_flush` |

## Python Quick Start

```python
from bluff_poker import probability_hand_on_board, parse_hand, HandType

your_cards = parse_hand("As Kh Qd Jc 10s")
p = probability_hand_on_board(your_cards, board_size=20, hand_type=HandType.FULL_HOUSE)
print(f"P(Full House on board) = {p:.1%}")
```
