// Late-game minimum-grade FLOOR (companion to story-ceiling-parity).
// Governing rule (maintainer 2026-06): from city 6 onward, enemy FILLER can't roll
// weaker than G2. Non-boss trainers (gym trainer / basic / elite) evolve their low
// signatures UP to meet the floor; bosses (gym leaders, E1-E4, Champion, rival,
// Mystery, eldritch) keep their authored aces (the low-grade-signature exception).
// Pre-city-6 is unchanged.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const ST = eng.window.__storyTest;
const RT = eng.window.__rivalTest;
const GENS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const grade = (n) => RT.getMonGrade(n, RT.getBST(n));

// Prime an active run so the city-keyed floor + seeded RNG fire (the helpers
// early-return the no-floor default unless a story run is active).
ST.sm.active = true;
ST.sm.runSeed = 7;
ST.sm._strngState = null;
ST.sm.partyEverReached2 = true;
ST.sm.settings = Object.assign(ST.sm.settings || {}, { enabledGens: GENS.slice() });
ST.sm.badges = 6;

// Row ids (STORY_EVENTS_RAW first column): GL1=5 (C1), GL4=24 (C4), GL6=38 (C6),
// GL8=53 (C8), E1=60 (C9), GymT1-C3=17 (C3).
test('floor schedule: G2 from city 6, none before', () => {
  assert.equal(ST.storyFillerGradeFloorForRow(38), 2, 'GL6 (C6) floors at G2');
  assert.equal(ST.storyFillerGradeFloorForRow(53), 2, 'GL8 (C8) floors at G2');
  assert.equal(ST.storyFillerGradeFloorForRow(60), 2, 'E1 (C9 league) floors at G2');
  assert.equal(ST.storyFillerGradeFloorForRow(24), 4, 'GL4 (C4) — no floor');
  assert.equal(ST.storyFillerGradeFloorForRow(17), 4, 'GymT1 C3 — no floor');
  assert.equal(ST.storyFillerGradeFloorForRow(5), 4, 'GL1 (C1) — no floor');
});

test('evolve-up: a low sig walks its own line toward the floor', () => {
  // Assert the resulting FORM (a primitive — robust across the jsdom realm and the
  // harness's BST-band grade fallback). Caterpie's line tops out at Butterfree, etc.
  assert.equal(ST.evolveSigToGradeFloor('Caterpie', 2), 'Butterfree', 'Caterpie → Butterfree');
  assert.equal(ST.evolveSigToGradeFloor('Weedle', 2), 'Beedrill', 'Weedle → Beedrill');
  assert.equal(ST.evolveSigToGradeFloor('Magikarp', 2), 'Gyarados', 'Magikarp → Gyarados');
  // Pseudo lines skip G2 → walk to the G1 final (the maintainer-approved behavior).
  assert.equal(ST.evolveSigToGradeFloor('Dratini', 2), 'Dragonite', 'Dratini → Dragonite (line skips G2)');
  // Already at/above the floor — unchanged.
  assert.equal(ST.evolveSigToGradeFloor('Gengar', 2), 'Gengar', 'a strong final is unchanged');
  // No-evo low final — the genuine exception, stays put.
  assert.equal(ST.evolveSigToGradeFloor('Dewgong', 2), 'Dewgong', 'no-evo low final stays');
  // floor=4 (pre-city-6) never evolves anything.
  assert.equal(ST.evolveSigToGradeFloor('Caterpie', 4), 'Caterpie', 'no-floor leaves babies');
});

test('pool floor: G3/G4 buckets empty at the floor, fail-open when nothing qualifies', () => {
  // Compare lengths/elements (primitives) — arrays built inside jsdom fail a cross-realm
  // deepEqual against node-side arrays.
  const T = { 1: ['Mewtwo'], 2: ['Gyarados'], 3: ['Haunter'], 4: ['Caterpie'] };
  const f = ST.capGradePoolsByGradeFloor(T, 2);
  assert.equal(f[1][0], 'Mewtwo'); assert.equal(f[1].length, 1);
  assert.equal(f[2][0], 'Gyarados'); assert.equal(f[2].length, 1);
  assert.equal(f[3].length, 0, 'G3 bucket emptied');
  assert.equal(f[4].length, 0, 'G4 bucket emptied');
  // Fail-open: nothing at/above the floor → return unchanged so a roll never breaks.
  const thin = { 1: [], 2: [], 3: ['Haunter'], 4: ['Caterpie'] };
  const ft = ST.capGradePoolsByGradeFloor(thin, 2);
  assert.equal(ft[3].length, 1, 'fail-open keeps G3 when no G1/G2 exists');
  assert.equal(ft[4].length, 1, 'fail-open keeps G4 when no G1/G2 exists');
  // floor=4 is a no-op (returns the same object reference).
  assert.equal(ST.capGradePoolsByGradeFloor(T, 4), T);
});

test('integration: a city-6 Gym Leader fields no weak (G3/G4) filler — all G1/G2', () => {
  // GL6 row weights are g3:100; the floor + ceiling clamp must still produce an all-G2
  // team (filler floored to G2, the leader's sig ceiling clamped to G2 so its ace is
  // G2, never weaker than its own filler).
  const leader = { type: 'Water', sigs: ['Gyarados', 'Lapras'] };
  let mons = 0;
  for (let i = 0; i < 24; i++) {
    const team = ST.rollTrainerTeam(leader, 6, { g1: 0, g2: 0, g3: 100, g4: 0 }, GENS, 'Gym Leader 6', 38);
    for (const s of team) {
      const g = grade(s.name);
      assert.ok(g <= 2, `GL6 fielded a weak mon ${s.name} (G${g}) — floor breach`);
      mons++;
    }
  }
  assert.ok(mons >= 100, 'sanity: rolled a full set of mons');
});

test('integration: a city-7 non-boss gym trainer evolves baby sigs up — no G4', () => {
  // Bug-themed gym trainer whose authored sigs are all G4 babies. Non-boss → evolve-up
  // must lift them (Caterpie→Butterfree, Weedle→Beedrill) so no G4 reaches the field.
  const bugTrainer = { type: 'Bug', sigs: ['Caterpie', 'Weedle', 'Kakuna', 'Metapod'] };
  for (let i = 0; i < 24; i++) {
    const team = ST.rollTrainerTeam(bugTrainer, 6, { g1: 0, g2: 35, g3: 65, g4: 0 }, GENS, 'Gym Trainer 1', 44);
    for (const s of team) {
      assert.notEqual(grade(s.name), 4, `city-7 gym trainer fielded a G4 baby ${s.name}`);
    }
  }
});
