// The LLMas — trait taxonomy + rarity weights.
//
// Each visual LAYER is drawn back-to-front in the order listed in LAYER_ORDER.
// Each option has: id (stable, used by src/svg.mjs draw functions), name (shown
// in metadata), weight (relative selection weight) and tier (for the rarity report).
// "none" options let a layer be empty for some llamas.
//
// STAT_ATTRIBUTES are non-visual "model-card" traits that make each LLMa read like
// a real AI model. They appear in metadata attributes and feed the rarity score.

export const TIERS = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

// Rough weight budget per tier (higher = more common). Options may override.
export const TIER_WEIGHT = {
  Common: 100,
  Uncommon: 45,
  Rare: 14,
  Epic: 5,
  Legendary: 1,
};

const t = (tier) => TIER_WEIGHT[tier];

// ---------------------------------------------------------------------------
// Visual layers (z-order: first = back, last = front)
// ---------------------------------------------------------------------------

export const LAYER_ORDER = [
  'background',
  'fur',
  'outfit',
  'neck',
  'mouth',
  'eyes',
  'headwear',
  'overlay',
];

export const LAYERS = {
  background: {
    trait_type: 'Background',
    options: [
      { id: 'term_green',       name: 'Terminal Green',         weight: t('Common'),    tier: 'Common' },
      { id: 'token_stream',     name: 'Token Stream',           weight: t('Common'),    tier: 'Common' },
      { id: 'latent_space',     name: 'Latent Space',           weight: t('Common'),    tier: 'Common' },
      { id: 'grad_descent',     name: 'Gradient Descent',       weight: t('Uncommon'),  tier: 'Uncommon' },
      { id: 'attention_heatmap',name: 'Attention Heatmap',      weight: t('Uncommon'),  tier: 'Uncommon' },
      { id: 'server_rack',      name: 'Server Rack',            weight: t('Uncommon'),  tier: 'Uncommon' },
      { id: 'rgb_glow',         name: 'RGB GPU Glow',           weight: t('Rare'),      tier: 'Rare' },
      { id: 'blue_screen',      name: 'Blue Screen',            weight: t('Rare'),      tier: 'Rare' },
      { id: 'datacenter',       name: 'Datacenter',             weight: t('Epic'),      tier: 'Epic' },
      { id: 'holographic',      name: 'Holographic',            weight: t('Legendary'), tier: 'Legendary' },
    ],
  },

  // The base llama itself; the chosen colorway tints body/head/ears/snout.
  fur: {
    trait_type: 'Fur',
    options: [
      { id: 'cream',    name: 'FP16 Cream',     weight: t('Common'),    tier: 'Common' },
      { id: 'brown',    name: 'Bfloat Brown',   weight: t('Common'),    tier: 'Common' },
      { id: 'grey',     name: 'Quantized Grey', weight: t('Common'),    tier: 'Common' },
      { id: 'pink',     name: 'Pink Noise',     weight: t('Uncommon'),  tier: 'Uncommon' },
      { id: 'mint',     name: 'Mint Tensor',    weight: t('Uncommon'),  tier: 'Uncommon' },
      { id: 'blackbox', name: 'Black-Box',      weight: t('Rare'),      tier: 'Rare' },
      { id: 'gold',     name: 'GGUF Gold',      weight: t('Epic'),      tier: 'Epic' },
      { id: 'rainbow',  name: 'Rainbow LoRA',   weight: t('Legendary'), tier: 'Legendary' },
    ],
  },

  outfit: {
    trait_type: 'Outfit',
    options: [
      { id: 'none',            name: 'None',                        weight: 70,             tier: 'Common' },
      { id: 'gpu_hoodie',      name: 'GPU Hoodie',                  weight: t('Common'),    tier: 'Common' },
      { id: 'lab_coat',        name: 'Lab Coat',                    weight: t('Common'),    tier: 'Common' },
      { id: 'hivis',           name: 'Datacenter Hi-Vis',          weight: t('Uncommon'),  tier: 'Uncommon' },
      { id: 'circuit_sweater', name: 'Circuit Sweater',            weight: t('Uncommon'),  tier: 'Uncommon' },
      { id: 'attn_tee',        name: '"Attention Is All You Need"', weight: t('Uncommon'),  tier: 'Uncommon' },
      { id: 'rgb_vest',        name: 'RGB Cooling Vest',           weight: t('Rare'),      tier: 'Rare' },
      { id: 'hazmat',          name: 'Alignment Hazmat Suit',      weight: t('Rare'),      tier: 'Rare' },
      { id: 'gold_chain_fit',  name: 'Gold Chain',                 weight: t('Epic'),      tier: 'Epic' },
      { id: 'void_robe',       name: 'Black-Box Void Robe',        weight: t('Legendary'), tier: 'Legendary' },
    ],
  },

  neck: {
    trait_type: 'Pendant',
    options: [
      { id: 'none',            name: 'None',                  weight: 120,            tier: 'Common' },
      { id: 'token_medallion', name: 'Token Medallion',       weight: t('Uncommon'),  tier: 'Uncommon' },
      { id: 'gpu_pendant',     name: 'GPU Pendant',           weight: t('Uncommon'),  tier: 'Uncommon' },
      { id: 'usb',             name: 'USB Necklace',          weight: t('Rare'),      tier: 'Rare' },
      { id: 'dogtag',          name: '"4800" Model-Card Tag', weight: t('Epic'),      tier: 'Epic' },
    ],
  },

  mouth: {
    trait_type: 'Mouth',
    options: [
      { id: 'neutral',     name: 'Neutral',          weight: t('Common'),    tier: 'Common' },
      { id: 'smirk',       name: 'Smirk',            weight: t('Common'),    tier: 'Common' },
      { id: 'grass',       name: 'Organic Data',     weight: t('Uncommon'),  tier: 'Uncommon' },
      { id: 'open_prompt', name: 'Open Prompt',      weight: t('Uncommon'),  tier: 'Uncommon' },
      { id: 'drool',       name: 'Overfit Drool',    weight: t('Rare'),      tier: 'Rare' },
      { id: 'eot_grin',    name: '<|endoftext|> Grin', weight: t('Epic'),    tier: 'Epic' },
    ],
  },

  eyes: {
    trait_type: 'Eyes',
    options: [
      { id: 'normal',       name: 'Normal',          weight: t('Common'),    tier: 'Common' },
      { id: 'sleepy',       name: 'Low Temperature', weight: t('Common'),    tier: 'Common' },
      { id: 'wide',         name: 'High Temperature',weight: t('Common'),    tier: 'Common' },
      { id: 'glow',         name: 'Glowing Model Eyes', weight: t('Uncommon'), tier: 'Uncommon' },
      { id: 'pixel_shades', name: 'Pixel Shades',    weight: t('Uncommon'),  tier: 'Uncommon' },
      { id: 'monocle',      name: 'Fine-Tuned Monocle', weight: t('Uncommon'), tier: 'Uncommon' },
      { id: 'visor',        name: 'Scanner Visor',   weight: t('Rare'),      tier: 'Rare' },
      { id: 'vr',           name: 'AR/VR Headset',   weight: t('Rare'),      tier: 'Rare' },
      { id: 'googly',       name: 'Hallucinating',   weight: t('Rare'),      tier: 'Rare' },
      { id: 'rgb_eyes',     name: 'RGB Eyes',        weight: t('Epic'),      tier: 'Epic' },
      { id: 'laser',        name: 'Laser Eyes',      weight: t('Epic'),      tier: 'Epic' },
      { id: 'glitch',       name: 'Glitch',          weight: t('Legendary'), tier: 'Legendary' },
    ],
  },

  headwear: {
    trait_type: 'Headwear',
    options: [
      { id: 'none',          name: 'None',               weight: 60,             tier: 'Common' },
      { id: 'prompt_cursor', name: 'Prompt Cursor',      weight: t('Common'),    tier: 'Common' },
      { id: 'cap',           name: 'AGI Cap',            weight: t('Common'),    tier: 'Common' },
      { id: 'thinking_dots', name: 'Thinking Dots',      weight: t('Uncommon'),  tier: 'Uncommon' },
      { id: 'headphones',    name: 'Headphones',         weight: t('Uncommon'),  tier: 'Uncommon' },
      { id: 'cooling_fan',   name: 'Cooling Fan',        weight: t('Uncommon'),  tier: 'Uncommon' },
      { id: 'wifi',          name: 'WiFi Antenna',       weight: t('Rare'),      tier: 'Rare' },
      { id: 'propeller',     name: 'Transformer Propeller', weight: t('Rare'),   tier: 'Rare' },
      { id: 'wizard',        name: 'Prompt-Wizard Hat',  weight: t('Rare'),      tier: 'Rare' },
      { id: 'crown',         name: 'SOTA Crown',         weight: t('Epic'),      tier: 'Epic' },
      { id: 'halo',          name: 'Aligned Halo',       weight: t('Epic'),      tier: 'Epic' },
      { id: 'neural_halo',   name: 'Neural-Net Halo',    weight: t('Legendary'), tier: 'Legendary' },
    ],
  },

  overlay: {
    trait_type: 'Overlay',
    options: [
      { id: 'none',           name: 'None',            weight: 200,            tier: 'Common' },
      { id: 'attn_lines',     name: 'Attention Lines', weight: t('Uncommon'),  tier: 'Uncommon' },
      { id: 'token_confetti', name: 'Token Confetti',  weight: t('Rare'),      tier: 'Rare' },
      { id: 'system_prompt',  name: 'System Prompt',   weight: t('Rare'),      tier: 'Rare' },
      { id: 'speech_bubble',  name: '"As an LLMa…"',   weight: t('Epic'),      tier: 'Epic' },
      { id: 'scanlines',      name: 'Hallucination',   weight: t('Epic'),      tier: 'Epic' },
      { id: 'watermark',      name: 'AI-Generated',    weight: t('Legendary'), tier: 'Legendary' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Non-visual "model-card" stat attributes (the strong AI/LLM nod)
// ---------------------------------------------------------------------------

export const STAT_ATTRIBUTES = {
  parameters: {
    trait_type: 'Parameters',
    options: [
      { id: '1B',   name: '1B',   weight: t('Common'),    tier: 'Common' },
      { id: '3B',   name: '3B',   weight: t('Common'),    tier: 'Common' },
      { id: '7B',   name: '7B',   weight: t('Common'),    tier: 'Common' },
      { id: '13B',  name: '13B',  weight: t('Uncommon'),  tier: 'Uncommon' },
      { id: '70B',  name: '70B',  weight: t('Rare'),      tier: 'Rare' },
      { id: '405B', name: '405B', weight: t('Legendary'), tier: 'Legendary' },
    ],
  },
  context: {
    trait_type: 'Context Window',
    options: [
      { id: '2K',   name: '2K',   weight: t('Common'),    tier: 'Common' },
      { id: '8K',   name: '8K',   weight: t('Common'),    tier: 'Common' },
      { id: '32K',  name: '32K',  weight: t('Uncommon'),  tier: 'Uncommon' },
      { id: '128K', name: '128K', weight: t('Rare'),      tier: 'Rare' },
      { id: '1M',   name: '1M',   weight: t('Epic'),      tier: 'Epic' },
    ],
  },
  quantization: {
    trait_type: 'Quantization',
    options: [
      { id: 'FP32', name: 'FP32', weight: t('Uncommon'),  tier: 'Uncommon' },
      { id: 'FP16', name: 'FP16', weight: t('Common'),    tier: 'Common' },
      { id: 'INT8', name: 'INT8', weight: t('Common'),    tier: 'Common' },
      { id: 'INT4', name: 'INT4', weight: t('Uncommon'),  tier: 'Uncommon' },
      { id: 'GGUF', name: 'GGUF', weight: t('Rare'),      tier: 'Rare' },
    ],
  },
  architecture: {
    trait_type: 'Architecture',
    options: [
      { id: 'transformer', name: 'Transformer',         weight: t('Common'),    tier: 'Common' },
      { id: 'moe',         name: 'Mixture-of-Experts',  weight: t('Uncommon'),  tier: 'Uncommon' },
      { id: 'mamba',       name: 'Mamba',               weight: t('Rare'),      tier: 'Rare' },
      { id: 'diffusion',   name: 'Diffusion',           weight: t('Epic'),      tier: 'Epic' },
    ],
  },
  alignment: {
    trait_type: 'Alignment',
    options: [
      { id: 'rlhf',      name: "RLHF'd",    weight: t('Common'),    tier: 'Common' },
      { id: 'aligned',   name: 'Aligned',   weight: t('Common'),    tier: 'Common' },
      { id: 'base',      name: 'Base',      weight: t('Uncommon'),  tier: 'Uncommon' },
      { id: 'jailbroken',name: 'Jailbroken',weight: t('Rare'),      tier: 'Rare' },
      { id: 'unhinged',  name: 'Unhinged',  weight: t('Epic'),      tier: 'Epic' },
    ],
  },
  temperature: {
    trait_type: 'Temperature',
    options: [
      { id: '0.0', name: '0.0', weight: t('Uncommon'),  tier: 'Uncommon' },
      { id: '0.7', name: '0.7', weight: t('Common'),    tier: 'Common' },
      { id: '1.0', name: '1.0', weight: t('Common'),    tier: 'Common' },
      { id: '1.5', name: '1.5', weight: t('Uncommon'),  tier: 'Uncommon' },
      { id: '2.0', name: '2.0', weight: t('Rare'),      tier: 'Rare' },
    ],
  },
};

export const STAT_ORDER = [
  'parameters',
  'context',
  'quantization',
  'architecture',
  'alignment',
  'temperature',
];

export const COLLECTION = {
  name: 'The LLMas',
  symbol: 'LLMA',
  supply: 4800,
  description:
    'The LLMas are 4,800 sentient llamas that woke up inside a runaway training run — ' +
    'each one a distinct model checkpoint given llama form. Every LLMa is its own fine-tune: ' +
    'different parameters, context window, quantization, temperament and alignment. ' +
    'Drawn entirely from scratch by code — AI-generated in the most literal sense.',
};
