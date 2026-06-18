"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function num(v: FormDataEntryValue | null): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

/** Organiser edits a player's goals/assists — marks the row overridden so the
 *  automatic sync won't change it back. */
export async function saveScorerStat(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.scorerStat.update({
    where: { id },
    data: {
      country: (String(formData.get("country") ?? "").trim()) || null,
      goals: num(formData.get("goals")),
      assists: num(formData.get("assists")),
      overridden: true,
    },
  });
  revalidatePath("/admin/scorers");
  revalidatePath("/leaderboard");
}

/** Hand a player's stats back to the automatic source on the next sync. */
export async function resetScorerStat(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.scorerStat.update({ where: { id }, data: { overridden: false } });
  revalidatePath("/admin/scorers");
}
