import { prisma } from "@/lib/db";
import { getWorldState } from "@/lib/data";
import { computeGroupTable } from "@/lib/scoring";
import { GROUP_CODES } from "@/lib/teams";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const [teams, world] = await Promise.all([
    prisma.team.findMany(),
    getWorldState(),
  ]);
  const teamById = new Map(teams.map((t) => [t.id, t] as const));

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold text-slate-900">Group tables</h1>
      <p className="mt-1 text-slate-500">
        Standings update automatically from results. The top two in each group
        plus the best third-placed teams advance.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {GROUP_CODES.map((code) => {
          const table = computeGroupTable(code, world.teams, world.matches);
          return (
            <div key={code} className="card overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5 font-semibold text-slate-800">
                Group {code}
              </div>
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Team</th>
                    <th className="px-2 py-2 text-center font-medium">P</th>
                    <th className="px-2 py-2 text-center font-medium">GD</th>
                    <th className="px-2 py-2 text-center font-medium">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {table.map((row, i) => {
                    const team = teamById.get(row.teamId);
                    return (
                      <tr key={row.teamId} className={i < 2 ? "bg-emerald-50/50" : ""}>
                        <td className="px-3 py-2">
                          <span className="mr-1.5">{team?.flagEmoji}</span>
                          <span className="font-medium text-slate-800">{team?.name}</span>
                          {i === 2 && (
                            <span className="ml-1 text-[10px] text-amber-600">3rd</span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-center tabular-nums text-slate-500">{row.played}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-slate-500">
                          {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                        </td>
                        <td className="px-2 py-2 text-center font-bold tabular-nums text-slate-900">{row.points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
