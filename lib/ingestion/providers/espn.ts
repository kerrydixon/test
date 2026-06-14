// ESPN player-statistics provider.
//
// ESPN exposes a no-key public JSON API. The "byathlete" stats leaderboard returns
// each player's cumulative totals (goals, assists, …). We use it to award fantasy
// goal-scorers their assist points, which the match feed (Wikipedia) doesn't carry.
//
// The exact JSON shape varies, so parseEspnStats is deliberately tolerant: it reads
// athletes from either a flat `statistics` array or `categories`/`totals` aligned
// with the top-level category `names`, and pulls out goals/assists by key.

export interface RawPlayerStat {
  name: string;
  goals: number;
  assists: number;
}

export const DEFAULT_STATS_URL =
  "https://site.web.api.espn.com/apis/common/v3/sports/soccer/fifa.world/statistics/byathlete?sort=offensive.assists:desc&limit=300";

/* eslint-disable @typescript-eslint/no-explicit-any */

function collectStats(item: any, catDefs: Map<string, string[]>): Map<string, number> {
  const stats = new Map<string, number>();
  const put = (k: unknown, v: unknown) => {
    const key = typeof k === "string" ? k.toLowerCase() : "";
    const n = Number(v);
    if (key && Number.isFinite(n)) stats.set(key, n);
  };

  if (Array.isArray(item?.statistics)) {
    for (const s of item.statistics) put(s?.name ?? s?.abbreviation ?? s?.displayName, s?.value ?? s?.displayValue);
  }
  for (const c of item?.categories ?? []) {
    const names: string[] = (c?.names?.length ? c.names : catDefs.get(c?.name)) ?? [];
    const vals: unknown[] = c?.totals ?? c?.values ?? [];
    names.forEach((n, i) => put(n, vals[i]));
  }
  return stats;
}

function pick(stats: Map<string, number>, keys: string[]): number {
  for (const k of keys) {
    const v = stats.get(k);
    if (v != null) return v;
  }
  return 0;
}

export function parseEspnStats(json: any): RawPlayerStat[] {
  const catDefs = new Map<string, string[]>();
  for (const c of json?.categories ?? []) catDefs.set(c?.name, c?.names ?? c?.labels ?? []);

  const out: RawPlayerStat[] = [];
  for (const item of json?.athletes ?? []) {
    const ath = item?.athlete ?? item;
    const name: string | undefined = ath?.displayName ?? ath?.fullName ?? ath?.name;
    if (!name) continue;
    const stats = collectStats(item, catDefs);
    out.push({
      name,
      goals: pick(stats, ["goals", "totalgoals"]),
      assists: pick(stats, ["assists", "goalassists"]),
    });
  }
  return out;
}

export async function fetchEspnStats(
  url: string = DEFAULT_STATS_URL,
): Promise<{ raw: unknown; players: RawPlayerStat[] }> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`ESPN stats ${res.status}`);
  const raw = await res.json();
  return { raw, players: parseEspnStats(raw) };
}
