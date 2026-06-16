// Battle-RNG determinism (2026-06): the engine's NON-damage battle rolls —
// protect/endure success chains, contact-ability procs (Static / Flame Body /
// Poison Point / Cute Charm / Poison Touch / Toxic Chain / Cursed Body), Stench,
// secondary-status procs, phazing target picks, infatuation, Acupressure, sleep
// duration, paralysis full-fizzle — were converted from bare Math.random() to the
// seeded `storyAwareRng()` stream (CLAUDE.md: deterministic replays are part of
// the product). `performAction` and `parseMoveEffects` each take one `_fxRng`
// accessor; a few out-of-scope sites call storyAwareRng()() inline.
//
// Damage roll / crit / accuracy / multi-hit count / variable-damage moves and AI
// move-scoring are DELIBERATELY left on Math.random() pending a separate review,
// so this guard is targeted (it does not assert "zero Math.random in the engine").
// Run: node --test tests/suites/battle-rng-determinism.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const SRC = readFileSync('battle.html', 'utf8');

function extractFn(src, signature) {
  const start = src.indexOf(signature);
  assert.ok(start >= 0, `${signature} present in battle.html`);
  const braceOpen = src.indexOf('{', start);
  let depth = 0;
  for (let i = braceOpen; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  throw new Error(`unbalanced braces scanning ${signature}`);
}

test('performAction declares one seeded _fxRng accessor', () => {
  const body = extractFn(SRC, 'async function performAction(');
  assert.match(body, /const _fxRng = storyAwareRng\(\);/, 'performAction must seed _fxRng');
});

test('parseMoveEffects declares one seeded _fxRng accessor', () => {
  const body = extractFn(SRC, 'async function parseMoveEffects(');
  assert.match(body, /const _fxRng = storyAwareRng\(\);/, 'parseMoveEffects must seed _fxRng');
});

test('protect/endure success chain uses the seeded RNG', () => {
  assert.match(SRC, /if \(_fxRng\(\) < successRate\) \{/, 'protect chain must use _fxRng');
  assert.equal(SRC.includes('if (Math.random() < successRate)'), false, 'no bare Math.random for protect chain');
});

test('contact-ability procs use the seeded RNG (representative: Static, Flame Body, Cute Charm)', () => {
  assert.match(SRC, /defender\.ability === "Static" && _fxRng\(\) < 0\.3/);
  assert.match(SRC, /defender\.ability === "Flame Body" && _fxRng\(\) < 0\.3/);
  assert.match(SRC, /=== "Cute Charm" && _fxRng\(\) < 0\.3/);
  assert.equal(SRC.includes('=== "Static" && Math.random()'), false);
  assert.equal(SRC.includes('=== "Flame Body" && Math.random()'), false);
});

test('secondary-status proc + Stench flinch use the seeded RNG', () => {
  assert.match(SRC, /if \(statusCode && _fxRng\(\) < \(sereneGrace/);
  assert.match(SRC, /ability === "Stench" .* && _fxRng\(\) < 0\.1\)/);
});

test('sleep duration + paralysis fizzle use the seeded RNG', () => {
  assert.match(SRC, /mon\.sleepDuration = Math\.floor\(storyAwareRng\(\)\(\) \* 3\) \+ 1;/);
  assert.match(SRC, /mon\.status === "PAR" && storyAwareRng\(\)\(\) < 0\.25/);
});

test('the deferred damage roll is still on Math.random (documents the review boundary)', () => {
  // If this ever changes, the damage RNG was touched — that needs maintainer sign-off.
  assert.match(SRC, /let rng = \(85 \+ Math\.floor\(Math\.random\(\) \* 16\)\) \/ 100;/);
});
