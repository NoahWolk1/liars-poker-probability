import { NextRequest, NextResponse } from "next/server";
import {
  parseHand,
  handTypeFromString,
  probabilityHandOnBoard,
  HandType,
  HAND_LABELS,
  RANK_NAMES,
  SUIT_NAMES,
} from "@/lib/bluff-poker";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { yourCards, boardSize, handClaimed, primaryRank, secondaryRank, suit } = body;

    if (!yourCards || !Array.isArray(yourCards)) {
      return NextResponse.json(
        { error: "yourCards must be an array of card strings (e.g. ['As','Kh'])" },
        { status: 400 }
      );
    }
    if (typeof boardSize !== "number" || boardSize < 1 || boardSize > 52) {
      return NextResponse.json(
        { error: "boardSize must be a number between 1 and 52" },
        { status: 400 }
      );
    }
    if (!handClaimed || typeof handClaimed !== "string") {
      return NextResponse.json(
        { error: "handClaimed must be a string (e.g. 'full_house')" },
        { status: 400 }
      );
    }

    const cardStrings = yourCards.join(" ");
    const cards = parseHand(cardStrings);
    const handType = handTypeFromString(handClaimed);

    const options: { primaryRank?: string; secondaryRank?: string; suit?: string } = {};
    if (primaryRank != null) options.primaryRank = String(primaryRank);
    if (secondaryRank != null) options.secondaryRank = String(secondaryRank);
    if (suit != null) options.suit = String(suit);

    const numTrials = 3000;
    const probability = probabilityHandOnBoard(
      cards,
      boardSize,
      handType,
      numTrials,
      options
    );

    const baseLabel = HAND_LABELS[handType];
    const r1 = primaryRank != null ? RANK_NAMES[primaryRank] ?? primaryRank : null;
    const r2 = secondaryRank != null ? RANK_NAMES[secondaryRank] ?? secondaryRank : null;
    const suitName = suit != null ? SUIT_NAMES[suit] ?? suit : null;
    let handLabel = baseLabel;
    if (r1 != null) handLabel += r2 != null ? ` (${r1} over ${r2})` : ` (${r1})`;
    if (suitName != null) handLabel += ` in ${suitName}`;

    return NextResponse.json({
      probability,
      percent: Math.round(probability * 1000) / 10,
      handType: handLabel,
      boardSize,
      cardsUsed: yourCards.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
