// Seeded RNG, weighted selection, DNA/uniqueness, and rarity scoring.
import { createHash } from 'node:crypto';

// Deterministic PRNG so a given seed reproduces the exact same collection.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Hash an arbitrary string to a 32-bit seed (used to derive a stable seed).
export function seedFromString(str) {
  const h = createHash('sha256').update(str).digest();
  return h.readUInt32LE(0);
}

// Pick one option from a list of { weight } by relative weight, using rng() in [0,1).
export function weightedPick(options, rng) {
  const total = options.reduce((s, o) => s + o.weight, 0);
  let r = rng() * total;
  for (const o of options) {
    r -= o.weight;
    if (r < 0) return o;
  }
  return options[options.length - 1];
}

// A token's DNA = stable hash of its ordered trait ids. Identical trait sets
// collide; we re-roll on collision to guarantee a unique set per token.
export function dna(traitIds) {
  return createHash('sha256').update(traitIds.join('|')).digest('hex');
}

// Statistical rarity: sum of (1 / frequency) over a token's traits.
// Rarer combinations score higher; rank 1 = rarest. `counts` maps
// "layerKey:optionId" -> number of tokens carrying it; `total` is supply.
export function rarityScore(token, counts, total) {
  let score = 0;
  for (const [layerKey, optionId] of Object.entries(token.traits)) {
    const freq = counts[`${layerKey}:${optionId}`] / total;
    score += 1 / freq;
  }
  return score;
}

// Assign rank 1..N by descending rarity score (stable tie-break on tokenId).
export function assignRanks(tokens) {
  const ordered = [...tokens].sort(
    (a, b) => b.rarityScore - a.rarityScore || a.tokenId - b.tokenId,
  );
  ordered.forEach((tok, i) => {
    tok.rarityRank = i + 1;
  });
  return tokens;
}
