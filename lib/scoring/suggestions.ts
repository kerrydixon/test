// Auto-derives suggested official answers for the Part 2 questions from match
// data. The organiser reviews each suggestion in /admin/questions and applies it
// with one click — the system never sets official answers on its own, because a
// few questions involve judgement (e.g. Golden Boot tiebreaks).
//
// Suggested values use the exact canonical option values from
// lib/part2-questions.ts so an applied suggestion always matches entrant answers.

import type { ScoringMatch } from "./types";
import { countedGoals, isPlayed, outcomeForTeam } from "./match-utils";
import { matchWinner } from "./part4";
import { computeGroupTable } from "./group-table";
import { normaliseName } from "./names";

export interface SuggestionTeam {
  id: string;
  name: string;
  groupCode: string;
  isHost: boolean;
  confederation: string;
}

/** ScoringMatch plus kickoff so we can find a team's opening game. */
export interface SuggestionMatch extends ScoringMatch {
  kickoff?: Date | string | null;
  externalRef?: string | null;
}

export interface Suggestion {
  questionNo: number;
  /** Canonical answer value(s); several = tie (all score). */
  answers: string[];
  /** True when the underlying results are complete enough to be final. */
  ready: boolean;
  note: string;
}

const TOP_SEEDS = ["France", "Spain", "Argentina", "England"];

function teamByName(teams: SuggestionTeam[], name: string) {
  return teams.find((t) => t.name === name);
}

function groupComplete(matches: SuggestionMatch[], groupCode: string): boolean {
  const ms = matches.filter((m) => m.stage === "GROUP" && m.groupCode === groupCode);
  return ms.length > 0 && ms.every(isPlayed);
}

/** A team's goals (incl. own goals in favour, excl. shoot-out) across matches. */
function teamGoals(matches: SuggestionMatch[], teamId: string): number {
  return matches
    .filter(isPlayed)
    .reduce((sum, m) => sum + countedGoals(m).filter((g) => g.teamId === teamId).length, 0);
}

