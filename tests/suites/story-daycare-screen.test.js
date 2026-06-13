// Stage 9 — Daycare overlay → real screen (sensitive; flow preserved 1:1).
//
// The bespoke body overlay (#story-daycare-overlay) became a real facility screen
// (#screen-story-daycare) sharing the .story-shop-stack scaffold + header ← /
// footer "Back to City", matching every other facility. The enterDaycare DISPATCH
// (endgame idle → 6-badge Fight-Club secret → one-time drop-off → idle) and the
// drop-off / hatch logic are unchanged — only the presentation surface moved.
// The save schema (sm.daycare / sm.pits) is untouched (no SAVE_VER bump).
//
// Run: node --test tests/suites/story-daycare-screen.test.js

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEngine } from '../helpers/load-engine.js';

const HTML = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'battle.html'),
  'utf8'
);

let W, ST;
before(async () => {
  ({ window: W } = await loadEngine());
  await W.__testReady;
  ST = W.__storyTest;
});

test('the static screen-story-daycare scaffold exists with shared chrome', () => {
  const m = HTML.match(/<div id="screen-story-daycare" class="screen hidden story-screen-root"[\s\S]*?<div id="story-daycare-body"/);
  assert.ok(m, 'screen-story-daycare must exist');
  const head = m[0];
  assert.ok(head.includes('class="story-shop-stack"'), 'uses the shared stack scaffold');
  assert.ok(head.includes('class="story-shop-header-row"'), 'uses the shared header row');
  assert.ok(/class="story-shop-back-btn" onclick="window\.StoryMode\.enterCity\(\)"/.test(head),
    'header back arrow routes to enterCity');
  // Footer back button.
  const full = HTML.match(/<div id="screen-story-daycare"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
  assert.ok(full && /class="story-footer-back-btn" onclick="window\.StoryMode\.enterCity\(\)"/.test(full[0]),
    'footer "Back to City" routes to enterCity');
});

test('the overlay is gone — drop-off renders into the screen body and shows the screen', () => {
  assert.ok(!HTML.includes("ov.id = 'story-daycare-overlay'"), 'the body overlay is removed');
  assert.ok(!/document\.getElementById\('story-daycare-overlay'\)/.test(HTML),
    'no code looks up the old overlay node');
  assert.ok(/body\.innerHTML = _daycareRenderBody\(\);/.test(HTML),
    'drop-off populates the screen body');
  assert.ok(/showScreen\('screen-story-daycare'\);/.test(HTML),
    'drop-off shows the real screen');
});

test('the enterDaycare dispatch branch order is preserved 1:1 (no flow change)', () => {
  const fn = HTML.match(/function enterDaycare\(\) \{[\s\S]*?\n        \}/);
  assert.ok(fn, 'enterDaycare must exist');
  const body = fn[0];
  // The four branches, in the same order as before the conversion.
  const iEndgame = body.indexOf('_pitsIsEndgame()');
  const iSecret = body.indexOf("badges >= 6 && !(sm.pits && sm.pits.fightClubUnlocked)");
  const iDrop = body.indexOf('!dc.eggEventDone) { _daycareOpenDropOff()');
  const iIdle = body.indexOf('_daycareIdleScene(false)');
  assert.ok(iEndgame >= 0 && iSecret > iEndgame && iDrop > iSecret && iIdle > iDrop,
    'endgame-idle → 6-badge secret → one-time drop-off → idle order unchanged');
});

test('save schema is untouched — no SAVE_VER bump, no new daycare migration', () => {
  assert.ok(/const SAVE_VER = 27;/.test(HTML), 'SAVE_VER stays 27 (presentation-only change)');
  // The one-time drop-off still gates on the same save field.
  assert.ok(/if \(!dc\.eggEventDone\) \{ _daycareOpenDropOff\(\); return; \}/.test(HTML),
    'drop-off still gated on dc.eggEventDone');
  assert.ok(/sm\.daycare\.eggEventDone = true;/.test(HTML),
    'drop-off still records eggEventDone on the same field');
});

test('end-to-end: enterDaycare shows the screen; a drop-off completes the egg event (DOM)', () => {
  ST.sm = {
    active: true, badges: 3, gold: 3000, runSeed: 9, eventIndex: 0,
    team: [
      { id: 'm1', name: 'Pikachu',  build: { m: ['Thunderbolt'], i: null, a: null, n: 'Hardy', evs: { hp:0,atk:0,def:0,spa:0,spd:0,spe:0 } } },
      { id: 'm2', name: 'Bulbasaur', build: { m: ['Tackle'],      i: null, a: null, n: 'Hardy', evs: { hp:0,atk:0,def:0,spa:0,spd:0,spe:0 } } },
    ],
    pcBox: [], inventory: {}, balls: { poke:0, great:0, ultra:0, master:0 },
    daycare: { unlocked: true, eggEventDone: false }, pits: { fightClubUnlocked: false },
    settings: { enabledGens: [1] }, facilityIntros: {}, facilitiesSeen: {},
  };

  W.StoryMode.enterDaycare();
  const scr = W.document.getElementById('screen-story-daycare');
  const body = W.document.getElementById('story-daycare-body');
  assert.ok(scr && !scr.classList.contains('hidden'), 'the daycare screen is shown');
  assert.ok(body && body.querySelectorAll('[data-daycare-drop]').length >= 2,
    'the body lists droppable party mons');
  assert.ok(body.querySelectorAll('.story-section-header').length >= 2,
    'the body uses the shared section headers (From Party / From PC)');

  // Drop off Pikachu — the one-time egg event should complete on the live state.
  ST.daycareDropOff('m1');
  const sm = ST.sm;
  assert.equal(sm.daycare.eggEventDone, true, 'eggEventDone flips true');
  assert.ok(!sm.team.some(s => s.id === 'm1'), 'the parent leaves the party');
  const hasEgg = (sm.team || []).some(s => s && s.isEgg) || (sm.pcBox || []).some(s => s && s.isEgg);
  assert.ok(hasEgg, 'an egg is received');

  // The matron refuses a second drop-off (one-time gate intact).
  ST.daycareDropOff('m2');
  assert.ok(sm.team.some(s => s.id === 'm2'), 'a second drop-off is refused');
});
