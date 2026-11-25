// Locks in wild-build diversity (nature pools + EV-shape jitter + secondary-STAB
// bias). Before this, a species' wild nature and EV shape were 100% deterministic
// — every wild Machop was Adamant with the identical spread. These tests assert
// the curated variety WITHOUT letting a role-fighting nature (−primary-attack on a
// pure attacker) or an out-of-envelope EV total slip in.
// Run: node --test tests/suites/story-wild-build-diversity.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;
const baseStats = W.__rivalTest.baseStats;

// Standard nature → dropped-stat map (only the non-neutral natures our pools use).
const NATURE_MINUS = {
  Adamant: 'spa', Jolly: 'spa', Brave: 'spe', Naughty: 'spd', Lonely: 'def',
  Modest: 'atk', Timid: 'atk', Quiet: 'spe', Mild: 'def', Rash: 'spd',
  Bold: 'atk', Impish: 'spa', Relaxed: 'spe', Lax: 'spd',
  Calm: 'atk', Careful: 'spa', Sassy: 'spe', Gentle: 'def',
};
// rng stub that walks a fixed list (repeating the last value) — deterministic.
const seq = (vals) => { let i = 0; return () => vals[Math.min(i++, vals.length - 1)]; };

test('nature pool is archetype-appropriate: pure physical attacker never drops Atk', () => {
  const b = baseStats['Machop']; // slow, high-Atk physical
  const pool = ST.wildNaturePool(b);
  assert.ok(pool.length >= 2, 'physical pool has multiple natures');
  for (const n of pool) {
    assert.notEqual(NATURE_MINUS[n], 'atk', `physical pool nature ${n} must not reduce Atk`);
  }
});

test('nature pool is archetype-appropriate: pure special attacker never drops SpA', () => {
  const b = baseStats['Gastly']; // fast special
  const pool = ST.wildNaturePool(b);
  for (const n of pool) {
    assert.notEqual(NATURE_MINUS[n], 'spa', `special pool nature ${n} must not reduce SpA`);
  }
});

test('wall pool boosts a defensive stat (never an offensive-drop that hurts the wall)', () => {
  const b = baseStats['Shuckle'];
  const pool = ST.wildNaturePool(b);
  // Every wall nature drops an unused attacking stat, never a defense.
  for (const n of pool) {
    assert.ok(['atk', 'spa', 'spe'].includes(NATURE_MINUS[n]), `wall nature ${n} should drop an offense/speed stat`);
  }
});

test('wall pool preserves the wall\'s residual offense (no −SpA on a special wall)', () => {
  // A defensive shell whose only offense is special must never roll a −SpA nature,
  // and a physical-offense wall must never roll −Atk — the pool drops the *unused*
  // attack, not the one that carries the wall's threat.
  const specialWall = { hp: 100, atk: 30, def: 120, spa: 95, spd: 120, spe: 20 };
  for (const n of ST.wildNaturePool(specialWall)) {
    assert.notEqual(NATURE_MINUS[n], 'spa', `special wall nature ${n} must not drop SpA`);
  }
  const physicalWall = { hp: 100, atk: 95, def: 120, spa: 30, spd: 120, spe: 20 };
  for (const n of ST.wildNaturePool(physicalWall)) {
    assert.notEqual(NATURE_MINUS[n], 'atk', `physical wall nature ${n} must not drop Atk`);
  }
});

test('wildPickNature covers the whole pool head-weighted (textbook first, variants in the tail)', () => {
  const b = baseStats['Machop'];
  const pool = ST.wildNaturePool(b);
  // Weights [0.5, 0.25, 0.15, 0.1] → cumulative [0.5, 0.75, 0.9, 1.0].
  assert.equal(ST.wildPickNature(b, () => 0.0), pool[0], 'r=0 → textbook (head)');
  assert.equal(ST.wildPickNature(b, () => 0.6), pool[1]);
  assert.equal(ST.wildPickNature(b, () => 0.8), pool[2]);
  assert.equal(ST.wildPickNature(b, () => 0.95), pool[3], 'r≈1 → rarest tail variant');
  // Every returned nature is a member of the curated pool — no leaks.
  for (let i = 0; i < 30; i++) {
    const n = ST.wildPickNature(b, () => i / 30);
    assert.ok(pool.includes(n), `${n} is in the pool`);
  }
});

