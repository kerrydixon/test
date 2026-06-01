// Demo/testing helpers, invoked from the admin dashboard. These let the organiser
// populate the live site with a full simulated group stage (results + sample
// entrants) to sanity-check scoring, then wipe everything back to the seeded state.
//
// Everything here is reversible via wipeAllData().

import { prisma } from "@/lib/db";
import { computeGroupTable, type ScoringMatch } from "@/lib/scoring";
import { GROUP_CODES } from "@/lib/teams";

const SQUAD_SUFFIX = ["Silva", "Mendez", "Okafor", "Müller", "Tanaka"];
const DEMO_PREFIX = "Demo ";
const DEMO_NAMES = [
  "Demo Alice",
  "Demo Ben",
  "Demo Carla",
  "Demo Diego",
  "Demo Emma",
  "Demo Femi",
  "Demo Grace",
  "Demo Hiro",
];

function squad(teamName: string): string[] {
  return SQUAD_SUFFIX.map((s) => `${teamName} ${s}`);
}

// Deterministic PRNG so a simulation is reproducible.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), seed | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SimSummary {
  matchesPlayed: number;
  goals: number;
  entrants: number;
}

export async function simulateGroupStage(): Promise<SimSummary> {
  const teams = await prisma.team.findMany();
  const teamById = new Map(teams.map((t) => [t.id, t] as const));
  const rand = mulberry32(20260611);

  const groupMatches = await prisma.match.findMany({ where: { stage: "GROUP" } });

  // Reset prior group events so re-running is clean.
  await prisma.matchEvent.deleteMany({ where: { match: { stage: "GROUP" } } });

  const eventRows: {
    matchId: string;
    teamId: string;
    scorerName: string;
    assistName: string | null;
    minute: number;
    source: "MANUAL";
  }[] = [];

  const makeGoals = (matchId: string, teamName: string, teamId: string, n: number) => {
    const sq = squad(teamName);
    for (let i = 0; i < n; i++) {
      const scorer = sq[Math.floor(rand() * sq.length)];
      const maybeAssist = rand() < 0.5 ? sq[Math.floor(rand() * sq.length)] : null;
      eventRows.push({
        matchId,
        teamId,
        scorerName: scorer,
        assistName: maybeAssist && maybeAssist !== scorer ? maybeAssist : null,
        minute: 1 + Math.floor(rand() * 90),
        source: "MANUAL",
      });
    }
  };

  for (const m of groupMatches) {
    const home = teamById.get(m.homeTeamId)!;
    const away = teamById.get(m.awayTeamId)!;
    const hg = Math.floor(rand() * 4); // 0–3
    const ag = Math.floor(rand() * 4);
    await prisma.match.update({
      where: { id: m.id },
      data: {
        status: "FINISHED",
        homeGoals: hg,
        awayGoals: ag,
        wentToExtraTime: false,
        shootoutWinnerTeamId: null,
        adminLocked: false,
        source: "MANUAL",
      },
    });
    makeGoals(m.id, home.name, home.id, hg);
    makeGoals(m.id, away.name, away.id, ag);
  }
  if (eventRows.length) await prisma.matchEvent.createMany({ data: eventRows });

  // Official Part 2 answers for a couple of questions so Part 2 scores.
  await prisma.part2OfficialAnswer.upsert({
    where: { questionNo: 1 },
    update: { answers: ["USA win"] },
    create: { questionNo: 1, answers: ["USA win"] },
  });
  await prisma.part2OfficialAnswer.upsert({
    where: { questionNo: 12 },
    update: { answers: ["Brazil"] },
    create: { questionNo: 12, answers: ["Brazil"] },
  });

  // Actual top-three per group (for varied group predictions).
  const scoringMatches: ScoringMatch[] = groupMatches.map((m) => ({
    id: m.id,
    stage: "GROUP",
    groupCode: m.groupCode,
    homeTeamId: m.homeTeamId,
    awayTeamId: m.awayTeamId,
    status: "FINISHED",
    homeGoals: null, // filled below from the freshly-updated rows
    awayGoals: null,
    wentToExtraTime: false,
    shootoutWinnerTeamId: null,
    goals: [],
  }));
  // Re-read scores we just set.
  const updated = await prisma.match.findMany({
    where: { stage: "GROUP" },
    select: { id: true, homeGoals: true, awayGoals: true },
  });
  const scoreById = new Map(updated.map((u) => [u.id, u] as const));
  for (const sm of scoringMatches) {
    const s = scoreById.get(sm.id);
    sm.homeGoals = s?.homeGoals ?? 0;
    sm.awayGoals = s?.awayGoals ?? 0;
  }
  const scoringTeams = teams.map((t) => ({ id: t.id, name: t.name, groupCode: t.groupCode }));
  const top3ByGroup = new Map<string, [string, string, string]>();
  for (const code of GROUP_CODES) {
    const table = computeGroupTable(code, scoringTeams, scoringMatches);
    top3ByGroup.set(code, [table[0].teamId, table[1].teamId, table[2].teamId]);
  }

  // Fresh demo entrants.
  await prisma.entrant.deleteMany({ where: { name: { startsWith: DEMO_PREFIX } } });

  const tier2300 = teams.filter((t) => t.priceTier === 2300);
  const tier2100 = teams.filter((t) => t.priceTier === 2100);

  for (let i = 0; i < DEMO_NAMES.length; i++) {
    const t1 = tier2300[i % tier2300.length];
    const t2 = tier2100[i % tier2100.length];
    // 2300 + 2100 = 4400 → exactly 9 scorers fills the £5,300m budget.
    const scorerNames = [...squad(t1.name), ...squad(t2.name).slice(0, 4)];

    const groupPredictions = GROUP_CODES.map((code, gi) => {
      const [a, b, c] = top3ByGroup.get(code)!;
      // Vary accuracy: some exact, some swapped, some with a wrong team.
      const variant = (i + gi) % 3;
      if (variant === 0) return { groupCode: code, firstTeamId: a, secondTeamId: b, thirdTeamId: c };
      if (variant === 1) return { groupCode: code, firstTeamId: b, secondTeamId: a, thirdTeamId: c };
      return { groupCode: code, firstTeamId: a, secondTeamId: c, thirdTeamId: b };
    });

    await prisma.entrant.create({
      data: {
        name: DEMO_NAMES[i],
        teams: { create: [{ teamId: t1.id }, { teamId: t2.id }] },
        scorers: { create: scorerNames.map((playerName) => ({ playerName })) },
        part2Answers: {
          create: [
            { questionNo: 1, answer: ["USA win", "Draw", "Paraguay win"][i % 3] },
            { questionNo: 12, answer: ["Brazil", "France", "Spain"][i % 3] },
          ],
        },
        groupPredictions: { create: groupPredictions },
      },
    });
  }

  return {
    matchesPlayed: groupMatches.length,
    goals: eventRows.length,
    entrants: DEMO_NAMES.length,
  };
}

/** Reset the database back to the freshly-seeded state (removes all results & entries). */
export async function wipeAllData(): Promise<void> {
  await prisma.entrant.deleteMany({}); // cascades to picks/predictions
  await prisma.matchEvent.deleteMany({});
  await prisma.match.updateMany({
    data: {
      status: "SCHEDULED",
      homeGoals: null,
      awayGoals: null,
      wentToExtraTime: false,
      shootoutWinnerTeamId: null,
      adminLocked: false,
    },
  });
  await prisma.groupStandingOverride.deleteMany({});
  await prisma.part2OfficialAnswer.updateMany({ data: { answers: [] } });
  await prisma.syncLog.deleteMany({});
  // Remove any knockout matches created during testing (keep the 72 group fixtures).
  await prisma.match.deleteMany({ where: { stage: { not: "GROUP" } } });
}
