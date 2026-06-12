// Verifies the trainer-pool restructure (Phase 3.5): the Elite Trainer pool
// includes gym leaders (who may recur), while gym-leader slots dedup so there's
// never a duplicate LEADER fight in a run.
// Run: node --test tests/suites/story-trainer-pools.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const E = eng.window.__rivalTest;
const GENS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const base = (n) => E.baseTrainerName(n);

function prime() {
  E.sm.active = false;
  E.sm.storyDifficulty = 'normal';
  if (!E.sm.settings) E.sm.settings = {};
  E.sm.settings.enabledGens = GENS.slice();
}
prime();

test('5c: a gym leader can fill an Elite Trainer slot', () => {
  let sawLeader = false;
  for (let s = 0; s < 100 && !sawLeader; s++) {
    eng.seedRng(20000 + s);
    const t = E.selectTrainerForRole('Elite Trainer', GENS, new Set());
    if (t && /^Gym Leader/i.test(String(t.role))) sawLeader = true;
  }
  assert.ok(sawLeader, 'gym leaders are part of the Elite Trainer pool');
});

test('5b: gym-leader slots dedup — a used leader never fills the next leader slot', () => {
  eng.seedRng(21000);
  const gl1 = E.selectTrainerForRole('Gym Leader 1', GENS, new Set());
  assert.ok(gl1 && /^Gym Leader/i.test(String(gl1.role)), 'GL1 returns a leader');
  const used = new Set([base(gl1.name)]);
  for (let s = 0; s < 80; s++) {
    eng.seedRng(21000 + s);
    const gl2 = E.selectTrainerForRole('Gym Leader 2', GENS, used);
    assert.notEqual(base(gl2.name), base(gl1.name), `duplicate leader fight at seed ${21000 + s}`);
  }
});

test('gen-agnostic: signature identities (Gym Leader / E4 / Champion) appear regardless of enabled gens', () => {
  // Brock (charGen 1), Cynthia (Champion, charGen 4) and Drasna (E4, charGen 6) must all be
  // candidates for their slot even in a Gen-2-ONLY run — the team-roll rules adapt their
  // roster; the identity never vanishes from the pool. (Pre-fix the charGen gate filtered
  // them out entirely.)
  const GEN2 = [2];
  const seen = (role, name, n = 300) => {
    for (let s = 0; s < n; s++) {
      eng.seedRng(40000 + s);
      const t = E.selectTrainerForRole(role, GEN2, new Set());
      if (t && t.name === name) return true;
    }
    return false;
  };
  assert.ok(seen('Gym Leader 1', 'Brock'), 'Brock (Gen 1) is a gym-leader candidate in a Gen-2-only run');
  assert.ok(seen('Champion', 'Cynthia'), 'Cynthia (Gen 4) is a champion candidate in a Gen-2-only run');
  assert.ok(seen('E4', 'Drasna'), 'Drasna (Gen 6) is an E4 candidate in a Gen-2-only run');
});

test('gen-agnostic: the principle extends to ALL named pools — the Elite-Trainer pool opts out too', () => {
  // Maintainer call (Q2): gen-agnostic appearance applies to every non-basic pool, not just the
  // three signature ones. A Gen-8+ named Elite Trainer must surface in a Gen-1-only run; only the
  // generated Basic/Gym fodder keeps a charGen check.
  const data = E.TRAINER_DATA;
  const offGen = data.find(t => t.role === 'Elite Trainer' && !t.isRival && t.charGen >= 8);
  assert.ok(offGen, 'there is a Gen-8+ named Elite Trainer to test with');
  const GEN1 = [1];
  let sawOffGen = false;
  for (let s = 0; s < 600 && !sawOffGen; s++) {
    eng.seedRng(41000 + s);
    const t = E.selectTrainerForRole('Elite Trainer', GEN1, new Set());
    if (t && t.name === offGen.name) sawOffGen = true;
  }
  assert.ok(sawOffGen, `Gen-${offGen.charGen} Elite Trainer ${offGen.name} is now a candidate in a Gen-1-only run`);
});

