import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, X } from "lucide-react";
import { prisma } from "@/lib/db";
import { getEntrantScore } from "@/lib/data";
import { PART2_QUESTIONS } from "@/lib/part2-questions";

export const dynamic = "force-dynamic";

export default async function EntrantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [score, entrant, teams] = await Promise.all([
    getEntrantScore(id),
    prisma.entrant.findUnique({
      where: { id },
      include: {
        part2Answers: true,
        groupPredictions: { orderBy: { groupCode: "asc" } },
      },
    }),
    prisma.team.findMany(),
  ]);
  if (!score || !entrant) notFound();

  const teamName = new Map(teams.map((t) => [t.id, `${t.flagEmoji} ${t.name}`] as const));
  const answers = new Map(entrant.part2Answers.map((a) => [a.questionNo, a.answer] as const));

  return (
    <div className="container-page py-10">
      <Link href="/leaderboard" className="text-sm text-slate-500 hover:text-slate-700">
        ← Back to leaderboard
      </Link>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-900">{entrant.name}</h1>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-slate-400">Total points</div>
          <div className="text-4xl font-extrabold text-emerald-600">{score.total.toLocaleString()}</div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Part 1 */}
        <section className="card p-5">
          <h2 className="font-bold text-slate-900">
            Fantasy squad <span className="text-slate-400">· {score.part1.total} pts</span>
          </h2>
          <table className="mt-3 w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {score.part1.perTeam.map((t) => (
                <tr key={t.teamId}>
                  <td className="py-2 font-medium text-slate-800">{teamName.get(t.teamId) ?? t.teamId}</td>
                  <td className="py-2 text-right text-slate-400">
                    {t.goalsFor}–{t.goalsAgainst}
                  </td>
                  <td className="py-2 text-right font-semibold tabular-nums text-slate-900">{t.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Goal-scorers</h3>
          <table className="mt-1 w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400">
                <th className="py-1 text-left font-medium">Player</th>
                <th className="py-1 text-center font-medium">Goals<span className="text-slate-300"> ×150</span></th>
                <th className="py-1 text-center font-medium">Assists<span className="text-slate-300"> ×75</span></th>
                <th className="py-1 text-right font-medium">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {score.part1.perScorer.map((s) => (
                <tr key={s.name} className={s.points > 0 ? "" : "text-slate-400"}>
                  <td className="py-2 text-slate-800">{s.name}</td>
                  <td className="py-2 text-center tabular-nums">{s.goals}</td>
                  <td className="py-2 text-center tabular-nums">{s.assists}</td>
                  <td className="py-2 text-right font-semibold tabular-nums text-slate-900">{s.points}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 text-xs font-semibold text-slate-500">
                <td className="py-2">Total</td>
                <td className="py-2 text-center tabular-nums">
                  {score.part1.perScorer.reduce((s, p) => s + p.goals, 0)}
                </td>
                <td className="py-2 text-center tabular-nums">
                  {score.part1.perScorer.reduce((s, p) => s + p.assists, 0)}
                </td>
                <td className="py-2 text-right tabular-nums text-slate-900">{score.part1.scorerPoints}</td>
              </tr>
            </tfoot>
          </table>
        </section>

        {/* Part 2 */}
        <section className="card p-5">
          <h2 className="font-bold text-slate-900">
            Tournament questions <span className="text-slate-400">· {score.part2.total} pts</span>
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {score.part2.perQuestion.map((q) => {
              const prompt = PART2_QUESTIONS.find((x) => x.no === q.questionNo)?.prompt ?? `Q${q.questionNo}`;
              return (
                <li key={q.questionNo} className="flex items-start gap-2">
                  <span className={`mt-0.5 ${q.correct ? "text-emerald-600" : "text-slate-300"}`}>
                    {q.correct ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </span>
                  <span className="flex-1 text-slate-600">
                    <span className="font-medium text-slate-500">Q{q.questionNo}.</span>{" "}
                    {answers.get(q.questionNo) ?? <span className="italic text-slate-300">no answer</span>}
                    <span className="block text-xs text-slate-400">{prompt}</span>
                  </span>
                  <span className="tabular-nums text-slate-400">{q.points}</span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Part 3 */}
        <section className="card p-5">
          <h2 className="font-bold text-slate-900">
            Group placings <span className="text-slate-400">· {score.part3.total} pts</span>
          </h2>
          {entrant.groupPredictions.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">No group predictions submitted.</p>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              {entrant.groupPredictions.map((p) => {
                const scored = score.part3.groups.find((g) => g.groupCode === p.groupCode);
                return (
                  <div key={p.groupCode} className="rounded-lg bg-slate-50 p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Group {p.groupCode}</span>
                      {scored ? (
                        <span className="text-xs">
                          <span className="font-mono text-slate-400">{scored.code}</span>{" "}
                          <span className="font-bold tabular-nums text-emerald-600">{scored.points}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">pending</span>
                      )}
                    </div>
                    <ol className="mt-1 space-y-0.5 text-slate-600">
                      <li>1. {teamName.get(p.firstTeamId) ?? "?"}</li>
                      <li>2. {teamName.get(p.secondTeamId) ?? "?"}</li>
                      <li>3. {teamName.get(p.thirdTeamId) ?? "?"}</li>
                    </ol>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Part 4 */}
        <section className="card p-5">
          <h2 className="font-bold text-slate-900">
            Knockout winners <span className="text-slate-400">· {score.part4.total} pts</span>
          </h2>
          {score.part4.perMatch.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">Opens after the group stage.</p>
          ) : (
            <ul className="mt-3 space-y-1 text-sm">
              {score.part4.perMatch.map((m) => (
                <li key={m.matchId} className="flex justify-between">
                  <span className="text-slate-700">{teamName.get(m.predictedTeamId) ?? m.predictedTeamId}</span>
                  <span className={m.correct ? "font-semibold text-emerald-600" : "text-slate-400"}>{m.points}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
