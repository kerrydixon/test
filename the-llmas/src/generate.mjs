// The LLMas — main generator.
// Builds N unique llamas: picks rarity-weighted traits, guarantees unique DNA,
// renders each to SVG, writes OpenSea-standard metadata, and emits a rarity report.
//
// Usage:
//   node the-llmas/src/generate.mjs [--count=4800] [--seed=LLMAS] [--cid=__CID__]
//                                   [--out=the-llmas/output] [--report=the-llmas/reports]
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { LAYER_ORDER, LAYERS, STAT_ORDER, STAT_ATTRIBUTES, COLLECTION } from '../config/traits.mjs';
import { buildSvg } from './svg.mjs';
import { mulberry32, seedFromString, weightedPick, dna, rarityScore, assignRanks } from './rarity.mjs';

// ---- CLI args --------------------------------------------------------------
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)=?(.*)$/);
    return m ? [m[1], m[2]] : [a, true];
  }),
);
const COUNT = Number(args.count) || COLLECTION.supply;
const SEED = String(args.seed || 'LLMAS');
const CID = String(args.cid || '__CID__');
const OUT = String(args.out || 'the-llmas/output');
const REPORT_DIR = String(args.report || 'the-llmas/reports');

const ALL_LAYERS = [
  ...LAYER_ORDER.map((k) => [k, LAYERS[k], true]),
  ...STAT_ORDER.map((k) => [k, STAT_ATTRIBUTES[k], false]),
]; // [key, {trait_type, options}, isVisual]

// ---- Generate tokens with guaranteed-unique DNA ----------------------------
const baseSeed = seedFromString(SEED);
const seen = new Set();
const tokens = [];
let totalRetries = 0;
const MAX_ATTEMPTS = 64;

for (let id = 1; id <= COUNT; id++) {
  let picks, traitIds, key, attempt = 0;
  do {
    const rng = mulberry32((baseSeed + id * 2654435761 + attempt * 40503) >>> 0);
    picks = {};
    traitIds = [];
    for (const [layerKey, layer] of ALL_LAYERS) {
      const opt = weightedPick(layer.options, rng);
      picks[layerKey] = opt;
      traitIds.push(`${layerKey}:${opt.id}`);
    }
    key = dna(traitIds);
    attempt++;
    if (attempt > 1) totalRetries++;
  } while (seen.has(key) && attempt < MAX_ATTEMPTS);

  if (seen.has(key)) throw new Error(`Could not find unique DNA for #${id} after ${MAX_ATTEMPTS} attempts`);
  seen.add(key);

  const traits = {};
  for (const [layerKey] of ALL_LAYERS) traits[layerKey] = picks[layerKey].id;
  tokens.push({ tokenId: id, dna: key, picks, traits });
}

// ---- Frequencies, rarity score + rank --------------------------------------
const counts = {};
for (const tok of tokens) {
  for (const [layerKey, optionId] of Object.entries(tok.traits)) {
    counts[`${layerKey}:${optionId}`] = (counts[`${layerKey}:${optionId}`] || 0) + 1;
  }
}
for (const tok of tokens) tok.rarityScore = rarityScore(tok, counts, COUNT);
assignRanks(tokens);

// ---- Write SVG + metadata --------------------------------------------------
const imgDir = join(OUT, 'images');
const metaDir = join(OUT, 'metadata');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(imgDir, { recursive: true });
mkdirSync(metaDir, { recursive: true });

for (const tok of tokens) {
  const svg = buildSvg(tok.picks);
  writeFileSync(join(imgDir, `${tok.tokenId}.svg`), svg);

  const attributes = ALL_LAYERS.map(([layerKey, layer]) => ({
    trait_type: layer.trait_type,
    value: tok.picks[layerKey].name,
  }));
  attributes.push({ display_type: 'number', trait_type: 'Rarity Rank', value: tok.rarityRank });

  const metadata = {
    name: `${COLLECTION.name} #${tok.tokenId}`,
    description: COLLECTION.description,
    image: `ipfs://${CID}/${tok.tokenId}.svg`,
    attributes,
    rarity_rank: tok.rarityRank,
    rarity_score: Number(tok.rarityScore.toFixed(2)),
  };
  writeFileSync(join(metaDir, `${tok.tokenId}.json`), JSON.stringify(metadata, null, 2));
}

// ---- Rarity report ---------------------------------------------------------
const traitReport = {};
for (const [layerKey, layer] of ALL_LAYERS) {
  traitReport[layer.trait_type] = layer.options.map((o) => {
    const n = counts[`${layerKey}:${o.id}`] || 0;
    return { value: o.name, tier: o.tier, count: n, percent: Number(((n / COUNT) * 100).toFixed(2)) };
  }).sort((a, b) => b.count - a.count);
}
const ranking = [...tokens]
  .sort((a, b) => a.rarityRank - b.rarityRank)
  .map((t) => ({ rank: t.rarityRank, tokenId: t.tokenId, score: Number(t.rarityScore.toFixed(2)) }));

mkdirSync(REPORT_DIR, { recursive: true });
writeFileSync(join(REPORT_DIR, 'rarity-report.json'), JSON.stringify({
  collection: COLLECTION.name,
  generatedAt: new Date().toISOString(),
  seed: SEED,
  supply: COUNT,
  uniqueDnas: seen.size,
  collisionRetries: totalRetries,
  traits: traitReport,
  ranking,
}, null, 2));

// ---- Console summary -------------------------------------------------------
console.log(`The LLMas — generated ${tokens.length}/${COUNT} tokens`);
console.log(`  unique DNAs : ${seen.size}/${COUNT}${seen.size === COUNT ? ' ✓' : ' ✗'}`);
console.log(`  collisions retried: ${totalRetries}`);
console.log(`  images : ${imgDir}/<id>.svg`);
console.log(`  metadata: ${metaDir}/<id>.json   (image -> ipfs://${CID}/<id>.svg)`);
console.log(`  report : ${join(REPORT_DIR, 'rarity-report.json')}`);
const rarest = tokens.find((t) => t.rarityRank === 1);
console.log(`  rarest : #${rarest.tokenId} (score ${rarest.rarityScore.toFixed(2)})`);
