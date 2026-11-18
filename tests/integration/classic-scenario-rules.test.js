import { Battle, extractChannelMessages } from '@pkmn/sim';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { attachClassicScenarioRules } from '../../scripts/competitive/classic-scenario-rules.mjs';

const seed = [123, 456, 789, 1011];
const mew = (move, props = {}) => ({ species: 'Mew', moves: [move], level: 50, ability: 'Synchronize', ...props });
const snorlax = (move = 'Splash') => ({ species: 'Snorlax', moves: [move], level: 50, ability: 'Immunity' });

function start(player, foe, scenario, lead = 'team 1') {
  const battle = new Battle({
    formatid: 'gen9customgame', seed, strictChoices: true,
    p1: { name: 'Player', team: player },
    p2: { name: 'Foe', team: foe },
  });
  for (const side of battle.sides) {
    side.pokemon.forEach((pokemon, slot) => { pokemon.classicSlot = slot; });
  }
  attachClassicScenarioRules(battle, { scenario });
  battle.choose('p1', lead);
  battle.choose('p2', 'team 1');
  return battle;
}

function turn(battle, p1 = 'move 1', p2 = 'move 1') {
  battle.choose('p1', p1);
  battle.choose('p2', p2);
}

function damage(battle, side = 'p2') {
  const target = battle[side].active[0];
  return target.maxhp - target.hp;
}

test('story power ceilings use party slots after Team Preview rearranges the leads', () => {
  const standard = start([mew('Tackle')], [snorlax()]);
  const capped = start([mew('Splash'), mew('Strength')], [snorlax()], {
    caps: { p1: [80, 40], p2: [0] },
  }, 'team 21');
  turn(standard);
  turn(capped);
  assert.equal(capped.p1.active[0].classicSlot, 1);
  assert.equal(damage(capped), damage(standard));
});

test('variable-power and fixed-damage moves honor their acting side’s Story ceiling', () => {
  const standard = start([mew('Tackle')], [snorlax()]);
  const capped = start([mew('Flail')], [snorlax()], { caps: { p1: [40] } });
  const standardMove = standard.dex.getActiveMove('Tackle');
  const cappedMove = capped.dex.getActiveMove('Flail');
  capped.p1.active[0].hp = 1;
  const normalDamage = standard.actions.getDamage(standard.p1.active[0], standard.p2.active[0], standardMove);
  assert.equal(capped.actions.getDamage(capped.p1.active[0], capped.p2.active[0], cappedMove), normalDamage);

  const fixed = start([mew('Splash')], [mew('Night Shade')], { caps: { p1: [60], p2: [40] } });
  turn(fixed);
  assert.equal(damage(fixed, 'p1'), 40);
});

test('Story adds its field effects at first entry and restores their remaining duration', () => {
  const scenario = {
    weather: { id: 'Rain', turns: 3 },
    terrain: { id: 'Electric', turns: 4 },
    rooms: { trickroom: 5, gravity: 7 },
  };
  const battle = start([mew('Splash')], [snorlax()], scenario);
  assert.equal(battle.field.weather, 'raindance');
  assert.equal(battle.field.terrain, 'electricterrain');
  assert.equal(battle.field.pseudoWeather.trickroom.duration, 5);
  turn(battle);
  const restored = Battle.fromJSON(JSON.stringify(battle.toJSON()));
  attachClassicScenarioRules(restored, { scenario });
  assert.equal(restored.field.weatherState.duration, 2);
  assert.equal(restored.field.terrainState.duration, 3);
  assert.equal(restored.field.pseudoWeather.gravity.duration, 6);
  turn(restored);
  assert.equal(restored.field.weatherState.duration, 1);
});

