// ⚡ Fast-Build (Auto-Build) — one-click best set (Feature 4).
//
// Composes the move / item / ability / nature / EV recommenders into a single
// all-or-nothing purchase. Locks:
//   • the planner diffs against the current build (only changes are charged)
//   • per-city gating (Nature/Dojo/EV components only when the facility is open;
//     EVs are focus-only before the EV Trainer unlocks)
//   • the voucher chooser discounts the gold total and is bounded by inventory
//   • commit applies everything, charges gold once, consumes vouchers, and the
//     re-plan then reports "already optimized"
//
//   node --test tests/suites/story-tutor-fast-build.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;
const doc = w.document;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function prime(city, build, gold, inventory) {
  ST.sm.active = true; ST.sm.runSeed = 1; ST.sm._strngState = null;
  ST.sm.settings = { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
  ST.sm.badges = Math.max(0, city - 1); ST.sm.gold = gold; ST.sm.inventory = inventory || {};
  let idx = 0;
  for (let ei = 0; ei <= 140; ei++) { let c = -1; try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {} if (c === city) { idx = ei; break; } }
  ST.sm.eventIndex = idx;
  ST.sm.facilityIntros = {}; ST.sm.facilitiesSeen = {}; ST.sm.scenesShown = {};
  ST.sm.team = [{ name: 'Garchomp', build }];
  // Auto-Build now lives on the dedicated Battle Mentor screen, not the Move Tutor.
  w.StoryMode.enterMentor();
  for (let i = 0; i < 40; i++) { await wait(40); if (doc.querySelector('#story-mentor-team [data-fastbuild-open], #story-mentor-team .tx-fastbuild-bar--done')) break; }
}

test('planner: a bare late-game mon gets moves + item + ability + nature + EV parts, total = sum', async () => {
  await prime(7, { m: ['Tackle'], n: 'Hardy', a: 'Rough Skin', evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 } }, 999999);
  const plan = ST.txBuildFastBuildPlan(0);
  assert.ok(plan, 'plan built');
  assert.ok(plan.moveSteps.length >= 2, 'move steps present');
  const kinds = new Set(plan.parts.map((p) => p.kind));
  assert.ok(kinds.has('nature'), 'nature part present (Nature Rater open at C7)');
  assert.ok(kinds.has('evs'), 'full EV spread part present (EV Trainer open at C7)');
  const sum = plan.moveTotal + plan.parts.reduce((s, p) => s + (p.cost | 0), 0);
  assert.equal(plan.total, sum, 'total equals moves + parts gold');
});

test('gating: before the EV Trainer opens, EVs are focus-only (free), not a full spread', async () => {
  await prime(2, { m: ['Tackle'], n: 'Hardy', a: 'Rough Skin' }, 999999);
  const plan = ST.txBuildFastBuildPlan(0);
  const ev = plan.parts.find((p) => p.kind === 'evs');
  const evf = plan.parts.find((p) => p.kind === 'evfocus');
  assert.ok(!ev, 'no full EV spread part pre-unlock');
  assert.ok(evf && (evf.cost | 0) === 0, 'EV focus part is free');
});

test('gating: before the Nature Rater opens (C0), nature is a locked info row, not a charge', async () => {
  await prime(0, { m: ['Tackle'], n: 'Hardy', a: 'Rough Skin' }, 999999);
  const plan = ST.txBuildFastBuildPlan(0);
  assert.ok(!plan.parts.some((p) => p.kind === 'nature'), 'no nature charge at C0');
  assert.ok(plan.locked.some((l) => l.kind === 'nature'), 'nature shown as locked');
});

test('voucher chooser: a Mint waives the nature cost; a Heart Scale drops the priciest move', async () => {
  await prime(7, { m: ['Tackle'], n: 'Hardy', a: 'Rough Skin' }, 999999, { mint: 1, heartScale: 1 });
  const plan = ST.txBuildFastBuildPlan(0);
  const base = ST.txFastBuildQuote(plan, {});
  const withMint = ST.txFastBuildQuote(plan, { mint: true });
  const naturePart = plan.parts.find((p) => p.kind === 'nature');
  if (naturePart) {
    assert.equal(withMint.gold, base.gold - naturePart.cost, 'Mint zeroes the nature gold');
    assert.equal(withMint.spend.mint, 1, 'one Mint spent');
  }
  const withHs = ST.txFastBuildQuote(plan, { heartScale: 1 });
  const priciest = Math.max(...plan.moveSteps.map((s) => s.cost | 0), 0);
  assert.equal(withHs.gold, base.gold - priciest, 'Heart Scale drops the priciest move');
  assert.equal(withHs.spend.heartScale, 1, 'one Heart Scale spent');
});

test('voucher chooser is bounded by inventory (asking for 3 Heart Scales with 1 owned spends 1)', async () => {
  await prime(7, { m: ['Tackle'], n: 'Hardy', a: 'Rough Skin' }, 999999, { heartScale: 1 });
  const plan = ST.txBuildFastBuildPlan(0);
  const q = ST.txFastBuildQuote(plan, { heartScale: 3 });
  assert.equal(q.spend.heartScale, 1, 'clamped to the 1 owned');
});

test('commit: applies everything, charges gold once, consumes the voucher, then reports optimized', async () => {
  await prime(7, { m: ['Tackle'], n: 'Hardy', a: 'Rough Skin', evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 } }, 999999, { mint: 1 });
  const plan = ST.txBuildFastBuildPlan(0);
  const goldBefore = ST.sm.gold;
  // select the Mint voucher for the nature part
  const sel = ST.txFastBuildSel(); sel.open = 0; sel.sel = { emblemHonor: false, abilityCapsule: false, mint: true, vitamin: false, heartScale: 0 };
  const quote = ST.txFastBuildQuote(plan, sel.sel);
  // auto-confirm the modal
  w.showGameConfirm = async () => true;
  await ST.tutorApplyFastBuild(0);
  const b = ST.sm.team[0].build;
  assert.ok(b.m.length >= 2 && !b.m.every((m) => m === 'Tackle'), 'moves updated');
  assert.notEqual(b.n, 'Hardy', 'nature updated');
  assert.equal(goldBefore - ST.sm.gold, quote.gold, 'charged exactly the quoted gold once');
  assert.ok(!ST.sm.inventory.mint, 'the Mint was consumed');
  // re-plan: nothing meaningful left to change
  const plan2 = ST.txBuildFastBuildPlan(0);
  const changes2 = plan2.moveSteps.length + plan2.parts.filter((p) => p.kind !== 'evfocus').length;
  assert.ok(changes2 === 0, `optimized after apply (got ${changes2} residual changes)`);
});
