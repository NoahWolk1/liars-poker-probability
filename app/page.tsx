"use client";

import { useState } from "react";

const RANKS = [
  { value: "", label: "Any" },
  { value: "2", label: "2s" },
  { value: "3", label: "3s" },
  { value: "4", label: "4s" },
  { value: "5", label: "5s" },
  { value: "6", label: "6s" },
  { value: "7", label: "7s" },
  { value: "8", label: "8s" },
  { value: "9", label: "9s" },
  { value: "T", label: "10s" },
  { value: "J", label: "Jacks" },
  { value: "Q", label: "Queens" },
  { value: "K", label: "Kings" },
  { value: "A", label: "Aces" },
];

const SUITS = [
  { value: "", label: "Any suit" },
  { value: "♠", label: "♠ Spades" },
  { value: "♥", label: "♥ Hearts" },
  { value: "♦", label: "♦ Diamonds" },
  { value: "♣", label: "♣ Clubs" },
];

const HAND_TYPES = [
  { value: "pair", label: "One Pair", needsRank: true, needsSecondRank: false, needsSuit: false },
  { value: "two_pair", label: "Two Pair", needsRank: true, needsSecondRank: true, needsSuit: false },
  { value: "three_of_a_kind", label: "Three of a Kind", needsRank: true, needsSecondRank: false, needsSuit: false },
  { value: "straight", label: "Straight", needsRank: false, needsSecondRank: false, needsSuit: false },
  { value: "flush", label: "Flush", needsRank: false, needsSecondRank: false, needsSuit: true },
  { value: "full_house", label: "Full House", needsRank: true, needsSecondRank: true, needsSuit: false },
  { value: "four_of_a_kind", label: "Four of a Kind", needsRank: true, needsSecondRank: false, needsSuit: false },
  { value: "straight_flush", label: "Straight Flush", needsRank: false, needsSecondRank: false, needsSuit: true },
  { value: "royal_flush", label: "Royal Flush", needsRank: false, needsSecondRank: false, needsSuit: true },
];

export default function Home() {
  const [cardsInput, setCardsInput] = useState("As Kh");
  const [numPlayers, setNumPlayers] = useState(4);
  const [handClaimed, setHandClaimed] = useState("three_of_a_kind");
  const [primaryRank, setPrimaryRank] = useState("J");
  const [secondaryRank, setSecondaryRank] = useState("6");
  const [suit, setSuit] = useState("♦");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    probability: number;
    percent: number;
    handType: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const boardSize = 2 * numPlayers;
  const currentHand = HAND_TYPES.find((h) => h.value === handClaimed)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const cards = cardsInput
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((c) => c.trim());
      if (cards.length === 0) {
        throw new Error("Enter your 2 hole cards");
      }
      if (cards.length !== 2) {
        throw new Error("Liar's Poker uses exactly 2 cards per player");
      }

      const body: Record<string, unknown> = {
        yourCards: cards,
        boardSize,
        handClaimed,
      };
      if (currentHand.needsRank && primaryRank) {
        body.primaryRank = primaryRank;
      }
      if (currentHand.needsSecondRank && secondaryRank) {
        body.secondaryRank = secondaryRank;
      }
      if (currentHand.needsSuit && suit) {
        body.suit = suit;
      }

      const res = await fetch("/api/probability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Request failed");
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-felt to-feltLight p-6 sm:p-10">
      <div className="mx-auto max-w-2xl">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg sm:text-4xl">
            Liar&apos;s Poker
          </h1>
          <p className="mt-2 text-lg text-green-100">
            Probability that a claimed hand exists in the collective pool
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-card/95 p-6 shadow-xl backdrop-blur sm:p-8"
        >
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                Your 2 hole cards
              </label>
              <input
                type="text"
                value={cardsInput}
                onChange={(e) => setCardsInput(e.target.value)}
                placeholder="As Kh"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 font-mono text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Rank + Suit (e.g. As, 10h, Kh). Two cards.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                Number of players
              </label>
              <input
                type="number"
                min={2}
                max={26}
                value={numPlayers}
                onChange={(e) => setNumPlayers(Math.max(2, parseInt(e.target.value, 10) || 2))}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                {boardSize} cards in the pool (2 per player)
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                Hand being claimed
              </label>
              <select
                value={handClaimed}
                onChange={(e) => setHandClaimed(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                {HAND_TYPES.map((h) => (
                  <option key={h.value} value={h.value}>
                    {h.label}
                  </option>
                ))}
              </select>
            </div>

            {currentHand.needsRank && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-600">
                    {currentHand.needsSecondRank ? "First rank" : "Rank"}
                  </label>
                  <select
                    value={primaryRank}
                    onChange={(e) => setPrimaryRank(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  >
                    {RANKS.filter((r) => r.value).map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  {currentHand.needsSecondRank && (
                    <p className="mt-1 text-xs text-slate-500">e.g. Tens for two pair</p>
                  )}
                </div>
                {currentHand.needsSecondRank && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-600">
                      Second rank
                    </label>
                    <select
                      value={secondaryRank}
                      onChange={(e) => setSecondaryRank(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    >
                      {RANKS.filter((r) => r.value && r.value !== primaryRank).map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-slate-500">e.g. Sixes for two pair</p>
                  </div>
                )}
              </div>
            )}

            {currentHand.needsSuit && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  Suit
                </label>
                <select
                  value={suit}
                  onChange={(e) => setSuit(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  {SUITS.map((s) => (
                    <option key={s.value || "any"} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">e.g. flush in diamonds</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 py-3.5 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Calculating…" : "Calculate probability"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-6 rounded-xl bg-red-500/20 p-4 text-red-200">{error}</div>
        )}

        {result && (
          <div className="mt-6 rounded-2xl bg-card/95 p-8 shadow-xl backdrop-blur">
            <h2 className="mb-4 text-xl font-semibold text-slate-800">Result</h2>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-5xl font-bold text-emerald-600">{result.percent}%</span>
              <span className="text-slate-600">P({result.handType} in pool)</span>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Monte Carlo estimate (≈3000 trials). If you call bluff and the hand exists,
              you lose; if it doesn&apos;t, the bidder loses.
            </p>
          </div>
        )}

        <div className="mt-10 rounded-xl bg-black/20 p-5 text-green-100/90">
          <h3 className="mb-2 font-semibold text-white">Rules</h3>
          <p className="text-sm leading-relaxed">
            Each player gets 2 hole cards. Players bid poker hands they believe exist in
            the collective pool. Call &quot;bluff&quot; on the previous bid: if the hand exists,
            the challenger loses; if it doesn&apos;t, the bidder loses.
          </p>
        </div>
      </div>
    </main>
  );
}
