// Aggregates all eight scoring sections into a single per-entrant total + breakdown.

import { scorePart1, type Part1Breakdown } from "./part1";
import { scorePart2, type Part2Breakdown } from "./part2";
import {
  scoreGroupPrediction,
  type ActualTop3,
  type Part3GroupResult,
} from "./part3";
import { scorePart4, type Part4Breakdown } from "./part4";
import { computeGroupTable } from "./group-table";
import type {
  FantasyEntry,
  GroupPredictionEntry,
  KnockoutPredictionEntry,
  Part2OfficialAnswers,
  ScoringMatch,
  ScoringTeam,
} from "./types";

export * from "./types";
export * from "./part1";
export * from "./part2";
export * from "./part3";
export * from "./part4";
export * from "./group-table";
export * from "./match-utils";

export interface EntrantInput {
  id: string;
  name: string;
  fantasy: FantasyEntry;
  part2Answers: Record<number, string | undefined>;
  groupPredictions: GroupPredictionEntry[];
  knockoutPredictions: KnockoutPredictionEntry[];
}

export interface WorldState {
  teams: ScoringTeam[];
  matches: ScoringMatch[];
  officialPart2: Part2OfficialAnswers;
  /** Organiser-confirmed final top-three per group; falls back to the computed table. */
  groupOverrides?: Record<string, ActualTop3>;
  /** Curated goals/assists per picked scorer (normalised name -> stats). */
  scorerStats?: Map<string, { goals: number; assists: number }>;
}

export interface EntrantScore {
  entrantId: string;
  name: string;
  part1: Part1Breakdown;
  part2: Part2Breakdown;
  part3: { groups: Part3GroupResult[]; total: number };
  part4: Part4Breakdown;
  total: number;
}

/**
 * Resolve the actual top-three for a group. An organiser override (the confirmed
 * final table) wins. Otherwise the table is only used once the group is COMPLETE —
 * every team has played all three games — so Part 3 doesn't score on partial
 * standings mid-tournament.
 */
export function actualTop3ForGroup(
  groupCode: string,
  world: WorldState,
): ActualTop3 | null {
  const override = world.groupOverrides?.[groupCode];
  if (override) return override;

  const table = computeGroupTable(groupCode, world.teams, world.matches);
  const complete = table.length === 4 && table.every((r) => r.played >= 3);
  if (!complete) return null; // group not finished yet — score nothing
  return {
    firstTeamId: table[0].teamId,
    secondTeamId: table[1].teamId,
    thirdTeamId: table[2].teamId,
  };
}

export function scoreEntrant(
  entrant: EntrantInput,
  world: WorldState,
): EntrantScore {
  const part1 = scorePart1(entrant.fantasy, world.matches, world.scorerStats);
  const part2 = scorePart2(entrant.part2Answers, world.officialPart2);

  const groups: Part3GroupResult[] = [];
  for (const pred of entrant.groupPredictions) {
    const actual = actualTop3ForGroup(pred.groupCode, world);
    if (!actual) continue; // group not yet decided -> no points
    groups.push(
      scoreGroupPrediction(
        pred.groupCode,
        {
          firstTeamId: pred.firstTeamId,
          secondTeamId: pred.secondTeamId,
          thirdTeamId: pred.thirdTeamId,
        },
        actual,
      ),
    );
  }
  const part3Total = groups.reduce((s, g) => s + g.points, 0);

  const part4 = scorePart4(entrant.knockoutPredictions, world.matches);

  return {
    entrantId: entrant.id,
    name: entrant.name,
    part1,
    part2,
    part3: { groups, total: part3Total },
    part4,
    total: part1.total + part2.total + part3Total + part4.total,
  };
}

/** Score every entrant and return a leaderboard sorted by total (desc). */
export function buildLeaderboard(
  entrants: EntrantInput[],
  world: WorldState,
): EntrantScore[] {
  return entrants
    .map((e) => scoreEntrant(e, world))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}
