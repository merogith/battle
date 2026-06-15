// Story text-reveal + speaker tones (v29) — locks the two game-feel lifts so a
// later session can't silently regress them:
//
//   1. Typewriter-by-default — narrative beats reveal with reading tempo, behind
//      the storyTypewriter Settings toggle (default ON). The jsdom contract
//      (full text present synchronously) must survive the default flip, and the
//      toggle must exist + read ON by default.
//   2. Per-speaker tones — _toneClassForScene now also keys off the SPEAKER:
//      the Professor reads warm, the rival in their own hue, while arc-scoped
//      sceneKeys (villain/extra/mystery) still win first.
//
// Surface under test: window.__narrationTest + window globals, jsdom harness only.

import { test, before, beforeEach } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadEngine } from '../helpers/load-engine.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(join(__dirname, '../../battle.html'), 'utf8');

let nt, window, document;

before(async () => {
  ({ window } = await loadEngine());
  nt = window.__narrationTest;
  document = window.document;
  assert.ok(nt, 'window.__narrationTest must be exposed under the harness');
});

beforeEach(() => {
  let guard = 0;
  do { nt.narrationForceClear(); } while ((nt.isNarrationLive() || nt.narrationQueueDepth() > 0) && ++guard < 50);
  nt.sm = { storyChoices: {} };
});

// ── 1. Speaker-keyed tones ───────────────────────────────────────────────────
test('_toneClassForScene keys the Professor + rival off the speaker', () => {
  const f = window._toneClassForScene;
  assert.equal(typeof f, 'function', '_toneClassForScene exposed');
  // Professor mentor → warm, by speaker, with no sceneKey.
  assert.equal(f('', 'Prof. Oak'), 'narr-tone-warm', 'Prof. Oak → warm');
  assert.equal(f(null, 'Professor Birch'), 'narr-tone-warm', 'Professor … → warm');
  assert.equal(f('main.event3', 'Oak'), 'narr-tone-warm', 'bare Oak → warm');
  // Rival → rival hue, generic label.
  assert.equal(f('', 'Rival'), 'narr-tone-rival', 'Rival → rival');
  assert.equal(f('', 'your rival'), 'narr-tone-rival', 'your rival → rival');
  // No speaker / unknown speaker → default look.
  assert.equal(f('main.event1', 'City Guide'), '', 'City Guide keeps the default look');
  assert.equal(f('', ''), '', 'no speaker → no tone');
});

test('arc-scoped sceneKeys still win over the speaker', () => {
  const f = window._toneClassForScene;
  assert.equal(f('villain.rocket.boss', 'Prof. Oak'), 'narr-tone-villain', 'villain arc beats speaker');
  assert.equal(f('extra.cubone.event2', 'Rival'), 'narr-tone-anomaly', 'horror arc beats speaker');
  assert.equal(f('main.mfReveal', 'Oak'), 'narr-tone-anomaly', 'the reveal stays anomaly');
});

test('the overlay derives the warm/rival tone from o.name', () => {
  const warm = nt.renderNarrativeOverlay({ name: 'Prof. Oak', lines: ['x'], onDone: () => {} });
  assert.ok(warm.classList.contains('narr-tone-warm'), 'Professor speaker tints the overlay warm');
  warm.querySelector('button[data-narr-continue="1"]').click();

  const rival = nt.renderNarrativeOverlay({ name: 'Rival', lines: ['x'], onDone: () => {} });
  assert.ok(rival.classList.contains('narr-tone-rival'), 'Rival speaker tints the overlay');
  rival.querySelector('button[data-narr-continue="1"]').click();
});

// ── 2. Typewriter default keeps the synchronous full-text contract ────────────
test('default-on typewriter does not strip dialogue text in the harness', () => {
  const LINE = 'The road remembers every step you take.';
  const ov = nt.renderNarrativeOverlay({ sceneKey: 'main.event2', lines: [LINE], onDone: () => {} });
  const body = ov.querySelector('[data-narr-body="1"]') || ov;
  assert.ok((body.textContent || '').includes(LINE),
    'full prose is present synchronously even with typewriter defaulted on (jsdom contract)');
  ov.querySelector('button[data-narr-continue="1"]').click();
  assert.equal(ov.parentNode, null, 'overlay still dismisses synchronously');
});

// ── 3. The Settings toggle exists and reads ON by default ─────────────────────
test('storyTypewriter toggle exists and syncs ON by default', () => {
  const el = document.getElementById('sw-story-typewriter');
  assert.ok(el, 'the Story text reveal switch is in the settings markup');
  assert.equal(typeof window.syncSettingsModalSwitches, 'function', 'sync fn exposed');
  window.syncSettingsModalSwitches();
  assert.equal(el.checked, true, 'defaults ON (settings.storyTypewriter !== false)');
});

// ── 4. The rival tone CSS matches the rival VS accent family (orange, not blue) ─
test('.narr-tone-rival is retuned to the rival orange, not the old blue', () => {
  const block = SRC.match(/\.narr-tone-rival \.story-dialog-nameplate \{[\s\S]*?\}/);
  assert.ok(block, '.narr-tone-rival nameplate rule is present');
  assert.ok(!/#7fb2ff/i.test(block[0]), 'the old blue rival gradient (#7fb2ff) is gone');
  assert.match(block[0], /#e06a16|#ffb15a/i, 'uses the burnt-orange rival gradient');
});

// ── 5. The city quote box gets the same per-speaker tint ─────────────────────
test('the city hub quote box is wired to the speaker tones', () => {
  // The renderCityActions speaker branch toggles narr-tone-* on the city dialog host.
  assert.match(SRC, /_cityHost\.classList\.add\(_cityTone\)/, 'city host receives a tone class');
  assert.match(SRC, /_rivalCameoActive\) _cityTone = 'narr-tone-rival'/, 'rival cameo → rival tone');
});
