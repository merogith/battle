// Future Sight / Doom Desire strike "two turns later": cast on turn N, the
// target is hit at the end of turn N+2 (no HP change on turns N and N+1).
//
// Regression guard for the delayed-damage counter (battle.html ~22648). It was
// set to 2, but the end-of-turn tick (runWishHealing) also fires on the cast
// turn, so 2 struck a turn early (end of N+1). Fixed to 3 — one more than Wish's
// 2, which is a genuine next-turn effect. Matches tests/reports/deviations.md
// ("delayed 2 turns") and Showdown.
//
// Future Sight is stored on the TARGET'S SIDE (so it hits whoever is active when
// it lands, not the original target). That means the battle state must persist
// across turns here — runTurn() resets pSide/fSide every call, which would wipe a
// side-stored pending strike — so we drive playTurn directly over one battle.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const logsHave = (logs, re) => logs.some(l => re.test(l.text));

async function castAndTrace(moveName) {
  const { engine, mkMon, reset, window, logs } = eng;
  reset();
  const caster = mkMon({ species: 'Alakazam', moves: [moveName, 'Splash', 'Splash', 'Splash'] });
  const target = mkMon({ species: 'Snorlax', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  caster.stats.spe = 999; // cast/attacks resolve before the foe acts
  engine.state.mode = 'pve';
  engine.state.playerParty = [caster];
  engine.state.foeParty = [target];
  engine.state.pActive = caster;
  engine.state.fActive = target;
  engine.state.isOver = false;
  engine.state.isLocked = false;
  engine.setForcedFoeMoveSlot(0);
  const turn = async (slot) => { const n = logs.length; await window.playTurn(slot, null); return logs.slice(n); };

  // Turn 1 (cast): no strike.
  let l = await turn(0);
  assert.ok(logsHave(l, /foresaw an attack/), `${moveName} is cast`);
  assert.ok(!logsHave(l, /struck/), `${moveName}: no strike on the cast turn`);
  const hpAfterCast = target.currentHp;

  // Turn 2: still pending (this is where the off-by-one used to strike).
  l = await turn(1);
  assert.ok(!logsHave(l, /struck/), `${moveName}: no strike on turn 2`);
  assert.equal(target.currentHp, hpAfterCast, `${moveName}: target HP unchanged through turn 2`);

  // Turn 3: strike (two turns after the cast).
  l = await turn(1);
  assert.ok(logsHave(l, /struck/), `${moveName}: strikes on turn 3`);
  assert.ok(target.currentHp < hpAfterCast, `${moveName}: target takes delayed damage on turn 3`);
}

test('Future Sight strikes two turns later (cast turn 1 -> strike turn 3)', async () => {
  await castAndTrace('Future Sight');
});

test('Doom Desire strikes two turns later (shares the handler)', async () => {
  await castAndTrace('Doom Desire');
});
