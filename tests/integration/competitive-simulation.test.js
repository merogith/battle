import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BattleStreams, Teams } from '@pkmn/sim';
import { ArenaSimulation, ArenaTeamError, DYNAMAX_FORMAT, ENGINE_VERSION, FORMAT } from '../../scripts/competitive/arena-simulation.mjs';
import { disguiseTeam, gigantamaxTeam, importedGen1Team, importedGen6Team, importedGen7Team, importedGen9Team, importedSixTeam, rainTeam, teraDanceTeam } from '../fixtures/competitive-teams.mjs';

const choose = (battle, kind, slot, transform = false) => battle.choose({
  requestId: battle.view().requestId, kind, slot, transform,
});

async function replayOutput(replay) {
  const stream = new BattleStreams.BattleStream({ noCatch: true });
  const collect = (async () => {
    let output = '';
    for await (const chunk of stream) output += chunk;
    return output;
  })();
  await stream.write(replay.inputLog.join('\n'));
  return collect;
}

function completeMatch(sim, initial) {
  let view = initial;
  for (let step = 0; !view.result && step < 240; step++) {
    view = view.phase === 'replace' ? choose(sim, 'switch', view.switches[0])
      : choose(sim, 'move', view.moves.find(move => !move.disabled).slot);
    assert.equal(view.error, null);
  }
  assert.ok(view.result);
  return view;
}

const supportedConfigurations = [
  ...Array.from({ length: 9 }, (_, index) => `gen${index + 1}ou`)
    .flatMap(format => [[format, 3], [format, 6]]),
  [DYNAMAX_FORMAT, 3],
];

for (const [format, size] of supportedConfigurations) {
  test(`Arena completes a real ${size}-on-${size} match under ${format}`, () => {
    const sim = new ArenaSimulation(253, 1, format, undefined, size);
    const preview = sim.view();
    assert.equal(preview.format, format);
    assert.equal(preview.player.length, size);
    assert.equal(preview.opponent.length, size);
    const finished = completeMatch(sim, choose(sim, 'lead', 0));
    assert.equal(finished.phase, 'ended');
    assert.equal(sim.view().result, finished.result);
  });
}

test('Arena publishes move, outcome, and HP from this request’s public events', () => {
  const battle = new ArenaSimulation(125);
  const opening = choose(battle, 'lead', 0);
  assert.equal(opening.presentation.find(event => event.side === 'p2').appearance.name, 'Corviknight');
  const round = choose(battle, 'move', 0);
  const [rush, immune, braveBird] = round.presentation;
  assert.deepEqual([rush.tag, rush.name, rush.side, rush.targetSide], ['move', 'Headlong Rush', 'p1', 'p2']);
  assert.deepEqual([immune.tag, immune.side], ['-immune', 'p2']);
  assert.deepEqual([braveBird.tag, braveBird.name, braveBird.side, braveBird.targetSide], ['move', 'Brave Bird', 'p2', 'p1']);
  const damage = round.presentation.find(event => event.tag === '-damage');
  assert.equal(damage.side, 'p1');
  assert.equal(damage.hpPercent, 42);
  assert.match(damage.protocol, /\|42\/100$/);
  assert.ok(!round.presentation.some(event => /\|(?:split|request)\|/.test(event.protocol)));
  assert.ok(!round.presentation.some(event => event.tag === 'switch'), 'previous request cues never repeat');
});

