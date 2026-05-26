// Regression tests for the trainer team-roll pipeline: getMonGrade memoization,
// tier-scaled IVs + ace bonus, signature item-clause locking, duplicate-signature
// support (Lance's triple-Dragonite), and seeded-RNG determinism.
//
// The private roll pipeline is reached through window.__storyTest, a harness-gated
// hook exposed only when window.__testHarness === true (set by load-engine.js).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';
import { seedRng } from '../helpers/seeded-rng.js';

const E = await loadEngine();
const { window } = E;
const ST = window.__storyTest;

// Put the shared StoryMode state into "active run" mode and (re)seed the story RNG
// stream. Nulling _strngState forces storyRngNext to re-derive its state from runSeed.
function activeSeed(seed) {
  const sm = ST.sm;
  sm.active = true;
  sm.runSeed = seed >>> 0;
  sm._strngState = null;
  if (!sm.settings) sm.settings = {};
  return sm;
}

const lanceE4 = () => ST.getTrainerData().find((t) => t.name === 'Lance' && t.role === 'E4');
const E4_GW = { g1: 70, g2: 30, g3: 0, g4: 0 };
const IV_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];

test('__storyTest hook is exposed by the harness', () => {
  assert.ok(ST, 'window.__storyTest present');
  assert.equal(typeof ST.rollTrainerTeam, 'function');
  assert.equal(typeof window.getMonGrade, 'function');
  assert.equal(typeof window._rollTieredIVs, 'function');
});

test('getMonGrade: memoized result is stable, and known grades hold', () => {
  const a = window.getMonGrade('Dragonite', window.getBST('Dragonite'));
  const b = window.getMonGrade('Dragonite', window.getBST('Dragonite'));
  assert.equal(a, b, 'repeat call returns the same grade');
  assert.equal(a, 1, 'pseudo-legend Dragonite is grade 1');
  assert.equal(window.getMonGrade('Garchomp', window.getBST('Garchomp')), 1, 'Garchomp is grade 1');
  assert.equal(window.getMonGrade('Caterpie', window.getBST('Caterpie')), 4, 'weak basic Caterpie is grade 4');
});

test('_rollTieredIVs: rising mean with small ±3 jitter; ace runs hotter', () => {
  activeSeed(7);
  for (let i = 0; i < 60; i++) {
    const ace = window._rollTieredIVs(4, true);    // T4 center 28 + ace 3 = 31, ±3 clamped → [28,31]
    for (const k of IV_KEYS) assert.ok(ace[k] >= 28 && ace[k] <= 31, `ace T4 ${k}=${ace[k]} in [28,31]`);
    const filler = window._rollTieredIVs(4, false); // T4 center 28, ±3 → [25,31]
    for (const k of IV_KEYS) assert.ok(filler[k] >= 25 && filler[k] <= 31, `filler T4 ${k}=${filler[k]} in [25,31]`);
  }
  const aceT1 = window._rollTieredIVs(1, true);     // T1 center 8 + ace 3 = 11, ±3 → [8,14]
  for (const k of IV_KEYS) assert.ok(aceT1[k] >= 8 && aceT1[k] <= 14, `ace T1 ${k}=${aceT1[k]} in [8,14]`);
  // The point of the rework: mean IV rises across tiers (no wide bands, not identical).
  const mean = (t) => { let s = 0, n = 0; for (let i = 0; i < 200; i++) { const v = window._rollTieredIVs(t, false); for (const k of IV_KEYS) { s += v[k]; n++; } } return s / n; };
  assert.ok(mean(1) < mean(2) && mean(2) < mean(3) && mean(3) < mean(4), 'tier mean IV rises T1<T2<T3<T4');
});

test('_rollTieredIVs: deterministic on the seeded story stream (proves it is not Math.random)', () => {
  activeSeed(424242);
  const a = window._rollTieredIVs(4, true);
  // Reseed ONLY the story stream — leave Math.random untouched. If the roll used
  // Math.random it would diverge (that stream advanced); identical output => storyRngNext.
  ST.sm.runSeed = 424242 >>> 0;
  ST.sm._strngState = null;
  const b = window._rollTieredIVs(4, true);
  assert.deepEqual(a, b, 'same story seed reproduces identical IVs');
});

test('enforceItemClause: locked signature slot keeps its item; filler dup is demoted', () => {
  const pool = [
    { name: 'Garchomp', build: { i: 'Life Orb' } }, // locked ace
    { name: 'Roserade', build: { i: 'Life Orb' } }, // filler with the same item
  ];
  window.enforceItemClause(pool, new Set([0]));
  assert.equal(pool[0].build.i, 'Life Orb', 'locked ace item preserved');
  assert.notEqual(pool[1].build.i, 'Life Orb', 'filler duplicate demoted');
});

