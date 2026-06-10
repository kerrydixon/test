// Builds the SELF-CALCULATING Excel workbook: a manual, formula-driven version of
// the competition that recalculates as results are typed in. Layout:
//
//   INSTRUCTIONS — how to run it
//   ENTRIES   — static picks per entrant (columns)         [reference data]
//   RESULTS   — match list; scores typed into F/G (+H pens) [INPUT]
//   SCORERS   — goals/assists tally per picked scorer       [INPUT]
//   ANSWERS   — official Part 2 answers (up to 3 for ties)  [INPUT]
//   STANDINGS — group tables computed from RESULTS, with an
//               overridable "official top 3" per group      [auto + override]
//   PICKS     — Part 4 knockout picks per entrant           [INPUT, later]
//   MATRIX    — the 24-row Part 3 accuracy lookup
//   SCORES    — the familiar matrix, every cell a formula
//
// Formulas deliberately stick to SUMPRODUCT / INDEX / MATCH / VLOOKUP / IF so the
// sheet works in any Excel version (no dynamic-array functions).

import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";
import { getEntrantInputs } from "@/lib/data";
import { PART3_MATRIX } from "@/lib/scoring/part3";
import { PART2_QUESTIONS } from "@/lib/part2-questions";
import { GROUP_CODES } from "@/lib/teams";

const HEAD = { bold: true } as const;
const INPUT_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFFF2CC" }, // soft yellow = type here
};
const SECTION_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFE2EFDA" },
};

// ---- fixed coordinates ----
const SCORER_ROWS = 17; // max scorers any entry can hold (2x £1.8bn teams)
// ENTRIES rows
const E_TEAM1 = 2;
const E_TEAM2 = 3;
const E_SCORER0 = 4; // ..E_SCORER0+SCORER_ROWS-1 (= 20)
const E_Q0 = 21; // Q1..Q12 => rows 21..32
const E_GROUP0 = 33; // group gi occupies rows 33+gi*3 (1st), +1 (2nd), +2 (3rd)
// RESULTS rows: 2..73 group fixtures, then knockout placeholders
const R_GROUP0 = 2;
const R_KO0 = 74; // 16 R32, 8 R16, 4 QF, 2 SF, 1 FINAL => rows 74..104
const KO_PLAN: { stage: string; count: number }[] = [
  { stage: "R32", count: 16 },
  { stage: "R16", count: 8 },
  { stage: "QF", count: 4 },
  { stage: "SF", count: 2 },
  { stage: "FINAL", count: 1 },
];
const R_LAST = 104;
// STANDINGS: teams 2..49, official table rows 53..64
const S_TEAM0 = 2;
const S_OFF0 = 53;

