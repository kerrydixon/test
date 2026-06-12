import Link from "next/link";
import { CheckCircle2, Download, FlaskConical, RefreshCw, Trash2, XCircle } from "lucide-react";
import { prisma } from "@/lib/db";
import { runSync, simulateGroupStageAction, wipeAllDataAction } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";

export const dynamic = "force-dynamic";
// Simulation/wipe touch many rows; give the action room beyond the default.
export const maxDuration = 60;

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ sync?: string; ok?: string }>;
}) {
  const { sync: syncMsg, ok } = await searchParams;
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
        <div className="flex flex-wrap gap-3">
          <a href="/api/export" className="btn-secondary">
            <Download className="h-4 w-4" /> Excel snapshot
          </a>
          <a href="/api/export?calc=1" className="btn-secondary">
            <Download className="h-4 w-4" /> Excel calculator
          </a>
          <form action={runSync}>
            <SubmitButton pendingText="Refreshing…">
              <RefreshCw className="h-4 w-4" /> Refresh results now
            </SubmitButton>
          </form>
        </div>
      </div>

      {syncMsg && (
        <div
          className={`mt-4 flex items-start gap-2 rounded-xl border p-3 text-sm ${
            ok === "1"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {ok === "1" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span><strong>Last refresh:</strong> {syncMsg}</span>
        </div>
      )}

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

      {/* Testing tools */}
      <div className="card mt-8 border-dashed p-5">
        <div className="flex items-center gap-2 text-slate-900">
          <FlaskConical className="h-4 w-4 text-violet-600" />
          <h2 className="font-semibold">Testing tools</h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Simulate a full group stage (random results + 8 sample “Demo …” entrants) to
          check scoring, then wipe everything back to the seeded state.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <form action={simulateGroupStageAction}>
            <button className="btn-secondary">
              <FlaskConical className="h-4 w-4" /> Simulate full group stage
            </button>
          </form>
          <form action={wipeAllDataAction}>
            <button className="btn-danger">
              <Trash2 className="h-4 w-4" /> Wipe ALL data
            </button>
          </form>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          “Wipe ALL data” deletes unlocked entrants and clears all results/answers —
          leaving the 48 teams, 72 group fixtures and any <strong>locked</strong> entries
          (verified real submissions are locked and survive the wipe). There is no undo.
        </p>
      </div>
    </div>
  );
}
