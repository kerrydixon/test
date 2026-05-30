// Computes a group's finishing order from played group-stage matches.
// Tiebreakers: points -> goal difference -> goals for -> name (stable fallback).
// The organiser can always override the official order (GroupStandingOverride).

import type { ScoringMatch, ScoringTeam } from "./types";
import { isPlayed } from "./match-utils";

export interface GroupRow {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export function computeGroupTable(
  groupCode: string,
  teams: ScoringTeam[],
  matches: ScoringMatch[],
): GroupRow[] {
  const groupTeams = teams.filter((t) => t.groupCode === groupCode);
  const rows = new Map<string, GroupRow>();
  for (const t of groupTeams) {
    rows.set(t.id, {
      teamId: t.id,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    });
  }

  const groupMatches = matches.filter(
    (m) => m.stage === "GROUP" && m.groupCode === groupCode && isPlayed(m),
  );

  for (const m of groupMatches) {
    const home = rows.get(m.homeTeamId);
    const away = rows.get(m.awayTeamId);
    if (!home || !away) continue;
    const hg = m.homeGoals as number;
    const ag = m.awayGoals as number;

    home.played++;
    away.played++;
    home.goalsFor += hg;
    home.goalsAgainst += ag;
    away.goalsFor += ag;
    away.goalsAgainst += hg;

    if (hg > ag) {
      home.won++;
      away.lost++;
      home.points += 3;
    } else if (hg < ag) {
      away.won++;
      home.lost++;
      away.points += 3;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += 1;
      away.points += 1;
    }
  }

  const nameById = new Map(groupTeams.map((t) => [t.id, t.name] as const));
  return [...rows.values()]
    .map((r) => ({ ...r, goalDifference: r.goalsFor - r.goalsAgainst }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference)
        return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return (nameById.get(a.teamId) ?? "").localeCompare(
        nameById.get(b.teamId) ?? "",
      );
    });
}
