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

  // Replace a match's scraped goal events (manual events are left untouched).
  const writeEvents = async (matchId: string, goals: RawMatch["goals"]) => {
    await prisma.matchEvent.deleteMany({ where: { matchId, source: "SCRAPE" } });
    if (!goals) return;
    for (const g of goals) {
      const teamId = resolveId(g.teamName);
      if (!teamId) continue;
      await prisma.matchEvent.create({
        data: {
          matchId,
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
  };

  for (const rm of raw) {
    const homeTeamId = resolveId(rm.homeTeamName);
    const awayTeamId = resolveId(rm.awayTeamName);
    if (!homeTeamId || !awayTeamId) {
      skipped++;
      continue;
    }

    // Find the existing fixture: first by external ref, otherwise by the
    // UNORDERED team pair within the same stage (home/away may be swapped vs ours).
    let existing = await prisma.match.findFirst({
      where: { externalRef: rm.externalRef },
    });
    if (!existing) {
      existing = await prisma.match.findFirst({
        where: {
          stage: rm.stage,
          OR: [
            { homeTeamId, awayTeamId },
            { homeTeamId: awayTeamId, awayTeamId: homeTeamId },
          ],
        },
      });
    }

    if (existing?.adminLocked) {
      skipped++;
      continue;
    }

    const shootoutWinnerTeamId = rm.shootoutWinnerName
      ? resolveId(rm.shootoutWinnerName)
      : null;
    const played = rm.homeGoals != null && rm.awayGoals != null;
    // Map the scraped goals onto each team so we can orient them correctly.
    const goalsByTeam = new Map<string, number | null>([
      [homeTeamId, rm.homeGoals ?? null],
      [awayTeamId, rm.awayGoals ?? null],
    ]);

    if (!existing) {
      // Every group pairing is pre-seeded, so a group match should always be
      // found above; never create one (that's what caused duplicate fixtures).
      // Knockout fixtures aren't pre-seeded, so create those as the bracket forms.
      if (rm.stage === "GROUP") {
        skipped++;
        continue;
      }
      const newMatch = await prisma.match.create({
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
      created++;
      await writeEvents(newMatch.id, rm.goals);
      continue;
    }

    // Update in place, keeping our home/away orientation and orienting the score.
    await prisma.match.update({
      where: { id: existing.id },
      data: {
        status: rm.status,
        homeGoals: played ? (goalsByTeam.get(existing.homeTeamId) ?? null) : null,
        awayGoals: played ? (goalsByTeam.get(existing.awayTeamId) ?? null) : null,
        wentToExtraTime: rm.wentToExtraTime ?? false,
        shootoutWinnerTeamId,
        source: "SCRAPE",
      },
    });
    updated++;
    await writeEvents(existing.id, rm.goals);
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
