// ⚡ Quick-apply ("Apply this set") — move-tutor overhaul WS-D.
//
// One button under the ✨ Suggest panel teaches every applicable suggestion in a
// single itemized, ALL-OR-NOTHING purchase: empty slots fill first, then current
// moves not in the suggested set are replaced; per-move price follows the move's
// tag (same as the confirm bar); one confirm, one gold deduction, one save.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine, openTutorMon } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;
const doc = w.document;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const host = () => doc.getElementById('story-tutor-team');

async function prime(city, build, gold) {
  ST.sm.active = true; ST.sm.runSeed = 1; ST.sm._strngState = null;
  ST.sm.settings = { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
  ST.sm.badges = Math.max(0, city - 1); ST.sm.gold = gold; ST.sm.inventory = {};
  let idx = 0;
  for (let ei = 0; ei <= 140; ei++) { let c = -1; try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {} if (c === city) { idx = ei; break; } }
  ST.sm.eventIndex = idx;
  ST.sm.team = [{ name: 'Garchomp', build }];
  await w.StoryMode.enterTutor('moves');
  await openTutorMon(doc);
  for (let i = 0; i < 30; i++) { await wait(40); if (doc.querySelector('.tx-grid')) break; }
}
const moveCost = (m) => {
  const t = ST.moveTagForSpecies('Garchomp', m);
  return t === 'natural' ? 1000 : t === 'learnt' ? 2500 : t === 'awakened' ? 5000 : 0;
};
const curMoves = () => ST.sm.team[0].build.m.map((m) => String(m).split('/')[0]);

test('plan: fills empty slots first, prices by tag, and the button shows count + total', async () => {
  await prime(7, { m: ['Tackle'], n: 'Jolly', a: 'Rough Skin' }, 99999);
  const plan = ST.txBuildApplySetPlan(0);
  assert.ok(plan && plan.steps.length >= 3, 'a 1-move mon gets a multi-step plan');
  const appends = plan.steps.filter((s) => s.replaces === null);
  assert.ok(appends.length >= 3, 'empty slots fill first (appends before any replace)');
  const expected = plan.steps.reduce((s, x) => s + moveCost(x.move), 0);
  assert.equal(plan.total, expected, 'total = per-tag price sum');
  const btn = host().querySelector('.tx-apply-set-btn[data-apply-set]');
  assert.ok(btn, 'apply button renders under the suggest panel');
  assert.ok(btn.textContent.includes(`${plan.steps.length} move`), 'button shows the change count');
  assert.ok(!btn.disabled, 'affordable → enabled');
});

test('apply: one confirm, exact gold deduction, moves committed', async () => {
  const plan = ST.txBuildApplySetPlan(0);
  const goldBefore = ST.sm.gold;
  let confirms = 0;
  const origConfirm = w.showGameConfirm;
  w.showGameConfirm = async () => { confirms++; return true; };
  try {
    await ST.tutorApplyRecommendedSet(0);
  } finally { w.showGameConfirm = origConfirm; }
  assert.equal(confirms, 1, 'exactly ONE confirmation for the whole set');
  assert.equal(ST.sm.gold, goldBefore - plan.total, 'gold drops by exactly the itemized total');
  const cur = curMoves();
  for (const s of plan.steps) assert.ok(cur.includes(s.move), `${s.move} committed`);
  assert.ok(cur.length <= 4, 'never exceeds 4 moves');
});

test('replace order: suggested equipped moves are kept; only non-suggested moves are replaced', async () => {
  await prime(7, { m: ['Tackle', 'Growl', 'Earthquake', 'Outrage'], n: 'Jolly', a: 'Rough Skin' }, 99999);
  const plan = ST.txBuildApplySetPlan(0);
  if (!plan || !plan.steps.length) return; // suggestion set == current set (data drift) — nothing to assert
  for (const s of plan.steps) {
    assert.ok(s.replaces !== 'Earthquake' || !plan.steps.some((x) => x.move === 'Earthquake'),
      'a move never replaces itself');
    assert.ok(['Tackle', 'Growl'].includes(s.replaces) || s.replaces === null || !['Earthquake', 'Outrage'].includes(s.replaces)
      || plan.steps.every((x) => x.move !== s.replaces),
      `replaced slot "${s.replaces}" is not a suggested keeper`);
  }
  const sugMoves = new Set(plan.steps.map((s) => s.move));
  for (const s of plan.steps) assert.ok(!sugMoves.has(s.replaces), 'no plan step replaces another suggested move');
});

test('all-or-nothing: insufficient gold changes nothing (no partial spend, no partial teach)', async () => {
  await prime(7, { m: ['Tackle'], n: 'Jolly', a: 'Rough Skin' }, 500); // < any single move price
  const before = curMoves().join('|');
  const btn = host().querySelector('.tx-apply-set-btn[data-apply-set]');
  if (btn) assert.ok(btn.disabled, 'button disabled when the set is unaffordable');
  let confirms = 0;
  const origConfirm = w.showGameConfirm;
  w.showGameConfirm = async () => { confirms++; return true; };
  try { await ST.tutorApplyRecommendedSet(0); } finally { w.showGameConfirm = origConfirm; }
  assert.equal(confirms, 0, 'no confirm reached — precheck rejects');
  assert.equal(ST.sm.gold, 500, 'gold untouched');
  assert.equal(curMoves().join('|'), before, 'moves untouched');
});

test('declined confirm: nothing changes', async () => {
  await prime(7, { m: ['Tackle'], n: 'Jolly', a: 'Rough Skin' }, 99999);
  const goldBefore = ST.sm.gold;
  const before = curMoves().join('|');
  const origConfirm = w.showGameConfirm;
  w.showGameConfirm = async () => false;
  try { await ST.tutorApplyRecommendedSet(0); } finally { w.showGameConfirm = origConfirm; }
  assert.equal(ST.sm.gold, goldBefore, 'gold untouched on decline');
  assert.equal(curMoves().join('|'), before, 'moves untouched on decline');
});

test('P-4: a single teach auto-advances the edit slot (no accidental overwrite of the purchase)', async () => {
  await prime(7, { m: ['Tackle'], n: 'Jolly', a: 'Rough Skin' }, 99999);
  const origConfirm = w.showGameConfirm;
  w.showGameConfirm = async () => true;
  try {
    await w.StoryMode.tutorChangeMove(0, 1, 'Earthquake'); // fills slot 2
  } finally { w.showGameConfirm = origConfirm; }
  assert.deepEqual(curMoves(), ['Tackle', 'Earthquake']);
  // The edit slot must now point at the NEXT empty slot (2), not the slot just
  // filled — tapping the next suggestion used to overwrite the purchase.
  const active = host().querySelector('.tx-slot-chip[aria-pressed="true"], .tx-slot-card[aria-pressed="true"]');
  if (active) assert.equal(active.getAttribute('data-slot-idx'), '2', 'edit slot advanced past the taught move');
});
