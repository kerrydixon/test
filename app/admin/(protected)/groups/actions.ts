"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function saveGroupOverride(formData: FormData) {
  await requireAdmin();
  const groupCode = String(formData.get("groupCode"));
  const firstTeamId = String(formData.get("first"));
  const secondTeamId = String(formData.get("second"));
  const thirdTeamId = String(formData.get("third"));
  if (new Set([firstTeamId, secondTeamId, thirdTeamId]).size !== 3) return;

  await prisma.groupStandingOverride.upsert({
    where: { groupCode },
    update: { firstTeamId, secondTeamId, thirdTeamId },
    create: { groupCode, firstTeamId, secondTeamId, thirdTeamId },
  });
  revalidatePath("/admin/groups");
  revalidatePath("/leaderboard");
}

export async function clearGroupOverride(formData: FormData) {
  await requireAdmin();
  const groupCode = String(formData.get("groupCode"));
  await prisma.groupStandingOverride
    .delete({ where: { groupCode } })
    .catch(() => {});
  revalidatePath("/admin/groups");
  revalidatePath("/leaderboard");
}
