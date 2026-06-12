import { isAdmin } from "@/lib/auth";
import { configuredProvider } from "@/lib/ingestion/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Read-only diagnostic: fetches the configured results page(s) and shows exactly
// what the parser extracts for each played match — no database writes. Open
// /api/admin/debug-scrape (optionally ?team=Mexico) while signed in as admin.
export async function GET(request: Request) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });

  const filter = new URL(request.url).searchParams.get("team")?.toLowerCase();
  const provider = await configuredProvider();

  let raw;
  try {
    raw = await provider.fetchMatches();
  } catch (e) {
    return new Response(`fetch failed: ${e instanceof Error ? e.message : e}`, {
      status: 502,
    });
  }

  const lines: string[] = [];
  lines.push(`pages: ${provider.report ?? "?"}`);
  lines.push(`total boxes parsed: ${raw.length}`);
  lines.push("");

  const played = raw.filter((m) => m.homeGoals != null && m.awayGoals != null);
  for (const m of played) {
    if (
      filter &&
      !m.homeTeamName.toLowerCase().includes(filter) &&
      !m.awayTeamName.toLowerCase().includes(filter)
    ) {
      continue;
    }
    const goals = (m.goals ?? [])
      .map((g) => `${g.scorerName} ${g.minute}'${g.isOwnGoal ? " (og)" : ""} [${g.teamName}]`)
      .join(", ");
    lines.push(
      `${m.stage} | ${m.homeTeamName} ${m.homeGoals}-${m.awayGoals} ${m.awayTeamName}  ::  ${goals || "(no scorers)"}`,
    );
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
