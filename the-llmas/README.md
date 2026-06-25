# The LLMas 🦙

A **4,800**-unit generative PFP collection in the lineage of CryptoPunks / Pudgy Penguins /
Nakamigos / BAYC — but the herd is sentient AI models.

> **The LLMas are 4,800 sentient llamas that woke up inside a runaway training run** — each one a
> distinct *model checkpoint* given llama form (yes, a wink at the actual LLaMA model). Every LLMa is
> its own fine-tune: different parameters, context window, quantization, temperament and alignment.
> Some are aligned and helpful; some are jailbroken and unhinged; a rare few are hallucinating reality
> itself. The whole set is "AI-generated" in the most literal sense — **drawn entirely from scratch by
> code**, no raster assets, no human illustrator.

This directory is the **art + rarity engine**: it defines the traits and their rarity, then generates
all 4,800 unique llamas as SVG art plus OpenSea-standard metadata, with uniqueness and
rarity-distribution checks. (Smart contract, IPFS pinning, and mint dApp are the documented next steps —
see the bottom of this file.)

## Quick start

No dependencies, no install — pure Node ESM (built-ins only). Needs Node 18+.

```bash
# generate the full 4,800-piece collection into the-llmas/output/ (gitignored)
node the-llmas/src/generate.mjs

# regenerate a curated 50-piece sample + an HTML contact sheet to eyeball the art
node the-llmas/src/preview.mjs        # opens the-llmas/sample/preview.html
```

Useful flags for `generate.mjs`:

| flag | default | meaning |
|------|---------|---------|
| `--count=N`   | `4800`      | how many to generate |
| `--seed=STR`  | `LLMAS`     | RNG seed — same seed reproduces the exact same collection |
| `--cid=CID`   | `__CID__`   | IPFS CID to bake into each `image` URI (set after pinning) |
| `--out=DIR`   | `the-llmas/output` | output directory |
| `--report=DIR`| `the-llmas/reports` | where `rarity-report.json` is written |

## What it produces

```
the-llmas/output/
  images/<id>.svg        # 4,800 standalone SVGs (valid strict XML — render on marketplaces)
  metadata/<id>.json     # OpenSea ERC-721 metadata; image -> ipfs://<CID>/<id>.svg
the-llmas/reports/
  rarity-report.json     # per-trait counts + % by tier, and the full rarity-rank table
```

Each metadata file looks like:

```jsonc
{
  "name": "The LLMas #1",
  "description": "The LLMas are 4,800 sentient llamas …",
  "image": "ipfs://__CID__/1.svg",
  "attributes": [
    { "trait_type": "Background", "value": "Latent Space" },
    { "trait_type": "Fur",        "value": "FP16 Cream" },
    { "trait_type": "Parameters", "value": "70B" },
    { "trait_type": "Alignment",  "value": "Jailbroken" },
    … visual + model-card traits …
    { "display_type": "number", "trait_type": "Rarity Rank", "value": 412 }
  ],
  "rarity_rank": 412,
  "rarity_score": 71.4
}
```

## Traits

Five rarity tiers — **Common → Uncommon → Rare → Epic → Legendary** — set by selection weights in
`config/traits.mjs`. Eight **visual layers** composited back-to-front, every one leaning into AI/LLM
iconography:

| Layer | Examples | Legendary |
|-------|----------|-----------|
| **Background** | Terminal Green, Token Stream, Latent Space, Attention Heatmap, Server Rack | Holographic |
| **Fur** (colorway) | FP16 Cream, Bfloat Brown, Quantized Grey, Pink Noise, GGUF Gold (epic) | Rainbow LoRA |
| **Outfit** | GPU Hoodie, Lab Coat, Hi-Vis, "Attention Is All You Need" tee, Alignment Hazmat | Black-Box Void Robe |
| **Pendant** | Token Medallion, GPU Pendant, USB Necklace, "4800" Model-Card Tag | — |
| **Mouth** | Neutral, Smirk, Organic Data (grass), Open Prompt, `<\|endoftext\|>` Grin (epic) | — |
| **Eyes** | Low/High Temperature, Glowing Model Eyes, Scanner Visor, AR/VR Headset, Laser (epic) | Glitch |
| **Headwear** | Prompt Cursor, AGI Cap, Cooling Fan, Transformer Propeller, SOTA Crown (epic) | Neural-Net Halo |
| **Overlay** | Attention Lines, Token Confetti, System Prompt, "As an LLMa…" bubble (epic) | AI-Generated watermark |

Plus six non-visual **"model-card" attributes** — the strong AI/LLM nod — so each LLMa reads like a
real model spec and they feed the rarity score:

- **Parameters:** 1B · 3B · 7B · 13B · 70B · **405B**
- **Context Window:** 2K · 8K · 32K · 128K · **1M**
- **Quantization:** FP32 · FP16 · INT8 · INT4 · GGUF
- **Architecture:** Transformer · Mixture-of-Experts · Mamba · **Diffusion**
- **Alignment:** RLHF'd · Aligned · Base · Jailbroken · **Unhinged**
- **Temperature:** 0.0 · 0.7 · 1.0 · 1.5 · 2.0

The visual × stat combinatorial space is in the many millions, so 4,800 **unique** llamas is
guaranteed (the generator hashes each token's full trait set to a DNA and re-rolls on any collision —
in practice zero collisions at this supply).

**Rarity score** is statistical: `Σ (1 / trait-frequency)` over all of a token's traits; rank 1 = rarest.

## How it works

```
config/traits.mjs   trait taxonomy: layers, options, rarity weights, model-card stats, collection meta
src/rarity.mjs      seeded mulberry32 RNG, weighted pick, sha256 DNA/uniqueness, rarity score + rank
src/svg.mjs         the llama bust + every trait drawn as flat-vector SVG, composited by z-order
src/generate.mjs    builds N unique tokens → writes SVG + metadata + rarity report
src/preview.mjs     builds an HTML contact sheet from any generated directory
sample/             committed 50-piece sample + preview.html
reports/            committed rarity-report.json for the full 4,800
output/             full generated collection (gitignored — regenerate with one command)
```

Tweak `config/traits.mjs` to add traits or rebalance rarity; edit the matching draw function in
`src/svg.mjs` (keyed by the same option `id`); rerun `generate.mjs`.

## Next steps to launch (deferred — decisions already locked)

These were scoped out of this build but the parameters are chosen so they're ready to go:

1. **Smart contract** — ERC-721A (gas-efficient batch mint), **ERC-2981 royalties @ 5%**, 4,800 cap,
   allowlist presale + public mint with a per-wallet cap, delayed reveal, `withdraw`. Full test suite.
2. **Host the art** — pin `output/images` + `output/metadata` to **IPFS** (e.g. Pinata / NFT.Storage),
   then re-run `generate.mjs --cid=<real CID>` so every `image` points at the pinned art, and freeze.
3. **Deploy** — Sepolia testnet + Etherscan verify first; then a one-command **mainnet** deploy you run
   with your own wallet/keys and ETH.
4. **Mint dApp** — a wallet-connect mint page (can reuse the Next.js app already in this repo) showing
   supply, phase, price and a connect-and-mint button.
