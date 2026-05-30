import { describe, expect, it } from "vitest";
import { validateFantasy } from "./fantasy-budget";

describe("Part 1 budget validation", () => {
  it("accepts £2,500m + £2,300m teams with exactly 5 scorers", () => {
    const r = validateFantasy({ teamPrices: [2500, 2300], scorerNames: ["a", "b", "c", "d", "e"] });
    expect(r.valid).toBe(true);
    expect(r.spent).toBe(5300);
    expect(r.requiredScorers).toBe(5);
  });

  it("rejects two £2,500m teams (only room for 3 scorers)", () => {
    const r = validateFantasy({ teamPrices: [2500, 2500], scorerNames: ["a", "b", "c", "d", "e"] });
    expect(r.valid).toBe(false);
    expect(r.requiredScorers).toBe(3);
  });

  it("accepts two £1,800m teams with 17 scorers (full budget)", () => {
    const names = Array.from({ length: 17 }, (_, i) => `s${i}`);
    const r = validateFantasy({ teamPrices: [1800, 1800], scorerNames: names });
    expect(r.valid).toBe(true);
    expect(r.spent).toBe(5300);
  });

  it("flags under-spend and over-spend", () => {
    const under = validateFantasy({ teamPrices: [2500, 2300], scorerNames: ["a", "b", "c", "d"] });
    expect(under.valid).toBe(false);
    expect(under.remaining).toBe(100);

    const over = validateFantasy({ teamPrices: [2500, 2300], scorerNames: ["a", "b", "c", "d", "e", "f"] });
    expect(over.valid).toBe(false);
    expect(over.remaining).toBe(-100);
  });

  it("requires two teams and rejects duplicate scorers", () => {
    const oneTeam = validateFantasy({ teamPrices: [2100], scorerNames: ["a", "b", "c", "d", "e"] });
    expect(oneTeam.valid).toBe(false);

    const dup = validateFantasy({ teamPrices: [2500, 2300], scorerNames: ["a", "a", "c", "d", "e"] });
    expect(dup.valid).toBe(false);
  });
});
