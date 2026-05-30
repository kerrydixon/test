// Static tournament reference data for World Cup USA 2026.
// Groups, price tiers and confederations are taken directly from the competition brief.
// This is the single source of truth used by the Prisma seed and the UI.

export type Confederation =
  | "UEFA"
  | "CONMEBOL"
  | "CONCACAF"
  | "CAF"
  | "AFC"
  | "OFC";

export interface TeamSeed {
  name: string;
  groupCode: string; // "A".."L"
  priceTier: number; // valuation in £ millions
  confederation: Confederation;
  isHost: boolean;
  flagEmoji: string;
}

// Price tiers (£m) from the Part 1 valuation table.
const TIER_2500 = ["France", "Spain", "Argentina", "England"];
const TIER_2300 = ["Portugal", "Brazil", "Netherlands", "Morocco"];
const TIER_2200 = ["Belgium", "Germany", "Croatia"];
const TIER_2100 = ["Colombia", "Senegal", "Mexico", "USA", "Uruguay", "Japan"];

export function priceTierFor(name: string): number {
  if (TIER_2500.includes(name)) return 2500;
  if (TIER_2300.includes(name)) return 2300;
  if (TIER_2200.includes(name)) return 2200;
  if (TIER_2100.includes(name)) return 2100;
  return 1800; // any other participating team
}

// The 16 UEFA teams as listed in Part 2 questions 8 & 9 (Czechia == "Czech Republic").
export const UEFA_TEAMS = [
  "Austria",
  "Belgium",
  "Bosnia & Herzegovina",
  "Croatia",
  "Czechia",
  "England",
  "France",
  "Germany",
  "Netherlands",
  "Norway",
  "Portugal",
  "Scotland",
  "Spain",
  "Sweden",
  "Switzerland",
  "Turkiye",
];

export const HOST_TEAMS = ["USA", "Canada", "Mexico"];

// Confederation membership (UEFA above). Used for Part 2 Q8/Q9 progression questions.
const CONMEBOL = ["Brazil", "Argentina", "Uruguay", "Colombia", "Paraguay", "Ecuador"];
const CONCACAF = ["Mexico", "USA", "Canada", "Panama", "Haiti", "Curacao"];
const CAF = [
  "South Africa",
  "Morocco",
  "Senegal",
  "Egypt",
  "Ivory Coast",
  "Tunisia",
  "Ghana",
  "Algeria",
  "DR Congo",
  "Cape Verde",
];
const AFC = [
  "South Korea",
  "Qatar",
  "Iran",
  "Japan",
  "Saudi Arabia",
  "Iraq",
  "Australia",
  "Jordan",
  "Uzbekistan",
];
const OFC = ["New Zealand"];

function confederationFor(name: string): Confederation {
  if (UEFA_TEAMS.includes(name)) return "UEFA";
  if (CONMEBOL.includes(name)) return "CONMEBOL";
  if (CONCACAF.includes(name)) return "CONCACAF";
  if (CAF.includes(name)) return "CAF";
  if (AFC.includes(name)) return "AFC";
  if (OFC.includes(name)) return "OFC";
  throw new Error(`No confederation mapping for team: ${name}`);
}

// Flag emoji per team for display.
const FLAGS: Record<string, string> = {
  Mexico: "🇲🇽",
  "South Africa": "🇿🇦",
  "South Korea": "🇰🇷",
  Czechia: "🇨🇿",
  Canada: "🇨🇦",
  "Bosnia & Herzegovina": "🇧🇦",
  Qatar: "🇶🇦",
  Switzerland: "🇨🇭",
  Brazil: "🇧🇷",
  Morocco: "🇲🇦",
  Haiti: "🇭🇹",
  Scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  USA: "🇺🇸",
  Paraguay: "🇵🇾",
  Australia: "🇦🇺",
  Turkiye: "🇹🇷",
  Germany: "🇩🇪",
  Curacao: "🇨🇼",
  "Ivory Coast": "🇨🇮",
  Ecuador: "🇪🇨",
  Netherlands: "🇳🇱",
  Japan: "🇯🇵",
  Sweden: "🇸🇪",
  Tunisia: "🇹🇳",
  Belgium: "🇧🇪",
  Egypt: "🇪🇬",
  Iran: "🇮🇷",
  "New Zealand": "🇳🇿",
  Spain: "🇪🇸",
  "Cape Verde": "🇨🇻",
  "Saudi Arabia": "🇸🇦",
  Uruguay: "🇺🇾",
  France: "🇫🇷",
  Senegal: "🇸🇳",
  Iraq: "🇮🇶",
  Norway: "🇳🇴",
  Argentina: "🇦🇷",
  Algeria: "🇩🇿",
  Austria: "🇦🇹",
  Jordan: "🇯🇴",
  Portugal: "🇵🇹",
  "DR Congo": "🇨🇩",
  Uzbekistan: "🇺🇿",
  Colombia: "🇨🇴",
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  Croatia: "🇭🇷",
  Ghana: "🇬🇭",
  Panama: "🇵🇦",
};

// Maps alternative spellings used by data sources to our canonical team names.
export const TEAM_ALIASES: Record<string, string> = {
  "united states": "USA",
  "united states of america": "USA",
  "south korea": "South Korea",
  "korea republic": "South Korea",
  "türkiye": "Turkiye",
  turkey: "Turkiye",
  "czech republic": "Czechia",
  "côte d'ivoire": "Ivory Coast",
  "cote d'ivoire": "Ivory Coast",
  "cabo verde": "Cape Verde",
  "bosnia and herzegovina": "Bosnia & Herzegovina",
  "dr congo": "DR Congo",
  "democratic republic of the congo": "DR Congo",
  curaçao: "Curacao",
};

/** Resolve a source's team name to our canonical name (or null if unknown). */
export function resolveTeamName(raw: string): string | null {
  const trimmed = raw.trim();
  const direct = ALL_TEAMS.find(
    (t) => t.name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (direct) return direct.name;
  const alias = TEAM_ALIASES[trimmed.toLowerCase()];
  return alias ?? null;
}

// Group line-ups exactly as listed in the brief (Parts Three).
export const GROUPS: Record<string, string[]> = {
  A: ["Mexico", "South Africa", "South Korea", "Czechia"],
  B: ["Canada", "Bosnia & Herzegovina", "Qatar", "Switzerland"],
  C: ["Brazil", "Morocco", "Haiti", "Scotland"],
  D: ["USA", "Paraguay", "Australia", "Turkiye"],
  E: ["Germany", "Curacao", "Ivory Coast", "Ecuador"],
  F: ["Netherlands", "Japan", "Sweden", "Tunisia"],
  G: ["Belgium", "Egypt", "Iran", "New Zealand"],
  H: ["Spain", "Cape Verde", "Saudi Arabia", "Uruguay"],
  I: ["France", "Senegal", "Iraq", "Norway"],
  J: ["Argentina", "Algeria", "Austria", "Jordan"],
  K: ["Portugal", "DR Congo", "Uzbekistan", "Colombia"],
  L: ["England", "Croatia", "Ghana", "Panama"],
};

export const GROUP_CODES = Object.keys(GROUPS);

// Flattened list of all 48 teams with their full metadata.
export const ALL_TEAMS: TeamSeed[] = Object.entries(GROUPS).flatMap(
  ([groupCode, names]) =>
    names.map((name) => ({
      name,
      groupCode,
      priceTier: priceTierFor(name),
      confederation: confederationFor(name),
      isHost: HOST_TEAMS.includes(name),
      flagEmoji: FLAGS[name] ?? "🏳️",
    })),
);
