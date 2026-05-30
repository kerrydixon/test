// Part 4 — knockout stage winner predictions. 250 points per correctly predicted
// match winner across the round of 32, round of 16, quarter-finals, semi-finals
// and the final. The winner is determined at the end of the game (after extra time
// and any penalty shoot-out).

import type { KnockoutPredictionEntry, ScoringMatch } from "./types";
import { isPlayed, outcomeForTeam } from "./match-utils";

export const PART4_POINTS_PER_MATCH = 250;

/** The winning team of a (knockout) match, or null if not yet decided. */
export function matchWinner(m: ScoringMatch): string | null {
  if (!isPlayed(m)) return null;
  if (outcomeForTeam(m, m.homeTeamId) === "WIN") return m.homeTeamId;
  if (outcomeForTeam(m, m.awayTeamId) === "WIN") return m.awayTeamId;
  return null; // group-stage draw with no shoot-out
}

export interface Part4Breakdown {
  total: number;
  perMatch: {
    matchId: string;
    predictedTeamId: string;
    actualWinnerId: string | null;
    correct: boolean;
    points: number;
  }[];
}

export function scorePart4(
  predictions: KnockoutPredictionEntry[],
  matches: ScoringMatch[],
): Part4Breakdown {
  const byId = new Map(matches.map((m) => [m.id, m] as const));

  const perMatch = predictions.map((p) => {
    const match = byId.get(p.matchId);
    const actualWinnerId = match ? matchWinner(match) : null;
    const correct = actualWinnerId !== null && actualWinnerId === p.predictedTeamId;
    return {
      matchId: p.matchId,
      predictedTeamId: p.predictedTeamId,
      actualWinnerId,
      correct,
      points: correct ? PART4_POINTS_PER_MATCH : 0,
    };
  });

  return {
    total: perMatch.reduce((s, m) => s + m.points, 0),
    perMatch,
  };
}
