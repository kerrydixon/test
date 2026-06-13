import { describe, expect, it } from "vitest";
import { scorePart1 } from "./part1";
import type { ScoringGoal, ScoringMatch } from "./types";

function goal(p: Partial<ScoringGoal> & { teamId: string; scorerName: string }): ScoringGoal {
  return {
    assistName: null,
    minute: 1,
    isOwnGoal: false,
    isExtraTime: false,
    isShootout: false,
    ...p,
  };
}

function match(p: Partial<ScoringMatch> & { id: string; homeTeamId: string; awayTeamId: string }): ScoringMatch {
  return {
    stage: "GROUP",
    groupCode: "A",
    status: "FINISHED",
    homeGoals: 0,
    awayGoals: 0,
    wentToExtraTime: false,
    shootoutWinnerTeamId: null,
    goals: [],
    ...p,
  };
}

describe("Part 1 fantasy scoring", () => {
  it("win + goals scored - conceded + scorer goals + assist", () => {
    const m = match({
      id: "m1",
      homeTeamId: "FRA",
      awayTeamId: "GER",
      homeGoals: 2,
      awayGoals: 1,
      goals: [
        goal({ teamId: "FRA", scorerName: "Mbappe", assistName: "Griezmann", minute: 10 }),
        goal({ teamId: "FRA", scorerName: "Giroud", minute: 50 }),
        goal({ teamId: "GER", scorerName: "Mueller", minute: 70 }),
      ],
    });

    const result = scorePart1(
      { teamIds: ["FRA", "ZZZ"], scorerNames: ["Mbappe", "Griezmann", "Giroud", "X", "Y"] },
      [m],
    );

    // FRA: win 250 + 2 goals*150 - 1 conceded*100 = 250 + 300 - 100 = 450
    expect(result.teamPoints).toBe(450);
    // Mbappe 150, Griezmann assist 75, Giroud 150
    expect(result.scorerPoints).toBe(375);
    expect(result.total).toBe(825);
  });

  it("own goals count for the benefiting team but not for the scorer", () => {
    const m = match({
      id: "m2",
      homeTeamId: "A",
      awayTeamId: "B",
      homeGoals: 2,
      awayGoals: 1,
      goals: [
        goal({ teamId: "A", scorerName: "APlayer" }),
        goal({ teamId: "A", scorerName: "BDefender", isOwnGoal: true }), // OG benefits A
        goal({ teamId: "B", scorerName: "BStriker" }),
      ],
    });

    const result = scorePart1(
      { teamIds: ["A", "ZZZ"], scorerNames: ["APlayer", "BDefender", "x", "y", "z"] },
      [m],
    );
    // A: win 250 + 2*150 - 1*100 = 450 (own goal counts in A's favour)
    expect(result.perTeam[0].goalsFor).toBe(2);
    expect(result.perTeam[0].total).toBe(450);
    // BDefender's own goal yields 0 scorer points; APlayer gets 150
    const apl = result.perScorer.find((s) => s.name === "APlayer")!;
    const bdef = result.perScorer.find((s) => s.name === "BDefender")!;
    expect(apl.points).toBe(150);
    expect(bdef.points).toBe(0);
  });

  it("shoot-out goals are excluded; shoot-out winner counts as a win", () => {
    const m = match({
      id: "m3",
      stage: "R16",
      groupCode: null,
      homeTeamId: "A",
      awayTeamId: "B",
      homeGoals: 1,
      awayGoals: 1,
      wentToExtraTime: true,
      shootoutWinnerTeamId: "A",
      goals: [
        goal({ teamId: "A", scorerName: "Striker", minute: 30 }),
        goal({ teamId: "B", scorerName: "Other", minute: 80 }),
        goal({ teamId: "A", scorerName: "Striker", isShootout: true }),
        goal({ teamId: "A", scorerName: "Striker", isShootout: true }),
      ],
    });

    const result = scorePart1(
      { teamIds: ["A", "ZZZ"], scorerNames: ["Striker", "a", "b", "c", "d"] },
      [m],
    );
    // A: win (shoot-out) 250 + 1 goal*150 - 1 conceded*100 = 300; shoot-out goals ignored
    expect(result.perTeam[0].total).toBe(300);
    // Striker: only the open-play goal counts = 150 (two shoot-out goals excluded)
    expect(result.perScorer.find((s) => s.name === "Striker")!.points).toBe(150);
  });
});

describe("Part 1 team goals come from the scoreline", () => {
  it("uses homeGoals/awayGoals, not the count of goal events", () => {
    // Score says 4-1 but only 2 USA goal events are recorded (imperfect feed).
    const m = match({
      id: "m4",
      homeTeamId: "USA",
      awayTeamId: "PAR",
      homeGoals: 4,
      awayGoals: 1,
      goals: [
        goal({ teamId: "USA", scorerName: "Pulisic" }),
        goal({ teamId: "USA", scorerName: "Reyna" }),
        goal({ teamId: "PAR", scorerName: "Almiron" }),
      ],
    });
    const r = scorePart1(
      { teamIds: ["USA", "ZZZ"], scorerNames: ["Pulisic", "a", "b", "c", "d"] },
      [m],
    );
    // USA: win 250 + 4 (scoreline) * 150 - 1 * 100 = 750
    expect(r.perTeam[0].goalsFor).toBe(4);
    expect(r.perTeam[0].goalsAgainst).toBe(1);
    expect(r.perTeam[0].total).toBe(750);
    // Scorer credit still comes from events: Pulisic got 1.
    expect(r.perScorer.find((s) => s.name === "Pulisic")!.goals).toBe(1);
  });
});
