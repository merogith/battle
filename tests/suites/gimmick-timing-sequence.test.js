// Showdown-parity regression: Mega / Dynamax / Terastallization all resolve at the
// START of the turn — before the speed compare AND before either Pokémon's move — so
// a SLOWER gimmick user gains its benefit (doubled HP / new typing) before a faster
// foe hits it. Previously Dynamax & Tera only activated inside performAction when the
// queued mon took its own action, so a slower user was hit pre-gimmick (wrongful KO /
// wrongful damage+status). Mega was already correct; these lock all three in.
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

let engine, window, mkMon, logs, seedRng;
before(async () => {
  const e = await loadEngine();
  engine = e.engine; window = e.window; mkMon = e.mkMon; logs = e.logs; seedRng = e.seedRng;
});

// Set up a fresh 1v1 with a queued player gimmick intent, then drive one turn.
// Returns the turn's log texts. The foe never gimmicks (harness aiChooseGimmick → null).
async function runGimmickTurn({ pMon, fMon, pIntentKind, moveSlot = 0, foeSlot = 0 }) {
  logs.length = 0;
  seedRng(0);
  engine.state = {
    mode: 'pve', turnNumber: 0, isOver: false, isLocked: false,
    weather: null, weatherTurns: 0, magicRoom: 0, trickRoom: 0, gravity: 0,
    pSide: { stealthRock:false, toxicSpikes:0, spikes:0, stickyWeb:false, reflect:0, lightScreen:0 },
    fSide: { stealthRock:false, toxicSpikes:0, spikes:0, stickyWeb:false, reflect:0, lightScreen:0 },
    playerParty: [pMon], foeParty: [fMon], pActive: pMon, fActive: fMon,
    currentPlayer: 1, p1Action: null, p2Action: null,
    p1GimmickIntent: pIntentKind ? { kind: pIntentKind, slot: 0 } : null,
    p2GimmickIntent: null, revealedFoe: new Set(),
  };
  engine.setForcedFoeMoveSlot(foeSlot);
  const start = logs.length;
  await window.playTurn(moveSlot, null);
  return logs.slice(start).map((l) => l.text);
}

const idxOf = (arr, re) => arr.findIndex((t) => re.test(t));

describe('gimmick activation timing (Showdown parity)', () => {
  it('Dynamax doubles HP at turn start — a slower user survives a would-be-KO hit', async () => {
    const bliss = mkMon({ species: 'Blissey', moves: ['Pound', 'Pound', 'Pound', 'Pound'] });
    bliss.buildData = bliss.buildData || {};
    bliss.buildData.gimmick = 'DYNAMAX';
    bliss.stats.spe = 5;          // slower than the foe
    bliss.currentHp = 40;         // lethal at base HP, survivable at doubled HP
    const foe = mkMon({ species: 'Rampardos', moves: ['Earthquake', 'Earthquake', 'Earthquake', 'Earthquake'] });
    foe.stats.spe = 400;          // moves first

    const out = await runGimmickTurn({ pMon: bliss, fMon: foe, pIntentKind: 'DYNAMAX' });
    const dmaxIdx = idxOf(out, /Dynamaxing/);
    const foeMoveIdx = idxOf(out, /Rampardos used Earthquake/);

    assert.ok(dmaxIdx >= 0, 'Blissey should Dynamax');
    assert.ok(foeMoveIdx >= 0, "foe's move should resolve");
    assert.ok(dmaxIdx < foeMoveIdx, `Dynamax (log #${dmaxIdx}) must resolve before the faster foe's move (log #${foeMoveIdx})`);
    assert.equal(bliss.dynamaxed, true, 'Blissey is Dynamaxed');
    assert.ok(bliss.currentHp > 0, `Blissey survives at doubled HP (was ${bliss.currentHp})`);
  });

  it('Terastallization changes typing at turn start — a slower Tera-Ghost user is immune to a faster Normal move', async () => {
    const lax = mkMon({ species: 'Snorlax', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    lax.buildData = lax.buildData || {};
    lax.buildData.teraType = 'Ghost';
    lax.stats.spe = 5;
    const startHp = lax.currentHp;
    const foe = mkMon({ species: 'Tauros', moves: ['Body Slam', 'Body Slam', 'Body Slam', 'Body Slam'] });
    foe.stats.spe = 400;

    const out = await runGimmickTurn({ pMon: lax, fMon: foe, pIntentKind: 'TERA' });
    const teraIdx = idxOf(out, /Terastallized/);
    const foeMoveIdx = idxOf(out, /Tauros used Body Slam/);

    assert.ok(teraIdx >= 0, 'Snorlax should Terastallize');
    assert.ok(teraIdx < foeMoveIdx, `Tera (log #${teraIdx}) must resolve before the faster foe's move (log #${foeMoveIdx})`);
    assert.equal(lax.type1, 'Ghost', 'Snorlax is now Ghost-typed');
    assert.equal(startHp - lax.currentHp, 0, 'Ghost typing makes the Normal move deal 0 damage');
    assert.equal(lax.status, null, 'no paralysis — the move never connected');
  });

  it('A slower Dynamax user with a status move still becomes Max Guard (+4 priority preserved)', async () => {
    const lax = mkMon({ species: 'Snorlax', moves: ['Amnesia', 'Amnesia', 'Amnesia', 'Amnesia'] });
    lax.buildData = lax.buildData || {};
    lax.buildData.gimmick = 'DYNAMAX';
    lax.stats.spe = 5;
    const foe = mkMon({ species: 'Tauros', moves: ['Tackle', 'Tackle', 'Tackle', 'Tackle'] });
    foe.stats.spe = 400;

    const out = await runGimmickTurn({ pMon: lax, fMon: foe, pIntentKind: 'DYNAMAX' });
    assert.equal(lax.dynamaxed, true, 'Snorlax is Dynamaxed');
    assert.ok(idxOf(out, /Max Guard/) >= 0, 'a Dynamaxed status move becomes Max Guard');
  });
});
