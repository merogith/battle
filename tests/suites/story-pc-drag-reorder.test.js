// Deterministic coverage for the Pokémon Center PC drag-and-drop (storage tab).
//
// Three layers, mirroring how the drag controller resolves a gesture:
//   1. pcReorderByInsertion — PURE index math (same family as partyReorder /
//      pcBoxView). Never mutates the input; resolves the dragged slot by stable id.
//   2. _pcReorderWithin — applies (1) to sm.team / sm.pcBox in place, preserving the
//      array reference.
//   3. _pcMoveAcross — deposit (team→pc) / withdraw (pc→team) via drag, re-using the
//      exact gates from pcDeposit / pcWithdraw (last-mon guard, box cap, party cap)
//      and honoring a precise insertion slot only when the box is in manual order.
//
// (2) and (3) mutate sm, so they ride the __story test surface (deep access), like
// the Safari-curve tests. (1) is pure and lives on StoryMode like its siblings.
//
// Run: node --test tests/suites/story-pc-drag-reorder.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const SM = W.StoryMode;
const story = W.__story;

const reorder = SM.pcReorderByInsertion;

// Minimal slot shape the reorder/move logic touches.
const mk = (name, opts = {}) => ({
    name,
    id: opts.id || ('m_' + name.toLowerCase()),
    nickname: opts.nick || null,
    isEgg: !!opts.egg,
    unsellable: !!opts.bound,
    build: { _isShiny: !!opts.shiny, evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 } },
});
const ids = (arr) => arr.map(s => s.id);

// Build a fresh sm with a controlled party + box. badges:6 → party cap 6.
function setSm(team, box, badges = 6) {
    story.sm = {
        active: true, badges, gold: 2000,
        team: team.slice(), pcBox: box.slice(),
        balls: { poke: 0, great: 0, ultra: 0, master: 0 }, inventory: {},
    };
}

// Keep the box in manual (caught) order for the index-precise move tests; reset
// any sort/filter a prior test left behind.
function resetBoxView() {
    SM.pcSetBoxSort('caught');
    SM.pcSetBoxFilterType('');
    SM.pcSetBoxSearch('');
}

// ── Layer 1: pure index math ─────────────────────────────────────────────────

test('pcReorderByInsertion export exists', () => {
    assert.equal(typeof reorder, 'function');
});

test('move forward: drag slot 0 into the gap after slot 2 (insIndex 3)', () => {
    const box = [mk('A'), mk('B'), mk('C'), mk('D')];
    assert.deepEqual(ids(reorder(box, 'm_a', 3)), ['m_b', 'm_c', 'm_a', 'm_d']);
});

test('move backward / to front: drag slot 3 into gap 0', () => {
    const box = [mk('A'), mk('B'), mk('C'), mk('D')];
    assert.deepEqual(ids(reorder(box, 'm_d', 0)), ['m_d', 'm_a', 'm_b', 'm_c']);
});

test('drop to the very end (insIndex == length)', () => {
    const box = [mk('A'), mk('B'), mk('C')];
    assert.deepEqual(ids(reorder(box, 'm_a', 3)), ['m_b', 'm_c', 'm_a']);
});

test('no-op gaps (either side of the dragged slot) return null', () => {
    const box = [mk('A'), mk('B'), mk('C')];
    assert.equal(reorder(box, 'm_b', 1), null, 'gap before itself is a no-op');
    assert.equal(reorder(box, 'm_b', 2), null, 'gap after itself is a no-op');
});

test('unknown id returns null', () => {
    assert.equal(reorder([mk('A'), mk('B')], 'm_zzz', 0), null);
    assert.equal(reorder([], 'm_a', 0), null);
});

test('is pure — input array is not mutated', () => {
    const box = [mk('A'), mk('B'), mk('C'), mk('D')];
    const before = ids(box);
    reorder(box, 'm_d', 0);
    assert.deepEqual(ids(box), before, 'source order must be untouched');
});

// ── Layer 2: apply to sm in place ────────────────────────────────────────────

test('_pcReorderWithin reorders sm.pcBox in place and returns the resting index', () => {
    setSm([mk('Lead')], [mk('A'), mk('B'), mk('C')]);
    const box = story.sm.pcBox;
    const to = story.pcReorderWithin('pc', 'm_a', 3);
    assert.equal(to, 2, 'A landed at index 2');
    assert.deepEqual(ids(story.sm.pcBox), ['m_b', 'm_c', 'm_a']);
    assert.equal(story.sm.pcBox, box, 'array reference is preserved');
});