test('competitive singles runs the pinned OU format, with validated lead and move requests', () => {
  const battle = new ArenaSimulation(125);
  const initial = battle.view();
  assert.equal(initial.format, FORMAT);
  assert.equal(initial.engineVersion, ENGINE_VERSION);
  assert.equal(initial.phase, 'preview');
  assert.deepEqual(initial.switches, [0, 1, 2]);
  assert.equal(initial.opponent.every(mon => mon.hpPercent === null), true);
  assert.equal(choose(battle, 'move', 0).error, 'Choose an available action.');

  const turn = choose(battle, 'lead', 0);
  assert.equal(turn.phase, 'move');
  assert.equal(turn.turn, 1);
  assert.equal(turn.player.find(mon => mon.active).name, 'Great Tusk');
  assert.equal(turn.opponent.find(mon => mon.active).name, 'Corviknight');
  assert.equal(battle.choose({ requestId: initial.requestId, kind: 'move', slot: 0 }).error, 'That choice is out of date.');
  assert.equal(battle.view().turn, 1);

  const next = choose(battle, 'move', 0);
  assert.equal(next.turn, 2);
  assert.equal(next.moves[0].pp, turn.moves[0].pp - 1);
  assert.ok(next.events.some(event => event.text === 'Corviknight was immune.'));
  const switched = choose(battle, 'switch', 1);
  assert.equal(switched.player.find(mon => mon.active).name, 'Gholdengo');
  assert.ok(switched.events.some(event => event.text === 'Gholdengo entered the field.'));
  const tera = choose(battle, 'move', 0, true);
  assert.ok(tera.events.some(event => event.text === 'Gholdengo Terastallized into Steel!'));
  assert.equal(tera.teraType, null);
});

test('forced replacements and battle results are deterministic for the same seed and choices', async () => {
  function play() {
    const battle = new ArenaSimulation(0);
    const views = [choose(battle, 'lead', 0)];
    while (!views.at(-1).result && views.length < 120) {
      const current = views.at(-1);
      const move = current.moves.find(option => !option.disabled);
      const next = current.phase === 'replace'
        ? choose(battle, 'switch', current.switches[0])
        : choose(battle, 'move', move.slot);
      assert.equal(next.error, null);
      views.push(next);
    }
    assert.ok(views.some(view => view.phase === 'replace'));
    assert.ok(views.at(-1).result);
    assert.equal(views.at(-1).phase, 'ended');
    return views;
  }
  const first = play();
  assert.deepEqual(first, play());
  assert.equal(first[0].replay, null);
  const replay = first.at(-1).replay;
  assert.equal(replay.seed, 0);
  assert.equal(replay.engineVersion, ENGINE_VERSION);
  assert.ok(replay.inputLog.some(line => line.startsWith('>p1 move ')));
  assert.ok(replay.inputLog.some(line => line.startsWith('>p2 move ')));
  const output = await replayOutput(replay);
  assert.match(output, /\|win\|Arena AI/);
  assert.throws(() => new ArenaSimulation(-1), /Enter a seed/);
  assert.throws(() => new ArenaSimulation(0x100000000), /Enter a seed/);
  assert.throws(() => new ArenaSimulation(0, 1, 'gen9doublesou'), /supported OU format/);
});

test('team imports honor selected rules and preserve the actual team and actions in the replay', async () => {
  const illegalMove = importedGen9Team.replace('- Thunderbolt', '- Spore');
  assert.throws(() => new ArenaSimulation(125, 1, FORMAT, illegalMove), {
    name: 'Error', message: /Gen 9 OU rules\.[\s\S]*Pikachu can't learn Spore/,
  });
  assert.throws(() => new ArenaSimulation(125, 1, 'gen1ou', importedGen9Team), /Gen 1 OU rules/);
  assert.throws(() => new ArenaSimulation(125, 1, FORMAT, 'Pikachu\n- Thunderbolt'), ArenaTeamError);
  assert.throws(() => new ArenaSimulation(125, 1, FORMAT, 'p'.repeat(12001)), /at most 12,000/);
  assert.throws(() => new ArenaSimulation(125, 1, FORMAT, `=== [gen9ou] A ===\n${importedGen9Team}\n=== [gen9ou] B ===\n${importedGen9Team}`), /readable export/);
  assert.equal(new ArenaSimulation(125, 1, FORMAT, ' \n').view().player[0].name, 'Great Tusk');

  const battle = new ArenaSimulation(125, 1, FORMAT, importedGen9Team.replaceAll('\n', '\r\n'));
  assert.deepEqual(battle.view().player.map(mon => mon.name), ['Pikachu', 'Gholdengo', 'Dragapult']);
  assert.equal(battle.view().opponent[0].name, 'Corviknight');
  assert.equal(choose(battle, 'lead', 0).turn, 1);
  let view = choose(battle, 'move', 0);
  assert.ok(view.events.some(event => event.text === 'Pikachu used Thunderbolt!'));
  for (let step = 0; !view.result && step < 120; step++) {
    view = view.phase === 'replace' ? choose(battle, 'switch', view.switches[0])
      : choose(battle, 'move', view.moves.find(move => !move.disabled).slot);
    assert.equal(view.error, null);
  }
  const { inputLog } = view.replay;
  const header = '>player p1 ';
  const team = Teams.unpack(JSON.parse(inputLog.find(line => line.startsWith(header)).slice(header.length)).team);
  assert.equal(team[0].species, 'Pikachu');
  assert.equal(team[0].item, 'Light Ball');
  assert.deepEqual(team[0].moves, ['Thunderbolt', 'Volt Switch', 'Surf', 'Grass Knot']);
  const replay = await replayOutput(view.replay);
  assert.match(replay, /\|move\|p1a: Pikachu\|Thunderbolt/);
  assert.match(replay, /\|(?:win\|(?:You|Arena AI)|tie)/);
});

