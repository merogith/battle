// Designed-build move pad: a thin CSV move pool must NOT surface a literal Tackle on a
// real (typed) mon in a story run — the "Tackle at Gym 6" fix. GL6 is T3 (no move
// downgrade), so a Tackle there came from makeDesignedBuild padding a short legalPool with
// the literal move. The pad now fills the species' typed basic STAB instead. makeDesignedBuild
// lives in a story-agnostic scope, so the gate reads window.sm and the type→STAB table off
// window; non-story callers keep the legacy Tackle pad (out-of-scope modes byte-identical).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;

// Base objects are passed literally (window.baseStats isn't exposed); the engine still uses
// its internal baseStats[name] for the pad's typing, so the names must be real species.
const LAPRAS = { t1: 'Water', t2: 'Ice', hp: 130, atk: 85, def: 80, spa: 85, spd: 95, spe: 60 };
const MAGMAR = { t1: 'Fire', t2: '', hp: 65, atk: 95, def: 57, spa: 100, spd: 85, spe: 93 };

test('window plumbing: story signal + STAB table reachable from the story-agnostic factory', () => {
  // The factory reads the run flag via window.StoryMode.isActive() (returns the live
  // sm.active) and the STAB table off window — both must be present across the scope boundary.
  assert.equal(typeof W._designedPickMoves, 'function');
  assert.equal(typeof W.StoryMode.isActive, 'function', 'StoryMode.isActive present');
  assert.ok(W._T1_BASIC_STAB_BY_TYPE && W._T1_BASIC_STAB_BY_TYPE.Water, 'STAB table mirrored to window');
});

test('thin pool pads with a typed STAB, never a literal Tackle (story run)', () => {
  ST.sm.active = true; ST.sm.runSeed = 3; ST.sm._strngState = null;
  for (let i = 0; i < 20; i++) {
    const moves = W._designedPickMoves('Lapras', 'PHYS_ATTACKER', LAPRAS, ['Surf']);
    assert.equal(moves.length, 4, 'pads to a full 4-move set');
    assert.ok(!moves.includes('Tackle'), `padded with Tackle on a typed mon: ${moves.join('/')}`);
    assert.equal(new Set(moves).size, 4, `pad produced a duplicate move: ${moves.join('/')}`);
    // The pads must be Water/Ice basics from the species typing.
    assert.ok(moves.includes('Bubble Beam') || moves.includes('Icy Wind'),
      `pad should use the species' typed basics: ${moves.join('/')}`);
  }
});

test('the pad respects the species typing (Fire mon → Fire basic, not Tackle)', () => {
  ST.sm.active = true;
  const moves = W._designedPickMoves('Magmar', 'PHYS_ATTACKER', MAGMAR, ['Flamethrower']);
  assert.ok(!moves.includes('Tackle'), `Fire mon padded with Tackle: ${moves.join('/')}`);
  assert.ok(moves.includes('Flame Wheel'), `a Fire mon should pad with its Fire basic STAB: ${moves.join('/')}`);
});

test('non-story callers keep the legacy Tackle pad (out-of-scope modes unchanged)', () => {
  ST.sm.active = false;
  const moves = W._designedPickMoves('Lapras', 'PHYS_ATTACKER', LAPRAS, ['Surf']);
  assert.ok(moves.includes('Tackle'), 'non-story pad is the legacy Tackle (byte-identical PvP/QuickPlay)');
  ST.sm.active = true; // restore
});
