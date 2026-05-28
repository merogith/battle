// Regression for Phase 4.0b: wild catches + Professor gifts must use the city
// wild/prof IV band, not the makeBuild CSV path's default 31s. Before the fix,
// _ensureBuildIVs silently bailed because makeBuild's preset already shipped 31s,
// so caught mons + starters all came out at 31/31/31/31/31/31. The fix adds a
// force=true option and the wild + prof call sites pass it. Verify: 60 rolls at
// C0 land entirely inside the 0-10 band (mathematically impossible by random
// chance if the band wasn't applied — 31 is outside the band).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const E = eng.window.__rivalTest;
const ST = eng.window.__storyTest;

function primeC0() {
  E.sm.active = true;
  E.sm.runSeed = 88;
  E.sm._strngState = null;
  if (!E.sm.settings) E.sm.settings = {};
  E.sm.settings.enabledGens = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  E.sm.badges = 0;
  E.sm.eventIndex = 0;
  E.sm.team = [];
}

test('caught-wild IVs at C0 land inside the wild/prof band [0..10] (force=true fix)', () => {
  primeC0();
  let maxIv = -1;
  for (let s = 0; s < 60; s++) {
    eng.seedRng(40000 + s);
    // _rollCityIVs is the IV source the wild path uses post-fix. With force=true on
    // the wild call site, this band is what every caught mon actually carries.
    const ivs = ST.rollCityIVs('wildprof', 0, 0, false);
    if (!ivs) continue;
    for (const k of ['hp','atk','def','spa','spd','spe']) {
      const v = ivs[k] | 0;
      assert.ok(v >= 0 && v <= 10, `C0 wild IV ${k}=${v} must be in [0..10], seed ${s}`);
      if (v > maxIv) maxIv = v;
    }
  }
  // Variety check: not every roll should be 0 (that would imply a broken roller).
  assert.ok(maxIv > 0, 'C0 wild IVs vary inside the band (not stuck at 0)');
});

test('_ensureBuildIVs(force=true) overwrites existing 31s with the supplied band', () => {
  const build = { ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 } };
  const band = { hp: 5, atk: 3, def: 7, spa: 8, spd: 2, spe: 9 };
  // Direct call via the window-exposed helper.
  eng.window._ensureBuildIVs(build, band, true);
  assert.deepEqual(build.ivs, band, 'force overwrites the preset 31s with the band');

  const build2 = { ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 } };
  eng.window._ensureBuildIVs(build2, band /* no force */);
  assert.deepEqual(build2.ivs, { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 }, 'without force, existing IVs are preserved (Smogon 0-Atk intent untouched)');
});
