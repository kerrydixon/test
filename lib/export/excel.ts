// Builds the matchday Excel export, recreating the matrix layout used in previous
// tournaments (Euro 2024): one SCORES sheet with entrants as columns and stacked
// sections — teams, goal-scorers, questions, group predictions, knockouts — plus
// running totals, with a summary leaderboard sheet in front.

import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";
import { getEntrantInputs, getWorldState } from "@/lib/data";
import {
  countedGoals,
  goalsAgainstTeam,
  goalsForTeam,
  isPlayed,
  outcomeForTeam,
  scoreEntrant,
  computeGroupTable,
  matchWinner,
  PART2_POINTS_PER_QUESTION,
  PART4_POINTS_PER_MATCH,
} from "@/lib/scoring";
import { normaliseName, playerMatches } from "@/lib/scoring/names";
import { PART2_QUESTIONS } from "@/lib/part2-questions";
import { GROUP_CODES } from "@/lib/teams";

const HEAD = { bold: true } as const;
const SECTION_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFE2EFDA" },
};

export async function buildExportWorkbook(): Promise<ExcelJS.Workbook> {
  const [world, entrants, teams, knockoutMatches] = await Promise.all([
    getWorldState(),
    getEntrantInputs(),
    prisma.team.findMany(),
    prisma.match.findMany({
      where: { stage: { not: "GROUP" } },
      include: { homeTeam: true, awayTeam: true },
      orderBy: [{ stage: "asc" }, { kickoff: "asc" }],
    }),
  ]);

  const teamById = new Map(teams.map((t) => [t.id, t] as const));
  const scores = entrants.map((e) => scoreEntrant(e, world));
  const scoreById = new Map(scores.map((s) => [s.entrantId, s] as const));
  // League position = rank by total (ties share the better rank, like the old sheet).
  const ranked = [...scores].sort((a, b) => b.total - a.total);
  const positionById = new Map<string, number>();
  ranked.forEach((s, i) => {
    const prev = ranked[i - 1];
    positionById.set(
      s.entrantId,
      prev && prev.total === s.total ? positionById.get(prev.entrantId)! : i + 1,
    );
  });

  const wb = new ExcelJS.Workbook();
  wb.creator = "World Cup 2026 Fantasy";
  wb.created = new Date();

  // ---------- Sheet 1: leaderboard summary ----------
  const lb = wb.addWorksheet("LEADERBOARD");
  lb.columns = [
    { header: "Pos", width: 6 },
    { header: "Entrant", width: 26 },
    { header: "Fantasy squad", width: 14 },
    { header: "Questions", width: 11 },
    { header: "Groups", width: 9 },
    { header: "Knockouts", width: 11 },
    { header: "TOTAL", width: 10 },
  ];
  lb.getRow(1).font = HEAD;
  for (const s of ranked) {
    lb.addRow([
      positionById.get(s.entrantId),
      s.name,
      s.part1.total,
      s.part2.total,
      s.part3.total,
      s.part4.total,
      s.total,
    ]);
  }
  lb.getColumn(7).font = HEAD;

  // ---------- Sheet 2: the classic SCORES matrix ----------
  const ws = wb.addWorksheet("SCORES", {
    views: [{ state: "frozen", xSplit: 6, ySplit: 3 }],
  });
  const FIRST_ENTRANT_COL = 7; // A..F = labels/stats, G.. = entrants
  const col = (i: number) => FIRST_ENTRANT_COL + i;

  ws.getColumn(1).width = 34;
  for (let c = 2; c <= 6; c++) ws.getColumn(c).width = 7;
  entrants.forEach((_, i) => (ws.getColumn(col(i)).width = 14));

  const titleRow = ws.addRow([
    `World Cup USA 2026 — exported ${new Date().toLocaleDateString("en-GB")} — ${entrants.length} entries`,
  ]);
  titleRow.font = { bold: true, size: 14 };

  const nameRow = ws.addRow([]);
  nameRow.getCell(1).value = "Entrant";
  entrants.forEach((e, i) => (nameRow.getCell(col(i)).value = e.name));
  nameRow.font = HEAD;
  nameRow.alignment = { wrapText: true };

  const totalRow = ws.addRow([]);
  totalRow.getCell(1).value = "Running Total";
  entrants.forEach((e, i) => (totalRow.getCell(col(i)).value = scoreById.get(e.id)!.total));
  totalRow.font = HEAD;

  const posRow = ws.addRow([]);
  posRow.getCell(1).value = "League Position";
  entrants.forEach((e, i) => (posRow.getCell(col(i)).value = positionById.get(e.id)));

  const section = (label: string, stats: string[] = []) => {
    ws.addRow([]);
    const r = ws.addRow([label, ...stats]);
    r.font = HEAD;
    for (let c = 1; c <= 6; c++) r.getCell(c).fill = SECTION_FILL;
    return r;
  };

  // ----- Part 1: teams -----
  section("PART 1 — Teams selected", ["W", "D", "L", "GF", "GA"]);
  const pickedTeamIds = [...new Set(entrants.flatMap((e) => e.fantasy.teamIds))];
  for (const teamId of pickedTeamIds.sort((a, b) =>
    (teamById.get(b)?.priceTier ?? 0) - (teamById.get(a)?.priceTier ?? 0),
  )) {
    const team = teamById.get(teamId);
    if (!team) continue;
    let w = 0, d = 0, l = 0, gf = 0, ga = 0;
    for (const m of world.matches.filter(
      (x) => isPlayed(x) && (x.homeTeamId === teamId || x.awayTeamId === teamId),
    )) {
      const o = outcomeForTeam(m, teamId);
      if (o === "WIN") w++;
      else if (o === "DRAW") d++;
      else if (o === "LOSS") l++;
      gf += goalsForTeam(m, teamId);
      ga += goalsAgainstTeam(m, teamId);
    }
    const row = ws.addRow([
      `${team.name} £${(team.priceTier / 1000).toFixed(1)}bn`,
      w, d, l, gf, ga,
    ]);
    entrants.forEach((e, i) => {
      if (!e.fantasy.teamIds.includes(teamId)) return;
      const breakdown = scoreById.get(e.id)!.part1.perTeam.find((t) => t.teamId === teamId);
      row.getCell(col(i)).value = breakdown?.total ?? 0;
    });
  }

  // ----- Part 1: goal-scorers -----
  section("PART 1 — Goal-scorers", ["G", "A"]);
  // Tally goals/assists by normalised name across all played matches.
  const goalTally = new Map<string, number>();
  const assistTally = new Map<string, number>();
  for (const m of world.matches.filter(isPlayed)) {
    for (const g of countedGoals(m)) {
      if (!g.isOwnGoal) {
        const k = normaliseName(g.scorerName);
        goalTally.set(k, (goalTally.get(k) ?? 0) + 1);
      }
      if (g.assistName) {
        const k = normaliseName(g.assistName);
        assistTally.set(k, (assistTally.get(k) ?? 0) + 1);
      }
    }
  }
  // Distinct scorers across entries, keyed by normalised name.
  const scorerDisplay = new Map<string, string>();
  for (const e of entrants) {
    for (const s of e.fantasy.scorerNames) {
      const k = normaliseName(s);
      if (!scorerDisplay.has(k)) scorerDisplay.set(k, s);
    }
  }
  const sumMatching = (tally: Map<string, number>, pick: string) => {
    let sum = 0;
    for (const [eventName, count] of tally) {
      if (playerMatches(pick, eventName)) sum += count;
    }
    return sum;
  };
  for (const [key, display] of [...scorerDisplay.entries()].sort((a, b) =>
    a[1].localeCompare(b[1]),
  )) {
    const row = ws.addRow([
      display,
      sumMatching(goalTally, display),
      sumMatching(assistTally, display),
    ]);
    entrants.forEach((e, i) => {
      if (!e.fantasy.scorerNames.some((s) => normaliseName(s) === key)) return;
      const breakdown = scoreById
        .get(e.id)!
        .part1.perScorer.find((s) => normaliseName(s.name) === key);
      row.getCell(col(i)).value = breakdown?.points ?? 0;
    });
  }

  const part1Row = ws.addRow(["PART 1 TOTAL"]);
  part1Row.font = HEAD;
  entrants.forEach((e, i) => (part1Row.getCell(col(i)).value = scoreById.get(e.id)!.part1.total));

  // ----- Part 2: questions -----
  section(`PART 2 — Questions @ ${PART2_POINTS_PER_QUESTION} points`, ["Official"]);
  for (const q of PART2_QUESTIONS) {
    const official = world.officialPart2[q.no] ?? [];
    const row = ws.addRow([`Q${q.no}. ${q.prompt.slice(0, 60)}`, official.join("/") || "—"]);
    entrants.forEach((e, i) => {
      const perQ = scoreById.get(e.id)!.part2.perQuestion.find((x) => x.questionNo === q.no);
      const answer = e.part2Answers[q.no];
      // Correct -> points; wrong/unscored -> show the entrant's answer (old-sheet style).
      row.getCell(col(i)).value = perQ?.correct
        ? PART2_POINTS_PER_QUESTION
        : (answer ?? "—");
    });
  }
  const part2Row = ws.addRow(["PART 2 TOTAL"]);
  part2Row.font = HEAD;
  entrants.forEach((e, i) => (part2Row.getCell(col(i)).value = scoreById.get(e.id)!.part2.total));

  // ----- Part 3: groups -----
  section("PART 3 — Group predictions (cells show predicted finishing position)");
  for (const code of GROUP_CODES) {
    const table = computeGroupTable(code, world.teams, world.matches);
    const groupHeader = ws.addRow([`GROUP ${code}`, "", "", "", "", "Pts:"]);
    groupHeader.font = HEAD;
    entrants.forEach((e, i) => {
      const g = scoreById.get(e.id)!.part3.groups.find((x) => x.groupCode === code);
      groupHeader.getCell(col(i)).value = g ? g.points : "—";
    });
    table.forEach((rowData, pos) => {
      const team = teamById.get(rowData.teamId);
      const row = ws.addRow([
        `  ${team?.name ?? "?"}`,
        rowData.played ? `#${pos + 1}` : "",
      ]);
      entrants.forEach((e, i) => {
        const p = e.groupPredictions.find((x) => x.groupCode === code);
        if (!p) return;
        const predicted =
          p.firstTeamId === rowData.teamId ? 1 :
          p.secondTeamId === rowData.teamId ? 2 :
          p.thirdTeamId === rowData.teamId ? 3 : null;
        if (predicted) row.getCell(col(i)).value = predicted;
      });
    });
  }
  const part3Row = ws.addRow(["PART 3 TOTAL"]);
  part3Row.font = HEAD;
  entrants.forEach((e, i) => (part3Row.getCell(col(i)).value = scoreById.get(e.id)!.part3.total));

  // ----- Part 4: knockouts -----
  section(`PART 4 — Knockouts @ ${PART4_POINTS_PER_MATCH} points (wrong picks shown)`);
  const STAGE_LABEL: Record<string, string> = {
    R32: "Round of 32", R16: "Round of 16", QF: "Quarter-final", SF: "Semi-final", FINAL: "Final",
  };
  for (const m of knockoutMatches) {
    const winnerId = matchWinner({
      ...m,
      goals: [],
    });
    const winner = winnerId ? teamById.get(winnerId)?.name : null;
    const row = ws.addRow([
      `${STAGE_LABEL[m.stage] ?? m.stage}: ${m.homeTeam.name} v ${m.awayTeam.name}`,
      winner ?? "TBD",
    ]);
    entrants.forEach((e, i) => {
      const pick = e.knockoutPredictions.find((k) => k.matchId === m.id);
      if (!pick) return;
      const pickName = teamById.get(pick.predictedTeamId)?.name ?? "?";
      row.getCell(col(i)).value =
        winnerId && pick.predictedTeamId === winnerId ? PART4_POINTS_PER_MATCH : pickName;
    });
  }
  const part4Row = ws.addRow(["PART 4 TOTAL"]);
  part4Row.font = HEAD;
  entrants.forEach((e, i) => (part4Row.getCell(col(i)).value = scoreById.get(e.id)!.part4.total));

  // ----- Final totals -----
  ws.addRow([]);
  const finalRow = ws.addRow(["FINAL TOTAL"]);
  finalRow.font = { bold: true, size: 12 };
  entrants.forEach((e, i) => (finalRow.getCell(col(i)).value = scoreById.get(e.id)!.total));
  for (let c = 1; c <= 6; c++) finalRow.getCell(c).fill = SECTION_FILL;

  return wb;
}
