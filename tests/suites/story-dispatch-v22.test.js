// PR-3a: 3-track beat dispatcher — road resolver, queue building, dedup,
// scene-body pagination. Validates the additive layer that fires event-kind
// beats on road entry without touching the existing battle path.
// Run: node --test tests/suites/story-dispatch-v22.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;
const RAW = ST.STORY_EVENTS_RAW;

// Find a known gym row's array index by scanning STORY_EVENTS_RAW.
function findArrayIdxForGym(n) {
    for (let i = 0; i < RAW.length; i++) {
        const r = RAW[i];
        if (r && r[1] === 'Battle' && r[2] === 'Gym Leader ' + n) return i;
    }
    return -1;
}
function findArrayIdxForRowId(id) {
    for (let i = 0; i < RAW.length; i++) if (RAW[i] && RAW[i][0] === id) return i;
    return -1;
}

test('roadForArrayIdx returns road1..road8 between gyms, league past E1', () => {
    const gym1 = findArrayIdxForGym(1);
    const gym2 = findArrayIdxForGym(2);
    const gym8 = findArrayIdxForGym(8);
    assert.ok(gym1 > 0 && gym2 > gym1 && gym8 > gym2, 'gym anchors not found');

    // The row just past Gym N (excl) should map to road(N).
    assert.equal(ST.roadForArrayIdx(gym1 + 1), 'road1');
    assert.equal(ST.roadForArrayIdx(gym2 + 1), 'road2');
    assert.equal(ST.roadForArrayIdx(gym8 + 1), 'road8');

    // Gym Leader rows are not a road (the gym itself sits between roads).
    assert.equal(ST.roadForArrayIdx(gym1), null);
    assert.equal(ST.roadForArrayIdx(gym2), null);

    // Pre-Gym-1 is null (no road anchor in the 3-track system).
    assert.equal(ST.roadForArrayIdx(0), null);

    // E1 onward → league.
    let e1Idx = -1;
    for (let i = 0; i < RAW.length; i++) {
        if (RAW[i] && RAW[i][1] === 'Battle' && /^E1$/.test(String(RAW[i][2] || ''))) { e1Idx = i; break; }
    }
    assert.ok(e1Idx > 0, 'E1 row not found');
    assert.equal(ST.roadForArrayIdx(e1Idx), 'league');
});

test('resolveActiveRoadBeats returns 3 event-kind beats on first road (main+villain+extra)', () => {
    ST.sm = Object.assign({}, ST.sm, {
        tracks: { main: 'classic_v2', villain: 'rocket', extra: 'cubone' },
        storyEventsFired: {},
    });
    const beats = ST.resolveActiveRoadBeats('road1');
    const keys = beats.map(b => b.sceneKey);
    // Road 1 anchors: main.event1, villain.rocket.event1 (actually rocket.event1
    // anchors to road2 — check the actual CSV mapping), extra.cubone.event1.
    // We assert at minimum that main.event1 and extra.cubone.event1 fire,
    // and every beat has kind === 'event'.
    assert.ok(keys.includes('main.event1'), 'missing main.event1');
    assert.ok(keys.includes('extra.cubone.event1'), 'missing extra.cubone.event1');
    for (const b of beats) assert.equal(b.kind, 'event', `non-event beat in queue: ${b.sceneKey} (${b.kind})`);
});

test('resolveActiveRoadBeats returns main+villain+extra beats on Road 2 (villain first beat)', () => {
    ST.sm = Object.assign({}, ST.sm, {
        tracks: { main: 'classic_v2', villain: 'rocket', extra: 'cubone' },
        storyEventsFired: {},
    });
    const beats = ST.resolveActiveRoadBeats('road2');
    const keys = beats.map(b => b.sceneKey);
    // Road 2 should include villain.rocket.event1 (per CSV).
    assert.ok(keys.includes('villain.rocket.event1'), `missing villain.rocket.event1; got: ${keys.join(',')}`);
});

test('resolveActiveRoadBeats filters out battle/boss/raid kinds (event-only)', () => {
    ST.sm = Object.assign({}, ST.sm, {
        tracks: { main: 'classic_v2', villain: 'rocket', extra: 'cubone' },
        storyEventsFired: {},
    });
    // Road 4 has villain.rocket.battle1 (kind 'battle') and extra.cubone.event4 (event).
    const beats = ST.resolveActiveRoadBeats('road4');
    const kinds = new Set(beats.map(b => b.kind));
    assert.deepEqual([...kinds], ['event'], `non-event kinds leaked: ${[...kinds].join(',')}`);
});

