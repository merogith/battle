// League boss "best team" rule (maintainer spec, 2026-06): E1-E4 / Champion
// field every signature at its MAX evolution stage, and authored sigs that
// collapse onto the same evolved form STACK (Lance E4's two Dragonair + listed
// Dragonite => up to 3 Dragonite, never a Dragonair). A curated per-species
// allowlist (LEAGUE_SIG_KEEP_VERBATIM) can opt a sig out and keep it verbatim.
//
// The private roll pipeline is reached through window.__storyTest, a harness-gated
// hook exposed only when window.__testHarness === true (set by load-engine.js).
// Run: node --test tests/suites/league-team-rolling.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const E = await loadEngine();
const { window } = E;
const ST = window.__storyTest;

function activeSeed(seed) {
  const sm = ST.sm;
  sm.active = true;
  sm.runSeed = seed >>> 0;
  sm._strngState = null;
  if (!sm.settings) sm.settings = {};
  return sm;
}

const lanceE4 = () => ST.getTrainerData().find((t) => t.name === 'Lance' && t.role === 'E4');
const E4_GW = { g1: 70, g2: 30, g3: 0, g4: 0 };  // STORY_EVENTS_RAW row 63 (E4)
const E4_ROW = 63;

test('evolveSigToMaxStage: walks a sig to its terminal, gen-legal form', () => {
  const gen1 = new Set([1]);
  const gen12 = new Set([1, 2]);
  // The headline case: the RBY E4 Lance list carries Dragonair, which must climb
  // to Dragonite (its terminal Gen-1 form).
  assert.equal(ST.evolveSigToMaxStage('Dragonair', gen1), 'Dragonite', 'Dragonair -> Dragonite');
  assert.equal(ST.evolveSigToMaxStage('Dratini', gen1), 'Dragonite', 'baby Dratini climbs all the way to Dragonite');
  // Already-terminal / no-evo finals pass through untouched.
  assert.equal(ST.evolveSigToMaxStage('Dragonite', gen1), 'Dragonite', 'terminal stays put');
  assert.equal(ST.evolveSigToMaxStage('Aerodactyl', gen1), 'Aerodactyl', 'no-evo final unchanged');
  assert.equal(ST.evolveSigToMaxStage('Gyarados', gen1), 'Gyarados', 'final stays put');
  // Gen-lock is honored: Onix can only become Steelix when Gen 2 is enabled.
  assert.equal(ST.evolveSigToMaxStage('Onix', gen1), 'Onix', 'no Gen-2 Steelix in a Gen-1-only run');
  assert.equal(ST.evolveSigToMaxStage('Onix', gen12), 'Steelix', 'Onix -> Steelix once Gen 2 is enabled');
});

test('E4 Lance fields max-evolved aces: up to 3 Dragonite, never a Dragonair', () => {
  const lance = lanceE4();
  assert.ok(lance, 'E4 Lance exists');
  assert.equal(lance.sigs.filter((n) => n === 'Dragonair').length, 2, 'data authors 2 Dragonair');
  assert.equal(lance.sigs.filter((n) => n === 'Dragonite').length, 1, 'data authors 1 Dragonite');
  let sawThree = false;
  let maxD = 0;
  for (let i = 0; i < 40; i++) {
    activeSeed(7000 + i);
    const team = ST.rollTrainerTeam(lance, 6, E4_GW, [1, 2], 'E4', E4_ROW);
    assert.equal(team.length, 6, 'E4 fields 6');
    const dair = team.filter((s) => s.name === 'Dragonair').length;
    const dite = team.filter((s) => s.name === 'Dragonite').length;
    assert.equal(dair, 0, `no un-evolved Dragonair should ever appear (got ${dair})`);
    assert.ok(dite <= 3, `never more than the collapsed 3 Dragonite (got ${dite})`);
    maxD = Math.max(maxD, dite);
    if (dite === 3) sawThree = true;
  }
  assert.ok(sawThree, 'the best roll fields all three Dragonite (2 evolved Dragonair + 1 authored)');
  assert.equal(maxD, 3, 'the collapsed-duplicate stack tops out at exactly 3');
});

test('E4 Lance fields a G1/G2-only team (every authored ace max-evolves into G1/G2; filler floored to G2)', () => {
  // Lance's max-evolved roster is all G1/G2 (Dragonite G1, Gyarados/Aerodactyl G2),
  // and league filler is floored to G2 at City 6+, so no member is ever G3/G4. (Note:
  // a G2 species may itself be a pre-evo, e.g. a grade-overridden Scyther — that still
  // satisfies the maintainer's "any number of G1 and G2s" filler rule.)
  const lance = lanceE4();
  for (let i = 0; i < 20; i++) {
    activeSeed(7500 + i);
    const team = ST.rollTrainerTeam(lance, 6, E4_GW, [1, 2], 'E4', E4_ROW);
    for (const s of team) {
      const g = window.getMonGrade(s.name, window.getBST(s.name));
      assert.ok(g <= 2, `${s.name} should be G1/G2 on E4 Lance (got grade ${g})`);
    }
  }
});

test('LEAGUE_SIG_KEEP_VERBATIM opts a species out of the max-evolve (curated exception)', () => {
  const lance = lanceE4();
  const keep = ST.leagueSigKeepVerbatim();
  assert.ok(keep && typeof keep.has === 'function', 'allowlist Set is exposed');
  assert.equal(keep.size, 0, 'ships empty (evolve everything by default)');
  keep.add('Dragonair');
  try {
    let sawDragonair = false;
    for (let i = 0; i < 40 && !sawDragonair; i++) {
      activeSeed(7000 + i);
      const team = ST.rollTrainerTeam(lance, 6, E4_GW, [1, 2], 'E4', E4_ROW);
      if (team.some((s) => s.name === 'Dragonair')) sawDragonair = true;
    }
    assert.ok(sawDragonair, 'with Dragonair allowlisted, it is kept verbatim and re-appears');
  } finally {
    keep.delete('Dragonair'); // restore shared state for other suites
  }
  assert.equal(ST.leagueSigKeepVerbatim().size, 0, 'allowlist restored to empty');
});

test('non-league trainers are unaffected by the league max-evolve', () => {
  // A Gym Leader must NOT route through the league max-evolve branch — it keeps the
  // existing grade-floor evolve-up path. Clair GL8 has distinct sigs (no verbatim
  // duplicate), so she must never field the same species twice (the pre-existing
  // dedup guard still holds with our _multBasis change gated to league bosses only).
  const clair = ST.getTrainerData().find((t) => t.name === 'Clair' && t.role === 'Gym Leader 8');
  assert.ok(clair, 'Clair GL8 exists');
  const GL8_GW = { g1: 0, g2: 100, g3: 0, g4: 0 };
  let worstDup = 0;
  for (let i = 0; i < 20; i++) {
    activeSeed(8000 + i);
    const team = ST.rollTrainerTeam(clair, 6, GL8_GW, [1, 2, 3, 4, 5, 6, 7, 8, 9], 'Gym Leader 8', 53);
    const counts = {};
    for (const s of team) counts[s.name] = (counts[s.name] || 0) + 1;
    worstDup = Math.max(worstDup, ...Object.values(counts));
  }
  assert.equal(worstDup, 1, `non-duplicate-sig leader never shows a species twice (got ${worstDup})`);
});
