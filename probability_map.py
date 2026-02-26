"""
Build and explore probability maps for Bluff Poker.

Maps: (your_cards_type, board_size, claimed_hand) -> P(hand exists)

"your_cards_type" can be:
  - A specific hand (e.g. "As Kh Qd Jc 10s")
  - A generic pattern: "random", "pair", "two_hearts", etc. (future)
  - For now we use "random" = sample random hands and average
"""

from bluff_poker import (
    HandType,
    probability_hand_on_board,
    parse_hand,
    hand_type_from_string,
    make_deck,
)
import random
from collections import defaultdict

HAND_TYPES = [
    HandType.ONE_PAIR,
    HandType.TWO_PAIR,
    HandType.THREE_OF_A_KIND,
    HandType.STRAIGHT,
    HandType.FLUSH,
    HandType.FULL_HOUSE,
    HandType.FOUR_OF_A_KIND,
    HandType.STRAIGHT_FLUSH,
]


def build_probability_table(
    cards_per_player: int = 5,
    num_players: int = 4,
    hands_per_cell: int = 500,
    seed: int = 42,
) -> dict:
    """
    Build a table: for random hands of size cards_per_player, with
    board_size = cards_per_player * num_players, what's P(each hand type)?
    """
    random.seed(seed)
    deck = make_deck()
    board_size = cards_per_player * num_players

    table = defaultdict(list)
    for hand_type in HAND_TYPES:
        probs = []
        for _ in range(hands_per_cell):
            your_cards = random.sample(deck, cards_per_player)
            p = probability_hand_on_board(
                your_cards, board_size, hand_type, num_trials=500, seed=None
            )
            probs.append(p)
        avg = sum(probs) / len(probs)
        table[hand_type.name] = {"mean": avg, "samples": len(probs)}

    return dict(table)


def lookup_probability(
    your_cards_str: str,
    board_size: int,
    hand_claimed: str,
    num_trials: int = 5000,
) -> float:
    """
    Quick lookup: given your cards, board size, and claimed hand, return P.
    """
    your = parse_hand(your_cards_str)
    ht = hand_type_from_string(hand_claimed)
    return probability_hand_on_board(your, board_size, ht, num_trials=num_trials)


def print_table(table: dict):
    print("\nBluff Poker Probability Table (random hand, avg over samples)")
    print("Board = cards_per_player × num_players")
    print("-" * 50)
    for hand_name, data in sorted(table.items(), key=lambda x: -HandType[x[0]]):
        print(f"  {hand_name:20}  {data['mean']:.1%}")


if __name__ == "__main__":
    print("Building probability map (4 players × 5 cards = 20 on board)...")
    print("(This may take a minute...)")
    table = build_probability_table(
        cards_per_player=5, num_players=4, hands_per_cell=100
    )
    print_table(table)

    print("\n" + "=" * 50)
    print("Example: You have As Kh Qd Jc 10s, someone claims FULL_HOUSE")
    p = lookup_probability("As Kh Qd Jc 10s", 20, "full_house", num_trials=3000)
    print(f"  P(Full House on board) = {p:.1%}")

    print("\nExample: You have 2h 7d 9c 3s Kh (random), someone claims FLUSH")
    p2 = lookup_probability("2h 7d 9c 3s Kh", 20, "flush", num_trials=3000)
    print(f"  P(Flush on board) = {p2:.1%}")
