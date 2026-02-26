/**
 * Bluff Poker Probability Engine (TypeScript port)
 * Hand evaluation and Monte Carlo probability calculation.
 */

export const SUITS = "♠♥♦♣" as const;
export const RANKS = "23456789TJQKA" as const;

export const SUIT_NAMES: Record<string, string> = {
  "♠": "Spades", "♥": "Hearts", "♦": "Diamonds", "♣": "Clubs",
  S: "Spades", H: "Hearts", D: "Diamonds", C: "Clubs",
};

export const RANK_NAMES: Record<string, string> = {
  "2": "Twos", "3": "Threes", "4": "Fours", "5": "Fives", "6": "Sixes",
  "7": "Sevens", "8": "Eights", "9": "Nines", T: "Tens",
  J: "Jacks", Q: "Queens", K: "Kings", A: "Aces",
};

export type Card = [rank: string, suit: string];

export enum HandType {
  HIGH_CARD = 0,
  ONE_PAIR = 1,
  TWO_PAIR = 2,
  THREE_OF_A_KIND = 3,
  STRAIGHT = 4,
  FLUSH = 5,
  FULL_HOUSE = 6,
  FOUR_OF_A_KIND = 7,
  STRAIGHT_FLUSH = 8,
  ROYAL_FLUSH = 9,
}

export const HAND_LABELS: Record<HandType, string> = {
  [HandType.HIGH_CARD]: "High Card",
  [HandType.ONE_PAIR]: "One Pair",
  [HandType.TWO_PAIR]: "Two Pair",
  [HandType.THREE_OF_A_KIND]: "Three of a Kind",
  [HandType.STRAIGHT]: "Straight",
  [HandType.FLUSH]: "Flush",
  [HandType.FULL_HOUSE]: "Full House",
  [HandType.FOUR_OF_A_KIND]: "Four of a Kind",
  [HandType.STRAIGHT_FLUSH]: "Straight Flush",
  [HandType.ROYAL_FLUSH]: "Royal Flush",
};

function rankValue(r: string): number {
  return RANKS.indexOf(r);
}

function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (const r of RANKS) {
    for (const s of SUITS) {
      deck.push([r, s]);
    }
  }
  return deck;
}

function cardKey(c: Card): string {
  return `${c[0]}${c[1]}`;
}

function countValues<T>(arr: T[]): Map<T, number> {
  const m = new Map<T, number>();
  for (const x of arr) {
    m.set(x, (m.get(x) ?? 0) + 1);
  }
  return m;
}

function* combinations<T>(arr: T[], k: number): Generator<T[]> {
  if (k > arr.length || k <= 0) return;
  if (k === arr.length) {
    yield [...arr];
    return;
  }
  if (k === 1) {
    for (const x of arr) yield [x];
    return;
  }
  for (let i = 0; i <= arr.length - k; i++) {
    for (const rest of combinations(arr.slice(i + 1), k - 1)) {
      yield [arr[i], ...rest];
    }
  }
}

function isFlush(cards: Card[], requiredSuit?: string): boolean {
  if (cards.length < 5) return false;
  if (requiredSuit) {
    const ofSuit = cards.filter((c) => c[1] === requiredSuit);
    return ofSuit.length >= 5;
  }
  const suits = cards.map((c) => c[1]);
  const counts = countValues(suits);
  return Math.max(...counts.values()) >= 5;
}

function isStraight(cards: Card[]): boolean {
  const vals = [...new Set(cards.map((c) => rankValue(c[0])))].sort((a, b) => b - a);
  if (vals.length < 5) return false;
  if (vals.includes(12) && vals.includes(0) && vals.includes(1) && vals.includes(2) && vals.includes(3)) {
    return true;
  }
  for (let i = 0; i <= vals.length - 5; i++) {
    const run = vals.slice(i, i + 5);
    if (run[0]! - run[4]! === 4 && new Set(run).size === 5) return true;
  }
  return false;
}

function isStraightFlush(cards: Card[], requiredSuit?: string): boolean {
  const bySuit = new Map<string, Card[]>();
  for (const c of cards) {
    const list = bySuit.get(c[1]) ?? [];
    list.push(c);
    bySuit.set(c[1], list);
  }
  const toCheck = requiredSuit
    ? [bySuit.get(requiredSuit)].filter(Boolean) as Card[][]
    : [...bySuit.values()];
  for (const suitCards of toCheck) {
    if (suitCards.length >= 5 && isStraight(suitCards)) return true;
  }
  return false;
}

function countRanks(cards: Card[]): Map<string, number> {
  return countValues(cards.map((c) => c[0]));
}

function hasNOfAKind(cards: Card[], n: number): boolean {
  const cnt = countRanks(cards);
  return Math.max(...cnt.values(), 0) >= n;
}

function hasNOfRank(cards: Card[], n: number, rank: string): boolean {
  const cnt = countRanks(cards);
  return (cnt.get(rank) ?? 0) >= n;
}

function hasFullHouse(cards: Card[]): boolean {
  const cnt = countRanks(cards);
  const counts = [...cnt.values()].sort((a, b) => b - a);
  return counts.length >= 2 && counts[0]! >= 3 && counts[1]! >= 2;
}

function hasFullHouseWithRanks(
  cards: Card[],
  tripsRank: string,
  pairRank: string
): boolean {
  return hasNOfRank(cards, 3, tripsRank) && hasNOfRank(cards, 2, pairRank);
}

function hasTwoPair(cards: Card[]): boolean {
  const cnt = countRanks(cards);
  let pairs = 0;
  for (const v of cnt.values()) {
    if (v >= 2) pairs++;
  }
  return pairs >= 2;
}

