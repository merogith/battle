import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Regression test for ISSUE-025: `???` type used by gen1 bide and gen4 curse
// must be present in typeChart so a future gen-toggle feature (or any tool
// that walks the inheritance chain) doesn't get `undefined`.
//
// Source of truth since Wave 5D: data/type-chart.json (loaded into battle.html
// at boot via loadGameData; the inline literal was removed).

const chart = JSON.parse(readFileSync('data/type-chart.json', 'utf8'));

test('typeChart includes the legacy ??? type for typeless moves', () => {
  assert.ok('???' in chart, 'typeChart must include "???" key');
  assert.equal(typeof chart['???'], 'object', '"???" must be a multiplier row');
});

test('moves.json: every move type appears in typeChart (no undefined-lookup risk)', () => {
  const chartTypes = new Set(Object.keys(chart));
  const moves = JSON.parse(readFileSync('data/moves.json', 'utf8'));
  const missingTypes = new Set();
  for (const gen of Object.keys(moves)) {
    for (const moveKey of Object.keys(moves[gen])) {
      const t = moves[gen][moveKey].type;
      if (t && !chartTypes.has(t)) missingTypes.add(t);
    }
  }
  assert.equal(
    missingTypes.size, 0,
    `every move type must exist in typeChart; missing: ${[...missingTypes].join(', ')}`,
  );
});