test('legal imports expose request-driven native Mega Evolution and Z-Moves', () => {
  const mega = new ArenaSimulation(125, 1, 'gen6ou', importedGen6Team);
  assert.deepEqual(choose(mega, 'lead', 0).battleForm, { kind: 'mega', label: 'Mega Evolve', species: 'Alakazam-Mega' });
  const transformed = choose(mega, 'move', 0, true);
  assert.equal(transformed.error, null);
  assert.equal(transformed.battleForm, null);
  assert.equal(transformed.player.find(mon => mon.active).name, 'Alakazam-Mega');
  assert.ok(transformed.events.some(event => event.text === 'Alakazam Mega Evolved into Alakazam-Mega!'));
  assert.ok(transformed.events.some(event => event.text === 'Alakazam-Mega used Psychic!'));

  const crystal = new ArenaSimulation(125, 1, 'gen7ou', importedGen7Team);
  const options = choose(crystal, 'lead', 0);
  assert.deepEqual(options.battleForm, { kind: 'zmove', label: 'Use Z-Move' });
  assert.equal(options.moves[0].zMove, 'Gigavolt Havoc');
  assert.deepEqual(options.moves.slice(0, 2).map(move => [move.variant.type, move.variant.category, move.variant.power, move.variant.accuracy]),
    [['Electric', 'Special', 175, true], ['Electric', 'Special', 140, true]]);
  assert.equal(options.moves[2].zMove, null);
  assert.equal(choose(crystal, 'move', 2, true).error, 'Choose an available action.');
  const fired = choose(crystal, 'move', 0, true);
  assert.equal(fired.error, null);
  assert.equal(fired.battleForm, null);
  assert.ok(fired.events.some(event => event.text === 'Jolteon used Gigavolt Havoc!'));
});

test('move details use native historical effects and known type changes without exposing opponent sets', () => {
  const historical = new ArenaSimulation(125, 1, 'gen1ou', importedGen1Team);
  const hyperBeam = historical.view().moves.find(move => move.name === 'Hyper Beam');
  assert.equal(hyperBeam.category, 'Physical');
  assert.equal(hyperBeam.power, 150);
  assert.equal(hyperBeam.accuracy, 90);
  assert.match(hyperBeam.effect, /if target or sub is not KOed/);

  const hiddenPower = new ArenaSimulation(125, 1, 'gen7ou', importedGen7Team.replace('- Shadow Ball', '- Hidden Power Ice'));
  const ice = choose(hiddenPower, 'lead', 0).moves[2];
  assert.equal(ice.type, 'Ice');
  assert.equal(ice.power, 60);
  assert.match(ice.effect, /IVs/);

  const dance = new ArenaSimulation(125, 1, FORMAT, teraDanceTeam);
  const preview = choose(dance, 'lead', 0);
  assert.equal(preview.player[0].name, 'Flare (Oricorio)');
  assert.equal(preview.moves[0].type, 'Fire');
  assert.equal(preview.moves[0].variant.type, 'Electric');
  assert.equal(preview.replay, null);
  assert.deepEqual(Object.keys(preview.opponent[0]).sort(), ['active', 'fainted', 'hpPercent', 'name', 'sprite', 'status', 'types']);
  const tera = choose(dance, 'move', 0, true);
  assert.equal(tera.moves[0].type, 'Electric');
  assert.ok(tera.events.some(event => event.text === 'Flare (Oricorio) used Revelation Dance!'));
  const knockout = choose(dance, 'move', 0);
  assert.equal(knockout.opponent.find(mon => mon.active).name, 'Slowking-Galar');
  assert.ok(knockout.events.some(event => event.text === 'Slowking-Galar entered the field.'));
});

