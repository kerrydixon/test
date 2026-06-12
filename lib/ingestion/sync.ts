// Maps RawMatch[] from a provider onto our database, then logs the run.
//
// Safety rules:
//  - A match flagged adminLocked is never touched by the scraper.
//  - MANUAL goal events are preserved; only SCRAPE events are replaced.
//  - Unknown teams are skipped rather than guessed.
//
// All database work is batched into a few transactions/bulk calls so a full sync
// (dozens of matches) finishes in ~1-2s rather than hundreds of round-trips.

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { resolveTeamName } from "@/lib/teams";
import { wikipediaProvider } from "./providers/wikipedia";
import type { RawGoal, RawMatch, ResultsProvider } from "./types";

export interface SyncResult {
  ok: boolean;
  message: string;
  created: number;
  updated: number;
  skipped: number;
}

const pairKey = (stage: string, a: string, b: string) =>
  `${stage}|${[a, b].sort().join("-")}`;

/** Build the provider from the admin-configured "resultsUrls" setting, if any. */
async function configuredProvider(): Promise<ResultsProvider> {
  const row = await prisma.setting.findUnique({ where: { key: "resultsUrls" } });
  const urls = row?.value
    ? row.value.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;
  return wikipediaProvider(urls);
}

export async function sync(providerArg?: ResultsProvider): Promise<SyncResult> {
  const provider = providerArg ?? (await configuredProvider());
  let raw: RawMatch[] = [];
  try {
    raw = await provider.fetchMatches();
  } catch (e) {
    const result: SyncResult = {
      ok: false,
      message: `Fetch failed: ${e instanceof Error ? e.message : String(e)}`,
      created: 0,
      updated: 0,
      skipped: 0,
    };
    await logSync(result);
    return result;
  }

  // Preload everything once.
  const [teams, existingMatches] = await Promise.all([
    prisma.team.findMany(),
    prisma.match.findMany(),
  ]);
  const idByName = new Map(teams.map((t) => [t.name, t.id] as const));
  const resolveId = (name: string): string | null => {
    const canonical = resolveTeamName(name);
    return canonical ? (idByName.get(canonical) ?? null) : null;
  };
  const byRef = new Map(existingMatches.filter((m) => m.externalRef).map((m) => [m.externalRef!, m] as const));
  const byPair = new Map(existingMatches.map((m) => [pairKey(m.stage, m.homeTeamId, m.awayTeamId), m] as const));

  let skipped = 0;
  let skippedUnknownTeam = 0;
  let skippedLocked = 0;
  let skippedNoFixture = 0;
  const unresolved = new Set<string>();
  const updates: { id: string; data: Prisma.MatchUncheckedUpdateInput }[] = [];
  const creates: { data: Prisma.MatchUncheckedCreateInput }[] = [];
  // matchId (or create-index placeholder) -> goals to (re)write
  const eventWork: { ref: string | { createIndex: number }; goals: RawGoal[] }[] = [];

  for (const rm of raw) {
    const homeTeamId = resolveId(rm.homeTeamName);
    const awayTeamId = resolveId(rm.awayTeamName);
    if (!homeTeamId || !awayTeamId) {
      if (!homeTeamId) unresolved.add(rm.homeTeamName);
      if (!awayTeamId) unresolved.add(rm.awayTeamName);
      skippedUnknownTeam++;
      skipped++;
      continue;
    }

    const existing =
      byRef.get(rm.externalRef) ?? byPair.get(pairKey(rm.stage, homeTeamId, awayTeamId));

    if (existing?.adminLocked) {
      skippedLocked++;
      skipped++;
      continue;
    }

    const shootoutWinnerTeamId = rm.shootoutWinnerName ? resolveId(rm.shootoutWinnerName) : null;
    const played = rm.homeGoals != null && rm.awayGoals != null;
    const goalsByTeam = new Map<string, number | null>([
      [homeTeamId, rm.homeGoals ?? null],
      [awayTeamId, rm.awayGoals ?? null],
    ]);

    if (!existing) {
      // Group pairings are all pre-seeded, so never create one (avoids duplicate
      // fixtures). Knockout fixtures aren't pre-seeded, so create those.
      if (rm.stage === "GROUP") {
        skippedNoFixture++;
        skipped++;
        continue;
      }
      creates.push({
        data: {
          externalRef: rm.externalRef,
          stage: rm.stage,
          groupCode: rm.groupCode ?? null,
          homeTeamId,
          awayTeamId,
          status: rm.status,
          homeGoals: played ? (rm.homeGoals ?? null) : null,
          awayGoals: played ? (rm.awayGoals ?? null) : null,
          wentToExtraTime: rm.wentToExtraTime ?? false,
          shootoutWinnerTeamId,
          source: "SCRAPE",
        },
      });
      if (rm.goals) eventWork.push({ ref: { createIndex: creates.length - 1 }, goals: rm.goals });
      continue;
    }

    updates.push({
      id: existing.id,
      data: {
        status: rm.status,
        homeGoals: played ? (goalsByTeam.get(existing.homeTeamId) ?? null) : null,
        awayGoals: played ? (goalsByTeam.get(existing.awayTeamId) ?? null) : null,
        wentToExtraTime: rm.wentToExtraTime ?? false,
        shootoutWinnerTeamId,
        source: "SCRAPE",
      },
    });
    if (rm.goals) eventWork.push({ ref: existing.id, goals: rm.goals });
  }

  // Apply scalar changes in batches.
  if (updates.length) {
    await prisma.$transaction(
      updates.map((u) => prisma.match.update({ where: { id: u.id }, data: u.data })),
    );
  }
  const createdMatches = creates.length
    ? await prisma.$transaction(creates.map((c) => prisma.match.create({ data: c.data })))
    : [];

  // Resolve event work to concrete match ids.
  const affectedIds: string[] = [];
  const eventRows: {
    matchId: string;
    teamId: string;
    scorerName: string;
    assistName: string | null;
    minute: number;
    isOwnGoal: boolean;
    isExtraTime: boolean;
    isShootout: boolean;
    source: "SCRAPE";
  }[] = [];
  for (const w of eventWork) {
    const matchId = typeof w.ref === "string" ? w.ref : createdMatches[w.ref.createIndex]?.id;
    if (!matchId) continue;
    affectedIds.push(matchId);
    for (const g of w.goals) {
      const teamId = resolveId(g.teamName);
      if (!teamId) continue;
      eventRows.push({
        matchId,
        teamId,
        scorerName: g.scorerName,
        assistName: g.assistName ?? null,
        minute: g.minute,
        isOwnGoal: g.isOwnGoal,
        isExtraTime: g.isExtraTime,
        isShootout: g.isShootout,
        source: "SCRAPE",
      });
    }
  }
  // Replace scraped events for the affected matches (manual events untouched).
  if (affectedIds.length) {
    await prisma.matchEvent.deleteMany({ where: { matchId: { in: affectedIds }, source: "SCRAPE" } });
  }
  if (eventRows.length) {
    await prisma.matchEvent.createMany({ data: eventRows });
  }

  const reasons: string[] = [];
  if (skippedUnknownTeam) reasons.push(`${skippedUnknownTeam} unknown team`);
  if (skippedLocked) reasons.push(`${skippedLocked} locked`);
  if (skippedNoFixture) reasons.push(`${skippedNoFixture} no fixture`);
  let message = `Fetched ${raw.length} from ${provider.name}: updated ${updates.length}, created ${creates.length}, skipped ${skipped}`;
  if (reasons.length) message += ` (${reasons.join(", ")})`;
  if (unresolved.size) message += ` — names: ${[...unresolved].slice(0, 8).join(" | ")}`;
  if (provider.report) message += ` | pages: ${provider.report}`;

  const result: SyncResult = {
    ok: true,
    message,
    created: creates.length,
    updated: updates.length,
    skipped,
  };
  await logSync(result);
  return result;
}

async function logSync(r: SyncResult) {
  try {
    await prisma.syncLog.create({
      data: {
        ok: r.ok,
        message: r.message,
        created: r.created,
        updated: r.updated,
        skipped: r.skipped,
      },
    });
  } catch {
    // logging must never break a sync
  }
}
