// Power-weighted Smogon set selection. A set's competitive tier (its _format) is a power
// ordering — an OU set outclasses a ZU set on the same species. Story foes now pick a
// stage-appropriate set instead of a uniform-random one: humble early, near-best in the
// league and everything after. Fixes "weak Champion set", weak/unviable mid-late rolls, and
// "only very good builds in the league". Non-story callers (no setPowerTarget) are unchanged.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;
const makeBuild = W.__rivalTest.makeBuild; // build factory handle (story-agnostic scope)
const power = (b) => W._smogonSetPower(b);

test('_smogonSetPower maps Smogon tiers to a power ordering; unknown → neutral', () => {
  assert.equal(power({ _format: 'ubers' }), 1.00);
  assert.equal(power({ _format: 'ou' }), 0.90);
  assert.equal(power({ _format: 'uu' }), 0.75);
  assert.equal(power({ _format: 'ru' }), 0.62);
  assert.equal(power({ _format: 'nu' }), 0.50);
  assert.equal(power({ _format: 'pu' }), 0.40);
  assert.equal(power({ _format: 'zu' }), 0.30);
  assert.equal(power({ _format: 'lc' }), 0.25);
  assert.ok(power({ _format: 'ou' }) > power({ _format: 'uu' }), 'OU > UU');
  assert.ok(power({ _format: 'uu' }) > power({ _format: 'pu' }), 'UU > PU');
  // Recognised off-standard singles formats score deliberately (see docs/SMOGON_INFO_GAPS.md B):
  // Anything Goes is top strength; monotype / Battle Stadium-Spot Singles sit mid.
  assert.equal(power({ _format: 'nationaldexag' }), 1.00);
  assert.equal(power({ _format: 'monotype' }), 0.60);
  assert.equal(power({ _format: 'battlestadiumsingles' }), 0.60);
  // Genuinely unknown / exotic / empty formats still score neutral so they neither dominate nor vanish.
  assert.equal(power({ _format: 'balancedhackmons' }), 0.5);
  assert.equal(power({ _format: '' }), 0.5);
  assert.equal(power(null), 0.5);
});

test('_pickSetByPower biases toward the target strength (keeps variety, not argmax)', () => {
  const pool = [{ _format: 'zu' }, { _format: 'pu' }, { _format: 'nu' }, { _format: 'uu' }, { _format: 'ou' }, { _format: 'ubers' }];
  const meanPower = (target, n = 4000) => {
    let s = 0; for (let i = 0; i < n; i++) s += power(W._pickSetByPower(pool, target, Math.random)); return s / n;
  };
  const hi = meanPower(0.94), lo = meanPower(0.30);
  assert.ok(hi > 0.80, `high target should mostly pick strong sets (mean ${hi.toFixed(3)})`);
  assert.ok(lo < 0.50, `low target should mostly pick humble sets (mean ${lo.toFixed(3)})`);
  assert.ok(hi - lo > 0.35, `target must move the distribution (hi ${hi.toFixed(3)} vs lo ${lo.toFixed(3)})`);
  // Near-best, slight variety (maintainer choice): a high target still occasionally rolls a
  // non-top set — it is a weighted draw, not a hard argmax.
  let sawNonTop = false;
  for (let i = 0; i < 300 && !sawNonTop; i++) if (power(W._pickSetByPower(pool, 0.94, Math.random)) < 0.9) sawNonTop = true;
  assert.ok(sawNonTop, 'near-best should still admit slight variety');
});

test('_stagePowerTargetForEvent: humble early, near-best in the league and after', () => {
  ST.sm.active = true; ST.sm.runSeed = 5; ST.sm._strngState = null;
  ST.sm.settings = Object.assign(ST.sm.settings || {}, { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] });
  ST.sm.badges = 0;
  assert.equal(ST.stagePowerTargetForEvent('Gym Leader 1', 5, 0), 0.30, 'GL1 (T1) humble');
  assert.equal(ST.stagePowerTargetForEvent('Gym Leader 6', 38, 5), 0.72, 'GL6 (T3) competent');
  const champ = ST.stagePowerTargetForEvent('Champion', 63, 8);
  const e1 = ST.stagePowerTargetForEvent('E1', 60, 8);
  const myst = ST.stagePowerTargetForEvent('Mystery Figure', null, 8);
  assert.ok(champ >= 0.94 && e1 >= 0.94 && myst >= 0.94, `league+ near-best (champ ${champ}, e1 ${e1}, myst ${myst})`);
  // Post-HoF (badges>=8): any event floors to near-best so Crucible rematches stay sharp.
  assert.ok(ST.stagePowerTargetForEvent('Basic Trainer', 5, 8) >= 0.94, 'badges>=8 floors to near-best');
});

test('integration: makeBuild biases set quality by target (Snorlax, multi-tier spread ou→zu)', () => {
  ST.sm.active = true; ST.sm.runSeed = 9; ST.sm._strngState = null;
  const meanFor = (target, n = 250) => {
    let s = 0, c = 0;
    for (let i = 0; i < n; i++) {
      const b = makeBuild('Snorlax', { forceGimmick: 'STANDARD', setPowerTarget: target });
      if (b) { s += power(b); c++; }
    }
    return c ? s / c : 0;
  };
  const hi = meanFor(0.94), lo = meanFor(0.30);
  // The 30% designed-build share scores neutral (0.5) for BOTH targets, so it cancels in the
  // difference; the CSV share carries the bias. Difference stays comfortably positive.
  assert.ok(hi > lo + 0.10, `high target rolls stronger Snorlax sets than low (hi ${hi.toFixed(3)} vs lo ${lo.toFixed(3)})`);
});

test('no target → legacy uniform selection (out-of-scope modes unchanged)', () => {
  ST.sm.active = false;
  const b = makeBuild('Snorlax', { forceGimmick: 'STANDARD' });
  assert.ok(b && Array.isArray(b.m) && b.m.length, 'legacy makeBuild path still produces a valid build');
  ST.sm.active = true;
});
