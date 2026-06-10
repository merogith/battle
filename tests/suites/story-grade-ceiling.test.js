// Early-game grade CEILING (companion to story-floor-parity; distinct from the
// capability-parity file story-ceiling-parity).
// Governing rule (maintainer 2026-06): enemy GRADE tracks the player's evolution
// availability, so no over-grade foe lands before the player can answer it. The player
// has only a G4-tier basic starter until the Evolution Tutor debuts at City 2, so:
//   City 0-1 → G4 only · City 2-3 → G3+ · City 4-5 → G2+ · City 6+ → unrestricted.
// This closes the "Lapras at Gym 1" / random-G3 early power spike: the gym-leader grade
// matrix forbids G4 and renormalizes GL1's g3:25/g4:75 to an effective g3:100, which used
// to field an all-evolved-tier team against a basic-only player. The ceiling clamps both
// the filler pool AND the signature aces (a no-evo over-grade ace like Lapras can't
// devolve, so it is dropped and replaced by a type-matched ceiling-grade mon).
// Late-game (City 6+) is unchanged — the ceiling is a no-op there.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;
const GENS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const grade = (n) => W.getMonGrade(n, W.getBST(n));

// Prime an active run so the city-keyed ceiling + seeded RNG fire (the helper
// early-returns the no-ceiling default unless a story run is active).
ST.sm.active = true;
ST.sm.runSeed = 11;
ST.sm._strngState = null;
ST.sm.partyEverReached2 = true;
ST.sm.settings = Object.assign(ST.sm.settings || {}, { enabledGens: GENS.slice() });
ST.sm.badges = 0;

// Row ids (STORY_EVENTS_RAW first column): intro Rival=68 (C0), GL1=5 (C1), the C1→C2
// boundary sits at rows 8→9, GymT1-C3=17 (C3), GL4=24 (C4), GL6=38 (C6), E1=60 (C9).
test('ceiling schedule: G4 before city 2, then G3 / G2 / unrestricted', () => {
  assert.equal(ST.storyEnemyGradeCeilingForRow(68), 4, 'intro Rival (C0) — G4 only');
  assert.equal(ST.storyEnemyGradeCeilingForRow(5), 4, 'GL1 (C1) — G4 only, NO G3');
  assert.equal(ST.storyEnemyGradeCeilingForRow(8), 4, 'last C1 row — still G4');
  assert.equal(ST.storyEnemyGradeCeilingForRow(9), 3, 'first C2 row — G3 first admitted');
  assert.equal(ST.storyEnemyGradeCeilingForRow(17), 3, 'GymT1 (C3) — G3');
  assert.equal(ST.storyEnemyGradeCeilingForRow(24), 2, 'GL4 (C4) — G2');
  assert.equal(ST.storyEnemyGradeCeilingForRow(38), 1, 'GL6 (C6) — unrestricted');
  assert.equal(ST.storyEnemyGradeCeilingForRow(60), 1, 'E1 (C9 league) — unrestricted');
});

test('ceiling is inert outside an active run', () => {
  ST.sm.active = false;
  assert.equal(ST.storyEnemyGradeCeilingForRow(5), 1, 'no ceiling when not in a story run');
  ST.sm.active = true; // restore for the rolls below
});

