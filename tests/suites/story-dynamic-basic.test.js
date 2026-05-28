// Verifies the dynamic Basic-Trainer generator + per-event seeding (Phase 3.5d /
// 3.4 foundation): generated basics have a rolled type (single or dual), a generic
// class+sprite, and NO signatures; the same (runSeed, eventIdx) reproduces the
// identical trainer (static), while different eventIdx / runSeed vary it.
// Run: node --test tests/suites/story-dynamic-basic.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const E = eng.window.__rivalTest;
const GENS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function prime(runSeed = 12345) {
  E.sm.active = true;
  E.sm.runSeed = runSeed;
  E.sm._strngState = null;
  if (!E.sm.settings) E.sm.settings = {};
  E.sm.settings.enabledGens = GENS.slice();
}
prime();

test('per-event seed is deterministic and distinct per event', () => {
  assert.equal(E.storyEventSeed(5), E.storyEventSeed(5), 'same eventIdx -> same seed');
  assert.notEqual(E.storyEventSeed(5), E.storyEventSeed(6), 'different eventIdx -> different seed');
  prime(999);
  const a = E.storyEventSeed(5);
  prime(12345);
  assert.notEqual(a, E.storyEventSeed(5), 'different runSeed -> different seed');
});

test('withEventSeededRng reproduces the same sequence and restores the shared stream', () => {
  prime(777);
  const savedRef = eng.window.storyRngNext;
  const seqA = E.withEventSeededRng(3, () => [eng.window.storyRngNext(), eng.window.storyRngNext(), eng.window.storyRngNext()]);
  const seqB = E.withEventSeededRng(3, () => [eng.window.storyRngNext(), eng.window.storyRngNext(), eng.window.storyRngNext()]);
  assert.deepEqual(seqA, seqB, 'same event seed -> identical sequence');
  assert.equal(eng.window.storyRngNext, savedRef, 'shared storyRngNext restored afterward');
});

test('generated basic trainer: no sigs, a real type, a sprite, static per event', () => {
  prime(54321);
  const t1 = E.generateBasicTrainer(7, null);
  assert.equal(t1.role, 'Basic Trainer');
  assert.ok(Array.isArray(t1.sigs) && t1.sigs.length === 0, 'no signatures');
  assert.ok(t1.type && typeof t1.type === 'string', 'has a type');
  assert.ok(t1.spriteFile, 'has a sprite');
  // Static: regenerating the same event reproduces the identical trainer.
  const t2 = E.generateBasicTrainer(7, null);
  assert.deepEqual({ type: t2.type, sprite: t2.spriteFile, name: t2.name }, { type: t1.type, sprite: t1.spriteFile, name: t1.name }, 'same event -> identical trainer');
  // Different event -> (very likely) a different roll.
  const diff = E.generateBasicTrainer(8, null);
  assert.ok(diff.type !== t1.type || diff.spriteFile !== t1.spriteFile || diff.name !== t1.name, 'different event differs');
});

test('gym-trainer generation keeps the gym type as primary; ~1/3 are dual', () => {
  prime(2024);
  let dual = 0;
  const N = 120;
  for (let i = 0; i < N; i++) {
    const t = E.generateBasicTrainer(100 + i, 'Fire');
    const parts = t.type.split('/');
    assert.equal(parts[0], 'Fire', `gym type leads (event ${i}): ${t.type}`);
    if (parts.length === 2) dual++;
  }
  const frac = dual / N;
  assert.ok(frac > 0.15 && frac < 0.55, `dual fraction ${(frac * 100).toFixed(0)}% should be ~1/3`);
});

test('every type can be generated as a basic primary (coverage of the type space)', () => {
  prime(31415);
  const seen = new Set();
  for (let i = 0; i < 4000; i++) {
    const t = E.generateBasicTrainer(i, null);
    seen.add(t.type.split('/')[0]);
  }
  const allTypes = Object.keys(eng.window.typeChart).filter((x) => x !== '???');
  for (const ty of allTypes) assert.ok(seen.has(ty), `type ${ty} reachable as a basic primary`);
});
