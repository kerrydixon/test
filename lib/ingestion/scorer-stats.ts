// Keeps the ScorerStat table (one row per goal-scorer an entrant actually picked)
// in sync with the player-stats source. Goals/assists auto-fill from the best
// name match in PlayerStat, EXCEPT for rows the organiser has overridden.

import type { PrismaClient } from "@prisma/client";
import { normaliseName, playerMatches } from "@/lib/scoring/names";

interface FdPlayer {
  name: string;
  country: string | null;
  goals: number;
  assists: number;
}

const tokens = (s: string) => new Set(normaliseName(s).split(" ").filter(Boolean));
const isSubset = (a: Set<string>, b: Set<string>) => [...a].every((t) => b.has(t));

/** Best PlayerStat match for a picked name: prefer the pick being a short form of a
 *  full name, then the most productive player, then the most specific name. */
export function bestMatch(pick: string, players: FdPlayer[]): FdPlayer | null {
  const pickTokens = tokens(pick);
  const candidates = players.filter((p) => playerMatches(pick, p.name));
  if (!candidates.length) return null;
  candidates.sort((a, b) => {
    const aSub = isSubset(pickTokens, tokens(a.name)) ? 1 : 0;
    const bSub = isSubset(pickTokens, tokens(b.name)) ? 1 : 0;
    if (aSub !== bSub) return bSub - aSub;
    const ag = a.goals + a.assists;
    const bg = b.goals + b.assists;
    if (ag !== bg) return bg - ag;
    return tokens(a.name).size - tokens(b.name).size;
  });
  return candidates[0];
}

export async function refreshScorerStats(prisma: PrismaClient): Promise<void> {
  const entrants = await prisma.entrant.findMany({ include: { scorers: true } });
  // distinct picked names -> display form
  const picks = new Map<string, string>();
  for (const e of entrants) {
    for (const s of e.scorers) {
      const id = normaliseName(s.playerName);
      if (id && !picks.has(id)) picks.set(id, s.playerName.trim());
    }
  }

  const fd: FdPlayer[] = (await prisma.playerStat.findMany()).map((p) => ({
    name: p.name,
    country: p.country,
    goals: p.goals,
    assists: p.assists,
  }));
  const existing = new Map((await prisma.scorerStat.findMany()).map((r) => [r.id, r] as const));

  const ops = [];
  for (const [id, display] of picks) {
    const ex = existing.get(id);
    if (ex?.overridden) continue; // never auto-overwrite an organiser edit
    const m = bestMatch(display, fd);
    const data = {
      name: display,
      country: m?.country ?? ex?.country ?? null,
      goals: m?.goals ?? 0,
      assists: m?.assists ?? 0,
    };
    ops.push(
      prisma.scorerStat.upsert({ where: { id }, update: data, create: { id, ...data } }),
    );
  }
  if (ops.length) await prisma.$transaction(ops);

  // Remove rows for players no longer picked by anyone.
  const validIds = [...picks.keys()];
  await prisma.scorerStat.deleteMany({
    where: { id: { notIn: validIds.length ? validIds : ["__none__"] } },
  });
}
