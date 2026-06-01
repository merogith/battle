// Move Tutor "Show all" reveals the FULL movepool with off-stage moves rendered
// locked (🔒 + the tutor tier that unlocks them), matching the Dojo's all-items
// roster. Locks are authoritative — a card is locked iff the move is NOT in the
// teachable acceptance set, so the Inner ≤75 BP cap and the Learnt/Awakened tiers
// are all reflected correctly. Locked cards are disabled (never selectable).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

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
  for (let i = 0; i < 30; i++) { await wait(50); if (doc.querySelector('.tx-grid')) break; }
}

const host = () => doc.getElementById('story-tutor-team');
const moveCards = () => [...host().querySelectorAll('.tx-card[data-card-kind="move"]')];
async function clickShowAll() {
  const chip = host().querySelector('[data-filter-kind="recOnly"][data-filter-value="moves"]');
  assert.ok(chip, '★ Recommended chip exists');
  chip.click();
  for (let i = 0; i < 25; i++) { await wait(40); if (moveCards().length > 0) break; }
  await wait(120);
}

test('Show all reveals more moves than the ★ recommended view', async () => {
  await openTutorInner();
  assert.equal(ST.npcStage('tutor'), 0, 'precondition: Inner Strength (most of the pool locked)');
  const recCount = moveCards().length;
  await clickShowAll();
  const allCount = moveCards().length;
  assert.ok(allCount > recCount, `Show all (${allCount}) reveals more than ★ recommended (${recCount})`);
});

test('off-stage moves are locked, disabled, and carry a 🔒 unlock-tier pill', async () => {
  await openTutorInner();
  await clickShowAll();
  const cards = moveCards();
  const locked = cards.filter((c) => c.getAttribute('data-locked') === '1');
  assert.ok(locked.length > 0, 'Show all surfaces locked off-stage moves at Inner');
  for (const c of locked) {
    assert.ok(c.hasAttribute('disabled'), `${c.getAttribute('data-card-value')} locked card is disabled (not selectable)`);
    const pill = c.querySelector('.tx-pill--locked');
    assert.ok(pill, 'locked card shows a 🔒 pill');
    assert.match(pill.textContent, /Expert|Guru/, 'pill names the unlock tier (Expert or Guru)');
  }
});

test('locks match the teachable acceptance set exactly (authoritative)', async () => {
  await openTutorInner();
  await clickShowAll();
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