test('cycling weather applies on its last turn, rotates once, and replays after restore', () => {
  const scenario = {
    randomWeather: true,
    randomTerrain: true,
    weather: { id: 'Sandstorm', turns: 1 },
    terrain: { id: 'Misty', turns: 1 },
  };
  const battle = start([mew('Splash')], [snorlax()], scenario);
  const restored = Battle.fromJSON(JSON.stringify(battle.toJSON()));
  attachClassicScenarioRules(restored, { scenario });
  turn(battle);
  turn(restored);

  const player = battle.p1.active[0];
  assert.equal(player.maxhp - player.hp, Math.floor(player.maxhp / 16));
  assert.notEqual(battle.field.weather, 'sandstorm');
  assert.notEqual(battle.field.terrain, 'mistyterrain');
  assert.equal(battle.field.weatherState.duration || 0, battle.field.weather ? 5 : 0);
  assert.equal(battle.field.terrainState.duration || 0, battle.field.terrain ? 5 : 0);

  const snapshot = current => ({
    field: current.field.toJSON(), seed: current.prng.getSeed(),
    hp: current.sides.map(side => side.active[0].hp),
  });
  assert.deepEqual(snapshot(restored), snapshot(battle));
  for (let i = 0; i < 5; i++) {
    turn(battle);
    turn(restored);
    assert.deepEqual(snapshot(restored), snapshot(battle));
  }
});

test('cycling yields to permanent ability weather and locked authored terrain', () => {
  const scenario = {
    randomWeather: true,
    randomTerrain: true,
    weather: { id: 'Rain', turns: 1 },
    terrain: { id: 'Electric', turns: 1, locked: true },
  };
  const primal = { species: 'Groudon-Primal', ability: 'Desolate Land', level: 50, moves: ['Splash'] };
  const battle = start([mew('Splash')], [primal], scenario);
  for (let i = 0; i < 6; i++) {
    turn(battle);
    assert.equal(battle.field.weather, 'desolateland');
    assert.equal(battle.field.terrain, 'electricterrain');
  }
});

test('Story damage effects apply once per hit and banter applies only to the player', () => {
  const standard = start([mew('Tackle', { item: 'Life Orb' })], [snorlax()]);
  const scenario = { glassCannon: true, typeAmplifier: 'Normal', banter: 1.05 };
  const battle = start([mew('Tackle', { item: 'Life Orb' })], [snorlax()], scenario);
  turn(standard);
  turn(battle);
  const amplified = Math.floor(Math.floor(Math.floor(damage(standard) * 1.25) * 1.3) * 1.15);
  assert.equal(damage(battle), Math.floor(amplified * 1.05));

  const noMod = start([mew('Splash')], [snorlax('Tackle')], { glassCannon: true });
  const banterMod = start([mew('Splash')], [snorlax('Tackle')], { glassCannon: true, banter: 1.05 });
  turn(noMod);
  turn(banterMod);
  assert.equal(damage(noMod, 'p1'), damage(banterMod, 'p1'));
});

test('Chaos adds two crit stages while Tracking Lens overrides its damaging-move miss penalty', () => {
  const battle = start([mew('Fire Blast')], [snorlax()], { chaosAmulet: true, typeMagnetizer: 'Psychic' });
  const source = battle.p1.active[0];
  const target = battle.p2.active[0];
  const move = battle.dex.getActiveMove('Fire Blast');
  assert.equal(battle.runEvent('Accuracy', target, source, move, 85), true);
  assert.equal(battle.runEvent('Accuracy', target, source, battle.dex.getActiveMove('Hypnosis'), 60), 54);
  assert.equal(battle.runEvent('ModifyCritRatio', source, target, move, 1), 3);
});

test('Berserker applies its own entry effects under Stagnation, which blocks voluntary and opposing boosts', () => {
  const battle = start([mew('Swords Dance')], [snorlax('Growl')], {
    berserkerSerum: true, stagnationCore: true,
  });
  const active = battle.p1.active[0];
  assert.equal(active.boosts.atk, 1);
  assert.equal(active.boosts.spd, -1);
  turn(battle);
  assert.equal(active.boosts.atk, 1);
  assert.equal(active.boosts.spd, -1);
});

test('Memory Disc blocks passive damage without blocking direct attacks', () => {
  const battle = start([mew('Splash')], [snorlax('Tackle')], { typeNullifier: 'Psychic' });
  const active = battle.p1.active[0];
  active.setStatus('brn');
  const directOnly = start([mew('Splash')], [snorlax('Tackle')], { typeNullifier: 'Psychic' });
  turn(battle);
  turn(directOnly);
  assert.equal(damage(battle, 'p1'), damage(directOnly, 'p1'));
  assert.ok(damage(battle, 'p1') > 0);
  assert.ok(battle.log.some(line => line.includes('Memory Disc')));
});

