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

// Ball-math probes — covers Wave 5C extraction.
const ballChecks = {
  '_CATCH_BALL_MULT.poke':            ['(_CATCH_BALL_MULT.poke)', 1.0],
  '_CATCH_BALL_MULT.great':           ['(_CATCH_BALL_MULT.great)', 1.5],
  '_CATCH_BALL_MULT.ultra':           ['(_CATCH_BALL_MULT.ultra)', 2.0],
  '_CATCH_BALL_MULT.master=Infinity': ['(_CATCH_BALL_MULT.master === Infinity)', true],
  '_CATCH_RATE_BY_GRADE.1':           ['(_CATCH_RATE_BY_GRADE[1])', 0.12],
  '_CATCH_RATE_BY_GRADE.4':           ['(_CATCH_RATE_BY_GRADE[4])', 0.50],
  '_CATCH_DEFAULT_FLEE_RATE':         ['(_CATCH_DEFAULT_FLEE_RATE)', 0.30],
  'SAFARI_BALL_MULT':                 ['(SAFARI_BALL_MULT)', 1.35],
  'SAFARI_BALLS_PER_SESSION':         ['(SAFARI_BALLS_PER_SESSION)', 15],
  'SAFARI_BAIT_CATCH_MULT':           ['(SAFARI_BAIT_CATCH_MULT)', 0.70],
  'SAFARI_ROCK_CATCH_MULT':           ['(SAFARI_ROCK_CATCH_MULT)', 1.65],
};
for (const [label, [expr, expected]] of Object.entries(ballChecks)) {
  let got;
  try { got = w.eval(expr); } catch (e) { fails.push(`${label}: eval threw ${e.message}`); continue; }
  if (got !== expected) {
    fails.push(`${label}: expected ${expected}, got ${got}`);
  } else {
    console.log(`✓ ${label} = ${got}`);
  }
}

// Shop catalogs — Wave 5B. Confirms CSV→JSON load + derived sets are populated.
const shopChecks = {
  'POKEMART_ITEMS.length':                   ['(POKEMART_ITEMS.length)', 16],
  'DEPT_ITEMS.length':                       ['(DEPT_ITEMS.length)', 14],
  'STONE_SHOP_ITEMS.length':                 ['(STONE_SHOP_ITEMS.length)', 24],
  'STONE_SHOP_ITEM_IDS.size':                ['(STONE_SHOP_ITEM_IDS.size)', 24],
  'STORY_BATTLE_BAG_SHOP_IDS.size':          ['(STORY_BATTLE_BAG_SHOP_IDS.size)', 27],
  'POKEMART pokeBall price':                 ['(POKEMART_ITEMS.find(x=>x.id==="pokeBall").price)', 500],
  'POKEMART pokeBall battleBag false':       ['(POKEMART_ITEMS.find(x=>x.id==="pokeBall").battleBag === false)', true],
  'DEPT greatBall price':                    ['(DEPT_ITEMS.find(x=>x.id==="greatBall").price)', 1000],
  'STONE fireStone has stone field':         ['(STONE_SHOP_ITEMS.find(x=>x.id==="fireStone").stone)', 'Fire Stone'],
  'STONE_SHOP_ITEM_IDS has dawnStone':       ['(STONE_SHOP_ITEM_IDS.has("dawnStone"))', true],
};
for (const [label, [expr, expected]] of Object.entries(shopChecks)) {
  let got;
  try { got = w.eval(expr); } catch (e) { fails.push(`${label}: eval threw ${e.message}`); continue; }
  if (got !== expected) {
    fails.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(got)}`);
  } else {
    console.log(`✓ ${label} = ${JSON.stringify(got)}`);
  }
}

if (fails.length) {
  console.error('\n❌ FAILURES:');
  for (const f of fails) console.error('  - ' + f);
  process.exit(1);
}
console.log('\n✓ Wave 5A/5B/5C/5D extraction smoke test passed');
process.exit(0);
