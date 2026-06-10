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

/**
 * Forgiving player matching: exact normalised equality, or the tokens of one
 * name being a subset of the other's — so a pick of "Kylian Mbappé" matches a
 * feed's "Mbappé" (and vice versa). If two picked players share a surname,
 * disambiguate by using full names in the match's goal events.
 */
export function playerMatches(pick: string, eventName: string): boolean {
  const a = normaliseName(pick);
  const b = normaliseName(eventName);
  if (!a || !b) return false;
  if (a === b) return true;
  const at = new Set(a.split(" "));
  const bt = new Set(b.split(" "));
  const subset = (small: Set<string>, big: Set<string>) =>
    [...small].every((t) => big.has(t));
  return subset(at, bt) || subset(bt, at);
}