export function suggestAnswers(
  teams: SuggestionTeam[],
  matches: SuggestionMatch[],
): Map<number, Suggestion> {
  const out = new Map<number, Suggestion>();
  const groupMatches = matches.filter((m) => m.stage === "GROUP");

  // Q1 — outcome of USA v Paraguay.
  const usa = teamByName(teams, "USA");
  const paraguay = teamByName(teams, "Paraguay");
  if (usa && paraguay) {
    const m = groupMatches.find(
      (x) =>
        (x.homeTeamId === usa.id && x.awayTeamId === paraguay.id) ||
        (x.homeTeamId === paraguay.id && x.awayTeamId === usa.id),
    );
    if (m && isPlayed(m)) {
      const o = outcomeForTeam(m, usa.id);
      out.set(1, {
        questionNo: 1,
        answers: [o === "WIN" ? "USA win" : o === "DRAW" ? "Draw" : "Paraguay win"],
        ready: true,
        note: "From the USA v Paraguay result.",
      });
    }
  }

  // Q2 — fastest goal in the top seeds' opening games (own goals discounted).
  {
    const firsts: { name: string; minute: number }[] = [];
    let allPlayed = true;
    for (const name of TOP_SEEDS) {
      const team = teamByName(teams, name);
      if (!team) continue;
      const own = groupMatches
        .filter((m) => m.homeTeamId === team.id || m.awayTeamId === team.id)
        .sort((a, b) => {
          const ka = a.kickoff ? new Date(a.kickoff).getTime() : Infinity;
          const kb = b.kickoff ? new Date(b.kickoff).getTime() : Infinity;
          if (ka !== kb) return ka - kb;
          return (a.externalRef ?? "").localeCompare(b.externalRef ?? "");
        });
      const opener = own[0];
      if (!opener || !isPlayed(opener)) {
        allPlayed = false;
        continue;
      }
      const goals = countedGoals(opener).filter(
        (g) => g.teamId === team.id && !g.isOwnGoal,
      );
      if (goals.length) {
        firsts.push({ name, minute: Math.min(...goals.map((g) => g.minute)) });
      }
    }
    if (firsts.length) {
      const best = Math.min(...firsts.map((f) => f.minute));
      out.set(2, {
        questionNo: 2,
        answers: firsts.filter((f) => f.minute === best).map((f) => f.name),
        ready: allPlayed,
        note: `Fastest opening-game goal so far: minute ${best}. Same-minute ties may need the official seconds.`,
      });
    }
  }

  // Q3 — most group-stage goals among the top seeds (ties all score).
  {
    const totals = TOP_SEEDS.flatMap((name) => {
      const team = teamByName(teams, name);
      return team ? [{ name, goals: teamGoals(groupMatches, team.id) }] : [];
    });
    const ready = TOP_SEEDS.every((name) => {
      const t = teamByName(teams, name);
      return t ? groupComplete(matches, t.groupCode) : false;
    });
    if (totals.some((t) => t.goals > 0) || ready) {
      const max = Math.max(...totals.map((t) => t.goals));
      out.set(3, {
        questionNo: 3,
        answers: totals.filter((t) => t.goals === max).map((t) => t.name),
        ready,
        note: totals.map((t) => `${t.name} ${t.goals}`).join(", "),
      });
    }
  }

  // Q4 — Scotland's group-stage goal difference.
  const scotland = teamByName(teams, "Scotland");
  if (scotland && groupComplete(matches, scotland.groupCode)) {
    const table = computeGroupTable(scotland.groupCode, teams, matches);
    const row = table.find((r) => r.teamId === scotland.id);
    if (row) {
      const gd = row.goalDifference;
      const answer =
        gd < 0 ? "Negative" : gd === 0 ? "Zero" : gd <= 2 ? "+1 or +2" : "+3 or more";
      out.set(4, {
        questionNo: 4,
        answers: [answer],
        ready: true,
        note: `Scotland finished the groups on ${gd > 0 ? "+" : ""}${gd}.`,
      });
    }
  }

  // Q5 — England's finishing position in Group L.
  const england = teamByName(teams, "England");
  if (england && groupComplete(matches, england.groupCode)) {
    const table = computeGroupTable(england.groupCode, teams, matches);
    const pos = table.findIndex((r) => r.teamId === england.id);
    if (pos >= 0) {
      out.set(5, {
        questionNo: 5,
        answers: [["First", "Second", "Third", "Fourth"][pos]],
        ready: true,
        note: "Check tiebreakers if the table is tight — override via Group standings.",
      });
    }
  }

  // Q6 — how many different Germany players score in the group stage.
  const germany = teamByName(teams, "Germany");
  if (germany) {
    const scorers = new Set<string>();
    for (const m of groupMatches.filter(isPlayed)) {
      for (const g of countedGoals(m)) {
        if (g.teamId === germany.id && !g.isOwnGoal) scorers.add(normaliseName(g.scorerName));
      }
    }
    const ready = groupComplete(matches, germany.groupCode);
    if (scorers.size > 0 || ready) {
      const n = scorers.size;
      out.set(6, {
        questionNo: 6,
        answers: [n <= 2 ? "0-2" : n <= 4 ? "3-4" : "5+"],
        ready,
        note: `${n} different scorer(s) so far (own goals excluded).`,
      });
    }
  }

  // Q7 — group with the most goals (ties all score).
  {
    const codes = [...new Set(teams.map((t) => t.groupCode))].sort();
    const totals = codes.map((code) => ({
      code,
      goals: groupMatches
        .filter((m) => m.groupCode === code && isPlayed(m))
        .reduce((s, m) => s + (m.homeGoals ?? 0) + (m.awayGoals ?? 0), 0),
    }));
    const ready = codes.every((c) => groupComplete(matches, c));
    if (totals.some((t) => t.goals > 0)) {
      const max = Math.max(...totals.map((t) => t.goals));
      out.set(7, {
        questionNo: 7,
        answers: totals.filter((t) => t.goals === max).map((t) => t.code),
        ready,
        note: `Top: ${totals.filter((t) => t.goals === max).map((t) => `Group ${t.code} (${max})`).join(", ")}.`,
      });
    }
  }

  // Q8 / Q9 — UEFA teams reaching the R32 / R16 (from knockout fixtures).
  const uefaIds = new Set(teams.filter((t) => t.confederation === "UEFA").map((t) => t.id));
  const countUefaIn = (stage: "R32" | "R16") => {
    const ids = new Set<string>();
    for (const m of matches.filter((x) => x.stage === stage)) {
      if (uefaIds.has(m.homeTeamId)) ids.add(m.homeTeamId);
      if (uefaIds.has(m.awayTeamId)) ids.add(m.awayTeamId);
    }
    return ids.size;
  };
  const r32Matches = matches.filter((m) => m.stage === "R32");
  if (r32Matches.length >= 16) {
    const n = countUefaIn("R32");
    out.set(8, {
      questionNo: 8,
      answers: [n <= 13 ? "13 or less" : String(n)],
      ready: true,
      note: `${n} UEFA team(s) in the round of 32.`,
    });
  }
  const r16Matches = matches.filter((m) => m.stage === "R16");
  if (r16Matches.length >= 8) {
    const n = countUefaIn("R16");
    out.set(9, {
      questionNo: 9,
      answers: [n <= 7 ? "7 or less" : n >= 10 ? "10 or more" : String(n)],
      ready: true,
      note: `${n} UEFA team(s) in the round of 16.`,
    });
  }

  // Q10 — combined goals by the three hosts across the whole tournament.
  {
    const hostIds = teams.filter((t) => t.isHost).map((t) => t.id);
    const total = hostIds.reduce((s, id) => s + teamGoals(matches, id), 0);
    const finalPlayed = matches.some((m) => m.stage === "FINAL" && isPlayed(m));
    if (total > 0 || finalPlayed) {
      out.set(10, {
        questionNo: 10,
        answers: [total <= 7 ? "7 or less" : total <= 11 ? "8-11" : "12+"],
        ready: finalPlayed,
        note: `${total} host goal(s) so far. Final only once the tournament ends.`,
      });
    }
  }

  // Q11 — Golden Boot: top scorer(s) by goals (FIFA tiebreaks are a judgement call).
  {
    const tally = new Map<string, { display: string; goals: number }>();
    for (const m of matches.filter(isPlayed)) {
      for (const g of countedGoals(m)) {
        if (g.isOwnGoal) continue;
        const key = normaliseName(g.scorerName);
        const cur = tally.get(key);
        tally.set(key, { display: cur?.display ?? g.scorerName, goals: (cur?.goals ?? 0) + 1 });
      }
    }
    const finalPlayed = matches.some((m) => m.stage === "FINAL" && isPlayed(m));
    if (tally.size) {
      const max = Math.max(...[...tally.values()].map((t) => t.goals));
      const top = [...tally.values()].filter((t) => t.goals === max);
      out.set(11, {
        questionNo: 11,
        answers: top.map((t) => t.display),
        ready: false, // FIFA applies assist/minutes tiebreaks — always confirm manually
        note: `Top scorer(s): ${top.map((t) => `${t.display} (${t.goals})`).join(", ")}${finalPlayed ? "" : " — tournament still running"}. FIFA tiebreaks (assists, minutes) are not applied automatically.`,
      });
    }
  }

  // Q12 — World Cup winner.
  {
    const final = matches.find((m) => m.stage === "FINAL");
    const winnerId = final ? matchWinner(final) : null;
    if (winnerId) {
      const winner = teams.find((t) => t.id === winnerId);
      if (winner) {
        out.set(12, {
          questionNo: 12,
          answers: [winner.name],
          ready: true,
          note: "From the final's result.",
        });
      }
    }
  }

  return out;
}
