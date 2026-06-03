// CI gate for the Showdown differential oracle (Stage 0).
//
// Picked up by `npm test` (tests/**/*.test.js). Two jobs:
//   1. Trustworthiness gate — every should-match scenario must AGREE with
//      Showdown (no high-confidence divergence). A red here means either a
//      should-match behaviour regressed or the oracle itself broke.
//   2. Known-bug markers — document that the oracle still detects the catalogued
//      bugs. When Stage 1 lands a fix, flip the marker (and the scenario's
//      `expect`) so the suite proves the fix instead.
//
// Reference engine: @pkmn/sim (MIT) — see docs/BATTLE_ENGINE_INVESTIGATION.md.

import test from 'node:test';
import assert from 'node:assert/strict';
import { SCENARIOS } from './scenarios.mjs';
import { runShowdownBattle } from './showdown-oracle.mjs';
import { runInhouseBattle } from './inhouse-oracle.mjs';
import { diffTraces } from './diff.mjs';

async function runScenario(scn) {
  const sd = await runShowdownBattle(scn);
  const ih = await runInhouseBattle(scn);
  return diffTraces(sd, ih, scn);
}

// 1) Trustworthiness: sanity/regression scenarios must agree.
for (const scn of SCENARIOS.filter(s => s.expect === 'match')) {
  test(`sanity agrees with Showdown: ${scn.id}`, async () => {
    const d = await runScenario(scn);
    const highs = d.divergences.filter(x => x.confidence === 'high');
    assert.equal(
      highs.length, 0,
      `unexpected high-confidence divergence(s) on a should-match scenario:\n${JSON.stringify(highs, null, 2)}`,
    );
  });
}

// 2) Fix proof — finding #1 (self-target move "misses" vs a semi-invuln foe).
// Stage 1 added the SELF_TARGETING_STATUS guard to the invuln check (battle.html),
// so Swords Dance now applies through the foe's Fly: the oracle sees no divergence.
test('finding #1 fixed: self-target move applies through a semi-invuln foe', async () => {
  const scn = SCENARIOS.find(s => s.id === 'seminvuln-selfboost-fly');
  const d = await runScenario(scn);
  assert.equal(d.counts.high, 0, 'self-boost should apply through the foe\'s invulnerability (finding #1 fixed)');
});
