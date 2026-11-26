// The Move Tutor opens the full catalog, including locked lessons. The optional
// Popular moves and Can learn now filters must use their advertised predicates.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine, openTutorMon } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;
const doc = w.document;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function openTutorInner() {
  ST.sm.active = true; ST.sm.runSeed = 1; ST.sm._strngState = null;
  ST.sm.settings = { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
  ST.sm.badges = 0; ST.sm.gold = 99999; ST.sm.inventory = ST.sm.inventory || {};
  let idx = 0;
  for (let ei = 0; ei <= 120; ei++) { let c = -1; try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {} if (c === 1) { idx = ei; break; } }
  ST.sm.eventIndex = idx;
  ST.sm.team = [{ name: 'Garchomp', build: { m: ['Dragon Claw'], n: 'Jolly', a: 'Rough Skin' } }];
  await w.StoryMode.enterTutor('moves');
  await openTutorMon(doc); // screen starts all-closed — open the first mon
  for (let i = 0; i < 30; i++) { await wait(50); if (doc.querySelector('.tx-grid')) break; }
}

const host = () => doc.getElementById('story-tutor-team');
const moveCards = () => [...host().querySelectorAll('.tx-card[data-card-kind="move"]:not([hidden])')];

test('the catalog starts complete, and Popular moves still filters while searching', async () => {
  await openTutorInner();
  const full = moveCards();
  const unpopular = full.find(card => !card.querySelector('.tx-card-pct'));
  assert.ok(unpopular, 'the full catalog contains lessons outside the competitive sample');
  const popular = () => host().querySelector('[data-filter-kind="recOnly"][data-filter-value="moves"]');
  assert.equal(popular().getAttribute('aria-pressed'), 'false');
  popular().click();
  assert.ok(moveCards().length < full.length);
  assert.ok(moveCards().every(card => card.querySelector('.tx-card-pct')));
  const search = host().querySelector('input[data-kind="moves"]');
  search.value = unpopular.dataset.cardValue;
  search.dispatchEvent(new w.Event('input', { bubbles: true }));
  assert.equal(moveCards().some(card => card.dataset.cardValue === unpopular.dataset.cardValue), false);
  popular().click();
  assert.ok(moveCards().some(card => card.dataset.cardValue === unpopular.dataset.cardValue));
});

test('off-stage moves are locked, disabled, and carry a 🔒 unlock-tier pill', async () => {
  await openTutorInner();
  const cards = moveCards();
  const locked = cards.filter((c) => c.getAttribute('data-locked') === '1');
  assert.ok(locked.length > 0, 'the catalog surfaces future lessons');
  for (const c of locked) {
    assert.ok(c.hasAttribute('disabled'), `${c.getAttribute('data-card-value')} locked card is disabled (not selectable)`);
    const pill = c.querySelector('.tx-pill--locked');
    assert.ok(pill, 'locked card shows a 🔒 pill');
    assert.match(pill.textContent, /Opens in .+/, 'pill names the town that unlocks the move');
  }
});

test('Can learn now excludes future lessons and known moves and exposes a removable active filter', async () => {
  await openTutorInner();
  host().querySelector('.tx-chip[data-filter-kind="learnableOnly"]').click();
  assert.ok(moveCards().length > 0);
  assert.ok(moveCards().every(card => card.dataset.locked !== '1'));
  assert.ok(moveCards().every(card => card.dataset.equipped !== '1'));
  const filter = host().querySelector('.tx-active-filter[data-filter-kind="learnableOnly"]');
  assert.ok(filter);
  filter.click();
  assert.ok(moveCards().some(card => card.dataset.locked === '1'));
});

test('locks match the teachable acceptance set exactly (authoritative)', async () => {
  await openTutorInner();
  // Warm gated pool (post-render the learnset cache is warm → returns the gated set).
  const gated = await ST.tutorGetStagedMovePool('Garchomp', ['Dragon Claw']);
  const teachable = new Set(gated.map((m) => String(m).split('/')[0]));
  teachable.add('Dragon Claw'); // equipped is always teachable
  for (const c of moveCards()) {
    const mv = c.getAttribute('data-card-value');
    const base = String(mv).split('/')[0];
    const locked = c.getAttribute('data-locked') === '1';
    const equipped = c.getAttribute('data-equipped') === '1';
    if (equipped) continue;
    // Locked iff NOT teachable.
    assert.equal(locked, !teachable.has(base), `${mv}: locked=${locked} but teachable=${teachable.has(base)}`);
  }
});
