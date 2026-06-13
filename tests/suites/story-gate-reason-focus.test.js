// Stage 8 — Gate-reason focus (functional, small/safe).
//
// When the gym / route CTA is locked ("see facility X first" / "Talk to the
// Professor first"), the city hub pulses that button once and nudges it into view
// (only when off-screen) so the player notices WHY they can't advance. It's
// presentation-only: no gate logic, no RNG, and the scroll self-limits. The pulse
// is disabled under prefers-reduced-motion.
//
// Run: node --test tests/suites/story-gate-reason-focus.test.js

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEngine } from '../helpers/load-engine.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HTML = fs.readFileSync(path.join(HERE, '..', '..', 'battle.html'), 'utf8');

let W, ST, SER;
before(async () => {
  ({ window: W } = await loadEngine());
  ST = W.__storyTest;
  SER = ST.STORY_EVENTS_RAW;
});

test('the gate-focus hook + pulse CSS exist and respect reduced motion', () => {
  assert.ok(HTML.includes("btn.querySelector('.story-action-btn.primary[disabled]')"),
    'hook targets the locked primary CTA');
  assert.ok(HTML.includes("_gated.classList.add('story-gate-pulse')"),
    'hook adds the pulse class');
  assert.ok(/prefers-reduced-motion: reduce.*matches/.test(HTML.replace(/\n/g, ' ')),
    'hook checks reduced-motion before animating');
  assert.ok(/if \(_vh && \(_r\.top < 0 \|\| _r\.bottom > _vh\)\)/.test(HTML),
    'scroll only fires when the CTA is off-screen (self-limiting)');
  assert.ok(/@keyframes storyGatePulse/.test(HTML), 'pulse keyframes defined');
  assert.ok(/@media \(prefers-reduced-motion: reduce\) \{ \.story-gate-pulse \{ animation: none/.test(HTML),
    'pulse disabled under reduced motion');
});

test('a locked CTA receives the pulse class after a city render (DOM)', () => {
  // Build a story state where the gym is gated (professor not yet used here).
  function setSm(eventIndex) {
    ST.sm = {
      active: true, badges: 3, gold: 4500, runSeed: 7,
      team: [{ name: 'Pikachu', build: { m: ['Thunderbolt'], i: null, a: null, n: 'Hardy', evs: { hp:0,atk:0,def:0,spa:0,spd:0,spe:0 } } }],
      settings: { enabledGens: [1] }, unlockedGimmicks: [], storyDifficulty: 'normal',
      eventIndex, trainerAssignments: {}, inventory: {},
      facilityIntros: {}, facilitiesSeen: {},
      profUsed: {}, npcStageSeen: {}, gymCleared: {}, rivalEncounterLog: [],
    };
  }
  const cityRows = SER.map((r, i) => ({ r, i })).filter(({ r }) => Array.isArray(r) && r[1] === 'City');
  let sawGated = false;
  for (const { i } of cityRows) {
    setSm(i);
    W.__renderCityActionsForTest(i);
    const host = W.document.getElementById('story-action-buttons');
    const gated = host.querySelector('.story-action-btn.primary[disabled]');
    if (gated) {
      sawGated = true;
      assert.ok(gated.classList.contains('story-gate-pulse'),
        `gated CTA @city row ${i} must carry the pulse class`);
      break;
    }
  }
  assert.ok(sawGated, 'at least one city produced a gated CTA to focus');
});
