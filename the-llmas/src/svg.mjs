// The LLMas — flat-vector SVG art. Draws the base llama bust and every trait,
// composited back-to-front. All art is generated from scratch in code.
//
// Canvas is 1000x1000. Anchor coordinates below keep traits aligned to the face.

const W = 1000;
const OUTLINE = '#15161a';
const SW = 7; // standard outline stroke width

// Face/body anchors shared by the llama and its traits.
const A = {
  cx: 500,
  headCy: 430, headRx: 190, headRy: 178,
  earTopY: 150,
  eyeY: 408, eyeLx: 428, eyeRx: 572, eyeR: 30,
  snoutCy: 548, snoutRx: 126, snoutRy: 94,
  nostrilY: 552, nostrilLx: 466, nostrilRx: 534,
  mouthY: 612,
  neckTop: 632, neckBottom: 1000,
  headTopY: 258,
};

// ---------------------------------------------------------------------------
// Tiny SVG primitive helpers
// ---------------------------------------------------------------------------
const ell = (cx, cy, rx, ry, fill, extra = '') =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const circ = (cx, cy, r, fill, extra = '') =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra}/>`;
const rect = (x, y, w, h, fill, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const line = (x1, y1, x2, y2, stroke, sw, extra = '') =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}" ${extra}/>`;
const poly = (pts, fill, extra = '') =>
  `<polygon points="${pts}" fill="${fill}" ${extra}/>`;
const text = (x, y, s, str, fill, extra = '') => {
  // Let callers override alignment via `extra`; otherwise default to centered.
  const anchor = /text-anchor/.test(extra) ? '' : 'text-anchor="middle" ';
  return `<text x="${x}" y="${y}" font-family="'Courier New',monospace" font-weight="700" font-size="${s}" fill="${fill}" ${anchor}${extra}>${str}</text>`;
};
const stroke = (color = OUTLINE, w = SW) =>
  `stroke="${color}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

// ---------------------------------------------------------------------------
// Fur palettes (the base llama colorway)
// ---------------------------------------------------------------------------
const FUR = {
  cream:    { body: '#f3e9d2', shade: '#e3d3b0', snout: '#fbf6ea', inner: '#e7c3ad' },
  brown:    { body: '#b07d4e', shade: '#92653b', snout: '#d8b388', inner: '#8a5a34' },
  grey:     { body: '#b9bec7', shade: '#979daa', snout: '#d8dce2', inner: '#8b909b' },
  pink:     { body: '#f3b6c9', shade: '#e58aa8', snout: '#ffd9e4', inner: '#e58aa8' },
  mint:     { body: '#a9e3cd', shade: '#82cfb1', snout: '#d4f2e7', inner: '#82cfb1' },
  blackbox: { body: '#2b2d33', shade: '#191b20', snout: '#3a3d45', inner: '#101115' },
  gold:     { body: 'url(#gold)', shade: '#cda233', snout: '#f6e29a', inner: '#cda233' },
  rainbow:  { body: 'url(#rainbow)', shade: '#9b59b6', snout: '#fef0ff', inner: '#9b59b6' },
};

// ---------------------------------------------------------------------------
// Defs collector (gradients/patterns, deduped by id)
// ---------------------------------------------------------------------------
function makeDefs() {
  const map = new Map();
  return {
    add(id, markup) { if (!map.has(id)) map.set(id, markup); },
    render() { return map.size ? `<defs>${[...map.values()].join('')}</defs>` : ''; },
  };
}

function ensureFurGradients(defs, furId) {
  if (furId === 'gold') {
    defs.add('gold', `<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0b8"/><stop offset="0.5" stop-color="#e9c45a"/><stop offset="1" stop-color="#b8862b"/></linearGradient>`);
  }
  if (furId === 'rainbow') {
    defs.add('rainbow', `<linearGradient id="rainbow" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5b5b"/><stop offset="0.25" stop-color="#ffb14e"/><stop offset="0.5" stop-color="#ffe14e"/><stop offset="0.7" stop-color="#5bd6a0"/><stop offset="0.85" stop-color="#5b9bff"/><stop offset="1" stop-color="#b15bff"/></linearGradient>`);
  }
}

