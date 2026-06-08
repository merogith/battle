// Guard: the in-battle "impact" layer is consistent across the single-hit AND multi-hit
// damage paths. Previously only the single-hit path shook the screen / played the hit
// sound on crit + super-effective hits, so multi-hit moves landed flat. Both paths now
// route through the shared _battleHitShake helper and play playHitSound.
// See docs/story-design/story-immersion/visual-and-cinematic.md §6. Pure source check
// (no engine boot needed) — locks parity against regression.
// Run: node --test tests/suites/battle-hit-impact.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = readFileSync(join(ROOT, 'battle.html'), 'utf8');

const count = (re) => (SRC.match(re) || []).length;

test('_battleHitShake is defined exactly once', () => {
    assert.equal(count(/function _battleHitShake\s*\(/g), 1, 'one shared helper');
});

test('both damage paths shake on a critical hit', () => {
    // single-hit + multi-hit telegraph each call _battleHitShake('crit').
    assert.ok(count(/_battleHitShake\('crit'\)/g) >= 2,
        "crit shake wired in both single-hit and multi-hit paths");
});

test('both damage paths shake on a super-effective hit', () => {
    assert.ok(count(/_battleHitShake\('super'\)/g) >= 2,
        "super-effective shake wired in both paths");
});

test('the multi-hit path now plays the hit sound (parity with single-hit)', () => {
    assert.ok(count(/AudioSystem\.playHitSound\(/g) >= 2,
        "playHitSound called on both single-hit and multi-hit paths");
});

test('the old inline single-hit shake calls were removed (now via the helper)', () => {
    assert.equal(count(/settings\.animations && screenEl\) anime\(/g), 0,
        "no inline screenEl shake remains — all routed through _battleHitShake");
});

test('_battleHitShake honors reduced motion + the animations setting', () => {
    const body = SRC.slice(SRC.indexOf('function _battleHitShake'), SRC.indexOf('function _battleHitShake') + 900);
    assert.match(body, /settings\.animations/, 'gated by settings.animations');
    assert.match(body, /isReducedMotion/, 'respects prefers-reduced-motion');
});
