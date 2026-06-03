// Auto-generated per-move skeleton tests. Regenerate via:
//   node tests/audit/generate-move-tests.js
//
// Category: Status
// Total moves: 269
// Auto-asserted: 59
// TODO (manual fill-in required): 210

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../../helpers/load-engine.js';

let mkMon, runTurn;
before(async () => {
  const e = await loadEngine();
  mkMon = e.mkMon;
  runTurn = e.runTurn;
});

describe('Status moves', () => {
  // Reuse the cached engine instance across all 'it' blocks in this file.
    it('Acid Armor' + ' [0 BP Poison Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Acid Armor', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.def, 2, 'def stage should be 2');
  });

  // 'Acupressure' — covered by a manual test (see by-category/manual/).

  it.todo('After You' + ' [0 BP Normal Status]', async () => {
    // TODO: assert After You's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  it('Agility' + ' [0 BP Psychic Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Agility', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.spe, 2, 'spe stage should be 2');
  });

  it.todo('Ally Switch' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Ally Switch's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  it('Amnesia' + ' [0 BP Psychic Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Amnesia', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.spd, 2, 'spd stage should be 2');
  });

  // 'Aqua Ring' — covered by a manual test (see by-category/manual/).

  // 'Aromatherapy' — covered by a manual test (see by-category/manual/).

  it.todo('Aromatic Mist' + ' [0 BP Fairy Status]', async () => {
    // TODO: assert Aromatic Mist's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  // 'Assist' — covered by a manual test (see by-category/manual/).

  // 'Attract' — covered by a manual test (see by-category/manual/).

  // 'Aurora Veil' — covered by a manual test (see by-category/manual/).

  it('Autotomize' + ' [0 BP Steel Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Autotomize', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.spe, 2, 'spe stage should be 2');
  });

  it('Baby-Doll Eyes' + ' [0 BP Fairy Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Baby-Doll Eyes', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.atk, -1, 'atk stage should be -1');
  });

  // 'Baneful Bunker' — covered by a manual test (see by-category/manual/).

  it('Barrier' + ' [0 BP Psychic Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Barrier', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.def, 2, 'def stage should be 2');
  });

  // 'Baton Pass' — covered by a manual test (see by-category/manual/).

  // 'Belly Drum' — covered by a manual test (see by-category/manual/).

  // 'Bestow' — covered by a manual test (see by-category/manual/).

  // 'Block' — covered by a manual test (see by-category/manual/).

  it('Bulk Up' + ' [0 BP Fighting Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Bulk Up', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.atk, 1, 'atk stage should be 1');
  });

  // 'Burning Bulwark' — covered by a manual test (see by-category/manual/).

  it('Calm Mind' + ' [0 BP Psychic Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Calm Mind', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.spa, 1, 'spa stage should be 1');
  });

  // 'Camouflage' — covered by a manual test (see by-category/manual/).

  // 'Captivate' — covered by a manual test (see by-category/manual/).

  // 'Celebrate' — covered by a manual test (see by-category/manual/).

  it('Charge' + ' [0 BP Electric Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Charge', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.spd, 1, 'spd stage should be 1');
  });

  it('Charm' + ' [0 BP Fairy Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Charm', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.atk, -2, 'atk stage should be -2');
  });

  // 'Chilly Reception' — covered by a manual test (see by-category/manual/).

  it('Clangorous Soul' + ' [0 BP Dragon Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Clangorous Soul', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.atk, 1, 'atk stage should be 1');
  });

  it.todo('Coaching' + ' [0 BP Fighting Status]', async () => {
    // TODO: assert Coaching's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  it('Coil' + ' [0 BP Poison Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Coil', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.atk, 1, 'atk stage should be 1');
  });

  it('Confide' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Confide', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.spa, -1, 'spa stage should be -1');
  });

  // 'Confuse Ray' — covered by a manual test (see by-category/manual/).

  // 'Conversion' — covered by a manual test (see by-category/manual/).

  // 'Conversion 2' — covered by a manual test (see by-category/manual/).

  // 'Copycat' — covered by a manual test (see by-category/manual/).

  it.todo('Corrosive Gas' + ' [0 BP Poison Status]', async () => {
    // TODO: assert Corrosive Gas's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  it('Cosmic Power' + ' [0 BP Psychic Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Cosmic Power', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.def, 1, 'def stage should be 1');
  });

  it('Cotton Guard' + ' [0 BP Grass Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Cotton Guard', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.def, 3, 'def stage should be 3');
  });

  // 'Cotton Spore' — covered by a manual test (see by-category/manual/).

  // 'Court Change' — covered by a manual test (see by-category/manual/).

  it.todo('Crafty Shield' + ' [0 BP Fairy Status]', async () => {
    // TODO: assert Crafty Shield's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  // 'Curse' — covered by a manual test (see by-category/manual/).

  it.todo('Dark Void' + ' [0 BP Dark Status]', async () => {
    // TODO: assert Dark Void's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  it.todo('Decorate' + ' [0 BP Fairy Status]', async () => {
    // TODO: assert Decorate's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  it('Defend Order' + ' [0 BP Bug Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Defend Order', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.def, 1, 'def stage should be 1');
  });

  it('Defense Curl' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Defense Curl', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.def, 1, 'def stage should be 1');
  });

  // 'Defog' — covered by a manual test (see by-category/manual/).

  // 'Destiny Bond' — covered by a manual test (see by-category/manual/).

  // 'Detect' — covered by a manual test (see by-category/manual/).

  it.todo('Disable' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Disable's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  it.todo('Doodle' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Doodle's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  it('Double Team' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Double Team', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.eva, 1, 'evasion stage should be 1');
  });

  it.todo('Dragon Cheer' + ' [0 BP Dragon Status]', async () => {
    // TODO: assert Dragon Cheer's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  it('Dragon Dance' + ' [0 BP Dragon Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Dragon Dance', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.atk, 1, 'atk stage should be 1');
  });

  it('Eerie Impulse' + ' [0 BP Electric Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Eerie Impulse', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.spa, -2, 'spa stage should be -2');
  });

  // 'Electric Terrain' — covered by a manual test (see by-category/manual/).

  it.todo('Electrify' + ' [0 BP Electric Status]', async () => {
    // TODO: assert Electrify's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  // 'Embargo' — covered by a manual test (see by-category/manual/).

  // 'Encore' — covered by a manual test (see by-category/manual/).

  // 'Endure' — covered by a manual test (see by-category/manual/).

  // 'Entrainment' — covered by a manual test (see by-category/manual/).

  it.todo('Fairy Lock' + ' [0 BP Fairy Status]', async () => {
    // TODO: assert Fairy Lock's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  it('Fake Tears' + ' [0 BP Dark Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Fake Tears', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.spd, -2, 'spd stage should be -2');
  });

  it('Feather Dance' + ' [0 BP Flying Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Feather Dance', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.atk, -2, 'atk stage should be -2');
  });

  it('Fillet Away' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Fillet Away', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.atk, 2, 'atk stage should be 2');
  });

  it('Flash' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Flash', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.acc, -1, 'accuracy stage should be -1');
  });

  it('Flatter' + ' [0 BP Dark Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Flatter', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.spa, 1, 'spa stage should be 1');
  });

  it.todo('Floral Healing' + ' [0 BP Fairy Status]', async () => {
    // TODO: assert Floral Healing's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  it.todo('Flower Shield' + ' [0 BP Fairy Status]', async () => {
    // TODO: assert Flower Shield's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  // 'Focus Energy' — covered by a manual test (see by-category/manual/).

  it.todo('Follow Me' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Follow Me's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  // 'Foresight' — covered by a manual test (see by-category/manual/).

  // 'Forest\'s Curse' — covered by a manual test (see by-category/manual/).

  // 'Gastro Acid' — covered by a manual test (see by-category/manual/).

  it.todo('Gear Up' + ' [0 BP Steel Status]', async () => {
    // TODO: assert Gear Up's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  // 'Geomancy' — covered by a manual test (see by-category/manual/).

  // 'Glare' — covered by a manual test (see by-category/manual/).

  // 'Grass Whistle' — covered by a manual test (see by-category/manual/).

  // 'Grassy Terrain' — covered by a manual test (see by-category/manual/).

  // 'Gravity' — covered by a manual test (see by-category/manual/).

  // 'Growl' — covered by a manual test (see by-category/manual/).

  it('Growth' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Growth', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.atk, 1, 'atk stage should be 1');
  });

  // 'Grudge' — covered by a manual test (see by-category/manual/).

  // 'Guard Split' — covered by a manual test (see by-category/manual/).

  // 'Guard Swap' — covered by a manual test (see by-category/manual/).

  // 'Hail' — covered by a manual test (see by-category/manual/).

  // 'Happy Hour' — covered by a manual test (see by-category/manual/).

  it('Harden' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Harden', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.def, 1, 'def stage should be 1');
  });

  // 'Haze' — covered by a manual test (see by-category/manual/).

  // 'Heal Bell' — covered by a manual test (see by-category/manual/).

  // 'Heal Block' — covered by a manual test (see by-category/manual/).

  // 'Heal Order' — covered by a manual test (see by-category/manual/).

  it.todo('Heal Pulse' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Heal Pulse's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  it.todo('Healing Wish' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Healing Wish's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  // 'Heart Swap' — covered by a manual test (see by-category/manual/).

  it.todo('Helping Hand' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Helping Hand's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  // 'Hold Hands' — covered by a manual test (see by-category/manual/).

  it('Hone Claws' + ' [0 BP Dark Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Hone Claws', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.atk, 1, 'atk stage should be 1');
  });

  // 'Howl' — covered by a manual test (see by-category/manual/).

  // 'Hypnosis' — covered by a manual test (see by-category/manual/).

  // 'Imprison' — covered by a manual test (see by-category/manual/).

  // 'Ingrain' — covered by a manual test (see by-category/manual/).

  // 'Instruct' — covered by a manual test (see by-category/manual/).

  it.todo('Ion Deluge' + ' [0 BP Electric Status]', async () => {
    // TODO: assert Ion Deluge's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  it('Iron Defense' + ' [0 BP Steel Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Iron Defense', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.def, 2, 'def stage should be 2');
  });

  // 'Jungle Healing' — covered by a manual test (see by-category/manual/).

  it('Kinesis' + ' [0 BP Psychic Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Kinesis', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.acc, -1, 'accuracy stage should be -1');
  });

  // 'King\'s Shield' — covered by a manual test (see by-category/manual/).

  it.todo('Laser Focus' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Laser Focus's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  // 'Leech Seed' — covered by a manual test (see by-category/manual/).

  // 'Leer' — covered by a manual test (see by-category/manual/).

  // 'Life Dew' — covered by a manual test (see by-category/manual/).

  // 'Light Screen' — covered by a manual test (see by-category/manual/).

  // 'Lock-On' — covered by a manual test (see by-category/manual/).

  // 'Lovely Kiss' — covered by a manual test (see by-category/manual/).

  // 'Lucky Chant' — covered by a manual test (see by-category/manual/).

  // 'Lunar Blessing' — covered by a manual test (see by-category/manual/).

  it.todo('Lunar Dance' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Lunar Dance's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  // 'Magic Coat' — covered by a manual test (see by-category/manual/).

  // 'Magic Powder' — covered by a manual test (see by-category/manual/).

  // 'Magic Room' — covered by a manual test (see by-category/manual/).

  // 'Magnet Rise' — covered by a manual test (see by-category/manual/).

  it.todo('Magnetic Flux' + ' [0 BP Electric Status]', async () => {
    // TODO: assert Magnetic Flux's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  it.todo('Mat Block' + ' [0 BP Fighting Status]', async () => {
    // TODO: assert Mat Block's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  // 'Me First' — covered by a manual test (see by-category/manual/).

  // 'Mean Look' — covered by a manual test (see by-category/manual/).

  it('Meditate' + ' [0 BP Psychic Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Meditate', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.atk, 1, 'atk stage should be 1');
  });

  it('Memento' + ' [0 BP Dark Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Memento', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.atk, -2, 'atk stage should be -2');
  });

  it('Metal Sound' + ' [0 BP Steel Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Metal Sound', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.spd, -2, 'spd stage should be -2');
  });

  // 'Metronome' — covered by a manual test (see by-category/manual/).

  // 'Milk Drink' — covered by a manual test (see by-category/manual/).

  // 'Mimic' — covered by a manual test (see by-category/manual/).

  // 'Mind Reader' — covered by a manual test (see by-category/manual/).

  it('Minimize' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Minimize', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.eva, 2, 'evasion stage should be 2');
  });

  // 'Miracle Eye' — covered by a manual test (see by-category/manual/).

  // 'Mirror Move' — covered by a manual test (see by-category/manual/).

  // 'Mist' — covered by a manual test (see by-category/manual/).

  // 'Misty Terrain' — covered by a manual test (see by-category/manual/).

  // 'Moonlight' — covered by a manual test (see by-category/manual/).

  // 'Morning Sun' — covered by a manual test (see by-category/manual/).

  // 'Mud Sport' — covered by a manual test (see by-category/manual/).

  it('Nasty Plot' + ' [0 BP Dark Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Nasty Plot', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.spa, 2, 'spa stage should be 2');
  });

  // 'Nature Power' — covered by a manual test (see by-category/manual/).

  it.todo('Nightmare' + ' [0 BP Ghost Status]', async () => {
    // TODO: assert Nightmare's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  it('No Retreat' + ' [0 BP Fighting Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['No Retreat', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.atk, 1, 'atk stage should be 1');
  });

  it('Noble Roar' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Noble Roar', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.atk, -1, 'atk stage should be -1');
  });

  // 'Obstruct' — covered by a manual test (see by-category/manual/).

  // 'Octolock' — covered by a manual test (see by-category/manual/).

  // 'Odor Sleuth' — covered by a manual test (see by-category/manual/).

  // 'Pain Split' — covered by a manual test (see by-category/manual/).

  // 'Parting Shot' — covered by a manual test (see by-category/manual/).

  // 'Perish Song' — covered by a manual test (see by-category/manual/).

  it('Play Nice' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Play Nice', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.atk, -1, 'atk stage should be -1');
  });

  // 'Poison Gas' — covered by a manual test (see by-category/manual/).

  // 'Poison Powder' — covered by a manual test (see by-category/manual/).

  it.todo('Powder' + ' [0 BP Bug Status]', async () => {
    // TODO: assert Powder's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  // 'Power Shift' — covered by a manual test (see by-category/manual/).

  // 'Power Split' — covered by a manual test (see by-category/manual/).

  // 'Power Swap' — covered by a manual test (see by-category/manual/).

  // 'Power Trick' — covered by a manual test (see by-category/manual/).

  // 'Protect' — covered by a manual test (see by-category/manual/).

  // 'Psych Up' — covered by a manual test (see by-category/manual/).

  // 'Psychic Terrain' — covered by a manual test (see by-category/manual/).

  // 'Psycho Shift' — covered by a manual test (see by-category/manual/).

  // 'Purify' — covered by a manual test (see by-category/manual/).

  it.todo('Quash' + ' [0 BP Dark Status]', async () => {
    // TODO: assert Quash's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  // 'Quick Guard' — covered by a manual test (see by-category/manual/).

  it('Quiver Dance' + ' [0 BP Bug Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Quiver Dance', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.spa, 1, 'spa stage should be 1');
  });

  it.todo('Rage Powder' + ' [0 BP Bug Status]', async () => {
    // TODO: assert Rage Powder's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  // 'Rain Dance' — covered by a manual test (see by-category/manual/).

  // 'Recover' — covered by a manual test (see by-category/manual/).

  it.todo('Recycle' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Recycle's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  // 'Reflect' — covered by a manual test (see by-category/manual/).

  // 'Reflect Type' — covered by a manual test (see by-category/manual/).

  // 'Refresh' — covered by a manual test (see by-category/manual/).

  // 'Rest' — covered by a manual test (see by-category/manual/).

  // 'Revival Blessing' — covered by a manual test (see by-category/manual/).

  // 'Roar' — covered by a manual test (see by-category/manual/).

  it('Rock Polish' + ' [0 BP Rock Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Rock Polish', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.spe, 2, 'spe stage should be 2');
  });

  // 'Role Play' — covered by a manual test (see by-category/manual/).

  // 'Roost' — covered by a manual test (see by-category/manual/).

  it.todo('Rototiller' + ' [0 BP Ground Status]', async () => {
    // TODO: assert Rototiller's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  // 'Safeguard' — covered by a manual test (see by-category/manual/).

  it('Sand Attack' + ' [0 BP Ground Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Sand Attack', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.acc, -1, 'accuracy stage should be -1');
  });

  // 'Sandstorm' — covered by a manual test (see by-category/manual/).

  it('Scary Face' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Scary Face', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.spe, -2, 'spe stage should be -2');
  });

  it('Screech' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Screech', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.def, -2, 'def stage should be -2');
  });

  it('Sharpen' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Sharpen', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.atk, 1, 'atk stage should be 1');
  });

  // 'Shed Tail' — covered by a manual test (see by-category/manual/).

  it('Shell Smash' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Shell Smash', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.def, -1, 'def stage should be -1');
  });

  it('Shelter' + ' [0 BP Steel Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Shelter', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.def, 2, 'def stage should be 2');
  });

  it('Shift Gear' + ' [0 BP Steel Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Shift Gear', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.spe, 2, 'spe stage should be 2');
  });

  // 'Shore Up' — covered by a manual test (see by-category/manual/).

  // 'Silk Trap' — covered by a manual test (see by-category/manual/).

  // 'Simple Beam' — covered by a manual test (see by-category/manual/).

  // 'Sing' — covered by a manual test (see by-category/manual/).

  // 'Sketch' — covered by a manual test (see by-category/manual/).

  // 'Skill Swap' — covered by a manual test (see by-category/manual/).

  // 'Slack Off' — covered by a manual test (see by-category/manual/).

  // 'Sleep Powder' — covered by a manual test (see by-category/manual/).

  // 'Sleep Talk' — covered by a manual test (see by-category/manual/).

  it('Smokescreen' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Smokescreen', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.acc, -1, 'accuracy stage should be -1');
  });

  // 'Snatch' — covered by a manual test (see by-category/manual/).

  // 'Snowscape' — covered by a manual test (see by-category/manual/).

  // 'Soak' — covered by a manual test (see by-category/manual/).

  // 'Soft-Boiled' — covered by a manual test (see by-category/manual/).

  // 'Speed Swap' — covered by a manual test (see by-category/manual/).

  it('Spicy Extract' + ' [0 BP Grass Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Spicy Extract', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.atk, 2, 'atk stage should be 2');
  });

  // 'Spider Web' — covered by a manual test (see by-category/manual/).

  // 'Spikes' — covered by a manual test (see by-category/manual/).

  // 'Spiky Shield' — covered by a manual test (see by-category/manual/).

  // 'Spite' — covered by a manual test (see by-category/manual/).

  // 'Splash' — covered by a manual test (see by-category/manual/).

  // 'Spore' — covered by a manual test (see by-category/manual/).

  it.todo('Spotlight' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Spotlight's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  // 'Stealth Rock' — covered by a manual test (see by-category/manual/).

  // 'Sticky Web' — covered by a manual test (see by-category/manual/).

  // 'Stockpile' — covered by a manual test (see by-category/manual/).

  // 'Strength Sap' — covered by a manual test (see by-category/manual/).

  // 'String Shot' — covered by a manual test (see by-category/manual/).

  // 'Stuff Cheeks' — covered by a manual test (see by-category/manual/).

  // 'Stun Spore' — covered by a manual test (see by-category/manual/).

  // 'Substitute' — covered by a manual test (see by-category/manual/).

  // 'Sunny Day' — covered by a manual test (see by-category/manual/).

  // 'Supersonic' — covered by a manual test (see by-category/manual/).

  it('Swagger' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Swagger', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.atk, 2, 'atk stage should be 2');
  });

  // 'Swallow' — covered by a manual test (see by-category/manual/).

  // 'Sweet Kiss' — covered by a manual test (see by-category/manual/).

  // 'Sweet Scent' — covered by a manual test (see by-category/manual/).

  it.todo('Switcheroo' + ' [0 BP Dark Status]', async () => {
    // TODO: assert Switcheroo's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  it('Swords Dance' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Swords Dance', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.atk, 2, 'atk stage should be 2');
  });

  // 'Synthesis' — covered by a manual test (see by-category/manual/).

  it('Tail Glow' + ' [0 BP Bug Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Tail Glow', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.spa, 3, 'spa stage should be 3');
  });

  // 'Tail Whip' — covered by a manual test (see by-category/manual/).

  // 'Tailwind' — covered by a manual test (see by-category/manual/).

  // 'Take Heart' — covered by a manual test (see by-category/manual/).

  it('Tar Shot' + ' [0 BP Rock Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Tar Shot', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.spe, -1, 'spe stage should be -1');
  });

  // 'Taunt' — covered by a manual test (see by-category/manual/).

  it('Tearful Look' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Tearful Look', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.atk, -1, 'atk stage should be -1');
  });

  // 'Teatime' — covered by a manual test (see by-category/manual/).

  // 'Teeter Dance' — covered by a manual test (see by-category/manual/).

  // 'Telekinesis' — covered by a manual test (see by-category/manual/).

  // 'Teleport' — covered by a manual test (see by-category/manual/).

  // 'Thunder Wave' — covered by a manual test (see by-category/manual/).

  it('Tickle' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Tickle', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.atk, -1, 'atk stage should be -1');
  });

  // 'Tidy Up' — covered by a manual test (see by-category/manual/).

  // 'Topsy-Turvy' — covered by a manual test (see by-category/manual/).

  // 'Torment' — covered by a manual test (see by-category/manual/).

  // 'Toxic' — covered by a manual test (see by-category/manual/).

  // 'Toxic Spikes' — covered by a manual test (see by-category/manual/).

  it('Toxic Thread' + ' [0 BP Poison Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Toxic Thread', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.spe, -1, 'spe stage should be -1');
  });

  // 'Transform' — covered by a manual test (see by-category/manual/).

  it.todo('Trick' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Trick's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  // 'Trick Room' — covered by a manual test (see by-category/manual/).

  // 'Trick-or-Treat' — covered by a manual test (see by-category/manual/).

  it.todo('Venom Drench' + ' [0 BP Poison Status]', async () => {
    // TODO: assert Venom Drench's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  it('Victory Dance' + ' [0 BP Fighting Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Victory Dance', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.atk, 1, 'atk stage should be 1');
  });

  // 'Water Sport' — covered by a manual test (see by-category/manual/).

  // 'Whirlwind' — covered by a manual test (see by-category/manual/).

  // 'Wide Guard' — covered by a manual test (see by-category/manual/).

  // 'Will-O-Wisp' — covered by a manual test (see by-category/manual/).

  // 'Wish' — covered by a manual test (see by-category/manual/).

  it('Withdraw' + ' [0 BP Water Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Withdraw', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.def, 1, 'def stage should be 1');
  });

  // 'Wonder Room' — covered by a manual test (see by-category/manual/).

  it('Work Up' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Work Up', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.atk, 1, 'atk stage should be 1');
  });

  // 'Worry Seed' — covered by a manual test (see by-category/manual/).

  // 'Yawn' — covered by a manual test (see by-category/manual/).
});
