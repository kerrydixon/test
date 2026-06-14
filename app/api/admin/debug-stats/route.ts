import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DEFAULT_STATS_URL, fetchEspnStats, parseEspnStats } from "@/lib/ingestion/providers/espn";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Read-only diagnostic for the player-stats (assists) source. No DB writes.
//   /api/admin/debug-stats          -> parsed players with goals/assists
//   /api/admin/debug-stats?raw=1    -> a slice of the raw JSON (to see its shape)
//   /api/admin/debug-stats?team=... -> filter by player name
export async function GET(request: Request) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });

  const params = new URL(request.url).searchParams;
  const setting = await prisma.setting.findUnique({ where: { key: "statsUrl" } });
  const url = setting?.value?.trim() || DEFAULT_STATS_URL;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "application/json",
      },
    });
  } catch (e) {
    return new Response(`fetch error: ${e instanceof Error ? e.message : e}\nurl: ${url}`, { status: 502 });
  }
  if (!res.ok) {
    return new Response(`HTTP ${res.status} from ${url}`, { status: 502 });
  }

  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return new Response(`Not JSON (first 1500 chars):\n\n${text.slice(0, 1500)}`, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  if (params.get("raw") === "1") {
    // Trim to the first athlete + category defs so the shape is visible but small.
    const j = json as { categories?: unknown; athletes?: unknown[] };
    const sample = {
      categories: j.categories,
      athletes: (j.athletes ?? []).slice(0, 2),
    };
    return new Response(JSON.stringify(sample, null, 2), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  const filter = params.get("team")?.toLowerCase();
  const players = parseEspnStats(json)
    .filter((p) => !filter || p.name.toLowerCase().includes(filter))
    .sort((a, b) => b.assists - a.assists);
  const lines = [
    `url: ${url}`,
    `parsed players: ${players.length}`,
    "",
    ...players.slice(0, 60).map((p) => `${p.name}  —  ${p.goals}G ${p.assists}A`),
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
