"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function saveOfficialAnswer(formData: FormData) {
  await requireAdmin();
  const questionNo = Number(formData.get("questionNo"));
  const raw = String(formData.get("answers") ?? "");
  // Accept comma- or newline-separated acceptable answers (ties allow several).
  const answers = raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  await prisma.part2OfficialAnswer.upsert({
    where: { questionNo },
    update: { answers },
    create: { questionNo, answers },
  });
  revalidatePath("/admin/questions");
  revalidatePath("/leaderboard");
}
