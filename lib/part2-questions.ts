// Part 2 — the 12 World Cup specific questions, exactly as worded in the brief.
// Each is worth 200 points. `options` drives the submission form; free-text questions
// (no options) let entrants type a player/team/group. The organiser records the
// official answer(s) per question for scoring.

export interface Part2Question {
  no: number;
  prompt: string;
  /** Fixed answer options; omit for free-text questions. */
  options?: { value: string; label: string }[];
  /** Whether ties can produce several official answers (Q3, Q7, Q11). */
  allowsTies?: boolean;
  /** Hint shown under free-text inputs. */
  placeholder?: string;
}

export const PART2_QUESTIONS: Part2Question[] = [
  {
    no: 1,
    prompt:
      "What will be the outcome of the first match between the USA (joint hosts) and Paraguay?",
    options: [
      { value: "USA win", label: "A) USA will win" },
      { value: "Draw", label: "B) Match will be drawn" },
      { value: "Paraguay win", label: "C) Paraguay will win" },
    ],
  },
  {
    no: 2,
    prompt:
      "Which top-seeded team will record the fastest goal in their opening game? (own goals discounted)",
    options: [
      { value: "France", label: "A) France" },
      { value: "Spain", label: "B) Spain" },
      { value: "Argentina", label: "C) Argentina" },
      { value: "England", label: "D) England" },
    ],
  },
  {
    no: 3,
    prompt:
      "Which top-four seeded team will score the most goals in their group-stage matches?",
    allowsTies: true,
    options: [
      { value: "France", label: "A) France" },
      { value: "Spain", label: "B) Spain" },
      { value: "Argentina", label: "C) Argentina" },
      { value: "England", label: "D) England" },
    ],
  },
  {
    no: 4,
    prompt: "Scotland play in Group C. What will their goal difference be after the group stage?",
    options: [
      { value: "Negative", label: "A) Negative" },
      { value: "Zero", label: "B) 0 (same scored as conceded)" },
      { value: "+1 or +2", label: "C) Positive by 1 or 2 goals" },
      { value: "+3 or more", label: "D) Positive by 3 goals or more" },
    ],
  },
  {
    no: 5,
    prompt: "England play in Group L. In what position will they finish the group stage?",
    options: [
      { value: "First", label: "A) First" },
      { value: "Second", label: "B) Second" },
      { value: "Third", label: "C) Third" },
      { value: "Fourth", label: "D) Fourth" },
    ],
  },
  {
    no: 6,
    prompt: "Germany play in Group E. How many different players will score for them in the group stage?",
    options: [
      { value: "0-2", label: "A) 0 – 2" },
      { value: "3-4", label: "B) 3 – 4" },
      { value: "5+", label: "C) 5 or more" },
    ],
  },
  {
    no: 7,
    prompt: "In which of the twelve groups will the highest number of goals be scored? (specify the group letter)",
    allowsTies: true,
    options: "ABCDEFGHIJKL".split("").map((g) => ({ value: g, label: `Group ${g}` })),
  },
  {
    no: 8,
    prompt:
      "How many of the 16 UEFA teams will progress from the group stage to the round of 32?",
    options: [
      { value: "13 or less", label: "A) 13 or less" },
      { value: "14", label: "B) 14" },
      { value: "15", label: "C) 15" },
      { value: "16", label: "D) 16" },
    ],
  },
  {
    no: 9,
    prompt:
      "How many of the 16 UEFA teams will progress from the round of 32 to the round of 16?",
    options: [
      { value: "7 or less", label: "A) 7 or less" },
      { value: "8", label: "B) 8" },
      { value: "9", label: "C) 9" },
      { value: "10 or more", label: "D) 10 or more" },
    ],
  },
  {
    no: 10,
    prompt:
      "Combined, how many goals will the three hosts (USA, Canada, Mexico) score during the tournament?",
    options: [
      { value: "7 or less", label: "A) 7 or less" },
      { value: "8-11", label: "B) 8 – 11 inclusive" },
      { value: "12+", label: "C) 12 or more" },
    ],
  },
  {
    no: 11,
    prompt: "Which player will win the Golden Boot? (name the player and their country)",
    allowsTies: true,
    placeholder: "e.g. Kylian Mbappé (France)",
  },
  {
    no: 12,
    prompt: "Which team will win the World Cup Final?",
    placeholder: "e.g. Brazil",
  },
];
