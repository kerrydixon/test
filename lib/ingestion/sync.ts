// Maps RawMatch[] from a provider onto our database, then logs the run.
//
// Safety rules:
//  - A match flagged adminLocked is never touched by the scraper.
//  - MANUAL goal events are preserved; only SCRAPE events are replaced.
//  - Unknown teams are skipped rather than guessed.

import { prisma } from "@/lib/db";
import { resolveTeamName } from "@/lib/teams";
import { wikipediaProvider } from "./providers/wikipedia";
import type { RawMatch, ResultsProvider } from "./types";

export interface SyncResult {
  ok: boolean;
  message: string;
  created: number;
  updated: number;
  skipped: number;
}

export async function sync(
  provider: ResultsProvider = wikipediaProvider(),
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let raw: RawMatch[] = [];

  try {
    raw = await provider.fetchMatches();
  } catch (e) {
    const result: SyncResult = {
      ok: false,
      message: `Fetch failed: ${e instanceof Error ? e.message : String(e)}`,
      created,
      updated,
      skipped,
    };
    await logSync(result);
    return result;
  }

  const teams = await prisma.team.findMany();
  const idByName = new Map(teams.map((t) => [t.name, t.id] as const));
  const resolveId = (name: string): string | null => {
    const canonical = resolveTeamName(name);
    return canonical ? (idByName.get(canonical) ?? null) : null;
  };

  for (const rm of raw) {
    const homeTeamId = resolveId(rm.homeTeamName);
    const awayTeamId = resolveId(rm.awayTeamName);
    if (!homeTeamId || !awayTeamId) {
      skipped++;
      continue;
    }

    const existing = await prisma.match.findFirst({
      where: {
        OR: [
          { externalRef: rm.externalRef },
          { stage: rm.stage, homeTeamId, awayTeamId },
        ],
      },
    });

    if (existing?.adminLocked) {
      skipped++;
      continue;
    }

    const shootoutWinnerTeamId = rm.shootoutWinnerName
      ? resolveId(rm.shootoutWinnerName)
      : null;

    const scalarData = {
      externalRef: rm.externalRef,
      stage: rm.stage,
      groupCode: rm.groupCode ?? null,
      homeTeamId,
      awayTeamId,
      status: rm.status,
      homeGoals: rm.homeGoals ?? null,
      awayGoals: rm.awayGoals ?? null,
      wentToExtraTime: rm.wentToExtraTime ?? false,
      shootoutWinnerTeamId,
      source: "SCRAPE" as const,
    };

    const match = existing
      ? await prisma.match.update({ where: { id: existing.id }, data: scalarData })
      : await prisma.match.create({ data: scalarData });
    if (existing) updated++;
    else created++;

    // Replace scraped goal events; keep any manually-entered ones.
    if (rm.goals) {
      await prisma.matchEvent.deleteMany({
        where: { matchId: match.id, source: "SCRAPE" },
      });
      for (const g of rm.goals) {
        const teamId = resolveId(g.teamName);
        if (!teamId) continue;
        await prisma.matchEvent.create({
          data: {
            matchId: match.id,
            teamId,
            scorerName: g.scorerName,
            assistName: g.assistName ?? null,
            minute: g.minute,
            isOwnGoal: g.isOwnGoal,
            isExtraTime: g.isExtraTime,
            isShootout: g.isShootout,
            source: "SCRAPE",
          },
        });
      }
    }
  }

  const result: SyncResult = {
    ok: true,
    message: `Synced ${raw.length} matches from ${provider.name}`,
    created,
    updated,
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
