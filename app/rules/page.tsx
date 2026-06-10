import Link from "next/link";
import { ListChecks, Medal, Target, Users } from "lucide-react";
import { ALL_TEAMS } from "@/lib/teams";
import { MIN_SCORERS, SCORER_PRICE, TOTAL_BUDGET } from "@/lib/fantasy-budget";
import { PART1_POINTS } from "@/lib/scoring/part1";
import { PART2_POINTS_PER_QUESTION } from "@/lib/scoring/part2";
import { PART3_MATRIX, PART3_MAX_PER_GROUP } from "@/lib/scoring/part3";
import { PART4_POINTS_PER_MATCH } from "@/lib/scoring/part4";
import { PART2_QUESTIONS } from "@/lib/part2-questions";

export const metadata = { title: "Rules & Scoring — World Cup 2026 Fantasy" };

function bn(millions: number) {
  return `£${(millions / 1000).toFixed(1)}bn`;
}

// Build the price tiers from the team data so this page stays in sync.
const namedTiers = [...new Set(ALL_TEAMS.map((t) => t.priceTier))]
  .filter((tier) => tier > 1800)
  .sort((a, b) => b - a)
  .map((tier) => ({
    tier,
    names: ALL_TEAMS.filter((t) => t.priceTier === tier).map((t) => t.name),
  }));

// Order the Part 3 matrix high → low for display.
const matrixRows = Object.entries(PART3_MATRIX).sort((a, b) => b[1] - a[1]);

function Section({
  icon: Icon,
  no,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  no: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{no}</div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        </div>
      </div>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

function Points({ value, label }: { value: number; label: string }) {
  const positive = value >= 0;
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center">
      <div className={`text-lg font-extrabold ${positive ? "text-emerald-600" : "text-rose-600"}`}>
        {positive ? "+" : ""}
        {value}
      </div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

export default function RulesPage() {
  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold text-slate-900">Rules &amp; Scoring</h1>
      <p className="mt-1 max-w-2xl text-slate-500">
        Four parts, eight scoring sections. Here&apos;s exactly how every point is earned.
        The three highest totals at the end of the tournament win the prizes (60% / 30% /
        10% of the entry fees).
      </p>

      <div className="mt-8 grid gap-6">
        {/* PART 1 */}
        <Section icon={Users} no="Part 1" title="Fantasy squad">
          <p>
            You have a budget of <strong>{bn(TOTAL_BUDGET)}</strong>, which must be spent in
            full. Buy <strong>two different teams</strong> and{" "}
            <strong>at least {MIN_SCORERS} different goal-scorers</strong>. Each extra
            goal-scorer costs <strong>{bn(SCORER_PRICE)}</strong>, and any surplus must be
            spent on more scorers.
          </p>

          <div>
            <h3 className="mb-2 font-semibold text-slate-700">Team prices</h3>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {namedTiers.map(({ tier, names }) => (
                    <tr key={tier}>
                      <td className="w-24 bg-slate-50 px-3 py-2 font-bold text-slate-800">{bn(tier)}</td>
                      <td className="px-3 py-2 text-slate-600">{names.join(", ")}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="w-24 bg-slate-50 px-3 py-2 font-bold text-slate-800">{bn(1800)}</td>
                    <td className="px-3 py-2 text-slate-600">Every other nation in the tournament</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Because the budget must be spent exactly, two {bn(2500)} teams isn&apos;t
              possible — it would leave room for fewer than {MIN_SCORERS} scorers.
            </p>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-slate-700">Your teams score</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Points value={PART1_POINTS.win} label="Win" />
              <Points value={PART1_POINTS.draw} label="Draw" />
              <Points value={PART1_POINTS.loss} label="Defeat" />
              <Points value={PART1_POINTS.goalScored} label="Goal scored" />
              <Points value={PART1_POINTS.goalConceded} label="Goal conceded" />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              The result is taken at the end of the game (after extra time and any penalty
              shoot-out). Own goals in a team&apos;s favour count as goals scored; own goals
              against count as conceded.
            </p>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-slate-700">Your goal-scorers score</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Points value={PART1_POINTS.scorerGoal} label="Each goal" />
              <Points value={PART1_POINTS.assist} label="Each assist" />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Goals scored in extra time count; penalty shoot-out goals do not. A scorer&apos;s
              own goal scores nothing.
            </p>
          </div>
        </Section>

        {/* PART 2 */}
        <Section icon={Target} no="Part 2" title="Tournament questions">
          <p>
            Twelve specific predictions about the tournament, each worth{" "}
            <strong>{PART2_POINTS_PER_QUESTION} points</strong>. Where a question can end in
            a tie (e.g. top scorer or highest-scoring group), every correct answer scores.
          </p>
          <ol className="list-decimal space-y-1 pl-5 text-slate-600">
            {PART2_QUESTIONS.map((q) => (
              <li key={q.no}>
                {q.prompt}
                {q.allowsTies && <span className="ml-2 pill bg-sky-100 text-sky-700">ties score</span>}
              </li>
            ))}
          </ol>
        </Section>

        {/* PART 3 */}
        <Section icon={ListChecks} no="Part 3" title="Group placings">
          <p>
            Predict which teams finish <strong>1st, 2nd and 3rd</strong> — in the correct
            order — in each of the twelve groups. Each group is scored on how close your
            order is to the final table, up to <strong>{PART3_MAX_PER_GROUP} points</strong>{" "}
            per group ({PART3_MAX_PER_GROUP * 12} in total).
          </p>
          <div className="rounded-xl bg-slate-50 p-4 text-slate-600">
            <p className="font-semibold text-slate-700">How the accuracy code works</p>
            <p className="mt-1">
              Take the actual 1st, 2nd and 3rd-placed teams. For each, write the position{" "}
              <em>you</em> predicted for that team (<strong>1</strong>, <strong>2</strong> or{" "}
              <strong>3</strong>), or <strong>X</strong> if you didn&apos;t place them in your
              top three. That three-character code maps to the points below.
            </p>
            <p className="mt-2">
              <span className="font-semibold text-slate-700">Example:</span> you predict
              Croatia, England, Panama (1-2-3) and the group finishes England, Croatia, Ghana.
              England (actual 1st) was your 2nd → <code>2</code>; Croatia (actual 2nd) was your
              1st → <code>1</code>; Ghana (actual 3rd) wasn&apos;t in your three → <code>X</code>.
              Code <code className="font-bold">21X</code> = <strong>85 points</strong>.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-slate-700">Full scoring matrix</h3>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {matrixRows.map(([code, pts]) => (
                <div key={code} className="rounded-lg border border-slate-200 p-2 text-center">
                  <div className="font-mono text-sm font-bold text-slate-800">{code}</div>
                  <div className="text-xs text-emerald-600">{pts}</div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Any combination not shown (two or more teams outside your top three) scores 0.
            </p>
          </div>
        </Section>

        {/* PART 4 */}
        <Section icon={Medal} no="Part 4" title="Knockout winners">
          <p>
            Once the group stage is done, predict the winner of every knockout match — round
            of 32, round of 16, quarter-finals, semi-finals and the final. Each correct
            winner is worth <strong>{PART4_POINTS_PER_MATCH} points</strong>. The winner is
            whoever progresses (after extra time and penalties). Deadlines for each round open
            as the bracket is confirmed.
          </p>
        </Section>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/submit" className="btn-primary">Enter the competition</Link>
        <Link href="/leaderboard" className="btn-secondary">View the leaderboard</Link>
      </div>
    </div>
  );
}
