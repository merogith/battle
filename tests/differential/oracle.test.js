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

// 2) Known-bug marker — the Fly self-target bug (catalogue #1).
// PRE-FIX: the oracle must flag it. After the Stage 1 fix (add the
// SELF_TARGETING_STATUS guard at battle.html:23087), change this to
// `assert.equal(d.counts.high, 0, ...)` and set the scenario's expect to 'match'.
test('oracle detects the Fly self-target bug (catalogue #1, pre-fix)', async () => {
  const scn = SCENARIOS.find(s => s.id === 'seminvuln-selfboost-fly');
  const d = await runScenario(scn);
  assert.ok(d.counts.high > 0, 'expected the oracle to flag the Fly self-target divergence (it is unfixed)');
});
