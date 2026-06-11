// Regression tests for the six previously-unimplemented move effects
// (Wave-2 Batch-2 item 6): Crafty Shield, Mat Block, Powder, Electrify,
// Nightmare, Laser Focus. Minimal-correct Showdown semantics.
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../../../helpers/load-engine.js';

let e;
before(async () => { e = await loadEngine(); });

const SPLASH4 = ['Splash', 'Splash', 'Splash', 'Splash'];

describe('Crafty Shield', () => {
  it('blocks an incoming status move the turn it is used', async () => {
    const p = e.mkMon({ species: 'Mew', moves: ['Crafty Shield', 'Splash', 'Splash', 'Splash'] });
    const f = e.mkMon({ species: 'Pikachu', moves: ['Thunder Wave', 'Splash', 'Splash', 'Splash'] });
    const logs = await e.runTurn({ playerMon: p, foeMon: f });
    assert.equal(p.status, null, 'Thunder Wave must be blocked by Crafty Shield');
    assert.ok(logs.some((l) => l.text.includes('Crafty Shield blocked')), 'block message expected');
  });

  it('does NOT block damaging moves', async () => {
    const p = e.mkMon({ species: 'Mew', moves: ['Crafty Shield', 'Splash', 'Splash', 'Splash'] });
    const f = e.mkMon({ species: 'Snorlax', moves: ['Tackle', 'Splash', 'Splash', 'Splash'] });
    await e.runTurn({ playerMon: p, foeMon: f });
    assert.ok(p.currentHp < p.maxHp, 'a damaging move must go through Crafty Shield');
  });
});

describe('Mat Block', () => {
  it('blocks damaging moves on the user\'s first turn out', async () => {
    const p = e.mkMon({ species: 'Greninja', moves: ['Mat Block', 'Splash', 'Splash', 'Splash'] });
    const f = e.mkMon({ species: 'Snorlax', moves: ['Tackle', 'Splash', 'Splash', 'Splash'] });
    const logs = await e.runTurn({ playerMon: p, foeMon: f });
    assert.equal(p.currentHp, p.maxHp, 'Tackle must be blocked by Mat Block');
    assert.ok(logs.some((l) => l.text.includes('blocked by the kicked-up mat')), 'block message expected');
  });

  it('fails after the first turn out', async () => {
    const p = e.mkMon({ species: 'Greninja', moves: ['Splash', 'Mat Block', 'Splash', 'Splash'] });
    const f = e.mkMon({ species: 'Snorlax', moves: ['Tackle', 'Splash', 'Splash', 'Splash'] });
    await e.runTurn({ playerMon: p, foeMon: f, playerMoveSlot: 0, foeMoveSlot: 1 }); // turn 1: Splash (consumes first action)
    const before = p.currentHp;
    e.engine.setForcedFoeMoveSlot(0);
    const start = e.logs.length;
    await e.window.playTurn(1, null); // turn 2: Mat Block — must fail; foe Tackles
    const logs = e.logs.slice(start);
    assert.ok(logs.some((l) => l.text.includes('only works on the first turn')), 'failure message expected');
    assert.ok(p.currentHp < before, 'Tackle must connect once Mat Block failed');
  });

  it('does NOT block status moves', async () => {
    const p = e.mkMon({ species: 'Greninja', moves: ['Mat Block', 'Splash', 'Splash', 'Splash'] });
    const f = e.mkMon({ species: 'Pikachu', moves: ['Thunder Wave', 'Splash', 'Splash', 'Splash'] });
    await e.runTurn({ playerMon: p, foeMon: f });
    assert.equal(p.status, 'PAR', 'status moves pass through Mat Block');
  });
});

