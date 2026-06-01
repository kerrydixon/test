// Demo/testing helpers, invoked from the admin dashboard. These let the organiser
// populate the live site with a full simulated group stage (results + sample
// entrants) to sanity-check scoring, then wipe everything back to the seeded state.
//
// Everything here is reversible via wipeAllData(). All writes are batched into a few
// transactions so it completes well within the serverless function time limit.

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

  // 1) Plan every score + goal event in memory first (no DB round-trips here).
  const planned = new Map<string, { hg: number; ag: number }>();
  const eventRows: {
    matchId: string;
    teamId: string;
    scorerName: string;
    assistName: string | null;
    minute: number;
    source: "MANUAL";
  }[] = [];

  const planGoals = (matchId: string, teamName: string, teamId: string, n: number) => {
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
    planned.set(m.id, { hg, ag });
    planGoals(m.id, home.name, home.id, hg);
    planGoals(m.id, away.name, away.id, ag);
  }

  // 2) Apply all match results in one batched transaction.
  await prisma.$transaction(
    groupMatches.map((m) => {
      const { hg, ag } = planned.get(m.id)!;
      return prisma.match.update({
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
    }),
  );

  // 3) Replace group goal events.
  await prisma.matchEvent.deleteMany({ where: { match: { stage: "GROUP" } } });
  if (eventRows.length) await prisma.matchEvent.createMany({ data: eventRows });

  // 4) Official Part 2 answers (so Part 2 scores).
  await prisma.$transaction([
    prisma.part2OfficialAnswer.upsert({
      where: { questionNo: 1 },
      update: { answers: ["USA win"] },
      create: { questionNo: 1, answers: ["USA win"] },
    }),
    prisma.part2OfficialAnswer.upsert({
      where: { questionNo: 12 },
      update: { answers: ["Brazil"] },
      create: { questionNo: 12, answers: ["Brazil"] },
    }),
  ]);

  // 5) Actual top-three per group (computed in memory from the planned scores).
  const scoringTeams = teams.map((t) => ({ id: t.id, name: t.name, groupCode: t.groupCode }));
  const scoringMatches: ScoringMatch[] = groupMatches.map((m) => {
    const { hg, ag } = planned.get(m.id)!;
    return {
      id: m.id,
      stage: "GROUP",
      groupCode: m.groupCode,
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      status: "FINISHED",
      homeGoals: hg,
      awayGoals: ag,
      wentToExtraTime: false,
      shootoutWinnerTeamId: null,
      goals: [],
    };
  });
  const top3ByGroup = new Map<string, [string, string, string]>();
  for (const code of GROUP_CODES) {
    const table = computeGroupTable(code, scoringTeams, scoringMatches);
    top3ByGroup.set(code, [table[0].teamId, table[1].teamId, table[2].teamId]);
  }

  // 6) Fresh demo entrants, created in one batched transaction.
  await prisma.entrant.deleteMany({ where: { name: { startsWith: DEMO_PREFIX } } });

  const tier2300 = teams.filter((t) => t.priceTier === 2300);
  const tier2100 = teams.filter((t) => t.priceTier === 2100);

  await prisma.$transaction(
    DEMO_NAMES.map((name, i) => {
      const t1 = tier2300[i % tier2300.length];
      const t2 = tier2100[i % tier2100.length];
      // 2300 + 2100 = 4400 → exactly 9 scorers fills the £5,300m budget.
      const scorerNames = [...squad(t1.name), ...squad(t2.name).slice(0, 4)];

      const groupPredictions = GROUP_CODES.map((code, gi) => {
        const [a, b, c] = top3ByGroup.get(code)!;
        const variant = (i + gi) % 3; // vary accuracy across entrants
        if (variant === 0) return { groupCode: code, firstTeamId: a, secondTeamId: b, thirdTeamId: c };
        if (variant === 1) return { groupCode: code, firstTeamId: b, secondTeamId: a, thirdTeamId: c };
        return { groupCode: code, firstTeamId: a, secondTeamId: c, thirdTeamId: b };
      });

      return prisma.entrant.create({
        data: {
          name,
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
    }),
  );

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
  // Remove any non-canonical matches created during testing/scraping: all
  // knockout fixtures, plus any scraped group duplicates (the seeded ones use
  // externalRef "GRP-..."). This leaves exactly the 72 seeded group fixtures.
  await prisma.match.deleteMany({
    where: {
      OR: [
        { stage: { not: "GROUP" } },
        { stage: "GROUP", NOT: { externalRef: { startsWith: "GRP-" } } },
      ],
    },
  });
}
