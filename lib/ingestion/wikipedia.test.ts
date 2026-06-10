import { describe, expect, it } from "vitest";
import { classifyHeading, parseFootballBoxes } from "./providers/wikipedia";

const FIXTURE = `
<table class="footballbox" data-group="A" data-stage="GROUP" data-ref="GRP-A-1">
  <tr>
    <th class="fhome">Mexico</th>
    <th class="fscore"><a href="/x">2–1</a></th>
    <th class="faway">South Africa</th>
  </tr>
  <tr>
    <td class="fgoals fhgoal">Martín 23'<br>Núñez 55', 67'</td>
    <td></td>
    <td class="fgoals fagoal">Mokoena 80' (o.g.)</td>
  </tr>
</table>
<table class="footballbox" data-group="A" data-stage="GROUP">
  <tr>
    <th class="fhome">South Korea</th>
    <th class="fscore"><a href="/y">v</a></th>
    <th class="faway">Czechia</th>
  </tr>
  <tr>
    <td class="fgoals fhgoal"></td>
    <td></td>
    <td class="fgoals fagoal"></td>
  </tr>
</table>
`;

describe("Wikipedia footballbox parser", () => {
  const matches = parseFootballBoxes(FIXTURE);

  it("parses both matches", () => {
    expect(matches).toHaveLength(2);
  });

  it("reads the finished match score and external ref", () => {
    const m = matches[0];
    expect(m.externalRef).toBe("GRP-A-1");
    expect(m.status).toBe("FINISHED");
    expect(m.homeGoals).toBe(2);
    expect(m.awayGoals).toBe(1);
    expect(m.groupCode).toBe("A");
  });

  it("extracts goals including a multi-minute line and an own goal", () => {
    const m = matches[0];
    // Martín 1, Núñez 2 (two minutes), Mokoena own goal = 4 goal rows
    expect(m.goals).toHaveLength(4);
    const nunez = m.goals!.filter((g) => g.scorerName === "Núñez");
    expect(nunez).toHaveLength(2);
    const own = m.goals!.find((g) => g.isOwnGoal);
    expect(own?.teamName).toBe("South Africa"); // listed under the away (benefiting) side
    expect(own?.scorerName).toBe("Mokoena");
  });

  it("marks an unplayed match as scheduled with no goals", () => {
    const m = matches[1];
    expect(m.status).toBe("SCHEDULED");
    expect(m.homeGoals ?? null).toBeNull();
    expect(m.goals).toHaveLength(0);
  });
});

describe("heading-context stage/group detection", () => {
  it("classifies headings into stages", () => {
    expect(classifyHeading("Group C")?.stage).toBe("GROUP");
    expect(classifyHeading("Group C")?.group).toBe("C");
    expect(classifyHeading("Round of 32")?.stage).toBe("R32");
    expect(classifyHeading("Round of 16")?.stage).toBe("R16");
    expect(classifyHeading("Quarter-finals")?.stage).toBe("QF");
    expect(classifyHeading("Semi-finals")?.stage).toBe("SF");
    expect(classifyHeading("Final")?.stage).toBe("FINAL");
    expect(classifyHeading("Third place play-off")?.stage).toBe("SKIP");
    expect(classifyHeading("Bracket")).toBeNull();
  });

  const PAGE = `
    <h3>Round of 32</h3>
    <table class="footballbox">
      <tr><th class="fhome">Brazil</th><th class="fscore"><a>3–1</a></th><th class="faway">Ghana</th></tr>
      <tr><td class="fgoals fhgoal">Vinicius 10'</td><td></td><td class="fgoals fagoal">Kudus 80'</td></tr>
    </table>
    <h3>Third place play-off</h3>
    <table class="footballbox">
      <tr><th class="fhome">Spain</th><th class="fscore"><a>2–0</a></th><th class="faway">Portugal</th></tr>
      <tr><td class="fgoals fhgoal"></td><td></td><td class="fgoals fagoal"></td></tr>
    </table>
    <h3>Final</h3>
    <table class="footballbox">
      <tr><th class="fhome">France</th><th class="fscore"><a>1–1 (a.e.t.) (4–2 p)</a></th><th class="faway">Argentina</th></tr>
      <tr><td class="fgoals fhgoal">Mbappé 105'</td><td></td><td class="fgoals fagoal">Messi 90'</td></tr>
    </table>
  `;
  const parsed = parseFootballBoxes(PAGE);

  it("tags knockout matches by stage and skips the third-place game", () => {
    expect(parsed.map((m) => `${m.stage}:${m.homeTeamName}`)).toEqual([
      "R32:Brazil",
      "FINAL:France",
    ]);
  });

  it("reads a shoot-out winner and extra time from the final's score", () => {
    const final = parsed.find((m) => m.stage === "FINAL")!;
    expect(final.homeGoals).toBe(1);
    expect(final.awayGoals).toBe(1);
    expect(final.shootoutWinnerName).toBe("France"); // 4–2 on pens
    expect(final.wentToExtraTime).toBe(true);
    expect(final.goals!.find((g) => g.scorerName === "Mbappé")!.isExtraTime).toBe(true);
  });
});
