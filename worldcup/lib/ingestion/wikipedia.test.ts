import { describe, expect, it } from "vitest";
import { parseFootballBoxes } from "./providers/wikipedia";

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
