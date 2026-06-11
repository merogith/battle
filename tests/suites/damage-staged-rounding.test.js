// Locks the Showdown-style staged damage rounding (Wave-2 Batch-2 item 5):
//   base = floor(floor(22*BP*A/D)/50) + 2
//   → crit (floor) → random 85-100 (floor) → STAB (pokeRound, half-down)
//   → type effectiveness (floor) → burn ×0.5 (floor)
//   → remaining modifiers (one pokeRound step)
// The old formula multiplied everything in float and floored ONCE at the end.
//
// Rolls are pinned via a scripted Math.random queue armed when the engine
// announces the move: consumption order is [accuracy, crit, rng].
import { describe, it, before, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

let e;
before(async () => { e = await loadEngine(); });
afterEach(() => { e.window.Math.random = e.nextFloat; });

const pokeRound = (v) => ((v % 1) > 0.5 ? Math.ceil(v) : Math.floor(v));
const NO_CRIT = 0.99;
const ROLL_85 = 0.0;

async function pinnedHit({ attacker, defender, moveName, rolls, field = false }) {
  const { window, nextFloat, runTurn, reset, engine } = e;
  const q = rolls.slice();
  let armed = false;
  const origLog = window.logMsg;
  window.logMsg = (text, ch) => {
    if (String(text).includes(`used ${moveName}`)) armed = true;
    return origLog(text, ch);
  };
  window.Math.random = () => (armed && q.length > 0) ? q.shift() : nextFloat();
  try {
    if (field) {
      // item scenarios need real-battle field defaults (magicRoom etc.)
      reset();
      const st = engine.state;
      st.magicRoom = 0; st.terrain = null; st.terrainTurns = 0;
      st.trickRoom = 0; st.gravity = 0; st.wonderRoom = 0;
      st.pActive = attacker; st.fActive = defender;
      st.playerParty = [attacker]; st.foeParty = [defender];
      attacker.stats.spe = Math.max(attacker.stats.spe, 999);
      await window.playTurn(0, null);
    } else {
      await runTurn({ playerMon: attacker, foeMon: defender });
    }
    return { dmg: defender.maxHp - defender.currentHp, queueLeft: q.length };
  } finally {
    window.logMsg = origLog;
    window.Math.random = nextFloat;
  }
}

const base = (bp, A, D) => Math.floor(Math.floor(22 * bp * (Math.floor(A) / Math.floor(D))) / 50) + 2;

describe('staged damage rounding (Showdown parity)', () => {
  it('STAB + super-effective: floor(rng) → pokeRound(stab) → floor(typeEff)', async () => {
    const a = e.mkMon({ species: 'Machamp', ability: 'Pressure', moves: ['Cross Chop', 'Splash', 'Splash', 'Splash'] });
    const d = e.mkMon({ species: 'Snorlax', ability: 'Pressure', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const r = await pinnedHit({ attacker: a, defender: d, moveName: 'Cross Chop', rolls: [0.5, NO_CRIT, ROLL_85] });
    assert.equal(r.queueLeft, 0, 'acc/crit/rng rolls all consumed');
    let exp = base(100, a.stats.atk, d.stats.def);
    exp = Math.floor(exp * 0.85);        // random (pinned 85)
    exp = pokeRound(exp * 1.5);          // STAB
    exp = Math.floor(exp * 2);           // Fighting vs Normal
    exp = Math.max(1, exp);
    assert.equal(r.dmg, exp, `staged Cross Chop damage (expected ${exp}, got ${r.dmg})`);
  });

  it('burn halves physical damage as its own floored step AFTER type effectiveness', async () => {
    const a = e.mkMon({ species: 'Machamp', ability: 'Pressure', moves: ['Strength', 'Splash', 'Splash', 'Splash'] });
    const d = e.mkMon({ species: 'Snorlax', ability: 'Pressure', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    a.status = 'BRN';
    const r = await pinnedHit({ attacker: a, defender: d, moveName: 'Strength', rolls: [0.5, NO_CRIT, ROLL_85] });
    assert.equal(r.queueLeft, 0);
    let exp = base(80, a.stats.atk, d.stats.def);
    exp = Math.floor(exp * 0.85);        // random
    // no STAB (Normal move, Fighting user), neutral type eff
    exp = Math.floor(exp * 0.5);         // burn — separate floored step
    exp = Math.max(1, exp);
    assert.equal(r.dmg, exp, `staged burned Strength damage (expected ${exp}, got ${r.dmg})`);
  });

  it('remaining modifiers (Life Orb) apply last as one pokeRound step', async () => {
    const a = e.mkMon({ species: 'Alakazam', ability: 'Pressure', item: 'Life Orb', moves: ['Psychic', 'Splash', 'Splash', 'Splash'] });
    const d = e.mkMon({ species: 'Snorlax', ability: 'Pressure', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const r = await pinnedHit({ attacker: a, defender: d, moveName: 'Psychic', rolls: [0.5, NO_CRIT, ROLL_85], field: true });
    assert.equal(r.queueLeft, 0);
    let exp = base(90, a.stats.spa, d.stats.spd);
    exp = Math.floor(exp * 0.85);        // random
    exp = pokeRound(exp * 1.5);          // STAB
    // neutral type eff vs Normal
    exp = pokeRound(exp * 1.3);          // Life Orb — final modifier step
    exp = Math.max(1, exp);
    assert.equal(r.dmg, exp, `staged Life Orb Psychic damage (expected ${exp}, got ${r.dmg})`);
  });

  it('crit applies as a floored step before the random roll', async () => {
    const a = e.mkMon({ species: 'Machamp', ability: 'Pressure', moves: ['Strength', 'Splash', 'Splash', 'Splash'] });
    const d = e.mkMon({ species: 'Snorlax', ability: 'Pressure', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const r = await pinnedHit({ attacker: a, defender: d, moveName: 'Strength', rolls: [0.5, 0.0 /* crit */, ROLL_85] });
    assert.equal(r.queueLeft, 0);
    let exp = base(80, a.stats.atk, d.stats.def);
    exp = Math.floor(exp * 1.5);         // crit
    exp = Math.floor(exp * 0.85);        // random
    // no STAB, neutral type effectiveness — isolates the crit + random stages
    exp = Math.max(1, exp);
    assert.ok(exp < d.maxHp, 'sanity: expected damage must not KO (would mask rounding)');
    assert.equal(r.dmg, exp, `staged crit Strength damage (expected ${exp}, got ${r.dmg})`);
  });
});
