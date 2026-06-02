// Battle Dojo item recommender (redesign): profile-driven, tier-aware, 4 role slots
// (Primary / Sustain / Status / Defensive-tech), resist berry matched to the mon's
// worst weakness, and a "Foundation → Staples → Meta" tier retune that the foe item
// gate mirrors by derivation (foes can never out-tier the player).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;

function prime(city) {
  ST.sm.active = true; ST.sm.runSeed = 1; ST.sm._strngState = null;
  ST.sm.settings = { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
  ST.sm.badges = Math.max(0, city - 1); ST.sm.gold = 99999; ST.sm.inventory = ST.sm.inventory || {};
  let idx = 0;
  for (let ei = 0; ei <= 120; ei++) { let c = -1; try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {} if (c === city) { idx = ei; break; } }
  ST.sm.eventIndex = idx;
}
function recsFor(city, monName, build) {
  prime(city);
  const cap = (ST.npcStage('dojo') | 0) + 1;
  const mon = ST.buildPokemon(monName, build);
  const pool = (ST.tutorGetPoolForMon(monName).items) || [];
  const unlocked = pool.filter((it) => (ST.dojoItemTier(it) || 1) <= cap);
  return { recs: ST.txItemRecsByPurpose(unlocked, mon, build, monName), cap, pool };
}
const GARCHOMP = { m: ['Earthquake'], n: 'Jolly', a: 'Rough Skin' };
const TOXAPEX = { m: ['Scald'], n: 'Bold', a: 'Regenerator' };

test('tier map — Foundation (type-boosters) / Staples (Eviolite + Boots + AV) / Meta', () => {
  assert.equal(ST.dojoItemTier('Charcoal'), 1, 'type-booster is Foundation');
  assert.equal(ST.dojoItemTier('Dragon Fang'), 1);
  assert.equal(ST.dojoItemTier('Eviolite'), 2, 'Eviolite is a Black Belt (Staples) item, not White Belt');
  assert.equal(ST.dojoItemTier('Heavy-Duty Boots'), 2, 'Boots demoted to Staples');
  assert.equal(ST.dojoItemTier('Assault Vest'), 2, 'AV demoted to Staples');
  assert.equal(ST.dojoItemTier('Choice Band'), 3, 'Choice stays Meta');
  assert.equal(ST.dojoItemTier('Life Orb'), 3);
});

test('the mon\'s STAB type-boosters are injected into the Dojo item pool', () => {
  const pool = (ST.tutorGetPoolForMon('Garchomp').items) || [];
  assert.ok(pool.includes('Dragon Fang'), 'Dragon STAB booster present');
  assert.ok(pool.includes('Soft Sand'), 'Ground STAB booster present');
});

test('recs are distinct, role-tagged, and tier-legal at every belt', () => {
  for (const city of [2, 5, 8]) {
    const { recs, cap } = recsFor(city, 'Garchomp', GARCHOMP);
    assert.ok(recs.length >= 3 && recs.length <= 4, `City ${city}: 3-4 picks`);
    assert.equal(new Set(recs.map((r) => r.item)).size, recs.length, `City ${city}: no duplicates`);
    assert.ok(recs.every((r) => r.item && r.purpose && r.reason), `City ${city}: item+purpose+reason`);
    assert.ok(recs.every((r) => (ST.dojoItemTier(r.item) || 1) <= cap), `City ${city}: every pick is unlocked (≤ tier ${cap})`);
  }
});

test('White Belt picks are all Foundation (no Choice / Life Orb), and offense is a booster/berry', () => {
  const { recs } = recsFor(2, 'Garchomp', GARCHOMP);
  for (const r of recs) assert.equal(ST.dojoItemTier(r.item), 1, `${r.item} is a Foundation pick at White Belt`);
  const offensive = recs.find((r) => r.purpose === 'Offensive');
  assert.ok(offensive, 'an offensive slot exists for a sweeper');
  assert.ok(['Dragon Fang', 'Soft Sand', 'Liechi Berry', 'Salac Berry'].includes(offensive.item),
    `offense at White Belt is a type-booster or pinch berry (got ${offensive.item})`);
});

test('resist berry matches the mon\'s worst type weakness (Garchomp 4x Ice → Yache)', () => {
  const { recs } = recsFor(2, 'Garchomp', GARCHOMP);
  const def = recs.find((r) => r.purpose === 'Defensive');
  assert.ok(def, 'a defensive-tech slot exists');
  assert.equal(def.item, 'Yache Berry', 'Garchomp gets the Ice-resist berry for its 4x Ice weakness');
});

test('archetype: walls get a Bulk primary, sweepers get an Offensive primary', () => {
  const wall = recsFor(8, 'Toxapex', TOXAPEX).recs;
  assert.ok(wall.some((r) => r.purpose === 'Bulk'), 'Toxapex (wall) leads with a Bulk item');
  assert.ok(!wall.some((r) => r.purpose === 'Offensive'), 'a wall is not handed a Choice/offense primary');
  const sweeper = recsFor(8, 'Garchomp', GARCHOMP).recs;
  assert.ok(sweeper.some((r) => r.purpose === 'Offensive'), 'Garchomp (sweeper) gets an offensive primary');
});

test('foe item tier never exceeds the player\'s Dojo cap at any city (parity mirror)', () => {
  for (let c = 0; c <= 9; c++) {
    const foe = ST.storyFoeItemTier(c);
    const playerCap = (ST.npcStageForCity('dojo', c) | 0) + 1;
    assert.ok(foe <= playerCap, `City ${c}: foe item tier ${foe} must be ≤ player cap ${playerCap}`);
  }
});
