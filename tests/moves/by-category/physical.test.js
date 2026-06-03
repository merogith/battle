// Auto-generated per-move skeleton tests. Regenerate via:
//   node tests/audit/generate-move-tests.js
//
// Category: Physical
// Total moves: 347
// Auto-asserted: 280
// TODO (manual fill-in required): 67

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../../helpers/load-engine.js';

let mkMon, runTurn;
before(async () => {
  const e = await loadEngine();
  mkMon = e.mkMon;
  runTurn = e.runTurn;
});

describe('Physical moves', () => {
  // Reuse the cached engine instance across all 'it' blocks in this file.
    it('Accelerock' + ' [40 BP Rock Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Accelerock', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Accelerock should reduce defender HP');
  });

  it('Acrobatics' + ' [55 BP Flying Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Acrobatics', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Acrobatics should reduce defender HP');
  });

  it('Aerial Ace' + ' [60 BP Flying Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Aerial Ace', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Aerial Ace should reduce defender HP');
  });

  it('Anchor Shot' + ' [80 BP Steel Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Anchor Shot', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Anchor Shot should reduce defender HP');
  });

  it('Aqua Cutter' + ' [70 BP Water Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Aqua Cutter', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Aqua Cutter should reduce defender HP');
  });

  it('Aqua Jet' + ' [40 BP Water Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Aqua Jet', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Aqua Jet should reduce defender HP');
  });

  it('Aqua Step' + ' [80 BP Water Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Aqua Step', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Aqua Step should reduce defender HP');
  });

  it('Aqua Tail' + ' [90 BP Water Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Aqua Tail', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Aqua Tail should reduce defender HP');
  });

  it('Arm Thrust' + ' [15 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Arm Thrust', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Arm Thrust should reduce defender HP');
  });

  // 'Assurance' — covered by a manual test (see by-category/manual/).

  it('Astonish' + ' [30 BP Ghost Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Astonish', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Astonish should reduce defender HP');
  });

  it('Attack Order' + ' [90 BP Bug Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Attack Order', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Attack Order should reduce defender HP');
  });

  it('Aura Wheel' + ' [110 BP Electric Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Aura Wheel', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Aura Wheel should reduce defender HP');
  });

  // 'Avalanche' — covered by a manual test (see by-category/manual/).

  it('Axe Kick' + ' [120 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Axe Kick', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Axe Kick should reduce defender HP');
  });

  it('Barb Barrage' + ' [60 BP Poison Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Barb Barrage', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Barb Barrage should reduce defender HP');
  });

  it('Barrage' + ' [15 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Barrage', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Barrage should reduce defender HP');
  });

  it('Beak Blast' + ' [100 BP Flying Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Beak Blast', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Beak Blast should reduce defender HP');
  });

  // 'Beat Up' — covered by a manual test (see by-category/manual/).

  it('Behemoth Bash' + ' [100 BP Steel Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Behemoth Bash', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Behemoth Bash should reduce defender HP');
  });

  it('Behemoth Blade' + ' [100 BP Steel Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Behemoth Blade', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Behemoth Blade should reduce defender HP');
  });

  // 'Bide' — covered by a manual test (see by-category/manual/).

  it('Bind' + ' [15 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Bind', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Bind should reduce defender HP');
  });

  it('Bite' + ' [60 BP Dark Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Bite', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Bite should reduce defender HP');
  });

  it('Bitter Blade' + ' [90 BP Fire Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Bitter Blade', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Bitter Blade should reduce defender HP');
  });

  it('Blaze Kick' + ' [85 BP Fire Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Blaze Kick', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Blaze Kick should reduce defender HP');
  });

  it('Blazing Torque' + ' [80 BP Fire Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Blazing Torque', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Blazing Torque should reduce defender HP');
  });

  it('Body Press' + ' [80 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Body Press', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Body Press should reduce defender HP');
  });

  it('Body Slam' + ' [85 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Body Slam', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Body Slam should reduce defender HP');
  });

  it('Bolt Beak' + ' [85 BP Electric Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Bolt Beak', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Bolt Beak should reduce defender HP');
  });

  it('Bolt Strike' + ' [130 BP Electric Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Bolt Strike', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Bolt Strike should reduce defender HP');
  });

  it('Bone Club' + ' [65 BP Ground Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Bone Club', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Bone Club should reduce defender HP');
  });

  it('Bone Rush' + ' [25 BP Ground Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Bone Rush', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Bone Rush should reduce defender HP');
  });

  it('Bonemerang' + ' [50 BP Ground Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Bonemerang', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Bonemerang should reduce defender HP');
  });

  // 'Bounce' — covered by a manual test (see by-category/manual/).

  it('Branch Poke' + ' [40 BP Grass Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Branch Poke', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Branch Poke should reduce defender HP');
  });

  it('Brave Bird' + ' [120 BP Flying Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Brave Bird', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Brave Bird should reduce defender HP');
  });

  // 'Breaking Swipe' — covered by a manual test (see by-category/manual/).

  it('Brick Break' + ' [75 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Brick Break', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Brick Break should reduce defender HP');
  });

  // 'Brutal Swing' — covered by a manual test (see by-category/manual/).

  it('Bug Bite' + ' [60 BP Bug Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Bug Bite', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Bug Bite should reduce defender HP');
  });

  // 'Bulldoze' — covered by a manual test (see by-category/manual/).

  it('Bullet Punch' + ' [40 BP Steel Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Bullet Punch', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Bullet Punch should reduce defender HP');
  });

  it('Bullet Seed' + ' [25 BP Grass Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Bullet Seed', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Bullet Seed should reduce defender HP');
  });

  it('Ceaseless Edge' + ' [65 BP Dark Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Ceaseless Edge', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Ceaseless Edge should reduce defender HP');
  });

  it('Chip Away' + ' [70 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Chip Away', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Chip Away should reduce defender HP');
  });

  it('Circle Throw' + ' [60 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Circle Throw', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Circle Throw should reduce defender HP');
  });

  it('Clamp' + ' [35 BP Water Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Clamp', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Clamp should reduce defender HP');
  });

  it('Close Combat' + ' [120 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Close Combat', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Close Combat should reduce defender HP');
  });

  it('Collision Course' + ' [100 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Collision Course', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Collision Course should reduce defender HP');
  });

  it('Combat Torque' + ' [100 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Combat Torque', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Combat Torque should reduce defender HP');
  });

  it('Comet Punch' + ' [18 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Comet Punch', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Comet Punch should reduce defender HP');
  });

  it.todo('Comeuppance' + ' [0 BP Dark Physical]', async () => {
    // TODO: assert Comeuppance's declared behavior — see agent-state/handoff/03-fill-remaining-move-todos.md
  });

  it('Constrict' + ' [10 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Constrict', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Constrict should reduce defender HP');
  });

  // 'Counter' — covered by a manual test (see by-category/manual/).

  it('Covet' + ' [60 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Covet', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Covet should reduce defender HP');
  });

  it('Crabhammer' + ' [100 BP Water Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Crabhammer', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Crabhammer should reduce defender HP');
  });

  it('Cross Chop' + ' [100 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Cross Chop', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Cross Chop should reduce defender HP');
  });

  it('Cross Poison' + ' [70 BP Poison Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Cross Poison', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Cross Poison should reduce defender HP');
  });

  it('Crunch' + ' [80 BP Dark Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Crunch', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Crunch should reduce defender HP');
  });

  it('Crush Claw' + ' [75 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Crush Claw', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Crush Claw should reduce defender HP');
  });

  // 'Crush Grip' — covered by a manual test (see by-category/manual/).

  it('Cut' + ' [50 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Cut', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Cut should reduce defender HP');
  });

  it('Darkest Lariat' + ' [85 BP Dark Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Darkest Lariat', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Darkest Lariat should reduce defender HP');
  });

  // 'Diamond Storm' — covered by a manual test (see by-category/manual/).

  // 'Dig' — covered by a manual test (see by-category/manual/).

  it('Dire Claw' + ' [80 BP Poison Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Dire Claw', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Dire Claw should reduce defender HP');
  });

  // 'Dive' — covered by a manual test (see by-category/manual/).

  it('Dizzy Punch' + ' [70 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Dizzy Punch', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Dizzy Punch should reduce defender HP');
  });

  it('Double Hit' + ' [35 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Double Hit', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Double Hit should reduce defender HP');
  });

  it('Double Iron Bash' + ' [60 BP Steel Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Double Iron Bash', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Double Iron Bash should reduce defender HP');
  });

  it('Double Kick' + ' [30 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Double Kick', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Double Kick should reduce defender HP');
  });

  // 'Double Shock' — covered by a manual test (see by-category/manual/).

  it('Double Slap' + ' [15 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Double Slap', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Double Slap should reduce defender HP');
  });

  it('Double-Edge' + ' [120 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Double-Edge', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Double-Edge should reduce defender HP');
  });

  it('Dragon Ascent' + ' [120 BP Flying Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Dragon Ascent', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Dragon Ascent should reduce defender HP');
  });

  it('Dragon Claw' + ' [80 BP Dragon Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Dragon Claw', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Dragon Claw should reduce defender HP');
  });

  it('Dragon Darts' + ' [50 BP Dragon Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Dragon Darts', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Dragon Darts should reduce defender HP');
  });

  it('Dragon Hammer' + ' [90 BP Dragon Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Dragon Hammer', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Dragon Hammer should reduce defender HP');
  });

  it('Dragon Rush' + ' [100 BP Dragon Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Dragon Rush', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Dragon Rush should reduce defender HP');
  });

  it('Dragon Tail' + ' [60 BP Dragon Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Dragon Tail', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Dragon Tail should reduce defender HP');
  });

  it('Drain Punch' + ' [75 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Drain Punch', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Drain Punch should reduce defender HP');
  });

  it('Drill Peck' + ' [80 BP Flying Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Drill Peck', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Drill Peck should reduce defender HP');
  });

  it('Drill Run' + ' [80 BP Ground Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Drill Run', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Drill Run should reduce defender HP');
  });

  it('Drum Beating' + ' [80 BP Grass Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Drum Beating', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Drum Beating should reduce defender HP');
  });

  it('Dual Chop' + ' [40 BP Dragon Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Dual Chop', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Dual Chop should reduce defender HP');
  });

  it('Dual Wingbeat' + ' [40 BP Flying Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Dual Wingbeat', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Dual Wingbeat should reduce defender HP');
  });

  it('Dynamic Punch' + ' [100 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Dynamic Punch', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Dynamic Punch should reduce defender HP');
  });

  // 'Earthquake' — covered by a manual test (see by-category/manual/).

  it('Egg Bomb' + ' [100 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Egg Bomb', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Egg Bomb should reduce defender HP');
  });

  // 'Endeavor' — covered by a manual test (see by-category/manual/).

  // 'Explosion' — covered by a manual test (see by-category/manual/).

  it('Extreme Speed' + ' [80 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Extreme Speed', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Extreme Speed should reduce defender HP');
  });

  it('Facade' + ' [70 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Facade', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Facade should reduce defender HP');
  });

  // 'Fake Out' — covered by a manual test (see by-category/manual/).

  it('False Surrender' + ' [80 BP Dark Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['False Surrender', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'False Surrender should reduce defender HP');
  });

  it('False Swipe' + ' [40 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['False Swipe', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'False Swipe should reduce defender HP');
  });

  it('Feint' + ' [30 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Feint', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Feint should reduce defender HP');
  });

  it('Feint Attack' + ' [60 BP Dark Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Feint Attack', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Feint Attack should reduce defender HP');
  });

  it('Fell Stinger' + ' [50 BP Bug Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Fell Stinger', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Fell Stinger should reduce defender HP');
  });

  it('Fire Fang' + ' [65 BP Fire Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Fire Fang', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Fire Fang should reduce defender HP');
  });

  it('Fire Lash' + ' [80 BP Fire Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Fire Lash', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Fire Lash should reduce defender HP');
  });

  it('Fire Punch' + ' [75 BP Fire Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Fire Punch', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Fire Punch should reduce defender HP');
  });

  // 'First Impression' — covered by a manual test (see by-category/manual/).

  it('Fishious Rend' + ' [85 BP Water Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Fishious Rend', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Fishious Rend should reduce defender HP');
  });

  // 'Fissure' — covered by a manual test (see by-category/manual/).

  // 'Flail' — covered by a manual test (see by-category/manual/).

  it('Flame Charge' + ' [50 BP Fire Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Flame Charge', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Flame Charge should reduce defender HP');
  });

  it('Flame Wheel' + ' [60 BP Fire Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Flame Wheel', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Flame Wheel should reduce defender HP');
  });

  it('Flare Blitz' + ' [120 BP Fire Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Flare Blitz', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Flare Blitz should reduce defender HP');
  });

  // 'Fling' — covered by a manual test (see by-category/manual/).

  it('Flip Turn' + ' [60 BP Water Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Flip Turn', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Flip Turn should reduce defender HP');
  });

  it('Floaty Fall' + ' [90 BP Flying Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Floaty Fall', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Floaty Fall should reduce defender HP');
  });

  it('Flower Trick' + ' [70 BP Grass Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Flower Trick', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Flower Trick should reduce defender HP');
  });

  // 'Fly' — covered by a manual test (see by-category/manual/).

  it('Flying Press' + ' [100 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Flying Press', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Flying Press should reduce defender HP');
  });

  // 'Focus Punch' — covered by a manual test (see by-category/manual/).

  it('Force Palm' + ' [60 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Force Palm', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Force Palm should reduce defender HP');
  });

  it('Foul Play' + ' [95 BP Dark Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Foul Play', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Foul Play should reduce defender HP');
  });

  // 'Freeze Shock' — covered by a manual test (see by-category/manual/).

  // 'Frustration' — covered by a manual test (see by-category/manual/).

  it('Fury Attack' + ' [15 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Fury Attack', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Fury Attack should reduce defender HP');
  });

  it('Fury Cutter' + ' [40 BP Bug Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Fury Cutter', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Fury Cutter should reduce defender HP');
  });

  it('Fury Swipes' + ' [18 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Fury Swipes', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Fury Swipes should reduce defender HP');
  });

  it('Fusion Bolt' + ' [100 BP Electric Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Fusion Bolt', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Fusion Bolt should reduce defender HP');
  });

  it('Gear Grind' + ' [50 BP Steel Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Gear Grind', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Gear Grind should reduce defender HP');
  });

  it('Giga Impact' + ' [150 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Giga Impact', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Giga Impact should reduce defender HP');
  });

  it('Gigaton Hammer' + ' [160 BP Steel Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Gigaton Hammer', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Gigaton Hammer should reduce defender HP');
  });

  // 'Glacial Lance' — covered by a manual test (see by-category/manual/).

  it('Glaive Rush' + ' [120 BP Dragon Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Glaive Rush', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Glaive Rush should reduce defender HP');
  });

  it('Grassy Glide' + ' [55 BP Grass Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Grassy Glide', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Grassy Glide should reduce defender HP');
  });

  it('Grav Apple' + ' [80 BP Grass Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Grav Apple', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Grav Apple should reduce defender HP');
  });

  // 'Guillotine' — covered by a manual test (see by-category/manual/).

  it('Gunk Shot' + ' [120 BP Poison Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Gunk Shot', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Gunk Shot should reduce defender HP');
  });

  // 'Gyro Ball' — covered by a manual test (see by-category/manual/).

  it('Hammer Arm' + ' [100 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Hammer Arm', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Hammer Arm should reduce defender HP');
  });

  // 'Hard Press' — covered by a manual test (see by-category/manual/).

  it('Head Charge' + ' [120 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Head Charge', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Head Charge should reduce defender HP');
  });

  it('Head Smash' + ' [150 BP Rock Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Head Smash', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Head Smash should reduce defender HP');
  });

  it('Headbutt' + ' [70 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Headbutt', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Headbutt should reduce defender HP');
  });

  it('Headlong Rush' + ' [120 BP Ground Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Headlong Rush', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Headlong Rush should reduce defender HP');
  });

  it('Heart Stamp' + ' [60 BP Psychic Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Heart Stamp', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Heart Stamp should reduce defender HP');
  });

  // 'Heat Crash' — covered by a manual test (see by-category/manual/).

  // 'Heavy Slam' — covered by a manual test (see by-category/manual/).

  it('High Horsepower' + ' [95 BP Ground Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['High Horsepower', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'High Horsepower should reduce defender HP');
  });

  it('High Jump Kick' + ' [130 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['High Jump Kick', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'High Jump Kick should reduce defender HP');
  });

  it('Hold Back' + ' [40 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Hold Back', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Hold Back should reduce defender HP');
  });

  it('Horn Attack' + ' [65 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Horn Attack', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Horn Attack should reduce defender HP');
  });

  // 'Horn Drill' — covered by a manual test (see by-category/manual/).

  it('Horn Leech' + ' [75 BP Grass Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Horn Leech', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Horn Leech should reduce defender HP');
  });

  it('Hyper Drill' + ' [100 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Hyper Drill', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Hyper Drill should reduce defender HP');
  });

  it('Hyper Fang' + ' [80 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Hyper Fang', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Hyper Fang should reduce defender HP');
  });

  it('Hyperspace Fury' + ' [100 BP Dark Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Hyperspace Fury', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Hyperspace Fury should reduce defender HP');
  });

  it('Ice Ball' + ' [30 BP Ice Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Ice Ball', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Ice Ball should reduce defender HP');
  });

  it('Ice Fang' + ' [65 BP Ice Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Ice Fang', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Ice Fang should reduce defender HP');
  });

  it('Ice Hammer' + ' [100 BP Ice Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Ice Hammer', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Ice Hammer should reduce defender HP');
  });

  it('Ice Punch' + ' [75 BP Ice Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Ice Punch', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Ice Punch should reduce defender HP');
  });

  it('Ice Shard' + ' [40 BP Ice Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Ice Shard', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Ice Shard should reduce defender HP');
  });

  // 'Ice Spinner' — covered by a manual test (see by-category/manual/).

  it('Icicle Crash' + ' [85 BP Ice Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Icicle Crash', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Icicle Crash should reduce defender HP');
  });

  it('Icicle Spear' + ' [25 BP Ice Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Icicle Spear', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Icicle Spear should reduce defender HP');
  });

  it('Iron Head' + ' [80 BP Steel Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Iron Head', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Iron Head should reduce defender HP');
  });

  it('Iron Tail' + ' [100 BP Steel Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Iron Tail', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Iron Tail should reduce defender HP');
  });

  it('Ivy Cudgel' + ' [100 BP Grass Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Ivy Cudgel', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Ivy Cudgel should reduce defender HP');
  });

  it('Jaw Lock' + ' [80 BP Dark Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Jaw Lock', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Jaw Lock should reduce defender HP');
  });

  it('Jet Punch' + ' [60 BP Water Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Jet Punch', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Jet Punch should reduce defender HP');
  });

  it('Jump Kick' + ' [100 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Jump Kick', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Jump Kick should reduce defender HP');
  });

  it('Karate Chop' + ' [50 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Karate Chop', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Karate Chop should reduce defender HP');
  });

  it('Knock Off' + ' [65 BP Dark Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Knock Off', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Knock Off should reduce defender HP');
  });

  it('Kowtow Cleave' + ' [85 BP Dark Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Kowtow Cleave', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Kowtow Cleave should reduce defender HP');
  });

  // 'Land\'s Wrath' — covered by a manual test (see by-category/manual/).

  it('Lash Out' + ' [75 BP Dark Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Lash Out', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Lash Out should reduce defender HP');
  });

  // 'Last Resort' — covered by a manual test (see by-category/manual/).

  it('Last Respects' + ' [50 BP Ghost Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Last Respects', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Last Respects should reduce defender HP');
  });

  it('Leaf Blade' + ' [90 BP Grass Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Leaf Blade', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Leaf Blade should reduce defender HP');
  });

  it('Leafage' + ' [40 BP Grass Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Leafage', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Leafage should reduce defender HP');
  });

  it('Leech Life' + ' [80 BP Bug Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Leech Life', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Leech Life should reduce defender HP');
  });

  it('Lick' + ' [30 BP Ghost Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Lick', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Lick should reduce defender HP');
  });

  it('Liquidation' + ' [85 BP Water Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Liquidation', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Liquidation should reduce defender HP');
  });

  // 'Low Kick' — covered by a manual test (see by-category/manual/).

  it('Low Sweep' + ' [65 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Low Sweep', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Low Sweep should reduce defender HP');
  });

  it('Lunge' + ' [80 BP Bug Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Lunge', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Lunge should reduce defender HP');
  });

  it('Mach Punch' + ' [40 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Mach Punch', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Mach Punch should reduce defender HP');
  });

  it('Magical Torque' + ' [100 BP Fairy Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Magical Torque', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Magical Torque should reduce defender HP');
  });

  it('Magnet Bomb' + ' [60 BP Steel Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Magnet Bomb', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Magnet Bomb should reduce defender HP');
  });

  // 'Magnitude' — covered by a manual test (see by-category/manual/).

  it('Mega Kick' + ' [120 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Mega Kick', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Mega Kick should reduce defender HP');
  });

  it('Mega Punch' + ' [80 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Mega Punch', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Mega Punch should reduce defender HP');
  });

  it('Megahorn' + ' [120 BP Bug Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Megahorn', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Megahorn should reduce defender HP');
  });

  // 'Metal Burst' — covered by a manual test (see by-category/manual/).

  it('Metal Claw' + ' [50 BP Steel Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Metal Claw', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Metal Claw should reduce defender HP');
  });

  it('Meteor Assault' + ' [150 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Meteor Assault', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Meteor Assault should reduce defender HP');
  });

  it('Meteor Mash' + ' [90 BP Steel Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Meteor Mash', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Meteor Mash should reduce defender HP');
  });

  it('Mighty Cleave' + ' [95 BP Rock Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Mighty Cleave', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Mighty Cleave should reduce defender HP');
  });

  // 'Mortal Spin' — covered by a manual test (see by-category/manual/).

  it('Mountain Gale' + ' [100 BP Ice Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Mountain Gale', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Mountain Gale should reduce defender HP');
  });

  it('Multi-Attack' + ' [120 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Multi-Attack', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Multi-Attack should reduce defender HP');
  });

  // 'Natural Gift' — covered by a manual test (see by-category/manual/).

  it('Needle Arm' + ' [60 BP Grass Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Needle Arm', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Needle Arm should reduce defender HP');
  });

  it('Night Slash' + ' [70 BP Dark Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Night Slash', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Night Slash should reduce defender HP');
  });

  it('Noxious Torque' + ' [100 BP Poison Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Noxious Torque', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Noxious Torque should reduce defender HP');
  });

  it('Nuzzle' + ' [20 BP Electric Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Nuzzle', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Nuzzle should reduce defender HP');
  });

  it('Order Up' + ' [80 BP Dragon Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Order Up', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Order Up should reduce defender HP');
  });

  it('Outrage' + ' [120 BP Dragon Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Outrage', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Outrage should reduce defender HP');
  });

  it('Pay Day' + ' [40 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Pay Day', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Pay Day should reduce defender HP');
  });

  it('Payback' + ' [50 BP Dark Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Payback', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Payback should reduce defender HP');
  });

  it('Peck' + ' [35 BP Flying Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Peck', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Peck should reduce defender HP');
  });

  // 'Petal Blizzard' — covered by a manual test (see by-category/manual/).

  // 'Phantom Force' — covered by a manual test (see by-category/manual/).

  it('Pin Missile' + ' [25 BP Bug Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Pin Missile', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Pin Missile should reduce defender HP');
  });

  it('Plasma Fists' + ' [100 BP Electric Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Plasma Fists', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Plasma Fists should reduce defender HP');
  });

  it('Play Rough' + ' [90 BP Fairy Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Play Rough', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Play Rough should reduce defender HP');
  });

  it('Pluck' + ' [60 BP Flying Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Pluck', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Pluck should reduce defender HP');
  });

  it('Poison Fang' + ' [50 BP Poison Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Poison Fang', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Poison Fang should reduce defender HP');
  });

  it('Poison Jab' + ' [80 BP Poison Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Poison Jab', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Poison Jab should reduce defender HP');
  });

  it('Poison Sting' + ' [15 BP Poison Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Poison Sting', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Poison Sting should reduce defender HP');
  });

  it('Poison Tail' + ' [50 BP Poison Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Poison Tail', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Poison Tail should reduce defender HP');
  });

  it('Poltergeist' + ' [110 BP Ghost Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Poltergeist', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Poltergeist should reduce defender HP');
  });

  it('Population Bomb' + ' [20 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Population Bomb', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Population Bomb should reduce defender HP');
  });

  it('Pounce' + ' [50 BP Bug Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Pounce', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Pounce should reduce defender HP');
  });

  it('Pound' + ' [40 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Pound', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Pound should reduce defender HP');
  });

  it('Power Trip' + ' [20 BP Dark Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Power Trip', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Power Trip should reduce defender HP');
  });

  it('Power Whip' + ' [120 BP Grass Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Power Whip', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Power Whip should reduce defender HP');
  });

  it('Power-Up Punch' + ' [40 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Power-Up Punch', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Power-Up Punch should reduce defender HP');
  });

  // 'Precipice Blades' — covered by a manual test (see by-category/manual/).

  // 'Present' — covered by a manual test (see by-category/manual/).

  it('Psyblade' + ' [80 BP Psychic Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Psyblade', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Psyblade should reduce defender HP');
  });

  it('Psychic Fangs' + ' [85 BP Psychic Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Psychic Fangs', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Psychic Fangs should reduce defender HP');
  });

  it('Psycho Cut' + ' [70 BP Psychic Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Psycho Cut', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Psycho Cut should reduce defender HP');
  });

  it('Psyshield Bash' + ' [70 BP Psychic Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Psyshield Bash', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Psyshield Bash should reduce defender HP');
  });

  // 'Punishment' — covered by a manual test (see by-category/manual/).

  // 'Pursuit' — covered by a manual test (see by-category/manual/).

  it('Pyro Ball' + ' [120 BP Fire Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Pyro Ball', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Pyro Ball should reduce defender HP');
  });

  it('Quick Attack' + ' [40 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Quick Attack', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Quick Attack should reduce defender HP');
  });

  it('Rage' + ' [20 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Rage', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Rage should reduce defender HP');
  });

  it('Rage Fist' + ' [50 BP Ghost Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Rage Fist', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Rage Fist should reduce defender HP');
  });

  it('Raging Bull' + ' [90 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Raging Bull', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Raging Bull should reduce defender HP');
  });

  it('Raging Fury' + ' [120 BP Fire Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Raging Fury', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Raging Fury should reduce defender HP');
  });

  it('Rapid Spin' + ' [50 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Rapid Spin', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Rapid Spin should reduce defender HP');
  });

  // 'Razor Leaf' — covered by a manual test (see by-category/manual/).

  it('Razor Shell' + ' [75 BP Water Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Razor Shell', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Razor Shell should reduce defender HP');
  });

  it('Retaliate' + ' [70 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Retaliate', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Retaliate should reduce defender HP');
  });

  // 'Return' — covered by a manual test (see by-category/manual/).

  // 'Revenge' — covered by a manual test (see by-category/manual/).

  // 'Reversal' — covered by a manual test (see by-category/manual/).

  it('Rock Blast' + ' [25 BP Rock Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Rock Blast', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Rock Blast should reduce defender HP');
  });

  it('Rock Climb' + ' [90 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Rock Climb', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Rock Climb should reduce defender HP');
  });

  // 'Rock Slide' — covered by a manual test (see by-category/manual/).

  it('Rock Smash' + ' [40 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Rock Smash', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Rock Smash should reduce defender HP');
  });

  it('Rock Throw' + ' [50 BP Rock Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Rock Throw', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Rock Throw should reduce defender HP');
  });

  it('Rock Tomb' + ' [60 BP Rock Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Rock Tomb', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Rock Tomb should reduce defender HP');
  });

  it('Rock Wrecker' + ' [150 BP Rock Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Rock Wrecker', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Rock Wrecker should reduce defender HP');
  });

  it('Rolling Kick' + ' [60 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Rolling Kick', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Rolling Kick should reduce defender HP');
  });

  it('Rollout' + ' [30 BP Rock Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Rollout', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Rollout should reduce defender HP');
  });

  it('Sacred Fire' + ' [100 BP Fire Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Sacred Fire', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Sacred Fire should reduce defender HP');
  });

  it('Sacred Sword' + ' [90 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Sacred Sword', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Sacred Sword should reduce defender HP');
  });

  it('Salt Cure' + ' [40 BP Rock Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Salt Cure', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Salt Cure should reduce defender HP');
  });

  it('Sand Tomb' + ' [35 BP Ground Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Sand Tomb', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Sand Tomb should reduce defender HP');
  });

  it('Sappy Seed' + ' [100 BP Grass Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Sappy Seed', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Sappy Seed should reduce defender HP');
  });

  it('Scale Shot' + ' [25 BP Dragon Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Scale Shot', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Scale Shot should reduce defender HP');
  });

  it('Scratch' + ' [40 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Scratch', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Scratch should reduce defender HP');
  });

  it('Secret Power' + ' [70 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Secret Power', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Secret Power should reduce defender HP');
  });

  it('Seed Bomb' + ' [80 BP Grass Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Seed Bomb', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Seed Bomb should reduce defender HP');
  });

  // 'Seismic Toss' — covered by a manual test (see by-category/manual/).

  // 'Self-Destruct' — covered by a manual test (see by-category/manual/).

  it('Shadow Bone' + ' [85 BP Ghost Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Shadow Bone', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Shadow Bone should reduce defender HP');
  });

  it('Shadow Claw' + ' [70 BP Ghost Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Shadow Claw', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Shadow Claw should reduce defender HP');
  });

  // 'Shadow Force' — covered by a manual test (see by-category/manual/).

  it('Shadow Punch' + ' [60 BP Ghost Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Shadow Punch', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Shadow Punch should reduce defender HP');
  });

  it('Shadow Sneak' + ' [40 BP Ghost Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Shadow Sneak', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Shadow Sneak should reduce defender HP');
  });

  it('Shadow Strike' + ' [80 BP Ghost Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Shadow Strike', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Shadow Strike should reduce defender HP');
  });

  it('Sizzly Slide' + ' [60 BP Fire Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Sizzly Slide', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Sizzly Slide should reduce defender HP');
  });

  it('Skitter Smack' + ' [70 BP Bug Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Skitter Smack', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Skitter Smack should reduce defender HP');
  });

  // 'Skull Bash' — covered by a manual test (see by-category/manual/).

  // 'Sky Attack' — covered by a manual test (see by-category/manual/).

  // 'Sky Drop' — covered by a manual test (see by-category/manual/).

  it('Sky Uppercut' + ' [85 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Sky Uppercut', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Sky Uppercut should reduce defender HP');
  });

  it('Slam' + ' [80 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Slam', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Slam should reduce defender HP');
  });

  it('Slash' + ' [70 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Slash', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Slash should reduce defender HP');
  });

  it('Smack Down' + ' [50 BP Rock Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Smack Down', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Smack Down should reduce defender HP');
  });

  it('Smart Strike' + ' [70 BP Steel Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Smart Strike', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Smart Strike should reduce defender HP');
  });

  it('Smelling Salts' + ' [70 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Smelling Salts', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Smelling Salts should reduce defender HP');
  });

  it('Snap Trap' + ' [35 BP Grass Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Snap Trap', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Snap Trap should reduce defender HP');
  });

  // 'Solar Blade' — covered by a manual test (see by-category/manual/).

  it('Spark' + ' [65 BP Electric Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Spark', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Spark should reduce defender HP');
  });

  it('Spectral Thief' + ' [90 BP Ghost Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Spectral Thief', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Spectral Thief should reduce defender HP');
  });

  it('Spike Cannon' + ' [20 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Spike Cannon', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Spike Cannon should reduce defender HP');
  });

  it('Spin Out' + ' [100 BP Steel Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Spin Out', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Spin Out should reduce defender HP');
  });

  it('Spirit Break' + ' [75 BP Fairy Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Spirit Break', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Spirit Break should reduce defender HP');
  });

  it('Spirit Shackle' + ' [80 BP Ghost Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Spirit Shackle', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Spirit Shackle should reduce defender HP');
  });

  it('Steamroller' + ' [65 BP Bug Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Steamroller', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Steamroller should reduce defender HP');
  });

  // 'Steel Roller' — covered by a manual test (see by-category/manual/).

  it('Steel Wing' + ' [70 BP Steel Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Steel Wing', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Steel Wing should reduce defender HP');
  });

  it('Stomp' + ' [65 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Stomp', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Stomp should reduce defender HP');
  });

  it('Stomping Tantrum' + ' [75 BP Ground Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Stomping Tantrum', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Stomping Tantrum should reduce defender HP');
  });

  it('Stone Axe' + ' [65 BP Rock Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Stone Axe', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Stone Axe should reduce defender HP');
  });

  it('Stone Edge' + ' [100 BP Rock Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Stone Edge', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Stone Edge should reduce defender HP');
  });

  it('Storm Throw' + ' [60 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Storm Throw', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Storm Throw should reduce defender HP');
  });

  it('Strength' + ' [80 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Strength', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Strength should reduce defender HP');
  });

  it('Struggle' + ' [50 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Struggle', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Struggle should reduce defender HP');
  });

  it('Submission' + ' [80 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Submission', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Submission should reduce defender HP');
  });

  // 'Sucker Punch' — covered by a manual test (see by-category/manual/).

  it('Sunsteel Strike' + ' [100 BP Steel Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Sunsteel Strike', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Sunsteel Strike should reduce defender HP');
  });

  // 'Super Fang' — covered by a manual test (see by-category/manual/).

  it('Supercell Slam' + ' [100 BP Electric Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Supercell Slam', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Supercell Slam should reduce defender HP');
  });

  it('Superpower' + ' [120 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Superpower', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Superpower should reduce defender HP');
  });

  it('Surging Strikes' + ' [25 BP Water Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Surging Strikes', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Surging Strikes should reduce defender HP');
  });

  it('Tackle' + ' [40 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Tackle', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Tackle should reduce defender HP');
  });

  it('Tail Slap' + ' [25 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Tail Slap', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Tail Slap should reduce defender HP');
  });

  it('Take Down' + ' [90 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Take Down', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Take Down should reduce defender HP');
  });

  it('Temper Flare' + ' [75 BP Fire Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Temper Flare', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Temper Flare should reduce defender HP');
  });

  it('Thief' + ' [60 BP Dark Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Thief', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Thief should reduce defender HP');
  });

  // 'Thousand Arrows' — covered by a manual test (see by-category/manual/).

  // 'Thousand Waves' — covered by a manual test (see by-category/manual/).

  it('Thrash' + ' [120 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Thrash', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Thrash should reduce defender HP');
  });

  it('Throat Chop' + ' [80 BP Dark Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Throat Chop', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Throat Chop should reduce defender HP');
  });

  it('Thunder Fang' + ' [65 BP Electric Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Thunder Fang', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Thunder Fang should reduce defender HP');
  });

  it('Thunder Punch' + ' [75 BP Electric Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Thunder Punch', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Thunder Punch should reduce defender HP');
  });

  it('Thunderous Kick' + ' [90 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Thunderous Kick', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Thunderous Kick should reduce defender HP');
  });

  it('Trailblaze' + ' [50 BP Grass Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Trailblaze', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Trailblaze should reduce defender HP');
  });

  it('Triple Arrows' + ' [90 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Triple Arrows', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Triple Arrows should reduce defender HP');
  });

  it('Triple Axel' + ' [20 BP Ice Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Triple Axel', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Triple Axel should reduce defender HP');
  });

  it('Triple Dive' + ' [30 BP Water Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Triple Dive', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Triple Dive should reduce defender HP');
  });

  it('Triple Kick' + ' [10 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Triple Kick', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Triple Kick should reduce defender HP');
  });

  it('Trop Kick' + ' [70 BP Grass Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Trop Kick', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Trop Kick should reduce defender HP');
  });

  it('Twineedle' + ' [25 BP Bug Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Twineedle', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Twineedle should reduce defender HP');
  });

  it('U-turn' + ' [70 BP Bug Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['U-turn', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'U-turn should reduce defender HP');
  });

  // 'Upper Hand' — covered by a manual test (see by-category/manual/).

  it('V-create' + ' [180 BP Fire Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['V-create', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'V-create should reduce defender HP');
  });

  // 'Veevee Volley' — covered by a manual test (see by-category/manual/).

  it('Vine Whip' + ' [45 BP Grass Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Vine Whip', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Vine Whip should reduce defender HP');
  });

  it('Vise Grip' + ' [55 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Vise Grip', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Vise Grip should reduce defender HP');
  });

  it('Vital Throw' + ' [70 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Vital Throw', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Vital Throw should reduce defender HP');
  });

  it('Volt Tackle' + ' [120 BP Electric Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Volt Tackle', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Volt Tackle should reduce defender HP');
  });

  it('Wake-Up Slap' + ' [70 BP Fighting Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Wake-Up Slap', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Wake-Up Slap should reduce defender HP');
  });

  it('Waterfall' + ' [80 BP Water Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Waterfall', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Waterfall should reduce defender HP');
  });

  it('Wave Crash' + ' [120 BP Water Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Wave Crash', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Wave Crash should reduce defender HP');
  });

  it('Wicked Blow' + ' [75 BP Dark Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Wicked Blow', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Wicked Blow should reduce defender HP');
  });

  it('Wicked Torque' + ' [80 BP Dark Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Wicked Torque', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Wicked Torque should reduce defender HP');
  });

  it('Wild Charge' + ' [90 BP Electric Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Wild Charge', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Wild Charge should reduce defender HP');
  });

  it('Wing Attack' + ' [60 BP Flying Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Wing Attack', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Wing Attack should reduce defender HP');
  });

  it('Wood Hammer' + ' [120 BP Grass Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Wood Hammer', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Wood Hammer should reduce defender HP');
  });

  it('Wrap' + ' [15 BP Normal Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Wrap', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Wrap should reduce defender HP');
  });

  it('X-Scissor' + ' [80 BP Bug Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['X-Scissor', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'X-Scissor should reduce defender HP');
  });

  it('Zen Headbutt' + ' [80 BP Psychic Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Zen Headbutt', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Zen Headbutt should reduce defender HP');
  });

  it('Zing Zap' + ' [80 BP Electric Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Zing Zap', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Zing Zap should reduce defender HP');
  });

  it('Zippy Zap' + ' [80 BP Electric Physical]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: ['Zippy Zap', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const beforeHp = defender.currentHp;
    await runTurn({ playerMon: attacker, foeMon: defender });
    assert.ok(defender.currentHp < beforeHp, 'Zippy Zap should reduce defender HP');
  });
});