// ---------------------------------------------------------------------------
// BACKGROUND
// ---------------------------------------------------------------------------
function drawBackground(id, defs) {
  switch (id) {
    case 'term_green':
      return rect(0, 0, W, W, '#0b1a0f') +
        Array.from({ length: 14 }, (_, i) =>
          text(60, 70 + i * 66, 26, '0101 LLMA &gt; train --epoch ' + i, '#1e7a3a', 'text-anchor="start" opacity="0.5"')).join('');
    case 'token_stream': {
      const toks = ['the', 'llma', '▁of', 'token', '0xAI', '▁is', 'all', '▁you', 'need', '&lt;eos&gt;'];
      return rect(0, 0, W, W, '#141826') +
        Array.from({ length: 60 }, (_, i) => {
          const x = (i * 167) % W, y = (i * 233) % W;
          return text(x, y, 22, toks[i % toks.length], '#3a4a7a', 'opacity="0.55"');
        }).join('');
    }
    case 'latent_space':
      defs.add('latent', `<radialGradient id="latent" cx="0.5" cy="0.45" r="0.75"><stop offset="0" stop-color="#241b3a"/><stop offset="1" stop-color="#0a0814"/></radialGradient>`);
      return rect(0, 0, W, W, 'url(#latent)') +
        Array.from({ length: 90 }, (_, i) => {
          const x = (i * 113) % W, y = (i * 197 + 30) % W, r = (i % 3) + 1;
          return circ(x, y, r, '#cdb8ff', 'opacity="0.8"');
        }).join('');
    case 'grad_descent':
      defs.add('grad', `<linearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1a4a"/><stop offset="1" stop-color="#10324a"/></linearGradient>`);
      return rect(0, 0, W, W, 'url(#grad)') +
        Array.from({ length: 7 }, (_, i) => {
          const r = 420 - i * 55;
          return `<ellipse cx="500" cy="560" rx="${r}" ry="${r * 0.62}" fill="none" ${stroke('#5fd0c0', 2)} opacity="0.5"/>`;
        }).join('') +
        circ(330, 360, 9, '#ffd24e') + line(330, 360, 500, 560, '#ffd24e', 3, 'stroke-dasharray="6 6"');
    case 'attention_heatmap':
      return rect(0, 0, W, W, '#1a0e22') +
        Array.from({ length: 100 }, (_, i) => {
          const gx = i % 10, gy = (i / 10) | 0;
          const v = ((gx * 7 + gy * 13 + 3) % 10) / 10;
          const c = `rgb(${40 + v * 215},${30 + v * 60},${90 - v * 60})`;
          return rect(gx * 100, gy * 100, 100, 100, c, 'opacity="0.55"');
        }).join('');
    case 'server_rack':
      return rect(0, 0, W, W, '#101216') +
        Array.from({ length: 9 }, (_, r) =>
          rect(120, 70 + r * 95, 760, 64, '#1b1f27', stroke('#0a0b0e', 3)) +
          Array.from({ length: 7 }, (_, c) =>
            circ(180 + c * 100, 102 + r * 95, 7, (c + r) % 4 === 0 ? '#3ad07a' : '#243042'))
            .join('')).join('');
    case 'rgb_glow':
      defs.add('rgb', `<radialGradient id="rgb" cx="0.5" cy="0.5" r="0.7"><stop offset="0" stop-color="#ff2eea"/><stop offset="0.5" stop-color="#7a2eff"/><stop offset="1" stop-color="#0a0014"/></radialGradient>`);
      return rect(0, 0, W, W, 'url(#rgb)');
    case 'blue_screen':
      return rect(0, 0, W, W, '#1247c4') +
        text(500, 300, 120, ':(', '#ffffff') +
        text(500, 420, 30, 'MODEL_NOT_RESPONDING', '#dbe6ff') +
        text(500, 470, 22, '0x4800 — your LLMa ran out of VRAM', '#aac2ff');
    case 'datacenter':
      defs.add('dc', `<linearGradient id="dc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0e2233"/><stop offset="1" stop-color="#04111c"/></linearGradient>`);
      return rect(0, 0, W, W, 'url(#dc)') +
        Array.from({ length: 6 }, (_, i) =>
          rect(60 + i * 150, 200, 90, 700, '#10303f', stroke('#0a1c26', 4)) +
          Array.from({ length: 10 }, (_, j) => circ(105 + i * 150, 240 + j * 64, 6, '#36e0c8')).join('')
        ).join('');
    case 'holographic':
      defs.add('holo', `<linearGradient id="holo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a0f0ff"/><stop offset="0.3" stop-color="#ffb3f0"/><stop offset="0.6" stop-color="#b3ffd1"/><stop offset="1" stop-color="#c2b3ff"/></linearGradient>`);
      return rect(0, 0, W, W, 'url(#holo)') +
        Array.from({ length: 20 }, (_, i) =>
          line(0, i * 50, W, i * 50, '#ffffff', 2, 'opacity="0.25"')).join('');
    default:
      return rect(0, 0, W, W, '#dfe3ea');
  }
}

