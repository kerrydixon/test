import { prisma } from "@/lib/db";
import { PART2_QUESTIONS } from "@/lib/part2-questions";
import { saveOfficialAnswer } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminQuestions() {
  const official = await prisma.part2OfficialAnswer.findMany();
  const byNo = new Map(official.map((o) => [o.questionNo, o.answers] as const));

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Part 2 official answers</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">
        Set the correct answer for each question (200 points each). Separate
        multiple acceptable answers with commas — questions 3, 7 and 11 allow ties.
        Use the exact option value shown in brackets for multiple-choice questions.
      </p>

      <div className="mt-6 space-y-4">
        {PART2_QUESTIONS.map((q) => {
          const current = byNo.get(q.no) ?? [];
          return (
            <form action={saveOfficialAnswer} key={q.no} className="card p-4">
              <input type="hidden" name="questionNo" value={q.no} />
              <p className="font-medium text-slate-800">
                <span className="text-slate-400">Q{q.no}.</span> {q.prompt}
                {q.allowsTies && <span className="ml-2 pill bg-sky-100 text-sky-700">ties allowed</span>}
              </p>
              {q.options && (
                <p className="mt-1 text-xs text-slate-400">
                  Values: {q.options.map((o) => o.value).join(", ")}
                </p>
              )}
              <div className="mt-2 flex gap-2">
                <input
                  name="answers"
                  className="input"
                  defaultValue={current.join(", ")}
                  placeholder={q.options ? "e.g. France" : q.placeholder}
                />
                <button className="btn-primary">Save</button>
              </div>
            </form>
          );
        })}
      </div>
    </div>
  );
}
