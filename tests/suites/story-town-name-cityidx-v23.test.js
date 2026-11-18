// Town names are tied to the journey. Gym visitors still use the trainer
// assignment's row ID, which differs from the array index at Gym 3.
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

test('City 3 visitor resolves via row ID while the town keeps its name', () => {
    const ai = arrIdxOfGymLeader(3);        // 17 in the shipped timeline
    const rowId = RAW[ai][0];               // 18
    // Seed the CORRECT key (row-id) with one leader and the WRONG key (array
    // index) with a different leader, so the two paths give different towns.
    sm.trainerAssignments = { [rowId]: 'Brock', [ai]: 'Falkner' };
    const visitor = T.gymVisitor(3, sm);
    assert.equal(visitor.name, 'Brock');
    assert.equal(visitor.homeTown, 'Pewter City');
    assert.equal(T.displayTownNameForCityRow(cityRow(3)), 'Lindenbell Town');
});

test('non-diverging cities still resolve (row-id == array index)', () => {
    const ai = arrIdxOfGymLeader(1);        // 5, row-id 5
    const rowId = RAW[ai][0];
    assert.equal(rowId, ai, 'City 1 does not diverge');
    sm.trainerAssignments = { [rowId]: 'Brock' };
    assert.equal(T.gymVisitor(1, sm).homeTown, 'Pewter City');
    assert.equal(T.displayTownNameForCityRow(cityRow(1)), 'Flintreach Town');
});

test('unassigned leader leaves the visitor empty and keeps the town label', () => {
    sm.trainerAssignments = {};
    assert.equal(T.gymVisitor(3, sm), null);
    assert.equal(T.displayTownNameForCityRow(cityRow(3)), 'Lindenbell Town');
});

test('non-city rows and Pallet/League pass through unchanged', () => {
    assert.equal(T.displayTownNameForCityRow(cityRow(0)), 'Pallet Town');
    assert.equal(T.displayTownNameForCityRow(cityRow(9)), 'Pokémon League');
    assert.equal(T.displayTownNameForCityRow(null), 'Town');
});
