// Dependency-free PNG → single-frame GIF converter.
//
// Why this exists: the battle engine serves every Pokemon sprite as
// `sprites/<gen5ani-dir>/<slug>.gif` (see getSprite / LOCAL_SPRITE_MANIFEST in
// battle.html). Upstream has *animated* GIFs for only part of the roster; for the
// rest the best open pixel art is PokeAPI's 96x96 static PNG. Rather than teach the
// runtime a second file extension, we re-encode those PNGs as one-frame GIFs so the
// existing manifest / offline-cache / fallback pipeline keeps working unchanged.
//
// Scope: non-interlaced PNGs, colour types 0/2/3/4/6 at bit depths 1/2/4/8/16.
// That covers every sprite PokeAPI serves. Interlaced input throws.

import zlib from 'node:zlib';

// ── PNG ──────────────────────────────────────────────────────────────────────

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function readChunks(buf) {
  if (!buf.subarray(0, 8).equals(PNG_MAGIC)) throw new Error('not a PNG');
  const chunks = [];
  let off = 8;
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    chunks.push({ type, data });
    off += 12 + len; // length + type + data + crc
    if (type === 'IEND') break;
  }
  return chunks;
}

const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

function unfilter(raw, width, height, bpp, bytesPerRow) {
  const out = Buffer.alloc(height * bytesPerRow);
  let pos = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[pos++];
    const line = raw.subarray(pos, pos + bytesPerRow);
    pos += bytesPerRow;
    const cur = out.subarray(y * bytesPerRow, (y + 1) * bytesPerRow);
    const prev = y > 0 ? out.subarray((y - 1) * bytesPerRow, y * bytesPerRow) : null;
    for (let x = 0; x < bytesPerRow; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      switch (filter) {
        case 0: break;
        case 1: v += a; break;
        case 2: v += b; break;
        case 3: v += (a + b) >> 1; break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
          break;
        }
        default: throw new Error(`unknown PNG filter ${filter}`);
      }
      cur[x] = v & 0xff;
    }
  }
  return out;
}

function samplesFromRow(row, width, channels, bitDepth) {
  // Returns width*channels sample values normalised to 0..255 (16-bit → high byte).
  const out = new Uint8Array(width * channels);
  if (bitDepth === 8) {
    for (let i = 0; i < out.length; i++) out[i] = row[i];
    return out;
  }
  if (bitDepth === 16) {
    for (let i = 0; i < out.length; i++) out[i] = row[i * 2];
    return out;
  }
  // Sub-byte depths: indexed / greyscale only, always 1 channel in practice.
  const perByte = 8 / bitDepth;
  const mask = (1 << bitDepth) - 1;
  for (let i = 0; i < out.length; i++) {
    const byte = row[Math.floor(i / perByte)];
    const shift = 8 - bitDepth * ((i % perByte) + 1);
    out[i] = (byte >> shift) & mask;
  }
  return out;
}

/**
 * Decode a PNG into RGBA plus, when the source is already palettised, the
 * original palette + index plane (so indexed → GIF is lossless).
 * @returns {{width:number,height:number,rgba:Uint8Array,palette:?number[][],indices:?Uint8Array}}
 */
