import assert from 'node:assert/strict';
import test from 'node:test';
import { ClassicChoiceError, ClassicSimulation } from '../../scripts/competitive/classic-simulation.mjs';
import { loadEngine } from '../helpers/load-engine.js';

function built(name, moves, extras = {}) {
  return {
    name, stats: { atk: 90, def: 90, spa: 90, spd: 90, spe: 90 },
    currentHp: 150, maxHp: 150, moves: moves.map(move => ({ name: move, pp: 10, maxPp: 16 })),
    ...extras,
  };
}

const moves = slot => ({ kind: 'move', slot });
const switches = slot => ({ kind: 'switch', slot });
const activeSlot = party => party.find(mon => mon.active).slot;

test('setup uses carried game stats, health, status, PP and stable duplicate-species slots', () => {
  const lead = built('Pikachu', ['Nuzzle', 'Protect'], {
    stats: { atk: 65, def: 81, spa: 157, spd: 62, spe: 103 },
    maxHp: 147, currentHp: 103, status: 'PAR', stages: { atk: 2 }, ability: 'Static', item: 'Light Ball',
  });
  lead.moves[0].pp = 4;
  const reserve = built('Pikachu', ['Thunderbolt'], { currentHp: 109, ability: 'Lightning Rod' });
  const session = new ClassicSimulation({
    seed: 12, playerParty: [reserve, lead], foeParty: [built('Mew', ['Splash'])], leadSlots: [1, 0],
  });
  const initial = session.view();
  assert.equal(activeSlot(initial.player), 1);
  assert.deepEqual(initial.player[1].stats, lead.stats);
  assert.equal(initial.player[1].hp, 103);
  assert.equal(initial.player[1].maxHp, 147);
  assert.equal(initial.player[1].status, 'PAR');
  assert.equal(initial.player[1].stages.atk, 2);
  assert.equal(initial.player[1].item, 'Light Ball');
  assert.equal(initial.requests.p1.moves[0].pp, 4);
  assert.deepEqual(initial.requests.p1.switches, [0]);
  session.choose('p1', switches(0));
  const next = session.choose('p2', moves(0));
  assert.equal(activeSlot(next.player), 0);
  assert.equal(next.player[0].ability, 'Lightning Rod');
  assert.deepEqual(next.player[1].stats, lead.stats);
  assert.deepEqual(next.requests.p1.switches, [1]);
});

test('generated Story opponents and old saves can use textual empty held-item slots', () => {
  const playerParty = [built('Nickit', ['Quick Attack'], { item: 'NO_ITEM' }), built('Chingling', ['Astonish'], { item: 'No Item' })];
  const foeParty = [built('Diglett-Alola', ['Scratch'], { item: 'None' })];
  const session = new ClassicSimulation({ seed: 1, playerParty, foeParty, rules: { allowPass: true } });
  assert.deepEqual(session.view().player.map(mon => mon.item), [null, null]);
  assert.equal(session.view().foe[0].item, null);
  session.choose('p1', moves(0));
  assert.equal(session.choose('p2', moves(0)).turn, 2);
});

test('accepts native charge/recharge requests and uses the displayed index even when the base slot differs', () => {
  const lead = built('Dragonite', ['Splash', 'Fly', 'Giga Impact'], { stats: { spe: 200 } });
  lead.moves[1].pp = 1;
  const session = new ClassicSimulation({
    seed: 11, playerParty: [lead, built('Mew', ['Splash'])],
    foeParty: [built('Blissey', ['Splash'], { maxHp: 400, currentHp: 400 })],
  });
  const done = choice => {
    session.choose('p1', choice);
    return session.choose('p2', moves(0));
  };
  const charge = done(moves(1));
  assert.deepEqual(charge.requests.p1.switches, []);
  assert.deepEqual(charge.requests.p1.moves.map(move => [move.slot, move.partyMoveSlot, move.pp, move.forced]), [[0, 1, 0, true]]);
  const first = done(moves(null));
  assert.equal(first.player[0].moves[1].pp, 0, 'the second charge turn spends zero PP');
  const impact = done(moves(2));
  assert.equal(impact.requests.p1.moves[0].name, 'Recharge');
  assert.deepEqual(impact.requests.p1.switches, []);
  const recharged = done(moves(null));
  assert.equal(recharged.player[0].moves[2].pp, 9);
  assert.ok(recharged.events.some(event => event.tag === 'cant' && /recharge/i.test(event.protocol)));
});

