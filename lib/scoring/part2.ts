// Part 2 — 12 World Cup specific questions, 200 points each.
// The organiser records the official answer(s) per question. Some questions allow
// ties (Q3, Q7, Q11), so each official answer is a set: an entrant scores if their
// answer is a member of that set. Matching ignores case, accents, punctuation and
// extra spaces so free-text answers ("Mbappé, France" vs "Mbappe (France)") are
// forgiving.

import type { Part2OfficialAnswers } from "./types";
import { normaliseName as normalise } from "./names";

export const PART2_POINTS_PER_QUESTION = 200;
export const PART2_QUESTION_NUMBERS = Array.from({ length: 12 }, (_, i) => i + 1);

export interface Part2Breakdown {
  total: number;
  perQuestion: { questionNo: number; correct: boolean; points: number }[];
}

export function scorePart2(
  entrantAnswers: Record<number, string | undefined>,
  official: Part2OfficialAnswers,
): Part2Breakdown {
  const perQuestion = PART2_QUESTION_NUMBERS.map((questionNo) => {
    const given = entrantAnswers[questionNo];
    const acceptable = official[questionNo] ?? [];
    const correct =
      !!given &&
      acceptable.some((a) => normalise(a) === normalise(given));
    return {
      questionNo,
      correct,
      points: correct ? PART2_POINTS_PER_QUESTION : 0,
    };
  });

  return {
    total: perQuestion.reduce((s, q) => s + q.points, 0),
    perQuestion,
  };
}
