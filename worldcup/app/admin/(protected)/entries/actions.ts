"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function toggleLock(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const entrant = await prisma.entrant.findUnique({ where: { id } });
  if (!entrant) return;
  await prisma.entrant.update({ where: { id }, data: { locked: !entrant.locked } });
  revalidatePath("/admin/entries");
}

export async function deleteEntrant(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.entrant.delete({ where: { id } });
  revalidatePath("/admin/entries");
  revalidatePath("/leaderboard");
}
