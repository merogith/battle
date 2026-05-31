// Future Sight / Doom Desire strike "two turns later": cast on turn N, the
// target is hit at the end of turn N+2 (no HP change on turns N and N+1).
//
// Regression guard for the delayed-damage counter (battle.html ~22648). It was
// set to 2, but the end-of-turn tick (runWishHealing) also fires on the cast
// turn, so 2 struck a turn early (end of N+1). Fixed to 3 — one more than Wish's
// 2, which is a genuine next-turn effect. Matches tests/reports/deviations.md
// ("delayed 2 turns") and Showdown.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const logsHave = (logs, re) => logs.some(l => re.test(l.text));

async function castAndTrace(moveName) {
  const caster = eng.mkMon({ species: 'Alakazam', moves: [moveName, 'Splash', 'Splash', 'Splash'] });
  const target = eng.mkMon({ species: 'Snorlax', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

  // Turn 1 (cast): no strike.
  let logs = await eng.runTurn({ playerMon: caster, foeMon: target, playerMoveSlot: 0, foeMoveSlot: 0 });
  assert.ok(logsHave(logs, /foresaw an attack/), `${moveName} is cast`);
  assert.ok(!logsHave(logs, /struck/), `${moveName}: no strike on the cast turn`);
  const hpAfterCast = target.currentHp;

  // Turn 2: still pending (this is where the off-by-one used to strike).
  logs = await eng.runTurn({ playerMon: caster, foeMon: target, playerMoveSlot: 1, foeMoveSlot: 0 });
  assert.ok(!logsHave(logs, /struck/), `${moveName}: no strike on turn 2`);
  assert.equal(target.currentHp, hpAfterCast, `${moveName}: target HP unchanged through turn 2`);

  // Turn 3: strike (two turns after the cast).
  logs = await eng.runTurn({ playerMon: caster, foeMon: target, playerMoveSlot: 1, foeMoveSlot: 0 });
  assert.ok(logsHave(logs, /struck/), `${moveName}: strikes on turn 3`);
  assert.ok(target.currentHp < hpAfterCast, `${moveName}: target takes delayed damage on turn 3`);
}

test('Future Sight strikes two turns later (cast turn 1 -> strike turn 3)', async () => {
  await castAndTrace('Future Sight');
});

test('Doom Desire strikes two turns later (shares the handler)', async () => {
  await castAndTrace('Doom Desire');
});
