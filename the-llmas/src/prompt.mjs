// The LLMas — OpenAI image-prompt builder.
// Turns a token's assigned traits (from its generated metadata) into a
// ready-to-paste prompt for OpenAI image generation (gpt-image-1 / DALL·E 3),
// so the generated art always matches the on-chain metadata.
//
// Usage:
//   node the-llmas/src/prompt.mjs --id=123                 # one token (reads metadata/123.json)
//   node the-llmas/src/prompt.mjs --id=123 --dir=the-llmas/sample
//   node the-llmas/src/prompt.mjs --range=1-50 --out=the-llmas/art/prompts.jsonl
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

// ---- The locked HOUSE STYLE — goes in front of every prompt for consistency ----
export const STYLE =
  'Premium NFT profile-picture character illustration. Centered head-and-shoulders ' +
  'bust portrait of a cute-but-cool cartoon llama mascot, facing forward, big personality. ' +
  'Bold clean thick outlines, smooth cel shading with soft gradients and a gentle rim light, ' +
  'rich saturated colors, large expressive glossy eyes with bright catchlights, chunky stylized ' +
  'proportions, sticker-like clarity, premium collectible vibe in the spirit of Pudgy Penguins, ' +
  'Sappy Seals and Hypurr. Flat solid-color studio background. Square 1:1 composition, character ' +
  'centered with even margin around it.';

export const BASE =
  'The llama has a long upright fuzzy neck, two tall pointed fluffy ears, a soft rounded muzzle ' +
  'with two small nostrils, and a tuft of fringe between the ears.';

export const TAIL =
  'Highly detailed, crisp, professional, high contrast. No text, no watermark, no signature, ' +
  'no border, no frame, single character only.';

// ---- Trait value -> illustration phrase (keyed by metadata trait_type + value) ----
// "None" / missing values are skipped. Phrases describe the trait visually so the
// image matches the metadata; flavor names (e.g. "GGUF Gold") become real visuals.
const P = {
  Fur: {
    'FP16 Cream': 'soft cream-white fluffy fur',
    'Bfloat Brown': 'warm chocolate-brown fur',
    'Quantized Grey': 'cool slate-grey fur',
    'Pink Noise': 'pastel bubblegum-pink fur',
    'Mint Tensor': 'soft mint-green fur',
    'Black-Box': 'matte jet-black fur',
    'GGUF Gold': 'shimmering metallic gold fur',
    'Rainbow LoRA': 'iridescent holographic rainbow fur',
  },
  Eyes: {
    'Normal': 'big round friendly black eyes with glossy catchlights',
    'Low Temperature': 'calm half-closed sleepy eyes',
    'High Temperature': 'wide excited eyes with big shiny highlights',
    'Glowing Model Eyes': 'glowing cyan tech eyes',
    'Pixel Shades': 'retro black pixel-art sunglasses',
    'Fine-Tuned Monocle': 'a single gold monocle over one eye, classy',
    'Scanner Visor': 'a sleek glowing horizontal scanner visor across the eyes',
    'AR/VR Headset': 'a futuristic VR headset over the eyes',
    'Hallucinating': 'swirly mismatched googly eyes, dazed look',
    'RGB Eyes': 'one magenta glowing eye and one cyan glowing eye',
    'Laser Eyes': 'intense glowing red laser eyes shooting thin laser beams',
    'Glitch': 'glitching distorted datamosh eyes with chromatic aberration',
  },
  Mouth: {
    'Neutral': 'a calm closed mouth',
    'Smirk': 'a confident sideways smirk',
    'Organic Data': 'a few blades of fresh green grass hanging from its mouth',
    'Open Prompt': 'mouth slightly open as if mid-sentence',
    'Overfit Drool': 'a little playful drool',
    '<|endoftext|> Grin': 'a wide toothy mischievous grin',
  },
  Outfit: {
    'GPU Hoodie': 'wearing a streetwear hoodie with a small circuit-board graphic',
    'Lab Coat': 'wearing a clean white lab coat',
    'Datacenter Hi-Vis': 'wearing a hi-vis safety vest with reflective stripes',
    'Circuit Sweater': 'wearing a knit sweater with a glowing circuit pattern',
    '"Attention Is All You Need"': 'wearing a black graphic tee',
    'RGB Cooling Vest': 'wearing a glossy vest that glows in shifting RGB colors',
    'Alignment Hazmat Suit': 'wearing a yellow hazmat suit',
    'Gold Chain': 'wearing a thick gold chain necklace, flexing',
    'Black-Box Void Robe': 'wearing a deep-black cosmic hooded robe flecked with tiny stars',
  },
  Pendant: {
    'Token Medallion': 'a shiny gold coin medallion on a chain',
    'GPU Pendant': 'a tiny graphics-card pendant on a chain',
    'USB Necklace': 'a small USB-stick pendant on a chain',
    '"4800" Model-Card Tag': 'a silver dog-tag pendant on a chain',
  },
  Headwear: {
    'Prompt Cursor': 'a small glowing green blinking cursor floating just above its head',
    'AGI Cap': 'a backwards baseball cap on its head',
    'Thinking Dots': 'three little grey thought-bubble dots floating above its head',
    'Headphones': 'chunky over-ear headphones',
    'Cooling Fan': 'a tiny spinning PC cooling fan on top of its head',
    'WiFi Antenna': 'a small antenna with glowing wifi signal arcs on its head',
    'Transformer Propeller': 'a colorful propeller-beanie on its head',
    'Prompt-Wizard Hat': 'a deep-blue wizard hat with little stars',
    'SOTA Crown': 'a small golden crown with gems',
    'Aligned Halo': 'a glowing golden halo floating above its head',
    'Neural-Net Halo': 'a glowing halo made of connected neural-network nodes and edges above its head',
  },
  Background: {
    'Terminal Green': 'flat dark-green background with a faint code/matrix glow',
    'Token Stream': 'flat deep-blue background',
    'Latent Space': 'flat dark-purple starfield background',
    'Gradient Descent': 'smooth teal-to-purple gradient background',
    'Attention Heatmap': 'flat warm magenta-orange background',
    'Server Rack': 'flat dark slate background with soft server-light bokeh',
    'RGB GPU Glow': 'vivid magenta-and-purple glowing background',
    'Blue Screen': 'flat bright klein-blue background',
    'Datacenter': 'cool teal background with soft rows of server lights',
    'Holographic': 'pastel iridescent holographic background',
  },
  Overlay: {
    'Attention Lines': 'faint glowing attention lines radiating subtly behind it',
    'Token Confetti': 'small colorful confetti squares floating around',
    'System Prompt': 'a subtle floating UI chip in a corner',
    '"As an LLMa…"': 'a small comic speech bubble beside its head',
    'Hallucination': 'subtle dreamy glitch scanlines over the whole image',
    'AI-Generated': 'a faint diagonal holographic shimmer over the image',
  },
};