test('the owner sees their disguise while the public log reflects the Illusion and its reveal', () => {
  const battle = new ArenaSimulation(125, 1, FORMAT, disguiseTeam);
  const before = choose(battle, 'lead', 0);
  assert.equal(before.player[0].name, 'Lens (Zoroark-Hisui)');
  assert.equal(before.player[0].disguise, 'Dragapult');
  assert.ok(before.events.some(event => event.text === 'Dragapult entered the field.'));
  const after = choose(battle, 'move', 0);
  assert.equal(after.player[0].disguise, null);
  assert.ok(after.events.some(event => event.text === 'Lens (Zoroark-Hisui) was revealed.'));
});

test('the AI can be fooled by a legally imported Illusion', () => {
  const magnezone = `Magnezone @ Leftovers
Ability: Magnet Pull
EVs: 252 HP / 252 SpA / 4 SpD
Modest Nature
- Thunderbolt
- Volt Switch
- Flash Cannon
- Body Press`;
  const team = [...disguiseTeam.split('\n\n').slice(0, 2), magnezone].join('\n\n');
  const battle = new ArenaSimulation(125, 1, FORMAT, team);
  const before = choose(battle, 'lead', 0);
  assert.equal(before.player[0].disguise, 'Magnezone');
  const after = choose(battle, 'move', 0);
  assert.ok(after.events.some(event => event.text === 'Corviknight used Body Press!'));
  assert.ok(after.events.some(event => event.text === 'Magnezone was immune.'));
  assert.equal(after.player[0].disguise, 'Magnezone');
});

test('native Fight and Recharge requests remain legal commands with no misleading move data', () => {
  const [tauros, snorlax, starmie] = importedGen1Team.split('\n\n');
  const classic = new ArenaSimulation(125, 1, 'gen1ou', [snorlax, tauros, starmie].join('\n\n'));
  const sleeping = choose(classic, 'move', 2);
  assert.deepEqual(sleeping.moves.map(move => [move.name, move.type, move.power]), [['Fight', null, null]]);
  assert.match(sleeping.moves[0].effect, /cannot select an attack/);
  assert.equal(choose(classic, 'move', 0).turn, 3);

  const battle = new ArenaSimulation(125, 1, FORMAT, importedGen9Team.replace('- Make It Rain', '- Hyper Beam'));
  choose(battle, 'lead', 1);
  const recharge = choose(battle, 'move', 0);
  assert.deepEqual(recharge.moves.map(move => [move.name, move.category, move.accuracy]), [['Recharge', null, null]]);
  assert.match(recharge.moves[0].effect, /recharging/);
  assert.equal(choose(battle, 'move', 0).turn, 3);
});