function colLetter(n: number): string {
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export async function buildCalcWorkbook(): Promise<ExcelJS.Workbook> {
  const [entrants, teams, koMatches] = await Promise.all([
    getEntrantInputs(),
    prisma.team.findMany(),
    prisma.match.findMany({
      where: { stage: { not: "GROUP" } },
      include: { homeTeam: true, awayTeam: true },
      orderBy: [{ stage: "asc" }, { kickoff: "asc" }],
    }),
  ]);
  const groupFixtures = await prisma.match.findMany({
    where: { stage: "GROUP" },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { externalRef: "asc" },
  });
  const teamById = new Map(teams.map((t) => [t.id, t] as const));
  const n = entrants.length;
  const ecol = (i: number) => colLetter(2 + i); // ENTRIES/PICKS/SCORES entrant col

  const wb = new ExcelJS.Workbook();
  wb.creator = "World Cup 2026 Fantasy";
  wb.calcProperties.fullCalcOnLoad = true;

  // ---------- INSTRUCTIONS ----------
  const info = wb.addWorksheet("INSTRUCTIONS");
  info.getColumn(1).width = 110;
  const lines = [
    ["World Cup USA 2026 — self-calculating scores workbook", true],
    [""],
    ["Yellow cells are the only ones you type in. Everything else recalculates automatically."],
    [""],
    ["1. RESULTS — enter each match score in columns F and G (score AFTER extra time,"],
    ["   NOT counting penalty shoot-out goals). If a knockout match goes to penalties,"],
    ["   type the winning team's name in column H. For knockout rounds, first type the"],
    ["   two team names in columns D and E as the bracket becomes known."],
    ["2. SCORERS — keep each goal-scorer's running GOALS and ASSISTS totals up to date"],
    ["   (own goals and penalty shoot-out goals do not count)."],
    ["3. ANSWERS — when a Part 2 question is decided, type the official answer in column C"],
    ["   (columns D and E take extra answers when a tie means several are correct)."],
    ["4. STANDINGS — group tables fill in automatically. The 'official top 3' table at the"],
    ["   bottom auto-fills once a group's 6 games are played; overtype it if tiebreakers"],
    ["   (head-to-head etc.) change the order."],
    ["5. PICKS — once knockout predictions are collected, type each entrant's picked team"],
    ["   per match. Correct picks score automatically."],
    [""],
    ["SCORES shows the full matrix; LEADERBOARD positions update from it."],
    ["Scoring: win 250, draw 125, goal scored 150, conceded -100, scorer goal 150,"],
    ["assist 75, questions 200, group matrix up to 200/group, knockout winners 250."],
  ] as const;
  for (const [text, bold] of lines as unknown as [string, boolean?][]) {
    const r = info.addRow([text]);
    if (bold) r.font = { bold: true, size: 14 };
  }

  // ---------- ENTRIES (static) ----------
  const en = wb.addWorksheet("ENTRIES");
  en.getColumn(1).width = 26;
  entrants.forEach((_, i) => (en.getColumn(2 + i).width = 16));
  const enHeader = en.getRow(1);
  enHeader.getCell(1).value = "Entrant";
  entrants.forEach((e, i) => (enHeader.getCell(2 + i).value = e.name));
  enHeader.font = HEAD;

  const setRow = (r: number, label: string, vals: (string | null)[]) => {
    const row = en.getRow(r);
    row.getCell(1).value = label;
    vals.forEach((v, i) => {
      if (v) row.getCell(2 + i).value = v;
    });
  };
  setRow(E_TEAM1, "Team 1", entrants.map((e) => teamById.get(e.fantasy.teamIds[0] ?? "")?.name ?? null));
  setRow(E_TEAM2, "Team 2", entrants.map((e) => teamById.get(e.fantasy.teamIds[1] ?? "")?.name ?? null));
  for (let s = 0; s < SCORER_ROWS; s++) {
    setRow(E_SCORER0 + s, `Scorer ${s + 1}`, entrants.map((e) => e.fantasy.scorerNames[s] ?? null));
  }
  for (let q = 1; q <= 12; q++) {
    setRow(E_Q0 + q - 1, `Q${q} answer`, entrants.map((e) => e.part2Answers[q] ?? null));
  }
  GROUP_CODES.forEach((code, gi) => {
    const preds = entrants.map((e) => e.groupPredictions.find((p) => p.groupCode === code));
    setRow(E_GROUP0 + gi * 3, `Group ${code} 1st`, preds.map((p) => (p ? teamById.get(p.firstTeamId)?.name ?? null : null)));
    setRow(E_GROUP0 + gi * 3 + 1, `Group ${code} 2nd`, preds.map((p) => (p ? teamById.get(p.secondTeamId)?.name ?? null : null)));
    setRow(E_GROUP0 + gi * 3 + 2, `Group ${code} 3rd`, preds.map((p) => (p ? teamById.get(p.thirdTeamId)?.name ?? null : null)));
  });

  // ---------- RESULTS ----------
  const res = wb.addWorksheet("RESULTS");
  res.columns = [
    { header: "Ref", width: 10 },
    { header: "Stage", width: 8 },
    { header: "Group", width: 7 },
    { header: "Home", width: 20 },
    { header: "Away", width: 20 },
    { header: "HG", width: 5 },
    { header: "AG", width: 5 },
    { header: "Pens winner (if drawn KO)", width: 24 },
    { header: "Winner (auto)", width: 20 },
    { header: "Draw (auto)", width: 11 },
  ];
  res.getRow(1).font = HEAD;
  res.views = [{ state: "frozen", ySplit: 1 }];

  const addResultRow = (
    r: number,
    ref: string,
    stage: string,
    group: string | null,
    home: string | null,
    away: string | null,
    hg: number | null,
    ag: number | null,
    pensWinner: string | null,
  ) => {
    const row = res.getRow(r);
    row.getCell(1).value = ref;
    row.getCell(2).value = stage;
    if (group) row.getCell(3).value = group;
    if (home) row.getCell(4).value = home;
    if (away) row.getCell(5).value = away;
    if (hg !== null) row.getCell(6).value = hg;
    if (ag !== null) row.getCell(7).value = ag;
    if (pensWinner) row.getCell(8).value = pensWinner;
    // KO rows: team names are inputs too.
    const inputCells = stage === "GROUP" ? [6, 7, 8] : [4, 5, 6, 7, 8];
    for (const c of inputCells) row.getCell(c).fill = INPUT_FILL;
    row.getCell(9).value = {
      formula: `IF(OR($F${r}="",$G${r}=""),"",IF($F${r}>$G${r},$D${r},IF($G${r}>$F${r},$E${r},$H${r})))`,
    };
    row.getCell(10).value = {
      formula: `IF($B${r}<>"GROUP","",IF(OR($F${r}="",$G${r}=""),"",IF($F${r}=$G${r},1,0)))`,
    };
  };

  groupFixtures.forEach((m, i) => {
    addResultRow(
      R_GROUP0 + i,
      m.externalRef ?? `GRP-${i + 1}`,
      "GROUP",
      m.groupCode,
      m.homeTeam.name,
      m.awayTeam.name,
      m.homeGoals,
      m.awayGoals,
      m.shootoutWinnerTeamId ? teamById.get(m.shootoutWinnerTeamId)?.name ?? null : null,
    );
  });
  // Knockout placeholders (pre-filled from the DB where matches already exist).
  let koRow = R_KO0;
  const koByStage = new Map<string, typeof koMatches>();
  for (const m of koMatches) {
    const l = koByStage.get(m.stage) ?? [];
    l.push(m);
    koByStage.set(m.stage, l);
  }
  for (const { stage, count } of KO_PLAN) {
    const existing = koByStage.get(stage) ?? [];
    for (let i = 0; i < count; i++) {
      const m = existing[i];
      addResultRow(
        koRow,
        `${stage}-${i + 1}`,
        stage,
        null,
        m ? m.homeTeam.name : null,
        m ? m.awayTeam.name : null,
        m?.homeGoals ?? null,
        m?.awayGoals ?? null,
        m?.shootoutWinnerTeamId ? teamById.get(m.shootoutWinnerTeamId)?.name ?? null : null,
      );
      koRow++;
    }
  }

  // ---------- SCORERS ----------
  const sc = wb.addWorksheet("SCORERS");
  sc.columns = [
    { header: "Goal-scorer", width: 28 },
    { header: "Goals", width: 8 },
    { header: "Assists", width: 8 },
    { header: "Points (auto)", width: 12 },
  ];
  sc.getRow(1).font = HEAD;
  const distinctScorers = [...new Set(entrants.flatMap((e) => e.fantasy.scorerNames.map((s) => s.trim())))].sort((a, b) => a.localeCompare(b));
  distinctScorers.forEach((name, i) => {
    const r = i + 2;
    const row = sc.getRow(r);
    row.getCell(1).value = name;
    row.getCell(2).value = 0;
    row.getCell(3).value = 0;
    row.getCell(2).fill = INPUT_FILL;
    row.getCell(3).fill = INPUT_FILL;
    row.getCell(4).value = { formula: `B${r}*150+C${r}*75` };
  });
  const SC_LAST = distinctScorers.length + 1;

  // ---------- ANSWERS ----------
  const an = wb.addWorksheet("ANSWERS");
  an.columns = [
    { header: "Q", width: 4 },
    { header: "Question", width: 70 },
    { header: "Official answer", width: 18 },
    { header: "Also correct (tie)", width: 18 },
    { header: "Also correct (tie)", width: 18 },
  ];
  an.getRow(1).font = HEAD;
  PART2_QUESTIONS.forEach((q) => {
    const r = q.no + 1;
    const row = an.getRow(r);
    row.getCell(1).value = q.no;
    row.getCell(2).value = q.prompt;
    for (const c of [3, 4, 5]) row.getCell(c).fill = INPUT_FILL;
  });

  // ---------- MATRIX ----------
  const mx = wb.addWorksheet("MATRIX");
  mx.columns = [
    { header: "Code", width: 8 },
    { header: "Points", width: 8 },
  ];
  mx.getRow(1).font = HEAD;
  Object.entries(PART3_MATRIX)
    .sort((a, b) => b[1] - a[1])
    .forEach(([code, pts]) => mx.addRow([code, pts]));

  // ---------- STANDINGS ----------
  const st = wb.addWorksheet("STANDINGS");
  st.columns = [
    { header: "Group", width: 7 },
    { header: "Team", width: 22 },
    { header: "Pts", width: 6 },
    { header: "GD", width: 6 },
    { header: "GF", width: 6 },
    { header: "SortScore", width: 10 },
    { header: "Rank", width: 6 },
    { header: "Key", width: 8 },
  ];
  st.getRow(1).font = HEAD;
  const R = (c: string) => `RESULTS!$${c}$${R_GROUP0}:$${c}$${R_LAST}`;
  let sRow = S_TEAM0;
  for (const code of GROUP_CODES) {
    for (const t of teams.filter((x) => x.groupCode === code)) {
      const row = st.getRow(sRow);
      row.getCell(1).value = code;
      row.getCell(2).value = t.name;
      const grp = `(${R("B")}="GROUP")`;
      // wins*3 + draws
      row.getCell(3).value = {
        formula:
          `SUMPRODUCT(${grp}*(${R("I")}=$B${sRow}))*3` +
          `+SUMPRODUCT(${grp}*((${R("D")}=$B${sRow})+(${R("E")}=$B${sRow}))*(${R("J")}=1))`,
      };
      // GD = GF - GA
      row.getCell(4).value = {
        formula:
          `SUMPRODUCT(${grp}*(${R("D")}=$B${sRow})*${R("F")})+SUMPRODUCT(${grp}*(${R("E")}=$B${sRow})*${R("G")})` +
          `-SUMPRODUCT(${grp}*(${R("D")}=$B${sRow})*${R("G")})-SUMPRODUCT(${grp}*(${R("E")}=$B${sRow})*${R("F")})`,
      };
      row.getCell(5).value = {
        formula: `SUMPRODUCT(${grp}*(${R("D")}=$B${sRow})*${R("F")})+SUMPRODUCT(${grp}*(${R("E")}=$B${sRow})*${R("G")})`,
      };
      row.getCell(6).value = { formula: `C${sRow}*10000+D${sRow}*100+E${sRow}` };
      row.getCell(7).value = {
        formula: `SUMPRODUCT(($A$${S_TEAM0}:$A$49=$A${sRow})*($F$${S_TEAM0}:$F$49>$F${sRow}))+1`,
      };
      row.getCell(8).value = { formula: `$A${sRow}&"-"&$G${sRow}` };
      sRow++;
    }
  }
  // Official top-3 table (auto once group complete; overtype to override).
  const offHeader = st.getRow(S_OFF0 - 1);
  offHeader.getCell(1).value = "OFFICIAL TOP 3 (auto once group complete — overtype to override)";
  offHeader.font = HEAD;
  GROUP_CODES.forEach((code, gi) => {
    const r = S_OFF0 + gi;
    const row = st.getRow(r);
    row.getCell(1).value = code;
    const played = `SUMPRODUCT((${R("B")}="GROUP")*(${R("C")}="${code}")*(${R("F")}<>""))`;
    for (const [c, rank] of [
      [2, 1],
      [3, 2],
      [4, 3],
    ] as const) {
      row.getCell(c).value = {
        formula: `IF(${played}<6,"",IFERROR(INDEX($B$${S_TEAM0}:$B$49,MATCH("${code}-"&${rank},$H$${S_TEAM0}:$H$49,0)),""))`,
      };
      row.getCell(c).fill = INPUT_FILL;
    }
  });

  // ---------- PICKS (Part 4 inputs) ----------
  const pk = wb.addWorksheet("PICKS");
  pk.getColumn(1).width = 12;
  entrants.forEach((_, i) => (pk.getColumn(2 + i).width = 16));
  const pkHeader = pk.getRow(1);
  pkHeader.getCell(1).value = "Match";
  entrants.forEach((e, i) => (pkHeader.getCell(2 + i).value = e.name));
  pkHeader.font = HEAD;
  let pkRow = 2;
  for (const { stage, count } of KO_PLAN) {
    for (let i = 0; i < count; i++) {
      const row = pk.getRow(pkRow);
      row.getCell(1).value = `${stage}-${i + 1}`;
      entrants.forEach((_, j) => (row.getCell(2 + j).fill = INPUT_FILL));
      pkRow++;
    }
  }

  // ---------- SCORES (all formulas) ----------
  const ws = wb.addWorksheet("SCORES", {
    views: [{ state: "frozen", xSplit: 7, ySplit: 4 }],
  });
  const EC = 8; // entrant columns start at H; columns B–G hold labels/stats
  ws.getColumn(1).width = 32;
  ws.getColumn(2).width = 12;
  for (let c = 3; c <= 7; c++) ws.getColumn(c).width = 6;
  entrants.forEach((_, i) => (ws.getColumn(EC + i).width = 14));
  const scol = (i: number) => colLetter(EC + i);

  ws.getCell("A1").value = `World Cup USA 2026 — self-calculating (${n} entries)`;
  ws.getCell("A1").font = { bold: true, size: 14 };
  const nameR = 2;
  ws.getCell(`A${nameR}`).value = "Entrant";
  entrants.forEach((_, i) => {
    ws.getCell(`${scol(i)}${nameR}`).value = { formula: `ENTRIES!${ecol(i)}1` };
  });
  ws.getRow(nameR).font = HEAD;

  const totalR = 3;
  const posR = 4;
  // (filled in at the end once section total rows are known)

  let r = 6;
  const sectionRow = (label: string) => {
    const row = ws.getRow(r);
    row.getCell(1).value = label;
    row.font = HEAD;
    row.getCell(1).fill = SECTION_FILL;
    row.getCell(2).fill = SECTION_FILL;
    r++;
  };

  // --- Part 1: teams ---
  sectionRow("PART 1 — Teams (auto from RESULTS)");
  const teamHdr = ws.getRow(r);
  teamHdr.getCell(1).value = "Team";
  teamHdr.getCell(3).value = "W";
  teamHdr.getCell(4).value = "D";
  teamHdr.getCell(5).value = "L";
  teamHdr.getCell(6).value = "GF";
  teamHdr.getCell(7).value = "GA";
  teamHdr.font = HEAD;
  r++;
  const pickedTeamNames = [
    ...new Set(
      entrants.flatMap((e) => e.fantasy.teamIds.map((id) => teamById.get(id)?.name ?? "")),
    ),
  ].filter(Boolean).sort();
  const teamRow0 = r;
  for (const name of pickedTeamNames) {
    const row = ws.getRow(r);
    row.getCell(1).value = name;
    const played = `SUMPRODUCT(((${R("D")}=$A${r})+(${R("E")}=$A${r}))*(${R("F")}<>""))`;
    const gf = `SUMPRODUCT((${R("D")}=$A${r})*${R("F")})+SUMPRODUCT((${R("E")}=$A${r})*${R("G")})`;
    const ga = `SUMPRODUCT((${R("D")}=$A${r})*${R("G")})+SUMPRODUCT((${R("E")}=$A${r})*${R("F")})`;
    // Stat columns: Wins (any stage), Draws (group only), Losses, GF, GA.
    row.getCell(3).value = { formula: `SUMPRODUCT((${R("I")}=$A${r})*1)` };
    row.getCell(4).value = {
      formula: `SUMPRODUCT(((${R("D")}=$A${r})+(${R("E")}=$A${r}))*(${R("J")}=1))`,
    };
    row.getCell(5).value = { formula: `(${played})-$C${r}-$D${r}` };
    row.getCell(6).value = { formula: gf };
    row.getCell(7).value = { formula: ga };
    // Team points = wins*250 + draws*125 + GF*150 - GA*100, shown for owners only.
    entrants.forEach((_, i) => {
      const owns = `OR(ENTRIES!${ecol(i)}$${E_TEAM1}=$A${r},ENTRIES!${ecol(i)}$${E_TEAM2}=$A${r})`;
      row.getCell(EC + i).value = {
        formula: `IF(${owns},$C${r}*250+$D${r}*125+$F${r}*150-$G${r}*100,"")`,
      };
    });
    r++;
  }
  const teamRowEnd = r - 1;

  // --- Part 1: scorers ---
  sectionRow("PART 1 — Goal-scorers (auto from SCORERS)");
  const scorerRow0 = r;
  distinctScorers.forEach((name, idx) => {
    const row = ws.getRow(r);
    row.getCell(1).value = name;
    row.getCell(2).value = { formula: `SCORERS!B${idx + 2}&"G "&SCORERS!C${idx + 2}&"A"` };
    entrants.forEach((_, i) => {
      const range = `ENTRIES!${ecol(i)}$${E_SCORER0}:${ecol(i)}$${E_SCORER0 + SCORER_ROWS - 1}`;
      row.getCell(EC + i).value = {
        formula: `IF(SUMPRODUCT((${range}=$A${r})*1)>0,SCORERS!$D$${idx + 2},"")`,
      };
    });
    r++;
  });
  const scorerRowEnd = r - 1;

  const part1R = r;
  {
    const row = ws.getRow(r);
    row.getCell(1).value = "PART 1 TOTAL";
    row.font = HEAD;
    entrants.forEach((_, i) => {
      const c = scol(i);
      row.getCell(EC + i).value = {
        formula: `SUM(${c}${teamRow0}:${c}${teamRowEnd})+SUM(${c}${scorerRow0}:${c}${scorerRowEnd})`,
      };
    });
    r += 2;
  }

  // --- Part 2 ---
  sectionRow("PART 2 — Questions (auto from ANSWERS)");
  const qRow0 = r;
  for (let q = 1; q <= 12; q++) {
    const row = ws.getRow(r);
    row.getCell(1).value = `Q${q}`;
    row.getCell(2).value = { formula: `IF(ANSWERS!$C${q + 1}="","—",ANSWERS!$C${q + 1})` };
    entrants.forEach((_, i) => {
      const ans = `ENTRIES!${ecol(i)}$${E_Q0 + q - 1}`;
      const off = `ANSWERS!$C$${q + 1}:$E$${q + 1}`;
      row.getCell(EC + i).value = {
        formula: `IF(${ans}="","—",IF(COUNTIF(${off},${ans})>0,200,${ans}))`,
      };
    });
    r++;
  }
  const part2R = r;
  {
    const row = ws.getRow(r);
    row.getCell(1).value = "PART 2 TOTAL";
    row.font = HEAD;
    entrants.forEach((_, i) => {
      const c = scol(i);
      // SUMIF(=200) so numeric-looking wrong answers ("15", "8") are never summed.
      row.getCell(EC + i).value = { formula: `SUMIF(${c}${qRow0}:${c}${r - 1},200)` };
    });
    r += 2;
  }

  // --- Part 3 ---
  sectionRow("PART 3 — Groups (auto from STANDINGS official top 3)");
  const groupPtsRows: number[] = [];
  GROUP_CODES.forEach((code, gi) => {
    const offR = S_OFF0 + gi;
    const o1 = `STANDINGS!$B$${offR}`;
    const o2 = `STANDINGS!$C$${offR}`;
    const o3 = `STANDINGS!$D$${offR}`;
    const row = ws.getRow(r);
    row.getCell(1).value = `Group ${code}`;
    row.getCell(2).value = { formula: `IF(${o1}="","pending",${o1}&"/"&${o2}&"/"&${o3})` };
    entrants.forEach((_, i) => {
      const p1 = `ENTRIES!${ecol(i)}$${E_GROUP0 + gi * 3}`;
      const p2 = `ENTRIES!${ecol(i)}$${E_GROUP0 + gi * 3 + 1}`;
      const p3 = `ENTRIES!${ecol(i)}$${E_GROUP0 + gi * 3 + 2}`;
      const ch = (o: string) =>
        `IF(${o}=${p1},"1",IF(${o}=${p2},"2",IF(${o}=${p3},"3","X")))`;
      row.getCell(EC + i).value = {
        formula: `IF(${o1}="","",IFERROR(VLOOKUP(${ch(o1)}&${ch(o2)}&${ch(o3)},MATRIX!$A$2:$B$25,2,FALSE),0))`,
      };
    });
    groupPtsRows.push(r);
    r++;
  });
  const part3R = r;
  {
    const row = ws.getRow(r);
    row.getCell(1).value = "PART 3 TOTAL";
    row.font = HEAD;
    entrants.forEach((_, i) => {
      const c = scol(i);
      row.getCell(EC + i).value = {
        formula: `SUM(${c}${groupPtsRows[0]}:${c}${groupPtsRows[groupPtsRows.length - 1]})`,
      };
    });
    r += 2;
  }

  // --- Part 4 ---
  sectionRow("PART 4 — Knockouts (auto from RESULTS + PICKS)");
  const koRow0 = r;
  {
    let resultRow = R_KO0;
    let pickRow = 2;
    for (const { stage, count } of KO_PLAN) {
      for (let i = 0; i < count; i++) {
        const row = ws.getRow(r);
        row.getCell(1).value = {
          formula: `"${stage}: "&IF(RESULTS!$D$${resultRow}="","TBD",RESULTS!$D$${resultRow}&" v "&RESULTS!$E$${resultRow})`,
        };
        row.getCell(2).value = { formula: `RESULTS!$I$${resultRow}` };
        entrants.forEach((_, j) => {
          const pick = `PICKS!${ecol(j)}$${pickRow}`;
          row.getCell(3 + j).value = {
            formula: `IF(${pick}="","",IF(${pick}=$B${r},250,${pick}))`,
          };
        });
        resultRow++;
        pickRow++;
        r++;
      }
    }
  }
  const part4R = r;
  {
    const row = ws.getRow(r);
    row.getCell(1).value = "PART 4 TOTAL";
    row.font = HEAD;
    entrants.forEach((_, i) => {
      const c = scol(i);
      // SUMIF(=250) so wrong picks shown as text can never leak into the total.
      row.getCell(EC + i).value = { formula: `SUMIF(${c}${koRow0}:${c}${r - 1},250)` };
    });
    r += 2;
  }

  // --- final total + header rows ---
  const finalR = r;
  {
    const row = ws.getRow(r);
    row.getCell(1).value = "FINAL TOTAL";
    row.font = { bold: true, size: 12 };
    row.getCell(1).fill = SECTION_FILL;
    row.getCell(2).fill = SECTION_FILL;
    entrants.forEach((_, i) => {
      const c = scol(i);
      row.getCell(EC + i).value = {
        formula: `${c}${part1R}+${c}${part2R}+${c}${part3R}+${c}${part4R}`,
      };
    });
  }
  ws.getCell(`A${totalR}`).value = "Running Total";
  ws.getRow(totalR).font = HEAD;
  ws.getCell(`A${posR}`).value = "League Position";
  const firstC = scol(0);
  const lastC = scol(n - 1);
  entrants.forEach((_, i) => {
    const c = scol(i);
    ws.getCell(`${c}${totalR}`).value = { formula: `${c}${finalR}` };
    ws.getCell(`${c}${posR}`).value = {
      formula: `SUMPRODUCT(($${firstC}$${totalR}:$${lastC}$${totalR}>${c}${totalR})*1)+1`,
    };
  });

  // keep SCORERS' last row referenced (lint-quiet) — used by partner when extending
  void SC_LAST;

  return wb;
}
