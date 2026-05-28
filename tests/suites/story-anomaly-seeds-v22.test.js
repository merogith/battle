// PR-7: anomaly seeds pinned to row IDs 7 / 14 / 30 / 49.
// Verifies the registry shape and that the firing helper trips for matching
// rows and silently no-ops for everything else.
// Run: node --test tests/suites/story-anomaly-seeds-v22.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;

test('ANOMALY_SEEDS registers all 4 anchor row IDs', () => {
    const seeds = ST.ANOMALY_SEEDS;
    assert.ok(seeds, 'ANOMALY_SEEDS should be exposed');
    for (const id of [7, 14, 30, 49]) {
        assert.ok(seeds[id], `missing anomaly seed for row ${id}`);
        assert.equal(typeof seeds[id], 'string');
        assert.ok(seeds[id].length > 10, `seed ${id} too short — should be a full sentence`);
    }
});

test('Anomaly seeds reference The First / handwriting / Welcome Back themes', () => {
    const seeds = ST.ANOMALY_SEEDS;
    assert.match(seeds[7],  /Welcome Back/i);
    assert.match(seeds[14], /handwriting/i);
    assert.match(seeds[30], /The First/i);
    assert.match(seeds[49], /handwriting/i);
});

test('tryFireAnomalySeed returns falsy for non-anchor rows', () => {
    // Build a synthetic ev for a row not in the seed table.
    const ev = [1, 'Battle', 'Basic Trainer', null, 100, null];
    const fired = ST.tryFireAnomalySeed(ev);
    assert.equal(!!fired, false);
});

test('tryFireAnomalySeed returns truthy on first call for an anchor row', () => {
    // Fresh sm.scenesShown ensures the per-run fallback dedup is clean.
    // Note: jsdom uses opaque origin so meta.tipsShown writes silently
    // fail; the per-run fallback is what's verified here. Real-game flow
    // is meta-primary (verified by source review of _tryFireAnomalySeed).
    ST.sm = Object.assign({}, ST.sm, { scenesShown: {} });
    const ev = [7, 'Battle', 'Basic Trainer', null, 1200, null];
    const fired = ST.tryFireAnomalySeed(ev);
    assert.ok(fired, 'anomaly seed should fire on first visit to row 7');
});

test('tryFireAnomalySeed is deduped on repeat calls for the same row', () => {
    // Previous test stamped sm.scenesShown[anomaly-seed-7]; second call no-ops.
    const ev = [7, 'Battle', 'Basic Trainer', null, 1200, null];
    const refired = ST.tryFireAnomalySeed(ev);
    assert.equal(!!refired, false, 'should not re-fire an already-shown seed');
});

test('_tryFireAnomalySeed source uses meta.tipsShown as primary dedup', async () => {
    // Source-level check: real-game cross-run dedup hinges on meta.tipsShown.
    // The per-run sm.scenesShown is a documented fallback for jsdom / quota
    // errors. Verify both paths are present in the implementation.
    const { readFile } = await import('node:fs/promises');
    const src = await readFile(new URL('../../battle.html', import.meta.url), 'utf8');
    const idx = src.indexOf('function _tryFireAnomalySeed(');
    assert.ok(idx > 0, '_tryFireAnomalySeed should be defined');
    const block = src.slice(idx, idx + 1800);
    assert.match(block, /meta\.tipsShown\[tipKey\]\s*=\s*true/, 'meta.tipsShown write should be present');
    assert.match(block, /sm\.scenesShown\[tipKey\]\s*=\s*true/, 'sm.scenesShown fallback should be present');
});

test('Anomaly seeds are pinned to row IDs that exist in STORY_EVENTS_RAW', () => {
    const seeds = ST.ANOMALY_SEEDS;
    const RAW = ST.STORY_EVENTS_RAW;
    for (const id of Object.keys(seeds)) {
        const rowId = parseInt(id, 10);
        const found = RAW.find(r => r && (r[0] | 0) === rowId);
        assert.ok(found, `anomaly seed row ID ${rowId} not found in STORY_EVENTS_RAW`);
    }
});