export function decodePng(buf) {
  const chunks = readChunks(buf);
  const ihdr = chunks.find((c) => c.type === 'IHDR');
  if (!ihdr) throw new Error('PNG has no IHDR');
  const width = ihdr.data.readUInt32BE(0);
  const height = ihdr.data.readUInt32BE(4);
  const bitDepth = ihdr.data[8];
  const colorType = ihdr.data[9];
  if (ihdr.data[12] !== 0) throw new Error('interlaced PNG not supported');

  const channels = CHANNELS[colorType];
  if (!channels) throw new Error(`unsupported PNG colour type ${colorType}`);

  const idat = Buffer.concat(chunks.filter((c) => c.type === 'IDAT').map((c) => c.data));
  const raw = zlib.inflateSync(idat);
  const bitsPerPixel = channels * bitDepth;
  const bytesPerRow = Math.ceil((width * bitsPerPixel) / 8);
  const bpp = Math.max(1, Math.ceil(bitsPerPixel / 8));
  const planes = unfilter(raw, width, height, bpp, bytesPerRow);

  const plteChunk = chunks.find((c) => c.type === 'PLTE');
  const trnsChunk = chunks.find((c) => c.type === 'tRNS');

  let palette = null;
  if (colorType === 3) {
    if (!plteChunk) throw new Error('indexed PNG without PLTE');
    palette = [];
    for (let i = 0; i * 3 + 2 < plteChunk.data.length; i++) {
      const alpha = trnsChunk && i < trnsChunk.data.length ? trnsChunk.data[i] : 255;
      palette.push([plteChunk.data[i * 3], plteChunk.data[i * 3 + 1], plteChunk.data[i * 3 + 2], alpha]);
    }
  }

  const rgba = new Uint8Array(width * height * 4);
  const indices = palette ? new Uint8Array(width * height) : null;

  for (let y = 0; y < height; y++) {
    const row = planes.subarray(y * bytesPerRow, (y + 1) * bytesPerRow);
    const samples = samplesFromRow(row, width, channels, bitDepth);
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      if (colorType === 3) {
        const idx = samples[x];
        indices[y * width + x] = idx;
        const p = palette[idx] || [0, 0, 0, 0];
        rgba[o] = p[0]; rgba[o + 1] = p[1]; rgba[o + 2] = p[2]; rgba[o + 3] = p[3];
      } else if (colorType === 0 || colorType === 4) {
        const g = samples[x * channels];
        const a = colorType === 4 ? samples[x * channels + 1] : 255;
        rgba[o] = g; rgba[o + 1] = g; rgba[o + 2] = g; rgba[o + 3] = a;
      } else {
        rgba[o] = samples[x * channels];
        rgba[o + 1] = samples[x * channels + 1];
        rgba[o + 2] = samples[x * channels + 2];
        rgba[o + 3] = colorType === 6 ? samples[x * channels + 3] : 255;
      }
    }
  }
  return { width, height, rgba, palette, indices };
}

// ── Resize + quantise ────────────────────────────────────────────────────────

/** Area-average downscale. Alpha-weighted so transparent pixels don't bleed dark halos. */
export function resizeRgba(rgba, width, height, targetW, targetH) {
  const out = new Uint8Array(targetW * targetH * 4);
  const sx = width / targetW;
  const sy = height / targetH;
  for (let y = 0; y < targetH; y++) {
    const y0 = Math.floor(y * sy), y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy));
    for (let x = 0; x < targetW; x++) {
      const x0 = Math.floor(x * sx), x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx));
      let r = 0, g = 0, b = 0, a = 0, aw = 0, n = 0;
      for (let yy = y0; yy < y1 && yy < height; yy++) {
        for (let xx = x0; xx < x1 && xx < width; xx++) {
          const o = (yy * width + xx) * 4;
          const al = rgba[o + 3];
          r += rgba[o] * al; g += rgba[o + 1] * al; b += rgba[o + 2] * al;
          a += al; aw += al; n++;
        }
      }
      const o = (y * targetW + x) * 4;
      if (!n || !aw) { out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 0; continue; }
      out[o] = Math.round(r / aw);
      out[o + 1] = Math.round(g / aw);
      out[o + 2] = Math.round(b / aw);
      out[o + 3] = Math.round(a / n);
    }
  }
  return out;
}

/**
 * Median-cut quantisation to at most `maxColors` opaque colours, reserving one
 * palette slot for transparency. Pixels below `alphaCutoff` become transparent
 * (GIF has no partial alpha).
 */
