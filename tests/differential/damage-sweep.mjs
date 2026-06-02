// Damage-modifier sweep for the differential harness.
//
// A single-roll damage comparison can't tell a 1.3× item bug from the 85-100%
// roll band. So here we run each matchup over MANY seeds in both engines and
// compare the resulting damage RANGES: two correct engines produce overlapping
// ranges; a missing or wrong multiplier shifts one range clear of the other.
//
// This is the RNG-robust way to probe the multiplicative layer — items,
// abilities, and stat-derived damage — i.e. the project's headline goal area.
//
//   node tests/differential/damage-sweep.mjs   (writes DAMAGE_SWEEP_REPORT.md)

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runShowdownBattle } from './showdown-oracle.mjs';
import { runInhouseBattle } from './inhouse-oracle.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const N = 12;
const SEEDS_IH = Array.from({ length: N }, (_, i) => i + 1);
const SEEDS_SD = Array.from({ length: N }, (_, i) => [i + 1, (i * 7 + 3) & 255, (i * 13 + 5) & 255, (i * 17 + 9) & 255]);

const WALL_SPEC = { species: 'Blissey', ability: 'Natural Cure', nature: 'Calm', evs: { hp: 252, spd: 252 } };
const WALL_PHYS = { species: 'Aggron', ability: 'Heavy Metal', nature: 'Impish', evs: { hp: 252, def: 252 } };
const withMoves = (set, move) => ({ ...set, moves: [move, 'Splash'] });
const passiveWall = (set) => ({ ...set, moves: ['Splash', 'Splash'] });

// attacker uses `move` once into a passive `defender`; return damage stats over the seed sweep.
async function sweep(scn) {
  const ih = { min: Infinity, max: 0, sum: 0, ko: false };
  const sd = { min: Infinity, max: 0, sum: 0, ko: false };
  for (const seed of SEEDS_IH) {
    const r = await runInhouseBattle({ team1: [withMoves(scn.attacker, scn.move)], team2: [passiveWall(scn.defender)], choices1: ['move 1'], choices2: ['move 1'], seed });
    const e = r.turns[0]?.end?.p2a;
    const d = (e?.maxhp || 0) - (e?.hp || 0);
    if ((e?.hp | 0) <= 0) ih.ko = true;
    ih.min = Math.min(ih.min, d); ih.max = Math.max(ih.max, d); ih.sum += d;
  }
  for (const seed of SEEDS_SD) {
    const r = await runShowdownBattle({ team1: [withMoves(scn.attacker, scn.move)], team2: [passiveWall(scn.defender)], choices1: ['move 1'], choices2: ['move 1'], seed });
    const act = r.turns[0]?.actions?.find(a => a.kind === 'move' && a.slot === 'p1a');
    const d = act?.damage || 0;
    const e = r.turns[0]?.end?.p2a;
    if ((e?.hp | 0) <= 0) sd.ko = true;
    sd.min = Math.min(sd.min, d); sd.max = Math.max(sd.max, d); sd.sum += d;
  }
  ih.mean = ih.sum / N; sd.mean = sd.sum / N;
  const overlap = ih.min <= sd.max && sd.min <= ih.max;
  const invalid = ih.ko || sd.ko; // a faint caps measured damage → range invalid
  return { ih, sd, overlap, invalid, flag: !overlap && !invalid };
}

