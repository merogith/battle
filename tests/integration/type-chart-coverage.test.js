import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadEngine } from '../helpers/load-engine.js';

// Regression test for ISSUE-025: `???` type used by gen1 bide and gen4 curse
// must be present in typeChart so a future gen-toggle feature (or any tool
// that walks the inheritance chain) doesn't get `undefined`.

test('typeChart includes the legacy ??? type for typeless moves', async () => {
  const { window } = await loadEngine();
  // The engine may not expose typeChart globally — read from source instead.
  const src = readFileSync('battle.html', 'utf8');
  const m = src.match(/const typeChart\s*=\s*\{[\s\S]+?\};/);
  assert.ok(m, 'typeChart literal found');
  assert.match(m[0], /"\?\?\?"\s*:\s*\{/, 'typeChart must include "???" key');
});

test('moves.json: every move type appears in typeChart (no undefined-lookup risk)', () => {
  const src = readFileSync('battle.html', 'utf8');
  const m = src.match(/const typeChart\s*=\s*(\{[\s\S]+?\});/);
  assert.ok(m);
  const chart = JSON.parse(m[1]);
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
