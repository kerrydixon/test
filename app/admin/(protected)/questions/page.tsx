import { Sparkles } from "lucide-react";
import { prisma } from "@/lib/db";
import { PART2_QUESTIONS } from "@/lib/part2-questions";
import { suggestAnswers, type SuggestionMatch } from "@/lib/scoring/suggestions";
import { saveOfficialAnswer } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminQuestions() {
  const [official, teams, matches] = await Promise.all([
    prisma.part2OfficialAnswer.findMany(),
    prisma.team.findMany(),
    prisma.match.findMany({ include: { events: true } }),
  ]);
  const byNo = new Map(official.map((o) => [o.questionNo, o.answers] as const));

  const suggestionMatches: SuggestionMatch[] = matches.map((m) => ({
    id: m.id,
    stage: m.stage,
    groupCode: m.groupCode,
    homeTeamId: m.homeTeamId,
    awayTeamId: m.awayTeamId,
    status: m.status,
    homeGoals: m.homeGoals,
    awayGoals: m.awayGoals,
    wentToExtraTime: m.wentToExtraTime,
    shootoutWinnerTeamId: m.shootoutWinnerTeamId,
    kickoff: m.kickoff,
    externalRef: m.externalRef,
    goals: m.events.map((e) => ({
      teamId: e.teamId,
      scorerName: e.scorerName,
      assistName: e.assistName,
      minute: e.minute,
      isOwnGoal: e.isOwnGoal,
      isExtraTime: e.isExtraTime,
      isShootout: e.isShootout,
    })),
  }));
  const suggestions = suggestAnswers(
    teams.map((t) => ({
      id: t.id,
      name: t.name,
      groupCode: t.groupCode,
      isHost: t.isHost,
      confederation: t.confederation,
    })),
    suggestionMatches,
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Part 2 official answers</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">
        Set the correct answer for each question (200 points each). Separate
        multiple acceptable answers with commas — questions 3, 7 and 11 allow ties.
        Where results allow it, a suggested answer is computed automatically — review
        it and click apply.
      </p>

      <div className="mt-6 space-y-4">
        {PART2_QUESTIONS.map((q) => {
          const current = byNo.get(q.no) ?? [];
          const suggestion = suggestions.get(q.no);
          return (
            <div key={q.no} className="card p-4">
              <p className="font-medium text-slate-800">
                <span className="text-slate-400">Q{q.no}.</span> {q.prompt}
                {q.allowsTies && <span className="ml-2 pill bg-sky-100 text-sky-700">ties allowed</span>}
              </p>
              {q.options && (
                <p className="mt-1 text-xs text-slate-400">
                  Values: {q.options.map((o) => o.value).join(", ")}
                </p>
              )}

              {suggestion && (
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-violet-50 p-3 text-sm">
                  <Sparkles className="h-4 w-4 shrink-0 text-violet-600" />
                  <span className="text-violet-900">
                    Suggested: <strong>{suggestion.answers.join(", ")}</strong>
                    {!suggestion.ready && (
                      <span className="ml-2 pill bg-amber-100 text-amber-700">provisional</span>
                    )}
                  </span>
                  <span className="basis-full text-xs text-violet-500">{suggestion.note}</span>
                  <form action={saveOfficialAnswer}>
                    <input type="hidden" name="questionNo" value={q.no} />
                    <input type="hidden" name="answers" value={suggestion.answers.join(", ")} />
                    <button className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700">
                      Apply suggestion
                    </button>
                  </form>
                </div>
              )}

              <form action={saveOfficialAnswer} className="mt-2 flex gap-2">
                <input type="hidden" name="questionNo" value={q.no} />
                <input
                  name="answers"
                  className="input"
                  defaultValue={current.join(", ")}
                  placeholder={q.options ? "e.g. France" : q.placeholder}
                />
                <button className="btn-primary">Save</button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