test('wildPickEVs jitters the primary/secondary split (same species, different shapes)', () => {
  const b = baseStats['Machop']; // → primary atk, secondary spe
  const light = ST.wildPickEVs(b, seq([0.0, 0.99])); // heavy=46, no splash
  const heavy = ST.wildPickEVs(b, seq([0.99, 0.99])); // heavy=64, no splash
  assert.notDeepEqual(light, heavy, 'split jitter must yield different EV shapes');
  assert.ok(light.atk > 0 && light.spe > 0, 'invests in the species primary + secondary stats');
  assert.ok(heavy.atk > light.atk, 'higher jitter roll puts more weight on the primary');
});

test('wildPickEVs adds an occasional third-stat splash', () => {
  const b = baseStats['Machop'];
  const noSplash = ST.wildPickEVs(b, seq([0.5, 0.99])); // splash roll 0.99 ≥ 0.34 → none
  const splashed = ST.wildPickEVs(b, seq([0.5, 0.10])); // splash roll 0.10 < 0.34 → yes
  const nz = (o) => Object.values(o).filter((v) => v > 0).length;
  assert.equal(nz(noSplash), 2, 'no-splash spread is exactly two stats');
  assert.equal(nz(splashed), 3, 'splash spread adds a third stat');
  assert.ok(splashed.hp > 0, 'attacker splashes bulk (HP)');
});

test('EV shape stays within the per-stat / total envelope (balance-neutral)', () => {
  for (const name of ['Machop', 'Gastly', 'Shuckle', 'Snorlax']) {
    const b = baseStats[name];
    if (!b) continue;
    for (let i = 0; i < 12; i++) {
      const evs = ST.wildPickEVs(b, seq([i / 12, ((i * 7) % 12) / 12]));
      let total = 0;
      for (const k of ['hp', 'atk', 'def', 'spa', 'spd', 'spe']) {
        assert.ok(evs[k] >= 0 && evs[k] <= 252, `${name} ${k}=${evs[k]} within [0,252]`);
        total += evs[k];
      }
      // Pre-distribution shape stays a small normalized total (rescaled to the
      // city band later by _distributeEVsToTotal) — never a runaway spread.
      assert.ok(total > 0 && total <= 252, `${name} shape total ${total} is sane`);
    }
  }
});

test('distributor hits the target total even for a lopsided shape at the 508 cap', () => {
  // The jittered wild shapes are deliberately lopsided; scaling one to a high city
  // total must not overflow the 252 clamp and undershoot. Every target is hit within
  // rounding (≤4), and per-stat cap is respected.
  const KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
  const sum = (o) => KEYS.reduce((s, k) => s + (o[k] | 0), 0);
  const base = baseStats['Machop'];
  for (const target of [200, 300, 400, 508]) {
    // A heavy 64/36 primary/secondary shape — the worst case for clamp overflow.
    const build = { evs: { hp: 0, atk: 64, def: 0, spa: 0, spd: 0, spe: 36 } };
    ST.distributeEVsToTotal(build, base, target);
    assert.ok(Math.abs(sum(build.evs) - target) <= 4, `target ${target}: got ${sum(build.evs)}`);
    for (const k of KEYS) assert.ok((build.evs[k] | 0) <= 252, `${k}=${build.evs[k]} ≤ 252`);
  }
});

