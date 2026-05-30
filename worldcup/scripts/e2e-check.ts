// Manual end-to-end check (not part of the test suite). Run with: npx tsx scripts/e2e-check.ts
import { prisma } from "../lib/db";
import { getLeaderboard } from "../lib/data";

async function main() {
  // Clean any prior sample data.
  await prisma.entrant.deleteMany({ where: { name: "E2E Sample" } });

  const france = await prisma.team.findUniqueOrThrow({ where: { name: "France" } });
  const senegal = await prisma.team.findUniqueOrThrow({ where: { name: "Senegal" } });
  // France (2500) + Senegal (2100) = 4600 -> needs 7 scorers to reach 5300.
  const scorerNames = ["Mbappe", "Dembele", "Sane", "Sarr", "Diallo", "Kolo", "Camara"];

  const entrant = await prisma.entrant.create({
    data: {
      name: "E2E Sample",
      teams: { create: [{ teamId: france.id }, { teamId: senegal.id }] },
      scorers: { create: scorerNames.map((playerName) => ({ playerName })) },
      part2Answers: { create: [{ questionNo: 12, answer: "France" }] },
    },
  });

  // Set the official answer for Q12 so the entrant should score 200.
  await prisma.part2OfficialAnswer.upsert({
    where: { questionNo: 12 },
    update: { answers: ["France"] },
    create: { questionNo: 12, answers: ["France"] },
  });

  // France v Senegal group match (Group I): France win 2-1, Mbappe brace + Sarr.
  const match = await prisma.match.findFirstOrThrow({
    where: { stage: "GROUP", homeTeamId: france.id, awayTeamId: senegal.id },
  });
  await prisma.matchEvent.deleteMany({ where: { matchId: match.id } });
  await prisma.match.update({
    where: { id: match.id },
    data: { status: "FINISHED", homeGoals: 2, awayGoals: 1, adminLocked: true, source: "MANUAL" },
  });
  await prisma.matchEvent.createMany({
    data: [
      { matchId: match.id, teamId: france.id, scorerName: "Mbappe", assistName: "Dembele", minute: 10, source: "MANUAL" },
      { matchId: match.id, teamId: france.id, scorerName: "Mbappe", minute: 40, source: "MANUAL" },
      { matchId: match.id, teamId: senegal.id, scorerName: "Sarr", minute: 70, source: "MANUAL" },
    ],
  });

  const board = await getLeaderboard();
  const me = board.find((b) => b.entrantId === entrant.id)!;

  console.log("=== E2E result ===");
  console.log("Part 1 (France team):", JSON.stringify(me.part1.perTeam.find((t) => t.teamId === france.id)));
  console.log("Part 1 scorers total:", me.part1.scorerPoints);
  console.log("Part 1 total:", me.part1.total);
  console.log("Part 2 total (expect 200):", me.part2.total);
  console.log("Grand total:", me.total);

  // Expectations:
  // France: win 250 + 2 goals*150 - 1 conceded*100 = 450
  // Senegal: loss 0 + 1 goal*150 - 2 conceded*100 = -50
  // Scorers: Mbappe 2*150=300, Dembele assist 75, Sarr 1*150=150 = 525
  // Part2: 200
  const franceTeam = me.part1.perTeam.find((t) => t.teamId === france.id)!;
  const ok = franceTeam.total === 450 && me.part1.scorerPoints === 525 && me.part2.total === 200;
  console.log(ok ? "\n✅ Scoring matches expectations" : "\n❌ Mismatch");

  // Clean up the sample entrant; leave the match result for manual UI inspection.
  await prisma.entrant.delete({ where: { id: entrant.id } });
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
