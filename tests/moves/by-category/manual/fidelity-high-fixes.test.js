// Regression tests for the FIDELITY-HIGH triage fixes (Wave-2 Batch-2 item 7):
//   Parting Shot ordering, Aura Wheel / Hyperspace Fury species gates,
//   Decorate in singles, Disguise / Tera Shell species gates,
//   Sand Spit weather summon, Berserk Gene on-entry item.
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../../../helpers/load-engine.js';

let e;
before(async () => { e = await loadEngine(); });

const SPLASH4 = ['Splash', 'Splash', 'Splash', 'Splash'];

describe('FIDELITY-HIGH fixes', () => {
  it('Parting Shot lowers the target Atk/SpA even with no bench to switch to', async () => {
    const p = e.mkMon({ species: 'Mew', moves: ['Parting Shot', 'Splash', 'Splash', 'Splash'] });
    const f = e.mkMon({ species: 'Snorlax', moves: SPLASH4 });
    await e.runTurn({ playerMon: p, foeMon: f });
    assert.equal(f.stages.atk, -1, 'target Atk must drop even without a bench');
    assert.equal(f.stages.spa, -1, 'target SpA must drop even without a bench');
  });

  it('Aura Wheel fails for non-Morpeko users', async () => {
    const p = e.mkMon({ species: 'Mew', moves: ['Aura Wheel', 'Splash', 'Splash', 'Splash'] });
    const f = e.mkMon({ species: 'Snorlax', moves: SPLASH4 });
    const logs = await e.runTurn({ playerMon: p, foeMon: f });
    assert.equal(f.currentHp, f.maxHp, 'non-Morpeko Aura Wheel must deal no damage');
    assert.ok(logs.some((l) => l.text.includes('Only Morpeko')), 'failure message expected');
  });

  it('Aura Wheel still works for Morpeko', async () => {
    const p = e.mkMon({ species: 'Morpeko', moves: ['Aura Wheel', 'Splash', 'Splash', 'Splash'] });
    const f = e.mkMon({ species: 'Snorlax', moves: SPLASH4 });
    await e.runTurn({ playerMon: p, foeMon: f });
    assert.ok(f.currentHp < f.maxHp, 'Morpeko Aura Wheel must deal damage');
  });

  it('Hyperspace Fury fails for non-Hoopa-Unbound users (including base Hoopa)', async () => {
    const p = e.mkMon({ species: 'Hoopa', moves: ['Hyperspace Fury', 'Splash', 'Splash', 'Splash'] });
    const f = e.mkMon({ species: 'Snorlax', moves: SPLASH4 });
    const logs = await e.runTurn({ playerMon: p, foeMon: f });
    assert.equal(f.currentHp, f.maxHp, 'confined Hoopa cannot use Hyperspace Fury');
    assert.ok(logs.some((l) => l.text.includes('Hoopa Unbound')), 'failure message expected');
  });

  it('Hyperspace Fury works for Hoopa-Unbound', async () => {
    const p = e.mkMon({ species: 'Hoopa-Unbound', moves: ['Hyperspace Fury', 'Splash', 'Splash', 'Splash'] });
    const f = e.mkMon({ species: 'Snorlax', moves: SPLASH4 });
    await e.runTurn({ playerMon: p, foeMon: f });
    assert.ok(f.currentHp < f.maxHp, 'Hoopa-Unbound Hyperspace Fury must deal damage');
  });

  it('Decorate raises the target Atk and SpA by 2 in singles', async () => {
    const p = e.mkMon({ species: 'Mew', moves: ['Decorate', 'Splash', 'Splash', 'Splash'] });
    const f = e.mkMon({ species: 'Snorlax', moves: SPLASH4 });
    await e.runTurn({ playerMon: p, foeMon: f });
    assert.equal(f.stages.atk, 2, 'Decorate gives the target +2 Atk');
    assert.equal(f.stages.spa, 2, 'Decorate gives the target +2 SpA');
  });

  it('Disguise only absorbs a hit on Mimikyu (not other holders)', async () => {
    // non-Mimikyu holder: ability inert, takes real damage with no disguise message
    const p = e.mkMon({ species: 'Mew', moves: ['Tackle', 'Splash', 'Splash', 'Splash'] });
    const f1 = e.mkMon({ species: 'Snorlax', ability: 'Disguise', moves: SPLASH4 });
    const logs1 = await e.runTurn({ playerMon: p, foeMon: f1 });
    assert.ok(!logs1.some((l) => l.text.includes('disguise was broken')), 'no disguise pop on a non-Mimikyu');
    assert.ok(!f1.volatile.disguiseBroken, 'disguise flag must not be set on a non-Mimikyu');
    assert.ok(f1.currentHp < f1.maxHp, 'non-Mimikyu takes real damage');

    // Mimikyu: first hit only busts the disguise (1/8 chip).
    // (Water Gun — Tackle is Normal and can't touch Ghost-type Mimikyu at all.)
    const p2 = e.mkMon({ species: 'Mew', moves: ['Water Gun', 'Splash', 'Splash', 'Splash'] });
    const f2 = e.mkMon({ species: 'Mimikyu', ability: 'Disguise', moves: SPLASH4 });
    const logs2 = await e.runTurn({ playerMon: p2, foeMon: f2 });
    assert.ok(logs2.some((l) => l.text.includes('disguise was broken')), 'Mimikyu disguise must pop');
    assert.equal(f2.currentHp, f2.maxHp - Math.max(1, Math.floor(f2.maxHp / 8)), 'only the 1/8 bust chip applies');
  });

  it('Tera Shell is inert on non-Terapagos holders', async () => {
    const p = e.mkMon({ species: 'Mew', moves: ['Tackle', 'Splash', 'Splash', 'Splash'] });
    const f = e.mkMon({ species: 'Snorlax', ability: 'Tera Shell', moves: SPLASH4 });
    const logs = await e.runTurn({ playerMon: p, foeMon: f });
    assert.ok(!logs.some((l) => l.text.includes('Tera Shell deflected')), 'no deflection on a non-Terapagos');
  });

  it('Tera Shell still halves effectiveness for Terapagos at full HP', async () => {
    const p = e.mkMon({ species: 'Mew', moves: ['Tackle', 'Splash', 'Splash', 'Splash'] });
    const f = e.mkMon({ species: 'Terapagos', ability: 'Tera Shell', moves: SPLASH4 });
    const logs = await e.runTurn({ playerMon: p, foeMon: f });
    assert.ok(logs.some((l) => l.text.includes('Tera Shell deflected')), 'Terapagos deflection expected');
  });

  it('Sand Spit summons a sandstorm when its holder is hit', async () => {
    const p = e.mkMon({ species: 'Mew', moves: ['Tackle', 'Splash', 'Splash', 'Splash'] });
    const f = e.mkMon({ species: 'Silicobra', ability: 'Sand Spit', moves: SPLASH4 });
    const logs = await e.runTurn({ playerMon: p, foeMon: f });
    assert.equal(e.engine.state.weather, 'Sandstorm', 'sandstorm must be active after the hit');
    assert.ok(logs.some((l) => l.text.includes('Sand Spit whipped up a sandstorm')), 'summon message expected');
  });

  it('Berserk Gene grants +2 Atk and confusion on entry, consuming the item', async () => {
    const p = e.mkMon({ species: 'Mew', item: 'Berserk Gene', moves: SPLASH4 });
    const f = e.mkMon({ species: 'Snorlax', moves: SPLASH4 });
    e.reset();
    const st = e.engine.state;
    st.magicRoom = 0; st.terrain = null; st.terrainTurns = 0;
    st.trickRoom = 0; st.gravity = 0; st.wonderRoom = 0;
    st.pActive = p; st.fActive = f; st.playerParty = [p]; st.foeParty = [f];
    e.window.applySwitchInAbilities(p, f);
    assert.equal(p.stages.atk, 2, 'Berserk Gene gives +2 Atk on entry');
    assert.ok(p.volatile.confusion > 0, 'Berserk Gene confuses the holder');
    assert.equal(p.item, null, 'Berserk Gene is consumed');
    assert.equal(p.itemConsumed, true, 'consumption flag set (Unburden etc.)');
  });
});