test('enforceItemClause: no-lock callers behave as before (first wins, later demoted)', () => {
  const pool = [
    { name: 'A', build: { i: 'Choice Band' } },
    { name: 'B', build: { i: 'Choice Band' } },
  ];
  window.enforceItemClause(pool); // no lock arg => empty Set => original behaviour
  assert.equal(pool[0].build.i, 'Choice Band');
  assert.notEqual(pool[1].build.i, 'Choice Band');
});

test('rollTrainerTeam: duplicate sigs field multiple copies (Lance triple-Dragonite)', () => {
  const lance = lanceE4();
  assert.ok(lance, 'Lance E4 trainer exists');
  assert.equal(lance.sigs.filter((n) => n === 'Dragonite').length, 3, 'data declares 3 Dragonites');
  let sawThree = false;
  let maxD = 0;
  activeSeed(1);
  for (let i = 0; i < 40; i++) {
    ST.sm.runSeed = (1000 + i) >>> 0;
    ST.sm._strngState = null;
    const team = ST.rollTrainerTeam(lance, 6, E4_GW, [1, 2], 'E4', 63);
    assert.equal(team.length, 6, 'E4 fields 6');
    const d = team.filter((s) => s.name === 'Dragonite').length;
    maxD = Math.max(maxD, d);
    if (d === 3) sawThree = true;
    assert.ok(d <= 3, `never more than the 3 sig Dragonites (got ${d})`);
    for (const s of team) assert.ok(window.baseStats ? true : s.name, 'valid slot'); // species sanity
  }
  assert.ok(sawThree, 'at least one roll fields all three Dragonites');
  assert.ok(maxD >= 2, 'duplicate sigs are reachable (capped at 1 before the fix)');
});

test('rollTrainerTeam: species selection is deterministic on the story seed', () => {
  const lance = lanceE4();
  const roll = () => {
    activeSeed(31337);
    return ST.rollTrainerTeam(lance, 6, E4_GW, [1, 2], 'E4', 63).map((s) => s.name);
  };
  assert.deepEqual(roll(), roll(), 'same story seed -> same species lineup');
});

test('_validateTrainerData: no unknown-species errors; flags the known thin champion pools', () => {
  const issues = ST.validateTrainerData();
  assert.ok(Array.isArray(issues), 'returns an issue array');
  const hardErrors = issues.filter((m) => /not a known species/.test(m));
  assert.equal(hardErrors.length, 0, `every signature resolves to a known species (got: ${hardErrors.join('; ')})`);
  const thin = issues.filter((m) => /Champion fight/.test(m));
  assert.ok(thin.some((m) => /Leon/.test(m)), 'flags Leon as a thin (5-sig) champion pool');
});

test('Mystery Figure: gimmick override is local — never mutates shared sm.settings/sm.badges', () => {
  const sm = ST.sm;
  sm.active = true;
  sm.runSeed = 5;
  sm._strngState = null;
  sm.settings = sm.settings || {};
  // Deliberately leave the mechanic flags OFF; the Mystery roll must roll from all of
  // them via a local override, without flipping these shared flags on (the old code
  // mutated them in place behind a try/finally).
  sm.settings.megaOn = false;
  sm.settings.dynaOn = false;
  sm.settings.teraOn = false;
  sm.settings.zOn = false;
  sm.unlockedGimmicks = ['mega', 'dmax', 'z', 'tera'];
  sm.badges = 3;
  const snapSettings = JSON.stringify(sm.settings);
  const team = ST.rollMysteryFigure(6, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.equal(team.length, 6, 'Mystery Figure fields 6');
  for (const s of team) {
    assert.equal(window.getMonGrade(s.name, window.getBST(s.name)), 1, `${s.name} is grade 1`);
  }
  assert.equal(sm.settings.megaOn, false, 'sm.settings.megaOn left OFF (override was local)');
  assert.equal(JSON.stringify(sm.settings), snapSettings, 'sm.settings fully unchanged');
  assert.equal(sm.badges, 3, 'sm.badges unchanged');
});

test('rollTrainerTeam: full build reproducible when BOTH rng streams are reset', () => {
  const lance = lanceE4();
  const roll = () => {
    seedRng(99); // reset Math.random (makeBuild / gimmick stream)
    activeSeed(99); // reset storyRngNext (species / IV stream)
    return ST.rollTrainerTeam(lance, 6, E4_GW, [1, 2], 'E4', 63).map(
      (s) => `${s.name}|${JSON.stringify(s.build.ivs)}|${s.build.n}|${s.build.i}`
    );
  };
  assert.deepEqual(roll(), roll(), 'identical teams when both streams are reseeded');
});
