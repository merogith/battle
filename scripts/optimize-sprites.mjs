#!/usr/bin/env node
// Optimize Pokemon battle sprites with gifsicle.
// Targets only Mega/Primal/Gmax sprites and only files larger than a threshold —
// PokeAPI's pre-optimized base species don't benefit further from -O3.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SPRITES = path.join(ROOT, 'sprites');

const DIRS = ['gen5ani', 'gen5ani-shiny', 'gen5ani-back', 'gen5ani-back-shiny'];
const FORM_RE = /(-mega|-megax|-megay|-primal|-gmax|-eternamax)\.gif$/i;
// Only attempt optimization on files larger than this — smaller ones are already minimal.
const SIZE_THRESHOLD = 200 * 1024;
// Lossy quality — 80 = light, 120 = medium, 200 = aggressive. 80 is barely visible.
const LOSSY = Number(process.argv.find((a) => a.startsWith('--lossy='))?.slice('--lossy='.length) || 80);
const DRY = process.argv.includes('--dry');

function has(cmd) {
  const r = spawnSync('which', [cmd], { encoding: 'utf8' });
  return r.status === 0 && r.stdout.trim();
}
if (!has('gifsicle')) {
  console.error('[optimize] gifsicle not found. Install with `apt-get install gifsicle`.');
  process.exit(1);
}

function optimize(src) {
  const sizeBefore = fs.statSync(src).size;
  if (sizeBefore < SIZE_THRESHOLD) return { skip: true, sizeBefore };
  if (DRY) return { dry: true, sizeBefore };
  const tmp = src + '.tmp';
  const r = spawnSync('gifsicle', ['-O3', `--lossy=${LOSSY}`, src, '-o', tmp], { encoding: 'utf8' });
  if (r.status !== 0) {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    return { error: r.stderr || 'gifsicle failed', sizeBefore };
  }
  const sizeAfter = fs.statSync(tmp).size;
  // Only replace if we saved at least 2%
  if (sizeAfter < sizeBefore * 0.98) {
    fs.renameSync(tmp, src);
    return { sizeBefore, sizeAfter, saved: sizeBefore - sizeAfter };
  }
  fs.unlinkSync(tmp);
  return { sizeBefore, sizeAfter, saved: 0 };
}

let totalBefore = 0, totalAfter = 0, optimized = 0, skipped = 0, errors = 0;
for (const d of DIRS) {
  const dir = path.join(SPRITES, d);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) {
    if (!FORM_RE.test(f)) continue;
    const src = path.join(dir, f);
    const r = optimize(src);
    if (r.skip) { skipped++; continue; }
    if (r.error) { errors++; console.error(`  [err] ${d}/${f}: ${r.error.split('\n')[0]}`); continue; }
    if (r.dry) {
      console.log(`  [dry] ${d}/${f}: ${(r.sizeBefore / 1024).toFixed(1)}KB`);
      continue;
    }
    totalBefore += r.sizeBefore;
    totalAfter += r.sizeAfter;
    optimized++;
    if (r.saved > 0) {
      const pct = ((1 - r.sizeAfter / r.sizeBefore) * 100).toFixed(1);
      console.log(`  ${d}/${f}: ${(r.sizeBefore / 1024).toFixed(0)}KB → ${(r.sizeAfter / 1024).toFixed(0)}KB (-${pct}%)`);
    }
  }
}
const savedKB = ((totalBefore - totalAfter) / 1024).toFixed(0);
const savedPct = totalBefore > 0 ? ((1 - totalAfter / totalBefore) * 100).toFixed(1) : 0;
console.log(`[optimize] files: ${optimized} optimized, ${skipped} under threshold, ${errors} errors`);
console.log(`[optimize] saved ${savedKB}KB (${savedPct}%) across ${optimized} files (lossy=${LOSSY})`);
