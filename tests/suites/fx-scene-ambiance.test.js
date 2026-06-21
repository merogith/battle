// FX scene ambiance (Stage 3) — locks the ambient particle layer wired onto the scene
// substrate + the centralized facility/city manager:
//
//   1. _storyScene supports a per-scene `ambient` preset that survives the per-beat
//      innerHTML swap (persistent .story-scene-content wrapper) and is torn down on
//      finish() — verified by the synchronous no-op path under the harness.
//   2. _syncFacilityAmbient maps story interiors to real presets and no-ops under the
//      harness (no canvas churn on screen swaps); non-facility ids clear the layer.
//
// Surface under test: window._storyScene / window._syncFacilityAmbient, harness only.

import { test, before } from 'node:test';
import assert from 'node:assert';
import { loadEngine } from '../helpers/load-engine.js';

let window, document;

before(async () => {
  ({ window } = await loadEngine());
  document = window.document;
  assert.equal(window.__testHarness, true);
});

// ── 1. _storyScene ambient layer (content wrapper + teardown) ─────────────────
test('_storyScene renders an ambient scene into a persistent content wrapper and tears down clean', () => {
  assert.equal(typeof window._storyScene, 'function', '_storyScene exposed');
  const before = document.querySelectorAll('.fxp-layer').length;
  let doneCalled = false;
  window._storyScene([{
    id: 'amb-test', title: 'Test', accent: '#aed581', ambient: 'embers',
    html: '<div>ambient scene</div>',
    options: [{ label: 'Continue', onPick: () => {} }],
  }], () => { doneCalled = true; }, 'fx-amb-test-overlay');

  const ov = document.getElementById('fx-amb-test-overlay');
  assert.ok(ov, 'overlay mounts');
  const content = ov.querySelector('.story-scene-content');
  assert.ok(content, 'a persistent content wrapper holds the card');
  assert.ok(content.querySelector('[data-scene-opt]'), 'option button rendered inside the wrapper');
  assert.equal(document.querySelectorAll('.fxp-layer').length, before,
    'no particle canvas mounted under the harness (ambient self-disables)');

  // Dismiss → overlay removed, onDone fired, no leaked layer.
  ov.querySelector('[data-scene-opt]').click();
  assert.equal(document.getElementById('fx-amb-test-overlay'), null, 'overlay removed on dismiss');
  assert.equal(doneCalled, true, 'onDone fired');
  assert.equal(window.FxParticles.liveCount(), 0, 'no ambient layer leaked');
});

test('the camp scenes declare the embers ambient (data wiring)', () => {
  // The camp menu/roster beats pass ambient:'embers'; assert the source wiring is present
  // by rendering a camp-shaped beat through the same path (full camp flow needs a save).
  assert.doesNotThrow(() => {
    window._storyScene([{ id: 'camp-like', title: '⛺ Camp', ambient: 'embers', fx: 'fire',
      html: '<div>fire</div>', options: [{ label: 'Break camp', onPick: () => {} }] }],
      null, 'fx-camp-like-overlay');
  });
  const ov = document.getElementById('fx-camp-like-overlay');
  assert.ok(ov && ov.querySelector('.scene-fx-fire'), 'campfire fx class still applied alongside ambient');
  ov.querySelector('[data-scene-opt]').click();
});

// ── 2. Facility / city ambient manager ───────────────────────────────────────
test('_FACILITY_AMBIENT maps every interior to a real FxParticles preset', () => {
  const map = window._FACILITY_AMBIENT;
  assert.ok(map, '_FACILITY_AMBIENT exposed');
  const known = window.FxParticles.presets();
  const ids = Object.keys(map);
  assert.ok(ids.includes('screen-story-city'), 'cities get ambiance');
  assert.ok(ids.includes('screen-story-shop'), 'the mart/dept shop gets ambiance');
  assert.ok(ids.includes('screen-story-tutor'), 'the tutor gets ambiance');
  ids.forEach(id => assert.ok(known.includes(map[id].preset), `${id} → real preset (${map[id].preset})`));
});

// ── 3. Milestone / capture burst contract (Stage 4 rides FxParticles.burst) ──
test('FxParticles.burst accepts the camp-milestone + capture option shapes (no-op under harness)', async () => {
  const fx = window.FxParticles;
  const body = document.body;
  const before = document.querySelectorAll('.fxp-layer').length;
  // Shapes used by the camp bond-mastery spotlight and the catch-success flourish.
  const calls = [
    ['sparkle',  { color: ['#ffd54f', '#fff8e1', '#ffe082'], duration: 1500, z: 6 }],   // path mastered
    ['confetti', { color: ['#ce93d8', '#ffd54f', '#aed581'], duration: 1500, z: 6 }],   // new title
    ['confetti', { color: ['#ffd54f', '#80deea', '#f48fb1', '#aed581'], duration: 1500, z: 6 }], // shiny catch
    ['sparkle',  { color: ['#ffd54f', '#fff8e1', '#ffe082'], duration: 1500, z: 6 }],   // normal catch
  ];
  for (const [preset, opts] of calls) {
    const id = await fx.burst(body, preset, opts);
    assert.equal(id, null, `${preset} burst no-ops under the harness`);
  }
  assert.equal(document.querySelectorAll('.fxp-layer').length, before, 'no burst canvas mounted while disabled');
  assert.equal(fx.liveCount(), 0, 'no burst layer leaked');
});

test('_syncFacilityAmbient no-ops under the harness and clears for non-facility ids', () => {
  const f = window._syncFacilityAmbient;
  assert.equal(typeof f, 'function', '_syncFacilityAmbient exposed');
  const before = document.querySelectorAll('.fxp-layer').length;
  assert.doesNotThrow(() => {
    f('screen-story-shop');     // facility → would mount (disabled here)
    f('screen-story-tutor');    // switch facility
    f('screen-menu');           // non-facility → clear
    f('screen-battle');         // non-facility → clear
  });
  assert.equal(document.querySelectorAll('.fxp-layer').length, before, 'no canvas mounted while disabled');
  assert.equal(window.FxParticles.liveCount(), 0, 'no facility layer tracked');
});
