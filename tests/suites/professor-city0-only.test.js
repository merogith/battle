// Professor city-0-only (2026-06): the multi-city Professor partner-gift design was
// cut. The Professor now appears ONLY in City 0 and gives just the starter; later
// cities grow the team via wild catches / tall grass.
//
// 2026-07 (Mystery Figure rework): the one remaining forced lab-style visit — the
// City-8 post-Gym-8 "legendary gate" — was removed too. The Mystery Figure no
// longer gifts a legendary or blocks Victory Road; its City-8 presence is the
// OPTIONAL first-encounter challenge (see mystery-figure-first-encounter.test.js).
//
// These tests lock that in so a future edit can't silently re-introduce a Professor
// partner in cities 1+ or a forced City-8 visit:
//   - STORY_EVENTS_RAW lists 'Professor' on the City-0 row only (among City rows).
//   - The gate helpers (shouldForceCityProfessor / isPreLeagueLegendaryMysteryGate /
//     pickStoryLegendaryFromGens) are gone from the test surface.
//
// Run: node --test tests/suites/professor-city0-only.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;

// City rows in the timeline, paired with their cityIndex (CityN -> N).
function cityRows() {
    const rows = W.STORY_EVENTS_RAW;
    assert.ok(Array.isArray(rows), 'STORY_EVENTS_RAW should be exposed on window');
    return rows
        .filter((r) => Array.isArray(r) && r[1] === 'City')
        .map((r) => {
            const m = String(r[2]).match(/City(\d+)/);
            return { city: m ? +m[1] : -1, actions: Array.isArray(r[5]) ? r[5] : [] };
        });
}

test('STORY_EVENTS_RAW: only the City-0 row offers the Professor action', () => {
    const offending = cityRows().filter((r) => r.city !== 0 && r.actions.includes('Professor'));
    assert.equal(
        offending.length,
        0,
        `no City>0 row may list 'Professor' (found: ${offending.map((r) => 'City' + r.city).join(', ')})`,
    );
});

test('STORY_EVENTS_RAW: the City-0 starter Professor is preserved', () => {
    const c0 = cityRows().filter((r) => r.city === 0);
    assert.ok(c0.length > 0, 'City0 row must exist');
    assert.ok(
        c0.every((r) => r.actions.includes('Professor')),
        "every City-0 hub row must keep the 'Professor' (starter) action",
    );
});

test('legendary-gate helpers are fully removed from the story surface', () => {
    assert.equal(ST.shouldForceCityProfessor, undefined, 'shouldForceCityProfessor removed');
    assert.equal(ST.isPreLeagueLegendaryMysteryGate, undefined, 'isPreLeagueLegendaryMysteryGate removed');
    assert.equal(ST.pickStoryLegendaryFromGens, undefined, 'pickStoryLegendaryFromGens removed');
    assert.equal(ST.preLeagueLegendaryGate, undefined, 'preLeagueLegendaryGate export removed');
    assert.equal(ST.profLegendaryMysteryMode, undefined, 'profLegendaryMysteryMode export removed');
});
