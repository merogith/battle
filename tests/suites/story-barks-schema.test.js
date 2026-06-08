// Stream 2 §8 — bark-pool schema guard (data/dialogue/barks.json).
//
// The bark layer adds variance to terminal/emotional, NON-LOAD-BEARING battle-log
// moments by APPENDING a flavor line after the canonical line — it must never vary
// or replace a state-information line (effectiveness, status, faint-as-state, "But
// it failed!"). This guard locks that boundary in the data: every key is a known
// non-state event, and the encoding can't acquire a state-event key without
// failing here. (Wiring is Stream 4's; this pins the copy + contract.)
//
// Run: node --test tests/suites/story-barks-schema.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const barks = JSON.parse(fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'data', 'dialogue', 'barks.json'),
  'utf8'
));

// The ONLY events a bark may attach to — all non-state, terminal/emotional.
const ALLOWED_EVENTS = new Set(['playerLastFaint', 'foeLastFaint', 'fledRoad', 'critKO']);

// State-information events that must NEVER get a bark pool (load-bearing, canon).
const FORBIDDEN_EVENTS = [
  'superEffective', 'notVeryEffective', 'noEffect', 'critical', 'miss',
  'paralyzed', 'asleep', 'frozen', 'burned', 'poisoned', 'confused',
  'faint', 'fainted', 'failed', 'butItFailed', 'used', 'move',
];

test('barks.json parses and every pool is a non-empty array of non-empty strings', () => {
  for (const [k, v] of Object.entries(barks)) {
    if (k.startsWith('_')) continue; // _meta and friends are documentation
    assert.ok(Array.isArray(v) && v.length >= 1, `${k}: pool must be a non-empty array`);
    v.forEach((line, i) => {
      assert.equal(typeof line, 'string', `${k}[${i}]: must be a string`);
      assert.ok(line.trim().length > 0, `${k}[${i}]: must be non-empty`);
    });
  }
});

test('every bark key is a known NON-STATE event (additive-only boundary)', () => {
  for (const k of Object.keys(barks)) {
    if (k.startsWith('_')) continue;
    assert.ok(ALLOWED_EVENTS.has(k),
      `${k}: not an approved non-state bark event — barks may only attach to ${[...ALLOWED_EVENTS].join(', ')}`);
  }
});

test('no bark pool attaches to a state-information event', () => {
  for (const bad of FORBIDDEN_EVENTS) {
    assert.ok(!(bad in barks),
      `barks.json must not carry a pool for the state event "${bad}" — those log lines stay singular/canon`);
  }
});

test('the contract is documented in _meta', () => {
  assert.equal(typeof barks._meta, 'string');
  assert.ok(/ADDITIVE-ONLY/.test(barks._meta) && /storyRngNext/.test(barks._meta),
    '_meta must state the additive-only rule and the seeded-RNG requirement');
});
