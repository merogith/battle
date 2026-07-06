#!/usr/bin/env node
/**
 * fetch-randbats.mjs — bake local Random Battle snapshots for the offline safety net.
 *
 * battle.html's foe roller falls back to Showdown Random-Battle sets (fetchRandbatsForGen)
 * when a species has no usable Smogon competitive set. That fetch hits data.pkmn.cc live, so
 * OFFLINE the fallback is empty and a zero-data species degrades to the last-resort
 * Tackle/Growl/Leer/Quick Attack build. Committing a local snapshot under data/randbats/ makes
 * the net work offline (fetchRandbatsForGen prefers the local file, then falls back to the API).
 *
 * Usage:
 *   node scripts/fetch-randbats.mjs           # gen 9 only (covers most competitive mons)
 *   node scripts/fetch-randbats.mjs --all      # gens 4..9
 *   node scripts/fetch-randbats.mjs 8 9        # explicit gens
 *
 * Note: requires outbound access to https://data.pkmn.cc. In sandboxes where egress policy
 * blocks that host, run this on a machine/CI that can reach it and commit the result.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'data', 'randbats');

function parseGens(argv) {
  const args = argv.slice(2);
  if (args.includes('--all')) return [4, 5, 6, 7, 8, 9];
  const nums = args.map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= 9);
  return nums.length ? nums : [9];
}

async function fetchGen(gen) {
  const url = `https://data.pkmn.cc/randbats/gen${gen}randombattle.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`gen${gen}: HTTP ${res.status}`);
  const data = await res.json();
  const n = Object.keys(data).length;
  if (n === 0) throw new Error(`gen${gen}: empty payload`);
  const out = join(OUT_DIR, `gen${gen}.json`);
  writeFileSync(out, JSON.stringify(data), 'utf8');
  console.log(`  gen${gen}: ${n} species → data/randbats/gen${gen}.json`);
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const gens = parseGens(process.argv);
  console.log(`Fetching Random Battle snapshots for gens: ${gens.join(', ')}`);
  let ok = 0;
  for (const g of gens) {
    try {
      await fetchGen(g);
      ok++;
    } catch (err) {
      console.error(`  ${err.message}`);
    }
  }
  console.log(`\nDone — ${ok}/${gens.length} snapshots written.`);
  if (ok === 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
