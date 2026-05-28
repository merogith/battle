// Verifies the story-mode evolution-stage gate: enemies, route wilds, and the
// player's Stone Sage are capped by the ARRIVED city's era. Per-source curves:
//   Player & enemy : C0-1 basic · C2-3 first-evo · C4+ all
//   Wild           : C0-4 basic · C5-6 first-evo · C7 all
//   Professor      : C0-2 basic · C3-5 first-evo · C6 all
// The cap is keyed on cityIndexFromEventIndex (a route battle reports its
// departing city, giving the route-into-a-city its old cap, the city's gym +
// route-out the new one). See battle.html _storyEvoStageOf / _capGradePoolsByEvoStage.
// Run: node --test tests/suites/story-evo-stage-gate.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;
const RT = W.__rivalTest;
const baseStats = RT.baseStats;
const GENS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// Independent evo-stage (cross-checks the engine's _storyEvoStageOf).
function evoStage(name) {
  const b = baseStats[name];
  if (!b || !b.prevo) return 0;
  const pb = baseStats[b.prevo];
  return (pb && pb.prevo) ? 2 : 1;
}

function setSm(extra = {}) {
  ST.sm = Object.assign({
    active: true, badges: 0, team: [],
    settings: { enabledGens: GENS.slice() },
    unlockedGimmicks: [], storyDifficulty: 'normal',
    eventIndex: 0, trainerAssignments: {},
  }, extra);
}
setSm();

const RAW = ST.STORY_EVENTS_RAW;
const N = RAW.length;
const rowsByCap = { 0: [], 1: [], 2: [] };
for (let idx = 0; idx < N; idx++) {
  const city = ST.cityIndexFromEventIndex(idx);
  rowsByCap[ST.storyEvoStageCapForCity(city)].push({ idx, city });
}

test('evo-stage helper classifies basic / first / final', () => {
  const cases = [['Bulbasaur', 0], ['Ivysaur', 1], ['Venusaur', 2],
                 ['Pidgey', 0], ['Pidgeotto', 1], ['Pidgeot', 2],
                 ['Tauros', 0], ['Dodrio', 1]];
  for (const [nm, exp] of cases) {
    assert.equal(ST.storyEvoStageOf(nm), exp, `engine stage of ${nm}`);
    assert.equal(evoStage(nm), exp, `independent stage of ${nm}`);
  }
});

test('city eras bucket correctly (enemy: C0-1 basic, C2-3 first-evo, C4+ all)', () => {
  const c = cap => [...new Set(rowsByCap[cap].map(r => r.city))].sort((a, b) => a - b);
  assert.deepEqual(c(0), [0, 1]);
  assert.deepEqual(c(1), [2, 3]);
  assert.deepEqual(c(2), [4, 5, 6, 7, 8, 9]);
});

test('trainer teams never exceed their era cap', () => {
  for (const cap of [0, 1, 2]) {
    const rows = rowsByCap[cap];
    for (const evt of ['Basic Trainer', 'Gym Leader 1', 'Gym Leader 6']) {
      const viol = [];
      for (let trial = 0; trial < 24; trial++) {
        const { idx } = rows[trial % rows.length];
        const team = ST.rollTrainerTeam({ name: 'Probe', type: 'Mixed', sigs: [] }, 6, { g1: 15, g2: 25, g3: 30, g4: 30 }, GENS, evt, idx);
        for (const m of team) if (evoStage(m.name) > cap) viol.push(`row${idx} ${m.name}(s${evoStage(m.name)})`);
      }
      assert.equal(viol.length, 0, `cap${cap} [${evt}] leaked: ${[...new Set(viol)].slice(0, 6).join(', ')}`);
    }
  }
});

test('Rival counter-team respects the early basic cap', () => {
  setSm({ team: [{ name: 'Bulbasaur' }], badges: 0 });
  const row = rowsByCap[0][0].idx;
  const viol = [];
  for (let t = 0; t < 24; t++) {
    const team = ST.rollTrainerTeam({ name: 'Rival', type: 'Mixed', sigs: [] }, 6, { g1: 15, g2: 25, g3: 30, g4: 30 }, GENS, 'Rival', row);
    for (const m of team) if (evoStage(m.name) > 0) viol.push(`${m.name}(s${evoStage(m.name)})`);
  }
  setSm();
  assert.equal(viol.length, 0, `rival leaked: ${[...new Set(viol)].slice(0, 6).join(', ')}`);
});

test('route wilds never exceed their wild-era cap (C0-4 basic, C5-6 first-evo, C7 all)', () => {
  const cityRowFor = c => { for (let i = 0; i < N; i++) if (ST.cityIndexFromEventIndex(i) === c) return i; return 0; };
  for (const city of [0, 2, 4, 5, 6, 7]) {
    const cap = ST.wildEvoStageCapForCity(city);
    setSm({ eventIndex: cityRowFor(city), badges: Math.min(8, city) });
    const viol = [];
    for (let i = 0; i < 300; i++) {
      const enc = ST.rollWildEncounter(GENS);
      if (enc && evoStage(enc.name) > cap) viol.push(`${enc.name}(s${evoStage(enc.name)})`);
    }
    assert.equal(viol.length, 0, `wild C${city} (cap${cap}) leaked: ${[...new Set(viol)].slice(0, 6).join(', ')}`);
  }
  setSm();
});

