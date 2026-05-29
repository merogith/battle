#!/usr/bin/env node
// Assembles Game-Boy-Advance (gen3) map-preview backdrops into single PNG images
// for Story Mode scene backgrounds. The gen3 decomp stores each scene as a
// deduplicated 8x8 tile ATLAS (tiles.png, 8-bit indexed) plus a TILEMAP (tilemap.bin,
// GBA BG-map entries) that says where each tile goes + flips. Neither is a usable
// image on its own; this script blits the atlas through the tilemap into a 240x160
// scene and writes it as a compact indexed PNG.
//
// Self-contained: a minimal indexed-PNG decoder/encoder over Node's built-in zlib
// (no canvas/Playwright/native deps). Source art is fan-ripped gen3 decomp graphics
// (see ATTRIBUTION.md) — reference/placeholder footing, same as the Showdown sprites.
//
// Usage: node scripts/build-story-backgrounds.mjs [--only <name>] [--scale N]

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'sprites', 'story', 'backgrounds');

// name -> gen3 source (repo + scene folder under graphics/map_preview). The `mood`
// is documentation for which story screens consume it (wired in battle.html).
const SCENES = [
  { name: 'gen3-cave',    repo: 'pret/pokefirered', scene: 'cerulean_cave',   mood: 'caged-god / underground / dark catch' },
  { name: 'gen3-forest',  repo: 'pret/pokefirered', scene: 'viridian_forest', mood: 'wild encounter / route catch' },
  { name: 'gen3-safari',  repo: 'pret/pokefirered', scene: 'safari_zone',     mood: 'safari zone' },
  { name: 'gen3-mountain',repo: 'pret/pokefirered', scene: 'mt_moon',         mood: 'mountain / rock route' },
  { name: 'gen3-cavern',  repo: 'pret/pokefirered', scene: 'rock_tunnel',     mood: 'underground / cavern' },
  { name: 'gen3-villain', repo: 'pret/pokefirered', scene: 'rocket_hideout',  mood: 'mystery figure / villain' },
  { name: 'gen3-mansion', repo: 'pret/pokefirered', scene: 'pokemon_mansion', mood: 'ominous / abandoned' },
  { name: 'gen3-league',  repo: 'pret/pokefirered', scene: 'victory_road',    mood: 'league approach / crucible' },
  { name: 'gen3-sea',     repo: 'pret/pokefirered', scene: 'seafoam_islands', mood: 'water / coast' },
];

const SCREEN_TILES_W = 30, SCREEN_TILES_H = 20, MAP_STRIDE = 32; // GBA: 240x160 visible from a 32-wide map
const CROP_TOP_TILES = 3; // drop the top 3 rows (24px) — the map-preview location-name plate lives there

// ---------- CRC32 (PNG chunk checksums) ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; }
  return t;
})();
function crc32(buf) { let c = 0xFFFFFFFF; for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }

// ---------- minimal indexed-PNG decode (8-bit, colorType 3) ----------
function paeth(a, b, c) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c); }
function decodeIndexedPNG(buf) {
  if (buf.readUInt32BE(0) !== 0x89504E47) throw new Error('not a PNG');
  let off = 8, width = 0, height = 0, bitDepth = 0, colorType = 0; const palette = []; const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off); const type = buf.toString('ascii', off + 4, off + 8); const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); bitDepth = data[8]; colorType = data[9]; }
    else if (type === 'PLTE') { for (let i = 0; i < data.length; i += 3) palette.push([data[i], data[i + 1], data[i + 2]]); }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (colorType !== 3 || bitDepth !== 8) throw new Error(`expected 8-bit indexed PNG, got colorType=${colorType} bitDepth=${bitDepth}`);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = 1, stride = width * bpp;
  const out = new Uint8Array(width * height);
  let prev = new Uint8Array(stride);
  let p = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[p++]; const line = raw.subarray(p, p + stride); p += stride;
    const cur = new Uint8Array(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0; let v = line[x];
      if (filter === 1) v = (v + a) & 0xFF; else if (filter === 2) v = (v + b) & 0xFF; else if (filter === 3) v = (v + ((a + b) >> 1)) & 0xFF; else if (filter === 4) v = (v + paeth(a, b, c)) & 0xFF;
      cur[x] = v;
    }
    out.set(cur, y * width); prev = cur;
  }
  return { width, height, palette, indices: out };
}

