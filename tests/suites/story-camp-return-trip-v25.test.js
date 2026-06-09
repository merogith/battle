// Camp return-to-previous-city round-trip (Camp System — CAMP_FLOW §5, D7 = free).
// From camp the player can "🏙 Head back to {town}": eventIndex jumps back to the most
// recent city (already arrived → no first-arrival cinematics), sm.campReturnPoint stashes
// where they were, and "↩ Back to the road" (→ proceedToNextBattle) restores the point and
// re-fires the camp. These lock that round-trip's state machine.
//
// Run: node --test tests/suites/story-camp-return-trip-v25.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;
const doc = W.document;
const RAW = W.STORY_EVENTS_RAW;

function clearOverlays() {
    ['story-camp-scene', 'camp-microgame'].forEach(id => { const e = doc.getElementById(id); if (e) e.remove(); });
    doc.querySelectorAll('[aria-label="On the route — tall grass"]').forEach(e => e.remove());
}
function baseSm() {
    const sm = W.StoryMode.state;
    clearOverlays();
    sm.active = true;
    sm.runSeed = 0xBADA55;
    sm._strngState = null;
    sm.team = [{ name: 'Pikachu', build: { n: 'Hardy' } }];
    sm.campByEventIdx = {};
    sm.wanderByEventIdx = {};
    sm.campReturnPoint = null;
    // These scenarios sit at mid-game route seams (idx 6/8), long past route 0
    // where the scripted catch tutorial fired. Mark it done so the route-0 camp
    // deferral (_campDeferForPendingWildChain, which holds camp while the catch
    // tutorial is still pending) stays inactive here — matching real mid-route
    // state, where camp re-fires normally on the return-trip.
    sm.catchTutorialDone = true;
    return sm;
}

test('campBackCityIndex resolves the most recent city before a camp', () => {
    // idx8 (Basic Trainer) sits past idx6 = City1 (post-gym).
    assert.equal(RAW[6][1], 'City');
    assert.equal(ST.campBackCityIndex({ destIdx: 8 }), 6);
    // at the very start there is no prior city to head back to.
    assert.equal(ST.campBackCityIndex({ destIdx: 0 }), -1);
});

test('campHeadBack stashes the return point and rewinds eventIndex to the city', () => {
    const sm = baseSm();
    sm.eventIndex = 8;
    // enterCity() does a heavy render; we only assert the state campHeadBack sets first.
    try { ST.campHeadBack({ destIdx: 8, resume: () => {} }); } catch (e) {}
    assert.equal(sm.eventIndex, 6, 'rewound to the prior city row');
    assert.ok(sm.campReturnPoint && sm.campReturnPoint.eventIndex === 8, 'return point stashed');
});

test('proceedToNextBattle while a return point is set restores it and re-fires camp', () => {
    const sm = baseSm();
    sm.eventIndex = 6;                              // "at the town"
    sm.campReturnPoint = { eventIndex: 8 };         // came from the camp at idx8

    ST.proceedToNextBattle();                       // ↩ Back to the road

    assert.equal(sm.eventIndex, 8, 'eventIndex restored to where we left');
    assert.equal(sm.campReturnPoint, null, 'return point cleared');
    // camp at idx8 wasn't broken (gate unstamped) → it re-fires, dropping us back at the fire.
    assert.ok(doc.getElementById('story-camp-scene'), 'camp re-opened on return');
});

test('the camp menu offers "Head back to {town}" mid-route, but not at the very start', () => {
    const sm = baseSm();
    sm.eventIndex = 8;
    ST.enterCamp(8, () => {});
    const ov = doc.getElementById('story-camp-scene');
    const labels = ov ? Array.from(ov.querySelectorAll('[data-scene-opt]')).map(b => b.textContent) : [];
    assert.ok(labels.some(t => /Head back to/.test(t)), 'head-back option present mid-route');
});
