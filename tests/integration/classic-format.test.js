import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Battle, State } from '@pkmn/sim';
import {
  classicFormsFor,
  createClassicBattle,
  restoreClassicBattle,
} from '../../scripts/competitive/classic-format.mjs';

const snorlax = { species: 'Snorlax', ability: 'Thick Fat', moves: ['Body Slam'], level: 50 };
const venusaur = { species: 'Venusaur', ability: 'Overgrow', item: 'Venusaurite', moves: ['Growth'], level: 50 };
const charizard = { species: 'Charizard', ability: 'Blaze', item: 'Charizardite X', moves: ['Swords Dance'], level: 50 };
const blissey = { species: 'Blissey', ability: 'Natural Cure', moves: ['Splash'], level: 100 };
const pikachu = { species: 'Pikachu', ability: 'Static', item: 'Normalium Z', moves: ['Swift'], level: 50 };
const squirtle = { species: 'Squirtle', ability: 'Torrent', teraType: 'Water', moves: ['Withdraw'], level: 50 };
const hitmontop = { species: 'Hitmontop', ability: 'Intimidate', moves: ['Fake Out', 'Splash'], level: 50 };

function setup(players, foes = [[blissey]], formBudget = 'per-form') {
  const options = {
    seed: '1,2,3,4',
    p1: { name: 'P1', team: players.map(([set]) => ({ ...set })) },
    p2: { name: 'P2', team: foes.map(([set]) => ({ ...set })) },
  };
  const battle = createClassicBattle(options, { formBudget });
  for (const [side, party] of [[battle.p1, players], [battle.p2, foes]]) {
    for (const [index, [, form, tera]] of party.entries()) {
      side.pokemon[index].classicForm = form;
      side.pokemon[index].classicTeraType = tera;
    }
  }
  choose(battle, 'team 1', 'team 1');
  return battle;
}

function choose(battle, player, foe = 'move 1') {
  assert.equal(battle.choose('p1', player), true, battle.p1.choice.error);
  assert.equal(battle.choose('p2', foe), true, battle.p2.choice.error);
}

test('Classic exposes Mega, Z-Move, Gigantamax and Tera in the same Gen 9 singles battle', () => {
  const battle = setup([
    [charizard, 'MEGA'], [snorlax, 'GMAXDYNAMAX'], [pikachu, 'ZMOVE'], [squirtle, undefined, 'Water'],
  ]);
  assert.deepEqual(classicFormsFor(battle, battle.p1).map(form => form.kind), ['mega']);
  choose(battle, 'move 1 mega');
  assert.equal(battle.p1.active[0].species.id, 'charizardmegax');
  choose(battle, 'switch 2');
  choose(battle, 'move 1 dynamax');
  assert.match(battle.log.join('\n'), /G-Max Replenish/);
  assert.equal(battle.p1.active[0].maxhp, battle.p1.active[0].baseMaxhp * 2);
  choose(battle, 'switch 3');
  choose(battle, 'move 1 zmove');
  assert.match(battle.log.join('\n'), /Breakneck Blitz/);
  choose(battle, 'switch 4');
  choose(battle, 'move 1 terastallize');
  assert.equal(battle.p1.active[0].terastallized, 'Water');
  assert.deepEqual(battle.p1.classicFormsUsed, {
    mega: true, dynamax: true, zmove: true, terastallize: true,
  });
});

test('a shared budget blocks the next form on the same side and leaves the opposing budget available', () => {
  const battle = setup([[charizard, 'MEGA'], [snorlax, 'DYNAMAX']], [[venusaur, 'MEGA']], 'shared');
  choose(battle, 'move 1 mega');
  assert.deepEqual(classicFormsFor(battle, battle.p2).map(form => form.kind), ['mega']);
  choose(battle, 'switch 2', 'move 1 mega');
  assert.deepEqual(classicFormsFor(battle, battle.p1), []);
  assert.equal(battle.choose('p1', 'move 1 dynamax'), false);
  assert.equal(battle.p2.active[0].species.id, 'venusaurmega');
});

