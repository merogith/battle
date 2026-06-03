// DRAFT — fills for the SPREAD / multi-target damage cluster.
// Promote per the test-coverage-filler workflow. Runs in CI as-is.
//
// Covers the it.todo() spread stubs (target allAdjacent / allAdjacentFoes) across
// by-category/{physical,special}.test.js. The generator todo's them because a
// multi-target move *looks* like it needs a doubles harness — but in the 1v1
// engine it simply resolves onto the lone foe. Setup-shape: one runTurn, assert
// the foe took damage, plus the deterministic (chance:100) secondary where the
// move has one. Damage-only cases use Sceptile (no type immunity, KO is fine);
// secondary cases use bulky Blissey so the foe survives to be inspected.
//
// Excluded (other clusters): variable power (Eruption/Water Spout/Dragon Energy/
// Magnitude), self-KO (Explosion/Self-Destruct/Mind Blown/Misty Explosion),
// trap-reactive (Shell Trap), charge (Razor Wind).
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../../../helpers/load-engine.js';

let mkMon, runTurn;
before(async () => {
  const e = await loadEngine();
  mkMon = e.mkMon;
  runTurn = e.runTurn;
});

async function spreadHit(move, { defender = 'Sceptile', boost = null, status = null } = {}) {
  const a = mkMon({ species: 'Mew', ability: 'None', moves: [move, 'Splash', 'Splash', 'Splash'] });
  const d = mkMon({ species: defender, ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  const before = d.currentHp;
  await runTurn({ playerMon: a, foeMon: d });
  assert.ok(d.currentHp < before, `${move} should damage the lone foe in singles`);
  if (boost) {
    const [stat, delta] = boost;
    assert.equal(d.stages[stat], delta, `${move} should apply ${stat} ${delta} to the foe`);
  }
  if (status) {
    assert.equal(String(d.status).toLowerCase(), status, `${move} should inflict ${status} on the foe`);
  }
}

// Damage-only spread moves: the only assertion is that the lone foe takes damage.
const DAMAGE_ONLY = [
  // physical
  'Brutal Swing', 'Diamond Storm', 'Earthquake', 'Glacial Lance', 'Petal Blizzard',
  'Precipice Blades', 'Razor Leaf', 'Rock Slide', 'Thousand Arrows', 'Thousand Waves',
  "Land's Wrath",
  // special
  'Acid', 'Air Cutter', 'Astral Barrage', 'Bleakwind Storm', 'Blizzard', 'Boomburst',
  'Bubble', 'Burning Jealousy', 'Clanging Scales', 'Core Enforcer', 'Dazzling Gleam',
  'Disarming Voice', 'Discharge', 'Fiery Wrath', 'Heat Wave', 'Hyper Voice', 'Incinerate',
  'Lava Plume', 'Make It Rain', 'Matcha Gotcha', 'Muddy Water', 'Nihil Light', 'Origin Pulse',
  'Overdrive', 'Parabolic Charge', 'Polar Flare', 'Powder Snow', 'Relic Song', 'Sandsear Storm',
  'Searing Shot', 'Sludge Wave', 'Sparkling Aria', 'Splishy Splash', 'Springtide Storm',
  'Surf', 'Swift', 'Synchronoise', 'Twister', 'Wildbolt Storm',
];

// Spread moves whose 100%-chance secondary is deterministic — checked on a bulky
// foe so it survives the hit.
const WITH_SECONDARY = [
  ['Breaking Swipe', { boost: ['atk', -1] }],
  ['Bulldoze', { boost: ['spe', -1] }],
  ['Electroweb', { boost: ['spe', -1] }],
  ['Glaciate', { boost: ['spe', -1] }],
  ['Icy Wind', { boost: ['spe', -1] }],
  ['Snarl', { boost: ['spa', -1] }],
  ['Struggle Bug', { boost: ['spa', -1] }],
  ['Mortal Spin', { status: 'psn' }],
];

describe('Spread / multi-target moves (draft fills)', () => {
  for (const move of DAMAGE_ONLY) {
    it(`${move} (damages lone foe)`, () => spreadHit(move));
  }
  for (const [move, opts] of WITH_SECONDARY) {
    const label = opts.status ? `inflicts ${opts.status}` : `${opts.boost[0]} ${opts.boost[1]}`;
    it(`${move} (damage + ${label})`, () => spreadHit(move, { defender: 'Blissey', ...opts }));
  }
});
