// ⚡ Auto-Build — selective (cherry-pick) apply.
//
// The Battle Mentor's Auto-Build lets the player opt OUT of individual
// components (item / ability / nature / EVs) and individual suggested moves
// (keyed by target slot) before applying. Locks:
//   • the quote drops the gold + any voucher for opted-out parts
//   • a per-move opt-out drops that move's gold and re-bases the Heart-Scale waive
//   • commit applies ONLY the included work; the excluded parts are untouched
//   • opting everything out yields an empty selection (commit is a no-op)
//
//   node --test tests/suites/story-mentor-selective-build.test.js
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
  w.StoryMode.enterMentor();
  for (let i = 0; i < 40; i++) { await wait(40); if (doc.querySelector('#story-mentor-team [data-fastbuild-open], #story-mentor-team .tx-fastbuild-bar--done')) break; }
}

test('quote: opting a part out removes its gold from the total', async () => {
  await prime(7, { m: ['Tackle'], n: 'Hardy', a: 'Rough Skin', evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 } }, 999999);
  const plan = ST.txBuildFastBuildPlan(0);
  const nature = plan.parts.find((p) => p.kind === 'nature');
  assert.ok(nature, 'nature part present at C7');
  const base = ST.txFastBuildQuote(plan, {});
  const off = ST.txFastBuildQuote(plan, { partOff: { nature: true } });
  assert.equal(off.gold, base.gold - (nature.cost | 0), 'nature gold dropped when opted out');
});

test('quote: an opted-out part does not consume its voucher', async () => {
  await prime(7, { m: ['Tackle'], n: 'Hardy', a: 'Rough Skin' }, 999999, { mint: 1 });
  const plan = ST.txBuildFastBuildPlan(0);
  if (!plan.parts.some((p) => p.kind === 'nature')) return;
  const q = ST.txFastBuildQuote(plan, { mint: true, partOff: { nature: true } });
  assert.equal(q.spend.mint, 0, 'no Mint spent on an opted-out nature');
});

test('quote: opting a move out drops its gold and re-bases the Heart-Scale waive', async () => {
  await prime(7, { m: ['Tackle'], n: 'Hardy', a: 'Rough Skin' }, 999999, { heartScale: 1 });
  const plan = ST.txBuildFastBuildPlan(0);
  assert.ok(plan.moveSteps.length >= 2, 'multiple move steps');
  // Opt out the single priciest move.
  const priciest = plan.moveSteps.slice().sort((a, b) => (b.cost | 0) - (a.cost | 0))[0];
  const base = ST.txFastBuildQuote(plan, {});
  const off = ST.txFastBuildQuote(plan, { moveOff: { [priciest.slot]: true } });
  assert.equal(off.gold, base.gold - (priciest.cost | 0), 'priciest move gold removed');
  // With that move gone, a Heart Scale now waives the *next* priciest.
  const remaining = plan.moveSteps.filter((s) => s.slot !== priciest.slot).map((s) => s.cost | 0).sort((a, b) => b - a);
  const withHs = ST.txFastBuildQuote(plan, { moveOff: { [priciest.slot]: true }, heartScale: 1 });
  assert.equal(withHs.gold, off.gold - (remaining[0] | 0), 'Heart Scale waives the next-priciest included move');
});

test('commit: applies only the included parts, leaves the rest untouched', async () => {
  await prime(7, { m: ['Tackle'], n: 'Hardy', a: 'Rough Skin', evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 } }, 999999);
  const plan = ST.txBuildFastBuildPlan(0);
  const hasNature = plan.parts.some((p) => p.kind === 'nature');
  const hasItem = plan.parts.some((p) => p.kind === 'item');
  assert.ok(hasNature && hasItem, 'both a nature and item change are on offer');
  // Keep everything EXCEPT nature.
  const sel = ST.txFastBuildSel(); sel.open = 0;
  sel.sel = { emblemHonor: false, abilityCapsule: false, mint: false, vitamin: false, heartScale: 0, partOff: { nature: true }, moveOff: {} };
  w.showGameConfirm = async () => true;
  await ST.tutorApplyFastBuild(0);
  const b = ST.sm.team[0].build;
  assert.equal(b.n, 'Hardy', 'nature was NOT changed (opted out)');
  assert.notEqual(b.i, undefined, 'item WAS applied');
  const item = plan.parts.find((p) => p.kind === 'item');
  if (item) assert.equal(b.i, item.to, 'item set to the recommended item');
});

test('commit: an all-off selection is a no-op (no gold spent)', async () => {
  await prime(7, { m: ['Tackle'], n: 'Hardy', a: 'Rough Skin', evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 } }, 999999);
  const plan = ST.txBuildFastBuildPlan(0);
  const partOff = {}; for (const p of plan.parts) partOff[p.kind] = true;
  const moveOff = {}; for (const s of plan.moveSteps) moveOff[s.slot] = true;
  const sel = ST.txFastBuildSel(); sel.open = 0;
  sel.sel = { emblemHonor: false, abilityCapsule: false, mint: false, vitamin: false, heartScale: 0, partOff, moveOff };
  const goldBefore = ST.sm.gold;
  let alerted = false; w.showGameAlert = () => { alerted = true; };
  w.showGameConfirm = async () => true;
  await ST.tutorApplyFastBuild(0);
  assert.equal(ST.sm.gold, goldBefore, 'no gold spent on an empty selection');
  assert.ok(alerted, 'the player is told to choose at least one change');
});
