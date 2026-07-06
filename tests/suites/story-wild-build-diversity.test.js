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

test('end-to-end: repeated wild rolls of a species diversify nature + EVs', () => {
  const RAW = ST.STORY_EVENTS_RAW, N = RAW.length;
  const cityRowFor = (c) => { for (let i = 0; i < N; i++) if (ST.cityIndexFromEventIndex(i) === c) return i; return -1; };
  ST.sm = {
    active: true, badges: 5, team: [],
    settings: { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    unlockedGimmicks: [], storyDifficulty: 'normal',
    eventIndex: cityRowFor(5), trainerAssignments: {},
  };
  const bySpecies = {};
  for (let i = 0; i < 1500; i++) {
    const enc = ST.rollWildEncounter([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    if (!enc) continue;
    (bySpecies[enc.name] ||= []).push({ n: enc.build.n, ev: JSON.stringify(enc.build.evs) });
  }
  // Find a species with enough samples and assert it isn't a clone factory.
  const big = Object.entries(bySpecies).filter(([, v]) => v.length >= 8);
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