const DAMAGE_SCENARIOS = [
  { id: 'item-choice-band', desc: 'Choice Band ×1.5 (physical)', attacker: { species: 'Snorlax', ability: 'Thick Fat', item: 'Choice Band', nature: 'Hardy' }, move: 'Strength', defender: WALL_PHYS },
  { id: 'item-choice-specs', desc: 'Choice Specs ×1.5 (special)', attacker: { species: 'Alakazam', ability: 'Synchronize', item: 'Choice Specs', nature: 'Hardy' }, move: 'Psychic', defender: WALL_SPEC },
  { id: 'item-life-orb', desc: 'Life Orb ×1.3', attacker: { species: 'Alakazam', ability: 'Synchronize', item: 'Life Orb', nature: 'Hardy' }, move: 'Psychic', defender: WALL_SPEC },
  { id: 'item-charcoal-type', desc: 'Charcoal ×1.2 (Fire)', attacker: { species: 'Charizard', ability: 'Blaze', item: 'Charcoal', nature: 'Hardy' }, move: 'Flamethrower', defender: WALL_SPEC },
  { id: 'ability-huge-power', desc: 'Huge Power ×2 Attack', attacker: { species: 'Azumarill', ability: 'Huge Power', nature: 'Adamant', evs: { atk: 252 } }, move: 'Strength', defender: WALL_PHYS },
  { id: 'ability-adaptability', desc: 'Adaptability STAB ×2 (vs ×1.5)', attacker: { species: 'Porygon-Z', ability: 'Adaptability', nature: 'Modest', evs: { spa: 252 } }, move: 'Tri Attack', defender: WALL_SPEC },
  { id: 'ability-technician', desc: 'Technician ×1.5 (≤60 BP)', attacker: { species: 'Scizor', ability: 'Technician', nature: 'Adamant', evs: { atk: 252 } }, move: 'Bullet Punch', defender: WALL_PHYS },
  { id: 'def-thick-fat', desc: 'Thick Fat halves incoming Fire (defender)', attacker: { species: 'Charizard', ability: 'Blaze', nature: 'Modest', evs: { spa: 252 } }, move: 'Flamethrower', defender: { species: 'Snorlax', ability: 'Thick Fat', nature: 'Calm', evs: { hp: 252, spd: 252 } } },
  { id: 'def-multiscale', desc: 'Multiscale halves at full HP (defender)', attacker: { species: 'Snorlax', ability: 'Thick Fat', nature: 'Hardy' }, move: 'Strength', defender: { species: 'Dragonite', ability: 'Multiscale', nature: 'Impish', evs: { hp: 252, def: 252 } } },
];

async function main() {
  const rows = [];
  for (const scn of DAMAGE_SCENARIOS) {
    const r = await sweep(scn);
    rows.push({ scn, ...r });
    const tag = r.invalid ? '⚠️ KO (invalid)' : r.flag ? '❌ DIVERGES' : '✅ ranges overlap';
    process.stderr.write(`  ${tag.padEnd(20)} ${scn.id}  ih[${r.ih.min}-${r.ih.max}] sd[${r.sd.min}-${r.sd.max}]\n`);
  }

  const flagged = rows.filter(r => r.flag).length;
  const date = new Date().toISOString().slice(0, 10);
  let md = `# Damage-Modifier Sweep Report

> Generated ${date} by \`tests/differential/damage-sweep.mjs\` (${N} seeds/engine).
> Each row runs one attacker+move into a passive wall in BOTH engines across many
> seeds, then compares the damage **ranges**. Overlapping ranges = the multiplier
> layer agrees; disjoint ranges = a real items/abilities/stat-calc divergence
> (roll variance removed). Reference: @pkmn/sim (MIT).

**Divergences found: ${flagged}/${rows.length}**

| Probe | What it checks | In-house [min–max] | Showdown [min–max] | Verdict |
|---|---|---|---|---|
`;
  for (const r of rows) {
    const verdict = r.invalid ? '⚠️ KO (invalid)' : r.flag ? '❌ **diverges**' : '✅ overlap';
    md += `| \`${r.scn.id}\` | ${r.scn.desc} | ${r.ih.min}–${r.ih.max} (μ${r.ih.mean.toFixed(0)}) | ${r.sd.min}–${r.sd.max} (μ${r.sd.mean.toFixed(0)}) | ${verdict} |\n`;
  }
  md += `\nRanges are HP damage to the defender. A correct multiplier yields overlapping\nbands (both sample the 85-100% roll). "KO (invalid)" means the wall fainted in\nsome run, capping measured damage — pick a bulkier wall to re-measure.\n`;

  const out = join(__dirname, 'DAMAGE_SWEEP_REPORT.md');
  writeFileSync(out, md, 'utf8');
  process.stderr.write(`\nWrote ${out}\nDamage-modifier divergences: ${flagged}/${rows.length}\n`);
  process.exit(0);
}

main();
