import { describe, expect, it } from "vitest";
import { scorePart2 } from "./part2";
import { scorePart4 } from "./part4";
import { computeGroupTable } from "./group-table";
import { buildLeaderboard, type WorldState } from "./index";
import type { ScoringMatch, ScoringTeam } from "./types";

describe("Part 2 questions", () => {
  it("scores 200 per correct answer and supports tie answer sets", () => {
    const official = { 1: ["A"], 7: ["C", "F"] }; // Q7 tie: both C and F correct
    const r = scorePart2({ 1: "A", 7: "F", 2: "B" }, official);
    expect(r.perQuestion.find((q) => q.questionNo === 1)!.points).toBe(200);
    expect(r.perQuestion.find((q) => q.questionNo === 7)!.points).toBe(200);
    expect(r.perQuestion.find((q) => q.questionNo === 2)!.points).toBe(0);
    expect(r.total).toBe(400);
  });

  it("matches answers case-insensitively", () => {
    const r = scorePart2({ 11: "harry KANE" }, { 11: ["Harry Kane"] });
    expect(r.total).toBe(200);
  });
});

function finishedKO(id: string, home: string, away: string, hg: number, ag: number, shootoutWinner?: string): ScoringMatch {
  return {
    id,
    stage: "R32",
    groupCode: null,
    homeTeamId: home,
    awayTeamId: away,
    status: "FINISHED",
    homeGoals: hg,
    awayGoals: ag,
    wentToExtraTime: !!shootoutWinner,
    shootoutWinnerTeamId: shootoutWinner ?? null,
    goals: [],
  };
}

describe("Part 4 knockouts", () => {
  it("awards 250 for a correct winner, including shoot-out winners", () => {
    const matches = [
      finishedKO("k1", "BRA", "GHA", 3, 1),
      finishedKO("k2", "ESP", "ITA", 1, 1, "ITA"),
    ];
    const r = scorePart4(
      [
        { matchId: "k1", predictedTeamId: "BRA" },
        { matchId: "k2", predictedTeamId: "ESP" }, // wrong, ITA won on pens
      ],
      matches,
    );
    expect(r.total).toBe(250);
  });
});

describe("group table", () => {
  it("ranks by points then goal difference", () => {
    const teams: ScoringTeam[] = [
      { id: "T1", name: "T1", groupCode: "A" },
      { id: "T2", name: "T2", groupCode: "A" },
      { id: "T3", name: "T3", groupCode: "A" },
    ];
    const matches: ScoringMatch[] = [
      { id: "g1", stage: "GROUP", groupCode: "A", homeTeamId: "T1", awayTeamId: "T2", status: "FINISHED", homeGoals: 3, awayGoals: 0, wentToExtraTime: false, shootoutWinnerTeamId: null, goals: [] },
      { id: "g2", stage: "GROUP", groupCode: "A", homeTeamId: "T1", awayTeamId: "T3", status: "FINISHED", homeGoals: 1, awayGoals: 1, wentToExtraTime: false, shootoutWinnerTeamId: null, goals: [] },
      { id: "g3", stage: "GROUP", groupCode: "A", homeTeamId: "T2", awayTeamId: "T3", status: "FINISHED", homeGoals: 2, awayGoals: 2, wentToExtraTime: false, shootoutWinnerTeamId: null, goals: [] },
    ];
    const table = computeGroupTable("A", teams, matches);
    expect(table[0].teamId).toBe("T1"); // 4 pts, +3 GD
    expect(table[0].points).toBe(4);
  });
});

describe("buildLeaderboard", () => {
  it("ranks entrants by total points", () => {
    const teams: ScoringTeam[] = [
      { id: "A", name: "A", groupCode: "G1" },
      { id: "B", name: "B", groupCode: "G1" },
    ];
    const matches: ScoringMatch[] = [
      { id: "m", stage: "GROUP", groupCode: "G1", homeTeamId: "A", awayTeamId: "B", status: "FINISHED", homeGoals: 1, awayGoals: 0, wentToExtraTime: false, shootoutWinnerTeamId: null, goals: [{ teamId: "A", scorerName: "Star", assistName: null, minute: 5, isOwnGoal: false, isExtraTime: false, isShootout: false }] },
    ];
    const world: WorldState = { teams, matches, officialPart2: { 1: ["yes"] } };

    const board = buildLeaderboard(
      [
        { id: "e1", name: "Alice", fantasy: { teamIds: ["A", "B"], scorerNames: ["Star"] }, part2Answers: { 1: "yes" }, groupPredictions: [], knockoutPredictions: [] },
        { id: "e2", name: "Bob", fantasy: { teamIds: ["B", "A"], scorerNames: ["Nobody"] }, part2Answers: { 1: "no" }, groupPredictions: [], knockoutPredictions: [] },
      ],
      world,
    );

    expect(board[0].name).toBe("Alice");
    expect(board[0].total).toBeGreaterThan(board[1].total);
  });
});
