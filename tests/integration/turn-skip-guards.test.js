import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

// Regression guards for unguarded dereferences that surfaced as
// "[Error: … Turn skipped.]" in the turn loop. Same symptom class as the
// "Can't find variable: sm" scope-leak bug, different root cause: a secondary
// effect / status check dereferenced an object that can be transiently absent.

function findCrashLogs(logs) {
  return logs.filter((l) =>
    /can't find variable|is not defined|cannot read|cannot set|Turn skipped|ReferenceError|TypeError/i.test(l.text));
}

test('flinch: a 100%-flinch move (Fake Out) resolves cleanly in normal play', async () => {
  const { mkMon, runTurn } = await loadEngine();
  const attacker = mkMon({ species: 'Hitmonchan', moves: ['Fake Out', 'Tackle', 'Tackle', 'Tackle'] });
  const defender = mkMon({ species: 'Snorlax', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  const logs = await runTurn({ playerMon: attacker, foeMon: defender, playerMoveSlot: 0, foeMoveSlot: 0 });
  assert.equal(findCrashLogs(logs).length, 0, 'Fake Out must not skip the turn');
});

test('flinch: secondary flinch does not throw when defender.volatile is absent', async () => {
  // Mirrors the auditor repro: parseMoveEffects wrote defender.volatile.flinch
  // without the guard its sibling _tryConfuse already had.
  const { engine, mkMon, reset } = await loadEngine();
  reset();
  const attacker = mkMon({ species: 'Hitmonchan', moves: ['Fake Out', 'Tackle', 'Tackle', 'Tackle'] });
  const defender = mkMon({ species: 'Snorlax', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  engine.state.pActive = attacker;
  engine.state.fActive = defender;
  engine.state.playerParty = [attacker];
  engine.state.foeParty = [defender];
  delete defender.volatile; // transiently-absent scenario
  const fakeOut = attacker.moves[0];
  await assert.doesNotReject(
    () => engine.parseMoveEffects(attacker, defender, fakeOut, true),
    'flinch secondary must not throw when defender.volatile is absent',
  );
});
