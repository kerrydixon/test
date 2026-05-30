import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { prisma } from "@/lib/db";
import { runSync } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [entrants, matchesPlayed, matchesTotal, logs] = await Promise.all([
    prisma.entrant.count(),
    prisma.match.count({ where: { status: "FINISHED" } }),
    prisma.match.count(),
    prisma.syncLog.findMany({ orderBy: { ranAt: "desc" }, take: 5 }),
  ]);

  const stats = [
    { label: "Entrants", value: entrants, href: "/admin/entries" },
    { label: "Matches played", value: `${matchesPlayed} / ${matchesTotal}`, href: "/admin/matches" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Organiser dashboard</h1>
        <form action={runSync}>
          <button className="btn-primary">
            <RefreshCw className="h-4 w-4" /> Refresh results now
          </button>
        </form>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card p-5 transition hover:shadow-md">
            <div className="text-sm text-slate-500">{s.label}</div>
            <div className="mt-1 text-3xl font-extrabold text-slate-900">{s.value}</div>
          </Link>
        ))}
      </div>

      <h2 className="mt-8 mb-2 font-semibold text-slate-900">Recent result syncs</h2>
      <div className="card overflow-hidden">
        {logs.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">
            No syncs yet. Use “Refresh results now”, or wait for the scheduled cron.
            The scraper pulls public results; locked matches and manual edits are preserved.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">When</th>
                <th className="px-4 py-2">Result</th>
                <th className="px-4 py-2 text-right">+ / ~ / skip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-2 text-slate-500">{l.ranAt.toLocaleString("en-GB")}</td>
                  <td className="px-4 py-2">
                    <span className={l.ok ? "text-emerald-600" : "text-rose-600"}>{l.message}</span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-500">
                    {l.created} / {l.updated} / {l.skipped}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