test('grade-appropriate fallback: a roster-less Champion backfills with G1/G2 all-stars, not fodder', () => {
  // Cynthia (Mixed) in a Gen-1-only run has every authored ace gen-locked, so she falls to the
  // synthetic pool. With grade-weighted backfill it should lean G1/G2 (her Champion tier), not
  // the old weak-first G3/G4. We roll her under a G1/G2-heavy weight set and check the mean grade.
  const cynthia = E.TRAINER_DATA.find(t => t.name === 'Cynthia' && t.role === 'Champion');
  const g = (n) => E.getMonGrade(n, E.getBST(n));
  E.sm.active = true;
  let strong = 0, total = 0;
  for (let s = 0; s < 12; s++) {
    E.sm.runSeed = (47000 + s) >>> 0; E.sm._strngState = null;
    const team = E.rollTrainerTeam(cynthia, 6, { g1: 55, g2: 45, g3: 0, g4: 0 }, [1], 'Champion', 60);
    for (const m of team) { total++; if (g(m.name) <= 2) strong++; }
  }
  E.sm.active = false;
  assert.ok(strong / total >= 0.7, `roster-less Champion leans G1/G2 (got ${(strong / total).toFixed(2)} at-or-above-G2)`);
});

test('gen-agnostic: an off-gen leader still fields a TYPE-COHERENT roster (rules adapt the team)', () => {
  // Brock in a Gen-2-only run: his Gen-1 aces fall back through their own line + the Rock-type
  // top-up, so he arrives as a Rock leader with an adapted roster — not an empty/blank team.
  const brock = E.TRAINER_DATA.find(t => t.name === 'Brock' && /^Gym Leader/.test(t.role));
  const hasRock = (name) => {
    const b = E.baseStats[name];
    return !!(b && (b.t1 === 'Rock' || b.t2 === 'Rock'));
  };
  E.sm.active = true; E.sm.runSeed = 0;
  let rockFrac = 0, rolls = 0;
  for (let s = 0; s < 12; s++) {
    E.sm.runSeed = (45000 + s) >>> 0; E.sm._strngState = null;
    const team = E.rollTrainerTeam(brock, 6, { g1: 0, g2: 60, g3: 40, g4: 0 }, [2], 'Gym Leader 4', 24);
    assert.equal(team.length, 6, 'off-gen leader still fields a full team');
    rockFrac += team.filter(m => hasRock(m.name)).length / 6;
    rolls++;
  }
  E.sm.active = false;
  assert.ok(rockFrac / rolls >= 0.4, `Brock-in-Gen2 roster leans Rock (got ${(rockFrac / rolls).toFixed(2)})`);
});

test('gen-respecting evolve-up: an off-gen leader never promotes a sig into a disabled gen', () => {
  // Brock at Gym 8 under floor pressure evolves Onix up to meet G2 — but in a Gen-1-only run
  // Steelix (Gen 2) is disabled, so Onix must STAY Onix; the climb only takes gen-legal forms.
  const brock = E.TRAINER_DATA.find(t => t.name === 'Brock' && /^Gym Leader/.test(t.role));
  const genOf = (n) => { const b = E.baseStats[n]; return b ? b.gen : 0; };
  E.sm.active = true;
  let sawSteelix = false, sawOnix = false, offGen = 0, total = 0;
  for (let s = 0; s < 20; s++) {
    E.sm.runSeed = (48000 + s) >>> 0; E.sm._strngState = null;
    const team = E.rollTrainerTeam(brock, 6, { g1: 0, g2: 100, g3: 0, g4: 0 }, [1], 'Gym Leader 8', 53);
    for (const m of team) { total++; if (genOf(m.name) !== 1) offGen++; if (m.name === 'Steelix') sawSteelix = true; if (m.name === 'Onix') sawOnix = true; }
  }
  E.sm.active = false;
  assert.equal(sawSteelix, false, 'Steelix (Gen 2) never leaks into a Gen-1-only run');
  assert.equal(offGen, 0, `every mon is Gen 1 in a Gen-1-only run (got ${offGen}/${total} off-gen)`);
  assert.ok(sawOnix, 'Brock keeps his Gen-1 Onix instead');
});