test('Gen 8 Battle Stadium runs native three-turn Dynamax and Gigantamax under its legal format', async () => {
  const ou = new ArenaSimulation(125, 1, 'gen8ou');
  assert.equal(choose(ou, 'lead', 0).battleForm, null);
  const stadium = new ArenaSimulation(125, 1, DYNAMAX_FORMAT);
  const starting = choose(stadium, 'lead', 0);
  assert.equal(starting.formatLabel, 'Gen 8 Battle Stadium Singles');
  assert.equal(stadium.battle.p1.active[0].level, 50);
  assert.equal(starting.battleForm.label, 'Dynamax');
  assert.equal(starting.moves[0].variant.name, 'Max Strike');
  assert.equal(starting.moves[0].variant.power, 130);
  const baseHP = stadium.battle.p1.active[0].maxhp;
  const maxed = choose(stadium, 'move', 0, true);
  assert.equal(stadium.battle.p1.active[0].maxhp, baseHP * 2);
  assert.equal(maxed.player[0].sizeForm, 'Dynamax');
  assert.ok(maxed.events.some(event => event.text === 'Snorlax used Max Strike!'));
  assert.ok(maxed.events.some(event => event.text === 'Snorlax Dynamaxed!'));
  assert.equal(maxed.moves[2].name, 'Max Guard');
  assert.equal(choose(stadium, 'move', 2).player[0].sizeForm, 'Dynamax');
  let view = choose(stadium, 'move', 2);
  assert.equal(stadium.battle.p1.active[0].maxhp, baseHP);
  assert.equal(view.player[0].sizeForm, null);
  assert.equal(view.moves[0].name, 'Body Slam');
  assert.equal(view.battleForm, null);
  assert.equal(choose(stadium, 'move', 0, true).error, 'Choose an available action.');
  for (let step = 0; !view.result && step < 120; step++) {
    view = view.phase === 'replace' ? choose(stadium, 'switch', view.switches[0])
      : choose(stadium, 'move', view.moves.find(move => !move.disabled).slot);
    assert.equal(view.error, null);
  }
  assert.ok(view.result);
  assert.ok(view.replay.inputLog.some(line => line.startsWith('>p1 move bodyslam dynamax')));
  const output = await replayOutput(view.replay);
  assert.match(output, /\|move\|p1a: Snorlax\|Max Strike/);
  assert.match(output, view.result === 'win' ? /\|win\|You/ : view.result === 'loss' ? /\|win\|Arena AI/ : /\|tie/);

  const giant = new ArenaSimulation(125, 1, DYNAMAX_FORMAT, gigantamaxTeam);
  const giantPreview = choose(giant, 'lead', 1);
  assert.equal(giantPreview.battleForm.label, 'Gigantamax');
  assert.equal(giantPreview.moves[0].variant.name, 'G-Max Replenish');
  const transformed = choose(giant, 'move', 0, true);
  assert.equal(transformed.player[0].sizeForm, 'Gigantamax');
  assert.ok(transformed.events.some(event => event.text === 'Snorlax used G-Max Replenish!'));
});

test('public weather previews track the field and distinguish conditional and base move values', () => {
  const battle = new ArenaSimulation(125, 1, FORMAT, rainTeam);
  assert.equal(battle.view().weather, null);
  const wet = choose(battle, 'lead', 0);
  assert.equal(wet.weather, 'Rain');
  assert.equal(wet.moves[0].type, 'Water');
  assert.equal(wet.moves[0].power, 50);
  assert.equal(wet.moves[0].weatherPower, 100);
  assert.equal(wet.moves[1].accuracy, 70);
  assert.equal(wet.moves[1].weatherAccuracy, true);
  assert.ok(wet.events.some(event => event.text === 'Weather changed to Rain.'));

  let dry = wet;
  for (let turn = 0; turn < 5 && dry.phase === 'move' && dry.weather; turn++) dry = choose(battle, 'move', 3);
  assert.equal(dry.weather, null);
  assert.equal(dry.moves[0].type, 'Normal');
  assert.equal(dry.moves[0].weatherPower, undefined);
  assert.equal(dry.moves[1].weatherAccuracy, undefined);
  assert.equal(dry.events.filter(event => event.text === 'Weather changed to Rain.').length, 1);

  const sunnyTeam = rainTeam.replace('Pelipper', 'Tornadus-Therian').replace('Drizzle', 'Regenerator')
    .replace('- U-turn', '- Sunny Day').replace('- Roost', '- Taunt');
  const brightBattle = new ArenaSimulation(125, 1, FORMAT, sunnyTeam);
  choose(brightBattle, 'lead', 0);
  const bright = choose(brightBattle, 'move', 2);
  assert.equal(bright.weather, 'Sun');
  assert.equal(bright.moves[0].type, 'Fire');
  assert.equal(bright.moves[0].weatherPower, 100);
  assert.equal(bright.moves[1].weatherAccuracy, 50);
});