test('pool ceiling: buckets stronger than the ceiling empty; G3 admitted from City 2; fail-open', () => {
  // Compare lengths/elements (primitives) — arrays built inside jsdom fail a cross-realm
  // deepEqual against node-side arrays.
  const T = { 1: ['Mewtwo'], 2: ['Gyarados'], 3: ['Haunter'], 4: ['Caterpie'] };
  const c4 = ST.capGradePoolsByGradeCeiling(T, 4); // City 0-1: only G4 survives
  assert.equal(c4[1].length, 0, 'G1 emptied'); assert.equal(c4[2].length, 0, 'G2 emptied');
  assert.equal(c4[3].length, 0, 'G3 emptied — no G3 before City 2'); assert.equal(c4[4][0], 'Caterpie');
  const c3 = ST.capGradePoolsByGradeCeiling(T, 3); // City 2-3: G3 + G4 (G3 IS admitted)
  assert.equal(c3[1].length, 0); assert.equal(c3[2].length, 0);
  assert.equal(c3[3][0], 'Haunter', 'G3 retained from City 2'); assert.equal(c3[4][0], 'Caterpie');
  // Fail-open: nothing at/under the ceiling → return unchanged so a roll never breaks.
  const thin = { 1: ['Mewtwo'], 2: ['Gyarados'], 3: [], 4: [] };
  const ft = ST.capGradePoolsByGradeCeiling(thin, 4);
  assert.equal(ft[1].length, 1, 'fail-open keeps G1 when no G3/G4 exists');
  assert.equal(ft[2].length, 1, 'fail-open keeps G2 when no G3/G4 exists');
  // ceiling=1 (unrestricted) is a no-op (returns the same object reference).
  assert.equal(ST.capGradePoolsByGradeCeiling(T, 1), T);
});

test('integration: a Gym 1 leader fields ONLY basic-tier (G4) mons — no G3 spike', () => {
  // A Water leader whose authored aces are both G2: Lapras (no-evo → can't devolve) and
  // Starmie (devolves to Staryu, a G4 basic). At City 1 the ceiling is G4, so Lapras must
  // be dropped+replaced and Starmie devolved — the whole team reads as a warm-up gym.
  const leader = { type: 'Water', sigs: ['Lapras', 'Starmie'] };
  let mons = 0;
  for (let i = 0; i < 30; i++) {
    const team = ST.rollTrainerTeam(leader, 6, { g1: 0, g2: 0, g3: 25, g4: 75 }, GENS, 'Gym Leader 1', 5);
    for (const s of team) {
      assert.equal(grade(s.name), 4, `GL1 fielded an over-grade mon ${s.name} (G${grade(s.name)}) — early ceiling breach`);
      assert.notEqual(s.name, 'Lapras', 'the no-evo over-grade ace must be replaced, not fielded');
      mons++;
    }
  }
  assert.ok(mons >= 100, 'sanity: rolled a full set of mons');
});

test('integration: City 2 holds the G3 ceiling (admits G3, never G2/G1)', () => {
  // The companion proof to the pure-function "G3 retained at ceiling 3" above: a City-2
  // gym leader must never field a mon stronger than G3 (no G2/G1 breach).
  const leader = { type: 'Water', sigs: ['Starmie'] };
  for (let i = 0; i < 24; i++) {
    const team = ST.rollTrainerTeam(leader, 6, { g1: 0, g2: 0, g3: 60, g4: 40 }, GENS, 'Gym Leader 2', 9);
    for (const s of team) {
      assert.ok(grade(s.name) >= 3, `City 2 fielded an over-grade mon ${s.name} (G${grade(s.name)}) — ceiling breach`);
    }
  }
});

test('regression: City 6+ is unaffected (ceiling inert, late floor still governs)', () => {
  assert.equal(ST.storyEnemyGradeCeilingForRow(38), 1, 'GL6 ceiling is unrestricted');
  // GL6 still fields only G1/G2 (the floor), exactly as story-floor-parity asserts —
  // the ceiling neither weakens nor strengthens the late game.
  const leader = { type: 'Water', sigs: ['Gyarados', 'Lapras'] };
  ST.sm.badges = 6;
  for (let i = 0; i < 16; i++) {
    const team = ST.rollTrainerTeam(leader, 6, { g1: 0, g2: 0, g3: 100, g4: 0 }, GENS, 'Gym Leader 6', 38);
    for (const s of team) {
      assert.ok(grade(s.name) <= 2, `GL6 fielded a weak mon ${s.name} (G${grade(s.name)})`);
    }
  }
  ST.sm.badges = 0; // restore
});
