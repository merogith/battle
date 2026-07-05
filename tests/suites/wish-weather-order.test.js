// Showdown-parity regression: end-of-turn weather damage resolves BEFORE Wish healing
// and Future Sight (Showdown residual order: weather=1, Future Sight=3, Wish=4). A mon
// taken to 0 HP by weather has fainted before Wish/Future Sight fire, so Wish is wasted
// (cannot revive it) — previously the single end-of-turn faint check let a later Wish
// undo a weather KO.
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

let engine, window, mkMon, logs, seedRng;
before(async () => {
  const e = await loadEngine();
  engine = e.engine; window = e.window; mkMon = e.mkMon; logs = e.logs; seedRng = e.seedRng;
});

function baseState({ p, f, weather }) {
  return {
    mode: 'pve', turnNumber: 0, isOver: false, isLocked: false,
    weather: weather || null, weatherTurns: weather ? 5 : 0, magicRoom: 0, trickRoom: 0, gravity: 0,
    terrain: null, terrainTurns: 0,
    pSide: { stealthRock:false, toxicSpikes:0, spikes:0, stickyWeb:false, reflect:0, lightScreen:0, wishHp:0, wishTurns:0, futureSightTurns:0, futureSightPow:0 },
    fSide: { stealthRock:false, toxicSpikes:0, spikes:0, stickyWeb:false, reflect:0, lightScreen:0, wishHp:0, wishTurns:0, futureSightTurns:0, futureSightPow:0 },
    playerParty: [p], foeParty: [f], pActive: p, fActive: f,
    currentPlayer: 1, p1Action: null, p2Action: null,
    p1GimmickIntent: null, p2GimmickIntent: null, revealedFoe: new Set(),
  };
}

describe('Wish / Future Sight vs weather (Showdown residual order)', () => {
  it('weather KOs before Wish heals — a mon at lethal-sandstorm HP faints and the Wish is wasted', async () => {
    logs.length = 0; seedRng(0);
    const p = mkMon({ species: 'Charizard', moves: ['Splash','Splash','Splash','Splash'] }); // Fire/Flying — sand-hit
    const f = mkMon({ species: 'Tyranitar', moves: ['Splash','Splash','Splash','Splash'] }); // Rock — sand-immune
    p.stats.spe = 400; // player's residuals resolve first
    engine.state = baseState({ p, f, weather: 'Sandstorm' });
    p.currentHp = Math.max(1, Math.floor(p.maxHp / 16)); // exactly one sandstorm tick
    engine.state.pSide.wishTurns = 1;
    engine.state.pSide.wishHp = Math.floor(p.maxHp / 2);
    engine.setForcedFoeMoveSlot(0);

    await window.playTurn(0, null);
    const out = logs.map((l) => l.text);
    const sandIdx = out.findIndex((t) => /sandstorm/i.test(t));
    const wishHealed = out.some((t) => /wish came true/i.test(t));

    assert.ok(sandIdx >= 0, 'sandstorm should tick');
    assert.equal(p.currentHp <= 0, true, 'Charizard is KO’d by sandstorm');
    assert.equal(wishHealed, false, 'Wish must NOT revive a mon the weather already KO’d');
  });

  it('Wish still heals a survivor after weather chip (weather → Wish both apply)', async () => {
    logs.length = 0; seedRng(0);
    const p = mkMon({ species: 'Charizard', moves: ['Splash','Splash','Splash','Splash'] });
    const f = mkMon({ species: 'Tyranitar', moves: ['Splash','Splash','Splash','Splash'] });
    p.stats.spe = 400;
    engine.state = baseState({ p, f, weather: 'Sandstorm' });
    p.currentHp = Math.floor(p.maxHp / 2); // survives the chip comfortably
    engine.state.pSide.wishTurns = 1;
    engine.state.pSide.wishHp = Math.floor(p.maxHp / 4);
    const before = p.currentHp;
    engine.setForcedFoeMoveSlot(0);

    await window.playTurn(0, null);
    const out = logs.map((l) => l.text);
    const sandIdx = out.findIndex((t) => /sandstorm/i.test(t));
    const wishIdx = out.findIndex((t) => /wish came true/i.test(t));

    assert.ok(sandIdx >= 0 && wishIdx >= 0, 'both weather and Wish should log');
    assert.ok(sandIdx < wishIdx, `weather (log #${sandIdx}) must resolve before Wish (log #${wishIdx})`);
    assert.ok(p.currentHp > before, 'the survivor is net-healed by Wish');
  });
});
