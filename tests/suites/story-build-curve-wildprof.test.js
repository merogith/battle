// Verifies wild-catch opt knobs (Phase 1e wild/prof): nature is neutral on the
// first routes (C0) then curated from C1; a hidden ability only surfaces on
// late-route catches (C6+). EVs match the trainer curve (battle-trained), IVs
// ride the separate "0..cap" vitamin band — both covered by the EV/IV suites.
// Professor gifts reuse the same (already-unit-tested) opt-gradient functions.
// Run: node --test tests/suites/story-build-curve-wildprof.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;
const baseStats = W.__rivalTest.baseStats;
const GENS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const NEUTRAL = ['Hardy', 'Docile', 'Serious', 'Bashful', 'Quirky'];

function setSm(extra = {}) {
  ST.sm = Object.assign({
    active: true, badges: 0, team: [],
    settings: { enabledGens: GENS.slice() },
    unlockedGimmicks: [], storyDifficulty: 'normal',
    eventIndex: 0, trainerAssignments: {},
  }, extra);
}
setSm();
const RAW = ST.STORY_EVENTS_RAW;
const N = RAW.length;
const cityRowFor = (c) => { for (let i = 0; i < N; i++) if (ST.cityIndexFromEventIndex(i) === c) return i; return -1; };
const isHidden = (enc) => { const b = baseStats[enc.name]; return !!(b && b.abilities && b.abilities.H && enc.build.a === b.abilities.H); };

test('wild nature phases in over C0-C2: C0 is mostly (not always) neutral', () => {
  // Build-diversity overhaul: natures phase in via a descending neutral-chance
  // ramp (C0 ~75% neutral) instead of a hard C0-always-neutral / C1-always-positive
  // cliff. Assert C0 leans heavily neutral without requiring 100%.
  setSm({ eventIndex: cityRowFor(0) });
  let neutral = 0, tot = 0;
  for (let i = 0; i < 200; i++) {
    const enc = ST.rollWildEncounter(GENS);
    if (!enc) continue;
    tot++;
    if (NEUTRAL.includes(enc.build.n)) neutral++;
  }
  assert.ok(tot > 50, 'sampled enough C0 wilds');
  assert.ok(neutral / tot >= 0.5, `C0 wild leans neutral (${neutral}/${tot})`);
  assert.ok(neutral < tot, 'C0 is not a hard 100%-neutral cliff — some curated natures phase in');
  setSm();
});

test('wild nature can be curated (non-neutral) from C1+', () => {
  setSm({ eventIndex: cityRowFor(3), badges: 3 });
  let nonNeutral = 0;
  for (let i = 0; i < 80; i++) { const enc = ST.rollWildEncounter(GENS); if (enc && !NEUTRAL.includes(enc.build.n)) nonNeutral++; }
  assert.ok(nonNeutral > 0, 'a C3 wild can carry a curated nature');
  setSm();
});

test('wild never has a hidden ability before C6', () => {
  for (const c of [0, 3, 5]) {
    setSm({ eventIndex: cityRowFor(c), badges: Math.min(8, c) });
    for (let i = 0; i < 60; i++) { const enc = ST.rollWildEncounter(GENS); if (enc) assert.ok(!isHidden(enc), `C${c} wild ${enc.name} should not be hidden`); }
  }
  setSm();
});

test('wild can roll a hidden ability at C6+', () => {
  setSm({ eventIndex: cityRowFor(7), badges: 7 });
  let hidden = 0, hCapable = 0;
  for (let i = 0; i < 240; i++) {
    const enc = ST.rollWildEncounter(GENS);
    if (!enc) continue;
    const b = baseStats[enc.name];
    if (b && b.abilities && b.abilities.H) hCapable++;
    if (isHidden(enc)) hidden++;
  }
  // Only assert the positive if the route surfaced hidden-capable species at all.
  if (hCapable > 5) assert.ok(hidden > 0, `C7 wild rolled hidden ${hidden}/${hCapable} hidden-capable`);
  setSm();
});
