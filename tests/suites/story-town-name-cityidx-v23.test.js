// City → themed-town name resolution (ISSUE-132): GYM_CITY_LEADER_EVENT stores
// the ARRAY INDEX of a gym-leader row, but sm.trainerAssignments is keyed by
// ROW-ID (row[0]). For City 3 alone the out-of-order Rival rows shift the
// alignment (Gym Leader 3 sits at array index 17 / row-id 18), so the old
// resolver read trainerAssignments[17] (the wrong row) and fell back to the
// generic "City 3". getStoryDisplayTownNameForCityRow now converts index → row-id.
//
// Run: node --test tests/suites/story-town-name-cityidx-v23.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const h = await loadEngine();
const { window } = h;
const T = window.__storyTest;
const sm = window.StoryMode.state;
const RAW = window.STORY_EVENTS_RAW;

// Reconstruct GYM_CITY_LEADER_EVENT[gym] = array index of that "Gym Leader N" row.
function arrIdxOfGymLeader(n) {
    for (let i = 0; i < RAW.length; i++) {
        if (RAW[i] && RAW[i][1] === 'Battle' && String(RAW[i][2]) === 'Gym Leader ' + n) return i;
    }
    return -1;
}
const cityRow = (n) => [9000 + n, 'City', 'City' + n];

test('precondition: City 3 is exactly where array-index and row-id diverge', () => {
    const ai = arrIdxOfGymLeader(3);
    assert.ok(ai >= 0, 'found the Gym Leader 3 row');
    assert.notEqual(RAW[ai][0], ai, 'row-id differs from array index at City 3 (the bug trigger)');
});

test('City 3 resolves via ROW-ID, not array index', () => {
    const ai = arrIdxOfGymLeader(3);        // 17 in the shipped timeline
    const rowId = RAW[ai][0];               // 18
    // Seed the CORRECT key (row-id) with one leader and the WRONG key (array
    // index) with a different leader, so the two paths give different towns.
    sm.trainerAssignments = { [rowId]: 'Brock', [ai]: 'Falkner' };
    const town = T.displayTownNameForCityRow(cityRow(3));
    assert.equal(town, 'Pewter City', 'used row-id 18 (Brock→Pewter), not array-index 17 (Falkner→Violet)');
    assert.notEqual(town, 'City 3', 'no longer falls back to the generic label');
});

test('non-diverging cities still resolve (row-id == array index)', () => {
    const ai = arrIdxOfGymLeader(1);        // 5, row-id 5
    const rowId = RAW[ai][0];
    assert.equal(rowId, ai, 'City 1 does not diverge');
    sm.trainerAssignments = { [rowId]: 'Brock' };
    assert.equal(T.displayTownNameForCityRow(cityRow(1)), 'Pewter City');
});

test('unassigned leader falls back to the generic city label', () => {
    sm.trainerAssignments = {};
    assert.equal(T.displayTownNameForCityRow(cityRow(3)), 'City 3');
});

test('non-city rows and Pallet/League pass through unchanged', () => {
    assert.equal(T.displayTownNameForCityRow(cityRow(0)), 'Pallet Town');
    assert.equal(T.displayTownNameForCityRow(cityRow(9)), 'Pokémon League');
    assert.equal(T.displayTownNameForCityRow(null), 'Town');
});
