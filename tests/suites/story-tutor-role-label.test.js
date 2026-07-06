// Canonical base-stats role classifier (_txRoleForBase) + tutor surfacing (_txMonRole).
//
// One classifier now drives the foe roller's role, the item recommender's profile, the
// post-battle EV-focus picker, AND the tutor's surfaced role chip — so the same mon can
// no longer classify three different ways. This locks:
//   • token/coarse/focusStats for the canonical role archetypes
//   • _designedInferRole / _designedCoarseRole still return the historical values
//     (foe rolls unchanged), because they now delegate to _txRoleForBase
//   • _txMonRole yields a readable label + the driving stats
//
//   node --test tests/suites/story-tutor-role-label.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;
const role = (b) => w._txRoleForBase(b);
// _txRoleForBase returns arrays in the jsdom realm (different Array.prototype), so
// deepEqual against a Node-realm literal fails on prototype identity — re-materialize.
const focus = (b) => Array.from(role(b).focusStats).map(String);

// base-stat blocks for archetype fixtures
const SPEC_SWEEPER = { hp: 70, atk: 60, def: 70, spa: 130, spd: 80, spe: 110 };
const PHYS_SWEEPER = { hp: 78, atk: 130, def: 95, spa: 80, spd: 85, spe: 102 }; // Garchomp-ish
const PHYS_WALL    = { hp: 100, atk: 60, def: 130, spa: 45, spd: 120, spe: 40 };
const SPEC_WALL    = { hp: 95, atk: 50, def: 80, spa: 60, spd: 135, spe: 45 };
const HP_WALL      = { hp: 255, atk: 10, def: 10, spa: 75, spd: 135, spe: 55 }; // Blissey-ish

test('token: high-offense high-speed mons read as sweepers on their attacking side', () => {
  assert.equal(role(PHYS_SWEEPER).token, 'PHYS_SWEEPER');
  assert.equal(role(SPEC_SWEEPER).token, 'SPEC_SWEEPER');
  assert.equal(role(PHYS_SWEEPER).physical, true);
  assert.equal(role(SPEC_SWEEPER).physical, false);
});

test('token: bulky low-offense mons read as walls on their better defensive side', () => {
  assert.equal(role(PHYS_WALL).token, 'PHYS_WALL');
  assert.equal(role(SPEC_WALL).token, 'SPEC_WALL');
  assert.equal(role(PHYS_WALL).coarse, 'wall');
});

test('coarse: an HP wall with thin def/spd still folds into wall (Blissey correction)', () => {
  // def+spd alone is low, but HP+def+spd is huge and offense < 90 → wall.
  assert.equal(role(HP_WALL).coarse, 'wall');
});

test('focusStats: attackers train their attacking stat + speed; walls train HP + defense', () => {
  assert.deepEqual(focus(PHYS_SWEEPER), ['atk', 'spe']);
  assert.deepEqual(focus(SPEC_SWEEPER), ['spa', 'spe']);
  assert.deepEqual(focus(PHYS_WALL), ['hp', 'def']);
  assert.deepEqual(focus(SPEC_WALL), ['hp', 'spd']);
});

test('focusStats is deterministic — no story RNG consumed (same answer twice)', () => {
  assert.deepEqual(focus(PHYS_SWEEPER), focus(PHYS_SWEEPER));
});

test('_designedInferRole / _designedCoarseRole still match _txRoleForBase for real species (foe rolls unchanged)', () => {
  const names = ['Garchomp', 'Blissey', 'Toxapex', 'Dragapult', 'Ferrothorn'].filter((n) => ST.baseStats && ST.baseStats[n]);
  assert.ok(names.length >= 3, 'have baseStats for the fixtures');
  for (const n of names) {
    const r = w._txRoleForBase(ST.baseStats[n]);
    assert.equal(w._designedInferRole(n), r.token, `${n} token via _designedInferRole`);
    assert.equal(w._designedCoarseRole(n), r.coarse, `${n} coarse via _designedCoarseRole`);
  }
});

test('_txMonRole surfaces a readable label + driving stats for a real species', () => {
  const nm = (ST.baseStats && ST.baseStats.Garchomp) ? 'Garchomp' : Object.keys(ST.baseStats || {})[0];
  const r = w._txMonRole(null, nm);
  assert.ok(r && typeof r.label === 'string' && r.label.length, 'has a label');
  assert.ok(/[A-Za-z]+ \d+/.test(r.why), 'why names a stat + value');
  assert.ok(Array.isArray(r.focusStats) && r.focusStats.length === 2, 'two focus stats');
});
