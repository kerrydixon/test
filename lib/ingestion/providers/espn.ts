// ESPN player-statistics provider.
//
// ESPN exposes a no-key public JSON API. The "byathlete" stats leaderboard returns
// each player's cumulative totals (goals, assists, …). We use it to award fantasy
// goal-scorers their assist points, which the match feed (Wikipedia) doesn't carry.
//
// The exact JSON shape and the working query params vary, so we (a) try a list of
// candidate URLs with a timeout, and (b) parse tolerantly: athletes from either a
// flat `statistics` array or `categories`/`totals` aligned with top-level `names`.

export interface RawPlayerStat {
  name: string;
  goals: number;
  assists: number;
  country?: string;
}

const BASE = "https://site.web.api.espn.com/apis/common/v3/sports/soccer/fifa.world/statistics/byathlete";
const Q = "region=us&lang=en&contentorigin=espn&limit=100";

// Tried in order until one returns players. fifa.world returns 200 but empty without
// a season, so season variants are tried first.
export const ESPN_CANDIDATES = [
  `${BASE}?season=2026&seasontype=1&${Q}`,
  `${BASE}?season=2026&${Q}`,
  `${BASE}?season=2026&seasontype=3&${Q}`,
  `${BASE}?season=2026&seasontype=2&${Q}`,
  `${BASE}?${Q}`,
];

export const DEFAULT_STATS_URL = ESPN_CANDIDATES[0];

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export function shortUrl(url: string): string {
  const q = url.split("?")[1] ?? "";
  return q ? `…?${q.slice(0, 40)}` : url.slice(-40);
}

export async function fetchJson(
  url: string,
  ms = 8000,
): Promise<{ ok: boolean; status: number; text: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: ctrl.signal,
    });
    return { ok: res.ok, status: res.status, text: res.ok ? await res.text() : "" };
  } finally {
    clearTimeout(timer);
  }
}

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

export interface EspnResult {
  url: string;
  players: RawPlayerStat[];
  tried: string[];
}

/** Try the configured URL, else each candidate, until one returns players. */
export async function fetchEspnStats(configuredUrl?: string): Promise<EspnResult> {
  const urls = configuredUrl ? [configuredUrl] : ESPN_CANDIDATES;
  const tried: string[] = [];
  for (const url of urls) {
    try {
      const r = await fetchJson(url);
      tried.push(`${shortUrl(url)}=${r.status}`);
      if (!r.ok) continue;
      const players = parseEspnStats(JSON.parse(r.text));
      if (players.length) return { url, players, tried };
    } catch (e) {
      tried.push(`${shortUrl(url)}=${e instanceof Error && e.name === "AbortError" ? "timeout" : "err"}`);
    }
  }
  throw new Error(tried.join("; ") || "no candidates");
}