test('six-member OU imports use a matched opponent, validate selected size, and replay original rosters', async () => {
  assert.throws(() => new ArenaSimulation(1, 1, FORMAT, importedGen9Team, 6), /exactly six Pokémon for a 6-on-6 match/);
  assert.throws(() => new ArenaSimulation(1, 1, FORMAT, importedSixTeam), /exactly three Pokémon for a 3-on-3 match/);
  assert.throws(() => new ArenaSimulation(1, 1, DYNAMAX_FORMAT, undefined, 6), /three for Battle Stadium/);
  assert.throws(() => new ArenaSimulation(1, 1, FORMAT, undefined, 4), /Choose three or six Pokémon/);
  assert.throws(() => new ArenaSimulation(1, 1, FORMAT, importedSixTeam.replace('- Overheat', '- Spore'), 6), /Rotom-Heat.* can.t learn Spore|Rotor.*can.t learn Spore/i);

  const battle = new ArenaSimulation(125, 1, FORMAT, importedSixTeam, 6);
  const start = battle.view();
  assert.equal(start.teamSize, 6);
  assert.equal(start.player.length, 6);
  assert.equal(start.opponent.length, 6);
  assert.deepEqual(start.switches, [0, 1, 2, 3, 4, 5]);
  const first = choose(battle, 'lead', 5);
  assert.equal(first.player.find(member => member.active).name, 'Rotor (Rotom-Heat)');
  const active = choose(battle, 'move', 1);
  assert.ok(active.events.some(event => event.text === 'Rotor (Rotom-Heat) used Thunderbolt!'));
  const ended = completeMatch(battle, active);
  assert.equal(ended.replay.teamSize, 6);
  for (const side of ['p1', 'p2']) {
    const prefix = `>player ${side} `;
    const team = Teams.unpack(JSON.parse(ended.replay.inputLog.find(line => line.startsWith(prefix)).slice(prefix.length)).team);
    assert.equal(team.length, 6);
    if (side === 'p1') assert.equal(team[5].name, 'Rotor');
  }
  assert.match(await replayOutput(ended.replay), /\|move\|p1a: Rotor\|Thunderbolt/);
});

for (let generation = 1; generation <= 9; generation++) {
  test(`Gen ${generation} OU validates both presets and replays a completed match`, async () => {
    const format = `gen${generation}ou`;
    const seed = generation === 9 ? 0xffffffff : 125;
    const battle = new ArenaSimulation(seed, 1, format);
    const before = battle.view();
    assert.equal(before.format, format);
    assert.equal(before.generation, generation);
    assert.equal(before.phase, generation >= 5 ? 'preview' : 'move');
    const start = before.phase === 'preview' ? choose(battle, 'lead', 0) : before;
    assert.equal(start.error, null);
    assert.equal(start.turn, 1);
    const next = choose(battle, 'move', 0);
    assert.equal(next.error, null);
    assert.equal(next.turn, 2);
    assert.ok(next.events.some(event => event.text === `${start.player[0].name} used ${start.moves[0].name}!`));
    let view = next;
    for (let step = 0; !view.result && step < 120; step++) {
      view = view.phase === 'replace' ? choose(battle, 'switch', view.switches[0])
        : choose(battle, 'move', view.moves.find(move => !move.disabled).slot);
      assert.equal(view.error, null);
    }
    assert.ok(view.result);
    assert.equal(view.replay.seed, seed);
    assert.equal(view.replay.format, format);
    const output = await replayOutput(view.replay);
    assert.match(output, view.result === 'win' ? /\|win\|You/ : view.result === 'loss' ? /\|win\|Arena AI/ : /\|tie/);
  });

  test(`Gen ${generation} OU accepts two legal six-Pokémon stock rosters and a complete replay`, async () => {
    const battle = new ArenaSimulation(125, 1, `gen${generation}ou`, undefined, 6);
    const preview = battle.view();
    assert.equal(preview.player.length, 6);
    assert.equal(preview.opponent.length, 6);
    const start = preview.phase === 'preview' ? choose(battle, 'lead', 5) : choose(battle, 'switch', 5);
    assert.equal(start.error, null);
    assert.equal(start.player.find(member => member.active).name, preview.player[5].name);
    const result = completeMatch(battle, start);
    assert.equal(result.replay.teamSize, 6);
    const output = await replayOutput(result.replay);
    assert.match(output, result.result === 'win' ? /\|win\|You/ : result.result === 'loss' ? /\|win\|Arena AI/ : /\|tie/);
  });
}
