// FX foundation (Stage 0) — locks the two lazy-loaded library wrappers added for the
// visual-immersion pass so a later session can't silently regress the self-disabling
// contract that keeps battles, the a11y guards, and the jsdom suite deterministic:
//
//   1. window.FxParticles (tsParticles) — surface, preset library, and the
//      harness/reduced-motion/setting no-op (must NOT fetch the lib or append a canvas).
//   2. window.AudioBus (Howler) — surface and the dormant-by-default no-op.
//
// Surface under test: window.FxParticles + window.AudioBus, jsdom harness only.

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

// ── 3. AudioBus surface + dormant no-op ──────────────────────────────────────
test('AudioBus is exposed and dormant under the harness', async () => {
  const ab = window.AudioBus;
  assert.ok(ab, 'window.AudioBus exists');
  ['crossfadeTo', 'stop', 'duck', 'unduck', 'current', 'isEnabled']
    .forEach(m => assert.equal(typeof ab[m], 'function', `AudioBus.${m} is a function`));
  assert.equal(ab.isEnabled(), false, 'AudioBus is disabled under the harness (and dormant by default)');
  const scriptsBefore = document.querySelectorAll('script[data-howler-bundle]').length;
  const r = await ab.crossfadeTo('music/background/background1.mp3', {});
  assert.equal(r, null, 'crossfadeTo no-ops when disabled');
  assert.equal(ab.current(), null, 'no current track is set');
  assert.equal(document.querySelectorAll('script[data-howler-bundle]').length, scriptsBefore,
    'the Howler library is never fetched while disabled');
  assert.doesNotThrow(() => { ab.stop(); ab.duck(); ab.unduck(); }, 'transport calls are safe no-ops when idle');
});
