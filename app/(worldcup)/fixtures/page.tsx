import { prisma } from "@/lib/db";

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

export default async function FixturesPage() {
  const matches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
    orderBy: [{ kickoff: "asc" }],
  });

  const byStage = new Map<string, typeof matches>();
  for (const m of matches) {
    const list = byStage.get(m.stage) ?? [];
    list.push(m);
    byStage.set(m.stage, list);
  }

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold text-slate-900">Fixtures &amp; results</h1>
      <p className="mt-1 text-slate-500">All matches, updated as results arrive.</p>

      <div className="mt-8 space-y-10">
        {STAGE_ORDER.filter((s) => byStage.has(s)).map((stage) => {
          const list = byStage.get(stage)!;
          // For the group stage, sub-group by group code.
          const groups = new Map<string, typeof matches>();
          for (const m of list) {
            const key = m.groupCode ?? "—";
            const g = groups.get(key) ?? [];
            g.push(m);
            groups.set(key, g);
          }
          return (
            <section key={stage}>
              <h2 className="mb-3 text-xl font-bold text-slate-900">
                {STAGE_LABELS[stage] ?? stage}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {[...groups.entries()].map(([groupCode, ms]) => (
                  <div key={groupCode} className="card overflow-hidden">
                    {stage === "GROUP" && (
                      <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                        Group {groupCode}
                      </div>
                    )}
                    <ul className="divide-y divide-slate-100">
                      {ms.map((m) => {
                        const played = m.status === "FINISHED" && m.homeGoals !== null;
                        return (
                          <li key={m.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                            <span className="flex-1 text-right font-medium text-slate-800">
                              {m.homeTeam.name} <span className="ml-1">{m.homeTeam.flagEmoji}</span>
                            </span>
                            <span className="mx-3 min-w-16 text-center">
                              {played ? (
                                <span className="rounded-md bg-slate-900 px-2 py-0.5 font-bold tabular-nums text-white">
                                  {m.homeGoals}–{m.awayGoals}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">
                                  {m.kickoff
                                    ? new Date(m.kickoff).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                                    : "TBC"}
                                </span>
                              )}
                            </span>
                            <span className="flex-1 font-medium text-slate-800">
                              <span className="mr-1">{m.awayTeam.flagEmoji}</span> {m.awayTeam.name}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