// ---------------------------------------------------------------------------
// BASE LLAMA (fur)
// ---------------------------------------------------------------------------
function drawLlama(furId, defs) {
  ensureFurGradients(defs, furId);
  const c = FUR[furId] || FUR.cream;
  const ear = (cx, rot) =>
    `<g transform="rotate(${rot} ${cx} ${A.earTopY + 70})">` +
      ell(cx, A.earTopY + 30, 42, 92, c.body, stroke()) +
      ell(cx, A.earTopY + 45, 18, 55, c.inner) +
    `</g>`;

  // neck/shoulders
  const neck = path(
    `M 386,${A.neckTop} C 352,790 350,910 372,1000 L 628,1000 C 650,910 648,790 614,${A.neckTop} Z`,
    c.body, stroke());
  const neckShade = path(
    `M 386,${A.neckTop} C 352,790 350,910 372,1000 L 470,1000 C 452,900 452,800 470,${A.neckTop} Z`,
    c.shade, 'opacity="0.5"');

  return (
    ear(A.eyeLx - 5, -16) +
    ear(A.eyeRx + 5, 16) +
    neck + neckShade +
    // head
    ell(A.cx, A.headCy, A.headRx, A.headRy, c.body, stroke()) +
    // fringe tuft between ears
    path('M 410,300 q 30,-60 90,-30 q 60,-30 90,30 q -20,40 -90,30 q -70,10 -90,-30 Z', c.shade, 'opacity="0.55"') +
    // snout
    ell(A.cx, A.snoutCy, A.snoutRx, A.snoutRy, c.snout, stroke()) +
    // nostrils
    ell(A.nostrilLx, A.nostrilY, 11, 15, c.shade) +
    ell(A.nostrilRx, A.nostrilY, 11, 15, c.shade)
  );
}

