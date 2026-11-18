import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Battle } from '@pkmn/sim';
import { toShowdownSet } from '../differential/showdown-oracle.mjs';
import { loadEngine } from '../helpers/load-engine.js';

const legacy = await loadEngine();
const neutralSide = { reflect: 0, lightScreen: 0, auroraVeil: 0, luckychant: 0 };
const fixture = (species, move, extra = {}) => ({ species, moves: [move], ability: 'Pressure', ...extra });
const cases = [
  { name: 'Hydro Steam gets its own sun boost', attacker: fixture('Walking Wake', 'Hydro Steam'), weather: 'Sun' },
  { name: 'ordinary Fire damage is weather-modified after the base formula', attacker: fixture('Mew', 'Flamethrower'), weather: 'Sun' },
  { name: 'Expanding Force combines its 1.5× with Psychic Terrain', attacker: fixture('Mew', 'Expanding Force'), terrain: 'Psychic' },
  { name: 'Hard Press caps at 100 power', attacker: fixture('Mew', 'Hard Press'), hp: 200 },
  { name: 'Gyro Ball reads item-modified Speed', attacker: fixture('Mew', 'Gyro Ball', { item: 'Iron Ball' }) },
  { name: 'Sniper is a late damage modifier on critical hits', attacker: fixture('Kingdra', 'Water Gun', { ability: 'Sniper' }), critical: true },
  { name: 'critical Sacred Sword ignores a Defense drop', attacker: fixture('Gallade', 'Sacred Sword'), critical: true, defenderStages: { def: -2 } },
  { name: 'Adaptability does not boost the original type after an off-type Tera', attacker: fixture('Porygon-Z', 'Tri Attack', { ability: 'Adaptability' }), tera: 'Ghost' },
  { name: 'matching Tera type floors an eligible move at 60 power', attacker: fixture('Mew', 'Water Gun'), tera: 'Water' },
  { name: 'matching Tera type does not floor priority moves', attacker: fixture('Mew', 'Quick Attack'), tera: 'Normal' },
  { name: 'Triple Axel retains separate 20, 40 and 60 power strikes after Tera', attacker: fixture('Mew', 'Triple Axel', { ability: 'Skill Link' }), tera: 'Ice', followupCrits: [false, false] },
  { name: 'a later critical hit bypasses Reflect and stat penalties', attacker: fixture('Mew', 'Dual Wingbeat'), attackerStages: { atk: -2 }, defenderStages: { def: 2 }, reflect: true, followupCrits: [true] },
  { name: 'Multiscale protects only the first strike at full HP', attacker: fixture('Mew', 'Double Kick'), defender: fixture('Dragonite', 'Splash', { ability: 'Multiscale', evs: { hp: 252, def: 252 } }), followupCrits: [false] },
  { name: 'Charcoal boosts power before the damage formula', attacker: fixture('Mew', 'Fire Blast', { item: 'Charcoal' }) },
  { name: 'Muscle Band boosts power before the damage formula', attacker: fixture('Mew', 'Strength', { item: 'Muscle Band' }) },
  { name: 'Tera Shell makes super-effective damage resisted', attacker: fixture('Mew', 'Aura Sphere'), defender: fixture('Terapagos-Terastal', 'Splash', { ability: 'Tera Shell' }) },
];

function createOracle(attackerSpec, defenderSpec) {
  const battle = new Battle({
    formatid: 'gen9customgame',
    p1: { team: [toShowdownSet(attackerSpec)] },
    p2: { team: [toShowdownSet(defenderSpec)] },
  });
  battle.makeChoices('team 1', 'team 1');
  return battle;
}

test('legal Level 50 spreads produce the same HP and nature-adjusted stats', () => {
  const specs = [
    fixture('Garchomp', 'Earthquake', { nature: 'Adamant', evs: { atk: 252, spe: 252, hp: 6 }, ivs: { spe: 30, spa: 0 } }),
    fixture('Shedinja', 'Shadow Sneak', { nature: 'Brave', evs: { atk: 252, def: 252, spd: 4 }, ivs: { spe: 0 } }),
  ];
  const oracle = createOracle(...specs);
  for (const [index, spec] of specs.entries()) {
    const mon = legacy.mkMon(spec);
    const expected = oracle.sides[index].active[0];
    assert.equal(mon.maxHp, expected.maxhp, spec.species);
    for (const stat of ['atk', 'def', 'spa', 'spd', 'spe']) {
      assert.equal(mon.stats[stat], expected.storedStats[stat], `${spec.species} ${stat}`);
    }
  }
});

