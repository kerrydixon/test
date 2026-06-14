// football-data.org player-stats provider (reliable assists source).
//
// The v4 "scorers" endpoint returns top scorers with goals AND assists. The World
// Cup (competition code "WC") is in the free tier. Auth is a single header,
// X-Auth-Token, with a free API key the organiser pastes into the admin settings.

import type { RawPlayerStat } from "./espn";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function parseFootballDataScorers(json: any): RawPlayerStat[] {
  return (json?.scorers ?? [])
    .map((s: any) => ({
      name: s?.player?.name ?? s?.player?.shortName ?? "",
      goals: Number(s?.goals ?? 0) || 0,
      assists: Number(s?.assists ?? 0) || 0,
    }))
    .filter((p: RawPlayerStat) => p.name);
}

export async function fetchFootballDataScorers(
  apiKey: string,
  code = "WC",
  limit = 100,
): Promise<{ url: string; players: RawPlayerStat[] }> {
  const url = `https://api.football-data.org/v4/competitions/${code}/scorers?limit=${limit}`;
  const res = await fetch(url, {
    headers: { "X-Auth-Token": apiKey, Accept: "application/json" },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`football-data ${res.status}${body ? ` (${body.slice(0, 80)})` : ""}`);
  }
  return { url, players: parseFootballDataScorers(await res.json()) };
}
