import type { MatchOutcome, ScoringMatch } from "./types";

/** Has this match got a usable final result yet? */
export function isPlayed(m: ScoringMatch): boolean {
  return m.status === "FINISHED" && m.homeGoals !== null && m.awayGoals !== null;
}

/**
 * Result of the match for the given team, determined at the END of the game
 * (after extra time and any penalty shoot-out), per the Part 1 rules.
 * Returns null if the match has not finished.
 */
export function outcomeForTeam(
  m: ScoringMatch,
  teamId: string,
): MatchOutcome | null {
  if (!isPlayed(m)) return null;
  const isHome = teamId === m.homeTeamId;
  const isAway = teamId === m.awayTeamId;
  if (!isHome && !isAway) return null;

  const home = m.homeGoals as number;
  const away = m.awayGoals as number;
  const mine = isHome ? home : away;
  const theirs = isHome ? away : home;

  if (mine > theirs) return "WIN";
  if (mine < theirs) return "LOSS";

  // Level after extra time. A penalty shoot-out winner (knockouts) decides it;
  // otherwise (group stage) it's a draw.
  if (m.shootoutWinnerTeamId) {
    return m.shootoutWinnerTeamId === teamId ? "WIN" : "LOSS";
  }
  return "DRAW";
}

/** Counted goals exclude shoot-out goals but include extra-time goals. */
export function countedGoals(m: ScoringMatch) {
  return m.goals.filter((g) => !g.isShootout);
}

/** Goals a team is credited with (own goals in their favour included). */
export function goalsForTeam(m: ScoringMatch, teamId: string): number {
  return countedGoals(m).filter((g) => g.teamId === teamId).length;
}

/** Goals a team concedes = counted goals credited to the opponent. */
export function goalsAgainstTeam(m: ScoringMatch, teamId: string): number {
  const opponentId = teamId === m.homeTeamId ? m.awayTeamId : m.homeTeamId;
  return countedGoals(m).filter((g) => g.teamId === opponentId).length;
}

/**
 * A team's goals FROM THE SCORELINE (homeGoals/awayGoals). This is the reliable
 * figure for Part 1 team points — it already includes own goals in their favour
 * and never disagrees with the displayed result, unlike counting goal events.
 */
export function scoreForTeam(m: ScoringMatch, teamId: string): number {
  if (!isPlayed(m)) return 0;
  return (teamId === m.homeTeamId ? m.homeGoals : m.awayGoals) ?? 0;
}

export function scoreAgainstTeam(m: ScoringMatch, teamId: string): number {
  if (!isPlayed(m)) return 0;
  return (teamId === m.homeTeamId ? m.awayGoals : m.homeGoals) ?? 0;
}

/** Matches involving a team that have a result, sorted defensively. */
export function teamMatches(
  matches: ScoringMatch[],
  teamId: string,
): ScoringMatch[] {
  return matches.filter(
    (m) => m.homeTeamId === teamId || m.awayTeamId === teamId,
  );
}
