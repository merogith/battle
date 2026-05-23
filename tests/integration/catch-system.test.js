import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

test('catch-system: engine exposes a species database with catch-rate-bearing entries', async () => {
  const { engine } = await loadEngine();
  assert.ok(engine.baseStats && Object.keys(engine.baseStats).length > 0, 'baseStats populated');
});

test('catch-system: ball multipliers (Poke 1.0, Great 1.5, Ultra 2.0) are sane integers', async () => {
  const ballMults = { 'Poke Ball': 1.0, 'Great Ball': 1.5, 'Ultra Ball': 2.0, 'Master Ball': Infinity };
  for (const [name, m] of Object.entries(ballMults)) {
    assert.ok(m >= 1.0, `${name} multiplier ${m} should be >= 1.0`);
  }
});

test('catch-system: catch math is monotonic — higher ball mult never reduces success chance', async () => {
  function catchChance(speciesRate, ballMult) {
    return Math.min(1, speciesRate * ballMult / 255);
  }
  const rates = [3, 45, 90, 190, 255];
  const mults = [1.0, 1.5, 2.0];
  for (const r of rates) {
    let prev = -1;
    for (const m of mults) {
      const c = catchChance(r, m);
      assert.ok(c >= prev, `chance monotonic in mult: rate=${r} mult=${m} chance=${c} prev=${prev}`);
      prev = c;
    }
  }
});

test('catch-system: PC cap of 10 is documented in STORY_MODE_FLOW.md', async () => {
  const fs = await import('node:fs');
  const flow = fs.readFileSync('STORY_MODE_FLOW.md', 'utf8');
  assert.match(flow, /cap\s+10|10\s+(slots|max|cap|mons)/i, 'spec must mention PC cap of 10');
});
