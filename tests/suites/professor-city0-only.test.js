// Professor city-0-only (2026-06): the multi-city Professor partner-gift design was
// cut. The Professor now appears ONLY in City 0 and gives just the starter; later
// cities grow the team via wild catches / tall grass. The one remaining forced
// lab-style visit is the City-8 post-Gym-8 Mystery Figure legendary gate.
//
// These tests lock that in so a future edit can't silently re-introduce a Professor
// partner in cities 1+:
//   - STORY_EVENTS_RAW lists 'Professor' on the City-0 row only (among City rows).
//   - shouldForceCityProfessor forces a visit ONLY for the City-8 legendary gate.
//   - isPreLeagueLegendaryMysteryGate stays scoped to City 8 at 8 badges.
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

test('shouldForceCityProfessor: never forces a Professor in cities 1-7 or 9', () => {
    for (const c of [1, 2, 3, 4, 5, 6, 7, 9]) {
        assert.equal(
            ST.shouldForceCityProfessor(c, []),
            false,
            `City ${c} must not force a Professor visit`,
        );
    }
});

test('shouldForceCityProfessor: City-8 only forces a visit once 8 badges are earned', () => {
    const prevBadges = ST.sm.badges;
    try {
        ST.sm.badges = 0;
        assert.equal(ST.shouldForceCityProfessor(8, []), false, 'pre-8-badges City 8 forces nothing');
        ST.sm.badges = 8;
        assert.equal(ST.shouldForceCityProfessor(8, []), true, 'post-Gym-8 City 8 forces the Mystery Figure gate');
    } finally {
        ST.sm.badges = prevBadges;
    }
});

test('isPreLeagueLegendaryMysteryGate: scoped to City 8 at 8 badges', () => {
    const prevBadges = ST.sm.badges;
    try {
        ST.sm.badges = 8;
        assert.equal(ST.isPreLeagueLegendaryMysteryGate(8), true, 'City 8 @ 8 badges is the gate');
        for (const c of [0, 1, 5, 7, 9]) {
            assert.equal(ST.isPreLeagueLegendaryMysteryGate(c), false, `City ${c} is not the legendary gate`);
        }
        ST.sm.badges = 7;
        assert.equal(ST.isPreLeagueLegendaryMysteryGate(8), false, 'City 8 @ <8 badges is not yet the gate');
    } finally {
        ST.sm.badges = prevBadges;
    }
});
