// Property test: damaging moves are correctly modified by the 18-type effectiveness chart.
// Iterates a representative sample of type matchups (super-effective, resist, immune).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

// Pick a single "canonical" damaging move per type at ~80 BP for stable damage scaling.
const CANONICAL_MOVE = {
  Normal: 'Body Slam',     // 85 BP
  Fire: 'Flamethrower',    // 90 BP
  Water: 'Surf',           // 90 BP
  Grass: 'Energy Ball',    // 90 BP
  Electric: 'Thunderbolt', // 90 BP
  Ice: 'Ice Beam',         // 90 BP
  Fighting: 'Aura Sphere', // 80 BP
  Poison: 'Sludge Bomb',   // 90 BP
  Ground: 'Earth Power',   // 90 BP
  Flying: 'Air Slash',     // 75 BP
  Psychic: 'Psychic',      // 90 BP
  Bug: 'Bug Buzz',         // 90 BP
  Rock: 'Power Gem',       // 80 BP
  Ghost: 'Shadow Ball',    // 80 BP
  Dragon: 'Draco Meteor',  // 130 BP (no 90BP basic Dragon move)
  Dark: 'Dark Pulse',      // 80 BP
  Steel: 'Flash Cannon',   // 80 BP
  Fairy: 'Moonblast',      // 95 BP
};

// Pure-type Pokemon to use as defenders.
const PURE_TYPE_DEFENDER = {
  Normal: 'Snorlax',
  Fire: 'Charmander',
  Water: 'Squirtle',
  Grass: 'Tangela',
  Electric: 'Pikachu',
  Ice: 'Jynx',           // Ice/Psychic; closest pure-ish Ice mon
  Fighting: 'Machop',
  Poison: 'Grimer',
  Ground: 'Sandshrew',
  Flying: 'Tornadus',    // flying
  Psychic: 'Mew',
  Bug: 'Caterpie',
  Rock: 'Geodude',       // Rock/Ground; will affect Ground matchup
  Ghost: 'Gastly',       // Ghost/Poison
  Dragon: 'Dratini',
  Dark: 'Umbreon',
  Steel: 'Klink',
  Fairy: 'Clefairy',
};

// Sample of super-effective matchups (subset, focused on uncontested cases)
const SUPER_EFFECTIVE = [
  ['Fire', 'Grass'], ['Fire', 'Bug'], ['Fire', 'Steel'],
  ['Water', 'Fire'], ['Water', 'Ground'],
  ['Grass', 'Water'],
  ['Electric', 'Water'],
  ['Ice', 'Grass'], ['Ice', 'Dragon'],
  ['Fighting', 'Normal'], ['Fighting', 'Ice'], ['Fighting', 'Dark'], ['Fighting', 'Steel'],
  ['Psychic', 'Fighting'], ['Psychic', 'Poison'],
  ['Bug', 'Psychic'], ['Bug', 'Dark'],
  ['Dark', 'Psychic'], ['Dark', 'Ghost'],
  ['Steel', 'Fairy'], ['Steel', 'Ice'],
  ['Fairy', 'Fighting'], ['Fairy', 'Dragon'], ['Fairy', 'Dark'],
];

// Sample of immunity matchups
const IMMUNITIES = [
  ['Normal', 'Ghost'],
  ['Fighting', 'Ghost'],
  ['Electric', 'Ground'],
  ['Psychic', 'Dark'],
  ['Ghost', 'Normal'],
  ['Dragon', 'Fairy'],
];

async function damageOf(engineHandle, attackerType, moveName, defenderSpecies) {
  const { mkMon, runTurn } = engineHandle;
  const a = mkMon({ species: 'Mew', ability: 'None', moves: [moveName, 'Splash', 'Splash', 'Splash'] });
  const d = mkMon({ species: defenderSpecies, ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  a.item = null; d.item = null;
  d.maxHp = 9999; d.currentHp = 9999;
  await runTurn({ playerMon: a, foeMon: d });
  return 9999 - d.currentHp;
}

test('super-effective hits deal more damage than resisted hits on the same defender', async (t) => {
  // Picking a clean baseline (neutral defender per move type) is fragile because
  // some "neutral" choices are actually resisted. Instead compare SE vs resisted on
  // the SAME defender by varying the attacker's move - directly proves the chart works.
  const engineHandle = await loadEngine();
  engineHandle.window.Math.random = () => 0.99;
  const { mkMon, runTurn } = engineHandle;
  const failures = [];

  // Pairs of (defender species, super-effective move, resisted move, expected SE-much-higher-than-resisted)
  const cases = [
    ['Sceptile', 'Ice Beam',     'Energy Ball'],  // Grass: SE Ice, resist Grass
    ['Charizard','Surf',         'Flamethrower'], // Fire/Flying: SE Water, resist Fire
    ['Gyarados', 'Thunderbolt',  'Surf'],         // Water/Flying: 4x Electric, resist Water
    ['Magnemite','Earth Power',  'Flash Cannon'], // Steel/Electric: 4x SE Ground, resist Steel
    ['Skarmory', 'Flamethrower', 'Earth Power'],  // Steel/Flying: SE Fire, immune to Ground (skip immune)
  ];

  for (const [species, seMove, resistedMove] of cases) {
    const a1 = mkMon({ species: 'Mew', ability: 'None', moves: [seMove, 'Splash', 'Splash', 'Splash'] });
    const d1 = mkMon({ species, ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    a1.item = null; d1.maxHp = 9999; d1.currentHp = 9999;
    await runTurn({ playerMon: a1, foeMon: d1 });
    const dmgSE = 9999 - d1.currentHp;

    const a2 = mkMon({ species: 'Mew', ability: 'None', moves: [resistedMove, 'Splash', 'Splash', 'Splash'] });
    const d2 = mkMon({ species, ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    a2.item = null; d2.maxHp = 9999; d2.currentHp = 9999;
    await runTurn({ playerMon: a2, foeMon: d2 });
    const dmgResisted = 9999 - d2.currentHp;

    if (dmgResisted > 0 && dmgSE <= dmgResisted * 2) {
      failures.push({ species, seMove, resistedMove, dmgSE, dmgResisted, ratio: (dmgSE/dmgResisted).toFixed(2) });
    }
  }

  if (failures.length > 0) {
    t.diagnostic(`${failures.length} super-effective comparisons failed:`);
    for (const f of failures) {
      t.diagnostic(`  vs ${f.species}: ${f.seMove}=${f.dmgSE}, ${f.resistedMove}=${f.dmgResisted}, ratio=${f.ratio}`);
    }
  }
  assert.equal(failures.length, 0, `${failures.length} type effectiveness comparisons broken`);
});

test('type immunities deal zero damage', async (t) => {
  const engineHandle = await loadEngine();
  engineHandle.window.Math.random = () => 0.99;
  const failures = [];
  for (const [moveType, defType] of IMMUNITIES) {
    const moveName = CANONICAL_MOVE[moveType];
    const defender = PURE_TYPE_DEFENDER[defType];
    const dmg = await damageOf(engineHandle, moveType, moveName, defender);
    if (dmg > 0) {
      failures.push({ move: moveName, defType, dmg });
    }
  }
  if (failures.length > 0) {
    t.diagnostic(`${failures.length} immunity matchups dealt damage:`);
    for (const f of failures) {
      t.diagnostic(`  ${f.move} vs ${f.defType}: dealt ${f.dmg}`);
    }
  }
  assert.equal(failures.length, 0, `${failures.length} type immunities broken`);
});
