// Deterministic coverage for the story party reorder math (drag + Set-as-lead).
// partyReorder is PURE — it returns a new array and never mutates the input.
// The drag handler and setPartyLead both route through it, so this is the
// regression net for "moving a mon changes lead order correctly".
//
// Run: node --test tests/suites/story-party-reorder.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const reorder = eng.window.StoryMode.partyReorder;

test('partyReorder export exists', () => {
    assert.equal(typeof reorder, 'function');
});

test('move forward: index 0 → 2', () => {
    assert.deepEqual(reorder(['A', 'B', 'C', 'D'], 0, 2), ['B', 'C', 'A', 'D']);
});

test('move backward / set-as-lead: index 3 → 0', () => {
    assert.deepEqual(reorder(['A', 'B', 'C', 'D'], 3, 0), ['D', 'A', 'B', 'C']);
});

test('adjacent swap by move: index 1 → 2', () => {
    assert.deepEqual(reorder(['A', 'B', 'C'], 1, 2), ['A', 'C', 'B']);
});

test('no-op (same index) returns null', () => {
    assert.equal(reorder(['A', 'B', 'C'], 1, 1), null);
});

test('out-of-range returns null', () => {
    assert.equal(reorder(['A', 'B'], -1, 0), null);
    assert.equal(reorder(['A', 'B'], 0, 5), null);
    assert.equal(reorder([], 0, 0), null);
});

test('is pure — input array is not mutated', () => {
    const src = ['A', 'B', 'C', 'D'];
    const out = reorder(src, 3, 0);
    assert.deepEqual(src, ['A', 'B', 'C', 'D'], 'source must be untouched');
    assert.notEqual(out, src, 'returns a new array');
});