export function quantize(rgba, pixelCount, maxColors = 255, alphaCutoff = 128) {
  const opaque = [];
  for (let i = 0; i < pixelCount; i++) {
    if (rgba[i * 4 + 3] >= alphaCutoff) opaque.push(i);
  }
  // Exact palette when the image is already simple enough (the common case for
  // 96x96 game sprites) — avoids any colour drift.
  const exact = new Map();
  let exactOk = true;
  for (const i of opaque) {
    const key = (rgba[i * 4] << 16) | (rgba[i * 4 + 1] << 8) | rgba[i * 4 + 2];
    if (!exact.has(key)) {
      if (exact.size >= maxColors) { exactOk = false; break; }
      exact.set(key, exact.size);
    }
  }

  let colors;
  if (exactOk) {
    colors = [...exact.keys()].map((k) => [(k >> 16) & 0xff, (k >> 8) & 0xff, k & 0xff]);
  } else {
    // Median cut over the opaque pixels.
    let boxes = [opaque];
    while (boxes.length < maxColors) {
      let bestIdx = -1, bestRange = -1, bestChan = 0;
      for (let bi = 0; bi < boxes.length; bi++) {
        const box = boxes[bi];
        if (box.length < 2) continue;
        for (let c = 0; c < 3; c++) {
          let lo = 255, hi = 0;
          for (const i of box) { const v = rgba[i * 4 + c]; if (v < lo) lo = v; if (v > hi) hi = v; }
          const range = hi - lo;
          if (range > bestRange) { bestRange = range; bestIdx = bi; bestChan = c; }
        }
      }
      if (bestIdx < 0 || bestRange <= 0) break;
      const box = boxes[bestIdx];
      box.sort((p, q) => rgba[p * 4 + bestChan] - rgba[q * 4 + bestChan]);
      const mid = box.length >> 1;
      boxes.splice(bestIdx, 1, box.slice(0, mid), box.slice(mid));
    }
    colors = boxes.filter((b) => b.length).map((box) => {
      let r = 0, g = 0, b = 0;
      for (const i of box) { r += rgba[i * 4]; g += rgba[i * 4 + 1]; b += rgba[i * 4 + 2]; }
      return [Math.round(r / box.length), Math.round(g / box.length), Math.round(b / box.length)];
    });
  }
  if (!colors.length) colors = [[0, 0, 0]];

  // Index 0 is transparent; opaque colours start at 1.
  const palette = [[0, 0, 0, 0], ...colors.map(([r, g, b]) => [r, g, b, 255])];
  const lookup = new Map();
  const indices = new Uint8Array(pixelCount);
  for (let i = 0; i < pixelCount; i++) {
    if (rgba[i * 4 + 3] < alphaCutoff) { indices[i] = 0; continue; }
    const key = (rgba[i * 4] << 16) | (rgba[i * 4 + 1] << 8) | rgba[i * 4 + 2];
    let idx = lookup.get(key);
    if (idx === undefined) {
      let best = 1, bestD = Infinity;
      for (let c = 0; c < colors.length; c++) {
        const dr = colors[c][0] - rgba[i * 4];
        const dg = colors[c][1] - rgba[i * 4 + 1];
        const db = colors[c][2] - rgba[i * 4 + 2];
        const d = dr * dr + dg * dg + db * db;
        if (d < bestD) { bestD = d; best = c + 1; }
      }
      idx = best;
      lookup.set(key, idx);
    }
    indices[i] = idx;
  }
  return { palette, indices, transparentIndex: 0 };
}

// ── GIF ──────────────────────────────────────────────────────────────────────

class BitWriter {
  constructor() { this.bytes = []; this.cur = 0; this.bits = 0; }
  write(code, len) {
    this.cur |= code << this.bits;
    this.bits += len;
    while (this.bits >= 8) {
      this.bytes.push(this.cur & 0xff);
      this.cur >>= 8;
      this.bits -= 8;
    }
  }
  flush() { if (this.bits > 0) { this.bytes.push(this.cur & 0xff); this.cur = 0; this.bits = 0; } }
}