test('_pcReorderWithin reorders sm.team and a no-op leaves it unchanged', () => {
    setSm([mk('A'), mk('B'), mk('C')], []);
    assert.equal(story.pcReorderWithin('team', 'm_b', 1), -1, 'no-op gap → -1');
    assert.deepEqual(ids(story.sm.team), ['m_a', 'm_b', 'm_c'], 'unchanged on no-op');
    assert.equal(story.pcReorderWithin('team', 'm_c', 0), 0, 'C to front');
    assert.deepEqual(ids(story.sm.team), ['m_c', 'm_a', 'm_b']);
});

// ── Layer 3: cross-zone deposit / withdraw ───────────────────────────────────

test('deposit: drag a party mon into the PC box at a precise slot (manual order)', () => {
    resetBoxView();
    assert.equal(story.pcManualBoxOrder(), true, 'default view is manual/caught order');
    setSm([mk('Lead'), mk('X')], [mk('A'), mk('B'), mk('C')]);
    assert.equal(story.pcMoveAcross('m_x', 'pc', 1), true);
    assert.deepEqual(ids(story.sm.team), ['m_lead'], 'X left the party');
    assert.deepEqual(ids(story.sm.pcBox), ['m_a', 'm_x', 'm_b', 'm_c'], 'inserted at slot 1');
});

test('deposit appends (ignores the gap) when the box is not in manual order', () => {
    SM.pcSetBoxSort('name');
    assert.equal(story.pcManualBoxOrder(), false);
    setSm([mk('Lead'), mk('X')], [mk('A'), mk('B'), mk('C')]);
    assert.equal(story.pcMoveAcross('m_x', 'pc', 1), true);
    assert.deepEqual(ids(story.sm.pcBox), ['m_a', 'm_b', 'm_c', 'm_x'], 'appended, not inserted');
    resetBoxView();
});

test('deposit is blocked when it is the last battle-eligible Pokémon', () => {
    setSm([mk('Solo')], [mk('A')]);
    assert.equal(story.pcMoveAcross('m_solo', 'pc', 0), false, 'cannot bank your last fighter');
    assert.deepEqual(ids(story.sm.team), ['m_solo'], 'party untouched');
    assert.deepEqual(ids(story.sm.pcBox), ['m_a'], 'box untouched');
});

test('deposit is blocked when the PC box is at capacity (30)', () => {
    const fullBox = Array.from({ length: 30 }, (_, i) => mk('Box' + i, { id: 'b' + i }));
    setSm([mk('Lead'), mk('X')], fullBox);
    assert.equal(story.pcMoveAcross('m_x', 'pc', 0), false);
    assert.equal(story.sm.pcBox.length, 30, 'box stays full');
    assert.deepEqual(ids(story.sm.team), ['m_lead', 'm_x'], 'party untouched');
});

test('withdraw: drag a PC mon into the party at a precise slot', () => {
    setSm([mk('P'), mk('Q')], [mk('A')], 6);
    assert.equal(story.pcMoveAcross('m_a', 'team', 1), true);
    assert.deepEqual(ids(story.sm.team), ['m_p', 'm_a', 'm_q'], 'inserted between P and Q');
    assert.deepEqual(ids(story.sm.pcBox), [], 'left the box');
});

test('withdraw is blocked when the party is at the badge cap', () => {
    // badges:6 → cap 6; a full six-mon party cannot take a seventh.
    const full = Array.from({ length: 6 }, (_, i) => mk('P' + i, { id: 'p' + i }));
    setSm(full, [mk('A')], 6);
    assert.equal(story.pcMoveAcross('m_a', 'team', 0), false);
    assert.equal(story.sm.team.length, 6, 'party stays at cap');
    assert.deepEqual(ids(story.sm.pcBox), ['m_a'], 'box untouched');
});

test('a deposited egg is allowed even as the last party member (eggs are not fighters)', () => {
    setSm([mk('Egg', { egg: true })], []);
    assert.equal(story.pcMoveAcross('m_egg', 'pc', 0), true, 'an egg is not your last fighter');
    assert.deepEqual(ids(story.sm.team), []);
    assert.deepEqual(ids(story.sm.pcBox), ['m_egg']);
});

test('cross-zone move rejects a mismatched direction (wrong source zone)', () => {
    setSm([mk('Lead'), mk('X')], [mk('A')]);
    // 'm_a' lives in the PC; asking to deposit it (a team→pc move) must no-op.
    assert.equal(story.pcMoveAcross('m_a', 'pc', 0), false);
    assert.equal(story.pcMoveAcross('m_x', 'team', 0), false, 'team mon cannot "withdraw"');
    assert.deepEqual(ids(story.sm.team), ['m_lead', 'm_x']);
    assert.deepEqual(ids(story.sm.pcBox), ['m_a']);
});