describe('Powder', () => {
  it('makes the target\'s Fire move fail and costs it 1/4 max HP', async () => {
    const p = e.mkMon({ species: 'Mew', moves: ['Powder', 'Splash', 'Splash', 'Splash'] });
    const f = e.mkMon({ species: 'Charizard', moves: ['Flamethrower', 'Splash', 'Splash', 'Splash'] });
    const logs = await e.runTurn({ playerMon: p, foeMon: f });
    assert.ok(logs.some((l) => l.text.includes('covered in powder')), 'powder application message expected');
    assert.ok(logs.some((l) => l.text.includes('it exploded')), 'explosion message expected');
    assert.equal(p.currentHp, p.maxHp, 'the Fire move must not connect');
    assert.equal(f.currentHp, f.maxHp - Math.max(1, Math.round(f.maxHp / 4)),
      'powdered mon loses 1/4 max HP (rounded half up)');
  });

  it('does not stop the target\'s non-Fire moves', async () => {
    const p = e.mkMon({ species: 'Mew', moves: ['Powder', 'Splash', 'Splash', 'Splash'] });
    const f = e.mkMon({ species: 'Charizard', moves: ['Wing Attack', 'Splash', 'Splash', 'Splash'] });
    await e.runTurn({ playerMon: p, foeMon: f });
    assert.ok(p.currentHp < p.maxHp, 'a non-Fire move still connects through Powder');
    assert.equal(f.currentHp, f.maxHp, 'no explosion damage for a non-Fire move');
  });

  it('fails against Grass-type targets (powder immunity)', async () => {
    const p = e.mkMon({ species: 'Mew', moves: ['Powder', 'Splash', 'Splash', 'Splash'] });
    const f = e.mkMon({ species: 'Sceptile', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    await e.runTurn({ playerMon: p, foeMon: f });
    assert.ok(!f.volatile.powdered, 'Grass types are immune to powder moves');
  });
});

describe('Electrify', () => {
  it('turns the target\'s move Electric-type this turn', async () => {
    // Ground-type player: an electrified Tackle can no longer affect it.
    const p = e.mkMon({ species: 'Sandslash', moves: ['Electrify', 'Splash', 'Splash', 'Splash'] });
    const f = e.mkMon({ species: 'Snorlax', moves: ['Tackle', 'Splash', 'Splash', 'Splash'] });
    const logs = await e.runTurn({ playerMon: p, foeMon: f });
    assert.ok(logs.some((l) => l.text.includes('electrified')), 'electrify message expected');
    assert.equal(p.currentHp, p.maxHp, 'electrified Tackle must not affect a Ground type');
    assert.ok(logs.some((l) => l.text.includes("doesn't affect")), 'Electric-immunity message expected');
  });
});

describe('Nightmare', () => {
  it('drains 1/4 max HP per turn from a sleeping target', async () => {
    const p = e.mkMon({ species: 'Gengar', moves: ['Nightmare', 'Splash', 'Splash', 'Splash'] });
    const f = e.mkMon({ species: 'Snorlax', moves: SPLASH4 });
    f.status = 'SLP'; f.statusTurns = 0; f.sleepDuration = 5;
    const logs = await e.runTurn({ playerMon: p, foeMon: f });
    assert.ok(f.volatile.nightmare, 'nightmare volatile must be set');
    assert.ok(logs.some((l) => l.text.includes('began having a nightmare')), 'start message expected');
    assert.equal(f.currentHp, f.maxHp - Math.max(1, Math.floor(f.maxHp / 4)),
      'sleeping victim loses 1/4 max HP at end of turn');
  });

  it('fails against an awake target', async () => {
    const p = e.mkMon({ species: 'Gengar', moves: ['Nightmare', 'Splash', 'Splash', 'Splash'] });
    const f = e.mkMon({ species: 'Snorlax', moves: SPLASH4 });
    const logs = await e.runTurn({ playerMon: p, foeMon: f });
    assert.ok(!f.volatile.nightmare, 'nightmare must not stick to an awake target');
    assert.ok(logs.some((l) => l.text.includes('But it failed!')), 'failure message expected');
    assert.equal(f.currentHp, f.maxHp, 'no residual damage on a failed Nightmare');
  });

  it('ends when the victim wakes up', async () => {
    const p = e.mkMon({ species: 'Gengar', moves: ['Nightmare', 'Splash', 'Splash', 'Splash'] });
    const f = e.mkMon({ species: 'Snorlax', moves: SPLASH4 });
    f.status = 'SLP'; f.statusTurns = 0; f.sleepDuration = 5;
    await e.runTurn({ playerMon: p, foeMon: f });
    // wake it manually, then run another turn — no further drain, volatile cleared
    f.status = null; f.statusTurns = 0; f.sleepDuration = 0;
    const hpAfterWake = f.currentHp;
    e.engine.setForcedFoeMoveSlot(1);
    await e.window.playTurn(1, null);
    assert.ok(!f.volatile.nightmare, 'nightmare ends when the victim wakes');
    assert.equal(f.currentHp, hpAfterWake, 'no nightmare drain after waking');
  });
});

describe('Laser Focus', () => {
  it('guarantees a critical hit on the next turn', async () => {
    const p = e.mkMon({ species: 'Mew', moves: ['Laser Focus', 'Tackle', 'Splash', 'Splash'] });
    const f = e.mkMon({ species: 'Snorlax', moves: SPLASH4 });
    const t1 = await e.runTurn({ playerMon: p, foeMon: f });
    assert.ok(t1.some((l) => l.text.includes('concentrated intensely')), 'Laser Focus message expected');
    assert.equal(p.volatile.laserFocus, 1, 'laser focus persists into the next turn');
    e.engine.setForcedFoeMoveSlot(1);
    const start = e.logs.length;
    await e.window.playTurn(1, null); // turn 2: Tackle
    const t2 = e.logs.slice(start);
    assert.ok(t2.some((l) => l.text.includes('A critical hit!')), 'next-turn move must crit');
    assert.equal(p.volatile.laserFocus, 0, 'laser focus expires after the next turn');
  });
});
