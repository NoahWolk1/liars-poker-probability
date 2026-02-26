"""
Bluff Poker Probability Model

Models the probability that a claimed poker hand exists on the "board"
(the combined cards of all players) given:
  - Your known cards
  - Total number of cards on the board
  - The hand type being claimed

In Bluff Poker: everyone has x cards, only you know yours. The board =
everyone's cards pooled. Players claim hands; when someone calls bullshit,
cards flip and they check if the hand can be made.
"""

from __future__ import annotations

import random
from collections import Counter
from enum import IntEnum
from itertools import combinations
from typing import List, Optional, Tuple

# --- Card representation ---

SUITS = "♠♥♦♣"  # spades, hearts, diamonds, clubs
RANKS = "23456789TJQKA"  # 2 through Ace


class HandType(IntEnum):
    """Standard poker hand rankings (higher = stronger)."""
    HIGH_CARD = 0
    ONE_PAIR = 1
    TWO_PAIR = 2
    THREE_OF_A_KIND = 3
    STRAIGHT = 4
    FLUSH = 5
    FULL_HOUSE = 6
    FOUR_OF_A_KIND = 7
    STRAIGHT_FLUSH = 8
    ROYAL_FLUSH = 9  # subset of straight flush, but we treat as same for "can you make it"


def rank_value(r: str) -> int:
    """2=0, 3=1, ..., A=12."""
    return RANKS.index(r)


def make_deck() -> List[Tuple[str, str]]:
    """Standard 52-card deck as (rank, suit) tuples."""
    return [(r, s) for r in RANKS for s in SUITS]


def card_str(c: Tuple[str, str]) -> str:
    return f"{c[0]}{c[1]}"


# --- Hand detection (can these cards form hand X?) ---


def _is_flush(cards: List[Tuple[str, str]]) -> bool:
    if len(cards) < 5:
        return False
    suits = [c[1] for c in cards]
    return max(Counter(suits).values()) >= 5


def _is_straight(cards: List[Tuple[str, str]]) -> bool:
    """Check if any 5-card subset forms a straight."""
    vals = sorted(set(rank_value(c[0]) for c in cards), reverse=True)
    if len(vals) < 5:
        return False
    # Check for A-2-3-4-5 (wheel)
    if 12 in vals and 0 in vals and 1 in vals and 2 in vals and 3 in vals:
        return True
    for i in range(len(vals) - 4):
        run = vals[i : i + 5]
        if run[0] - run[4] == 4 and len(set(run)) == 5:
            return True
    return False


def _is_straight_flush(cards: List[Tuple[str, str]]) -> bool:
    """Check if any 5-card subset is a straight flush."""
    by_suit: dict = {}
    for c in cards:
        by_suit.setdefault(c[1], []).append(c)
    for suit_cards in by_suit.values():
        if len(suit_cards) >= 5 and _is_straight(suit_cards):
            return True
    return False


def _count_ranks(cards: List[Tuple[str, str]]) -> Counter:
    return Counter(c[0] for c in cards)


def _has_n_of_a_kind(cards: List[Tuple[str, str]], n: int) -> bool:
    return max(_count_ranks(cards).values()) >= n


def _has_full_house(cards: List[Tuple[str, str]]) -> bool:
    cnt = _count_ranks(cards)
    counts = sorted(cnt.values(), reverse=True)
    return len(counts) >= 2 and counts[0] >= 3 and counts[1] >= 2


def _has_two_pair(cards: List[Tuple[str, str]]) -> bool:
    cnt = _count_ranks(cards)
    pairs = sum(1 for v in cnt.values() if v >= 2)
    return pairs >= 2


def board_contains_hand(board: List[Tuple[str, str]], hand_type: HandType) -> bool:
    """
    Check if the board (pool of all cards) contains any 5-card subset
    that forms the given hand type.
    """
    if len(board) < 5:
        return False
    for five in combinations(board, 5):
        five_list = list(five)
        if hand_type == HandType.ROYAL_FLUSH or hand_type == HandType.STRAIGHT_FLUSH:
            if _is_straight_flush(five_list):
                return True
        elif hand_type == HandType.FOUR_OF_A_KIND:
            if _has_n_of_a_kind(five_list, 4):
                return True
        elif hand_type == HandType.FULL_HOUSE:
            if _has_full_house(five_list):
                return True
        elif hand_type == HandType.FLUSH:
            if _is_flush(five_list):
                return True
        elif hand_type == HandType.STRAIGHT:
            if _is_straight(five_list):
                return True
        elif hand_type == HandType.THREE_OF_A_KIND:
            if _has_n_of_a_kind(five_list, 3):
                return True
        elif hand_type == HandType.TWO_PAIR:
            if _has_two_pair(five_list):
                return True
        elif hand_type == HandType.ONE_PAIR:
            if _has_n_of_a_kind(five_list, 2):
                return True
        elif hand_type == HandType.HIGH_CARD:
            return True  # always possible
    return False


# --- Probability computation ---


