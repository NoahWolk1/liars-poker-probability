#!/usr/bin/env python3
"""
Interactive probability lookup for Bluff Poker.

Usage:
  python interactive_lookup.py

Then follow prompts to enter your cards, board size, and claimed hand.
"""

from bluff_poker import (
    probability_with_confidence,
    parse_hand,
    hand_type_from_string,
    HandType,
)


def main():
    print("=" * 60)
    print("  Bluff Poker Probability Lookup")
    print("=" * 60)
    print("\nCard format: Rank + Suit (e.g. As Kh 10d 2c 3h)")
    print("  Ranks: 2-9, T (10), J, Q, K, A")
    print("  Suits: s ♠, h ♥, d ♦, c ♣")
    print()

    while True:
        try:
            cards_str = input("Your cards (space-separated, or 'q' to quit): ").strip()
            if cards_str.lower() == "q":
                break
            your_cards = parse_hand(cards_str)
            print(f"  Parsed: {[f'{r}{s}' for r,s in your_cards]}")

            board_str = input("Total cards on board (all players combined) [20]: ").strip()
            board_size = int(board_str) if board_str else 20

            print("Hand types: pair, two_pair, trips, straight, flush, full_house, quads, straight_flush, royal_flush")
            hand_str = input("Hand being claimed: ").strip()
            hand_type = hand_type_from_string(hand_str)

            trials = 3000
            print(f"\n  Computing (n={trials} trials)...")
            p, (lo, hi) = probability_with_confidence(
                your_cards, board_size, hand_type, num_trials=trials
            )
            print(f"\n  P({hand_type.name} on board) = {p:.1%}")
            print(f"  95% CI: [{lo:.1%}, {hi:.1%}]")
            print()
        except ValueError as e:
            print(f"  Error: {e}\n")
        except KeyboardInterrupt:
            print("\nBye!")
            break


if __name__ == "__main__":
    main()
