// Pulls cumulative player goals/assists from the stats source and stores them in
// PlayerStat, keyed by normalised name so they can be matched to fantasy picks.

import { prisma } from "@/lib/db";
import { normaliseName } from "@/lib/scoring/names";
import { fetchEspnStats } from "./providers/espn";

export interface StatsSyncResult {
  ok: boolean;
  message: string;
  players: number;
}

async function statsUrl(): Promise<string | undefined> {
  const row = await prisma.setting.findUnique({ where: { key: "statsUrl" } });
  return row?.value?.trim() || undefined;
}

export async function syncPlayerStats(): Promise<StatsSyncResult> {
  let players;
  try {
    players = (await fetchEspnStats(await statsUrl())).players;
  } catch (e) {
    const result = {
      ok: false,
      message: `Stats fetch failed: ${e instanceof Error ? e.message : String(e)}`,
      players: 0,
    };
    await logStats(result);
    return result;
  }

  // Keep one row per normalised name (the source may list a player twice).
  const byId = new Map<string, { name: string; goals: number; assists: number }>();
  for (const p of players) {
    const id = normaliseName(p.name);
    if (!id) continue;
    byId.set(id, { name: p.name, goals: p.goals, assists: p.assists });
  }

  await prisma.$transaction(
    [...byId.entries()].map(([id, p]) =>
      prisma.playerStat.upsert({
        where: { id },
        update: { name: p.name, goals: p.goals, assists: p.assists, source: "espn" },
        create: { id, name: p.name, goals: p.goals, assists: p.assists, source: "espn" },
      }),
    ),
  );

  const withAssists = [...byId.values()].filter((p) => p.assists > 0).length;
  const result = {
    ok: true,
    message: `Stats: ${byId.size} players (${withAssists} with assists)`,
    players: byId.size,
  };
  await logStats(result);
  return result;
}

async function logStats(r: StatsSyncResult) {
  try {
    await prisma.syncLog.create({
      data: { ok: r.ok, message: r.message, created: 0, updated: r.players, skipped: 0 },
    });
  } catch {
    // logging must never break a sync
  }
}
