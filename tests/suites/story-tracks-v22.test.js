// PR-1: 3-track story-mode bone structure — save schema v22 + random track
// assignment. Covers pool shape, _pickTrack picking from the pool, the v22
// migration filling missing fields on a pre-v22 save, and idempotence
// (existing values are preserved).
// Run: node --test tests/suites/story-tracks-v22.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;

test('SAVE_VER is at/above the camp-release floor (v25); later bumps raise it', () => {
    // v25 added Camp bonding; v26 the narration overhaul. The 3-track tables
    // asserted below are version-independent, so this guard just needs a floor.
    assert.ok(W.__STORY_SAVE_VER >= 25);
});

test('VILLAIN_TRACKS pool has the 10 canon teams', () => {
    const pool = ST.VILLAIN_TRACKS;
    assert.equal(pool.length, 10);
    for (const id of ['rocket','magma','aqua','galactic','plasma','flare','skull','yell','macroCosmos','star']) {
        assert.ok(pool.includes(id), `missing villain track: ${id}`);
    }
});

test('EXTRA_TRACKS pool has the 8 dark-Pokémon stories', () => {
    const pool = ST.EXTRA_TRACKS;
    assert.equal(pool.length, 8);
    for (const id of ['cubone','yamask','hypno','phantump','mimikyu','drifloon','parasect','mewtwo']) {
        assert.ok(pool.includes(id), `missing extra track: ${id}`);
    }
});

test('_pickTrack returns a value from the pool', () => {
    for (let i = 0; i < 50; i++) {
        const v = ST.pickTrack(ST.VILLAIN_TRACKS);
        assert.ok(ST.VILLAIN_TRACKS.includes(v), `pickTrack returned out-of-pool: ${v}`);
        const x = ST.pickTrack(ST.EXTRA_TRACKS);
        assert.ok(ST.EXTRA_TRACKS.includes(x), `pickTrack returned out-of-pool: ${x}`);
    }
});

test('migrateStoryPreV22 fills missing tracks / storyEventsFired / stats', () => {
    // Simulate a fresh pre-v22 save by stripping the v22-era fields.
    ST.sm = Object.assign({}, ST.sm, {
        tracks: undefined,
        storyEventsFired: undefined,
        stats: undefined,
    });
    ST.migratePreV22();
    const sm = ST.sm;
    assert.ok(sm.tracks && typeof sm.tracks === 'object', 'sm.tracks missing post-migrate');
    assert.equal(sm.tracks.main, 'classic_v2');
    assert.ok(ST.VILLAIN_TRACKS.includes(sm.tracks.villain), `villain not in pool: ${sm.tracks.villain}`);
    assert.ok(ST.EXTRA_TRACKS.includes(sm.tracks.extra), `extra not in pool: ${sm.tracks.extra}`);
    assert.ok(sm.storyEventsFired && typeof sm.storyEventsFired === 'object');
    assert.equal(Object.keys(sm.storyEventsFired).length, 0);
    assert.equal(sm.stats.battlesLost, 0);
});

test('migrateStoryPreV22 is idempotent — existing track picks are preserved', () => {
    ST.sm = Object.assign({}, ST.sm, {
        tracks: { main: 'classic_v2', villain: 'plasma', extra: 'mimikyu' },
        storyEventsFired: { 'villain.plasma.event1': true },
        stats: { battlesLost: 3 },
    });
    ST.migratePreV22();
    const sm = ST.sm;
    assert.equal(sm.tracks.villain, 'plasma', 'existing villain pick was overwritten');
    assert.equal(sm.tracks.extra,   'mimikyu', 'existing extra pick was overwritten');
    assert.equal(sm.storyEventsFired['villain.plasma.event1'], true, 'fired-event ledger was wiped');
    assert.equal(sm.stats.battlesLost, 3, 'battlesLost counter was reset');
});

test('migrateStoryPreV22 fills a partially-shaped tracks object', () => {
    ST.sm = Object.assign({}, ST.sm, {
        tracks: { main: null, villain: 'rocket', extra: null },
    });
    ST.migratePreV22();
    const sm = ST.sm;
    assert.equal(sm.tracks.main, 'classic_v2');
    assert.equal(sm.tracks.villain, 'rocket', 'existing villain pick was overwritten');
    assert.ok(ST.EXTRA_TRACKS.includes(sm.tracks.extra), 'extra not back-filled');
});
