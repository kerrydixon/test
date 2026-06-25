// The LLMas — build an HTML contact sheet from a generated directory.
// Usage: node the-llmas/src/preview.mjs [--dir=the-llmas/sample] [--out=the-llmas/sample/preview.html]
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => { const m = a.match(/^--([^=]+)=?(.*)$/); return m ? [m[1], m[2]] : [a, true]; }),
);
const DIR = String(args.dir || 'the-llmas/sample');
const OUT = String(args.out || join(DIR, 'preview.html'));

const imgDir = join(DIR, 'images');
const metaDir = join(DIR, 'metadata');
const ids = readdirSync(imgDir)
  .filter((f) => f.endsWith('.svg'))
  .map((f) => Number(f.replace('.svg', '')))
  .sort((a, b) => a - b);

const cards = ids.map((id) => {
  const svg = readFileSync(join(imgDir, `${id}.svg`), 'utf8');
  let meta = {};
  try { meta = JSON.parse(readFileSync(join(metaDir, `${id}.json`), 'utf8')); } catch {}
  const get = (tt) => (meta.attributes || []).find((a) => a.trait_type === tt)?.value ?? '';
  const tags = ['Fur', 'Parameters', 'Alignment'].map((t) => get(t)).filter(Boolean).join(' · ');
  return `<figure>
    <div class="art">${svg}</div>
    <figcaption><b>${meta.name || '#' + id}</b><span class="rank">rank #${meta.rarity_rank ?? '?'}</span><small>${tags}</small></figcaption>
  </figure>`;
}).join('\n');

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>The LLMas — preview (${ids.length})</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; background: #0c0e14; color: #e7ebf3; font-family: 'Courier New', monospace; }
  header { padding: 28px 32px; border-bottom: 1px solid #222838; }
  header h1 { margin: 0 0 4px; font-size: 28px; letter-spacing: 1px; }
  header p { margin: 0; color: #8a93a8; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 18px; padding: 24px 32px; }
  figure { margin: 0; background: #141826; border: 1px solid #222838; border-radius: 14px; overflow: hidden; }
  .art svg { display: block; width: 100%; height: auto; }
  figcaption { padding: 10px 12px; display: flex; flex-direction: column; gap: 2px; }
  figcaption b { font-size: 14px; }
  .rank { color: #3ad07a; font-size: 12px; }
  figcaption small { color: #8a93a8; font-size: 11px; }
</style></head>
<body>
  <header>
    <h1>The LLMas</h1>
    <p>${ids.length} llamas · sentient model checkpoints · drawn from scratch by code</p>
  </header>
  <div class="grid">${cards}</div>
</body></html>`;

writeFileSync(OUT, html);
console.log(`Preview written: ${OUT} (${ids.length} llamas)`);