test('grade-profile cap: a Gym Trainer never fields a G1/legendary, even in a thin narrow-gen type pool', () => {
  // Regression for the Latias-on-Gym-2 bug: a Gym Trainer's grade profile forbids G1, but the
  // synthetic backfill used to "fill to 12" past G2/G3/G4 into G1 when the type pool was thin
  // (a narrow-gen Dragon gym), and the ceiling drop-guard let an un-devolvable G1 legendary
  // survive. The synthetic now refuses zero-weight grades, so G1 is unreachable for a Gym
  // Trainer at any city/gen.
  const g = (n) => E.getMonGrade(n, E.getBST(n));
  const isLeg = (n) => { const b = E.baseStats[n]; return !!(b && b.legendary); };
  const gymTr = (type, gens) => ({ role: 'Basic Trainer', name: 'GymHelper', type, sigs: [], pkmGens: gens });
  const ST = eng.window.__storyTest; // city-row resolver lives on __storyTest
  const cityRow = (c) => { for (let r = 0; r < 80; r++) if (ST.cityIndexForStoryRow(r) === c) return r; return -1; };
  E.sm.active = true;
  const cases = [
    { type: 'Dragon', gens: [3, 7], row: cityRow(2), ev: 'Gym Trainer 2' },
    { type: 'Dragon', gens: [3], row: cityRow(2), ev: 'Gym Trainer 1' },
    { type: 'Dragon', gens: [3, 7], row: cityRow(6), ev: 'Gym Trainer 2' },
    { type: 'Ice', gens: [1], row: cityRow(2), ev: 'Gym Trainer 2' },
  ];
  for (const c of cases) {
    assert.ok(c.row >= 0, `found a city row for ${c.type}`);
    let g1 = 0, legs = [];
    for (let s = 0; s < 60; s++) {
      E.sm.runSeed = s >>> 0; E.sm._strngState = null;
      const team = E.rollTrainerTeam(gymTr(c.type, c.gens), 5, undefined, c.gens, c.ev, c.row);
      for (const m of team) { if (g(m.name) === 1) g1++; if (isLeg(m.name)) legs.push(m.name); }
    }
    assert.equal(g1, 0, `${c.type}[${c.gens}] ${c.ev}: no G1 mon on a Gym Trainer (got ${g1})`);
    assert.equal(legs.length, 0, `${c.type}[${c.gens}] ${c.ev}: no legendary on a Gym Trainer (got ${legs.join(',')})`);
  }
  E.sm.active = false;
});

test('5c-recur: leaders spent as leaders still appear in the Elite Trainer pool', () => {
  // Spend several leaders (as if assigned to gym slots), then confirm the Elite pool
  // still surfaces one of those spent leaders — i.e. leader-dedup is bypassed there.
  const used = new Set();
  for (let s = 0; s < 8; s++) {
    eng.seedRng(22000 + s);
    const l = E.selectTrainerForRole('Gym Leader ' + ((s % 8) + 1), GENS, used);
    if (l) used.add(base(l.name));
  }
  assert.ok(used.size >= 3, 'spent at least a few distinct leaders');
  let sawSpentLeader = false;
  for (let s = 0; s < 200 && !sawSpentLeader; s++) {
    eng.seedRng(23000 + s);
    const t = E.selectTrainerForRole('Elite Trainer', GENS, used);
    if (t && /^Gym Leader/i.test(String(t.role)) && used.has(base(t.name))) sawSpentLeader = true;
  }
  assert.ok(sawSpentLeader, 'a spent leader still appears in the Elite pool (leader-dedup bypassed there)');
});
