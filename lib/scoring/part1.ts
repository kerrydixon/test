// Part 1 — Fantasy football element.
//
// Teams: +250 win / +125 draw / 0 loss (result after ET + shoot-out),
//        +150 per goal scored (incl. own goals in favour),
//        -100 per goal conceded (incl. own goals against).
// Scorers: +150 per goal (own goals and shoot-out goals excluded),
//          +75 per officially awarded assist.
// Shoot-out goals never count; extra-time goals do.

import type { FantasyEntry, ScoringMatch } from "./types";
import { normaliseName } from "./names";
import {
  countedGoals,
  goalsAgainstTeam,
  goalsForTeam,
  isPlayed,
  outcomeForTeam,
  teamMatches,
} from "./match-utils";

export const PART1_POINTS = {
  win: 250,
  draw: 125,
  loss: 0,
  goalScored: 150,
  goalConceded: -100,
  scorerGoal: 150,
  assist: 75,
} as const;

export interface Part1Breakdown {
  teamPoints: number;
  scorerPoints: number;
  total: number;
  perTeam: {
    teamId: string;
    resultPoints: number;
    goalsFor: number;
    goalsAgainst: number;
    goalPoints: number;
    total: number;
  }[];
  perScorer: { name: string; goals: number; assists: number; points: number }[];
}

export function scorePart1(
  entry: FantasyEntry,
  matches: ScoringMatch[],
): Part1Breakdown {
  const perTeam = entry.teamIds.map((teamId) => {
    let resultPoints = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;

    for (const m of teamMatches(matches, teamId)) {
      if (!isPlayed(m)) continue;
      const outcome = outcomeForTeam(m, teamId);
      if (outcome === "WIN") resultPoints += PART1_POINTS.win;
      else if (outcome === "DRAW") resultPoints += PART1_POINTS.draw;
      goalsFor += goalsForTeam(m, teamId);
      goalsAgainst += goalsAgainstTeam(m, teamId);
    }

    const goalPoints =
      goalsFor * PART1_POINTS.goalScored +
      goalsAgainst * PART1_POINTS.goalConceded;
    return {
      teamId,
      resultPoints,
      goalsFor,
      goalsAgainst,
      goalPoints,
      total: resultPoints + goalPoints,
    };
  });

  // Tally scorer goals/assists across every played match, keyed by normalised
  // name so "Mbappé", "mbappe" and "Mbappe " all count as the same player.
  const goalTally = new Map<string, number>();
  const assistTally = new Map<string, number>();
  for (const m of matches) {
    if (!isPlayed(m)) continue;
    for (const g of countedGoals(m)) {
      if (!g.isOwnGoal) {
        const key = normaliseName(g.scorerName);
        goalTally.set(key, (goalTally.get(key) ?? 0) + 1);
      }
      if (g.assistName) {
        const key = normaliseName(g.assistName);
        assistTally.set(key, (assistTally.get(key) ?? 0) + 1);
      }
    }
  }

  const perScorer = entry.scorerNames.map((name) => {
    const key = normaliseName(name);
    const goals = goalTally.get(key) ?? 0;
    const assists = assistTally.get(key) ?? 0;
    return {
      name,
      goals,
      assists,
      points: goals * PART1_POINTS.scorerGoal + assists * PART1_POINTS.assist,
    };
  });

  const teamPoints = perTeam.reduce((s, t) => s + t.total, 0);
  const scorerPoints = perScorer.reduce((s, p) => s + p.points, 0);

  return {
    teamPoints,
    scorerPoints,
    total: teamPoints + scorerPoints,
    perTeam,
    perScorer,
  };
}
