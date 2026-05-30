// Part 1 budget rules, enforced identically on the client (live form feedback)
// and the server (submission validation).
//
//  - Budget is exactly £5,300m and must be spent in full.
//  - Exactly TWO different teams.
//  - At least FIVE different goal-scorers; surplus buys extra scorers at £100m each.
//  => teamsCost + 100 * numScorers === 5300, with numScorers >= 5.
//     This makes two £2,500m teams invalid (only £300m / 3 scorers left).

export const TOTAL_BUDGET = 5300; // £m
export const SCORER_PRICE = 100; // £m each
export const MIN_SCORERS = 5;
export const REQUIRED_TEAMS = 2;

export interface FantasySelectionInput {
  teamPrices: number[]; // price tier of each selected team
  scorerNames: string[];
}

export interface FantasyValidation {
  valid: boolean;
  errors: string[];
  teamsCost: number;
  spent: number;
  remaining: number;
  /** Exact number of scorers needed to spend the budget given the chosen teams. */
  requiredScorers: number | null;
}

export function validateFantasy(
  input: FantasySelectionInput,
): FantasyValidation {
  const errors: string[] = [];
  const teamsCost = input.teamPrices.reduce((s, p) => s + p, 0);
  const numScorers = input.scorerNames.length;
  const distinctScorers = new Set(
    input.scorerNames.map((n) => n.trim().toLowerCase()),
  ).size;
  const spent = teamsCost + numScorers * SCORER_PRICE;
  const remaining = TOTAL_BUDGET - spent;

  // How many scorers exactly fill the budget for the chosen teams.
  const budgetForScorers = TOTAL_BUDGET - teamsCost;
  const requiredScorers =
    budgetForScorers >= 0 && budgetForScorers % SCORER_PRICE === 0
      ? budgetForScorers / SCORER_PRICE
      : null;

  if (input.teamPrices.length !== REQUIRED_TEAMS) {
    errors.push(`You must pick exactly ${REQUIRED_TEAMS} different teams.`);
  }
  if (numScorers !== distinctScorers) {
    errors.push("Goal-scorers must all be different.");
  }
  if (distinctScorers < MIN_SCORERS) {
    errors.push(`You must name at least ${MIN_SCORERS} different goal-scorers.`);
  }
  if (requiredScorers !== null && requiredScorers < MIN_SCORERS) {
    errors.push(
      `These teams cost £${teamsCost}m, leaving room for only ${requiredScorers} scorers — pick cheaper teams.`,
    );
  }
  if (spent !== TOTAL_BUDGET) {
    errors.push(
      remaining > 0
        ? `You have £${remaining}m left to spend — add ${remaining / SCORER_PRICE} more scorer(s).`
        : `You are £${-remaining}m over budget — remove ${-remaining / SCORER_PRICE} scorer(s).`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    teamsCost,
    spent,
    remaining,
    requiredScorers,
  };
}