function lzwEncode(indices, minCodeSize) {
  const clear = 1 << minCodeSize;
  const eoi = clear + 1;
  const bw = new BitWriter();
  let codeSize = minCodeSize + 1;
  let next = eoi + 1;
  let dict = new Map();
  bw.write(clear, codeSize);

  let prefix = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i];
    const key = prefix * 4096 + k;
    const found = dict.get(key);
    if (found !== undefined) { prefix = found; continue; }
    bw.write(prefix, codeSize);
    if (next < 4096) {
      dict.set(key, next++);
      if (next - 1 === (1 << codeSize) && codeSize < 12) codeSize++;
    } else {
      bw.write(clear, codeSize);
      dict = new Map();
      next = eoi + 1;
      codeSize = minCodeSize + 1;
    }
    prefix = k;
  }
  bw.write(prefix, codeSize);
  bw.write(eoi, codeSize);
  bw.flush();
  return bw.bytes;
}

/** Encode one indexed frame as a GIF89a buffer. */
export function encodeGif({ width, height, palette, indices, transparentIndex }) {
  let bits = 1;
  while ((1 << bits) < palette.length) bits++;
  if (bits > 8) throw new Error('palette larger than 256 entries');
  const tableSize = 1 << bits;

  const out = [];
  const push = (...b) => out.push(...b);
  const pushStr = (s) => { for (const ch of s) out.push(ch.charCodeAt(0)); };
  const pushU16 = (v) => push(v & 0xff, (v >> 8) & 0xff);

  pushStr('GIF89a');
  pushU16(width); pushU16(height);
  push(0x80 | (bits - 1), 0, 0); // global colour table, no sort, background 0
  for (let i = 0; i < tableSize; i++) {
    const c = palette[i] || [0, 0, 0, 0];
    push(c[0], c[1], c[2]);
  }
  if (transparentIndex != null) {
    push(0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, transparentIndex & 0xff, 0x00);
  }
  push(0x2c); pushU16(0); pushU16(0); pushU16(width); pushU16(height); push(0x00);

  const minCodeSize = Math.max(2, bits);
  push(minCodeSize);
  const data = lzwEncode(indices, minCodeSize);
  for (let i = 0; i < data.length; i += 255) {
    const block = data.slice(i, i + 255);
    push(block.length, ...block);
  }
  push(0x00, 0x3b);
  return Buffer.from(out);
}

/**
 * Convert a PNG buffer to a single-frame GIF.
 * @param {Buffer} buf PNG bytes
 * @param {{maxSize?:number}} opts optional longest-edge clamp (downscales, never upscales)
 */
export function pngToGif(buf, { maxSize } = {}) {
  const png = decodePng(buf);
  let { width, height, rgba, palette, indices } = png;

  const needsResize = maxSize && Math.max(width, height) > maxSize;
  if (needsResize) {
    const scale = maxSize / Math.max(width, height);
    const tw = Math.max(1, Math.round(width * scale));
    const th = Math.max(1, Math.round(height * scale));
    rgba = resizeRgba(rgba, width, height, tw, th);
    width = tw; height = th;
    palette = null; indices = null; // resampled: original palette no longer applies
  }

  if (palette && indices && palette.length <= 256) {
    // Lossless path — reuse the PNG's own palette. GIF alpha is 1-bit, so the
    // first fully-transparent entry becomes the transparent index; any partially
    // transparent entry is flattened to opaque (PokeAPI sprites are 1-bit anyway).
    let transparentIndex = palette.findIndex((c) => c[3] === 0);
    let pal = palette.map((c) => [c[0], c[1], c[2], 255]);
    if (transparentIndex < 0) {
      if (pal.length < 256) { transparentIndex = pal.length; pal.push([0, 0, 0, 255]); }
      else transparentIndex = null;
    }
    return encodeGif({ width, height, palette: pal, indices, transparentIndex });
  }

  const q = quantize(rgba, width * height);
  return encodeGif({ width, height, palette: q.palette, indices: q.indices, transparentIndex: q.transparentIndex });
}
