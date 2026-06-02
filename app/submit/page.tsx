import Link from "next/link";
import { prisma } from "@/lib/db";
import { isSubmissionOpen } from "@/lib/data";
import EntryForm from "@/components/EntryForm";

export const dynamic = "force-dynamic";

export default async function SubmitPage() {
  const open = await isSubmissionOpen();
  const teams = await prisma.team.findMany({
    orderBy: [{ priceTier: "desc" }, { name: "asc" }],
    select: { id: true, name: true, groupCode: true, priceTier: true, flagEmoji: true },
  });

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold text-slate-900">Enter the competition</h1>
      <p className="mt-1 max-w-2xl text-slate-500">
        Build your fantasy squad, answer the tournament questions and predict the
        group placings. You can jump between steps — nothing is saved until you submit.
        New here?{" "}
        <Link href="/rules" className="font-medium text-emerald-600 hover:underline">
          Read how scoring works
        </Link>
        .
      </p>

      {open ? (
        <div className="mt-8">
          <EntryForm teams={teams} />
        </div>
      ) : (
        <div className="card mt-8 p-10 text-center">
          <p className="text-lg font-semibold text-slate-800">Submissions are closed</p>
          <p className="mt-1 text-slate-500">The deadline for entries has passed.</p>
          <Link href="/leaderboard" className="btn-primary mt-4">
            View the leaderboard
          </Link>
        </div>
      )}
    </div>
  );
}
