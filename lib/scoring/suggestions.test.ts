import { describe, expect, it } from "vitest";
import { normaliseName, namesMatch } from "./names";
import { scorePart1 } from "./part1";
import { scorePart2 } from "./part2";
import { suggestAnswers, type SuggestionMatch, type SuggestionTeam } from "./suggestions";

describe("name normalisation", () => {
  it("matches across accents, case, punctuation and spacing", () => {
    expect(namesMatch("Mbappé", "mbappe")).toBe(true);
    expect(namesMatch("Mbappé, France", "Mbappe (France)")).toBe(true);
    expect(namesMatch(" Harry  Kane ", "harry kane")).toBe(true);
    expect(namesMatch("Kane", "Yamal")).toBe(false);
  });

  it("is used for scorer matching in Part 1", () => {
    const match: SuggestionMatch = base({
      id: "m",
      homeTeamId: "A",
      awayTeamId: "B",
      status: "FINISHED",
      homeGoals: 1,
      awayGoals: 0,
      goals: [goal("A", "Kylian Mbappé")],
    });
    const r = scorePart1(
      { teamIds: ["X", "Y"], scorerNames: ["kylian mbappe"] },
      [match],
    );
    expect(r.perScorer[0].points).toBe(150);
  });

  it("is used for Part 2 answer matching", () => {
    const r = scorePart2({ 11: "Mbappé, France" }, { 11: ["Mbappe (France)"] });
    expect(r.total).toBe(200);
  });

  it("normalises to a comparable key", () => {
    expect(normaliseName("Vinícius Jr.")).toBe(normaliseName("vinicius jr"));
  });
});

function goal(teamId: string, scorerName: string, minute = 10, extra: Partial<SuggestionMatch["goals"][0]> = {}) {
  return { teamId, scorerName, assistName: null, minute, isOwnGoal: false, isExtraTime: false, isShootout: false, ...extra };
}

function base(p: Partial<SuggestionMatch> & { id: string; homeTeamId: string; awayTeamId: string }): SuggestionMatch {
  return {
    stage: "GROUP",
    groupCode: "A",
    status: "FINISHED",
    homeGoals: 0,
    awayGoals: 0,
    wentToExtraTime: false,
    shootoutWinnerTeamId: null,
    goals: [],
    kickoff: null,
    externalRef: null,
    ...p,
  };
}

describe("Part 2 answer suggestions", () => {
  const teams: SuggestionTeam[] = [
    { id: "USA", name: "USA", groupCode: "D", isHost: true, confederation: "CONCACAF" },
    { id: "PAR", name: "Paraguay", groupCode: "D", isHost: false, confederation: "CONMEBOL" },
    { id: "AUS", name: "Australia", groupCode: "D", isHost: false, confederation: "AFC" },
    { id: "TUR", name: "Turkiye", groupCode: "D", isHost: false, confederation: "UEFA" },
  ];

  it("derives Q1 from the USA v Paraguay result", () => {
    const matches: SuggestionMatch[] = [
      base({ id: "m1", groupCode: "D", homeTeamId: "USA", awayTeamId: "PAR", homeGoals: 2, awayGoals: 0, goals: [goal("USA", "Pulisic", 12), goal("USA", "Reyna", 70)] }),
    ];
    const s = suggestAnswers(teams, matches);
    expect(s.get(1)?.answers).toEqual(["USA win"]);
  });

  it("derives Q7 group goal totals and Q10 host goals", () => {
    const matches: SuggestionMatch[] = [
      base({ id: "m1", groupCode: "D", homeTeamId: "USA", awayTeamId: "PAR", homeGoals: 3, awayGoals: 1, goals: [goal("USA", "Pulisic"), goal("USA", "Reyna"), goal("USA", "Balogun"), goal("PAR", "Almiron")] }),
    ];
    const s = suggestAnswers(teams, matches);
    expect(s.get(7)?.answers).toEqual(["D"]);
    expect(s.get(10)?.answers).toEqual(["7 or less"]); // 3 host goals so far
    expect(s.get(10)?.ready).toBe(false); // tournament not finished
  });

  it("derives Q12 from the final, including a shoot-out winner", () => {
    const matches: SuggestionMatch[] = [
      base({ id: "f", stage: "FINAL", groupCode: null, homeTeamId: "USA", awayTeamId: "PAR", homeGoals: 1, awayGoals: 1, wentToExtraTime: true, shootoutWinnerTeamId: "PAR" }),
    ];
    const s = suggestAnswers(teams, matches);
    expect(s.get(12)?.answers).toEqual(["Paraguay"]);
  });

  it("suggests tied top scorers for Q11 as multiple answers", () => {
    const matches: SuggestionMatch[] = [
      base({ id: "m1", groupCode: "D", homeTeamId: "USA", awayTeamId: "PAR", homeGoals: 2, awayGoals: 2, goals: [goal("USA", "Pulisic"), goal("USA", "Pulisic", 30), goal("PAR", "Almiron"), goal("PAR", "Almiron", 80)] }),
    ];
    const s = suggestAnswers(teams, matches);
    expect(new Set(s.get(11)?.answers)).toEqual(new Set(["Pulisic", "Almiron"]));
    expect(s.get(11)?.ready).toBe(false); // always needs human confirmation
  });
});