function oracleDamage(spec, defenderSpec) {
  const battle = createOracle(spec.attacker, defenderSpec);
  const [attacker, defender] = battle.sides.map(side => side.active[0]);
  if (spec.weather) battle.field.setWeather('sunnyday', attacker);
  if (spec.terrain) battle.field.setTerrain('psychicterrain', attacker);
  if (spec.hp) defender.hp = spec.hp;
  if (spec.attackerStages) Object.assign(attacker.boosts, spec.attackerStages);
  if (spec.defenderStages) Object.assign(defender.boosts, spec.defenderStages);
  if (spec.reflect) defender.side.addSideCondition('reflect', defender);
  if (spec.tera) attacker.terastallized = spec.tera;
  const move = battle.dex.getActiveMove(spec.attacker.moves[0]);
  battle.randomizer = base => base;
  const startHp = defender.hp;
  const hits = [!!spec.critical, ...(spec.followupCrits || [])];
  for (const [index, crit] of hits.entries()) {
    move.hit = index + 1;
    move.willCrit = crit;
    defender.hp -= Math.min(defender.hp, battle.actions.getDamage(attacker, defender, move, true));
  }
  return startHp - defender.hp;
}

async function legacyDamage(spec, defenderSpec) {
  const { window, engine, reset, mkMon, nextFloat } = legacy;
  reset();
  const attacker = mkMon(spec.attacker);
  const defender = mkMon(defenderSpec);
  if (spec.hp) defender.currentHp = spec.hp;
  if (spec.attackerStages) Object.assign(attacker.stages, spec.attackerStages);
  if (spec.defenderStages) Object.assign(defender.stages, spec.defenderStages);
  if (spec.tera) {
    attacker.originalType1 = attacker.type1;
    attacker.originalType2 = attacker.type2;
    attacker.type1 = spec.tera;
    attacker.type2 = '';
    attacker.teraActivated = true;
    attacker.buildData.teraType = spec.tera;
  }
  const fields = {
    weather: spec.weather || null, weatherTurns: spec.weather ? 5 : 0,
    terrain: spec.terrain || null, terrainTurns: spec.terrain ? 5 : 0,
    trickRoom: 0, gravity: 0, magicRoom: 0, wonderRoom: 0,
  };
  Object.assign(engine.state, fields, {
    mode: 'pve', pActive: attacker, fActive: defender, playerParty: [attacker], foeParty: [defender],
    pSide: { ...neutralSide }, fSide: { ...neutralSide, reflect: spec.reflect ? 5 : 0 },
  });
  const before = defender.currentHp;
  const rolls = [0.5, spec.critical ? 0 : 0.99, 0.99];
  for (const crit of spec.followupCrits || []) rolls.push(crit ? 0 : 0.99, 0.99);
  const originalLog = window.logMsg;
  let armed = false;
  window.logMsg = (text, ...args) => {
    if (String(text).includes(`used ${spec.attacker.moves[0]}!`)) armed = true;
    originalLog(text, ...args);
  };
  window.Math.random = () => armed ? (rolls.shift() ?? 0.99) : 0.99;
  engine.setForcedFoeMoveSlot(0);
  try {
    await window.playTurn(0, null);
    assert.equal(rolls.length, 0, 'accuracy, critical hit and damage rolls ran');
    return before - defender.currentHp;
  } finally {
    window.logMsg = originalLog;
    window.Math.random = nextFloat;
  }
}

for (const spec of cases) {
  test(spec.name, async () => {
    const defender = spec.defender || fixture('Blissey', 'Splash', { evs: { hp: 252, def: 252 } });
    const expected = oracleDamage(spec, defender);
    assert.ok(expected > 0);
    assert.equal(await legacyDamage(spec, defender), expected);
  });
}