test('Unlimited allows a second user of a form while tracking each individual activation', () => {
  const teams = [[charizard, 'MEGA'], [venusaur, 'MEGA']];
  const limited = setup(teams);
  choose(limited, 'move 1 mega');
  choose(limited, 'switch 2');
  assert.deepEqual(classicFormsFor(limited, limited.p1), []);

  const unlimited = setup(teams, [[blissey]], 'per-pokemon');
  choose(unlimited, 'move 1 mega');
  choose(unlimited, 'switch 2');
  choose(unlimited, 'move 1 mega');
  assert.equal(unlimited.p1.active[0].species.id, 'venusaurmega');
  assert.deepEqual(classicFormsFor(unlimited, unlimited.p1), []);
  assert.ok(unlimited.p1.pokemon.every(mon => mon.classicFormsUsed.mega));
});

test('Fake Out flinch leaves an unexecuted Z-Move available', () => {
  const battle = setup([[pikachu, 'ZMOVE']], [[hitmontop]], 'shared');
  choose(battle, 'move 1 zmove');
  assert.equal(battle.p1.classicFormsUsed, undefined);
  assert.deepEqual(classicFormsFor(battle, battle.p1).map(form => form.kind), ['zmove']);
  choose(battle, 'move 1 zmove', 'move 2');
  assert.equal(battle.p1.classicFormsUsed.zmove, true);
});

test('Unlimited permits a second Z-Move while retaining each Pokémon’s consumed slot', () => {
  const battle = setup([[pikachu, 'ZMOVE'], [pikachu, 'ZMOVE']], undefined, 'per-pokemon');
  choose(battle, 'move 1 zmove');
  choose(battle, 'switch 2');
  assert.deepEqual(classicFormsFor(battle, battle.p1).map(form => form.kind), ['zmove']);
  choose(battle, 'move 1 zmove');
  assert.equal(battle.log.filter(line => line.startsWith('|-zpower|')).length, 2);
  assert.ok(battle.p1.pokemon.every(mon => mon.classicFormsUsed.zmove));
});

test('historical Pursuit still intercepts the departing Pokémon under Classic rules', () => {
  const tyranitar = { species: 'Tyranitar', ability: 'Unnerve', moves: ['Pursuit'], level: 50 };
  const starmie = { species: 'Starmie', ability: 'Natural Cure', moves: ['Splash'], level: 100 };
  const battle = setup([[tyranitar]], [[starmie], [blissey]]);
  const departing = battle.p2.active[0];
  choose(battle, 'move 1', 'switch 2');
  assert.ok(departing.hp < departing.maxhp);
  assert.equal(battle.p2.active[0].species.id, 'blissey');
  assert.equal(battle.p2.active[0].hp, battle.p2.active[0].maxhp);
});

test('Primal Reversion happens on entry without consuming the shared manual budget', () => {
  const kyogre = { species: 'Kyogre', ability: 'Drizzle', item: 'Blue Orb', moves: ['Aqua Ring'], level: 50 };
  const rayquaza = { species: 'Rayquaza', ability: 'Air Lock', moves: ['Dragon Ascent'], level: 50 };
  const battle = setup([[kyogre], [rayquaza, 'MEGA']], undefined, 'shared');
  assert.equal(battle.p1.active[0].species.id, 'kyogreprimal');
  assert.equal(battle.p1.classicFormsUsed, undefined);
  choose(battle, 'switch 2');
  choose(battle, 'move 1 mega');
  assert.equal(battle.p1.active[0].species.id, 'rayquazamega');
});

test('snapshot restore preserves active Max requests and the per-Pokémon activation history', () => {
  const battle = setup([[snorlax, 'DYNAMAX'], [charizard, 'MEGA']], undefined, 'shared');
  choose(battle, 'move 1 dynamax');
  const restored = restoreClassicBattle(JSON.parse(JSON.stringify(battle)));
  assert.deepEqual(restored.p1.activeRequest, battle.p1.activeRequest);
  assert.deepEqual(restored.p1.classicFormsUsed, { dynamax: true });
  choose(battle, 'switch 2');
  choose(restored, 'switch 2');
  assert.deepEqual(classicFormsFor(restored, restored.p1), []);
  assert.deepEqual(State.normalize(restored.toJSON()), State.normalize(battle.toJSON()));
});

test('Classic settings stay local to the battle instance', () => {
  setup([[snorlax, 'DYNAMAX']]);
  const native = new Battle({
    formatid: 'gen9customgame',
    p1: { team: [snorlax] },
    p2: { team: [blissey] },
  });
  choose(native, 'team 1', 'team 1');
  assert.equal(native.p1.activeRequest.active[0].canDynamax, undefined);
});
