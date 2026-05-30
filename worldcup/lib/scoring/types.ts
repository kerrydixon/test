// Plain, database-independent types consumed by the scoring engine.
// Prisma rows are mapped into these shapes (see lib/scoring/adapter.ts) so the
// engine stays pure and unit-testable without a database.

export type Stage = "GROUP" | "R32" | "R16" | "QF" | "SF" | "FINAL";
export type MatchStatus = "SCHEDULED" | "LIVE" | "FINISHED";

export interface ScoringGoal {
  /** Team the goal counts FOR. For own goals this is the *benefiting* team. */
  teamId: string;
  /** Name of the player who physically took the shot (own-goal scorer included). */
  scorerName: string;
  assistName?: string | null;
  minute: number;
  isOwnGoal: boolean;
  isExtraTime: boolean;
  /** Penalty shoot-out goal — excluded from all points (brief Note 1). */
  isShootout: boolean;
}

export interface ScoringMatch {
  id: string;
  stage: Stage;
  groupCode: string | null;
  homeTeamId: string;
  awayTeamId: string;
  status: MatchStatus;
  /** Final score after extra time, excluding shoot-out (null until played). */
  homeGoals: number | null;
  awayGoals: number | null;
  wentToExtraTime: boolean;
  /** Set when a drawn knockout match is decided on penalties. */
  shootoutWinnerTeamId: string | null;
  goals: ScoringGoal[];
}

export interface ScoringTeam {
  id: string;
  name: string;
  groupCode: string | null;
}

export type MatchOutcome = "WIN" | "DRAW" | "LOSS";

export interface FantasyEntry {
  teamIds: string[]; // exactly 2
  scorerNames: string[]; // >= 5
}

export interface GroupPredictionEntry {
  groupCode: string;
  firstTeamId: string;
  secondTeamId: string;
  thirdTeamId: string;
}

export interface KnockoutPredictionEntry {
  matchId: string;
  predictedTeamId: string;
}

export interface Part2OfficialAnswers {
  // questionNo (1-12) -> set of acceptable answers (ties allow several)
  [questionNo: number]: string[];
}
