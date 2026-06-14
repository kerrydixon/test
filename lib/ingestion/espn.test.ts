import { describe, expect, it } from "vitest";
import { parseEspnStats } from "./providers/espn";

// Representative ESPN "byathlete" shapes. parseEspnStats is tolerant of both the
// categories/totals layout and a flat statistics array.
describe("parseEspnStats", () => {
  it("reads goals/assists from categories aligned with top-level names", () => {
    const json = {
      categories: [{ name: "general", names: ["appearances", "goals", "assists"] }],
      athletes: [
        { athlete: { displayName: "Kylian Mbappé" }, categories: [{ name: "general", totals: ["3", "4", "2"] }] },
        { athlete: { displayName: "Jude Bellingham" }, categories: [{ name: "general", totals: ["3", "1", "3"] }] },
      ],
    };
    const players = parseEspnStats(json);
    expect(players).toEqual([
      { name: "Kylian Mbappé", goals: 4, assists: 2 },
      { name: "Jude Bellingham", goals: 1, assists: 3 },
    ]);
  });

  it("reads a flat statistics array", () => {
    const json = {
      athletes: [
        {
          athlete: { displayName: "Bukayo Saka" },
          statistics: [
            { name: "goals", value: 2 },
            { name: "assists", value: 5 },
          ],
        },
      ],
    };
    expect(parseEspnStats(json)).toEqual([{ name: "Bukayo Saka", goals: 2, assists: 5 }]);
  });

  it("returns nothing for an empty/unknown shape", () => {
    expect(parseEspnStats({})).toEqual([]);
    expect(parseEspnStats({ athletes: [] })).toEqual([]);
  });
});
