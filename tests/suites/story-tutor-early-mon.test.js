// Fast-Build + recommendations work for EARLY / no-Smogon-data Pokemon at any stage.
//
// The recommendation system must not depend on rich Smogon build data: role comes from
// base stats, moves from the learnset, item from the type-booster pool, nature/EVs from
// the stat-driven archetype. This locks that a data-sparse early mon (Caterpie at City 1)
// still gets a complete, non-crashing Auto-Build — with EVs correctly focus-only until the
// late-game EV Trainer opens.
//
//   node --test tests/suites/story-tutor-early-mon.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine, openTutorMon } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;
const doc = w.document;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function prime(name, city, build) {
  ST.sm.active = true; ST.sm.runSeed = 1; ST.sm._strngState = null;
  ST.sm.settings = { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
  ST.sm.badges = Math.max(0, city - 1); ST.sm.gold = 999999; ST.sm.inventory = {};
  let idx = 0;
  for (let ei = 0; ei <= 140; ei++) { let c = -1; try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {} if (c === city) { idx = ei; break; } }
  ST.sm.eventIndex = idx;
  ST.sm.team = [{ name, build }];
  await w.StoryMode.enterTutor('moves');
  await openTutorMon(doc);
  for (let i = 0; i < 40; i++) { await wait(40); if (doc.querySelector('.tx-grid')) break; }
}

const EARLY = ['Caterpie', 'Weedle', 'Bidoof'].filter((n) => ST.baseStats && ST.baseStats[n]);

test('role + archetype resolve from base stats alone for a data-sparse early mon', () => {
  assert.ok(EARLY.length, 'have an early fixture');
  for (const n of EARLY) {
    const role = w._txMonRole(null, n);
    assert.ok(role && role.label, `${n} has a role label`);
    assert.equal(role.focusStats.length, 2, `${n} has 2 EV focus stats`);
    const ba = w._txBestArchetypeFor(n, null);
    assert.ok(ba && ba.nature, `${n} gets a recommended nature with no Smogon set`);
    assert.ok(ba.evShape, `${n} gets an EV shape`);
  }
});

test('Fast-Build produces a complete plan for Caterpie @ City 1 (moves from the learnset)', async () => {
  const nm = EARLY[0];
  await prime(nm, 1, { m: ['Tackle'], n: 'Hardy', a: (ST.baseStats[nm].abilities && ST.baseStats[nm].abilities['0']) || 'None' });
  const plan = ST.txBuildFastBuildPlan(0);
  assert.ok(plan, 'plan built (no crash on a sparse mon)');
  assert.ok(plan.moveSteps.length >= 1, 'move steps pulled from the learnset');
  assert.ok(!plan.moveSteps.every((s) => s.move === 'Tackle'), 'suggests real moves, not filler Tackle');
  assert.ok(plan.parts.some((p) => p.kind === 'nature'), 'nature part present (Nature Rater open at C1)');
});

test('EVs are focus-only before the EV Trainer opens, even at the very first city', async () => {
  const nm = EARLY[0];
  await prime(nm, 1, { m: ['Tackle'], n: 'Hardy', a: (ST.baseStats[nm].abilities && ST.baseStats[nm].abilities['0']) || 'None' });
  const plan = ST.txBuildFastBuildPlan(0);
  assert.ok(!plan.parts.some((p) => p.kind === 'evs'), 'no full EV spread charge pre-unlock');
  const evf = plan.parts.find((p) => p.kind === 'evfocus');
  assert.ok(evf && (evf.cost | 0) === 0, 'EV training focus is offered for free');
});