test('an exhausted move request exposes native Struggle with no equipped slot', () => {
  const lead = built('Pikachu', ['Quick Attack'], { moves: [{ name: 'Quick Attack', pp: 0, maxPp: 16 }] });
  const session = new ClassicSimulation({ seed: 91, playerParty: [lead], foeParty: [built('Blissey', ['Splash'])] });
  const [only] = session.view().requests.p1.moves;
  assert.equal(only.name, 'Struggle');
  assert.equal(only.partyMoveSlot, null);
  assert.throws(() => session.choose('p1', moves(4)), ClassicChoiceError);
  session.choose('p1', moves(null));
  const result = session.choose('p2', moves(0));
  assert.ok(result.player[0].hp < lead.currentHp, 'native Struggle recoil is applied');
});

test('a pivot snapshot preserves its pending opposing action and restored deterministic results', () => {
  const lead = built('Scizor', ['U-turn'], { stats: { spe: 220 } });
  const playerParty = [lead, built('Pikachu', ['Thunderbolt'])];
  const foeParty = [built('Blissey', ['Seismic Toss'], { maxHp: 500, currentHp: 500 })];
  const session = new ClassicSimulation({ seed: 220, playerParty, foeParty });
  const requestId = session.view().requestId;
  session.choose('p2', { ...moves(0), requestId });
  const whileQueued = ClassicSimulation.fromSnapshot(session.snapshot());
  assert.equal(whileQueued.view().requests.p2.phase, 'wait');
  const pivot = session.choose('p1', { ...moves(0), requestId });
  assert.deepEqual(pivot, whileQueued.choose('p1', { ...moves(0), requestId }));
  assert.equal(pivot.phase, 'replace');
  assert.deepEqual(pivot.requests.p1.switches, [1]);
  assert.throws(() => session.choose('p1', { ...switches(1), requestId }), /out of date/);
  const whilePivoting = ClassicSimulation.fromSnapshot(session.snapshot());
  const after = session.choose('p1', switches(1));
  assert.deepEqual(after, whilePivoting.choose('p1', switches(1)));
  assert.equal(activeSlot(after.player), 1);
  assert.equal(after.player[1].hp, 100, 'queued opposing attack hit the replacement');
  assert.equal(after.player[0].hp, lead.currentHp);
  assert.equal(after.turn, 2);
});

test('carried bench KO is not counted as a playable Pokémon or a replacement', () => {
  const playerParty = [built('Pikachu', ['Splash'], { currentHp: 1 }), built('Jolteon', ['Splash'], { currentHp: 0 })];
  const session = new ClassicSimulation({ seed: 65, playerParty, foeParty: [built('Mew', ['Seismic Toss'])] });
  assert.deepEqual(session.view().requests.p1.switches, []);
  session.choose('p1', moves(0));
  const result = session.choose('p2', moves(0));
  assert.equal(result.phase, 'ended');
  assert.equal(result.winner, 'p2');
  assert.equal(result.requests.p1.phase, 'ended');
});

test('disabled form settings are respected even for builds retained from a different run', () => {
  const playerParty = [built('Charizard', ['Flamethrower'], { item: 'Charizardite X', buildData: { gimmick: 'MEGA', teraType: 'Water' } })];
  const foeParty = [built('Blissey', ['Splash'], { buildData: { gimmick: 'DYNAMAX' } })];
  const options = { seed: 5, playerParty, foeParty };
  const configured = new ClassicSimulation(options).view();
  assert.deepEqual(configured.requests.p1.forms, ['mega', 'terastallize']);
  assert.deepEqual(configured.requests.p2.forms, ['dynamax']);
  const disabled = new ClassicSimulation({ ...options, rules: { mechanics: { mega: false, tera: false, dynamax: false } } });
  assert.deepEqual(disabled.view().requests.p1.forms, []);
  assert.deepEqual(disabled.view().requests.p2.forms, []);
  assert.throws(() => disabled.choose('p1', { ...moves(0), transform: 'terastallize' }), ClassicChoiceError);
});