test('wild builds gain EVs, IVs and move options gradually and leave room for training', async () => {
  const rows = ST.STORY_EVENTS_RAW;
  const totals = [];
  for (const city of [0, 3, 6, 9]) {
    ST.sm = { active: true, runSeed: 70 + city, badges: city, team: [],
      settings: { enabledGens: [1, 4, 9] }, unlockedGimmicks: [], storyDifficulty: 'normal',
      eventIndex: rows.findIndex(row => row[2] === 'City' + city), trainerAssignments: {} };
    const observedMoves = new Set();
    const values = [];
    const { natural } = await ST.tutorFetchLearnsetMoveNames('Garchomp');
    for (let i = 0; i < 60; i++) {
      const build = ST.storyMakeWildBuild('Garchomp');
      values.push(Object.values(build.evs).reduce((total, ev) => total + ev, 0));
      observedMoves.add(build.m.join('|'));
      assert.ok(build.m.every(move => natural.includes(move)), build.m.join(', '));
      assert.ok(build.m.some(move => ST.ensureMoveData(move).cat !== 'Status'));
      assert.ok(!build.i || build.i === 'None' || /Berry$/.test(build.i), build.i);
      assert.ok(['Sand Veil', 'Rough Skin'].includes(build.a));
      if (city < 6) assert.equal(build.a, 'Sand Veil');
      if (city === 0) assert.ok(Object.values(build.ivs).every(iv => iv <= 10));
    }
    assert.ok(observedMoves.size > 2, `City ${city} has varied movesets`);
    assert.ok(Math.max(...values) <= 280);
    totals.push(values.reduce((total, ev) => total + ev, 0) / values.length);
  }
  assert.deepEqual(totals, [...totals].sort((a, b) => a - b));
  ST.sm = null;
});

test('dual-typed wild movesets vary across samples of a species (pre-catch)', () => {
  // Sample at C3, where the species pool is dense enough that many dual-types reach
  // a solid sample count (at C7 there are 700+ species, so few reach threshold and
  // the ones that do are often static-moveset mono-types). Dual-types are the ones
  // that CAN vary — via the T1 downgrade's secondary roll + the C1 injection.
  const RAW = ST.STORY_EVENTS_RAW, N = RAW.length;
  const cityRowFor = (c) => { for (let i = 0; i < N; i++) if (ST.cityIndexFromEventIndex(i) === c) return i; return -1; };
  const GENS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  ST.sm = {
    active: true, badges: 3, team: [],
    settings: { enabledGens: GENS.slice() },
    unlockedGimmicks: [], storyDifficulty: 'normal',
    eventIndex: cityRowFor(3), trainerAssignments: {},
  };
  const byMoves = {};
  for (let i = 0; i < 2000; i++) {
    const enc = ST.rollWildEncounter(GENS);
    if (!enc) continue;
    const base = baseStats[enc.name];
    if (!base || !base.t2) continue; // dual-types only
    (byMoves[enc.name] ||= []).push((enc.build.m || []).join(','));
  }
  const big = Object.entries(byMoves).filter(([, v]) => v.length >= 6);
  assert.ok(big.length >= 5, `enough well-sampled dual-types (got ${big.length})`);
  const variedFrac = big.filter(([, v]) => new Set(v).size >= 2).length / big.length;
  // Observed ~98% of well-sampled dual-types vary; assert comfortably clear of a
  // "every wild of a species is a move clone" regression.
  assert.ok(variedFrac >= 0.6, `most dual-types show >1 moveset (${(variedFrac * 100).toFixed(0)}%)`);
  ST.sm = null;
});

