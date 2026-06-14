import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  ESPN_CANDIDATES,
  fetchJson,
  parseEspnStats,
  shortUrl,
} from "@/lib/ingestion/providers/espn";
import { fetchFootballDataScorers } from "@/lib/ingestion/providers/football-data";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Read-only diagnostic for the player-stats (assists) source. No DB writes.
//   /api/admin/debug-stats        -> tries each candidate URL, shows status + parsed players
//   /api/admin/debug-stats?raw=1  -> raw JSON shape of the first working candidate
//   /api/admin/debug-stats?url=…  -> probe a specific URL
export async function GET(request: Request) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });

  const params = new URL(request.url).searchParams;

  // If a football-data.org key is configured, that's the source — probe it.
  const fdKey = (await prisma.setting.findUnique({ where: { key: "footballDataKey" } }))?.value?.trim();
  if (fdKey) {
    try {
      const { url, players } = await fetchFootballDataScorers(fdKey);
      const lines = [
        `source: football-data.org`,
        `url: ${url}`,
        `parsed players: ${players.length}`,
        "",
        ...[...players]
          .sort((a, b) => b.assists - a.assists)
          .slice(0, 40)
          .map((p) => `  ${p.name} — ${p.goals}G ${p.assists}A`),
      ];
      return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    } catch (e) {
      return new Response(`football-data error: ${e instanceof Error ? e.message : e}`, { status: 502 });
    }
  }

  const configured = (await prisma.setting.findUnique({ where: { key: "statsUrl" } }))?.value?.trim();
  const override = params.get("url") || undefined;
  const urls = override ? [override] : configured ? [configured, ...ESPN_CANDIDATES] : ESPN_CANDIDATES;

  const lines: string[] = [];
  let firstWorkingJson: unknown = null;

  for (const url of urls) {
    let r;
    try {
      r = await fetchJson(url);
    } catch (e) {
      lines.push(`${shortUrl(url)}  ->  ${e instanceof Error && e.name === "AbortError" ? "TIMEOUT" : "ERROR"}`);
      continue;
    }
    if (!r.ok) {
      lines.push(`${shortUrl(url)}  ->  HTTP ${r.status}`);
      continue;
    }
    let json: unknown;
    try {
      json = JSON.parse(r.text);
    } catch {
      lines.push(`${shortUrl(url)}  ->  200 but not JSON (${r.text.slice(0, 60)}…)`);
      continue;
    }
    const players = parseEspnStats(json);
    lines.push(`${shortUrl(url)}  ->  200, parsed ${players.length} players`);
    if (!firstWorkingJson) firstWorkingJson = json;
    if (players.length) {
      lines.push("");
      lines.push(`WORKING URL: ${url}`);
      lines.push("");
      for (const p of [...players].sort((a, b) => b.assists - a.assists).slice(0, 40)) {
        lines.push(`  ${p.name} — ${p.goals}G ${p.assists}A`);
      }
      break;
    }
  }

  if (params.get("raw") === "1") {
    const j = (firstWorkingJson ?? {}) as { categories?: unknown; athletes?: unknown[] };
    return new Response(
      JSON.stringify({ categories: j.categories, athletes: (j.athletes ?? []).slice(0, 2) }, null, 2),
      { headers: { "Content-Type": "application/json; charset=utf-8" } },
    );
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