// ---------------------------------------------------------------------------
// OUTFIT (covers lower neck / shoulders)
// ---------------------------------------------------------------------------
function drawOutfit(id, defs) {
  const shoulders = (fill, extra = '') =>
    path(`M 372,1000 C 360,900 372,820 410,792 L 590,792 C 628,820 640,900 628,1000 Z`, fill, extra);
  switch (id) {
    case 'none': return '';
    case 'gpu_hoodie':
      return shoulders('#3a3f4b', stroke()) +
        path('M 410,792 q 90,70 180,0 l -10,40 q -80,55 -160,0 Z', '#2c313b', stroke('', 5)) +
        text(500, 940, 40, 'GPU', '#7fd6ff');
    case 'lab_coat':
      return shoulders('#f4f6fb', stroke()) +
        line(500, 800, 500, 1000, '#c7ccd6', 5) +
        circ(470, 880, 7, '#c7ccd6') + circ(470, 940, 7, '#c7ccd6') +
        rect(540, 840, 46, 56, '#dfe3ec', stroke('#c7ccd6', 3));
    case 'hivis':
      return shoulders('#eaff1f', stroke()) +
        rect(400, 860, 200, 30, '#cfe000', 'opacity="0.8"') +
        rect(400, 920, 200, 26, '#9aa7ff', stroke('#ffffff', 4));
    case 'circuit_sweater':
      return shoulders('#15564a', stroke()) +
        Array.from({ length: 5 }, (_, i) =>
          line(410 + i * 45, 800, 410 + i * 45, 1000, '#3fe0b0', 3) +
          circ(410 + i * 45, 860 + (i % 2) * 50, 6, '#9fffe0')).join('');
    case 'attn_tee':
      return shoulders('#101216', stroke()) +
        text(500, 880, 26, 'ATTENTION', '#ffffff') +
        text(500, 920, 22, 'IS ALL YOU', '#ffffff') +
        text(500, 958, 22, 'NEED', '#7fd6ff');
    case 'rgb_vest':
      defs.add('vest', `<linearGradient id="vest" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff2eea"/><stop offset="0.5" stop-color="#2effd0"/><stop offset="1" stop-color="#2e6bff"/></linearGradient>`);
      return shoulders('url(#vest)', stroke()) + line(500, 800, 500, 1000, '#0a0a0a', 4);
    case 'hazmat':
      return shoulders('#fff7d6', stroke()) +
        circ(500, 880, 46, '#ffe14e', stroke()) +
        text(500, 895, 56, '☣', '#7a5c00') +
        rect(420, 940, 160, 20, '#ffd24e', stroke('', 3));
    case 'gold_chain_fit':
      return shoulders('#1b1d22', stroke());
    case 'void_robe':
      defs.add('void', `<radialGradient id="void" cx="0.5" cy="0.2" r="0.9"><stop offset="0" stop-color="#3a2b66"/><stop offset="1" stop-color="#050308"/></radialGradient>`);
      return shoulders('url(#void)', stroke()) +
        Array.from({ length: 16 }, (_, i) =>
          circ(400 + (i * 73) % 200, 820 + (i * 53) % 170, 2.5, '#cdb8ff')).join('');
    default: return '';
  }
}

// ---------------------------------------------------------------------------
// PENDANT (neck)
// ---------------------------------------------------------------------------
function drawNeck(id, defs) {
  const chain = (color) =>
    `<path d="M 430,760 Q 500,820 570,760" fill="none" ${stroke(color, 8)}/>`;
  switch (id) {
    case 'none': return '';
    case 'token_medallion':
      return chain('#e9c45a') + circ(500, 820, 34, '#e9c45a', stroke()) + text(500, 834, 44, '◈', '#7a5c00');
    case 'gpu_pendant':
      return chain('#9aa7b8') + rect(470, 794, 60, 44, '#2c313b', stroke()) +
        line(478, 838, 478, 852, '#9aa7b8', 4) + line(522, 838, 522, 852, '#9aa7b8', 4);
    case 'usb':
      return chain('#9aa7b8') + rect(484, 796, 32, 50, '#3a3f4b', stroke()) + rect(490, 786, 20, 16, '#c0c6d2', stroke('', 3));
    case 'dogtag':
      return chain('#b8bec8') + rect(466, 798, 68, 46, '#c7ccd6', stroke()) + text(500, 830, 30, '4800', '#2b2d33');
    default: return '';
  }
}

// ---------------------------------------------------------------------------
// MOUTH (on the snout)
// ---------------------------------------------------------------------------
function drawMouth(id) {
  const y = A.mouthY;
  switch (id) {
    case 'neutral':
      return `<path d="M 460,${y} Q 500,${y + 14} 540,${y}" fill="none" ${stroke(OUTLINE, 6)}/>`;
    case 'smirk':
      return `<path d="M 458,${y + 6} Q 510,${y + 22} 548,${y - 8}" fill="none" ${stroke(OUTLINE, 6)}/>`;
    case 'grass':
      return `<path d="M 462,${y} Q 500,${y + 12} 538,${y}" fill="none" ${stroke(OUTLINE, 6)}/>` +
        poly(`520,${y} 560,${y - 46} 540,${y - 2}`, '#5fbf4a', stroke('#2f7a25', 3)) +
        poly(`540,${y} 588,${y - 30} 556,${y}`, '#6fd05a', stroke('#2f7a25', 3));
    case 'open_prompt':
      return ell(500, y + 12, 30, 22, '#3a1f2a', stroke(OUTLINE, 6)) + ell(500, y + 20, 16, 9, '#e06a8a');
    case 'drool':
      return `<path d="M 460,${y} Q 500,${y + 16} 540,${y}" fill="none" ${stroke(OUTLINE, 6)}/>` +
        path(`M 538,${y + 2} q 10,40 0,70 q -12,-30 0,-70`, '#9fd6ff', stroke('#5aa9e0', 3));
    case 'eot_grin':
      return `<path d="M 446,${y - 4} Q 500,${y + 40} 554,${y - 4}" fill="#3a1f2a" ${stroke(OUTLINE, 6)}/>` +
        rect(470, y + 4, 60, 12, '#ffffff') +
        text(500, y - 14, 18, '&lt;|endoftext|&gt;', '#1b1d22');
    default: return '';
  }
}

