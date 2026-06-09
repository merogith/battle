// Camp "🌿 Search the tall grass" — reuse the Wander engine at camp.
// See docs/story-design/camp/CAMP_FLOW.md §4. This is a thin reuse: the camp menu
// surfaces the existing free 3-tap Wander search (tests/suites/story-wander-around.test.js
// covers the search/catch loop itself). These lock the camp-side wiring:
//   (a) the menu renders the grass option, (b) the key namespacing (100000+destIdx),
//   (c) picking it mounts the Wander overlay for the current city, (d) the option is
//   omitted once this camp's search is exhausted, (e) "Move On" returns to the camp menu.
//
// Run: node --test tests/suites/story-camp-grass.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;
const doc = W.document;

function setupRouteCamp() {
    // jsdom's DOM persists across tests — clear any overlay a prior test left behind so
    // querySelector can't latch onto a stale wander/camp overlay (with an orphaned state ref).
    ['story-camp-scene', 'camp-microgame'].forEach(id => { const e = doc.getElementById(id); if (e) e.remove(); });
    doc.querySelectorAll('[aria-label="On the route — tall grass"]').forEach(e => e.remove());
    const sm = W.StoryMode.state;
    sm.active = true;
    sm.runSeed = 0xC0FFEE;          // seeded RNG so the wander rolls don't warn / are deterministic
    sm._strngState = null;
    sm.eventIndex = 8;              // a route battle index (Basic Trainer past City 1)
    sm.team = [{ name: 'Pikachu', build: { n: 'Hardy' } }];
    sm.wanderByEventIdx = {};
    return sm;
}
function campSceneButtons() {
    const ov = doc.getElementById('story-camp-scene');
    return ov ? Array.from(ov.querySelectorAll('[data-scene-opt]')) : [];
}
function grassOption() {
    return campSceneButtons().find(b => /Search the tall grass/.test(b.textContent));
}

test('campGrassKey namespaces into a high numeric range (no route-exit collision)', () => {
    assert.equal(ST.campGrassKey({ destIdx: 8 }), 100008);
    assert.equal(ST.campGrassKey({ destIdx: 57 }), 100057);
    assert.equal(ST.campGrassKey({}), 100000);
    // route-exit Wander keys are bounded by the event table (~67); camp keys are far above it.
    assert.ok(ST.campGrassKey({ destIdx: 66 }) > W.STORY_EVENTS_RAW.length);
});

test('camp menu renders the "Search the tall grass" option on a route', () => {
    setupRouteCamp();
    ST.enterCamp(8, () => {});
    assert.ok(doc.getElementById('story-camp-scene'), 'camp menu mounted');
    assert.ok(grassOption(), 'grass option present');
});

test('the grass option is omitted once this camp\'s search is exhausted', () => {
    const sm = setupRouteCamp();
    sm.wanderByEventIdx[ST.campGrassKey({ destIdx: 8 })] = { taps: 3, hits: 0, done: true };
    ST.enterCamp(8, () => {});
    assert.ok(doc.getElementById('story-camp-scene'), 'camp menu mounted');
    assert.equal(grassOption(), undefined, 'exhausted camp hides the grass option');
});

test('rendering the menu does NOT init a wander entry (no save pollution)', () => {
    const sm = setupRouteCamp();
    ST.enterCamp(8, () => {});
    assert.equal(sm.wanderByEventIdx[ST.campGrassKey({ destIdx: 8 })], undefined,
        'menu render must not create a wanderByEventIdx entry');
});

test('campSearchGrass removes the camp overlay and mounts the Wander search', () => {
    setupRouteCamp();
    ST.enterCamp(8, () => {});
    assert.ok(doc.getElementById('story-camp-scene'), 'camp menu up first');
    ST.campSearchGrass({ destIdx: 8, resume: () => {} });
    assert.equal(doc.getElementById('story-camp-scene'), null, 'camp overlay removed');
    assert.ok(doc.querySelector('[data-wander-search="1"]'), 'Wander search button mounted');
    assert.ok(doc.querySelector('[data-wander-moveon="1"]'), 'Wander Move On button mounted');
});

test('"Move On" from the camp grass search returns to the camp menu + stamps done', async () => {
    const sm = setupRouteCamp();
    const ctx = { destIdx: 8, resume: () => {} };
    ST.campSearchGrass(ctx);
    const moveOn = doc.querySelector('[data-wander-moveon="1"]');
    assert.ok(moveOn, 'Move On button present');
    moveOn.onclick({ stopPropagation() {} });
    await new Promise(r => setTimeout(r, 0));   // onDone is deferred (setTimeout) so finish() clears first
    assert.ok(doc.getElementById('story-camp-scene'), 'camp menu re-opened after Move On');
    assert.equal(sm.wanderByEventIdx[ST.campGrassKey(ctx)].done, true, 'camp grass marked done');
    // and now the option is gone (exhausted)
    assert.equal(grassOption(), undefined, 'grass option omitted after Move On');
});
