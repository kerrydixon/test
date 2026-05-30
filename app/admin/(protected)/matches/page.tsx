import Link from "next/link";
import { prisma } from "@/lib/db";
import { createKnockoutMatch } from "./actions";

export const dynamic = "force-dynamic";

const STAGE_LABELS: Record<string, string> = {
  GROUP: "Group stage",
  R32: "Round of 32",
  R16: "Round of 16",
  QF: "Quarter-finals",
  SF: "Semi-finals",
  FINAL: "Final",
};
const STAGE_ORDER = ["GROUP", "R32", "R16", "QF", "SF", "FINAL"];

export default async function AdminMatches() {
  const [matches, teams] = await Promise.all([
    prisma.match.findMany({ include: { homeTeam: true, awayTeam: true }, orderBy: { externalRef: "asc" } }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
  ]);

  const byStage = new Map<string, typeof matches>();
  for (const m of matches) {
    const l = byStage.get(m.stage) ?? [];
    l.push(m);
    byStage.set(m.stage, l);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Matches</h1>
      <p className="mt-1 text-sm text-slate-500">
        Click a match to enter the score and goals. Lock a match to protect your
        edits from the automatic scraper.
      </p>

      <div className="mt-6 space-y-8">
        {STAGE_ORDER.filter((s) => byStage.has(s)).map((stage) => (
          <section key={stage}>
            <h2 className="mb-2 font-semibold text-slate-800">{STAGE_LABELS[stage]}</h2>
            <div className="card divide-y divide-slate-100">
              {byStage.get(stage)!.map((m) => {
                const played = m.status === "FINISHED" && m.homeGoals !== null;
                return (
                  <Link
                    key={m.id}
                    href={`/admin/matches/${m.id}`}
                    className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50"
                  >
                    <span className="text-slate-700">
                      {m.groupCode && <span className="mr-2 text-xs text-slate-400">{m.groupCode}</span>}
                      {m.homeTeam.flagEmoji} {m.homeTeam.name} v {m.awayTeam.name} {m.awayTeam.flagEmoji}
                    </span>
                    <span className="flex items-center gap-2">
                      {m.adminLocked && <span className="pill bg-amber-100 text-amber-700">locked</span>}
                      {played ? (
                        <span className="font-bold tabular-nums text-slate-900">{m.homeGoals}–{m.awayGoals}</span>
                      ) : (
                        <span className="text-xs text-slate-400">not played</span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Add a knockout fixture as the bracket forms */}
      <section className="card mt-10 p-5">
        <h2 className="font-semibold text-slate-900">Add a knockout match</h2>
        <form action={createKnockoutMatch} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select name="stage" className="input" defaultValue="R32">
            {["R32", "R16", "QF", "SF", "FINAL"].map((s) => (
              <option key={s} value={s}>{STAGE_LABELS[s]}</option>
            ))}
          </select>
          <select name="homeTeamId" className="input" required defaultValue="">
            <option value="" disabled>Home team…</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select name="awayTeamId" className="input" required defaultValue="">
            <option value="" disabled>Away team…</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input name="kickoff" type="datetime-local" className="input" />
          <button className="btn-primary sm:col-span-2 lg:col-span-1">Create match</button>
        </form>
      </section>
    </div>
  );
}
