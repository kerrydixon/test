// Source-agnostic shapes produced by a results provider, before they are mapped
// onto our database rows by sync().

import type { Stage, MatchStatus } from "@/lib/scoring/types";

export interface RawGoal {
  /** Name of the team the goal counts FOR (benefiting team for own goals). */
  teamName: string;
  scorerName: string;
  assistName?: string | null;
  minute: number;
  isOwnGoal: boolean;
  isExtraTime: boolean;
  isShootout: boolean;
}

export interface RawMatch {
  /** Stable identifier from the source so repeated syncs update the same match. */
  externalRef: string;
  stage: Stage;
  groupCode?: string | null;
  homeTeamName: string;
  awayTeamName: string;
  kickoff?: string | null;
  status: MatchStatus;
  homeGoals?: number | null;
  awayGoals?: number | null;
  wentToExtraTime?: boolean;
  shootoutWinnerName?: string | null;
  goals?: RawGoal[];
}

export interface ResultsProvider {
  name: string;
  fetchMatches(): Promise<RawMatch[]>;
}