test('Heavy Gravity uses pre-rounding hazard fractions for the incoming Pokémon', () => {
  const skarmory = {
    species: 'Skarmory', ability: 'Keen Eye', level: 50, moves: ['Stealth Rock', 'Harden'],
  };
  const battle = start([mew('Growl'), snorlax()], [skarmory], {
    rooms: { gravity: 999 }, heavyGravityHazardMult: 1.5,
  }, 'team 12');
  turn(battle);
  turn(battle, 'switch 2', 'move 2');
  assert.equal(damage(battle, 'p1'), Math.floor(battle.p1.active[0].maxhp * 1.5 / 8));
});

test('Eviolite Blessing matches an active Eviolite and does not stack with it', () => {
  const pikachu = { species: 'Pikachu', level: 50, ability: 'Static', moves: ['Splash'] };
  const item = { ...pikachu, item: 'Eviolite' };
  const standard = start([item], [snorlax('Tackle')]);
  const blessing = start([pikachu], [snorlax('Tackle')], { evioliteBlessing: true });
  const combined = start([item], [snorlax('Tackle')], { evioliteBlessing: true });
  for (const battle of [standard, blessing, combined]) turn(battle);
  assert.equal(damage(blessing, 'p1'), damage(standard, 'p1'));
  assert.equal(damage(combined, 'p1'), damage(standard, 'p1'));
});

test('Reaper’s Toll rallies both sides and chooses one survivor per side', () => {
  const battle = start([mew('Night Shade'), mew('Splash')], [mew('Splash'), mew('Splash')], {
    reapersToll: true,
  }, 'team 12');
  const playerTeam = battle.p1.pokemon;
  const foeReserve = battle.p2.pokemon[1];
  for (const pokemon of [...playerTeam, foeReserve]) pokemon.hp -= 40;
  battle.p2.active[0].hp = 1;
  turn(battle);
  for (const pokemon of [...playerTeam, foeReserve]) {
    assert.equal(pokemon.hp, pokemon.maxhp - 40 + Math.floor(pokemon.maxhp / 10));
  }
  assert.equal(playerTeam.filter(pokemon => pokemon.boosts.spd === -1).length, 1);
  assert.equal(foeReserve.boosts.spd, -1);
});

test('Crobat Fang Charm heals after hitting a Substitute and takes its residual toll', () => {
  const player = mew('Tackle', { moves: ['Tackle', 'Splash'] });
  const foe = snorlax('Substitute');
  foe.moves.push('Splash');
  foe.ability = 'Magic Guard';
  const battle = start([player], [foe], { vampiricFangs: true });
  turn(battle, 'move 2', 'move 1');
  const source = battle.p1.active[0];
  const target = battle.p2.active[0];
  const priorHP = source.hp;
  const priorSub = target.volatiles.substitute.hp;
  assert.equal(priorHP, source.maxhp - Math.floor(source.maxhp / 16));
  turn(battle, 'move 1', 'move 2');
  const absorbed = priorSub - (target.volatiles.substitute?.hp ?? 0);
  assert.ok(absorbed > 0);
  assert.equal(source.hp, priorHP - Math.floor(source.maxhp / 16) + Math.max(1, Math.floor(absorbed / 10)));
  assert.ok(battle.log.some(line => line.includes('[from] Crobat Fang Charm') && line.includes('-heal')));
});

test('Crobat Fang Charm heals before normal move recoil and only once per move', () => {
  const battle = start([mew('Wild Charge')], [snorlax()], { vampiricFangs: true });
  battle.p1.active[0].hp -= 40;
  turn(battle);
  const publicLog = extractChannelMessages(battle.log.join('\n'), [0])[0];
  const healingLines = publicLog.filter(line => line.includes('[from] Crobat Fang Charm') && line.includes('-heal'));
  assert.equal(healingLines.length, 1);
  const healingIndex = publicLog.indexOf(healingLines[0]);
  const recoilIndex = publicLog.findIndex(line => line.includes('[from] Recoil') || line.includes('[from] recoil'));
  assert.ok(recoilIndex > healingIndex);
});
