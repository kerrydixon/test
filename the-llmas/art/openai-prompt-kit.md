# The LLMas — OpenAI image-generation prompt kit

This produces **PFP-worthy raster art** (the Pudgy / Sappy Seals / Hypurr lane) with OpenAI image
generation, while staying in sync with the metadata the engine already assigns. You run the
generations on your OpenAI account; this kit gives you the exact prompts.

The engine (`src/generate.mjs`) decides each token's traits → `src/prompt.mjs` turns those exact
traits into a prompt → you generate the image → the art and the on-chain metadata match by construction.

---

## 0) Recommended settings

- **Model:** `gpt-image-1` (best), or DALL·E 3.
- **Size:** `1024x1024` (square PFP).
- **Quality:** high. **Background:** keep the flat color from the prompt (don't use transparent unless
  you plan to composite your own backgrounds).
- Generate, then **curate** — regenerate any that drift. AI gen won't be 100% identical piece-to-piece;
  the consistency workflow below keeps the character on-model.

---

## 1) Lock the character first (do this once)

Before the 4,800, generate **one hero** and a small **character sheet** so you have a reference to
keep every later piece on-model. Paste this into ChatGPT (with image output) or the API:

```
Premium NFT profile-picture character illustration. Centered head-and-shoulders bust portrait of a
cute-but-cool cartoon llama mascot mascot named an "LLMa", facing forward, big personality. Bold clean
thick outlines, smooth cel shading with soft gradients and a gentle rim light, rich saturated colors,
large expressive glossy eyes with bright catchlights, chunky stylized proportions, sticker-like clarity,
premium collectible vibe in the spirit of Pudgy Penguins, Sappy Seals and Hypurr. The llama has soft
cream-white fluffy fur, a long upright fuzzy neck, two tall pointed fluffy ears, a soft rounded muzzle
with two small nostrils, and a tuft of fringe between the ears. Flat solid teal studio background.
Square 1:1, character centered with even margin. Highly detailed, crisp, professional, high contrast.
No text, no watermark, no border, single character only.
```

Then: *"Make a 2x2 character sheet of this exact llama from front, 3/4 left, 3/4 right and a happy
expression — identical design, proportions and style."* Save these — they're your **style anchor**.

---

## 2) Generate each PFP (on-model)

For every token, the reliable way to keep the character consistent in ChatGPT is:

> **Attach your hero image** and prompt: *"Same exact llama character, same art style, proportions and
> line weight. Keep it a centered 1:1 bust portrait. Change only the following: …"* then paste the
> token's prompt from `src/prompt.mjs`.

Get a token's prompt:

```bash
node the-llmas/src/prompt.mjs --id=961          # prints the prompt for The LLMas #961
node the-llmas/src/prompt.mjs --range=1-50 --out=the-llmas/art/prompts.jsonl   # batch -> JSONL
```

`prompts.jsonl` lines look like `{"id":1,"prompt":"…"}` — easy to loop over in an API script.

---

## 3) Optional: batch via the API (you supply the key)

You said you'll run it on OpenAI — here's a minimal loop (needs your `OPENAI_API_KEY`):

```bash
# reads the-llmas/art/prompts.jsonl, writes pieces to the-llmas/art/raster/<id>.png
node - <<'EOF'
import fs from 'node:fs';
const key = process.env.OPENAI_API_KEY;
const lines = fs.readFileSync('the-llmas/art/prompts.jsonl','utf8').trim().split('\n');
fs.mkdirSync('the-llmas/art/raster',{recursive:true});
for (const l of lines) {
  const { id, prompt } = JSON.parse(l);
  const r = await fetch('https://api.openai.com/v1/images/generations', {
    method:'POST', headers:{ 'Authorization':`Bearer ${key}`, 'Content-Type':'application/json' },
    body: JSON.stringify({ model:'gpt-image-1', prompt, size:'1024x1024', n:1 }),
  });
  const j = await r.json();
  if (!j.data) { console.error(id, j); continue; }
  fs.writeFileSync(`the-llmas/art/raster/${id}.png`, Buffer.from(j.data[0].b64_json,'base64'));
  console.log('done', id);
}
EOF
```

> Note: the API generates each piece independently, so it won't carry a single reference image like the
> ChatGPT flow does. For maximum character consistency at 4,800 scale, the pro route is to train a small
> LoRA / fine-tune on your hero sheet (Replicate/Stability) and generate against that. The kit's strong
> locked style gets you most of the way; curate outliers.

---

## 4) After the art exists

1. (If you generated on transparent/odd backgrounds) normalize to 1024×1024, flatten.
2. Pin `the-llmas/art/raster/` to IPFS, then re-point metadata at the PNGs:
   set `image` to `ipfs://<CID>/<id>.png` (swap the `.svg` convention — update `generate.mjs`'s image
   line, or do a one-off rewrite of the metadata `image` field) and pin metadata.
3. Continue with the contract → mint steps in the main `the-llmas/README.md`.

---

## House style (the locked string)

Lives in `src/prompt.mjs` as `STYLE` so every prompt shares it. Want a different lane (grittier
rektguy-style, or anime/Azuki)? Edit `STYLE` + the per-trait phrases in `src/prompt.mjs` once and every
prompt updates. Tell me the lane and I'll retune the whole bank.
