// Part 3 — predict the teams to finish 1st, 2nd and 3rd (in order) in each group.
//
// The "accuracy code" is built from the ACTUAL top three: for each of the actual
// 1st/2nd/3rd teams we write the rank the entrant PREDICTED for that team
// ("1"/"2"/"3"), or "X" if the entrant did not place that team in their top three.
// The code is then looked up in the brief's 24-row matrix; any code not present
// (i.e. two or more "X"s) scores 0.

export const PART3_MATRIX: Record<string, number> = {
  "123": 200,
  "132": 140,
  "213": 138,
  "321": 132,
  "12X": 130,
  "1X3": 125,
  "231": 120,
  "312": 120,
  X23: 100,
  "1X2": 100,
  "13X": 98,
  X21: 90,
  X13: 90,
  "21X": 85,
  "2X3": 80,
  X12: 80,
  "2X1": 80,
  "23X": 75,
  "32X": 70,
  X31: 65,
  "31X": 65,
  "3X1": 60,
  X32: 58,
  "3X2": 55,
};

export const PART3_MAX_PER_GROUP = 200;

export interface ActualTop3 {
  firstTeamId: string;
  secondTeamId: string;
  thirdTeamId: string;
}

export interface PredictionTop3 {
  firstTeamId: string;
  secondTeamId: string;
  thirdTeamId: string;
}

/** Predicted rank ("1"/"2"/"3") of a team, or "X" if not in the entrant's top three. */
function predictedRank(prediction: PredictionTop3, teamId: string): string {
  if (teamId === prediction.firstTeamId) return "1";
  if (teamId === prediction.secondTeamId) return "2";
  if (teamId === prediction.thirdTeamId) return "3";
  return "X";
}

export function accuracyCode(
  prediction: PredictionTop3,
  actual: ActualTop3,
): string {
  return (
    predictedRank(prediction, actual.firstTeamId) +
    predictedRank(prediction, actual.secondTeamId) +
    predictedRank(prediction, actual.thirdTeamId)
  );
}

export interface Part3GroupResult {
  groupCode: string;
  code: string;
  points: number;
}

export function scoreGroupPrediction(
  groupCode: string,
  prediction: PredictionTop3,
  actual: ActualTop3,
): Part3GroupResult {
  const code = accuracyCode(prediction, actual);
  return { groupCode, code, points: PART3_MATRIX[code] ?? 0 };
}
