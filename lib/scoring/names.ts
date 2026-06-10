// Forgiving name/answer matching used across the scoring engine.
//
// Entrants write "Mbappé, France", data sources write "Mbappe" or "Kylian Mbappé",
// the organiser types "mbappe (france)". All of these should compare equal, so we
// normalise: lowercase, strip diacritics, drop punctuation, collapse whitespace.

export function normaliseName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ") // punctuation -> spaces
    .replace(/\s+/g, " ")
    .trim();
}

export function namesMatch(a: string, b: string): boolean {
  return normaliseName(a) === normaliseName(b);
}
