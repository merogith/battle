// Verifies the city-curve EV totals (story build sheets, Phase 1c):
// EVs are the battle-trained axis. Trainers get a per-city total band, shifted
// up by difficulty; wild/prof match the trainer curve at difficulty 0. The
// distributor reshapes a build's spread to hit the target total.
// Run: node --test tests/suites/story-build-curve-ev.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;
const GENS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];

function setSm(extra = {}) {
  ST.sm = Object.assign({
    active: true, badges: 0, team: [],
    settings: { enabledGens: GENS.slice() },
    unlockedGimmicks: [], storyDifficulty: 'normal',
    eventIndex: 0, trainerAssignments: {},
  }, extra);
}
setSm();

const TOTAL = [[0, 50], [50, 100], [100, 150], [150, 200], [200, 250], [300, 350], [350, 400], [508, 508]];
const sum = (evs) => KEYS.reduce((s, k) => s + (evs[k] | 0), 0);

test('city EV total lands within the band, for every city', () => {
  for (let c = 0; c < TOTAL.length; c++) {
    const [lo, hi] = TOTAL[c];
    for (let i = 0; i < 200; i++) {
      const t = ST.storyEvTotalForCity(c, 0);
      assert.ok(t >= lo && t <= hi, `C${c} total ${t} in [${lo},${hi}]`);
    }
  }
});

test('city EV total rises with city and with difficulty', () => {
  const mean = (c, d) => { let s = 0; for (let i = 0; i < 300; i++) s += ST.storyEvTotalForCity(c, d); return s / 300; };
  let prev = -1;
  for (let c = 0; c < TOTAL.length; c++) { const m = mean(c, 0); assert.ok(m >= prev - 0.5, `C${c} mean ${m.toFixed(0)} >= prev`); prev = m; }
  // Difficulty shifts the band up: a leader (diff 2) at C2 out-totals a basic at C2.
  assert.ok(mean(2, 2) > mean(2, 0), `leader@C2 ${mean(2, 2).toFixed(0)} > basic@C2 ${mean(2, 0).toFixed(0)}`);
});

test('distributor scales an existing spread down to the target, shape preserved', () => {
  const base = { hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 };
  const build = { evs: { hp: 0, atk: 252, def: 0, spa: 0, spd: 4, spe: 252 } }; // 508 sweeper
  ST.distributeEVsToTotal(build, base, 150);
  const total = sum(build.evs);
  assert.ok(Math.abs(total - 150) <= 12, `total ${total} ~ 150`);
  // Atk and Spe (the bulk of the source spread) stay the dominant stats.
  assert.ok(build.evs.atk > build.evs.hp && build.evs.spe > build.evs.def, 'shape preserved');
});

test('distributor invests an empty spread into the best two stats', () => {
  const base = { hp: 80, atk: 120, def: 70, spa: 40, spd: 70, spe: 110 }; // physical sweeper
  const build = { evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 } };
  ST.distributeEVsToTotal(build, base, 100);
  const total = sum(build.evs);
  assert.ok(Math.abs(total - 100) <= 8, `total ${total} ~ 100`);
  const nonzero = KEYS.filter(k => (build.evs[k] | 0) > 0);
  assert.ok(nonzero.length <= 2, `invested into <=2 stats: ${nonzero.join(',')}`);
});

test('distributor respects the 252-per-stat cap', () => {
  const base = { hp: 100, atk: 150, def: 80, spa: 60, spd: 80, spe: 130 };
  const build = { evs: { hp: 0, atk: 504, def: 0, spa: 0, spd: 0, spe: 4 } };
  ST.distributeEVsToTotal(build, base, 508);
  for (const k of KEYS) assert.ok((build.evs[k] | 0) <= 252, `${k}=${build.evs[k]} <= 252`);
});

test('end-to-end: trainer team EV totals track the city band', () => {
  const RAW = ST.STORY_EVENTS_RAW;
  const N = RAW.length;
  const cityRowFor = c => { for (let i = 0; i < N; i++) if (ST.cityIndexFromEventIndex(i) === c) return i; return 0; };
  // Basic Trainer (diff 0) at a few cities — totals should sit in the city band (± rounding).
  for (const c of [1, 3, 4]) {
    const row = cityRowFor(c);
    setSm({ eventIndex: row, badges: Math.min(8, c) });
    const [lo, hi] = TOTAL[c];
    let okCount = 0, trials = 12;
    for (let t = 0; t < trials; t++) {
      const team = ST.rollTrainerTeam({ name: 'Probe', type: 'Mixed', sigs: [] }, 6, { g1: 10, g2: 20, g3: 35, g4: 35 }, GENS, 'Basic Trainer', row);
      for (const m of team) {
        const tot = sum(m.build.evs || {});
        if (tot >= lo - 12 && tot <= hi + 12) okCount++;
      }
    }
    assert.ok(okCount > 0, `C${c} basic-trainer EV totals in band [${lo},${hi}] (got ${okCount} hits)`);
  }
  setSm();
});
