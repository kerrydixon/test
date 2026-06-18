import { prisma } from "@/lib/db";
import { normaliseName } from "@/lib/scoring/names";
import { SubmitButton } from "@/components/SubmitButton";
import { resetScorerStat, saveScorerStat } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminScorers() {
  const [rows, entrants] = await Promise.all([
    prisma.scorerStat.findMany(),
    prisma.entrant.findMany({ include: { scorers: true } }),
  ]);

  // How many entrants picked each player (by normalised name).
  const pickCount = new Map<string, number>();
  for (const e of entrants) {
    for (const s of e.scorers) {
      const id = normaliseName(s.playerName);
      pickCount.set(id, (pickCount.get(id) ?? 0) + 1);
    }
  }

  const sorted = [...rows].sort(
    (a, b) => b.goals + b.assists - (a.goals + a.assists) || a.name.localeCompare(b.name),
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Goal-scorers (goals &amp; assists)</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">
        Every player picked by an entrant. Goals and assists auto-fill from the stats source
        and feed fantasy scoring (×150 / ×75). Edit a row to override it — overridden rows
        are kept on each sync; use <strong>Auto</strong> to hand a row back to the feed.
        Run a sync from the dashboard&apos;s <strong>Refresh results now</strong> to update.
      </p>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Player</th>
              <th className="px-3 py-2">Country</th>
              <th className="px-3 py-2 text-center">Picks</th>
              <th className="px-3 py-2 text-center">Goals</th>
              <th className="px-3 py-2 text-center">Assists</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((r) => (
              <tr key={r.id} className={r.overridden ? "bg-amber-50/60" : ""}>
                <td className="px-3 py-2 font-medium text-slate-800">
                  {r.name}
                  {r.overridden && (
                    <span className="ml-2 pill bg-amber-100 text-amber-700">edited</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <form action={saveScorerStat} className="flex items-center gap-2" id={`f-${r.id}`}>
                    <input type="hidden" name="id" value={r.id} />
                    <input name="country" defaultValue={r.country ?? ""} className="input w-32 py-1" />
                  </form>
                </td>
                <td className="px-3 py-2 text-center text-slate-500">{pickCount.get(r.id) ?? 0}</td>
                <td className="px-3 py-2 text-center">
                  <input form={`f-${r.id}`} name="goals" type="number" min={0} defaultValue={r.goals} className="input w-16 py-1 text-center" />
                </td>
                <td className="px-3 py-2 text-center">
                  <input form={`f-${r.id}`} name="assists" type="number" min={0} defaultValue={r.assists} className="input w-16 py-1 text-center" />
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-2">
                    <button form={`f-${r.id}`} className="btn-secondary px-3 py-1 text-xs">Save</button>
                    {r.overridden && (
                      <form action={resetScorerStat}>
                        <input type="hidden" name="id" value={r.id} />
                        <SubmitButton className="text-xs font-medium text-slate-500 hover:text-emerald-600" pendingText="…">
                          Auto
                        </SubmitButton>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                  No player stats yet — set a stats source on the dashboard and click Refresh.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
