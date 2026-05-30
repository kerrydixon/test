"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  checkPassword,
  endAdminSession,
  requireAdmin,
  startAdminSession,
} from "@/lib/auth";
import { sync } from "@/lib/ingestion/sync";

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

export async function runSync() {
  await requireAdmin();
  await sync();
  revalidatePath("/admin");
  revalidatePath("/groups");
  revalidatePath("/fixtures");
  revalidatePath("/leaderboard");
}
