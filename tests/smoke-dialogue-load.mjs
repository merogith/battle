// Smoke test for Wave 5A dialogue extraction.
// Boots the engine, asserts each pool was populated from data/dialogue/*.json.

import { loadEngine } from './helpers/load-engine.js';

const POOLS = {
  LEADER_VICTORY_LINES:      { type: 'object', minSize: 60, sampleKey: 'Brock' },
  LEADER_BADGE_REFLECTIONS:  { type: 'object', minSize: 60, sampleKey: 'Brock' },
  ELITE_VICTORY_LINES:       { type: 'object', minSize: 25, sampleKey: 'Lorelei' },
  CHAMPION_VICTORY_LINES:    { type: 'object', minSize: 10, sampleKey: 'Blue' },
  TRAINER_QUOTES:            { type: 'object', minSize: 10, sampleKey: 'Basic Trainer' },
  TRAINER_QUOTES_BY_NAME:    { type: 'object', minSize: 100, sampleKey: 'Brock' },
  CITY_GUIDE_QUOTES:         { type: 'array',  minSize: 12 },
};

const eng = await loadEngine();
const w = eng.window;
const fails = [];

for (const [name, spec] of Object.entries(POOLS)) {
  const v = w[name];
  if (v == null) {
    fails.push(`${name}: null/undefined`);
    continue;
  }
  const isArr = Array.isArray(v);
  const expectedArr = spec.type === 'array';
  if (isArr !== expectedArr) {
    fails.push(`${name}: expected ${spec.type}, got ${isArr ? 'array' : typeof v}`);
    continue;
  }
  const size = isArr ? v.length : Object.keys(v).length;
  if (size < spec.minSize) {
    fails.push(`${name}: only ${size} entries (expected ≥${spec.minSize})`);
    continue;
  }
  if (spec.sampleKey && !v[spec.sampleKey]) {
    fails.push(`${name}: sample key ${spec.sampleKey} missing`);
    continue;
  }
  console.log(`✓ ${name.padEnd(30)} ${size} entries`);
}

// Exercise a real gameplay function that reads the pools via lexical scope.
// This catches the case where window-level reassignment masks an empty let.
if (typeof w.getTrainerQuote === 'function') {
  const q = w.getTrainerQuote('Basic Trainer');
  if (!q || typeof q !== 'string') fails.push(`getTrainerQuote returned ${q}`);
  else console.log(`✓ getTrainerQuote('Basic Trainer') = ${q.slice(0, 60)}…`);
} else {
  // Probe via __engine if available
  const eng = w.__engine;
  if (eng && eng.getTrainerQuote) {
    const q = eng.getTrainerQuote('Basic Trainer');
    if (!q || typeof q !== 'string') fails.push(`__engine.getTrainerQuote returned ${q}`);
    else console.log(`✓ __engine.getTrainerQuote('Basic Trainer') = ${q.slice(0, 60)}…`);
  }
}
// Read TRAINER_QUOTES via a function that closes over the lexical-scope binding,
// not via window directly — guarantees the in-game read path is exercised.
try {
  const probe = w.eval('(function(){ return (TRAINER_QUOTES["Basic Trainer"] || []).length; })()');
  if (!probe || probe < 6) fails.push(`TRAINER_QUOTES["Basic Trainer"] read via eval got ${probe} entries`);
  else console.log(`✓ TRAINER_QUOTES["Basic Trainer"] via eval = ${probe} entries`);
} catch (e) {
  fails.push(`TRAINER_QUOTES eval probe threw: ${e.message}`);
}

if (fails.length) {
  console.error('\n❌ FAILURES:');
  for (const f of fails) console.error('  - ' + f);
  process.exit(1);
}
console.log('\n✓ Wave 5A dialogue extraction smoke test passed');
process.exit(0);
