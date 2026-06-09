// Route-0 camp ordering — the scripted catch tutorial must land BEFORE camp.
//
// Bug: on route 0 the only camp seam is the Rival→Basic-Trainer transition
// (STORY_EVENTS_RAW [1]=Rival(68) → [2]=Basic Trainer(1) → [3]=City1). The camp
// gate sits at the TOP of enterBattleEvent, ABOVE the interrupt dispatch that
// fires the catch tutorial ("Catching 101") + the route wilds — so camp fired
// first, pre-empting the player's very first wild-catch lesson (and the camp's
// own grass-search handed them a redundant "The Road" lesson before the tutorial
// ever ran). The fix holds camp via _campDeferForPendingWildChain while the
// pre-battle wild chain is still queued, yielding the intended cadence:
//   catch tutorial → wild #2 → camp → trainer.
// Non-route-0 camp seams are battle→battle with no pending wild (route wilds only
// attach to a city→battle first-of-route, a non-camp seam), so camp is unchanged.
//
// Run: node --test tests/suites/story-route0-camp-ordering.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const h = await loadEngine();
const { window } = h;
const T = window.__storyTest;

const RT0_TUTORIAL_BATTLE = 2; // STORY_EVENTS_RAW index of the post-intro-rival Basic Trainer
const NORMAL_CAMP_SEAM = 8;    // [7]=Basic Trainer → [8]=Basic Trainer: a route→route camp seam, no wilds

function baseState(over) {
    return Object.assign({
        active: true,
        eventIndex: RT0_TUTORIAL_BATTLE,
        catchTutorialDone: false,
        team: [{ name: 'Bulbasaur' }], // 1 mon < cap (2 + 0 badges) → tutorial has party room
        badges: 0,
        wildSeenByEventIdx: {},
        roamingLegendary: null,
        currentEnemyLock: null,
    }, over || {});
}

test('route 0: camp is deferred while the catch tutorial is still pending', () => {
    T.sm = baseState();
    assert.equal(T.campDeferForPendingWildChain(RT0_TUTORIAL_BATTLE), true,
        'camp must hold so the first catch lesson lands before the campfire');
});

test('route 0: camp stays deferred after the tutorial, while wild #2 is pending', () => {
    // Catch tutorial delivered (catchTutorialDone), but its route-wild slot (#2) is open.
    T.sm = baseState({ catchTutorialDone: true, wildSeenByEventIdx: { [RT0_TUTORIAL_BATTLE]: 1 } });
    assert.equal(T.campDeferForPendingWildChain(RT0_TUTORIAL_BATTLE), true,
        'both route wilds must fire before camp — cadence is tutorial → wild #2 → camp');
});

test('route 0: camp fires once the full wild chain (tutorial + both wilds) is spent', () => {
    T.sm = baseState({ catchTutorialDone: true, wildSeenByEventIdx: { [RT0_TUTORIAL_BATTLE]: 2 } });
    assert.equal(T.campDeferForPendingWildChain(RT0_TUTORIAL_BATTLE), false,
        'with the wild chain exhausted, camp interposes between the wilds and the trainer');
});

test('non-route-0 camp seam (battle→battle, no pending wild) is never deferred', () => {
    T.sm = baseState({ eventIndex: NORMAL_CAMP_SEAM, catchTutorialDone: true, wildSeenByEventIdx: {} });
    assert.equal(T.campDeferForPendingWildChain(NORMAL_CAMP_SEAM), false,
        'later routes keep their camp cadence unchanged — no pending wild at the seam');
});
