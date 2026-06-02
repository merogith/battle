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
const WALL_BULKY = { species: 'Slowbro', ability: 'Regenerator', nature: 'Bold', evs: { hp: 252, def: 252 } };
// attacker uses test move on turn 2, after a setup move on turn 1
const setupAtk = ['move 2', 'move 1'];
const setupDef = ['move 1', 'move 2'];

// Run `move` into a passive `defender` (optionally after a setup turn) and return
// total damage to the defender over the seed sweep. Setup moves (weather/screens)
// don't damage the defender, so total HP lost = the test move's damage.
async function sweep(scn) {
  const aMoves = scn.attackerMoves || [scn.move, 'Splash'];
  const dMoves = scn.defenderMoves || ['Splash', 'Splash'];
  const c1 = scn.choices1 || ['move 1'];
  const c2 = scn.choices2 || ['move 1'];
  const ih = { min: Infinity, max: 0, sum: 0, ko: false };
  const sd = { min: Infinity, max: 0, sum: 0, ko: false };
  for (const seed of SEEDS_IH) {
    const r = await runInhouseBattle({ team1: [{ ...scn.attacker, moves: aMoves }], team2: [{ ...scn.defender, moves: dMoves }], choices1: c1, choices2: c2, seed });
    const last = r.turns[r.turns.length - 1]?.end?.p2a;
    const d = (last?.maxhp || 0) - (last?.hp || 0);
    if ((last?.hp | 0) <= 0) ih.ko = true;
    ih.min = Math.min(ih.min, d); ih.max = Math.max(ih.max, d); ih.sum += d;
  }
  for (const seed of SEEDS_SD) {
    const r = await runShowdownBattle({ team1: [{ ...scn.attacker, moves: aMoves }], team2: [{ ...scn.defender, moves: dMoves }], choices1: c1, choices2: c2, seed });
    // Measure damage the SAME way as in-house — net end-of-turn HP drop — so that
    // end-of-turn field effects on the defender (e.g. Grassy Terrain healing it)
    // are accounted for identically in both engines and don't masquerade as a
    // damage divergence. Setup moves don't damage the defender.
    const last = r.turns[r.turns.length - 1]?.end?.p2a;
    const d = (last?.maxhp || 0) - (last?.hp || 0);
    if ((last?.hp | 0) <= 0) sd.ko = true;
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

  // ── weather (attacker sets it turn 1, attacks turn 2) ──
  { id: 'weather-rain-water', desc: 'Rain ×1.5 on Water (Rain Dance → Surf)', attacker: { species: 'Vaporeon', ability: 'Hydration', nature: 'Modest', evs: { spa: 252 } }, attackerMoves: ['Surf', 'Rain Dance'], choices1: setupAtk, choices2: ['move 1', 'move 1'], defender: WALL_SPEC },
  { id: 'weather-sun-fire', desc: 'Sun ×1.5 on Fire (Sunny Day → Flamethrower)', attacker: { species: 'Charizard', ability: 'Blaze', nature: 'Modest', evs: { spa: 252 } }, attackerMoves: ['Flamethrower', 'Sunny Day'], choices1: setupAtk, choices2: ['move 1', 'move 1'], defender: WALL_SPEC },
  { id: 'weather-sun-water-weak', desc: 'Sun ×0.5 on Water (Sunny Day → Surf)', attacker: { species: 'Vaporeon', ability: 'Hydration', nature: 'Modest', evs: { spa: 252 } }, attackerMoves: ['Surf', 'Sunny Day'], choices1: setupAtk, choices2: ['move 1', 'move 1'], defender: WALL_SPEC },

  // ── screens (defender sets it turn 1) ──
  { id: 'screen-reflect-phys', desc: 'Reflect halves physical', attacker: { species: 'Snorlax', ability: 'Thick Fat', nature: 'Adamant', evs: { atk: 252 } }, attackerMoves: ['Strength', 'Splash'], choices1: setupAtk, defender: WALL_BULKY, defenderMoves: ['Reflect', 'Splash'], choices2: setupDef },
  { id: 'screen-lightscreen-spec', desc: 'Light Screen halves special', attacker: { species: 'Alakazam', ability: 'Synchronize', nature: 'Modest', evs: { spa: 252 } }, attackerMoves: ['Psychic', 'Splash'], choices1: setupAtk, defender: WALL_BULKY, defenderMoves: ['Light Screen', 'Splash'], choices2: setupDef },

  // ── super-effective / resisted item & ability multipliers (single turn) ──
  { id: 'item-expert-belt-se', desc: 'Expert Belt ×1.2 on super-effective', attacker: { species: 'Charizard', ability: 'Blaze', item: 'Expert Belt', nature: 'Modest', evs: { spa: 252 } }, move: 'Flamethrower', defender: { species: 'Registeel', ability: 'Clear Body', nature: 'Sassy', evs: { hp: 252, spd: 252 } } },
  { id: 'item-tinted-lens-resist', desc: 'Tinted Lens ×2 on a resisted hit', attacker: { species: 'Venomoth', ability: 'Tinted Lens', nature: 'Modest', evs: { spa: 252 } }, move: 'Bug Buzz', defender: WALL_PHYS },
  { id: 'ability-moldbreaker-vs-thickfat', desc: 'Mold Breaker ignores Thick Fat (full Fire damage)', attacker: { species: 'Pinsir', ability: 'Mold Breaker', nature: 'Modest', evs: { spa: 252 } }, move: 'Flamethrower', defender: { species: 'Snorlax', ability: 'Thick Fat', nature: 'Sassy', evs: { hp: 252, spd: 252 } } },

  // ── terrain (grounded attacker sets it turn 1, attacks turn 2) ──
  { id: 'terrain-electric', desc: 'Electric Terrain ×1.3 on Electric', attacker: { species: 'Raichu', ability: 'Static', nature: 'Modest', evs: { spa: 252 } }, attackerMoves: ['Thunderbolt', 'Electric Terrain'], choices1: setupAtk, choices2: ['move 1', 'move 1'], defender: WALL_SPEC },
  { id: 'terrain-grassy', desc: 'Grassy Terrain ×1.3 on Grass', attacker: { species: 'Roserade', ability: 'Natural Cure', nature: 'Modest', evs: { spa: 252 } }, attackerMoves: ['Energy Ball', 'Grassy Terrain'], choices1: setupAtk, choices2: ['move 1', 'move 1'], defender: WALL_SPEC },
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