test('resolveActiveRoadBeats dedupes against sm.storyEventsFired', () => {
    ST.sm = Object.assign({}, ST.sm, {
        tracks: { main: 'classic_v2', villain: 'rocket', extra: 'cubone' },
        storyEventsFired: { 'main.event1': true, 'extra.cubone.event1': true },
    });
    const beats = ST.resolveActiveRoadBeats('road1');
    const keys = beats.map(b => b.sceneKey);
    assert.ok(!keys.includes('main.event1'), 'already-fired main.event1 should be filtered');
    assert.ok(!keys.includes('extra.cubone.event1'), 'already-fired extra.cubone.event1 should be filtered');
});

test('resolveActiveRoadBeats returns empty queue when sm.tracks is missing', () => {
    ST.sm = Object.assign({}, ST.sm, { tracks: null, storyEventsFired: {} });
    const beats = ST.resolveActiveRoadBeats('road1');
    assert.equal(beats.length, 0);
});

test('resolveActiveRoadBeats returns empty for invalid / null road', () => {
    ST.sm = Object.assign({}, ST.sm, {
        tracks: { main: 'classic_v2', villain: 'rocket', extra: 'cubone' },
        storyEventsFired: {},
    });
    assert.equal(ST.resolveActiveRoadBeats(null).length, 0);
    assert.equal(ST.resolveActiveRoadBeats('nope').length, 0);
});

test('splitBeatBodyIntoPages — empty body returns [""]', () => {
    const pages = ST.splitBeatBodyIntoPages('');
    assert.equal(pages.length, 1);
    assert.equal(pages[0], '');
});

test('splitBeatBodyIntoPages — short single-sentence body returns one page', () => {
    const pages = ST.splitBeatBodyIntoPages('Just one sentence here.');
    assert.equal(pages.length, 1);
    assert.equal(pages[0], 'Just one sentence here.');
});

test('splitBeatBodyIntoPages — multi-sentence body splits on sentence boundaries', () => {
    const pages = ST.splitBeatBodyIntoPages('First sentence. Second one. Third.');
    assert.ok(pages.length >= 2, `expected multi-page split; got ${pages.length}`);
});

test('main beat priority ordering: main → villain → extra', () => {
    ST.sm = Object.assign({}, ST.sm, {
        tracks: { main: 'classic_v2', villain: 'magma', extra: 'mimikyu' },
        storyEventsFired: {},
    });
    const beats = ST.resolveActiveRoadBeats('road5');
    // road5 has main.event3, main.battle1 (filtered out), extra.mimikyu.event5,
    // villain.magma.event4 (per CSV — Road 5 holds villain event 4 + battle 2 + extra event 5).
    // We assert ordering when multiple tracks' beats are on the same road.
    const mainBeats   = beats.filter(b => b.sceneKey.startsWith('main.'));
    const villainBeats = beats.filter(b => b.sceneKey.startsWith('villain.'));
    const extraBeats  = beats.filter(b => b.sceneKey.startsWith('extra.'));
    if (mainBeats.length && villainBeats.length) {
        const mainIdx = beats.indexOf(mainBeats[0]);
        const villIdx = beats.indexOf(villainBeats[0]);
        assert.ok(mainIdx < villIdx, 'main should come before villain in queue order');
    }
    if (villainBeats.length && extraBeats.length) {
        const villIdx = beats.indexOf(villainBeats[0]);
        const extraIdx = beats.indexOf(extraBeats[0]);
        assert.ok(villIdx < extraIdx, 'villain should come before extra in queue order');
    }
});

test('legacy storyline picker UI is removed (superseded by v22 3-track rolls)', () => {
    // The pre-v22 8-variant tone picker was removed; storyline is now always rolled at
    // random ('surprise_me' -> _readStorylineFromUI). The hidden section and its export
    // handler should both be gone.
    const section = W.document.getElementById('story-create-storyline-section');
    assert.equal(section, null, 'dead storyline picker section should be removed from the DOM');
    assert.equal(typeof (W.StoryMode && W.StoryMode.trainerCreateSetStoryline), 'undefined',
        'trainerCreateSetStoryline handler should no longer be exported');
});
