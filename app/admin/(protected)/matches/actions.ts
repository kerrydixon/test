"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function num(v: FormDataEntryValue | null): number | null {
  if (v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function revalidateScoring(matchId?: string) {
  revalidatePath("/admin/matches");
  if (matchId) revalidatePath(`/admin/matches/${matchId}`);
  revalidatePath("/leaderboard");
  revalidatePath("/groups");
  revalidatePath("/fixtures");
}

export async function saveMatchResult(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const homeGoals = num(formData.get("homeGoals"));
  const awayGoals = num(formData.get("awayGoals"));
  const played = homeGoals !== null && awayGoals !== null;

  await prisma.match.update({
    where: { id },
    data: {
      homeGoals,
      awayGoals,
      status: played ? "FINISHED" : "SCHEDULED",
      wentToExtraTime: formData.get("wentToExtraTime") === "on",
      shootoutWinnerTeamId: (formData.get("shootoutWinnerTeamId") as string) || null,
      adminLocked: formData.get("adminLocked") === "on",
      source: "MANUAL",
    },
  });
  revalidateScoring(id);
}

export async function addGoal(formData: FormData) {
  await requireAdmin();
  const matchId = String(formData.get("matchId"));
  const teamId = String(formData.get("teamId"));
  const scorerName = String(formData.get("scorerName") ?? "").trim();
  if (!teamId || !scorerName) return;

  await prisma.matchEvent.create({
    data: {
      matchId,
      teamId,
      scorerName,
      assistName: (String(formData.get("assistName") ?? "").trim()) || null,
      minute: num(formData.get("minute")) ?? 0,
      isOwnGoal: formData.get("isOwnGoal") === "on",
      isExtraTime: formData.get("isExtraTime") === "on",
      isShootout: formData.get("isShootout") === "on",
      source: "MANUAL",
    },
  });
  revalidateScoring(matchId);
}

export async function deleteGoal(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const matchId = String(formData.get("matchId"));
  await prisma.matchEvent.delete({ where: { id } });
  revalidateScoring(matchId);
}

export async function createKnockoutMatch(formData: FormData) {
  await requireAdmin();
  const stage = String(formData.get("stage"));
  const homeTeamId = String(formData.get("homeTeamId"));
  const awayTeamId = String(formData.get("awayTeamId"));
  const kickoffRaw = String(formData.get("kickoff") ?? "");
  if (!homeTeamId || !awayTeamId || homeTeamId === awayTeamId) return;

  const created = await prisma.match.create({
    data: {
      stage: stage as "R32" | "R16" | "QF" | "SF" | "FINAL",
      homeTeamId,
      awayTeamId,
      kickoff: kickoffRaw ? new Date(kickoffRaw) : null,
      source: "MANUAL",
    },
  });
  revalidateScoring();
  redirect(`/admin/matches/${created.id}`);
}
