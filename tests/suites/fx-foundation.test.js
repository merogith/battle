// FX foundation (Stage 0) — locks the lazy-loaded FxParticles wrapper added for the
// visual-immersion pass so a later session can't silently regress the self-disabling
// contract that keeps battles, the a11y guards, and the jsdom suite deterministic:
//
//   1. window.FxParticles (tsParticles) — surface, preset library, and the
//      harness/reduced-motion/setting no-op (must NOT fetch the lib or append a canvas).
//
// (The dormant window.AudioBus Howler wrapper was dead code — zero callers — and was
//  removed in 2026-07; its surface test went with it.)
//
// Surface under test: window.FxParticles, jsdom harness only.

import { test, before } from 'node:test';
import assert from 'node:assert';
import { loadEngine } from '../helpers/load-engine.js';

let window, document;

before(async () => {
  ({ window } = await loadEngine());
  document = window.document;
  assert.equal(window.__testHarness, true, 'foundation no-op path must see the harness flag');
});

// ── 1. FxParticles surface + presets ─────────────────────────────────────────
test('FxParticles is exposed with the expected method surface', () => {
  const fx = window.FxParticles;
  assert.ok(fx, 'window.FxParticles exists');
  ['mount', 'burst', 'clear', 'clearAll', 'isEnabled', 'settingOn', 'presets', 'liveCount']
    .forEach(m => assert.equal(typeof fx[m], 'function', `FxParticles.${m} is a function`));
});

test('FxParticles ships the documented preset library', () => {
  const keys = window.FxParticles.presets();
  ['embers', 'dust', 'shimmer', 'leaves', 'snow', 'rain', 'sand', 'sun', 'sparkle', 'confetti']
    .forEach(k => assert.ok(keys.includes(k), `preset "${k}" exists`));
});

test('settings.ambientParticles defaults on (settingOn reads the live pref)', () => {
  assert.equal(window.FxParticles.settingOn(), true, 'ambient particles default to on');
});

// ── 2. The self-disabling contract (the part that protects perf + a11y + tests) ──
test('FxParticles.mount no-ops under the harness without fetching the lib or adding a canvas', async () => {
  const fx = window.FxParticles;
  assert.equal(fx.isEnabled(), false, 'harness flag disables the effect layer');
  const scriptsBefore = document.querySelectorAll('script[data-tsparticles-bundle]').length;
  const id = await fx.mount(document.body, 'embers', {});
  assert.equal(id, null, 'mount returns null when disabled');
  assert.equal(fx.liveCount(), 0, 'no live layer is created');
  assert.equal(document.querySelectorAll('.fxp-layer').length, 0, 'no canvas host is appended');
  assert.equal(document.querySelectorAll('script[data-tsparticles-bundle]').length, scriptsBefore,
    'the tsParticles library is never fetched while disabled');
});

test('FxParticles.burst also no-ops under the harness', async () => {
  const id = await window.FxParticles.burst(document.body, 'sparkle', {});
  assert.equal(id, null, 'burst returns null when disabled');
  assert.equal(window.FxParticles.liveCount(), 0, 'no live layer created by a burst');
});

test('an unknown preset key returns null without throwing', async () => {
  const id = await window.FxParticles.mount(document.body, 'no-such-preset', {});
  assert.equal(id, null, 'unknown preset resolves to null');
});

test('clear() on an unknown id is a harmless no-op', () => {
  assert.doesNotThrow(() => window.FxParticles.clear('fxp-does-not-exist'));
  assert.doesNotThrow(() => window.FxParticles.clearAll());
});

// ── 3. AudioBus removed ──────────────────────────────────────────────────────
test('the dead AudioBus wrapper is gone (no longer shipped)', () => {
  assert.equal(window.AudioBus, undefined, 'window.AudioBus was removed as dead code');
});
