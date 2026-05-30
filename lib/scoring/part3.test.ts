import { describe, expect, it } from "vitest";
import { accuracyCode, scoreGroupPrediction, PART3_MATRIX } from "./part3";

// Using the brief's Group L worked example.
// Prediction: Croatia (1st), England (2nd), Panama (3rd).
const prediction = {
  firstTeamId: "Croatia",
  secondTeamId: "England",
  thirdTeamId: "Panama",
};

describe("Part 3 accuracy code", () => {
  it("exact order scores 123 -> 200", () => {
    const actual = {
      firstTeamId: "Croatia",
      secondTeamId: "England",
      thirdTeamId: "Panama",
    };
    expect(accuracyCode(prediction, actual)).toBe("123");
    expect(scoreGroupPrediction("L", prediction, actual).points).toBe(200);
  });

  it("brief example: England 1st, Croatia 2nd, Ghana 3rd -> 21X -> 85", () => {
    const actual = {
      firstTeamId: "England",
      secondTeamId: "Croatia",
      thirdTeamId: "Ghana",
    };
    expect(accuracyCode(prediction, actual)).toBe("21X");
    expect(scoreGroupPrediction("L", prediction, actual).points).toBe(85);
  });

  it("none of the predicted teams in top three scores 0", () => {
    const actual = {
      firstTeamId: "Ghana",
      secondTeamId: "Wales",
      thirdTeamId: "Italy",
    };
    expect(scoreGroupPrediction("L", prediction, actual).points).toBe(0);
  });

  it("matrix has exactly 24 entries and 200 is the maximum", () => {
    const values = Object.values(PART3_MATRIX);
    expect(values).toHaveLength(24);
    expect(Math.max(...values)).toBe(200);
  });
});