// ---------------------------------------------------------------------------
// EYES
// ---------------------------------------------------------------------------
function eyePair(render) { return render(A.eyeLx) + render(A.eyeRx); }

function drawEyes(id, defs) {
  const y = A.eyeY;
  switch (id) {
    case 'normal':
      return eyePair((x) => circ(x, y, A.eyeR, '#ffffff', stroke(OUTLINE, 5)) + circ(x + 4, y + 2, 12, '#1b1d22'));
    case 'sleepy':
      return eyePair((x) => `<path d="M ${x - 28},${y} q 28,26 56,0" fill="none" ${stroke(OUTLINE, 6)}/>`);
    case 'wide':
      return eyePair((x) => circ(x, y, A.eyeR + 8, '#ffffff', stroke(OUTLINE, 5)) + circ(x, y, 9, '#1b1d22'));
    case 'glow':
      defs.add('eyeglow', `<radialGradient id="eyeglow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#aef9ff"/><stop offset="1" stop-color="#13b6c8"/></radialGradient>`);
      return eyePair((x) => circ(x, y, A.eyeR, 'url(#eyeglow)', stroke('#0a6a78', 4)) + circ(x, y, 10, '#ffffff'));
    case 'pixel_shades':
      return rect(A.eyeLx - 50, y - 26, 220, 52, '#101216', stroke()) +
        Array.from({ length: 5 }, (_, i) => rect(A.eyeLx - 44 + i * 30, y - 18, 18, 18, '#ff3b6b')).join('');
    case 'monocle':
      return circ(A.eyeRx, y, A.eyeR, '#ffffff', stroke(OUTLINE, 5)) + circ(A.eyeRx, y, 12, '#1b1d22') +
        circ(A.eyeRx, y, A.eyeR + 10, 'none', stroke('#e9c45a', 6)) + line(A.eyeRx + 38, y + 6, A.eyeRx + 60, 760, '#e9c45a', 4) +
        circ(A.eyeLx, y, 14, '#1b1d22');
    case 'visor':
      defs.add('visor', `<linearGradient id="visor" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#19f0c8"/><stop offset="1" stop-color="#1d8bff"/></linearGradient>`);
      return path(`M ${A.eyeLx - 60},${y - 18} h 280 a 24 24 0 0 1 0 48 h -280 a 24 24 0 0 1 0 -48 Z`, 'url(#visor)', stroke()) +
        line(A.eyeLx - 50, y, A.eyeRx + 50, y, '#0a3a4a', 3);
    case 'vr':
      return rect(A.eyeLx - 70, y - 44, 300, 96, '#15161a', stroke()) +
        rect(A.eyeLx - 56, y - 30, 270, 68, '#2c2f3a', stroke('#0a0b0e', 3)) +
        circ(A.eyeLx, y + 4, 22, '#7f5bff') + circ(A.eyeRx, y + 4, 22, '#7f5bff') +
        rect(A.eyeLx - 90, y - 20, 24, 30, '#15161a', stroke());
    case 'googly':
      return eyePair((x) => circ(x, y, A.eyeR + 6, '#ffffff', stroke(OUTLINE, 5)) +
        circ(x + ((x < 500) ? -8 : 10), y + ((x < 500) ? 8 : -6), 12, '#1b1d22'));
    case 'rgb_eyes':
      return circ(A.eyeLx, y, A.eyeR, '#ff2eea', stroke(OUTLINE, 5)) + circ(A.eyeLx, y, 10, '#fff') +
        circ(A.eyeRx, y, A.eyeR, '#2effd0', stroke(OUTLINE, 5)) + circ(A.eyeRx, y, 10, '#fff');
    case 'laser':
      return eyePair((x) => circ(x, y, 16, '#ff2b3b') +
        `<line x1="${x}" y1="${y}" x2="${x + (x < 500 ? -260 : 260)}" y2="${y - 200}" stroke="#ff2b3b" stroke-width="10" opacity="0.85"/>`);
    case 'glitch':
      return eyePair((x) =>
        rect(x - 30, y - 16, 60, 32, '#19f0c8', 'opacity="0.9"') +
        rect(x - 30, y - 8, 60, 6, '#ff2eea') +
        rect(x - 18, y - 16, 12, 32, '#ffffff', 'opacity="0.8"'));
    default: return '';
  }
}