// ---------- minimal indexed-PNG encode (8-bit, colorType 3, opaque) ----------
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}
function encodeIndexedPNG(width, height, indices, palette) {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 3; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const plte = Buffer.alloc(palette.length * 3); palette.forEach((c, i) => { plte[i * 3] = c[0]; plte[i * 3 + 1] = c[1]; plte[i * 3 + 2] = c[2]; });
  const raw = Buffer.alloc((width + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width + 1)] = 0; // per-scanline filter: none
    for (let x = 0; x < width; x++) raw[y * (width + 1) + 1 + x] = indices[y * width + x];
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('PLTE', plte), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ---------- assemble atlas + tilemap -> scene indices ----------
function assemble(atlas, bin, scale) {
  const tilesPerRow = atlas.width / 8;
  const rows = SCREEN_TILES_H - CROP_TOP_TILES;
  const W = SCREEN_TILES_W * 8, H = rows * 8;
  const scene = new Uint8Array(W * H);
  for (let sy = 0; sy < rows; sy++) {
    const mapRow = sy + CROP_TOP_TILES;
    for (let sx = 0; sx < SCREEN_TILES_W; sx++) {
      const entry = bin.readUInt16LE((mapRow * MAP_STRIDE + sx) * 2);
      const tileIdx = entry & 0x3FF, hflip = (entry >> 10) & 1, vflip = (entry >> 11) & 1;
      const srcX = (tileIdx % tilesPerRow) * 8, srcY = Math.floor(tileIdx / tilesPerRow) * 8;
      if (srcY + 8 > atlas.height) continue; // out-of-range tile -> leave palette index 0
      for (let py = 0; py < 8; py++) {
        for (let px = 0; px < 8; px++) {
          const ax = srcX + (hflip ? 7 - px : px), ay = srcY + (vflip ? 7 - py : py);
          scene[(sy * 8 + py) * W + (sx * 8 + px)] = atlas.indices[ay * atlas.width + ax];
        }
      }
    }
  }
  if (scale && scale > 1) {
    const W2 = W * scale, H2 = H * scale; const up = new Uint8Array(W2 * H2);
    for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) up[y * W2 + x] = scene[Math.floor(y / scale) * W + Math.floor(x / scale)];
    return { width: W2, height: H2, indices: up };
  }
  return { width: W, height: H, indices: scene };
}

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'story-bg/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) { res.resume(); return download(res.headers.location).then(resolve, reject); }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode} ${url}`)); }
      const chunks = []; res.on('data', (c) => chunks.push(c)); res.on('end', () => resolve(Buffer.concat(chunks))); res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  const only = (() => { const a = process.argv.find((x) => x === '--only'); return a ? process.argv[process.argv.indexOf(a) + 1] : null; })();
  const scale = (() => { const a = process.argv.find((x) => x.startsWith('--scale=')); return a ? Number(a.slice(8)) : 1; })();
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest = [];
  for (const s of SCENES) {
    if (only && s.name !== only) continue;
    const base = `https://raw.githubusercontent.com/${s.repo}/master/graphics/map_preview/${s.scene}`;
    try {
      const [pngBuf, binBuf] = await Promise.all([download(`${base}/tiles.png`), download(`${base}/tilemap.bin`)]);
      const atlas = decodeIndexedPNG(pngBuf);
      const scene = assemble(atlas, binBuf, scale);
      const out = encodeIndexedPNG(scene.width, scene.height, scene.indices, atlas.palette);
      const dest = path.join(OUT_DIR, `${s.name}.png`);
      fs.writeFileSync(dest, out);
      manifest.push({ name: s.name, mood: s.mood, src: `${s.repo}/${s.scene}`, dims: `${scene.width}x${scene.height}`, bytes: out.length });
      console.log(`[story-bg] ${s.name.padEnd(14)} <- ${s.repo}/${s.scene}  ${scene.width}x${scene.height}  ${(out.length / 1024).toFixed(1)}KB`);
    } catch (e) {
      console.error(`[story-bg] FAILED ${s.name} (${s.scene}): ${e.message}`);
    }
  }
  console.log(`[story-bg] done: ${manifest.length} scene(s) -> ${path.relative(ROOT, OUT_DIR)}`);
}

main().catch((e) => { console.error('[story-bg] fatal:', e); process.exit(1); });
