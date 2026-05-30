import { prisma } from "@/lib/db";
import { getWorldState } from "@/lib/data";
import { computeGroupTable } from "@/lib/scoring";
import { GROUP_CODES, GROUPS } from "@/lib/teams";
import { clearGroupOverride, saveGroupOverride } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminGroups() {
  const [teams, world, overrides] = await Promise.all([
    prisma.team.findMany(),
    getWorldState(),
    prisma.groupStandingOverride.findMany(),
  ]);
  const teamById = new Map(teams.map((t) => [t.id, t] as const));
  const idByName = new Map(teams.map((t) => [t.name, t.id] as const));
  const overrideByGroup = new Map(overrides.map((o) => [o.groupCode, o] as const));

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Group standings</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">
        Part 3 is scored from the final top three of each group. These default to
        the auto-computed table; set an override here if tiebreakers (head-to-head,
        fair play, drawing of lots) decide things differently.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {GROUP_CODES.map((code) => {
          const computed = computeGroupTable(code, world.teams, world.matches);
          const override = overrideByGroup.get(code);
          const groupTeamIds = GROUPS[code].map((n) => idByName.get(n)!);
          const defaults = {
            first: override?.firstTeamId ?? computed[0]?.teamId ?? "",
            second: override?.secondTeamId ?? computed[1]?.teamId ?? "",
            third: override?.thirdTeamId ?? computed[2]?.teamId ?? "",
          };
          const slots: { key: "first" | "second" | "third"; label: string }[] = [
            { key: "first", label: "1st" },
            { key: "second", label: "2nd" },
            { key: "third", label: "3rd" },
          ];
          return (
            <div key={code} className="card p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Group {code}</h2>
                {override
                  ? <span className="pill bg-amber-100 text-amber-700">override set</span>
                  : <span className="pill bg-slate-100 text-slate-500">auto</span>}
              </div>
              <form action={saveGroupOverride} className="mt-3 space-y-2">
                <input type="hidden" name="groupCode" value={code} />
                {slots.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="w-8 text-sm font-semibold text-slate-400">{label}</span>
                    <select name={key} className="input" defaultValue={defaults[key]}>
                      <option value="">— select —</option>
                      {groupTeamIds.map((id) => {
                        const t = teamById.get(id);
                        return <option key={id} value={id}>{t?.flagEmoji} {t?.name}</option>;
                      })}
                    </select>
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <button className="btn-primary">Save override</button>
                  {override && (
                    <button formAction={clearGroupOverride} className="btn-secondary">Use auto</button>
                  )}
                </div>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