function hasTwoPairWithRanks(cards: Card[], rank1: string, rank2: string): boolean {
  return hasNOfRank(cards, 2, rank1) && hasNOfRank(cards, 2, rank2);
}

export interface HandOptions {
  primaryRank?: string;
  secondaryRank?: string;
  suit?: string;
}

const suitCharToSymbol: Record<string, string> = { S: "♠", H: "♥", D: "♦", C: "♣" };

function resolveSuit(s: string): string {
  return suitCharToSymbol[s] ?? s;
}

export function boardContainsHand(
  board: Card[],
  handType: HandType,
  options?: HandOptions
): boolean {
  if (board.length < 5) return false;
  const { primaryRank, secondaryRank, suit } = options ?? {};
  const suitSymbol = suit ? resolveSuit(suit) : undefined;

  for (const five of combinations(board, 5)) {
    if (handType === HandType.ROYAL_FLUSH || handType === HandType.STRAIGHT_FLUSH) {
      if (isStraightFlush(five, suitSymbol)) return true;
    } else if (handType === HandType.FOUR_OF_A_KIND) {
      if (primaryRank ? hasNOfRank(five, 4, primaryRank) : hasNOfAKind(five, 4))
        return true;
    } else if (handType === HandType.FULL_HOUSE) {
      if (primaryRank && secondaryRank) {
        if (hasFullHouseWithRanks(five, primaryRank, secondaryRank)) return true;
      } else if (hasFullHouse(five)) return true;
    } else if (handType === HandType.FLUSH) {
      if (isFlush(five, suitSymbol)) return true;
    } else if (handType === HandType.STRAIGHT) {
      if (isStraight(five)) return true;
    } else if (handType === HandType.THREE_OF_A_KIND) {
      if (primaryRank ? hasNOfRank(five, 3, primaryRank) : hasNOfAKind(five, 3))
        return true;
    } else if (handType === HandType.TWO_PAIR) {
      if (primaryRank && secondaryRank) {
        if (hasTwoPairWithRanks(five, primaryRank, secondaryRank)) return true;
      } else if (hasTwoPair(five)) return true;
    } else if (handType === HandType.ONE_PAIR) {
      if (primaryRank ? hasNOfRank(five, 2, primaryRank) : hasNOfAKind(five, 2))
        return true;
    } else if (handType === HandType.HIGH_CARD) {
      return true;
    }
  }
  return false;
}

const suitMap: Record<string, string> = { S: "♠", H: "♥", D: "♦", C: "♣" };

export function parseCard(s: string): Card {
  const t = s.trim().toUpperCase();
  let rank: string;
  let suitChar: string;
  if (t.length >= 3 && t.startsWith("10")) {
    rank = "T";
    suitChar = t[2]!;
  } else if (t.length === 2) {
    rank = t[0]!;
    suitChar = t[1]!;
  } else {
    throw new Error(`Invalid card: ${s}`);
  }
  const suit = suitMap[suitChar.toUpperCase()] ?? suitChar;
  if (!RANKS.includes(rank) || !SUITS.includes(suit)) {
    throw new Error(`Invalid card: ${s}`);
  }
  return [rank, suit];
}

export function parseHand(s: string): Card[] {
  return s.split(/\s+/).filter(Boolean).map(parseCard);
}

const HAND_NAMES: Record<string, HandType> = {
  high_card: HandType.HIGH_CARD,
  pair: HandType.ONE_PAIR,
  one_pair: HandType.ONE_PAIR,
  two_pair: HandType.TWO_PAIR,
  three_of_a_kind: HandType.THREE_OF_A_KIND,
  trips: HandType.THREE_OF_A_KIND,
  straight: HandType.STRAIGHT,
  flush: HandType.FLUSH,
  full_house: HandType.FULL_HOUSE,
  boat: HandType.FULL_HOUSE,
  four_of_a_kind: HandType.FOUR_OF_A_KIND,
  quads: HandType.FOUR_OF_A_KIND,
  straight_flush: HandType.STRAIGHT_FLUSH,
  royal_flush: HandType.ROYAL_FLUSH,
};

export function handTypeFromString(name: string): HandType {
  const key = name.trim().toLowerCase().replace(/\s+/g, "_");
  const ht = HAND_NAMES[key];
  if (ht === undefined) throw new Error(`Unknown hand type: ${name}`);
  return ht;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export function probabilityHandOnBoard(
  yourCards: Card[],
  boardSize: number,
  handType: HandType,
  numTrials: number = 5000,
  options?: HandOptions
): number {
  const deck = new Set(makeDeck().map((c) => cardKey(c)));
  const yourSet = new Set(yourCards.map((c) => cardKey(c)));
  for (const k of yourSet) {
    if (!deck.has(k)) throw new Error("Invalid card in your hand");
  }
  const deckCards = makeDeck();
  const remaining = deckCards.filter((c) => !yourSet.has(cardKey(c)));
  const nUnknown = boardSize - yourCards.length;

  if (nUnknown < 0) throw new Error("board_size must be >= your cards length");
  if (nUnknown > remaining.length) {
    throw new Error(
      `Need ${nUnknown} unknown cards but only ${remaining.length} remain`
    );
  }

  if (handType === HandType.HIGH_CARD) return 1;

  let successes = 0;
  for (let i = 0; i < numTrials; i++) {
    const shuffled = shuffle(remaining);
    const unknown = shuffled.slice(0, nUnknown);
    const board = [...yourCards, ...unknown];
    if (boardContainsHand(board, handType, options)) successes++;
  }
  return successes / numTrials;
}
