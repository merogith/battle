// Guard: rival sprite progression (§6.4) + the Champion pre-boss cinematic (§5).
// Rivals with multi-stage art visibly grow across the run (Blue → Blue-2 → Blue-Champion);
// the Champion gets the same pre-boss escalation beat as the canon villains.
// See docs/story-design/story-immersion/visual-and-cinematic.md §5 / §6.4.
// Run: node --test tests/suites/story-rival-progression.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadEngine } from '../helpers/load-engine.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const eng = await loadEngine();
const ST = eng.window.__storyTest;
assert.ok(ST, 'window.__storyTest must be exposed under the harness');

// ── Rival sprite progresses by phase ───────────────────────────────────────────
test('Blue grows Blue → Blue-2 → Blue-Champion across phases', () => {
    assert.equal(ST.rivalPhaseSpriteFile('Blue', 0), 'Blue', 'starter duel: base sprite');
    assert.equal(ST.rivalPhaseSpriteFile('Blue', 2), 'Blue', 'early rematch: base sprite');
    assert.equal(ST.rivalPhaseSpriteFile('Blue', 3), 'Blue-2', 'mid: evolved');
    assert.equal(ST.rivalPhaseSpriteFile('Blue', 4), 'Blue-Champion', 'league: Champion garb');
});

test('other variant rivals step up at the later phases', () => {
    assert.equal(ST.rivalPhaseSpriteFile('Silver', 4), 'Silver-2');
    assert.equal(ST.rivalPhaseSpriteFile('Gladion', 3), 'Gladion-2');
    assert.equal(ST.rivalPhaseSpriteFile('Hau', 4), 'Hau-2');
});

test('rivals without variant art keep their single sprite at every phase', () => {
    for (const p of [0, 2, 3, 4]) {
        assert.equal(ST.rivalPhaseSpriteFile('Barry', p), 'Barry');
        assert.equal(ST.rivalPhaseSpriteFile('May', p), 'May');
    }
});

test('rivalPhaseSpriteFile is null/garbage-safe', () => {
    assert.equal(ST.rivalPhaseSpriteFile('Blue', null), 'Blue', 'no phase → base');
    assert.equal(ST.rivalPhaseSpriteFile('', 4), '');
    assert.equal(ST.rivalPhaseSpriteFile('Nope', 4), 'Nope');
});

// ── Every referenced variant sprite actually exists on disk ─────────────────────
test('all RIVAL_SPRITE_VARIANTS target files are present in sprites/trainers/', () => {
    const V = ST.RIVAL_SPRITE_VARIANTS;
    for (const base of Object.keys(V)) {
        for (const phase of Object.keys(V[base])) {
            const file = V[base][phase];
            assert.ok(existsSync(join(ROOT, 'sprites', 'trainers', file + '.png')),
                `${file}.png exists for ${base} phase ${phase}`);
        }
    }
});

// ── Champion pre-boss cinematic ────────────────────────────────────────────────
test('the Champion battle resolves to the main.champion pre-boss cinematic', () => {
    assert.equal(ST.preBossCinematicKeyFor(null, 'Champion', false), 'main.champion');
    // Not triggered for non-champion events with no canon beat.
    assert.equal(ST.preBossCinematicKeyFor(null, 'Gym Leader 8', false), null);
});

test('main.champion has pre-boss copy with a valid emotion', () => {
    const c = ST.PRE_BOSS_CINEMATICS['main.champion'];
    assert.ok(c && typeof c.line === 'string' && c.line.length > 20, 'champion line present');
    assert.ok(ST.castEmotionClass(c.emotion), 'champion emotion maps to a class');
    assert.equal(c.nameplate, 'The Champion');
});
