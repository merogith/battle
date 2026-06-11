// Showdown-parity regression tests for end-of-turn residual ordering.
//
//  1. Within one mon's residual pass, Leech Seed drains BEFORE poison/burn
//     damage (Showdown: weather → terrain/items → Aqua Ring/Ingrain →
//     Leech Seed → PSN/BRN).
//  2. Across the two sides, the FASTER mon's residuals run first
//     (Showdown resolves residuals in effective-speed order each turn).
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../../../helpers/load-engine.js';

let mkMon, runTurn, window, engine, logs;
before(async () => {
  const e = await loadEngine();
  mkMon = e.mkMon;
  runTurn = e.runTurn;
  window = e.window;
  engine = e.engine;
  logs = e.logs;
});

const idxOf = (turnLogs, frag) => turnLogs.findIndex((l) => l.text.includes(frag));

describe('end-of-turn residual ordering (Showdown parity)', () => {
  it('Leech Seed drains before poison damage on the same mon', async () => {
    const p = mkMon({ species: 'Mew', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const f = mkMon({ species: 'Snorlax', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    f.status = 'PSN';
    f.volatile.leechSeed = true;
    const turnLogs = await runTurn({ playerMon: p, foeMon: f });
    const seedIdx = idxOf(turnLogs, 'sapped by Leech Seed');
    const psnIdx = idxOf(turnLogs, 'damage from poison');
    assert.ok(seedIdx >= 0, 'Leech Seed drain should have fired');
    assert.ok(psnIdx >= 0, 'poison damage should have fired');
    assert.ok(seedIdx < psnIdx, `Leech Seed (log #${seedIdx}) must drain before poison damage (log #${psnIdx})`);
  });

  it('Leech Seed drains before burn damage on the same mon', async () => {
    const p = mkMon({ species: 'Mew', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const f = mkMon({ species: 'Snorlax', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    f.status = 'BRN';
    f.volatile.leechSeed = true;
    const turnLogs = await runTurn({ playerMon: p, foeMon: f });
    const seedIdx = idxOf(turnLogs, 'sapped by Leech Seed');
    const brnIdx = idxOf(turnLogs, 'damage from its burn');
    assert.ok(seedIdx >= 0, 'Leech Seed drain should have fired');
    assert.ok(brnIdx >= 0, 'burn damage should have fired');
    assert.ok(seedIdx < brnIdx, `Leech Seed (log #${seedIdx}) must drain before burn damage (log #${brnIdx})`);
  });

  it('faster mon takes its residual damage first (foe faster)', async () => {
    // Both poisoned; foe is much faster. The foe's poison tick must log first.
    const p = mkMon({ species: 'Snorlax', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const f = mkMon({ species: 'Jolteon', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    p.status = 'PSN';
    f.status = 'PSN';
    p.stats.spe = 5;
    f.stats.spe = 400;
    const turnLogs = await runTurn({ playerMon: p, foeMon: f, forcePlayerFast: false });
    const pIdx = turnLogs.findIndex((l) => l.text.includes('Snorlax took') && l.text.includes('poison'));
    const fIdx = turnLogs.findIndex((l) => l.text.includes('Jolteon took') && l.text.includes('poison'));
    assert.ok(pIdx >= 0 && fIdx >= 0, 'both poison ticks should have fired');
    assert.ok(fIdx < pIdx, `faster foe's poison tick (#${fIdx}) must precede slower player's (#${pIdx})`);
  });

  it('slower foe takes its residual damage second (player faster)', async () => {
    const p = mkMon({ species: 'Jolteon', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const f = mkMon({ species: 'Snorlax', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    p.status = 'PSN';
    f.status = 'PSN';
    p.stats.spe = 400;
    f.stats.spe = 5;
    const turnLogs = await runTurn({ playerMon: p, foeMon: f, forcePlayerFast: false });
    const pIdx = turnLogs.findIndex((l) => l.text.includes('Jolteon took') && l.text.includes('poison'));
    const fIdx = turnLogs.findIndex((l) => l.text.includes('Snorlax took') && l.text.includes('poison'));
    assert.ok(pIdx >= 0 && fIdx >= 0, 'both poison ticks should have fired');
    assert.ok(pIdx < fIdx, `faster player's poison tick (#${pIdx}) must precede slower foe's (#${fIdx})`);
  });

  it('player-first is kept when residual speeds tie', async () => {
    const p = mkMon({ species: 'Mew', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const f = mkMon({ species: 'Jolteon', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    p.status = 'PSN';
    f.status = 'PSN';
    p.stats.spe = 100;
    f.stats.spe = 100;
    const turnLogs = await runTurn({ playerMon: p, foeMon: f, forcePlayerFast: false });
    const pIdx = turnLogs.findIndex((l) => l.text.includes('Mew took') && l.text.includes('poison'));
    const fIdx = turnLogs.findIndex((l) => l.text.includes('Jolteon took') && l.text.includes('poison'));
    assert.ok(pIdx >= 0 && fIdx >= 0, 'both poison ticks should have fired');
    assert.ok(pIdx < fIdx, 'tied speeds keep the player-first residual order');
  });
});
