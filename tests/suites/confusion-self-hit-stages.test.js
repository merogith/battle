// Regression for the P2 bug: confusion self-hit damage used raw mon.stats.atk/def,
// ignoring stat-stage modifiers. In Gen 7+ (the rule the code cites) the self-hit is
// a typeless 40-BP physical that uses the user's Atk/Def *with* stages — like any
// physical hit (cf. the main damage formula's getStageMult usage). Now routed through
// the pure _confusionSelfHitDamage() helper.
// Run: node --test tests/suites/confusion-self-hit-stages.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const { window } = await loadEngine();
const E = window.__engine;
const mk = (atk, def, stages) => ({ stats: { atk, def }, stages: stages || {} });

test('helper is exported', () => {
  assert.equal(typeof E.confusionSelfHitDamage, 'function');
});

test('no stages → raw 40-BP formula (22*40*atk/def, two floors, +2)', () => {
  // 22*40*(100/100)=880; floor(880/50)=17; 17+2=19
  assert.equal(E.confusionSelfHitDamage(mk(100, 100, {})), 19);
});

test('+2 Atk raises self-hit damage (×2.0 attack)', () => {
  const base = E.confusionSelfHitDamage(mk(120, 100, {}));
  const boosted = E.confusionSelfHitDamage(mk(120, 100, { atk: 2 }));
  assert.ok(boosted > base, `+2 Atk should raise damage (${boosted} > ${base})`);
});

test('+2 Def lowers self-hit damage (×2.0 defense)', () => {
  const base = E.confusionSelfHitDamage(mk(120, 100, {}));
  const bulkier = E.confusionSelfHitDamage(mk(120, 100, { def: 2 }));
  assert.ok(bulkier < base, `+2 Def should lower damage (${bulkier} < ${base})`);
});

test('missing stages object is treated as neutral (no throw)', () => {
  assert.equal(E.confusionSelfHitDamage({ stats: { atk: 100, def: 100 } }), 19);
});
