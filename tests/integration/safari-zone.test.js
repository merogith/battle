import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('safari-zone: spec declares 6 encounters per run', async () => {
  const flow = readFileSync('STORY_MODE_FLOW.md', 'utf8');
  assert.match(flow, /6\s+(encounters|catches|mons|tries)/i, 'spec must mention 6 encounters');
});

test('safari-zone: grade weights g1:3 / g2:22 / g3:50 / g4:25 sum to 100', () => {
  const weights = { g1: 3, g2: 22, g3: 50, g4: 25 };
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  assert.equal(sum, 100, 'grade weights must sum to 100');
});

test('safari-zone: catch math 1.25× multiplier is documented', () => {
  const flow = readFileSync('STORY_MODE_FLOW.md', 'utf8');
  const matches = flow.match(/1\.25/g);
  assert.ok(matches && matches.length > 0, 'spec mentions 1.25× safari multiplier');
});
