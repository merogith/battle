// Auto-generated per-move skeleton tests. Regenerate via:
//   node tests/audit/generate-move-tests.js
//
// Category: Special
// Total moves: 251
// Auto-asserted: 176
// TODO (manual fill-in required): 75

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

  // 'Acid' — covered by a manual test (see by-category/manual/).

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

  // 'Air Cutter' — covered by a manual test (see by-category/manual/).

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

  // 'Astral Barrage' — covered by a manual test (see by-category/manual/).

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

  // 'Belch' — covered by a manual test (see by-category/manual/).

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

  // 'Bleakwind Storm' — covered by a manual test (see by-category/manual/).

  // 'Blizzard' — covered by a manual test (see by-category/manual/).

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

  // 'Boomburst' — covered by a manual test (see by-category/manual/).

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

  // 'Bubble' — covered by a manual test (see by-category/manual/).

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

  // 'Burn Up' — covered by a manual test (see by-category/manual/).

  // 'Burning Jealousy' — covered by a manual test (see by-category/manual/).

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

  // 'Clanging Scales' — covered by a manual test (see by-category/manual/).

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

  // 'Core Enforcer' — covered by a manual test (see by-category/manual/).

  it('Dark Pulse' + ' [80 BP Dark Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Dark Pulse', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Dark Pulse should reduce defender HP');
  });

  // 'Dazzling Gleam' — covered by a manual test (see by-category/manual/).

  // 'Disarming Voice' — covered by a manual test (see by-category/manual/).

  // 'Discharge' — covered by a manual test (see by-category/manual/).

  // 'Doom Desire' — covered by a manual test (see by-category/manual/).

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

  // 'Dragon Energy' — covered by a manual test (see by-category/manual/).

  it('Dragon Pulse' + ' [85 BP Dragon Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Dragon Pulse', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Dragon Pulse should reduce defender HP');
  });

  // 'Dragon Rage' — covered by a manual test (see by-category/manual/).

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

  // 'Electro Ball' — covered by a manual test (see by-category/manual/).

  it('Electro Drift' + ' [100 BP Electric Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Electro Drift', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Electro Drift should reduce defender HP');
  });

  // 'Electro Shot' — covered by a manual test (see by-category/manual/).

  // 'Electroweb' — covered by a manual test (see by-category/manual/).

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

  // 'Eruption' — covered by a manual test (see by-category/manual/).

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

  // 'Fiery Wrath' — covered by a manual test (see by-category/manual/).

  // 'Final Gambit' — covered by a manual test (see by-category/manual/).

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

  // 'Future Sight' — covered by a manual test (see by-category/manual/).

  it('Giga Drain' + ' [75 BP Grass Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Giga Drain', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Giga Drain should reduce defender HP');
  });

  // 'Glaciate' — covered by a manual test (see by-category/manual/).

  it('Glitzy Glow' + ' [80 BP Psychic Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Glitzy Glow', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Glitzy Glow should reduce defender HP');
  });

  // 'Grass Knot' — covered by a manual test (see by-category/manual/).

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

  // 'Heat Wave' — covered by a manual test (see by-category/manual/).

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

  // 'Hyper Voice' — covered by a manual test (see by-category/manual/).

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

  // 'Ice Burn' — covered by a manual test (see by-category/manual/).

  // 'Icy Wind' — covered by a manual test (see by-category/manual/).

  // 'Incinerate' — covered by a manual test (see by-category/manual/).

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

  // 'Lava Plume' — covered by a manual test (see by-category/manual/).

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

  // 'Make It Rain' — covered by a manual test (see by-category/manual/).

  it('Malignant Chain' + ' [100 BP Poison Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Malignant Chain', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Malignant Chain should reduce defender HP');
  });

  // 'Matcha Gotcha' — covered by a manual test (see by-category/manual/).

  it('Mega Drain' + ' [40 BP Grass Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Mega Drain', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Mega Drain should reduce defender HP');
  });

  // 'Meteor Beam' — covered by a manual test (see by-category/manual/).

  // 'Mind Blown' — covered by a manual test (see by-category/manual/).

  // 'Mirror Coat' — covered by a manual test (see by-category/manual/).

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

  // 'Misty Explosion' — covered by a manual test (see by-category/manual/).

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

  // 'Muddy Water' — covered by a manual test (see by-category/manual/).

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

  // 'Nature\'s Madness' — covered by a manual test (see by-category/manual/).

  it('Night Daze' + ' [85 BP Dark Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Night Daze', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Night Daze should reduce defender HP');
  });

  // 'Night Shade' — covered by a manual test (see by-category/manual/).

  // 'Nihil Light' — covered by a manual test (see by-category/manual/).

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

  // 'Origin Pulse' — covered by a manual test (see by-category/manual/).

  // 'Overdrive' — covered by a manual test (see by-category/manual/).

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

  // 'Parabolic Charge' — covered by a manual test (see by-category/manual/).

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

  // 'Pika Papow' — covered by a manual test (see by-category/manual/).

  // 'Polar Flare' — covered by a manual test (see by-category/manual/).

  it('Pollen Puff' + ' [90 BP Bug Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Pollen Puff', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Pollen Puff should reduce defender HP');
  });

  // 'Powder Snow' — covered by a manual test (see by-category/manual/).

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

  // 'Psywave' — covered by a manual test (see by-category/manual/).

  // 'Razor Wind' — covered by a manual test (see by-category/manual/).

  // 'Relic Song' — covered by a manual test (see by-category/manual/).

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

  // 'Ruination' — covered by a manual test (see by-category/manual/).

  // 'Sandsear Storm' — covered by a manual test (see by-category/manual/).

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

  // 'Searing Shot' — covered by a manual test (see by-category/manual/).

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

  // 'Sheer Cold' — covered by a manual test (see by-category/manual/).

  it('Shell Side Arm' + ' [90 BP Poison Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Shell Side Arm', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Shell Side Arm should reduce defender HP');
  });

  // 'Shell Trap' — covered by a manual test (see by-category/manual/).

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

  // 'Sludge Wave' — covered by a manual test (see by-category/manual/).

  it('Smog' + ' [30 BP Poison Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Smog', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Smog should reduce defender HP');
  });

  // 'Snarl' — covered by a manual test (see by-category/manual/).

  it('Snipe Shot' + ' [80 BP Water Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Snipe Shot', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Snipe Shot should reduce defender HP');
  });

  // 'Snore' — covered by a manual test (see by-category/manual/).

  // 'Solar Beam' — covered by a manual test (see by-category/manual/).

  // 'Sonic Boom' — covered by a manual test (see by-category/manual/).

  it('Spacial Rend' + ' [100 BP Dragon Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Spacial Rend', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Spacial Rend should reduce defender HP');
  });

  // 'Sparkling Aria' — covered by a manual test (see by-category/manual/).

  it('Sparkly Swirl' + ' [120 BP Fairy Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Sparkly Swirl', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Sparkly Swirl should reduce defender HP');
  });

  // 'Spit Up' — covered by a manual test (see by-category/manual/).

  // 'Splishy Splash' — covered by a manual test (see by-category/manual/).

  // 'Springtide Storm' — covered by a manual test (see by-category/manual/).

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

  // 'Struggle Bug' — covered by a manual test (see by-category/manual/).

  // 'Surf' — covered by a manual test (see by-category/manual/).

  // 'Swift' — covered by a manual test (see by-category/manual/).

  // 'Synchronoise' — covered by a manual test (see by-category/manual/).

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

  // 'Trump Card' — covered by a manual test (see by-category/manual/).

  it('Twin Beam' + ' [40 BP Psychic Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Twin Beam', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Twin Beam should reduce defender HP');
  });

  // 'Twister' — covered by a manual test (see by-category/manual/).

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

  // 'Water Spout' — covered by a manual test (see by-category/manual/).

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

  // 'Wildbolt Storm' — covered by a manual test (see by-category/manual/).

  // 'Wring Out' — covered by a manual test (see by-category/manual/).

  it('Zap Cannon' + ' [120 BP Electric Special]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Zap Cannon', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Zap Cannon should reduce defender HP');
  });
});
