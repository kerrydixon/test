"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  checkPassword,
  endAdminSession,
  requireAdmin,
  startAdminSession,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sync } from "@/lib/ingestion/sync";
import { simulateGroupStage, wipeAllData } from "@/lib/demo/simulate";

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) {
    redirect("/admin/login?error=1");
  }
  await startAdminSession();
  redirect("/admin");
}

export async function logout() {
  await endAdminSession();
  redirect("/admin/login");
}

function revalidateEverything() {
  revalidatePath("/admin");
  revalidatePath("/groups");
  revalidatePath("/fixtures");
  revalidatePath("/leaderboard");
}

export async function runSync() {
  await requireAdmin();
  const result = await sync();
  revalidateEverything();
  // Surface the outcome to the dashboard so it's obvious the button did something.
  redirect(`/admin?sync=${encodeURIComponent(result.message)}&ok=${result.ok ? 1 : 0}`);
}

export async function setResultsUrls(formData: FormData) {
  await requireAdmin();
  const value = String(formData.get("urls") ?? "").trim();
  await prisma.setting.upsert({
    where: { key: "resultsUrls" },
    update: { value },
    create: { key: "resultsUrls", value },
  });
  redirect(
    `/admin?sync=${encodeURIComponent(
      value ? "Saved results source — click Refresh to test it." : "Cleared — using default pages.",
    )}&ok=1`,
  );
}

export async function simulateGroupStageAction() {
  await requireAdmin();
  await simulateGroupStage();
  revalidateEverything();
  revalidatePath("/admin/entries");
}

export async function wipeAllDataAction() {
  await requireAdmin();
  await wipeAllData();
  revalidateEverything();
  revalidatePath("/admin/entries");
}
