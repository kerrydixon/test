import { describe, expect, it } from "vitest";
import { scorePart1 } from "./part1";
import { normaliseName } from "./names";
import type { ScoringMatch } from "./types";

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

// Curated scorer stats, keyed by normalised name (as scorePart1 expects).
function ss(entries: Record<string, { goals: number; assists: number }>) {
  return new Map(Object.entries(entries).map(([k, v]) => [normaliseName(k), v]));
}

describe("Part 1 team goals come from the scoreline", () => {
  it("uses homeGoals/awayGoals, not the count of goal events", () => {
    const m = match({ id: "m1", homeTeamId: "FRA", awayTeamId: "GER", homeGoals: 2, awayGoals: 1 });
    const result = scorePart1({ teamIds: ["FRA", "ZZZ"], scorerNames: [] }, [m]);
    // FRA: win 250 + 2 goals*150 - 1 conceded*100 = 450
    expect(result.perTeam[0].goalsFor).toBe(2);
    expect(result.perTeam[0].goalsAgainst).toBe(1);
    expect(result.teamPoints).toBe(450);
  });

  it("a shoot-out winner counts as a win; scoreline excludes shoot-out goals", () => {
    const m = match({
      id: "m3", stage: "R16", groupCode: null, homeTeamId: "A", awayTeamId: "B",
      homeGoals: 1, awayGoals: 1, wentToExtraTime: true, shootoutWinnerTeamId: "A",
    });
    const result = scorePart1({ teamIds: ["A", "ZZZ"], scorerNames: [] }, [m]);
    // A: win 250 + 1*150 - 1*100 = 300
    expect(result.perTeam[0].total).toBe(300);
  });
});

describe("Part 1 scorer goals/assists come from the curated table", () => {
  const m = match({ id: "m1", homeTeamId: "FRA", awayTeamId: "GER", homeGoals: 2, awayGoals: 1 });

  it("awards 150 per goal and 75 per assist from ScorerStat", () => {
    const result = scorePart1(
      { teamIds: ["FRA", "ZZZ"], scorerNames: ["Mbappe", "Griezmann", "Giroud", "X"] },
      [m],
      ss({ Mbappe: { goals: 1, assists: 0 }, Griezmann: { goals: 0, assists: 1 }, Giroud: { goals: 1, assists: 0 } }),
    );
    // Mbappe 150, Griezmann assist 75, Giroud 150, X nothing = 375
    expect(result.scorerPoints).toBe(375);
    expect(result.perScorer.find((s) => s.name === "X")!.points).toBe(0);
  });

  it("disambiguates two same-surname players (Brahim vs Luis Diaz)", () => {
    const stats = ss({ "Brahim Diaz": { goals: 0, assists: 1 }, "Luis Diaz": { goals: 1, assists: 0 } });
    const brahim = scorePart1({ teamIds: ["A", "B"], scorerNames: ["Brahim Diaz"] }, [m], stats);
    const luis = scorePart1({ teamIds: ["A", "B"], scorerNames: ["Luis Diaz"] }, [m], stats);
    expect(brahim.perScorer[0]).toMatchObject({ goals: 0, assists: 1, points: 75 });
    expect(luis.perScorer[0]).toMatchObject({ goals: 1, assists: 0, points: 150 });
  });

  it("gives a picked player with no stats zero", () => {
    const result = scorePart1({ teamIds: ["A", "B"], scorerNames: ["Unknown"] }, [m], ss({}));
    expect(result.scorerPoints).toBe(0);
  });
});
