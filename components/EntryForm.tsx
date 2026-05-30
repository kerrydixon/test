"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { submitEntry } from "@/app/(worldcup)/submit/actions";
import { validateFantasy, TOTAL_BUDGET } from "@/lib/fantasy-budget";
import { PART2_QUESTIONS } from "@/lib/part2-questions";

export interface FormTeam {
  id: string;
  name: string;
  groupCode: string;
  priceTier: number;
  flagEmoji: string;
}

type Triple = { first: string; second: string; third: string };

const STEPS = ["Your squad", "Questions", "Group placings", "Review"];

function money(m: number) {
  return `£${(m / 1000).toFixed(1)}bn`;
}

export default function EntryForm({ teams }: { teams: FormTeam[] }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [teamIds, setTeamIds] = useState<string[]>([]);
  const [scorers, setScorers] = useState<string[]>(["", "", "", "", ""]);
  const [part2, setPart2] = useState<Record<number, string>>({});
  const [groups, setGroups] = useState<Record<string, Triple>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const priceById = useMemo(
    () => new Map(teams.map((t) => [t.id, t.priceTier] as const)),
    [teams],
  );
  const tiers = useMemo(() => {
    const set = [...new Set(teams.map((t) => t.priceTier))].sort((a, b) => b - a);
    return set.map((tier) => ({ tier, teams: teams.filter((t) => t.priceTier === tier) }));
  }, [teams]);
  const grouped = useMemo(() => {
    const codes = [...new Set(teams.map((t) => t.groupCode))].sort();
    return codes.map((code) => ({ code, teams: teams.filter((t) => t.groupCode === code) }));
  }, [teams]);

  const filledScorers = scorers.map((s) => s.trim()).filter(Boolean);
  const budget = validateFantasy({
    teamPrices: teamIds.map((id) => priceById.get(id) ?? 0),
    scorerNames: filledScorers,
  });

  function toggleTeam(id: string) {
    setTeamIds((cur) =>
      cur.includes(id) ? cur.filter((t) => t !== id) : cur.length < 2 ? [...cur, id] : cur,
    );
  }

  function setGroupPick(code: string, slot: keyof Triple, teamId: string) {
    setGroups((cur) => ({
      ...cur,
      [code]: { ...(cur[code] ?? { first: "", second: "", third: "" }), [slot]: teamId },
    }));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await submitEntry({
        name,
        email,
        teamIds,
        scorerNames: filledScorers,
        part2: Object.fromEntries(Object.entries(part2).map(([k, v]) => [k, v])),
        groups,
      });
      if (res && !res.ok) setError(res.error ?? "Something went wrong");
    });
  }

  const spentPct = Math.min(100, (budget.spent / TOTAL_BUDGET) * 100);

  return (
    <div>
      {/* Stepper */}
      <ol className="mb-8 flex flex-wrap gap-2 text-sm">
        {STEPS.map((label, i) => (
          <li key={label}>
            <button
              onClick={() => setStep(i)}
              className={`rounded-full px-3 py-1.5 font-medium transition ${
                i === step ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {i + 1}. {label}
            </button>
          </li>
        ))}
      </ol>

      {/* Step 1: squad */}
      {step === 0 && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Your name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sam Taylor" />
            </div>
            <div>
              <label className="label">Email (optional)</label>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
          </div>

          {/* Budget bar */}
          <div className="card sticky top-20 z-10 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-700">
                Spent {money(budget.spent)} / {money(TOTAL_BUDGET)}
              </span>
              <span className={budget.valid ? "text-emerald-600" : "text-slate-500"}>
                {budget.remaining === 0
                  ? "Budget fully spent ✓"
                  : budget.remaining > 0
                    ? `${money(budget.remaining)} left`
                    : `${money(-budget.remaining)} over`}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full ${budget.valid ? "bg-emerald-500" : "bg-amber-400"}`}
                style={{ width: `${spentPct}%` }}
              />
            </div>
            {budget.errors.length > 0 && (
              <p className="mt-2 text-xs text-amber-600">{budget.errors[0]}</p>
            )}
          </div>

          {/* Teams (pick 2) */}
          <div>
            <h3 className="font-semibold text-slate-900">Pick 2 teams</h3>
            <div className="mt-3 space-y-4">
              {tiers.map(({ tier, teams: tt }) => (
                <div key={tier}>
                  <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">{money(tier)}</div>
                  <div className="flex flex-wrap gap-2">
                    {tt.map((t) => {
                      const selected = teamIds.includes(t.id);
                      const disabled = !selected && teamIds.length >= 2;
                      return (
                        <button
                          key={t.id}
                          onClick={() => toggleTeam(t.id)}
                          disabled={disabled}
                          className={`rounded-xl border px-3 py-2 text-sm transition ${
                            selected
                              ? "border-emerald-500 bg-emerald-50 font-semibold text-emerald-700"
                              : disabled
                                ? "border-slate-200 text-slate-300"
                                : "border-slate-200 text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          {t.flagEmoji} {t.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scorers */}
          <div>
            <h3 className="font-semibold text-slate-900">
              Goal-scorers <span className="text-sm font-normal text-slate-400">(£0.1bn each, at least 5)</span>
            </h3>
            <div className="mt-3 space-y-2">
              {scorers.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="input"
                    placeholder={`Scorer ${i + 1} — e.g. Kylian Mbappé`}
                    value={s}
                    onChange={(e) =>
                      setScorers((cur) => cur.map((x, j) => (j === i ? e.target.value : x)))
                    }
                  />
                  {scorers.length > 5 && (
                    <button
                      onClick={() => setScorers((cur) => cur.filter((_, j) => j !== i))}
                      className="btn-secondary px-3"
                      aria-label="Remove scorer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => setScorers((cur) => [...cur, ""])} className="btn-secondary">
                <Plus className="h-4 w-4" /> Add scorer
              </button>
              {budget.requiredScorers !== null && (
                <p className="text-xs text-slate-400">
                  These teams need exactly {budget.requiredScorers} scorers to spend the full budget.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: questions */}
      {step === 1 && (
        <div className="space-y-5">
          {PART2_QUESTIONS.map((q) => (
            <div key={q.no} className="card p-4">
              <p className="font-medium text-slate-800">
                <span className="text-slate-400">Q{q.no}.</span> {q.prompt}
              </p>
              {q.options ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {q.options.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setPart2((cur) => ({ ...cur, [q.no]: o.value }))}
                      className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                        part2[q.no] === o.value
                          ? "border-emerald-500 bg-emerald-50 font-semibold text-emerald-700"
                          : "border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  className="input mt-3"
                  placeholder={q.placeholder}
                  value={part2[q.no] ?? ""}
                  onChange={(e) => setPart2((cur) => ({ ...cur, [q.no]: e.target.value }))}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Step 3: group placings */}
      {step === 2 && (
        <div className="grid gap-4 md:grid-cols-2">
          {grouped.map(({ code, teams: gt }) => {
            const pick = groups[code] ?? { first: "", second: "", third: "" };
            const slots: { key: keyof Triple; label: string }[] = [
              { key: "first", label: "1st" },
              { key: "second", label: "2nd" },
              { key: "third", label: "3rd" },
            ];
            return (
              <div key={code} className="card p-4">
                <h3 className="mb-2 font-semibold text-slate-900">Group {code}</h3>
                <div className="space-y-2">
                  {slots.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="w-8 text-sm font-semibold text-slate-400">{label}</span>
                      <select
                        className="input"
                        value={pick[key]}
                        onChange={(e) => setGroupPick(code, key, e.target.value)}
                      >
                        <option value="">— select —</option>
                        {gt.map((t) => (
                          <option
                            key={t.id}
                            value={t.id}
                            disabled={Object.values(pick).includes(t.id) && pick[key] !== t.id}
                          >
                            {t.flagEmoji} {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Step 4: review */}
      {step === 3 && (
        <div className="card p-6">
          <h3 className="text-lg font-bold text-slate-900">Review &amp; submit</h3>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Name</dt><dd className="font-medium">{name || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Teams</dt><dd className="font-medium">{teamIds.length}/2</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Scorers</dt><dd className="font-medium">{filledScorers.length}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Budget</dt><dd className={budget.valid ? "font-medium text-emerald-600" : "font-medium text-amber-600"}>{budget.valid ? "Valid ✓" : budget.errors[0]}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Questions answered</dt><dd className="font-medium">{Object.values(part2).filter(Boolean).length}/12</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Groups predicted</dt><dd className="font-medium">{grouped.filter(({ code }) => { const g = groups[code]; return g && g.first && g.second && g.third; }).length}/12</dd></div>
          </dl>
          {error && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          <button onClick={submit} disabled={pending} className="btn-primary mt-5 w-full">
            {pending ? "Submitting…" : "Submit my entry"}
          </button>
        </div>
      )}

      {/* Nav */}
      <div className="mt-8 flex justify-between">
        <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="btn-secondary">
          Back
        </button>
        {step < STEPS.length - 1 && (
          <button onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))} className="btn-primary">
            Next
          </button>
        )}
      </div>
    </div>
  );
}
