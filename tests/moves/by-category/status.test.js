// Auto-generated per-move skeleton tests. Regenerate via:
//   node tests/audit/generate-move-tests.js
//
// Category: Status
// Total moves: 269
// Auto-asserted: 81
// TODO (manual fill-in required): 188

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

  it.todo('Acupressure' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Acupressure's declared behavior
  });

  it.todo('After You' + ' [0 BP Normal Status]', async () => {
    // TODO: assert After You's declared behavior
  });

  it('Agility' + ' [0 BP Psychic Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Agility', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.spe, 2, 'spe stage should be 2');
  });

  it.todo('Ally Switch' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Ally Switch's declared behavior
  });

  it('Amnesia' + ' [0 BP Psychic Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Amnesia', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.spd, 2, 'spd stage should be 2');
  });

  it('Aqua Ring' + ' [0 BP Water Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Aqua Ring', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(attacker.volatile.aquaRing, 'Aqua Ring should set volatile.aquaRing');
  });

  it.todo('Aromatherapy' + ' [0 BP Grass Status]', async () => {
    // TODO: assert Aromatherapy's declared behavior
  });

  it.todo('Aromatic Mist' + ' [0 BP Fairy Status]', async () => {
    // TODO: assert Aromatic Mist's declared behavior
  });

  it.todo('Assist' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Assist's declared behavior
  });

  it.todo('Attract' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Attract's declared behavior
  });

  it.todo('Aurora Veil' + ' [0 BP Ice Status]', async () => {
    // TODO: assert Aurora Veil's declared behavior
  });

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

  it.todo('Baneful Bunker' + ' [0 BP Poison Status]', async () => {
    // TODO: assert Baneful Bunker's declared behavior
  });

  it('Barrier' + ' [0 BP Psychic Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Barrier', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.def, 2, 'def stage should be 2');
  });

  it.todo('Baton Pass' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Baton Pass's declared behavior
  });

  it.todo('Belly Drum' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Belly Drum's declared behavior
  });

  it.todo('Bestow' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Bestow's declared behavior
  });

  it.todo('Block' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Block's declared behavior
  });

  it('Bulk Up' + ' [0 BP Fighting Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Bulk Up', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.atk, 1, 'atk stage should be 1');
  });

  it.todo('Burning Bulwark' + ' [0 BP Fire Status]', async () => {
    // TODO: assert Burning Bulwark's declared behavior
  });

  it('Calm Mind' + ' [0 BP Psychic Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Calm Mind', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.spa, 1, 'spa stage should be 1');
  });

  it.todo('Camouflage' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Camouflage's declared behavior
  });

  it('Captivate' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Captivate', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.spa, -2, 'spa stage should be -2');
  });

  it.todo('Celebrate' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Celebrate's declared behavior
  });

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

  it.todo('Chilly Reception' + ' [0 BP Ice Status]', async () => {
    // TODO: assert Chilly Reception's declared behavior
  });

  it('Clangorous Soul' + ' [0 BP Dragon Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Clangorous Soul', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.atk, 1, 'atk stage should be 1');
  });

  it.todo('Coaching' + ' [0 BP Fighting Status]', async () => {
    // TODO: assert Coaching's declared behavior
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

  it('Confuse Ray' + ' [0 BP Ghost Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Confuse Ray', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.volatile.confusion, 'Confuse Ray should set volatile.confusion');
  });

  it.todo('Conversion' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Conversion's declared behavior
  });

  it.todo('Conversion 2' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Conversion 2's declared behavior
  });

  it.todo('Copycat' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Copycat's declared behavior
  });

  it.todo('Corrosive Gas' + ' [0 BP Poison Status]', async () => {
    // TODO: assert Corrosive Gas's declared behavior
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

  it.todo('Cotton Spore' + ' [0 BP Grass Status]', async () => {
    // TODO: assert Cotton Spore's declared behavior
  });

  it.todo('Court Change' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Court Change's declared behavior
  });

  it.todo('Crafty Shield' + ' [0 BP Fairy Status]', async () => {
    // TODO: assert Crafty Shield's declared behavior
  });

  it.todo('Curse' + ' [0 BP Ghost Status]', async () => {
    // TODO: assert Curse's declared behavior
  });

  it.todo('Dark Void' + ' [0 BP Dark Status]', async () => {
    // TODO: assert Dark Void's declared behavior
  });

  it.todo('Decorate' + ' [0 BP Fairy Status]', async () => {
    // TODO: assert Decorate's declared behavior
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

  it.todo('Defog' + ' [0 BP Flying Status]', async () => {
    // TODO: assert Defog's declared behavior
  });

  it.todo('Destiny Bond' + ' [0 BP Ghost Status]', async () => {
    // TODO: assert Destiny Bond's declared behavior
  });

  it.todo('Detect' + ' [0 BP Fighting Status]', async () => {
    // TODO: assert Detect's declared behavior
  });

  it.todo('Disable' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Disable's declared behavior
  });

  it.todo('Doodle' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Doodle's declared behavior
  });

  it('Double Team' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Double Team', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.eva, 1, 'evasion stage should be 1');
  });

  it.todo('Dragon Cheer' + ' [0 BP Dragon Status]', async () => {
    // TODO: assert Dragon Cheer's declared behavior
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

  it.todo('Electric Terrain' + ' [0 BP Electric Status]', async () => {
    // TODO: assert Electric Terrain's declared behavior
  });

  it.todo('Electrify' + ' [0 BP Electric Status]', async () => {
    // TODO: assert Electrify's declared behavior
  });

  it('Embargo' + ' [0 BP Dark Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Embargo', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.volatile.embargo, 'Embargo should set volatile.embargo');
  });

  it.todo('Encore' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Encore's declared behavior
  });

  it.todo('Endure' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Endure's declared behavior
  });

  it.todo('Entrainment' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Entrainment's declared behavior
  });

  it.todo('Fairy Lock' + ' [0 BP Fairy Status]', async () => {
    // TODO: assert Fairy Lock's declared behavior
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
    // TODO: assert Floral Healing's declared behavior
  });

  it.todo('Flower Shield' + ' [0 BP Fairy Status]', async () => {
    // TODO: assert Flower Shield's declared behavior
  });

  it('Focus Energy' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Focus Energy', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(attacker.volatile.focusEnergy, 'Focus Energy should set volatile.focusEnergy');
  });

  it.todo('Follow Me' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Follow Me's declared behavior
  });

  it('Foresight' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Foresight', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.volatile.identified, 'Foresight should set volatile.identified');
  });

  it.todo('Forests Curse' + ' [0 BP Grass Status]', async () => {
    // TODO: assert Forest's Curse's declared behavior
  });

  it.todo('Gastro Acid' + ' [0 BP Poison Status]', async () => {
    // TODO: assert Gastro Acid's declared behavior
  });

  it.todo('Gear Up' + ' [0 BP Steel Status]', async () => {
    // TODO: assert Gear Up's declared behavior
  });

  it.todo('Geomancy' + ' [0 BP Fairy Status]', async () => {
    // TODO: assert Geomancy's declared behavior
  });

  it.todo('Glare' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Glare's declared behavior
  });

  it.todo('Grass Whistle' + ' [0 BP Grass Status]', async () => {
    // TODO: assert Grass Whistle's declared behavior
  });

  it.todo('Grassy Terrain' + ' [0 BP Grass Status]', async () => {
    // TODO: assert Grassy Terrain's declared behavior
  });

  it.todo('Gravity' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Gravity's declared behavior
  });

  it('Growl' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Growl', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.atk, -1, 'atk stage should be -1');
  });

  it('Growth' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Growth', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.atk, 1, 'atk stage should be 1');
  });

  it.todo('Grudge' + ' [0 BP Ghost Status]', async () => {
    // TODO: assert Grudge's declared behavior
  });

  it.todo('Guard Split' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Guard Split's declared behavior
  });

  it.todo('Guard Swap' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Guard Swap's declared behavior
  });

  it.todo('Hail' + ' [0 BP Ice Status]', async () => {
    // TODO: assert Hail's declared behavior
  });

  it.todo('Happy Hour' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Happy Hour's declared behavior
  });

  it('Harden' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Harden', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.def, 1, 'def stage should be 1');
  });

  it.todo('Haze' + ' [0 BP Ice Status]', async () => {
    // TODO: assert Haze's declared behavior
  });

  it.todo('Heal Bell' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Heal Bell's declared behavior
  });

  it('Heal Block' + ' [0 BP Psychic Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Heal Block', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.volatile.healBlock, 'Heal Block should set volatile.healBlock');
  });

  it.todo('Heal Order' + ' [0 BP Bug Status]', async () => {
    // TODO: assert Heal Order's declared behavior
  });

  it.todo('Heal Pulse' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Heal Pulse's declared behavior
  });

  it.todo('Healing Wish' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Healing Wish's declared behavior
  });

  it.todo('Heart Swap' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Heart Swap's declared behavior
  });

  it.todo('Helping Hand' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Helping Hand's declared behavior
  });

  it.todo('Hold Hands' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Hold Hands's declared behavior
  });

  it('Hone Claws' + ' [0 BP Dark Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Hone Claws', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.atk, 1, 'atk stage should be 1');
  });

  it.todo('Howl' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Howl's declared behavior
  });

  it.todo('Hypnosis' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Hypnosis's declared behavior
  });

  it.todo('Imprison' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Imprison's declared behavior
  });

  it('Ingrain' + ' [0 BP Grass Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Ingrain', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(attacker.volatile.ingrain, 'Ingrain should set volatile.ingrain');
  });

  it.todo('Instruct' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Instruct's declared behavior
  });

  it.todo('Ion Deluge' + ' [0 BP Electric Status]', async () => {
    // TODO: assert Ion Deluge's declared behavior
  });

  it('Iron Defense' + ' [0 BP Steel Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Iron Defense', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.def, 2, 'def stage should be 2');
  });

  it.todo('Jungle Healing' + ' [0 BP Grass Status]', async () => {
    // TODO: assert Jungle Healing's declared behavior
  });

  it('Kinesis' + ' [0 BP Psychic Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Kinesis', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.acc, -1, 'accuracy stage should be -1');
  });

  it.todo('Kings Shield' + ' [0 BP Steel Status]', async () => {
    // TODO: assert King's Shield's declared behavior
  });

  it.todo('Laser Focus' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Laser Focus's declared behavior
  });

  it.todo('Leech Seed' + ' [0 BP Grass Status]', async () => {
    // TODO: assert Leech Seed's declared behavior
  });

  it('Leer' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Leer', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.def, -1, 'def stage should be -1');
  });

  it.todo('Life Dew' + ' [0 BP Water Status]', async () => {
    // TODO: assert Life Dew's declared behavior
  });

  it.todo('Light Screen' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Light Screen's declared behavior
  });

  it.todo('Lock-On' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Lock-On's declared behavior
  });

  it.todo('Lovely Kiss' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Lovely Kiss's declared behavior
  });

  it.todo('Lucky Chant' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Lucky Chant's declared behavior
  });

  it.todo('Lunar Blessing' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Lunar Blessing's declared behavior
  });

  it.todo('Lunar Dance' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Lunar Dance's declared behavior
  });

  it.todo('Magic Coat' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Magic Coat's declared behavior
  });

  it.todo('Magic Powder' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Magic Powder's declared behavior
  });

  it.todo('Magic Room' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Magic Room's declared behavior
  });

  it('Magnet Rise' + ' [0 BP Electric Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Magnet Rise', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(attacker.volatile.magnetRise, 'Magnet Rise should set volatile.magnetRise');
  });

  it.todo('Magnetic Flux' + ' [0 BP Electric Status]', async () => {
    // TODO: assert Magnetic Flux's declared behavior
  });

  it.todo('Mat Block' + ' [0 BP Fighting Status]', async () => {
    // TODO: assert Mat Block's declared behavior
  });

  it.todo('Me First' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Me First's declared behavior
  });

  it.todo('Mean Look' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Mean Look's declared behavior
  });

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

  it.todo('Metronome' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Metronome's declared behavior
  });

  it.todo('Milk Drink' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Milk Drink's declared behavior
  });

  it.todo('Mimic' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Mimic's declared behavior
  });

  it.todo('Mind Reader' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Mind Reader's declared behavior
  });

  it('Minimize' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Minimize', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.eva, 2, 'evasion stage should be 2');
  });

  it.todo('Miracle Eye' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Miracle Eye's declared behavior
  });

  it.todo('Mirror Move' + ' [0 BP Flying Status]', async () => {
    // TODO: assert Mirror Move's declared behavior
  });

  it.todo('Mist' + ' [0 BP Ice Status]', async () => {
    // TODO: assert Mist's declared behavior
  });

  it.todo('Misty Terrain' + ' [0 BP Fairy Status]', async () => {
    // TODO: assert Misty Terrain's declared behavior
  });

  it.todo('Moonlight' + ' [0 BP Fairy Status]', async () => {
    // TODO: assert Moonlight's declared behavior
  });

  it.todo('Morning Sun' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Morning Sun's declared behavior
  });

  it.todo('Mud Sport' + ' [0 BP Ground Status]', async () => {
    // TODO: assert Mud Sport's declared behavior
  });

  it('Nasty Plot' + ' [0 BP Dark Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Nasty Plot', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.spa, 2, 'spa stage should be 2');
  });

  it.todo('Nature Power' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Nature Power's declared behavior
  });

  it.todo('Nightmare' + ' [0 BP Ghost Status]', async () => {
    // TODO: assert Nightmare's declared behavior
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

  it.todo('Obstruct' + ' [0 BP Dark Status]', async () => {
    // TODO: assert Obstruct's declared behavior
  });

  it('Octolock' + ' [0 BP Fighting Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Octolock', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.volatile.octolock, 'Octolock should set volatile.octolock');
  });

  it('Odor Sleuth' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Odor Sleuth', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.volatile.identified, 'Odor Sleuth should set volatile.identified');
  });

  it.todo('Pain Split' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Pain Split's declared behavior
  });

  it.todo('Parting Shot' + ' [0 BP Dark Status]', async () => {
    // TODO: assert Parting Shot's declared behavior
  });

  it.todo('Perish Song' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Perish Song's declared behavior
  });

  it('Play Nice' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Play Nice', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.atk, -1, 'atk stage should be -1');
  });

  it.todo('Poison Gas' + ' [0 BP Poison Status]', async () => {
    // TODO: assert Poison Gas's declared behavior
  });

  it.todo('Poison Powder' + ' [0 BP Poison Status]', async () => {
    // TODO: assert Poison Powder's declared behavior
  });

  it.todo('Powder' + ' [0 BP Bug Status]', async () => {
    // TODO: assert Powder's declared behavior
  });

  it.todo('Power Shift' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Power Shift's declared behavior
  });

  it.todo('Power Split' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Power Split's declared behavior
  });

  it.todo('Power Swap' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Power Swap's declared behavior
  });

  it.todo('Power Trick' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Power Trick's declared behavior
  });

  it.todo('Protect' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Protect's declared behavior
  });

  it.todo('Psych Up' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Psych Up's declared behavior
  });

  it.todo('Psychic Terrain' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Psychic Terrain's declared behavior
  });

  it.todo('Psycho Shift' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Psycho Shift's declared behavior
  });

  it.todo('Purify' + ' [0 BP Poison Status]', async () => {
    // TODO: assert Purify's declared behavior
  });

  it.todo('Quash' + ' [0 BP Dark Status]', async () => {
    // TODO: assert Quash's declared behavior
  });

  it.todo('Quick Guard' + ' [0 BP Fighting Status]', async () => {
    // TODO: assert Quick Guard's declared behavior
  });

  it('Quiver Dance' + ' [0 BP Bug Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Quiver Dance', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.spa, 1, 'spa stage should be 1');
  });

  it.todo('Rage Powder' + ' [0 BP Bug Status]', async () => {
    // TODO: assert Rage Powder's declared behavior
  });

  it.todo('Rain Dance' + ' [0 BP Water Status]', async () => {
    // TODO: assert Rain Dance's declared behavior
  });

  it.todo('Recover' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Recover's declared behavior
  });

  it.todo('Recycle' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Recycle's declared behavior
  });

  it.todo('Reflect' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Reflect's declared behavior
  });

  it.todo('Reflect Type' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Reflect Type's declared behavior
  });

  it.todo('Refresh' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Refresh's declared behavior
  });

  it.todo('Rest' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Rest's declared behavior
  });

  it.todo('Revival Blessing' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Revival Blessing's declared behavior
  });

  it.todo('Roar' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Roar's declared behavior
  });

  it('Rock Polish' + ' [0 BP Rock Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Rock Polish', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.spe, 2, 'spe stage should be 2');
  });

  it.todo('Role Play' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Role Play's declared behavior
  });

  it.todo('Roost' + ' [0 BP Flying Status]', async () => {
    // TODO: assert Roost's declared behavior
  });

  it.todo('Rototiller' + ' [0 BP Ground Status]', async () => {
    // TODO: assert Rototiller's declared behavior
  });

  it.todo('Safeguard' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Safeguard's declared behavior
  });

  it('Sand Attack' + ' [0 BP Ground Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Sand Attack', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.acc, -1, 'accuracy stage should be -1');
  });

  it.todo('Sandstorm' + ' [0 BP Rock Status]', async () => {
    // TODO: assert Sandstorm's declared behavior
  });

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

  it.todo('Shed Tail' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Shed Tail's declared behavior
  });

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

  it.todo('Shore Up' + ' [0 BP Ground Status]', async () => {
    // TODO: assert Shore Up's declared behavior
  });

  it.todo('Silk Trap' + ' [0 BP Bug Status]', async () => {
    // TODO: assert Silk Trap's declared behavior
  });

  it.todo('Simple Beam' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Simple Beam's declared behavior
  });

  it.todo('Sing' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Sing's declared behavior
  });

  it.todo('Sketch' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Sketch's declared behavior
  });

  it.todo('Skill Swap' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Skill Swap's declared behavior
  });

  it.todo('Slack Off' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Slack Off's declared behavior
  });

  it.todo('Sleep Powder' + ' [0 BP Grass Status]', async () => {
    // TODO: assert Sleep Powder's declared behavior
  });

  it.todo('Sleep Talk' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Sleep Talk's declared behavior
  });

  it('Smokescreen' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Smokescreen', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.acc, -1, 'accuracy stage should be -1');
  });

  it.todo('Snatch' + ' [0 BP Dark Status]', async () => {
    // TODO: assert Snatch's declared behavior
  });

  it.todo('Snowscape' + ' [0 BP Ice Status]', async () => {
    // TODO: assert Snowscape's declared behavior
  });

  it.todo('Soak' + ' [0 BP Water Status]', async () => {
    // TODO: assert Soak's declared behavior
  });

  it.todo('Soft-Boiled' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Soft-Boiled's declared behavior
  });

  it.todo('Speed Swap' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Speed Swap's declared behavior
  });

  it('Spicy Extract' + ' [0 BP Grass Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Spicy Extract', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.atk, 2, 'atk stage should be 2');
  });

  it.todo('Spider Web' + ' [0 BP Bug Status]', async () => {
    // TODO: assert Spider Web's declared behavior
  });

  it.todo('Spikes' + ' [0 BP Ground Status]', async () => {
    // TODO: assert Spikes's declared behavior
  });

  it.todo('Spiky Shield' + ' [0 BP Grass Status]', async () => {
    // TODO: assert Spiky Shield's declared behavior
  });

  it.todo('Spite' + ' [0 BP Ghost Status]', async () => {
    // TODO: assert Spite's declared behavior
  });

  it.todo('Splash' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Splash's declared behavior
  });

  it.todo('Spore' + ' [0 BP Grass Status]', async () => {
    // TODO: assert Spore's declared behavior
  });

  it.todo('Spotlight' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Spotlight's declared behavior
  });

  it.todo('Stealth Rock' + ' [0 BP Rock Status]', async () => {
    // TODO: assert Stealth Rock's declared behavior
  });

  it.todo('Sticky Web' + ' [0 BP Bug Status]', async () => {
    // TODO: assert Sticky Web's declared behavior
  });

  it.todo('Stockpile' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Stockpile's declared behavior
  });

  it.todo('Strength Sap' + ' [0 BP Grass Status]', async () => {
    // TODO: assert Strength Sap's declared behavior
  });

  it('String Shot' + ' [0 BP Bug Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['String Shot', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.spe, -2, 'spe stage should be -2');
  });

  it.todo('Stuff Cheeks' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Stuff Cheeks's declared behavior
  });

  it.todo('Stun Spore' + ' [0 BP Grass Status]', async () => {
    // TODO: assert Stun Spore's declared behavior
  });

  it.todo('Substitute' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Substitute's declared behavior
  });

  it.todo('Sunny Day' + ' [0 BP Fire Status]', async () => {
    // TODO: assert Sunny Day's declared behavior
  });

  it('Supersonic' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Supersonic', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.volatile.confusion, 'Supersonic should set volatile.confusion');
  });

  it('Swagger' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Swagger', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.atk, 2, 'atk stage should be 2');
  });

  it.todo('Swallow' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Swallow's declared behavior
  });

  it('Sweet Kiss' + ' [0 BP Fairy Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Sweet Kiss', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.volatile.confusion, 'Sweet Kiss should set volatile.confusion');
  });

  it('Sweet Scent' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Sweet Scent', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.eva, -2, 'evasion stage should be -2');
  });

  it.todo('Switcheroo' + ' [0 BP Dark Status]', async () => {
    // TODO: assert Switcheroo's declared behavior
  });

  it('Swords Dance' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Swords Dance', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.atk, 2, 'atk stage should be 2');
  });

  it.todo('Synthesis' + ' [0 BP Grass Status]', async () => {
    // TODO: assert Synthesis's declared behavior
  });

  it('Tail Glow' + ' [0 BP Bug Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Tail Glow', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.spa, 3, 'spa stage should be 3');
  });

  it('Tail Whip' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Tail Whip', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.def, -1, 'def stage should be -1');
  });

  it.todo('Tailwind' + ' [0 BP Flying Status]', async () => {
    // TODO: assert Tailwind's declared behavior
  });

  it.todo('Take Heart' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Take Heart's declared behavior
  });

  it('Tar Shot' + ' [0 BP Rock Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Tar Shot', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.spe, -1, 'spe stage should be -1');
  });

  it('Taunt' + ' [0 BP Dark Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Taunt', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.volatile.taunt, 'Taunt should set volatile.taunt');
  });

  it('Tearful Look' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Tearful Look', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.atk, -1, 'atk stage should be -1');
  });

  it.todo('Teatime' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Teatime's declared behavior
  });

  it('Teeter Dance' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Teeter Dance', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.volatile.confusion, 'Teeter Dance should set volatile.confusion');
  });

  it('Telekinesis' + ' [0 BP Psychic Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Telekinesis', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.volatile.telekinesis, 'Telekinesis should set volatile.telekinesis');
  });

  it.todo('Teleport' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Teleport's declared behavior
  });

  it.todo('Thunder Wave' + ' [0 BP Electric Status]', async () => {
    // TODO: assert Thunder Wave's declared behavior
  });

  it('Tickle' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Tickle', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.atk, -1, 'atk stage should be -1');
  });

  it.todo('Tidy Up' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Tidy Up's declared behavior
  });

  it.todo('Topsy-Turvy' + ' [0 BP Dark Status]', async () => {
    // TODO: assert Topsy-Turvy's declared behavior
  });

  it('Torment' + ' [0 BP Dark Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Torment', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.volatile.torment, 'Torment should set volatile.torment');
  });

  it.todo('Toxic' + ' [0 BP Poison Status]', async () => {
    // TODO: assert Toxic's declared behavior
  });

  it.todo('Toxic Spikes' + ' [0 BP Poison Status]', async () => {
    // TODO: assert Toxic Spikes's declared behavior
  });

  it('Toxic Thread' + ' [0 BP Poison Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Toxic Thread', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(defender.stages.spe, -1, 'spe stage should be -1');
  });

  it.todo('Transform' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Transform's declared behavior
  });

  it.todo('Trick' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Trick's declared behavior
  });

  it.todo('Trick Room' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Trick Room's declared behavior
  });

  it.todo('Trick-or-Treat' + ' [0 BP Ghost Status]', async () => {
    // TODO: assert Trick-or-Treat's declared behavior
  });

  it.todo('Venom Drench' + ' [0 BP Poison Status]', async () => {
    // TODO: assert Venom Drench's declared behavior
  });

  it('Victory Dance' + ' [0 BP Fighting Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Victory Dance', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.atk, 1, 'atk stage should be 1');
  });

  it.todo('Water Sport' + ' [0 BP Water Status]', async () => {
    // TODO: assert Water Sport's declared behavior
  });

  it.todo('Whirlwind' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Whirlwind's declared behavior
  });

  it.todo('Wide Guard' + ' [0 BP Rock Status]', async () => {
    // TODO: assert Wide Guard's declared behavior
  });

  it.todo('Will-O-Wisp' + ' [0 BP Fire Status]', async () => {
    // TODO: assert Will-O-Wisp's declared behavior
  });

  it.todo('Wish' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Wish's declared behavior
  });

  it('Withdraw' + ' [0 BP Water Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Withdraw', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.def, 1, 'def stage should be 1');
  });

  it.todo('Wonder Room' + ' [0 BP Psychic Status]', async () => {
    // TODO: assert Wonder Room's declared behavior
  });

  it('Work Up' + ' [0 BP Normal Status]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Work Up', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.equal(attacker.stages.atk, 1, 'atk stage should be 1');
  });

  it.todo('Worry Seed' + ' [0 BP Grass Status]', async () => {
    // TODO: assert Worry Seed's declared behavior
  });

  it.todo('Yawn' + ' [0 BP Normal Status]', async () => {
    // TODO: assert Yawn's declared behavior
  });
});
