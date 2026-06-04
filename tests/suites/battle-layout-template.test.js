// Locks the battle-screen template selector: applyBattleLayoutMode must resolve the
// SINGLE source of truth (data-battle-layout) to exactly "arena" or "stack", by
// is-mobile + orientation — never the retired desktop/ultrawide/portrait/landscape-touch
// names. This is the JS half of the "one responsive layout, two templates" rebuild;
// the CSS half is keyed entirely off this attribute, so if the switch regresses the
// whole battle screen does. See the DISPLAY MODES header in battle.html.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

test('applyBattleLayoutMode → arena/stack by is-mobile + orientation', async () => {
  const { window } = await loadEngine();
  const sb = window.document.getElementById('screen-battle');
  assert.ok(sb, '#screen-battle exists');
  assert.equal(typeof window.applyBattleLayoutMode, 'function', 'applyBattleLayoutMode is exposed');

  const realMatchMedia = window.matchMedia;
  const setPortrait = (isPortrait) => {
    window.matchMedia = (q) => ({
      matches: /orientation:\s*portrait/.test(String(q)) ? isPortrait : false,
      media: q, onchange: null,
      addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent() { return false; },
    });
  };

  const resolve = (mobile, portrait) => {
    window.document.body.classList.toggle('is-mobile', mobile);
    setPortrait(portrait);
    window.applyBattleLayoutMode();
    return sb.getAttribute('data-battle-layout');
  };

  // Desktop fixed frame is always 16:9 → always "arena", whatever the window orientation.
  assert.equal(resolve(false, false), 'arena', 'non-mobile landscape → arena');
  assert.equal(resolve(false, true), 'arena', 'non-mobile portrait-ish window → arena (frame stays 16:9)');

  // Fluid touch layout → orientation decides.
  assert.equal(resolve(true, false), 'arena', 'mobile landscape → arena');
  assert.equal(resolve(true, true), 'stack', 'mobile portrait → stack');

  // Never emit a retired template name.
  for (const [m, p] of [[false, false], [true, false], [true, true]]) {
    const got = resolve(m, p);
    assert.ok(['arena', 'stack'].includes(got), `template is arena|stack, got "${got}"`);
  }

  // Restore shared harness state (the engine instance is cached across the file).
  window.matchMedia = realMatchMedia;
  window.document.body.classList.remove('is-mobile');
});

test('getBattleBgUrl maps templates (and legacy names) to the right art set', async () => {
  const { window } = await loadEngine();
  assert.equal(typeof window.getBattleBgUrl, 'function', 'getBattleBgUrl is exposed');
  const url = (terrain, folder) => window.getBattleBgUrl(terrain, folder);

  assert.match(url('neutral', 'portrait'), /battle\/portrait\/bg_neutral\.png/);
  assert.match(url('neutral', 'stack'), /battle\/portrait\/bg_neutral\.png/, 'stack → portrait art');
  assert.match(url('grassy', 'landscape'), /battle\/landscape\/bg_grassy\.png/);
  assert.match(url('electric', 'desktop'), /battle\/desktop\/bg_electric\.png/);
  // Unknown / arena fall back to the wide desktop art.
  assert.match(url('neutral', 'arena'), /battle\/desktop\/bg_neutral\.png/, 'arena → desktop art by default');
});
