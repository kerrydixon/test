import Link from "next/link";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { addGoal, deleteGoal, saveMatchResult } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditMatch({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = await prisma.match.findUnique({
    where: { id },
    include: { homeTeam: true, awayTeam: true, events: { orderBy: { minute: "asc" } } },
  });
  if (!match) notFound();

  const teamOptions = [match.homeTeam, match.awayTeam];

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/matches" className="text-sm text-slate-500 hover:text-slate-700">← All matches</Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">
        {match.homeTeam.flagEmoji} {match.homeTeam.name} v {match.awayTeam.name} {match.awayTeam.flagEmoji}
      </h1>
      <p className="text-sm text-slate-500">
        {match.stage}{match.groupCode ? ` · Group ${match.groupCode}` : ""}
      </p>

      {/* Result */}
      <form action={saveMatchResult} className="card mt-6 space-y-4 p-5">
        <input type="hidden" name="id" value={match.id} />
        <h2 className="font-semibold text-slate-900">Result</h2>
        <div className="flex items-end gap-3">
          <div>
            <label className="label">{match.homeTeam.name}</label>
            <input name="homeGoals" type="number" min={0} className="input w-20" defaultValue={match.homeGoals ?? ""} />
          </div>
          <span className="pb-2 text-slate-400">–</span>
          <div>
            <label className="label">{match.awayTeam.name}</label>
            <input name="awayGoals" type="number" min={0} className="input w-20" defaultValue={match.awayGoals ?? ""} />
          </div>
        </div>
        <div>
          <label className="label">Penalty shoot-out winner (knockouts, if drawn)</label>
          <select name="shootoutWinnerTeamId" className="input" defaultValue={match.shootoutWinnerTeamId ?? ""}>
            <option value="">— none —</option>
            {teamOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-5 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="wentToExtraTime" defaultChecked={match.wentToExtraTime} /> Went to extra time
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="adminLocked" defaultChecked={match.adminLocked} /> Lock (ignore scraper)
          </label>
        </div>
        <button className="btn-primary">Save result</button>
      </form>

      {/* Goals */}
      <div className="card mt-6 p-5">
        <h2 className="font-semibold text-slate-900">Goals &amp; assists</h2>
        <p className="text-xs text-slate-400">
          Used for fantasy scorer/assist points and goals for/against. Shoot-out goals don’t count.
        </p>
        <ul className="mt-3 divide-y divide-slate-100">
          {match.events.length === 0 && <li className="py-2 text-sm text-slate-400">No goals recorded.</li>}
          {match.events.map((e) => {
            const team = teamOptions.find((t) => t.id === e.teamId);
            return (
              <li key={e.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-700">
                  {e.minute}&apos; {e.scorerName}
                  {e.isOwnGoal && <span className="ml-1 text-rose-500">(o.g.)</span>}
                  {e.isExtraTime && <span className="ml-1 text-slate-400">ET</span>}
                  {e.isShootout && <span className="ml-1 text-slate-400">pen-shootout</span>}
                  {e.assistName && <span className="ml-1 text-slate-400">· assist {e.assistName}</span>}
                  <span className="ml-2 text-xs text-slate-400">({team?.name})</span>
                </span>
                <form action={deleteGoal}>
                  <input type="hidden" name="id" value={e.id} />
                  <input type="hidden" name="matchId" value={match.id} />
                  <button className="text-slate-400 hover:text-rose-600" aria-label="Delete goal">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </li>
            );
          })}
        </ul>

        <form action={addGoal} className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <input type="hidden" name="matchId" value={match.id} />
          <div>
            <label className="label">Credited team</label>
            <select name="teamId" className="input" required defaultValue="">
              <option value="" disabled>Select team…</option>
              {teamOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Minute</label>
            <input name="minute" type="number" min={0} className="input" defaultValue={0} />
          </div>
          <div>
            <label className="label">Scorer</label>
            <input name="scorerName" className="input" required placeholder="Player name" />
          </div>
          <div>
            <label className="label">Assist (optional)</label>
            <input name="assistName" className="input" placeholder="Player name" />
          </div>
          <div className="flex flex-wrap gap-4 text-sm sm:col-span-2">
            <label className="flex items-center gap-2"><input type="checkbox" name="isOwnGoal" /> Own goal</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="isExtraTime" /> Extra time</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="isShootout" /> Shoot-out</label>
          </div>
          <button className="btn-secondary sm:col-span-2">Add goal</button>
        </form>
      </div>
    </div>
  );
}
