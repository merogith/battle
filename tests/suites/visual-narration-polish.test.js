// Visual / narration polish pass (v28) — locks the four data/CSS-driven lifts
// from the art-direction review so a later session can't silently regress them:
//
//   1. Per-register narration tone — _toneClassForScene maps villain/extra/mystery
//      sceneKeys to a .narr-tone-* class, and the overlay actually applies it.
//   2. Overlay fade regression guard — under the harness the dialog still mounts
//      and is removed SYNCHRONOUSLY on dismiss (the fade-out defers removal only
//      in a real browser; __testHarness must keep the legacy instant contract).
//   3. Main-spine backdrop curation — the milestone main.* beats resolve to the
//      curated gen3 scenes instead of the flat 'forest' fallback.
//   4. Settings-gear SVG — the three chrome gear buttons render an inline
//      <svg class="ui-glyph">, never the OS-font ⚙ emoji.
//
// Surface under test: window.__narrationTest + window globals, jsdom harness only.

import { test, before, beforeEach } from 'node:test';
import assert from 'node:assert';
import { loadEngine } from '../helpers/load-engine.js';

let nt, window, document;

before(async () => {
  ({ window } = await loadEngine());
  nt = window.__narrationTest;
  document = window.document;
  assert.ok(nt, 'window.__narrationTest must be exposed under the harness');
  assert.equal(window.__testHarness, true, 'fade path must see the harness flag');
});

beforeEach(() => {
  let guard = 0;
  do { nt.narrationForceClear(); } while ((nt.isNarrationLive() || nt.narrationQueueDepth() > 0) && ++guard < 50);
  nt.sm = { storyChoices: {} };
});

// ── 1. Tone resolver ────────────────────────────────────────────────────────
test('_toneClassForScene maps registers to .narr-tone-* classes', () => {
  const f = window._toneClassForScene;
  assert.equal(typeof f, 'function', '_toneClassForScene exposed');
  assert.equal(f('villain.rocket.event1'), 'narr-tone-villain', 'villain arc → villain tone');
  assert.equal(f('extra.cubone.event2'), 'narr-tone-anomaly', 'horror arc → anomaly tone');
  assert.equal(f('main.mfReveal'), 'narr-tone-anomaly', 'the reveal → anomaly tone');
  assert.equal(f('main.loop.remember'), 'narr-tone-anomaly', 'loop capstone → anomaly tone');
  assert.equal(f('main.event1'), '', 'ordinary road beat keeps the default look');
  assert.equal(f(''), '', 'empty key → no tone');
  assert.equal(f(null), '', 'null key → no tone');
});

test('the overlay applies the derived tone class from sceneKey', () => {
  const ov = nt.renderNarrativeOverlay({ sceneKey: 'villain.galactic.boss', lines: ['x'], onDone: () => {} });
  assert.ok(ov.classList.contains('narr-tone-villain'), 'villain sceneKey tints the overlay root');
  ov.querySelector('button[data-narr-continue="1"]').click();
});

test('an explicit toneClass still wins over the derived one', () => {
  const ov = nt.renderNarrativeOverlay({ sceneKey: 'villain.rocket.event1', toneClass: 'story-anomaly', lines: ['x'], onDone: () => {} });
  assert.ok(ov.classList.contains('story-anomaly'), 'explicit tone honoured');
  assert.ok(!ov.classList.contains('narr-tone-villain'), 'derived tone not added when explicit is given');
  ov.querySelector('button[data-narr-continue="1"]').click();
});

// ── 2. Fade-out must not break the synchronous dismiss contract ──────────────
test('dismiss still removes the overlay synchronously under the harness', () => {
  const ov = nt.renderNarrativeOverlay({ sceneKey: 'extra.hypno.raid', lines: ['fade check'], onDone: () => {} });
  assert.equal(ov.parentNode, document.body, 'overlay mounts');
  assert.ok(ov.classList.contains('narr-tone-anomaly'), 'horror sceneKey toned');
  ov.querySelector('button[data-narr-continue="1"]').click();
  assert.equal(ov.parentNode, null, 'overlay removed from the DOM on dismiss (no deferred removal in tests)');
  assert.equal(nt.isNarrationLive(), false, 'stage clear');
});

// ── 3. Main-spine backdrop curation ─────────────────────────────────────────
test('milestone main.* beats resolve to curated gen3 backdrops', () => {
  const bd = window._backdropKeyForScene;
  assert.equal(typeof bd, 'function', '_backdropKeyForScene exposed');
  assert.equal(bd('main.event6'), 'mansion', 'the empty portrait → mansion');
  assert.equal(bd('main.event8'), 'league', 'pre-plateau → league');
  assert.equal(bd('main.mfBattle'), 'league', 'apex → league');
  assert.equal(bd('main.mfReveal'), 'villain', 'the reveal → villain wash');
  assert.equal(bd('main.ending'), 'lab', 'the loop closes back in the lab');
  // Early open-road events intentionally keep the neutral fallback.
  assert.equal(bd('main.event1'), 'forest', 'early road beat keeps the open-road default');
  // Every curated key must be one of the real gen3 manifest scene names.
  const KNOWN = ['cave', 'forest', 'safari', 'mountain', 'cavern', 'villain', 'mansion', 'league', 'sea', 'lab'];
  ['main.event5', 'main.event6', 'main.event7', 'main.event8', 'main.event9',
    'main.battle1', 'main.battle2', 'main.mfBattle', 'main.mfReveal', 'main.ending']
    .forEach(k => assert.ok(KNOWN.includes(bd(k)), `${k} → a real gen3 scene (${bd(k)})`));
});

// ── 4. Settings gear is an inline SVG, never the ⚙ emoji ─────────────────────
test('chrome settings buttons render an inline SVG gear, not the emoji', () => {
  ['.settings-btn', '.story-hud-settings', '.battle-settings-btn'].forEach(sel => {
    const btn = document.querySelector(sel);
    assert.ok(btn, `${sel} exists`);
    assert.ok(btn.querySelector('svg.ui-glyph'), `${sel} has an inline ui-glyph SVG`);
    assert.ok(!/⚙/.test(btn.textContent || ''), `${sel} no longer contains the ⚙ emoji`);
    assert.ok((btn.getAttribute('aria-label') || '').toLowerCase().includes('settings'),
      `${sel} keeps an accessible label`);
  });
});

test('uiSvgGear helper returns a currentColor SVG', () => {
  assert.equal(typeof window.uiSvgGear, 'function', 'uiSvgGear exposed');
  const html = window.uiSvgGear();
  assert.match(html, /<svg/, 'returns an svg');
  assert.match(html, /currentColor/, 'inherits currentColor');
});

// ── 5. Screen cross-fade must keep the instant (synchronous) swap under the harness ──
test('showScreen swaps screens instantly (no fade class) under the harness', () => {
  assert.equal(typeof window.showScreen, 'function', 'showScreen exposed');
  assert.equal(window._screenFadeEnabled(), false, 'cross-fade disabled under the harness');
  window.showScreen('screen-menu');
  const menu = document.getElementById('screen-menu');
  assert.ok(menu && !menu.classList.contains('hidden'), 'target screen is shown');
  assert.ok(!menu.classList.contains('screen-fade-in'), 'no fade class added under the harness');
  document.querySelectorAll('.screen').forEach(s => {
    if (s !== menu) assert.ok(s.classList.contains('hidden'), `${s.id} is hidden after the swap`);
  });
});
