// G2 — road-beat pacing. The road's main/villain/extra event-beats used to dump
// back-to-back (3-4 overlays) onto the road's first battle row. _tryFireRoadStoryBeats
// now fires ONE beat per row and continues straight to the battle via
// _dispatchCurrentRow, so setups spread across the road's battle rows.
//
// These tests mirror that paced firing over the REAL resolver (resolveActiveRoadBeats)
// and lock the two invariants the fix relies on:
//   1. at most one setup beat fires per row (the clump is gone), and
//   2. every beat still fires — nothing strands (capacity holds: every road has
//      more non-City rows than active event-beats, across all 80 villain×extra rolls).
//
// Run: node --test tests/suites/story-flow-pacing-g2.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const ST = eng.window.__storyTest;
const RAW = ST.STORY_EVENTS_RAW;

// Dump-ALL reference: every event-beat that would ever be eligible for the roll
// (the pre-G2 behavior — each row drains its whole road queue at once).
function dumpAllSet(villain, extra) {
    ST.sm = Object.assign({}, ST.sm, { tracks: { main: 'classic', villain, extra }, storyEventsFired: {} });
    const fired = new Set();
    for (let i = 0; i < RAW.length; i++) {
        ST.sm.eventIndex = i;
        if (RAW[i][1] === 'City') continue;
        const road = ST.roadForArrayIdx(i);
        if (!road) continue;
        for (const b of ST.resolveActiveRoadBeats(road)) {
            fired.add(b.sceneKey);
            ST.sm.storyEventsFired[b.sceneKey] = true;
        }
    }
    return fired;
}

// PACED: fire at most ONE beat per non-City row (mirrors the new _tryFireRoadStoryBeats —
// queue[0] fires, is marked, then the row's battle runs and the eventIndex advances).
function pacedTrace(villain, extra) {
    ST.sm = Object.assign({}, ST.sm, { tracks: { main: 'classic', villain, extra }, storyEventsFired: {} });
    const perRow = [];   // { arrIdx, sceneKey }
    for (let i = 0; i < RAW.length; i++) {
        ST.sm.eventIndex = i;
        if (RAW[i][1] === 'City') continue;
        const road = ST.roadForArrayIdx(i);
        if (!road) continue;
        const queue = ST.resolveActiveRoadBeats(road);
        if (!queue.length) continue;
        const beat = queue[0];
        perRow.push({ arrIdx: i, sceneKey: beat.sceneKey });
        ST.sm.storyEventsFired[beat.sceneKey] = true;
    }
    return perRow;
}

const rolls = [
    ['rocket', 'cubone'], ['galactic', 'mewtwo'], ['aqua', 'hypno'],
    ['plasma', 'phantump'], ['flare', 'mimikyu'], ['star', 'parasect'],
    ['macroCosmos', 'drifloon'], ['skull', 'yamask'],
];

test('G2: at most one setup beat fires per row (the clump is gone)', () => {
    for (const [v, e] of rolls) {
        const counts = {};
        for (const { arrIdx } of pacedTrace(v, e)) counts[arrIdx] = (counts[arrIdx] || 0) + 1;
        for (const [arrIdx, n] of Object.entries(counts)) {
            assert.equal(n, 1, `${v}+${e}: row ${arrIdx} fires ${n} beats (must be 1)`);
        }
    }
});

test('G2: no beat is stranded — paced firing covers the exact same set as dump-all', () => {
    for (const [v, e] of rolls) {
        const all = [...dumpAllSet(v, e)].sort();
        const paced = [...new Set(pacedTrace(v, e).map(x => x.sceneKey))].sort();
        assert.deepEqual(paced, all, `${v}+${e}: paced firing must cover every event-beat, none stranded`);
    }
});

test('G2: each beat fires exactly once across the run', () => {
    for (const [v, e] of rolls) {
        const seen = pacedTrace(v, e).map(x => x.sceneKey);
        assert.equal(seen.length, new Set(seen).size, `${v}+${e}: a beat fired more than once`);
    }
});

test('G2: the known rocket+cubone 3-beat clump rows (19/33/48) no longer clump', () => {
    const byRow = {};
    for (const { arrIdx, sceneKey } of pacedTrace('rocket', 'cubone')) {
        (byRow[arrIdx] = byRow[arrIdx] || []).push(sceneKey);
    }
    for (const clumpRow of [19, 33, 48]) {
        const n = (byRow[clumpRow] || []).length;
        assert.ok(n <= 1, `row ${clumpRow} should no longer clump (fires ${n})`);
    }
});
