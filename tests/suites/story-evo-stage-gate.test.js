// Verifies the story-mode evolution-stage gate: enemies, route wilds, and the
// player's Stone Sage are capped by the ARRIVED city's era —
//   C0-1 → basic only · C2-5 → + first evos · C6+ → all evolutions.
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

test('city eras bucket correctly (C0-1 basic, C2-5 first-evo, C6+ all)', () => {
  const c = cap => [...new Set(rowsByCap[cap].map(r => r.city))].sort((a, b) => a - b);
  assert.deepEqual(c(0), [0, 1]);
  assert.deepEqual(c(1), [2, 3, 4, 5]);
  assert.deepEqual(c(2), [6, 7, 8, 9]);
});

test('trainer teams never exceed their era cap', () => {
  // ISSUE-055: rollTrainerTeam's final arg is the row's stored ID (ev[0]),
  // NOT the STORY_EVENTS_RAW array index — the production caller destructures
  // `const [idx, type, event, ...] = ev` and forwards `idx` (= ev[0]). Pass
  // `RAW[arrayIdx][0]` to match what `enterBattleEvent` actually hands in.
  for (const cap of [0, 1, 2]) {
    const rows = rowsByCap[cap];
    for (const evt of ['Basic Trainer', 'Gym Leader 1', 'Gym Leader 6']) {
      const viol = [];
      for (let trial = 0; trial < 24; trial++) {
        const { idx } = rows[trial % rows.length];
        const rowId = RAW[idx][0];
        const team = ST.rollTrainerTeam({ name: 'Probe', type: 'Mixed', sigs: [] }, 6, { g1: 15, g2: 25, g3: 30, g4: 30 }, GENS, evt, rowId);
        for (const m of team) if (evoStage(m.name) > cap) viol.push(`row${rowId} ${m.name}(s${evoStage(m.name)})`);
      }
      assert.equal(viol.length, 0, `cap${cap} [${evt}] leaked: ${[...new Set(viol)].slice(0, 6).join(', ')}`);
    }
  }
});

test('Rival counter-team respects the early basic cap', () => {
  setSm({ team: [{ name: 'Bulbasaur' }], badges: 0 });
  const row = rowsByCap[0][0].idx;
  const rowId = RAW[row][0];
  const viol = [];
  for (let t = 0; t < 24; t++) {
    const team = ST.rollTrainerTeam({ name: 'Rival', type: 'Mixed', sigs: [] }, 6, { g1: 15, g2: 25, g3: 30, g4: 30 }, GENS, 'Rival', rowId);
    for (const m of team) if (evoStage(m.name) > 0) viol.push(`${m.name}(s${evoStage(m.name)})`);
  }
  setSm();
  assert.equal(viol.length, 0, `rival leaked: ${[...new Set(viol)].slice(0, 6).join(', ')}`);
});

test('route wilds never exceed their era cap', () => {
  for (const cap of [0, 1]) {
    const row = rowsByCap[cap][Math.floor(rowsByCap[cap].length / 2)];
    setSm({ eventIndex: row.idx, badges: cap === 0 ? 0 : 3 });
    const viol = [];
    for (let i = 0; i < 300; i++) {
      const enc = ST.rollWildEncounter(GENS);
      if (enc && evoStage(enc.name) > cap) viol.push(`${enc.name}(s${evoStage(enc.name)})`);
    }
    assert.equal(viol.length, 0, `wild cap${cap} leaked: ${[...new Set(viol)].slice(0, 6).join(', ')}`);
  }
  setSm();
});

test('player Stone Sage: first-evos from City 1, finals from City 4 (3-layer)', () => {
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
  expect('Bulbasaur', 'Ivysaur', 1, true, false);   // Stage-1 (first-evo) allowed from the first gym city (Layer 1)
  expect('Bulbasaur', 'Ivysaur', 3, true, false);
  expect('Ivysaur', 'Venusaur', 3, false, true);    // Stage-2 (final) stage-locked through C3
  expect('Ivysaur', 'Venusaur', 4, true, false);    // unlocks at C4 (Stage-2 layer)
  // Grade floor drops at C4 too: a one-step G2 final (Magikarp->Gyarados) is
  // grade-blocked through C3, then allowed from C4.
  expect('Magikarp', 'Gyarados', 3, false, true);   // grade-locked at C3
  expect('Magikarp', 'Gyarados', 4, true, false);   // allowed at C4
  setSm();
});
