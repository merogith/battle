// Phase-1 proof-of-life for the headless battle resolver.
//   node scripts/debug/story-sim/smoke-resolve.mjs
//
// Checks three things the whole Story Sim depends on:
//   1. A multi-mon CPU-vs-CPU battle actually RESOLVES headlessly (winner, no stall/throw).
//   2. Sanity: a strong team beats a weak team most of the time.
//   3. Baseline: a MIRROR match sits near 50% over seeds (neither side is systematically
//      favoured by our driving — a key fairness check before trusting any difficulty number).

import { loadEngine } from '../../../tests/helpers/load-engine.js';
import { resolveBattle } from './resolve-battle.mjs';

const STRONG = [
  { species: 'Dragonite', moves: ['Dragon Dance', 'Outrage', 'Earthquake', 'Fire Punch'], nature: 'Adamant', ability: 'Multiscale', item: 'Leftovers', evs: { atk: 252, spe: 252, hp: 4 } },
  { species: 'Garchomp', moves: ['Swords Dance', 'Earthquake', 'Dragon Claw', 'Fire Fang'], nature: 'Jolly', ability: 'Rough Skin', item: 'Life Orb', evs: { atk: 252, spe: 252, hp: 4 } },
  { species: 'Metagross', moves: ['Meteor Mash', 'Bullet Punch', 'Earthquake', 'Ice Punch'], nature: 'Adamant', ability: 'Clear Body', item: 'Assault Vest', evs: { atk: 252, hp: 252, def: 4 } },
];
const WEAK = [
  { species: 'Rattata', moves: ['Tackle', 'Tail Whip', 'Quick Attack', 'Hyper Fang'], nature: 'Hardy', evs: {} },
  { species: 'Pidgey', moves: ['Gust', 'Sand Attack', 'Quick Attack', 'Tackle'], nature: 'Hardy', evs: {} },
  { species: 'Caterpie', moves: ['Tackle', 'String Shot', 'Bug Bite', 'Tackle'], nature: 'Hardy', evs: {} },
];
const MIRROR = [
  { species: 'Snorlax', moves: ['Body Slam', 'Earthquake', 'Crunch', 'Rest'], nature: 'Adamant', ability: 'Thick Fat', item: 'Leftovers', evs: { atk: 252, hp: 252, def: 4 } },
  { species: 'Rotom-Wash', moves: ['Hydro Pump', 'Volt Switch', 'Will-O-Wisp', 'Thunderbolt'], nature: 'Modest', ability: 'Levitate', item: 'Leftovers', evs: { spa: 252, hp: 252, def: 4 } },
  { species: 'Ferrothorn', moves: ['Gyro Ball', 'Power Whip', 'Stealth Rock', 'Leech Seed'], nature: 'Relaxed', ability: 'Iron Barbs', item: 'Leftovers', evs: { hp: 252, def: 252, spd: 4 } },
];

function pct(n, d) { return d ? (100 * n / d).toFixed(1) + '%' : '—'; }

async function series(E, label, t1, t2, N) {
  let wins = 0, losses = 0, draws = 0, stalls = 0, threw = 0, turnSum = 0;
  const t0 = Date.now();
  for (let s = 0; s < N; s++) {
    const r = await resolveBattle(E, t1, t2, { seed: s * 7 + 1 });
    if (r.threw) threw++;
    if (r.stalled) stalls++;
    turnSum += r.turns;
    if (r.winner === 'player') wins++;
    else if (r.winner === 'foe') losses++;
    else draws++;
  }
  const ms = Date.now() - t0;
  console.log(
    `${label.padEnd(22)} n=${N}  win ${pct(wins, N).padStart(6)}  loss ${pct(losses, N).padStart(6)}` +
    `  draw ${draws}  stall ${stalls}  threw ${threw}  avgTurns ${(turnSum / N).toFixed(1)}` +
    `  (${ms}ms, ${(ms / N).toFixed(0)}ms/battle)`
  );
  return { wins, losses, draws, stalls, threw, N };
}

(async () => {
  const _origLog = console.log; console.log = () => {};
  const E = await loadEngine();
  console.log = _origLog;
  console.log('=== Phase-1 resolver smoke ===');

  const N = Number(process.env.N || 30);
  const strong = await series(E, 'STRONG vs WEAK', STRONG, WEAK, N);
  const weak = await series(E, 'WEAK vs STRONG', WEAK, STRONG, N);
  const mirror = await series(E, 'MIRROR vs MIRROR', MIRROR, MIRROR, N);

  console.log('\n--- assertions ---');
  const checks = [];
  checks.push(['multi-mon battles resolve (no stalls/throws in strong-vs-weak)', strong.stalls === 0 && strong.threw === 0]);
  checks.push(['strong beats weak >80%', strong.wins / strong.N > 0.8]);
  checks.push(['weak beats strong <20%', weak.wins / weak.N < 0.2]);
  checks.push(['mirror is fair (40%–60% player win)', mirror.wins / mirror.N >= 0.4 && mirror.wins / mirror.N <= 0.6]);
  let ok = true;
  for (const [name, pass] of checks) { console.log(`  [${pass ? 'PASS' : 'FAIL'}] ${name}`); if (!pass) ok = false; }
  console.log(ok ? '\nRESULT: PASS — resolver is sound.' : '\nRESULT: FAIL — see above.');
  E.teardown();
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error('smoke crashed:', e); process.exit(2); });