// ---------------------------------------------------------------------------
// HEADWEAR (on top of head)
// ---------------------------------------------------------------------------
function drawHeadwear(id, defs) {
  const topY = A.headTopY;
  switch (id) {
    case 'none': return '';
    case 'prompt_cursor':
      return rect(494, topY - 96, 14, 80, '#3ad07a') + text(500, topY - 4, 20, '&gt;_', '#3ad07a');
    case 'cap':
      return path(`M 360,${topY} q 140,-110 280,0 Z`, '#2e6bff', stroke()) +
        path(`M 600,${topY} q 70,6 96,30 l -10,18 q -50,-22 -86,-22 Z`, '#1f4fbf', stroke()) +
        text(500, topY - 30, 34, 'AGI', '#ffffff');
    case 'thinking_dots':
      return `<g>` + circ(430, topY - 70, 14, '#cfd6e2', stroke()) + circ(500, topY - 90, 16, '#cfd6e2', stroke()) +
        circ(570, topY - 70, 14, '#cfd6e2', stroke()) + text(500, topY - 84, 26, '…', '#1b1d22') + `</g>`;
    case 'headphones':
      return `<path d="M 350,${topY + 20} Q 500,${topY - 150} 650,${topY + 20}" fill="none" ${stroke('#1b1d22', 16)}/>` +
        rect(330, topY + 10, 44, 90, '#2c313b', stroke()) + rect(626, topY + 10, 44, 90, '#2c313b', stroke());
    case 'cooling_fan':
      return circ(500, topY - 40, 56, '#2c313b', stroke()) +
        Array.from({ length: 6 }, (_, i) =>
          `<path d="M 500,${topY - 40} L ${500 + 50 * Math.cos(i)},${topY - 40 + 50 * Math.sin(i)} A 50 50 0 0 1 ${500 + 50 * Math.cos(i + 0.9)},${topY - 40 + 50 * Math.sin(i + 0.9)} Z" fill="#9aa7b8"/>`).join('') +
        circ(500, topY - 40, 12, '#15161a');
    case 'wifi':
      return rect(494, topY - 70, 12, 56, '#9aa7b8') +
        Array.from({ length: 3 }, (_, i) =>
          `<path d="M ${500 - 26 - i * 18},${topY - 70} a ${26 + i * 18} ${26 + i * 18} 0 0 1 ${52 + i * 36},0" fill="none" ${stroke('#3ad07a', 5)}/>`).join('');
    case 'propeller':
      return circ(500, topY - 20, 12, '#15161a') +
        Array.from({ length: 4 }, (_, i) =>
          `<g transform="rotate(${i * 90} 500 ${topY - 20})">` + ell(500, topY - 70, 16, 50, ['#ff5b5b','#ffd24e','#5bd6a0','#5b9bff'][i], stroke('', 3)) + `</g>`).join('');
    case 'wizard':
      return poly(`500,${topY - 170} 410,${topY + 6} 590,${topY + 6}`, '#3a2b66', stroke()) +
        Array.from({ length: 5 }, (_, i) => text(470 + (i % 3) * 30, topY - 40 - i * 24, 22, '✦', '#ffe14e')).join('') +
        text(500, topY - 150, 26, '★', '#ffe14e');
    case 'crown':
      return path(`M 396,${topY} L 420,${topY - 80} L 470,${topY - 30} L 500,${topY - 96} L 530,${topY - 30} L 580,${topY - 80} L 604,${topY} Z`, '#e9c45a', stroke()) +
        circ(500, topY - 96, 9, '#ff3b6b') + circ(420, topY - 80, 7, '#2effd0') + circ(580, topY - 80, 7, '#2effd0');
    case 'halo':
      return `<ellipse cx="500" cy="${topY - 70}" rx="120" ry="34" fill="none" ${stroke('#ffe14e', 12)} opacity="0.95"/>`;
    case 'neural_halo':
      defs.add('nh', `<radialGradient id="nh" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#aef9ff"/><stop offset="1" stop-color="#7f5bff"/></radialGradient>`);
      return `<ellipse cx="500" cy="${topY - 80}" rx="150" ry="40" fill="none" ${stroke('url(#nh)', 6)}/>` +
        Array.from({ length: 9 }, (_, i) => {
          const ang = (i / 9) * Math.PI * 2;
          const x = 500 + 150 * Math.cos(ang), yy = topY - 80 + 40 * Math.sin(ang);
          return circ(x, yy, 8, '#aef9ff', stroke('#7f5bff', 2)) +
            line(x, yy, 500, topY - 80, '#aef9ff', 1.5, 'opacity="0.5"');
        }).join('');
    default: return '';
  }
}

