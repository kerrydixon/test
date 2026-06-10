// Imports entrant submissions from data/entries/*.json into the database.
//
// Workflow: the organiser receives an entry (e.g. a filled Word document), it is
// transcribed into a JSON file in data/entries/, and the next deploy imports it.
// Import is idempotent: an entrant whose name already exists is skipped, so
// re-deploys never duplicate or overwrite entries (admin edits are safe).
//
// Each entry is validated before being written: team names must resolve, the
// Part 1 budget must be exact, group picks must be three distinct teams from the
// right group, and Part 2 question numbers must be 1-12.

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { PrismaClient } from "@prisma/client";
import { validateFantasy } from "./fantasy-budget";
import { GROUPS, GROUP_CODES, resolveTeamName } from "./teams";

export interface EntryFile {
  name: string;
  email?: string | null;
  /** Exactly two team names (must match lib/teams.ts, aliases allowed). */
  teams: string[];
  /** At least five scorer names. */
  scorers: string[];
  /** Question number (1-12) -> answer, using canonical option values. */
  part2: Record<string, string>;
  /** Group code -> [1st, 2nd, 3rd] team names. */
  groups: Record<string, [string, string, string]>;
}

export interface ImportResult {
  imported: string[]; // newly created
  updated: string[]; // existing entry refreshed from JSON
  removed: string[]; // locked entry no longer in data/entries
  errors: { file: string; error: string }[];
}

function validateEntry(
  entry: EntryFile,
  teamPriceByName: Map<string, number>,
): string | null {
  if (!entry.name?.trim()) return "missing name";

  const teamNames = entry.teams?.map((t) => resolveTeamName(t));
  if (!teamNames || teamNames.length !== 2 || teamNames.some((t) => !t)) {
    return `teams must be exactly two known names (got: ${entry.teams?.join(", ")})`;
  }
  if (teamNames[0] === teamNames[1]) return "the two teams must be different";

  const budget = validateFantasy({
    teamPrices: teamNames.map((t) => teamPriceByName.get(t!) ?? 0),
    scorerNames: entry.scorers ?? [],
  });
  if (!budget.valid) return `budget invalid: ${budget.errors[0]}`;

  for (const qn of Object.keys(entry.part2 ?? {})) {
    const n = Number(qn);
    if (!Number.isInteger(n) || n < 1 || n > 12) return `invalid question number ${qn}`;
  }

  for (const code of GROUP_CODES) {
    const picks = entry.groups?.[code];
    if (!picks || picks.length !== 3) return `group ${code} needs three picks`;
    const resolved = picks.map((p) => resolveTeamName(p));
    if (resolved.some((r) => !r)) return `group ${code} has an unknown team`;
    if (new Set(resolved).size !== 3) return `group ${code} picks must differ`;
    const allowed = GROUPS[code];
    if (resolved.some((r) => !allowed.includes(r!))) {
      return `group ${code} contains a team from another group`;
    }
  }
  return null;
}

export async function importEntries(
  prisma: PrismaClient,
  dir = path.join(process.cwd(), "data", "entries"),
): Promise<ImportResult> {
  const result: ImportResult = { imported: [], updated: [], removed: [], errors: [] };

  let files: string[] = [];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  } catch {
    return result; // no entries directory — nothing to do
  }
  if (!files.length) return result;

  const teams = await prisma.team.findMany();
  const idByName = new Map(teams.map((t) => [t.name, t.id] as const));
  const priceByName = new Map(teams.map((t) => [t.name, t.priceTier] as const));

  // Track every valid entrant name we see, so we can prune stale locked entries.
  const seen = new Set<string>();

  for (const file of files) {
    let entry: EntryFile;
    try {
      entry = JSON.parse(readFileSync(path.join(dir, file), "utf8"));
    } catch (e) {
      result.errors.push({ file, error: `unreadable JSON: ${e instanceof Error ? e.message : e}` });
      continue;
    }

    const problem = validateEntry(entry, priceByName);
    if (problem) {
      result.errors.push({ file, error: problem });
      continue;
    }
    seen.add(entry.name.trim().toLowerCase());

    // Build the child rows once; reused for create or in-place replace.
    const childData = {
      teams: {
        create: entry.teams.map((t) => ({ teamId: idByName.get(resolveTeamName(t)!)! })),
      },
      scorers: {
        create: entry.scorers.map((playerName) => ({ playerName: playerName.trim() })),
      },
      part2Answers: {
        create: Object.entries(entry.part2 ?? {}).map(([questionNo, answer]) => ({
          questionNo: Number(questionNo),
          answer: answer.trim(),
        })),
      },
      groupPredictions: {
        create: GROUP_CODES.map((code) => {
          const [first, second, third] = entry.groups[code];
          return {
            groupCode: code,
            firstTeamId: idByName.get(resolveTeamName(first)!)!,
            secondTeamId: idByName.get(resolveTeamName(second)!)!,
            thirdTeamId: idByName.get(resolveTeamName(third)!)!,
          };
        }),
      },
    };

    const existing = await prisma.entrant.findFirst({
      where: { name: { equals: entry.name.trim(), mode: "insensitive" } },
    });

    if (existing) {
      // Refresh picks in place (stable id; knockout predictions untouched).
      await prisma.entrant.update({
        where: { id: existing.id },
        data: {
          name: entry.name.trim(),
          email: entry.email?.trim() || null,
          locked: true,
          teams: { deleteMany: {}, ...childData.teams },
          scorers: { deleteMany: {}, ...childData.scorers },
          part2Answers: { deleteMany: {}, ...childData.part2Answers },
          groupPredictions: { deleteMany: {}, ...childData.groupPredictions },
        },
      });
      result.updated.push(entry.name);
    } else {
      await prisma.entrant.create({
        data: {
          name: entry.name.trim(),
          email: entry.email?.trim() || null,
          locked: true, // transcribed from the official submission — protected
          ...childData,
        },
      });
      result.imported.push(entry.name);
    }
  }

  // Prune locked entrants that are no longer represented in data/entries
  // (e.g. a renamed/withdrawn submission). Unlocked entries are never touched.
  const lockedEntrants = await prisma.entrant.findMany({ where: { locked: true } });
  for (const e of lockedEntrants) {
    if (!seen.has(e.name.trim().toLowerCase())) {
      await prisma.entrant.delete({ where: { id: e.id } });
      result.removed.push(e.name);
    }
  }

  return result;
}
