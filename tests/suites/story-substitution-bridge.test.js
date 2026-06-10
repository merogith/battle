// Guard: H2-3 substitution-bridge lines. When BEAT_CANON_TRAINER swaps a scheduled road
// battle for a canon villain, exactly one world-narrator bridge line must exist for that
// sceneKey (so the named villain doesn't read as an unexplained reskin). Locks the
// data/dialogue/substitution-bridges.json ⇄ DEFAULT_SUBSTITUTION_BRIDGES ⇄
// BEAT_CANON_TRAINER key sets in lockstep — a future canon add with no bridge fails here.
// Run: node --test tests/suites/story-substitution-bridge.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadEngine } from '../helpers/load-engine.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const JSON_BRIDGES = JSON.parse(readFileSync(join(ROOT, 'data', 'dialogue', 'substitution-bridges.json'), 'utf8'));

const eng = await loadEngine();
const ST = eng.window.__storyTest;
assert.ok(ST, 'window.__storyTest must be exposed under the harness');

const canonKeys = () => Object.keys(ST.BEAT_CANON_TRAINER);
const bridgeKeys = () => Object.keys(ST.SUBSTITUTION_BRIDGES);

test('every BEAT_CANON_TRAINER swap key resolves a non-empty bridge line', () => {
    for (const k of canonKeys()) {
        const line = ST.SUBSTITUTION_BRIDGES[k];
        assert.ok(typeof line === 'string' && line.trim().length > 10,
            `${k} (${ST.BEAT_CANON_TRAINER[k]}) has a bridge line`);
    }
});

test('no orphan bridge — every bridge key is a real canon-swap key', () => {
    const canon = new Set(canonKeys());
    for (const k of bridgeKeys()) {
        assert.ok(canon.has(k), `bridge key ${k} maps to a BEAT_CANON_TRAINER entry`);
    }
});

test('the live bridge set === the canon-swap set (both directions, all 20)', () => {
    assert.deepEqual(bridgeKeys().sort(), canonKeys().sort(),
        'SUBSTITUTION_BRIDGES keys match BEAT_CANON_TRAINER keys exactly');
    assert.equal(canonKeys().length, 20, 'the 20 villain boss + miniBoss swaps');
});

test('the JSON file matches the canon-swap set and carries no _meta leak', () => {
    const jsonKeys = Object.keys(JSON_BRIDGES).filter(k => k !== '_meta');
    assert.deepEqual(jsonKeys.sort(), canonKeys().sort(),
        'substitution-bridges.json keys mirror BEAT_CANON_TRAINER');
    assert.equal(ST.SUBSTITUTION_BRIDGES._meta, undefined,
        'the JSON doc-comment key is stripped before merge');
    for (const k of jsonKeys) {
        assert.ok(typeof JSON_BRIDGES[k] === 'string' && JSON_BRIDGES[k].length > 10, `${k} non-empty in JSON`);
    }
});

test('the render hook gates the bridge on a real swap (source guard)', () => {
    const SRC = readFileSync(join(ROOT, 'battle.html'), 'utf8');
    // Bridge is looked up only when BEAT_CANON_TRAINER has the key (the swap actually
    // happened), and rendered via the shared diegetic overlay before the beat scene.
    assert.match(SRC, /BEAT_CANON_TRAINER\[_beatBattle\.sceneKey\]\)\s*\?\s*SUBSTITUTION_BRIDGES\[_beatBattle\.sceneKey\]/,
        'bridge only resolves when a canon swap exists');
    assert.match(SRC, /if \(_bridgeLine\)[\s\S]{0,200}_renderNarrativeOverlay/,
        'bridge renders through _renderNarrativeOverlay before the beat scene');
});