test('the game bridge keeps exact campaign stat investments when native forms change', async t => {
  const { window, engine, teardown } = await loadEngine();
  t.after(teardown);
  let session;
  window.__classicSimulationModule = {
    ClassicSimulation: class extends ClassicSimulation {
      constructor(options) {
        options.playerParty[1].currentHp -= 13;
        super({ ...options, seed: 30 });
        session = this;
      }
    },
  };
  const salamence = {
    m: ['Splash'], n: 'Hardy', a: 'Intimidate', i: 'Salamencite', gimmick: 'MEGA',
    evs: { spe: 252 }, _relationshipStatMult: { spe: 1.05 },
  };
  const terapagos = { m: ['Splash'], n: 'Hardy', a: 'Tera Shift', evs: { hp: 252 } };
  const bonded = { ...terapagos, expShareLevels: 3, _relationshipStatMult: { hp: 1.05 } };
  const scaled = { ...terapagos, _storyStatMult: 1.2 };
  const state = engine.state;
  state.mode = 'pvp';
  state.p1Draft = [{ name: 'Salamence', build: salamence }, { name: 'Terapagos', build: bonded }];
  state.p2Draft = [{ name: 'Terapagos', build: scaled }];
  await window.startBattle();
  assert.equal(state.battleEngine, 'showdown');
  assert.equal(state.pActive.stats.spe, 159);
  assert.equal(state.fActive.name, 'Terapagos-Terastal');
  assert.equal(state.fActive.maxHp, 242, 'keep the enemy HP multiplier after Tera Shift');

  const restored = ClassicSimulation.fromSnapshot(session.snapshot());
  for (const native of [session, restored]) {
    native.choose('p1', { ...moves(0), transform: 'mega' });
    const evolved = native.choose('p2', moves(0));
    assert.equal(evolved.player[0].name, 'Salamence-Mega');
    assert.equal(evolved.player[0].stats.spe, 180, 'round the bond after Mega base stats');

    native.choose('p1', switches(1));
    const shifted = native.choose('p2', moves(0));
    assert.equal(shifted.player[1].name, 'Terapagos-Terastal');
    assert.equal(shifted.player[1].maxHp, 223, 'keep both the Lv53 gift and HP bond');
    assert.equal(shifted.player[1].hp, 210, 'keep the HP deficit when the maximum changes');
  }

  const story = window.__storyTest;
  story.sm.active = true;
  story.sm.storyDifficulty = 'hard';
  story.sm.frontier = { active: true, currentRound: 1 };
  state.mode = 'story';
  state.p2Draft = [{ name: 'Terapagos', build: terapagos }];
  await window.startBattle();
  assert.equal(state.battleEngine, 'showdown');
  assert.equal(state.fActive.maxHp, 348, 'retain Frontier and difficulty HP scales in order');
  assert.equal(state.fActive.stats.spd, 186, 'retain each rounding step for the Frontier and difficulty');
});

test('Hidden Power presents the native type in requests and party views after restoration', () => {
  const session = new ClassicSimulation({
    seed: 39,
    playerParty: [built('Pikachu', ['Hidden Power Ice'], { ability: 'Static' })],
    foeParty: [built('Garchomp', ['Splash'])],
  });
  const restored = ClassicSimulation.fromSnapshot(session.snapshot());
  for (const native of [session, restored]) {
    const { player, requests } = native.view();
    const [move] = requests.p1.moves;
    assert.equal(move.id, 'hiddenpower');
    assert.equal(move.name, 'Hidden Power Ice');
    assert.equal(move.type, 'Ice');
    assert.equal(move.power, 60);
    assert.equal(player[0].moves[0].name, 'Hidden Power Ice');
    assert.equal(player[0].baseMoves[0].name, 'Hidden Power Ice');

    native.choose('p1', moves(0));
    const result = native.choose('p2', moves(0));
    assert.ok(result.events.some(event => event.tag === '-supereffective' && event.side === 'p2'));
    assert.equal(result.player[0].moves[0].pp, 9);
  }
});

