"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isSubmissionOpen } from "@/lib/data";
import { validateFantasy } from "@/lib/fantasy-budget";
import { GROUP_CODES } from "@/lib/teams";

const triple = z.object({
  first: z.string().min(1),
  second: z.string().min(1),
  third: z.string().min(1),
});

const payloadSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(60),
  email: z.string().trim().email().optional().or(z.literal("")),
  teamIds: z.array(z.string()).length(2, "Pick exactly two teams"),
  scorerNames: z.array(z.string().trim().min(1)).min(5, "Name at least five scorers"),
  part2: z.record(z.string(), z.string()),
  groups: z.record(z.string(), triple),
});

export type SubmitState = { ok: boolean; error?: string };

export async function submitEntry(
  payload: unknown,
): Promise<SubmitState> {
  if (!(await isSubmissionOpen())) {
    return { ok: false, error: "Submissions are closed." };
  }

  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid entry" };
  }
  const data = parsed.data;

  // Two distinct teams.
  if (new Set(data.teamIds).size !== 2) {
    return { ok: false, error: "Your two teams must be different." };
  }

  // Validate the budget against real prices.
  const teams = await prisma.team.findMany({
    where: { id: { in: data.teamIds } },
  });
  if (teams.length !== 2) {
    return { ok: false, error: "Selected teams not found." };
  }
  const scorerNames = data.scorerNames.map((s) => s.trim()).filter(Boolean);
  const budget = validateFantasy({
    teamPrices: teams.map((t) => t.priceTier),
    scorerNames,
  });
  if (!budget.valid) {
    return { ok: false, error: budget.errors[0] };
  }

  // Every group must have three distinct, valid teams.
  for (const code of GROUP_CODES) {
    const g = data.groups[code];
    if (!g) return { ok: false, error: `Complete your Group ${code} prediction.` };
    const picks = [g.first, g.second, g.third];
    if (new Set(picks).size !== 3) {
      return { ok: false, error: `Group ${code} picks must be three different teams.` };
    }
  }

  // Persist everything in one transaction.
  let entrantId = "";
  try {
    const entrant = await prisma.$transaction(async (tx) => {
      const e = await tx.entrant.create({
        data: {
          name: data.name,
          email: data.email || null,
          teams: { create: data.teamIds.map((teamId) => ({ teamId })) },
          scorers: { create: scorerNames.map((playerName) => ({ playerName })) },
          part2Answers: {
            create: Object.entries(data.part2)
              .filter(([, answer]) => answer && answer.trim())
              .map(([questionNo, answer]) => ({
                questionNo: Number(questionNo),
                answer: answer.trim(),
              })),
          },
          groupPredictions: {
            create: GROUP_CODES.map((code) => ({
              groupCode: code,
              firstTeamId: data.groups[code].first,
              secondTeamId: data.groups[code].second,
              thirdTeamId: data.groups[code].third,
            })),
          },
        },
      });
      return e;
    });
    entrantId = entrant.id;
  } catch {
    return { ok: false, error: "Could not save your entry. Please try again." };
  }

  redirect(`/entrant/${entrantId}?submitted=1`);
}
