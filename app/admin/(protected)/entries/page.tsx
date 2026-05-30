import Link from "next/link";
import { Lock, LockOpen, Trash2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { deleteEntrant, toggleLock } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminEntries() {
  const entrants = await prisma.entrant.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { scorers: true, groupPredictions: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Entries</h1>
      <p className="mt-1 text-sm text-slate-500">
        Review entries before kick-off. Lock an entry to mark it as checked.
      </p>

      <div className="card mt-6 overflow-hidden">
        {entrants.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No entries yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Submitted</th>
                <th className="px-4 py-2 text-center">Scorers</th>
                <th className="px-4 py-2 text-center">Status</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entrants.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-2">
                    <Link href={`/entrant/${e.id}`} className="font-medium text-slate-900 hover:text-emerald-600">{e.name}</Link>
                    {e.email && <span className="ml-2 text-xs text-slate-400">{e.email}</span>}
                  </td>
                  <td className="px-4 py-2 text-slate-500">{e.createdAt.toLocaleDateString("en-GB")}</td>
                  <td className="px-4 py-2 text-center text-slate-500">{e._count.scorers}</td>
                  <td className="px-4 py-2 text-center">
                    {e.locked
                      ? <span className="pill bg-amber-100 text-amber-700">locked</span>
                      : <span className="pill bg-slate-100 text-slate-500">open</span>}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-2">
                      <form action={toggleLock}>
                        <input type="hidden" name="id" value={e.id} />
                        <button className="text-slate-400 hover:text-amber-600" title={e.locked ? "Unlock" : "Lock"}>
                          {e.locked ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        </button>
                      </form>
                      <form action={deleteEntrant}>
                        <input type="hidden" name="id" value={e.id} />
                        <button className="text-slate-400 hover:text-rose-600" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
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