test('a version-one snapshot without form projections can still play through a form change', () => {
  const terapagos = built('Terapagos', ['Splash'], {
    ability: 'Tera Shift', maxHp: 206, currentHp: 193, buildData: { evs: { hp: 252 } },
  });
  const original = new ClassicSimulation({
    seed: 30,
    playerParty: [built('Pikachu', ['Splash']), terapagos],
    foeParty: [built('Blissey', ['Splash'])],
  });
  const legacy = original.snapshot();
  const [side] = legacy.battle.sides;
  assert.equal(side.pokemon[1].classicFormStats, undefined);
  const restored = ClassicSimulation.fromSnapshot(legacy);
  restored.choose('p1', switches(1));
  const shifted = restored.choose('p2', moves(0));
  assert.equal(shifted.player[1].name, 'Terapagos-Terastal');
  assert.equal(shifted.player[1].maxHp - shifted.player[1].hp, 13);
  assert.equal(shifted.requests.p1.phase, 'move');
  assert.equal(shifted.turn, 2);
});

test('Story item use repairs bench HP, PP and field while spending only the acting side’s turn', () => {
  const playerParty = [built('Mew', ['Splash'], { currentHp: 35, status: 'BRN' }), built('Pikachu', ['Splash'], { currentHp: 0 })];
  const session = new ClassicSimulation({
    seed: 28, rules: { allowPass: true }, playerParty, foeParty: [built('Blissey', ['Splash'])],
  });
  const current = playerParty.map(mon => ({ ...mon, moves: mon.moves.map(move => ({ ...move })) }));
  current[0].currentHp = 53;
  current[0].status = null;
  current[0].moves[0].pp = 16;
  current[0].stages = { spe: 2 };
  current[0].volatile = { bagRegen: { pct: 0.12, turns: 2 }, focusEnergy: 2 };
  current[1].currentHp = 30;
  session.choose('p2', moves(0));
  const updated = session.applyPartyState('p1', current, { weather: 'Rain', weatherTurns: 5, terrain: 'Psychic', terrainTurns: 5, mist: [5, 0] });
  assert.equal(updated.requests.p2.phase, 'wait');
  assert.deepEqual(updated.requests.p1.switches, [1]);
  assert.equal(updated.requests.p1.moves[0].pp, 16);
  assert.equal(updated.player[0].stages.spe, 2);
  assert.equal(updated.player[0].status, null);
  assert.equal(updated.field.weather, 'raindance');
  assert.equal(updated.field.terrain, 'psychicterrain');
  assert.equal(updated.sides.p1.mist, 5);
  const spent = session.choose('p1', { kind: 'pass' });
  assert.equal(spent.player[0].hp, 71);
  assert.equal(spent.player[0].moves[0].pp, 16);
  assert.deepEqual(spent.player[0].volatile.bagRegen, { pct: 0.12, turns: 1 });
  assert.equal(spent.foe[0].moves[0].pp, 9);
  assert.equal(spent.field.weatherTurns, 4);
  assert.equal(spent.sides.p1.mist, 4);
  const resumed = ClassicSimulation.fromSnapshot(session.snapshot());
  resumed.choose('p1', switches(1));
  const replacement = resumed.choose('p2', moves(0));
  assert.equal(replacement.player[0].hp, 71, 'the healing mist and focus clear on switching');
  assert.equal(replacement.player[0].volatile.bagRegen, null);
  assert.equal(replacement.player[0].volatile.focusEnergy, false);
});