// ---------------------------------------------------------------------------
// OVERLAY (topmost effects)
// ---------------------------------------------------------------------------
function drawOverlay(id) {
  switch (id) {
    case 'none': return '';
    case 'attn_lines':
      return Array.from({ length: 12 }, (_, i) => {
        const x = (i * 91) % W;
        return line(x, 0, 500, A.headCy, '#7f9bff', 1.5, 'opacity="0.35"');
      }).join('');
    case 'token_confetti':
      return Array.from({ length: 40 }, (_, i) => {
        const x = (i * 137) % W, y = (i * 211) % W;
        return rect(x, y, 18, 12, ['#ff5b5b','#ffd24e','#5bd6a0','#5b9bff','#b15bff'][i % 5], 'opacity="0.85" rx="3"');
      }).join('');
    case 'system_prompt':
      return rect(40, 60, 360, 120, '#101216', 'rx="14" opacity="0.92"') +
        text(60, 100, 20, 'SYSTEM', '#3ad07a', 'text-anchor="start"') +
        text(60, 140, 18, 'You are a helpful llama.', '#cfd6e2', 'text-anchor="start"');
    case 'speech_bubble':
      return rect(560, 70, 400, 150, '#ffffff', 'rx="24"' + ` ${stroke()}`) +
        poly('640,200 620,260 700,210', '#ffffff', stroke()) +
        text(760, 150, 30, 'As an LLMa,', '#1b1d22') +
        text(760, 190, 24, "I can't do that.", '#1b1d22');
    case 'scanlines':
      return Array.from({ length: 50 }, (_, i) =>
        rect(0, i * 20, W, 9, '#ff2eea', 'opacity="0.12"')).join('') +
        rect(0, 0, W, W, '#19f0c8', 'opacity="0.05"');
    case 'watermark':
      return Array.from({ length: 6 }, (_, r) =>
        Array.from({ length: 4 }, (_, c) =>
          text(120 + c * 240, 120 + r * 170, 26, 'AI-GENERATED', '#ffffff',
            `opacity="0.18" transform="rotate(-30 ${120 + c * 240} ${120 + r * 170})"`)).join('')).join('');
    default: return '';
  }
}

// ---------------------------------------------------------------------------
// Compose a full SVG document from chosen trait OPTION objects.
//   traits = { background, fur, outfit, neck, mouth, eyes, headwear, overlay }
// ---------------------------------------------------------------------------
export function buildSvg(traits) {
  const defs = makeDefs();
  const body =
    drawBackground(traits.background.id, defs) +
    drawLlama(traits.fur.id, defs) +
    drawOutfit(traits.outfit.id, defs) +
    drawNeck(traits.neck.id, defs) +
    drawMouth(traits.mouth.id) +
    drawEyes(traits.eyes.id, defs) +
    drawHeadwear(traits.headwear.id, defs) +
    drawOverlay(traits.overlay.id);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" width="${W}" height="${W}">` +
    defs.render() + body + `</svg>`;
}
