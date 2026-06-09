// Camp buffer — the between-events beat (Camp System PR C).
// See docs/story-design/camp/CAMP_FLOW.md (§2 route rhythm, §3 interpose seam, §10 tests).
//
// Camp lives in the FLOW (gated by sm.campByEventIdx), never as a STORY_EVENTS_RAW
// row — inserting rows would re-point every save's eventIndex → corruption. These
// lock: (1) the no-renumber guard, (2) the route-transition predicate (route↔route
// only; never gym-internal / iconic / city↔battle / crucible), (3) the once-per-
// transition gate, (4) enterCamp's mount + Break-camp resume.
//
// Run: node --test tests/suites/camp-flow-buffer-v25.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;
const RAW = W.STORY_EVENTS_RAW;

test('no-renumber guard: STORY_EVENTS_RAW shape is unchanged (camp adds NO rows)', () => {
    assert.equal(RAW.length, 67, 'event-table length — camp must live in the flow, not the table');
    assert.equal(RAW[0][1], 'City', 'row 0 is the start city');
    assert.equal(RAW[1][2], 'Rival', 'row 1 is the intro rival');
    assert.equal(RAW[65][1], 'Hall of Fame', 'HoF row');
    assert.equal(RAW[66][2], 'Mystery Figure', 'post-HoF climax row');
});

test('predicate: fires between two ordinary route battles', () => {
    assert.equal(RAW[7][2], 'Basic Trainer');
    assert.equal(RAW[8][2], 'Basic Trainer');
    assert.equal(ST.campIsDueForTransition(8), true, 'camp before idx8 (route → route)');
});

test('predicate: NOT the first battle after a city (city send-off)', () => {
    assert.equal(RAW[6][1], 'City');
    assert.equal(RAW[7][1], 'Battle');
    assert.equal(ST.campIsDueForTransition(7), false, 'no camp when prev row is a City');
});

test('predicate: NOT inside a gym (gym trainer → gym leader)', () => {
    assert.equal(RAW[4][2], 'Gym Trainer 1');
    assert.equal(RAW[5][2], 'Gym Leader 1');
    assert.equal(ST.campIsDueForTransition(5), false, 'both rows are iconic gym battles');
});

test('predicate: NOT before a City row (arriving at town, not camping)', () => {
    assert.equal(RAW[9][1], 'City');
    assert.equal(ST.campIsDueForTransition(9), false);
});

test('predicate: NOT before/after an iconic fight (rival, champion, E4)', () => {
    // idx1 = intro Rival (iconic) → no camp into the basic trainer that follows it.
    assert.equal(RAW[1][2], 'Rival');
    assert.equal(RAW[2][2], 'Basic Trainer');
    assert.equal(ST.campIsDueForTransition(2), false, 'prev is an iconic Rival');
    // Champion is iconic (idx63; prev idx62 is E4, also iconic).
    assert.equal(RAW[63][2], 'Champion');
    assert.equal(ST.campIsDueForTransition(63), false);
});

test('predicate: suppressed during an off-timeline Crucible battle', () => {
    const sm = W.StoryMode.state;
    const prev = sm.crucibleBattleSource;
    sm.crucibleBattleSource = 'postHofMystery';
    assert.equal(ST.campIsDueForTransition(8), false, 'crucible-sourced → never camp');
    sm.crucibleBattleSource = prev || null;
});

test('gate: campMarkDone / campDone round-trip, once-per-transition', () => {
    const sm = W.StoryMode.state;
    sm.campByEventIdx = {};
    assert.equal(ST.campDone(8), false);
    ST.campMarkDone(8);
    assert.equal(ST.campDone(8), true);
    assert.equal(sm.campByEventIdx['8'].done, true);
    assert.equal(typeof sm.campByEventIdx['8'].ts, 'number', 'timestamp stamped');
});

test('enterCamp: mounts the camp menu; Break camp resumes, stamps the gate, removes overlay', () => {
    const sm = W.StoryMode.state;
    sm.campByEventIdx = {};
    sm.team = [{ name: 'Pikachu', build: {} }];
    let resumed = 0;
    ST.enterCamp(8, () => { resumed++; });

    const ov = W.document.getElementById('story-camp-scene');
    assert.ok(ov, 'camp menu mounted');
    const breakBtn = Array.from(ov.querySelectorAll('[data-scene-opt]')).find(b => /Break camp/.test(b.textContent));
    assert.ok(breakBtn, 'Break camp option rendered');

    breakBtn.onclick();
    assert.equal(resumed, 1, 'resume() invoked exactly once');
    assert.equal(ST.campDone(8), true, 'gate stamped on break');
    assert.equal(W.document.getElementById('story-camp-scene'), null, 'overlay removed');
});

test('enterCamp: a second break of the same transition does not re-fire (gate holds)', () => {
    const sm = W.StoryMode.state;
    sm.campByEventIdx = {};
    sm.team = [{ name: 'Pikachu', build: {} }];
    ST.campMarkDone(8);
    // The seam checks `due && !done`; with the gate set the camp would be skipped.
    assert.equal(ST.campDone(8), true);
    assert.equal(ST.campIsDueForTransition(8) && !ST.campDone(8), false, 'seam predicate is false once done');
});