test('player Stone Sage: first-evos from City 2, finals from City 4 (3-layer)', () => {
  // Harness stubs @pkmn/dex to null; inject minimal chains (with prevo so
  // getMonGrade computes the stage-based grade for the grade-floor check).
  const dex = {
    Bulbasaur: { evos: ['Ivysaur'] },
    Ivysaur: { evos: ['Venusaur'], prevo: 'Bulbasaur' },
    Venusaur: { evos: [], prevo: 'Ivysaur' },
    Magikarp: { evos: ['Gyarados'] },
    Gyarados: { evos: [], prevo: 'Magikarp' },
  };
  W.pkmn.dex.Dex.species.get = (n) => (n in dex) ? { name: n, baseSpecies: n, ...dex[n] } : null;
  const cityRowFor = c => { for (let i = 0; i < N; i++) if (ST.cityIndexFromEventIndex(i) === c) return i; return 0; };
  const status = (mon, evo, city) => {
    setSm({ eventIndex: cityRowFor(city) });
    return (ST.getAllEvosWithStatus(mon, GENS) || []).find(e => e.name === evo);
  };
  const expect = (mon, evo, city, allowed, cityLocked) => {
    const e = status(mon, evo, city);
    assert.ok(e, `${mon}->${evo}@C${city} found`);
    assert.equal(e.allowed, allowed, `${mon}->${evo}@C${city} allowed`);
    assert.equal(!!e.cityLocked, cityLocked, `${mon}->${evo}@C${city} cityLocked`);
  };
  expect('Bulbasaur', 'Ivysaur', 1, false, true);   // C0-1 basic-only: first-evo still city-locked
  expect('Bulbasaur', 'Ivysaur', 2, true, false);   // Stage-1 (first-evo) unlocks at C2 (Stone Sage debut, Layer 1)
  expect('Bulbasaur', 'Ivysaur', 3, true, false);
  expect('Ivysaur', 'Venusaur', 3, false, true);    // Stage-2 (final) stage-locked through C3
  expect('Ivysaur', 'Venusaur', 4, true, false);    // unlocks at C4 (Stage-2 layer)
  // Grade floor drops at C4 too: a one-step G2 final (Magikarp->Gyarados) is
  // grade-blocked through C3, then allowed from C4.
  expect('Magikarp', 'Gyarados', 3, false, true);   // grade-locked at C3
  expect('Magikarp', 'Gyarados', 4, true, false);   // allowed at C4
  setSm();
});

test('signature override: too-evolved aces devolve to fit the cap (Venusaur -> Bulbasaur)', () => {
  // Cap 0 (C0-1): a final-stage signature collapses to its basic form.
  assert.equal(ST.devolveToStage('Venusaur', 0), 'Bulbasaur', 'Venusaur devolves to Bulbasaur at cap 0');
  assert.equal(ST.devolveToStage('Charizard', 0), 'Charmander', 'Charizard -> Charmander at cap 0');
  // Cap 1 (C2-3): collapse a final to its first-evo, basics stay put.
  assert.equal(ST.devolveToStage('Venusaur', 1), 'Ivysaur', 'Venusaur -> Ivysaur at cap 1');
  assert.equal(ST.devolveToStage('Bulbasaur', 0), 'Bulbasaur', 'a basic stays at cap 0');
  assert.equal(ST.devolveToStage('Ivysaur', 1), 'Ivysaur', 'a first-evo stays at cap 1');
  // Stage matches the engine's own classifier after devolve.
  assert.ok(evoStage(ST.devolveToStage('Venusaur', 0)) === 0, 'devolved form is stage 0 at cap 0');
});

test('parity: enemies get no Hidden ability before City 4 (Dojo Black Belt)', () => {
  const SER = ST.STORY_EVENTS_RAW;
  // First Battle row whose arrived city is 2 or 3 — there tiers reach T2 (where the
  // CSV would otherwise ship Hidden abilities) but the player has not unlocked Hidden,
  // so the parity gate must force basic abilities.
  let earlyRow = -1;
  for (let i = 0; i < SER.length; i++) {
    const r = SER[i];
    if (Array.isArray(r) && r[1] === 'Battle') { const c = ST.cityIndexFromEventIndex(i); if (c === 2 || c === 3) { earlyRow = i; break; } }
  }
  assert.ok(earlyRow >= 0, 'found an early (City 2-3) battle row');
  setSm({ eventIndex: earlyRow, badges: 2 }); // badges 2 → Elite Trainer rolls at tier T2
  const tr = { name: 'Probe', type: 'Mixed', sigs: [] };
  let checked = 0;
  for (let s = 0; s < 10; s++) {
    const team = ST.rollTrainerTeam(tr, 6, { g1: 0, g2: 30, g3: 50, g4: 20 }, GENS, 'Elite Trainer', earlyRow);
    for (const slot of team) {
      const bs = baseStats[slot.name];
      const H = bs && bs.abilities && bs.abilities.H;
      if (H && slot.build) { checked++; assert.notEqual(slot.build.a, H, `${slot.name} ran Hidden ${H} before City 4 (should be gated to slot 0)`); }
    }
  }
  assert.ok(checked > 0, 'exercised at least one species that has a Hidden ability');
});
