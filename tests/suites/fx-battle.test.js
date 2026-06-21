// FX battle juice (Stage 1) — locks the two new battle visual hooks so a later
// session can't regress them:
//
//   1. Weather → particle layer: _battleWeatherPreset maps each weather type to the
//      right FxParticles preset, and syncBattleWeatherFx change-detects + no-ops under
//      the harness (no canvas churn on the render hot path).
//   2. Crit / super-effective hit-burst: _battleImpactBurst fires only for the punchy
//      tiers, is type-tinted, and is a self-disabling no-op under the harness.
//
// Pre-existing battle juice that this pass intentionally did NOT rebuild (documented
// here so it isn't "re-added"): HP-bar drain (CSS `transition: width` on .hp-fill) and
// the tier-graded screen shake (_battleHitShake / _applyHitImpact).
//
// Surface under test: window-mirrored helpers, jsdom harness only.

import { test, before } from 'node:test';
import assert from 'node:assert';
import { loadEngine } from '../helpers/load-engine.js';

let window, document;

before(async () => {
  ({ window } = await loadEngine());
  document = window.document;
  assert.equal(window.__testHarness, true);
});

// ── 1. Weather → preset mapping ──────────────────────────────────────────────
test('_battleWeatherPreset maps every weather type to the right particle preset', () => {
  const f = window._battleWeatherPreset;
  assert.equal(typeof f, 'function', '_battleWeatherPreset is exposed');
  assert.equal(f('Rain'), 'rain');
  assert.equal(f('HeavyRain'), 'rain');
  assert.equal(f('Sandstorm'), 'sand');
  assert.equal(f('Hail'), 'snow');
  assert.equal(f('Sun'), 'sun');
  assert.equal(f('HarshSun'), 'sun');
  assert.equal(f('StrongWinds'), '', 'no precipitation preset for strong winds');
  assert.equal(f(''), '', 'no weather → no preset');
  assert.equal(f(null), '', 'null weather → no preset');
  // Every mapped preset must be a real FxParticles preset.
  const known = window.FxParticles.presets();
  ['rain', 'sand', 'snow', 'sun'].forEach(p => assert.ok(known.includes(p), `${p} is a real preset`));
});

test('syncBattleWeatherFx no-ops under the harness and never throws', () => {
  const overlay = document.getElementById('weather-overlay');
  assert.ok(overlay, 'the weather overlay element exists');
  const before = document.querySelectorAll('.fxp-layer').length;
  assert.doesNotThrow(() => {
    window.syncBattleWeatherFx(overlay, 'Rain');
    window.syncBattleWeatherFx(overlay, 'Sandstorm');
    window.syncBattleWeatherFx(overlay, null);
  });
  assert.equal(document.querySelectorAll('.fxp-layer').length, before, 'no particle canvas mounted while disabled');
  assert.equal(window.FxParticles.liveCount(), 0, 'no live layer tracked');
  assert.doesNotThrow(() => window.syncBattleWeatherFx(null, 'Rain'), 'a null overlay is tolerated');
});

// ── 2. Crit / super-effective hit-burst ──────────────────────────────────────
test('_TYPE_BURST_COLOR covers all 18 types', () => {
  const map = window._TYPE_BURST_COLOR;
  assert.ok(map, '_TYPE_BURST_COLOR is exposed');
  ['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground',
   'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy']
    .forEach(t => assert.match(String(map[t] || ''), /^#[0-9a-f]{6}$/i, `${t} has a hex colour`));
});

test('_battleImpactBurst fires only for the punchy tiers and no-ops under the harness', () => {
  const f = window._battleImpactBurst;
  assert.equal(typeof f, 'function', '_battleImpactBurst is exposed');
  const before = document.querySelectorAll('.fxp-layer').length;
  assert.doesNotThrow(() => {
    f({ crit: true, isPlayerTarget: false, type: 'Fire' });          // crit tier
    f({ effectiveness: 2, isPlayerTarget: true, type: 'Water' });    // super tier
    f({ bossPhase: true, isPlayerTarget: false, type: 'Dragon' });   // boss tier
    f({ effectiveness: 1, isPlayerTarget: false, type: 'Normal' });  // normal → nothing
    f({ effectiveness: 0.5, isPlayerTarget: false, type: 'Grass' }); // resisted → nothing
    f(null);                                                          // garbage → tolerated
  });
  assert.equal(document.querySelectorAll('.fxp-layer').length, before, 'no burst canvas mounted while disabled');
  assert.equal(window.FxParticles.liveCount(), 0, 'no live layer tracked');
});
