import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const game = readFileSync(new URL('../../battle.html', import.meta.url), 'utf8');
const { safari } = JSON.parse(readFileSync(new URL('../../data/story/ball-math.json', import.meta.url), 'utf8'));

test('Safari weights cover every badge tier from entry to the Crucible', () => {
  const curve = game.match(/const _SAFARI_GRADE_CURVE_BY_BADGES = \{([\s\S]+?)\n\s*\};/)?.[1];
  assert.ok(curve);
  const rows = [...curve.matchAll(/(\d+):\s*\{\s*g1:\s*(\d+),\s*g2:\s*(\d+),\s*g3:\s*(\d+),\s*g4:\s*(\d+)\s*\}/g)];
  assert.deepEqual(rows.map(row => Number(row[1])), [4, 5, 6, 7, 8]);
  let previousStrongerGrades = 0;
  for (const row of rows) {
    const [badge, g1, g2, g3, g4] = row.slice(1).map(Number);
    assert.equal(g1 + g2 + g3 + g4, 100, `badge ${badge}`);
    if (badge < 7) assert.equal(g1, 0, `Grade 1 is locked at badge ${badge}`);
    assert.ok(g1 + g2 > previousStrongerGrades, `stronger grades should rise at badge ${badge}`);
    previousStrongerGrades = g1 + g2;
  }
});

test('Safari live tuning starts with ten balls and admits at most ten encounters', () => {
  assert.match(game, /const SAFARI_MAX_ENCOUNTERS = 10;/);
  assert.equal(safari.ballsPerSession, 10);
  assert.equal(safari.ballMultiplier, 1.35);
  assert.ok(safari.baitCatchMult < 1 && safari.baitFleeMult < 1);
  assert.ok(safari.rockCatchMult > 1 && safari.rockFleeMult > 1);
});
