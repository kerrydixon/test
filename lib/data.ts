// Server-side data access: loads Prisma rows and maps them into the pure
// scoring-engine shapes, then exposes high-level helpers used by pages/APIs.

import { prisma } from "./db";
import {
  buildLeaderboard,
  scoreEntrant,
  type EntrantInput,
  type EntrantScore,
  type ScoringMatch,
  type WorldState,
} from "./scoring";
import type { ActualTop3 } from "./scoring/part3";

export async function getWorldState(): Promise<WorldState> {
  const [teams, matches, official, overrides] = await Promise.all([
    prisma.team.findMany(),
    prisma.match.findMany({ include: { events: true } }),
    prisma.part2OfficialAnswer.findMany(),
    prisma.groupStandingOverride.findMany(),
  ]);

  const scoringMatches: ScoringMatch[] = matches.map((m) => ({
    id: m.id,
    stage: m.stage,
    groupCode: m.groupCode,
    homeTeamId: m.homeTeamId,
    awayTeamId: m.awayTeamId,
    status: m.status,
    homeGoals: m.homeGoals,
    awayGoals: m.awayGoals,
    wentToExtraTime: m.wentToExtraTime,
    shootoutWinnerTeamId: m.shootoutWinnerTeamId,
    goals: m.events.map((e) => ({
      teamId: e.teamId,
      scorerName: e.scorerName,
      assistName: e.assistName,
      minute: e.minute,
      isOwnGoal: e.isOwnGoal,
      isExtraTime: e.isExtraTime,
      isShootout: e.isShootout,
    })),
  }));

  const officialPart2: WorldState["officialPart2"] = {};
  for (const row of official) officialPart2[row.questionNo] = row.answers;

  const groupOverrides: Record<string, ActualTop3> = {};
  for (const o of overrides) {
    groupOverrides[o.groupCode] = {
      firstTeamId: o.firstTeamId,
      secondTeamId: o.secondTeamId,
      thirdTeamId: o.thirdTeamId,
    };
  }

  return {
    teams: teams.map((t) => ({ id: t.id, name: t.name, groupCode: t.groupCode })),
    matches: scoringMatches,
    officialPart2,
    groupOverrides,
  };
}

export async function getEntrantInputs(): Promise<EntrantInput[]> {
  const entrants = await prisma.entrant.findMany({
    include: {
      teams: true,
      scorers: true,
      part2Answers: true,
      groupPredictions: true,
      knockoutPredictions: true,
    },
    orderBy: { name: "asc" },
  });

  return entrants.map((e) => ({
    id: e.id,
    name: e.name,
    fantasy: {
      teamIds: e.teams.map((t) => t.teamId),
      scorerNames: e.scorers.map((s) => s.playerName),
    },
    part2Answers: Object.fromEntries(
      e.part2Answers.map((a) => [a.questionNo, a.answer] as const),
    ),
    groupPredictions: e.groupPredictions.map((g) => ({
      groupCode: g.groupCode,
      firstTeamId: g.firstTeamId,
      secondTeamId: g.secondTeamId,
      thirdTeamId: g.thirdTeamId,
    })),
    knockoutPredictions: e.knockoutPredictions.map((k) => ({
      matchId: k.matchId,
      predictedTeamId: k.predictedTeamId,
    })),
  }));
}

export interface LeaderboardEntry extends EntrantScore {
  locked: boolean;
}

export async function getLeaderboard(): Promise<EntrantScore[]> {
  const [world, entrants] = await Promise.all([
    getWorldState(),
    getEntrantInputs(),
  ]);
  return buildLeaderboard(entrants, world);
}

/** Full score for a single entrant (used on the entrant detail page). */
export async function getEntrantScore(
  id: string,
): Promise<EntrantScore | null> {
  const [world, entrants] = await Promise.all([
    getWorldState(),
    getEntrantInputs(),
  ]);
  const entrant = entrants.find((e) => e.id === id);
  if (!entrant) return null;
  return scoreEntrant(entrant, world);
}

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function isSubmissionOpen(): Promise<boolean> {
  const deadline = await getSetting("submissionDeadline");
  if (!deadline) return true;
  return Date.now() < new Date(deadline).getTime();
}
