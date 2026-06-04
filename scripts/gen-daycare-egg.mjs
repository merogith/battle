// Generates icons/story/story_daycare.png — a 24x24 pixel egg icon for the
// Daycare facility, resolving the daycare/Pokémon-Center icon collision.
// Pure Node (built-in zlib only); re-run to regenerate. Palette ties the egg
// to the daycare's green accent (#9ccc65 / #aed581).
//
//   node scripts/gen-daycare-egg.mjs
//
import zlib from 'node:zlib';
import { writeFileSync } from 'node:fs';

const W = 24, H = 24;
const px = new Uint8Array(W * H * 4); // RGBA, transparent by default

function set(x, y, [r, g, b, a = 255]) {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 4;
    px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a;
}

// Palette
const OUTLINE = [74, 56, 33, 255];    // dark brown
const FILL    = [247, 238, 221, 255]; // cream
const SHADE   = [228, 210, 178, 255]; // warm shadow (lower-right interior)
const HILITE  = [255, 252, 244, 255]; // soft highlight (upper-left interior)
const SPOT    = [156, 204, 101, 255]; // daycare green spot

// Egg silhouette: tapered ellipse (narrower top, rounder bottom).
const cx = 11.5, cy = 12.8, ry = 9.6, rxMax = 7.7;
function rxAt(y) {
    const t = (y - cy) / ry;               // -1 (top) .. 1 (bottom)
    if (Math.abs(t) > 1) return -1;
    const base = Math.sqrt(1 - t * t);
    const taper = t < 0 ? (1 + 0.30 * t) : 1; // pinch the top
    return rxMax * base * taper;
}

for (let y = 0; y < H; y++) {
    const rx = rxAt(y);
    if (rx < 0) continue;
    for (let x = 0; x < W; x++) {
        const dx = x - cx;
        const adx = Math.abs(dx);
        if (adx > rx) continue;
        if (adx > rx - 1.15) { set(x, y, OUTLINE); continue; } // 1px rim
        // interior shading
        const upperLeft = dx < -1.5 && y < cy - 1;
        const lowerRight = dx > 1.5 && y > cy + 1.5;
        if (upperLeft) set(x, y, HILITE);
        else if (lowerRight) set(x, y, SHADE);
        else set(x, y, FILL);
    }
}

// A few green spots so the egg reads as "daycare" (not a plain egg).
function spot(cxp, cyp, rxp, ryp) {
    for (let y = Math.floor(cyp - ryp); y <= Math.ceil(cyp + ryp); y++) {
        for (let x = Math.floor(cxp - rxp); x <= Math.ceil(cxp + rxp); x++) {
            const nx = (x - cxp) / rxp, ny = (y - cyp) / ryp;
            if (nx * nx + ny * ny > 1) continue;
            const i = (y * W + x) * 4;
            if (px[i + 3] === 0) continue;          // only on the egg body
            if (px[i] === OUTLINE[0] && px[i + 1] === OUTLINE[1]) continue; // not over rim
            set(x, y, SPOT);
        }
    }
}
spot(8.5, 8.5, 2.0, 1.5);
spot(14.0, 13.5, 1.8, 1.4);
spot(10.0, 16.5, 1.6, 1.2);

// ── encode PNG (color type 6 = RGBA) ──────────────────────────────────────
const crcTable = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        t[n] = c >>> 0;
    }
    return t;
})();
function crc32(buf) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0);
    return Buffer.concat([len, body, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;   // bit depth
ihdr[9] = 6;   // color type RGBA
ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

// raw scanlines with filter byte 0
const raw = Buffer.alloc(H * (1 + W * 4));
for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 4)] = 0;
    px.subarray(y * W * 4, (y + 1) * W * 4)
      .forEach((v, i) => { raw[y * (1 + W * 4) + 1 + i] = v; });
}
const idat = zlib.deflateSync(raw, { level: 9 });

const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
]);
writeFileSync(new URL('../icons/story/story_daycare.png', import.meta.url), png);
console.log('wrote icons/story/story_daycare.png', png.length, 'bytes,', W + 'x' + H);
