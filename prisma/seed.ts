import { PrismaClient } from "@prisma/client";
import { ALL_TEAMS, GROUPS } from "../lib/teams";
import { importEntries } from "../lib/import-entries";

const prisma = new PrismaClient();

// Round-robin pairings for the 4 teams in a group (indices into the group array).
const ROUND_ROBIN: [number, number][] = [
  [0, 1],
  [2, 3],
  [0, 2],
  [1, 3],
  [0, 3],
  [1, 2],
];

async function main() {
  console.log("Seeding teams…");
  for (const t of ALL_TEAMS) {
    await prisma.team.upsert({
      where: { name: t.name },
      update: {
        groupCode: t.groupCode,
        priceTier: t.priceTier,
        confederation: t.confederation,
        isHost: t.isHost,
        flagEmoji: t.flagEmoji,
      },
      create: t,
    });
  }

  const teams = await prisma.team.findMany();
  const idByName = new Map(teams.map((t) => [t.name, t.id] as const));

  console.log("Generating 72 group-stage fixtures…");
  for (const [groupCode, names] of Object.entries(GROUPS)) {
    for (let i = 0; i < ROUND_ROBIN.length; i++) {
      const [h, a] = ROUND_ROBIN[i];
      const externalRef = `GRP-${groupCode}-${i + 1}`;
      await prisma.match.upsert({
        where: { externalRef },
        update: {},
        create: {
          externalRef,
          stage: "GROUP",
          groupCode,
          homeTeamId: idByName.get(names[h])!,
          awayTeamId: idByName.get(names[a])!,
          source: "MANUAL",
        },
      });
    }
  }

  console.log("Initialising Part 2 official answer slots…");
  for (let q = 1; q <= 12; q++) {
    await prisma.part2OfficialAnswer.upsert({
      where: { questionNo: q },
      update: {},
      create: { questionNo: q, answers: [] },
    });
  }

  console.log("Seeding default settings…");
  const settings: Record<string, string> = {
    // First match kicks off Thu 11 June 2026; submissions close just before.
    submissionDeadline: "2026-06-11T15:00:00.000Z",
    knockoutSubmissionsOpen: "false",
    resultsPublished: "true",
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({
      where: { key },
      update: {}, // don't override organiser changes on reseed
      create: { key, value },
    });
  }

  console.log("Importing entries from data/entries…");
  const imported = await importEntries(prisma);
  if (imported.imported.length) console.log(`  created: ${imported.imported.length}`);
  if (imported.updated.length) console.log(`  refreshed: ${imported.updated.length}`);
  if (imported.removed.length) console.log(`  removed: ${imported.removed.join(", ")}`);
  for (const e of imported.errors) console.error(`  INVALID ${e.file}: ${e.error}`);

  const teamCount = await prisma.team.count();
  const matchCount = await prisma.match.count();
  const entrantCount = await prisma.entrant.count();
  console.log(`Done. ${teamCount} teams, ${matchCount} matches, ${entrantCount} entrants.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
