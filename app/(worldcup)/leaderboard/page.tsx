import Link from "next/link";
import { getLeaderboard } from "@/lib/data";

export const dynamic = "force-dynamic";

function rankStyle(i: number) {
  if (i === 0) return "bg-amber-50 ring-1 ring-amber-200";
  if (i === 1) return "bg-slate-50 ring-1 ring-slate-200";
  if (i === 2) return "bg-orange-50 ring-1 ring-orange-200";
  return "";
}

export default async function LeaderboardPage() {
  const board = await getLeaderboard();

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold text-slate-900">Leaderboard</h1>
      <p className="mt-1 text-slate-500">
        Live standings, recalculated as results come in.
      </p>

      {board.length === 0 ? (
        <div className="card mt-8 p-10 text-center text-slate-500">
          No entries yet.{" "}
          <Link href="/submit" className="font-semibold text-emerald-600">
            Be the first to enter →
          </Link>
        </div>
      ) : (
        <div className="card mt-8 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Entrant</th>
                <th className="px-4 py-3 text-right">Squad</th>
                <th className="px-4 py-3 text-right">Questions</th>
                <th className="px-4 py-3 text-right">Groups</th>
                <th className="px-4 py-3 text-right">Knockouts</th>
                <th className="px-4 py-3 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {board.map((e, i) => (
                <tr key={e.entrantId} className={rankStyle(i)}>
                  <td className="px-4 py-3 font-semibold text-slate-500">{i + 1}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/entrant/${e.entrantId}`}
                      className="font-semibold text-slate-900 hover:text-emerald-600"
                    >
                      {e.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{e.part1.total}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{e.part2.total}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{e.part3.total}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{e.part4.total}</td>
                  <td className="px-4 py-3 text-right text-base font-bold tabular-nums text-slate-900">
                    {e.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
