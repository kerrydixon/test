// Pulls cumulative player goals/assists from the stats source and stores them in
// PlayerStat, keyed by normalised name so they can be matched to fantasy picks.
//
// Source: football-data.org if an API key is configured (reliable, has assists),
// otherwise ESPN's public stats API (no key, but flaky for the World Cup).

import { prisma } from "@/lib/db";
import { normaliseName } from "@/lib/scoring/names";
import { fetchEspnStats, type RawPlayerStat } from "./providers/espn";
import { fetchFootballDataScorers } from "./providers/football-data";
import { refreshScorerStats } from "./scorer-stats";

export interface StatsSyncResult {
  ok: boolean;
  message: string;
  players: number;
}

async function setting(key: string): Promise<string | undefined> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value?.trim() || undefined;
}

async function loadStats(): Promise<{ players: RawPlayerStat[]; source: string }> {
  const key = await setting("footballDataKey");
  if (key) {
    const { players } = await fetchFootballDataScorers(key);
    return { players, source: "football-data" };
  }
  const { players } = await fetchEspnStats(await setting("statsUrl"));
  return { players, source: "espn" };
}

export async function syncPlayerStats(): Promise<StatsSyncResult> {
  let loaded;
  try {
    loaded = await loadStats();
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
  const byId = new Map<string, { name: string; goals: number; assists: number; country: string | null }>();
  for (const p of loaded.players) {
    const id = normaliseName(p.name);
    if (!id) continue;
    byId.set(id, { name: p.name, goals: p.goals, assists: p.assists, country: p.country ?? null });
  }

  await prisma.$transaction(
    [...byId.entries()].map(([id, p]) =>
      prisma.playerStat.upsert({
        where: { id },
        update: { name: p.name, goals: p.goals, assists: p.assists, country: p.country, source: loaded.source },
        create: { id, name: p.name, goals: p.goals, assists: p.assists, country: p.country, source: loaded.source },
      }),
    ),
  );

  // Refresh the curated, organiser-editable per-selected-player table.
  await refreshScorerStats(prisma);

  const withAssists = [...byId.values()].filter((p) => p.assists > 0).length;
  const result = {
    ok: true,
    message: `Stats (${loaded.source}): ${byId.size} players, ${withAssists} with assists`,
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