def probability_hand_on_board(
    your_cards: List[Tuple[str, str]],
    board_size: int,
    hand_type: HandType,
    num_trials: int = 10_000,
    seed: Optional[int] = None,
) -> float:
    """
    Estimate P(claimed hand exists on board | your cards, board size).

    Uses Monte Carlo: repeatedly deal the unknown (board_size - len(your_cards))
    cards from the remaining deck, combine with your cards, and check if
    the hand exists.

    Args:
        your_cards: Your known cards, e.g. [('A','♠'), ('K','♥'), ...]
        board_size: Total cards on board (all players combined)
        hand_type: The hand being claimed (e.g. FULL_HOUSE, FLUSH)
        num_trials: Monte Carlo iterations
        seed: Optional RNG seed for reproducibility

    Returns:
        Estimated probability in [0, 1]
    """
    if seed is not None:
        random.seed(seed)

    deck = set(make_deck())
    your_set = set(your_cards)
    if your_set - deck:
        raise ValueError("Invalid cards in your_cards")
    remaining = list(deck - your_set)
    k = len(your_cards)
    n_unknown = board_size - k

    if n_unknown < 0:
        raise ValueError("board_size must be >= len(your_cards)")
    if n_unknown > len(remaining):
        raise ValueError(
            f"board_size - your_cards = {n_unknown} unknown cards, "
            f"but only {len(remaining)} remain in deck"
        )

    if hand_type == HandType.HIGH_CARD:
        return 1.0

    successes = 0
    for _ in range(num_trials):
        unknown = random.sample(remaining, n_unknown)
        board = list(your_cards) + unknown
        if board_contains_hand(board, hand_type):
            successes += 1

    return successes / num_trials


def probability_with_confidence(
    your_cards: List[Tuple[str, str]],
    board_size: int,
    hand_type: HandType,
    num_trials: int = 10_000,
    seed: Optional[int] = None,
) -> Tuple[float, float]:
    """
    Same as probability_hand_on_board but also returns approximate 95% CI.
    Uses Wilson score interval for binomial proportion.
    """
    p = probability_hand_on_board(
        your_cards, board_size, hand_type, num_trials, seed
    )
    # Wilson score approx: z=1.96 for 95%
    z = 1.96
    n = num_trials
    center = (p + z * z / (2 * n)) / (1 + z * z / n)
    margin = z * ((p * (1 - p) / n + z * z / (4 * n * n)) ** 0.5) / (1 + z * z / n)
    lo = max(0, center - margin)
    hi = min(1, center + margin)
    return p, (lo, hi)


# --- Convenience: parse card strings ---

def parse_card(s: str) -> Tuple[str, str]:
    """Parse 'As' -> ('A','♠'), '10h' -> ('T','♥'), etc."""
    s = s.strip().upper()
    suit_map = {"S": "♠", "H": "♥", "D": "♦", "C": "♣"}
    if len(s) >= 3 and s[:2] == "10":
        rank, suit_char = "T", s[2]
    elif len(s) == 2:
        rank, suit_char = s[0], s[1]
    else:
        raise ValueError(f"Invalid card format: {s}")
    rank = "T" if rank == "10" else rank
    suit = suit_map.get(suit_char, suit_char)
    if rank not in RANKS or suit not in SUITS:
        raise ValueError(f"Invalid card: {s}")
    return (rank, suit)


def parse_hand(s: str) -> List[Tuple[str, str]]:
    """Parse space-separated cards: 'As Kh 10d 2c 3s'"""
    return [parse_card(x) for x in s.split()]


# --- Hand type from string ---

HAND_NAMES = {
    "high_card": HandType.HIGH_CARD,
    "pair": HandType.ONE_PAIR,
    "one_pair": HandType.ONE_PAIR,
    "two_pair": HandType.TWO_PAIR,
    "three_of_a_kind": HandType.THREE_OF_A_KIND,
    "trips": HandType.THREE_OF_A_KIND,
    "straight": HandType.STRAIGHT,
    "flush": HandType.FLUSH,
    "full_house": HandType.FULL_HOUSE,
    "boat": HandType.FULL_HOUSE,
    "four_of_a_kind": HandType.FOUR_OF_A_KIND,
    "quads": HandType.FOUR_OF_A_KIND,
    "straight_flush": HandType.STRAIGHT_FLUSH,
    "royal_flush": HandType.ROYAL_FLUSH,
}


def hand_type_from_string(name: str) -> HandType:
    return HAND_NAMES[name.strip().lower().replace(" ", "_")]


if __name__ == "__main__":
    # Quick demo
    your = parse_hand("As Ks Qs Js 10s")  # Royal flush in hand
    p = probability_hand_on_board(your, board_size=20, hand_type=HandType.ROYAL_FLUSH, num_trials=1000, seed=42)
    print(f"P(Royal Flush on board | you have Royal Flush, 20 cards total): {p:.2%}")

    your2 = parse_hand("2h 3d 7c 9s Kh")  # Random hand
    p2 = probability_hand_on_board(your2, board_size=20, hand_type=HandType.FULL_HOUSE, num_trials=5000, seed=42)
    print(f"P(Full House on board | random hand, 20 cards total): {p2:.2%}")