test('wild nature blend: the random slice surfaces natures beyond the curated pool', () => {
  // Post-neutral, ~30% of wild natures are fully random legal (all 25), the rest
  // curated. Over many rolls the observed nature set should exceed any single
  // species' curated pool (≤4) — proving the random slice fires — while curated
  // still dominates (most catches remain role-appropriate).
  const RAW = ST.STORY_EVENTS_RAW, N = RAW.length;
  const cityRowFor = (c) => { for (let i = 0; i < N; i++) if (ST.cityIndexFromEventIndex(i) === c) return i; return -1; };
  const GENS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  ST.sm = { active: true, badges: 4, team: [], settings: { enabledGens: GENS.slice() }, unlockedGimmicks: [], storyDifficulty: 'normal', eventIndex: cityRowFor(4), trainerAssignments: {} };
  const seen = new Set();
  let tot = 0;
  for (let i = 0; i < 1200; i++) {
    const enc = ST.rollWildEncounter(GENS);
    if (!enc) continue;
    tot++;
    seen.add(enc.build.n);
  }
  assert.ok(tot > 200, 'sampled enough C4 wilds');
  // The random slice should surface far more natures than any single curated pool
  // (≤4). Generous floor so CI RNG variance can't flake it.
  assert.ok(seen.size >= 10, `random slice surfaces many natures (saw ${seen.size}/25)`);
  ST.sm = null;
});

test('wild ability: regular slot-1 appears (not always slot-0)', () => {
  const RAW = ST.STORY_EVENTS_RAW, N = RAW.length;
  const cityRowFor = (c) => { for (let i = 0; i < N; i++) if (ST.cityIndexFromEventIndex(i) === c) return i; return -1; };
  const GENS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  ST.sm = { active: true, badges: 4, team: [], settings: { enabledGens: GENS.slice() }, unlockedGimmicks: [], storyDifficulty: 'normal', eventIndex: cityRowFor(4), trainerAssignments: {} };
  let capable = 0, slot1 = 0;
  for (let i = 0; i < 1200; i++) {
    const enc = ST.rollWildEncounter(GENS);
    if (!enc) continue;
    const b = baseStats[enc.name];
    if (!b || !b.abilities || !b.abilities['1']) continue; // only species WITH a 2nd regular slot
    capable++;
    if (enc.build.a === b.abilities['1']) slot1++;
  }
  assert.ok(capable > 100, 'sampled enough slot-1-capable wilds');
  // Roughly a coin flip between slot-0 and slot-1; assert clearly non-zero and not all,
  // with a wide band so CI RNG variance can't flake it.
  const share = slot1 / capable;
  assert.ok(share > 0.1 && share < 0.9, `slot-1 appears a meaningful share of the time (${(share * 100).toFixed(0)}%)`);
  ST.sm = null;
});

test('end-to-end: repeated wild rolls of a species diversify nature + EVs', () => {
  const RAW = ST.STORY_EVENTS_RAW, N = RAW.length;
  const cityRowFor = (c) => { for (let i = 0; i < N; i++) if (ST.cityIndexFromEventIndex(i) === c) return i; return -1; };
  // Sample at C3 (denser species pool → reliably well-sampled species, robust to the
  // unseeded Math.random species pick regardless of prior tests' RNG consumption).
  ST.sm = {
    active: true, badges: 3, team: [],
    settings: { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    unlockedGimmicks: [], storyDifficulty: 'normal',
    eventIndex: cityRowFor(3), trainerAssignments: {},
  };
  const bySpecies = {};
  for (let i = 0; i < 2500; i++) {
    const enc = ST.rollWildEncounter([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    if (!enc) continue;
    (bySpecies[enc.name] ||= []).push({ n: enc.build.n, ev: JSON.stringify(enc.build.evs) });
  }
  // Find a species with enough samples and assert it isn't a clone factory.
  const big = Object.entries(bySpecies).filter(([, v]) => v.length >= 6);
  assert.ok(big.length > 0, 'sampled at least one species enough times');
  let sawNatureVariety = false, sawEvVariety = false;
  for (const [, arr] of big) {
    if (new Set(arr.map((x) => x.n)).size >= 2) sawNatureVariety = true;
    if (new Set(arr.map((x) => x.ev)).size >= Math.ceil(arr.length / 2)) sawEvVariety = true;
  }
  assert.ok(sawNatureVariety, 'at least one well-sampled species shows >1 nature');
  assert.ok(sawEvVariety, 'at least one well-sampled species shows highly varied EV spreads');
  ST.sm = null;
});
