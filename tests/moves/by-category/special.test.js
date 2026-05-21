// Auto-generated per-move skeleton tests. Regenerate via:
//   node tests/audit/generate-move-tests.js
//
// Category: Special
// Total moves: 251
// Auto-asserted: 177
// TODO (manual fill-in required): 74

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../../helpers/load-engine.js';

let mkMon, runTurn;
before(async () => {
  const e = await loadEngine();
  mkMon = e.mkMon;
  runTurn = e.runTurn;
});

describe('Special moves', () => {
  // Reuse the cached engine instance across all 'it' blocks in this file.
    it('Absorb' + ' [20 BP Grass Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Absorb', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Absorb should reduce defender HP');
  });

  it.todo('Acid' + ' [40 BP Poison Special]', async () => {
    // TODO: assert Acid's declared behavior
  });

  it('Acid Spray' + ' [40 BP Poison Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Acid Spray', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Acid Spray should reduce defender HP');
  });

  it('Aeroblast' + ' [100 BP Flying Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Aeroblast', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Aeroblast should reduce defender HP');
  });

  it.todo('Air Cutter' + ' [60 BP Flying Special]', async () => {
    // TODO: assert Air Cutter's declared behavior
  });

  it('Air Slash' + ' [75 BP Flying Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Air Slash', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Air Slash should reduce defender HP');
  });

  it('Alluring Voice' + ' [80 BP Fairy Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Alluring Voice', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Alluring Voice should reduce defender HP');
  });

  it('Ancient Power' + ' [60 BP Rock Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Ancient Power', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Ancient Power should reduce defender HP');
  });

  it('Apple Acid' + ' [80 BP Grass Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Apple Acid', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Apple Acid should reduce defender HP');
  });

  it('Armor Cannon' + ' [120 BP Fire Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Armor Cannon', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Armor Cannon should reduce defender HP');
  });

  it.todo('Astral Barrage' + ' [120 BP Ghost Special]', async () => {
    // TODO: assert Astral Barrage's declared behavior
  });

  it('Aura Sphere' + ' [80 BP Fighting Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Aura Sphere', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Aura Sphere should reduce defender HP');
  });

  it('Aurora Beam' + ' [65 BP Ice Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Aurora Beam', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Aurora Beam should reduce defender HP');
  });

  it('Baddy Bad' + ' [80 BP Dark Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Baddy Bad', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Baddy Bad should reduce defender HP');
  });

  it('Belch' + ' [120 BP Poison Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Belch', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Belch should reduce defender HP');
  });

  it('Bitter Malice' + ' [75 BP Ghost Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Bitter Malice', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Bitter Malice should reduce defender HP');
  });

  it('Blast Burn' + ' [150 BP Fire Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Blast Burn', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Blast Burn should reduce defender HP');
  });

  it.todo('Bleakwind Storm' + ' [100 BP Flying Special]', async () => {
    // TODO: assert Bleakwind Storm's declared behavior
  });

  it.todo('Blizzard' + ' [110 BP Ice Special]', async () => {
    // TODO: assert Blizzard's declared behavior
  });

  it('Blood Moon' + ' [140 BP Normal Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Blood Moon', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Blood Moon should reduce defender HP');
  });

  it('Blue Flare' + ' [130 BP Fire Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Blue Flare', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Blue Flare should reduce defender HP');
  });

  it.todo('Boomburst' + ' [140 BP Normal Special]', async () => {
    // TODO: assert Boomburst's declared behavior
  });

  it('Bouncy Bubble' + ' [60 BP Water Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Bouncy Bubble', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Bouncy Bubble should reduce defender HP');
  });

  it('Brine' + ' [65 BP Water Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Brine', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Brine should reduce defender HP');
  });

  it.todo('Bubble' + ' [40 BP Water Special]', async () => {
    // TODO: assert Bubble's declared behavior
  });

  it('Bubble Beam' + ' [65 BP Water Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Bubble Beam', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Bubble Beam should reduce defender HP');
  });

  it('Bug Buzz' + ' [90 BP Bug Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Bug Buzz', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Bug Buzz should reduce defender HP');
  });

  it.todo('Burn Up' + ' [130 BP Fire Special]', async () => {
    // TODO: assert Burn Up's declared behavior
  });

  it.todo('Burning Jealousy' + ' [70 BP Fire Special]', async () => {
    // TODO: assert Burning Jealousy's declared behavior
  });

  it('Buzzy Buzz' + ' [60 BP Electric Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Buzzy Buzz', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Buzzy Buzz should reduce defender HP');
  });

  it('Charge Beam' + ' [50 BP Electric Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Charge Beam', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Charge Beam should reduce defender HP');
  });

  it('Chatter' + ' [65 BP Flying Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Chatter', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Chatter should reduce defender HP');
  });

  it('Chilling Water' + ' [50 BP Water Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Chilling Water', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Chilling Water should reduce defender HP');
  });

  it('Chloroblast' + ' [150 BP Grass Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Chloroblast', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Chloroblast should reduce defender HP');
  });

  it.todo('Clanging Scales' + ' [110 BP Dragon Special]', async () => {
    // TODO: assert Clanging Scales's declared behavior
  });

  it('Clear Smog' + ' [50 BP Poison Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Clear Smog', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Clear Smog should reduce defender HP');
  });

  it('Confusion' + ' [50 BP Psychic Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Confusion', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Confusion should reduce defender HP');
  });

  it.todo('Core Enforcer' + ' [100 BP Dragon Special]', async () => {
    // TODO: assert Core Enforcer's declared behavior
  });

  it('Dark Pulse' + ' [80 BP Dark Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Dark Pulse', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Dark Pulse should reduce defender HP');
  });

  it.todo('Dazzling Gleam' + ' [80 BP Fairy Special]', async () => {
    // TODO: assert Dazzling Gleam's declared behavior
  });

  it.todo('Disarming Voice' + ' [40 BP Fairy Special]', async () => {
    // TODO: assert Disarming Voice's declared behavior
  });

  it.todo('Discharge' + ' [80 BP Electric Special]', async () => {
    // TODO: assert Discharge's declared behavior
  });

  it.todo('Doom Desire' + ' [140 BP Steel Special]', async () => {
    // TODO: assert Doom Desire's declared behavior
  });

  it('Draco Meteor' + ' [130 BP Dragon Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Draco Meteor', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Draco Meteor should reduce defender HP');
  });

  it('Dragon Breath' + ' [60 BP Dragon Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Dragon Breath', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Dragon Breath should reduce defender HP');
  });

  it.todo('Dragon Energy' + ' [150 BP Dragon Special]', async () => {
    // TODO: assert Dragon Energy's declared behavior
  });

  it('Dragon Pulse' + ' [85 BP Dragon Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Dragon Pulse', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Dragon Pulse should reduce defender HP');
  });

  it.todo('Dragon Rage' + ' [0 BP Dragon Special]', async () => {
    // TODO: assert Dragon Rage's declared behavior
  });

  it('Draining Kiss' + ' [50 BP Fairy Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Draining Kiss', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Draining Kiss should reduce defender HP');
  });

  it('Dream Eater' + ' [100 BP Psychic Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Dream Eater', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Dream Eater should reduce defender HP');
  });

  it('Dynamax Cannon' + ' [100 BP Dragon Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Dynamax Cannon', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Dynamax Cannon should reduce defender HP');
  });

  it('Earth Power' + ' [90 BP Ground Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Earth Power', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Earth Power should reduce defender HP');
  });

  it('Echoed Voice' + ' [40 BP Normal Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Echoed Voice', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Echoed Voice should reduce defender HP');
  });

  it('Eerie Spell' + ' [80 BP Psychic Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Eerie Spell', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Eerie Spell should reduce defender HP');
  });

  it.todo('Electro Ball' + ' [0 BP Electric Special]', async () => {
    // TODO: assert Electro Ball's declared behavior
  });

  it('Electro Drift' + ' [100 BP Electric Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Electro Drift', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Electro Drift should reduce defender HP');
  });

  it.todo('Electro Shot' + ' [130 BP Electric Special]', async () => {
    // TODO: assert Electro Shot's declared behavior
  });

  it.todo('Electroweb' + ' [55 BP Electric Special]', async () => {
    // TODO: assert Electroweb's declared behavior
  });

  it('Ember' + ' [40 BP Fire Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Ember', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Ember should reduce defender HP');
  });

  it('Energy Ball' + ' [90 BP Grass Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Energy Ball', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Energy Ball should reduce defender HP');
  });

  it.todo('Eruption' + ' [150 BP Fire Special]', async () => {
    // TODO: assert Eruption's declared behavior
  });

  it('Esper Wing' + ' [80 BP Psychic Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Esper Wing', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Esper Wing should reduce defender HP');
  });

  it('Eternabeam' + ' [160 BP Dragon Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Eternabeam', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Eternabeam should reduce defender HP');
  });

  it('Expanding Force' + ' [80 BP Psychic Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Expanding Force', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Expanding Force should reduce defender HP');
  });

  it('Extrasensory' + ' [80 BP Psychic Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Extrasensory', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Extrasensory should reduce defender HP');
  });

  it('Fairy Wind' + ' [40 BP Fairy Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Fairy Wind', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Fairy Wind should reduce defender HP');
  });

  it('Fickle Beam' + ' [80 BP Dragon Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Fickle Beam', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Fickle Beam should reduce defender HP');
  });

  it('Fiery Dance' + ' [80 BP Fire Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Fiery Dance', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Fiery Dance should reduce defender HP');
  });

  it.todo('Fiery Wrath' + ' [90 BP Dark Special]', async () => {
    // TODO: assert Fiery Wrath's declared behavior
  });

  it.todo('Final Gambit' + ' [0 BP Fighting Special]', async () => {
    // TODO: assert Final Gambit's declared behavior
  });

  it('Fire Blast' + ' [110 BP Fire Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Fire Blast', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Fire Blast should reduce defender HP');
  });

  it('Fire Pledge' + ' [80 BP Fire Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Fire Pledge', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Fire Pledge should reduce defender HP');
  });

  it('Fire Spin' + ' [35 BP Fire Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Fire Spin', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Fire Spin should reduce defender HP');
  });

  it('Flame Burst' + ' [70 BP Fire Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Flame Burst', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Flame Burst should reduce defender HP');
  });

  it('Flamethrower' + ' [90 BP Fire Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Flamethrower', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Flamethrower should reduce defender HP');
  });

  it('Flash Cannon' + ' [80 BP Steel Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Flash Cannon', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Flash Cannon should reduce defender HP');
  });

  it('Fleur Cannon' + ' [130 BP Fairy Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Fleur Cannon', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Fleur Cannon should reduce defender HP');
  });

  it('Focus Blast' + ' [120 BP Fighting Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Focus Blast', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Focus Blast should reduce defender HP');
  });

  it('Freeze-Dry' + ' [70 BP Ice Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Freeze-Dry', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Freeze-Dry should reduce defender HP');
  });

  it('Freezing Glare' + ' [90 BP Psychic Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Freezing Glare', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Freezing Glare should reduce defender HP');
  });

  it('Freezy Frost' + ' [100 BP Ice Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Freezy Frost', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Freezy Frost should reduce defender HP');
  });

  it('Frenzy Plant' + ' [150 BP Grass Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Frenzy Plant', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Frenzy Plant should reduce defender HP');
  });

  it('Frost Breath' + ' [60 BP Ice Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Frost Breath', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Frost Breath should reduce defender HP');
  });

  it('Fusion Flare' + ' [100 BP Fire Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Fusion Flare', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Fusion Flare should reduce defender HP');
  });

  it.todo('Future Sight' + ' [120 BP Psychic Special]', async () => {
    // TODO: assert Future Sight's declared behavior
  });

  it('Giga Drain' + ' [75 BP Grass Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Giga Drain', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Giga Drain should reduce defender HP');
  });

  it.todo('Glaciate' + ' [65 BP Ice Special]', async () => {
    // TODO: assert Glaciate's declared behavior
  });

  it('Glitzy Glow' + ' [80 BP Psychic Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Glitzy Glow', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Glitzy Glow should reduce defender HP');
  });

  it.todo('Grass Knot' + ' [0 BP Grass Special]', async () => {
    // TODO: assert Grass Knot's declared behavior
  });

  it('Grass Pledge' + ' [80 BP Grass Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Grass Pledge', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Grass Pledge should reduce defender HP');
  });

  it('Gust' + ' [40 BP Flying Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Gust', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Gust should reduce defender HP');
  });

  it.todo('Heat Wave' + ' [95 BP Fire Special]', async () => {
    // TODO: assert Heat Wave's declared behavior
  });

  it('Hex' + ' [65 BP Ghost Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Hex', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Hex should reduce defender HP');
  });

  it('Hidden Power' + ' [60 BP Normal Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Hidden Power', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Hidden Power should reduce defender HP');
  });

  it('Hidden Power Bug' + ' [60 BP Bug Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Hidden Power Bug', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Hidden Power Bug should reduce defender HP');
  });

  it('Hidden Power Dark' + ' [60 BP Dark Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Hidden Power Dark', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Hidden Power Dark should reduce defender HP');
  });

  it('Hidden Power Dragon' + ' [60 BP Dragon Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Hidden Power Dragon', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Hidden Power Dragon should reduce defender HP');
  });

  it('Hidden Power Electric' + ' [60 BP Electric Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Hidden Power Electric', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Hidden Power Electric should reduce defender HP');
  });

  it('Hidden Power Fighting' + ' [60 BP Fighting Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Hidden Power Fighting', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Hidden Power Fighting should reduce defender HP');
  });

  it('Hidden Power Fire' + ' [60 BP Fire Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Hidden Power Fire', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Hidden Power Fire should reduce defender HP');
  });

  it('Hidden Power Flying' + ' [60 BP Flying Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Hidden Power Flying', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Hidden Power Flying should reduce defender HP');
  });

  it('Hidden Power Ghost' + ' [60 BP Ghost Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Hidden Power Ghost', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Hidden Power Ghost should reduce defender HP');
  });

  it('Hidden Power Grass' + ' [60 BP Grass Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Hidden Power Grass', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Hidden Power Grass should reduce defender HP');
  });

  it('Hidden Power Ground' + ' [60 BP Ground Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Hidden Power Ground', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Hidden Power Ground should reduce defender HP');
  });

  it('Hidden Power Ice' + ' [60 BP Ice Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Hidden Power Ice', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Hidden Power Ice should reduce defender HP');
  });

  it('Hidden Power Poison' + ' [60 BP Poison Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Hidden Power Poison', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Hidden Power Poison should reduce defender HP');
  });

  it('Hidden Power Psychic' + ' [60 BP Psychic Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Hidden Power Psychic', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Hidden Power Psychic should reduce defender HP');
  });

  it('Hidden Power Rock' + ' [60 BP Rock Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Hidden Power Rock', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Hidden Power Rock should reduce defender HP');
  });

  it('Hidden Power Steel' + ' [60 BP Steel Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Hidden Power Steel', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Hidden Power Steel should reduce defender HP');
  });

  it('Hidden Power Water' + ' [60 BP Water Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Hidden Power Water', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Hidden Power Water should reduce defender HP');
  });

  it('Hurricane' + ' [110 BP Flying Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Hurricane', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Hurricane should reduce defender HP');
  });

  it('Hydro Cannon' + ' [150 BP Water Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Hydro Cannon', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Hydro Cannon should reduce defender HP');
  });

  it('Hydro Pump' + ' [110 BP Water Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Hydro Pump', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Hydro Pump should reduce defender HP');
  });

  it('Hydro Steam' + ' [80 BP Water Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Hydro Steam', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Hydro Steam should reduce defender HP');
  });

  it('Hyper Beam' + ' [150 BP Normal Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Hyper Beam', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Hyper Beam should reduce defender HP');
  });

  it.todo('Hyper Voice' + ' [90 BP Normal Special]', async () => {
    // TODO: assert Hyper Voice's declared behavior
  });

  it('Hyperspace Hole' + ' [80 BP Psychic Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Hyperspace Hole', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Hyperspace Hole should reduce defender HP');
  });

  it('Ice Beam' + ' [90 BP Ice Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Ice Beam', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Ice Beam should reduce defender HP');
  });

  it.todo('Ice Burn' + ' [140 BP Ice Special]', async () => {
    // TODO: assert Ice Burn's declared behavior
  });

  it.todo('Icy Wind' + ' [55 BP Ice Special]', async () => {
    // TODO: assert Icy Wind's declared behavior
  });

  it.todo('Incinerate' + ' [60 BP Fire Special]', async () => {
    // TODO: assert Incinerate's declared behavior
  });

  it('Infernal Parade' + ' [60 BP Ghost Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Infernal Parade', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Infernal Parade should reduce defender HP');
  });

  it('Inferno' + ' [100 BP Fire Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Inferno', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Inferno should reduce defender HP');
  });

  it('Infestation' + ' [20 BP Bug Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Infestation', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Infestation should reduce defender HP');
  });

  it('Judgment' + ' [100 BP Normal Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Judgment', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Judgment should reduce defender HP');
  });

  it.todo('Lava Plume' + ' [80 BP Fire Special]', async () => {
    // TODO: assert Lava Plume's declared behavior
  });

  it('Leaf Storm' + ' [130 BP Grass Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Leaf Storm', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Leaf Storm should reduce defender HP');
  });

  it('Leaf Tornado' + ' [65 BP Grass Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Leaf Tornado', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Leaf Tornado should reduce defender HP');
  });

  it('Light of Ruin' + ' [140 BP Fairy Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Light of Ruin', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Light of Ruin should reduce defender HP');
  });

  it('Lumina Crash' + ' [80 BP Psychic Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Lumina Crash', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Lumina Crash should reduce defender HP');
  });

  it('Luster Purge' + ' [95 BP Psychic Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Luster Purge', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Luster Purge should reduce defender HP');
  });

  it('Magical Leaf' + ' [60 BP Grass Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Magical Leaf', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Magical Leaf should reduce defender HP');
  });

  it('Magma Storm' + ' [100 BP Fire Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Magma Storm', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Magma Storm should reduce defender HP');
  });

  it.todo('Make It Rain' + ' [120 BP Steel Special]', async () => {
    // TODO: assert Make It Rain's declared behavior
  });

  it('Malignant Chain' + ' [100 BP Poison Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Malignant Chain', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Malignant Chain should reduce defender HP');
  });

  it.todo('Matcha Gotcha' + ' [80 BP Grass Special]', async () => {
    // TODO: assert Matcha Gotcha's declared behavior
  });

  it('Mega Drain' + ' [40 BP Grass Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Mega Drain', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Mega Drain should reduce defender HP');
  });

  it.todo('Meteor Beam' + ' [120 BP Rock Special]', async () => {
    // TODO: assert Meteor Beam's declared behavior
  });

  it.todo('Mind Blown' + ' [150 BP Fire Special]', async () => {
    // TODO: assert Mind Blown's declared behavior
  });

  it.todo('Mirror Coat' + ' [0 BP Psychic Special]', async () => {
    // TODO: assert Mirror Coat's declared behavior
  });

  it('Mirror Shot' + ' [65 BP Steel Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Mirror Shot', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Mirror Shot should reduce defender HP');
  });

  it('Mist Ball' + ' [95 BP Psychic Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Mist Ball', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Mist Ball should reduce defender HP');
  });

  it.todo('Misty Explosion' + ' [100 BP Fairy Special]', async () => {
    // TODO: assert Misty Explosion's declared behavior
  });

  it('Moonblast' + ' [95 BP Fairy Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Moonblast', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Moonblast should reduce defender HP');
  });

  it('Moongeist Beam' + ' [100 BP Ghost Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Moongeist Beam', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Moongeist Beam should reduce defender HP');
  });

  it('Mud Bomb' + ' [65 BP Ground Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Mud Bomb', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Mud Bomb should reduce defender HP');
  });

  it('Mud Shot' + ' [55 BP Ground Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Mud Shot', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Mud Shot should reduce defender HP');
  });

  it('Mud-Slap' + ' [20 BP Ground Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Mud-Slap', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Mud-Slap should reduce defender HP');
  });

  it.todo('Muddy Water' + ' [90 BP Water Special]', async () => {
    // TODO: assert Muddy Water's declared behavior
  });

  it('Mystical Fire' + ' [75 BP Fire Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Mystical Fire', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Mystical Fire should reduce defender HP');
  });

  it('Mystical Power' + ' [70 BP Psychic Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Mystical Power', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Mystical Power should reduce defender HP');
  });

  it.todo('Natures Madness' + ' [0 BP Fairy Special]', async () => {
    // TODO: assert Nature's Madness's declared behavior
  });

  it('Night Daze' + ' [85 BP Dark Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Night Daze', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Night Daze should reduce defender HP');
  });

  it.todo('Night Shade' + ' [0 BP Ghost Special]', async () => {
    // TODO: assert Night Shade's declared behavior
  });

  it.todo('Nihil Light' + ' [100 BP Dragon Special]', async () => {
    // TODO: assert Nihil Light's declared behavior
  });

  it('Oblivion Wing' + ' [80 BP Flying Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Oblivion Wing', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Oblivion Wing should reduce defender HP');
  });

  it('Octazooka' + ' [65 BP Water Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Octazooka', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Octazooka should reduce defender HP');
  });

  it('Ominous Wind' + ' [60 BP Ghost Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Ominous Wind', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Ominous Wind should reduce defender HP');
  });

  it.todo('Origin Pulse' + ' [110 BP Water Special]', async () => {
    // TODO: assert Origin Pulse's declared behavior
  });

  it.todo('Overdrive' + ' [80 BP Electric Special]', async () => {
    // TODO: assert Overdrive's declared behavior
  });

  it('Overheat' + ' [130 BP Fire Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Overheat', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Overheat should reduce defender HP');
  });

  it('Paleo Wave' + ' [85 BP Rock Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Paleo Wave', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Paleo Wave should reduce defender HP');
  });

  it.todo('Parabolic Charge' + ' [65 BP Electric Special]', async () => {
    // TODO: assert Parabolic Charge's declared behavior
  });

  it('Petal Dance' + ' [120 BP Grass Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Petal Dance', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Petal Dance should reduce defender HP');
  });

  it('Photon Geyser' + ' [100 BP Psychic Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Photon Geyser', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Photon Geyser should reduce defender HP');
  });

  it.todo('Pika Papow' + ' [0 BP Electric Special]', async () => {
    // TODO: assert Pika Papow's declared behavior
  });

  it.todo('Polar Flare' + ' [75 BP Fire Special]', async () => {
    // TODO: assert Polar Flare's declared behavior
  });

  it('Pollen Puff' + ' [90 BP Bug Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Pollen Puff', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Pollen Puff should reduce defender HP');
  });

  it.todo('Powder Snow' + ' [40 BP Ice Special]', async () => {
    // TODO: assert Powder Snow's declared behavior
  });

  it('Power Gem' + ' [80 BP Rock Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Power Gem', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Power Gem should reduce defender HP');
  });

  it('Prismatic Laser' + ' [160 BP Psychic Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Prismatic Laser', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Prismatic Laser should reduce defender HP');
  });

  it('Psybeam' + ' [65 BP Psychic Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Psybeam', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Psybeam should reduce defender HP');
  });

  it('Psychic' + ' [90 BP Psychic Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Psychic', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Psychic should reduce defender HP');
  });

  it('Psychic Noise' + ' [75 BP Psychic Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Psychic Noise', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Psychic Noise should reduce defender HP');
  });

  it('Psycho Boost' + ' [140 BP Psychic Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Psycho Boost', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Psycho Boost should reduce defender HP');
  });

  it('Psyshock' + ' [80 BP Psychic Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Psyshock', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Psyshock should reduce defender HP');
  });

  it('Psystrike' + ' [100 BP Psychic Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Psystrike', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Psystrike should reduce defender HP');
  });

  it.todo('Psywave' + ' [0 BP Psychic Special]', async () => {
    // TODO: assert Psywave's declared behavior
  });

  it.todo('Razor Wind' + ' [80 BP Normal Special]', async () => {
    // TODO: assert Razor Wind's declared behavior
  });

  it.todo('Relic Song' + ' [75 BP Normal Special]', async () => {
    // TODO: assert Relic Song's declared behavior
  });

  it('Revelation Dance' + ' [90 BP Normal Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Revelation Dance', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Revelation Dance should reduce defender HP');
  });

  it('Rising Voltage' + ' [70 BP Electric Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Rising Voltage', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Rising Voltage should reduce defender HP');
  });

  it('Roar of Time' + ' [150 BP Dragon Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Roar of Time', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Roar of Time should reduce defender HP');
  });

  it('Round' + ' [60 BP Normal Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Round', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Round should reduce defender HP');
  });

  it.todo('Ruination' + ' [0 BP Dark Special]', async () => {
    // TODO: assert Ruination's declared behavior
  });

  it.todo('Sandsear Storm' + ' [100 BP Ground Special]', async () => {
    // TODO: assert Sandsear Storm's declared behavior
  });

  it('Scald' + ' [80 BP Water Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Scald', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Scald should reduce defender HP');
  });

  it('Scorching Sands' + ' [70 BP Ground Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Scorching Sands', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Scorching Sands should reduce defender HP');
  });

  it.todo('Searing Shot' + ' [100 BP Fire Special]', async () => {
    // TODO: assert Searing Shot's declared behavior
  });

  it('Secret Sword' + ' [85 BP Fighting Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Secret Sword', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Secret Sword should reduce defender HP');
  });

  it('Seed Flare' + ' [120 BP Grass Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Seed Flare', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Seed Flare should reduce defender HP');
  });

  it('Shadow Ball' + ' [80 BP Ghost Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Shadow Ball', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Shadow Ball should reduce defender HP');
  });

  it.todo('Sheer Cold' + ' [0 BP Ice Special]', async () => {
    // TODO: assert Sheer Cold's declared behavior
  });

  it('Shell Side Arm' + ' [90 BP Poison Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Shell Side Arm', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Shell Side Arm should reduce defender HP');
  });

  it.todo('Shell Trap' + ' [150 BP Fire Special]', async () => {
    // TODO: assert Shell Trap's declared behavior
  });

  it('Shock Wave' + ' [60 BP Electric Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Shock Wave', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Shock Wave should reduce defender HP');
  });

  it('Signal Beam' + ' [75 BP Bug Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Signal Beam', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Signal Beam should reduce defender HP');
  });

  it('Silver Wind' + ' [60 BP Bug Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Silver Wind', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Silver Wind should reduce defender HP');
  });

  it('Sludge' + ' [65 BP Poison Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Sludge', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Sludge should reduce defender HP');
  });

  it('Sludge Bomb' + ' [90 BP Poison Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Sludge Bomb', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Sludge Bomb should reduce defender HP');
  });

  it.todo('Sludge Wave' + ' [95 BP Poison Special]', async () => {
    // TODO: assert Sludge Wave's declared behavior
  });

  it('Smog' + ' [30 BP Poison Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Smog', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Smog should reduce defender HP');
  });

  it.todo('Snarl' + ' [55 BP Dark Special]', async () => {
    // TODO: assert Snarl's declared behavior
  });

  it('Snipe Shot' + ' [80 BP Water Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Snipe Shot', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Snipe Shot should reduce defender HP');
  });

  it.todo('Snore' + ' [50 BP Normal Special]', async () => {
    // TODO: assert Snore's declared behavior
  });

  it.todo('Solar Beam' + ' [120 BP Grass Special]', async () => {
    // TODO: assert Solar Beam's declared behavior
  });

  it.todo('Sonic Boom' + ' [0 BP Normal Special]', async () => {
    // TODO: assert Sonic Boom's declared behavior
  });

  it('Spacial Rend' + ' [100 BP Dragon Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Spacial Rend', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Spacial Rend should reduce defender HP');
  });

  it.todo('Sparkling Aria' + ' [90 BP Water Special]', async () => {
    // TODO: assert Sparkling Aria's declared behavior
  });

  it('Sparkly Swirl' + ' [120 BP Fairy Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Sparkly Swirl', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Sparkly Swirl should reduce defender HP');
  });

  it.todo('Spit Up' + ' [0 BP Normal Special]', async () => {
    // TODO: assert Spit Up's declared behavior
  });

  it.todo('Splishy Splash' + ' [90 BP Water Special]', async () => {
    // TODO: assert Splishy Splash's declared behavior
  });

  it.todo('Springtide Storm' + ' [100 BP Fairy Special]', async () => {
    // TODO: assert Springtide Storm's declared behavior
  });

  it('Steam Eruption' + ' [110 BP Water Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Steam Eruption', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Steam Eruption should reduce defender HP');
  });

  it('Steel Beam' + ' [140 BP Steel Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Steel Beam', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Steel Beam should reduce defender HP');
  });

  it('Stored Power' + ' [20 BP Psychic Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Stored Power', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Stored Power should reduce defender HP');
  });

  it('Strange Steam' + ' [90 BP Fairy Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Strange Steam', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Strange Steam should reduce defender HP');
  });

  it.todo('Struggle Bug' + ' [50 BP Bug Special]', async () => {
    // TODO: assert Struggle Bug's declared behavior
  });

  it.todo('Surf' + ' [90 BP Water Special]', async () => {
    // TODO: assert Surf's declared behavior
  });

  it.todo('Swift' + ' [60 BP Normal Special]', async () => {
    // TODO: assert Swift's declared behavior
  });

  it.todo('Synchronoise' + ' [120 BP Psychic Special]', async () => {
    // TODO: assert Synchronoise's declared behavior
  });

  it('Syrup Bomb' + ' [60 BP Grass Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Syrup Bomb', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Syrup Bomb should reduce defender HP');
  });

  it('Tachyon Cutter' + ' [50 BP Steel Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Tachyon Cutter', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Tachyon Cutter should reduce defender HP');
  });

  it('Techno Blast' + ' [120 BP Normal Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Techno Blast', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Techno Blast should reduce defender HP');
  });

  it('Tera Blast' + ' [80 BP Normal Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Tera Blast', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Tera Blast should reduce defender HP');
  });

  it('Tera Starstorm' + ' [120 BP Normal Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Tera Starstorm', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Tera Starstorm should reduce defender HP');
  });

  it('Terrain Pulse' + ' [50 BP Normal Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Terrain Pulse', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Terrain Pulse should reduce defender HP');
  });

  it('Thunder' + ' [110 BP Electric Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Thunder', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Thunder should reduce defender HP');
  });

  it('Thunder Cage' + ' [80 BP Electric Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Thunder Cage', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Thunder Cage should reduce defender HP');
  });

  it('Thunder Shock' + ' [40 BP Electric Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Thunder Shock', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Thunder Shock should reduce defender HP');
  });

  it('Thunderbolt' + ' [90 BP Electric Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Thunderbolt', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Thunderbolt should reduce defender HP');
  });

  it('Thunderclap' + ' [70 BP Electric Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Thunderclap', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Thunderclap should reduce defender HP');
  });

  it('Torch Song' + ' [80 BP Fire Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Torch Song', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Torch Song should reduce defender HP');
  });

  it('Tri Attack' + ' [80 BP Normal Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Tri Attack', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Tri Attack should reduce defender HP');
  });

  it.todo('Trump Card' + ' [0 BP Normal Special]', async () => {
    // TODO: assert Trump Card's declared behavior
  });

  it('Twin Beam' + ' [40 BP Psychic Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Twin Beam', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Twin Beam should reduce defender HP');
  });

  it.todo('Twister' + ' [40 BP Dragon Special]', async () => {
    // TODO: assert Twister's declared behavior
  });

  it('Uproar' + ' [90 BP Normal Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Uproar', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Uproar should reduce defender HP');
  });

  it('Vacuum Wave' + ' [40 BP Fighting Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Vacuum Wave', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Vacuum Wave should reduce defender HP');
  });

  it('Venoshock' + ' [65 BP Poison Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Venoshock', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Venoshock should reduce defender HP');
  });

  it('Volt Switch' + ' [70 BP Electric Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Volt Switch', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Volt Switch should reduce defender HP');
  });

  it('Water Gun' + ' [40 BP Water Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Water Gun', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Water Gun should reduce defender HP');
  });

  it('Water Pledge' + ' [80 BP Water Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Water Pledge', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Water Pledge should reduce defender HP');
  });

  it('Water Pulse' + ' [60 BP Water Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Water Pulse', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Water Pulse should reduce defender HP');
  });

  it('Water Shuriken' + ' [15 BP Water Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Water Shuriken', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Water Shuriken should reduce defender HP');
  });

  it.todo('Water Spout' + ' [150 BP Water Special]', async () => {
    // TODO: assert Water Spout's declared behavior
  });

  it('Weather Ball' + ' [50 BP Normal Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Weather Ball', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Weather Ball should reduce defender HP');
  });

  it('Whirlpool' + ' [35 BP Water Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Whirlpool', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Whirlpool should reduce defender HP');
  });

  it.todo('Wildbolt Storm' + ' [100 BP Electric Special]', async () => {
    // TODO: assert Wildbolt Storm's declared behavior
  });

  it.todo('Wring Out' + ' [0 BP Normal Special]', async () => {
    // TODO: assert Wring Out's declared behavior
  });

  it('Zap Cannon' + ' [120 BP Electric Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Zap Cannon', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Zap Cannon should reduce defender HP');
  });
});