const SKIP = new Set(['None', '']);

export function buildPrompt(attributes) {
  const get = (tt) => (attributes.find((a) => a.trait_type === tt) || {}).value;
  const phrase = (tt) => {
    const v = get(tt);
    if (!v || SKIP.has(v)) return null;
    return (P[tt] && P[tt][v]) || null;
  };
  const fur = phrase('Fur') || 'soft cream-white fluffy fur';
  const parts = [
    STYLE,
    `The llama has ${fur}.`,
    BASE,
    phrase('Eyes') && `It has ${phrase('Eyes')}.`,
    phrase('Mouth') && `It has ${phrase('Mouth')}.`,
    phrase('Outfit') && `It is ${phrase('Outfit')}.`,
    phrase('Pendant') && `It wears ${phrase('Pendant')}.`,
    phrase('Headwear') && `It has ${phrase('Headwear')}.`,
    phrase('Background') && `Background: ${phrase('Background')}.`,
    phrase('Overlay') && `Effect: ${phrase('Overlay')}.`,
    TAIL,
  ].filter(Boolean);
  return parts.join(' ');
}

// ---- CLI ----
function main() {
  const args = Object.fromEntries(process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)=?(.*)$/); return m ? [m[1], m[2]] : [a, true];
  }));
  const dir = String(args.dir || 'the-llmas/output');
  const meta = (id) => JSON.parse(readFileSync(join(dir, 'metadata', `${id}.json`), 'utf8'));

  if (args.range) {
    const [a, b] = String(args.range).split('-').map(Number);
    const lines = [];
    for (let id = a; id <= b; id++) lines.push(JSON.stringify({ id, prompt: buildPrompt(meta(id).attributes) }));
    const out = String(args.out || 'the-llmas/art/prompts.jsonl');
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, lines.join('\n') + '\n');
    console.log(`Wrote ${lines.length} prompts -> ${out}`);
  } else {
    const id = Number(args.id || 1);
    const m = meta(id);
    console.log(`# ${m.name}  (rarity rank #${m.rarity_rank})`);
    console.log(buildPrompt(m.attributes));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
