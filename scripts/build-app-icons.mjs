#!/usr/bin/env node
// Rasterizes the app icon into the PNG sizes the install prompts need (Android/Chrome maskable
// adaptive icon, desktop window icon, iOS home-screen apple-touch-icon).
//
// Dependency-free: no sharp/resvg/Playwright (none are reachable in this environment). The icon
// is a handful of geometric primitives, so we render them directly into an RGBA buffer with 4x
// supersampling and encode a PNG using Node's built-in zlib. The primitives mirror
// icons/app-icon.svg exactly — if you change that SVG, mirror the shape list below and re-run:
//   node scripts/build-app-icons.mjs            (npm run icons:build)
//
// Outputs (committed, like other assets):
//   icons/icon-192.png            192x192  purpose any
//   icons/icon-512.png            512x512  purpose any
//   icons/icon-512-maskable.png   512x512  purpose maskable (12.5% safe-zone padding, opaque bg)
//   icons/apple-touch-180.png     180x180  opaque bg (iOS ignores transparency/maskable)

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ICONS = path.join(__dirname, '..', 'icons');

const GOLD = [0xff, 0xd5, 0x4f];
const DARK = [0x1a, 0x1a, 0x1a];
const WHITE = [0xe8, 0xe8, 0xe8];
const VB = 512;        // SVG viewBox
const SS = 4;          // supersample factor

// Composite src (rgb, alpha 0..1) over dst (rgba 0..255) in place.
function over(dst, rgb, a) {
  const ia = 1 - a;
  dst[0] = rgb[0] * a + dst[0] * ia;
  dst[1] = rgb[1] * a + dst[1] * ia;
  dst[2] = rgb[2] * a + dst[2] * ia;
  dst[3] = 255 * a + dst[3] * ia;
}

// Colour at a viewBox-space point (px,py). Painter's order matches app-icon.svg.
function sampleColor(px, py) {
  const c = [0, 0, 0, 0]; // transparent RGBA accumulator
  const dx = px - 256, dy = py - 256;
  const d = Math.hypot(dx, dy);
  const sw = 4; // stroke half-width (SVG stroke-width 8)
  // 1. main disc: dark fill r248 + gold ring
  if (d <= 248) over(c, DARK, 1);
  if (Math.abs(d - 248) <= sw) over(c, GOLD, 1);
  // 2. equator line y=256 across x[8,504]
  if (Math.abs(py - 256) <= sw && px >= 8 && px <= 504) over(c, GOLD, 1);
  // 3. inner ring r72 (dark fill + gold ring)
  if (d <= 72) over(c, DARK, 1);
  if (Math.abs(d - 72) <= sw) over(c, GOLD, 1);
  // 4. centre gold dot r40
  if (d <= 40) over(c, GOLD, 1);
  // 5. translucent light overlay on the right half of the disc
  if (px >= 256 && d <= 248) over(c, WHITE, 0.92);
  return c;
}

function render(size, pad, opaque) {
  const inset = Math.round(size * pad);
  const span = size - inset * 2;          // art region in output px
  const S = size * SS;                     // supersampled dimension
  const buf = Buffer.alloc(S * S * 4);     // RGBA
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      // output px (with padding) → viewBox coord
      const ox = x / SS, oy = y / SS;
      const vx = ((ox - inset) / span) * VB;
      const vy = ((oy - inset) / span) * VB;
      let c;
      if (vx < 0 || vx > VB || vy < 0 || vy > VB) c = [0, 0, 0, 0];
      else c = sampleColor(vx, vy);
      const i = (y * S + x) * 4;
      buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = c[3];
    }
  }
  // Downsample SSxSS → size, averaging (gives anti-aliasing). Optionally flatten onto opaque bg.
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const i = ((y * SS + sy) * S + (x * SS + sx)) * 4;
          r += buf[i]; g += buf[i + 1]; b += buf[i + 2]; a += buf[i + 3];
        }
      }
      const n = SS * SS;
      r /= n; g /= n; b /= n; a /= n;
      const o = (y * size + x) * 4;
      if (opaque) {
        const af = a / 255;
        out[o] = r * af + DARK[0] * (1 - af);
        out[o + 1] = g * af + DARK[1] * (1 - af);
        out[o + 2] = b * af + DARK[2] * (1 - af);
        out[o + 3] = 255;
      } else {
        out[o] = r; out[o + 1] = g; out[o + 2] = b; out[o + 3] = a;
      }
    }
  }
  return out;
}

// Minimal PNG (RGBA, 8-bit) encoder.
function encodePng(rgba, width, height) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  const crcTable = (() => {
    const t = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  const crc32 = (b) => {
    let c = 0xffffffff;
    for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
    const t = Buffer.from(type, 'ascii');
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
    return Buffer.concat([len, t, data, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0; // 8-bit RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0)),
  ]);
}

const TARGETS = [
  { file: 'icon-192.png', size: 192, pad: 0, opaque: false },
  { file: 'icon-512.png', size: 512, pad: 0, opaque: false },
  { file: 'icon-512-maskable.png', size: 512, pad: 0.125, opaque: true },
  { file: 'apple-touch-180.png', size: 180, pad: 0, opaque: true },
];

for (const t of TARGETS) {
  const rgba = render(t.size, t.pad, t.opaque);
  const png = encodePng(rgba, t.size, t.size);
  fs.writeFileSync(path.join(ICONS, t.file), png);
  console.log(`[icons] wrote icons/${t.file} (${t.size}x${t.size}, ${png.length} bytes)`);
}
console.log('[icons] done.');
