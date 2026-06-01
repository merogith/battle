// Move Tutor — stage-locked moves must be handled cleanly at the confirm bar.
//
// Below Guru (tutor stage 2) only moves in the staged acceptance pool are
// teachable; tutorChangeMove() rejects anything else. Previously the confirm bar
// checked only gold (canAfford), so if an off-stage move ever became pending —
// via the Suggest panel, a cold learnset cache, or the fetch-fail fail-safe that
// narrows the acceptance set while the grid still shows the full pool — the bar
// showed an enabled "Confirm" that then silently did nothing. Now the bar mirrors
// tutorChangeMove's acceptance check and shows a clear Locked state instead.
//
// This drives the REAL render + delegated click handlers. To reproduce the
// off-stage-pending state deterministically we clear the acceptance cache
// (txClearMoveAcceptance) — exactly the restrictive state the fetch-fail catch
// branch leaves behind — while the grid keeps showing its cards.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;
const doc = w.document;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function openTutorStage0() {
  ST.sm.active = true; ST.sm.runSeed = 1; ST.sm._strngState = null;
  ST.sm.settings = { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
  ST.sm.badges = 0; ST.sm.gold = 99999;
  ST.sm.inventory = ST.sm.inventory || {};
  let idx = 0;
  for (let ei = 0; ei <= 120; ei++) { let c = -1; try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {} if (c === 1) { idx = ei; break; } }
  ST.sm.eventIndex = idx;
  ST.sm.team = [{ name: 'Garchomp', build: { m: ['Dragon Claw'], n: 'Jolly', a: 'Rough Skin' } }];
  await w.StoryMode.enterTutor('moves');
  for (let i = 0; i < 25; i++) { await wait(50); if (doc.querySelector('.tx-grid')) break; }
}

const host = () => doc.getElementById('story-tutor-team');
const pickableCards = () => [...host().querySelectorAll('.tx-card[data-card-kind="move"]:not([data-equipped="1"]):not([disabled])')];
const enabledMoveConfirm = () => host().querySelector('.tx-confirm-bar-btn[data-action="move"]:not([disabled])');
const lockedBar = () => host().querySelector('.tx-confirm-bar--locked');

test('an in-stage move offers a real Confirm (no false lock)', async () => {
  await openTutorStage0();
  assert.ok(ST.npcStage('tutor') < 2, 'precondition: tutor below Guru so the gate is active');
  const card = pickableCards()[0];
  assert.ok(card, 'at least one teachable move card is shown');
  card.click();
  await wait(60);
  assert.ok(enabledMoveConfirm(), 'in-stage move shows an actionable Confirm');
  assert.ok(!lockedBar(), 'in-stage move is not shown as locked');
});

test('an off-stage move shows a clean Locked bar — never a dead Confirm', async () => {
  await openTutorStage0();
  // Restrict the acceptance set (mirrors the fetch-fail fail-safe) so the next
  // pick is treated as off-stage, while the grid keeps its cards.
  ST.txClearMoveAcceptance();
  const cards = pickableCards();
  (cards[1] || cards[0]).click();
  await wait(60);

  const bar = lockedBar();
  assert.ok(bar, 'off-stage pending move renders the locked confirm bar');
  assert.ok(!enabledMoveConfirm(), 'no actionable move-Confirm is offered for a locked move');
  const text = bar.querySelector('.tx-confirm-bar-text').textContent;
  assert.match(text, /lesson tier/i, 'explains the move is not in the tutor lesson tier yet');
  assert.match(text, /Expert|Guru/, 'names the tier that unlocks it');
  // A disabled "Locked" button stands in for Confirm.
  const lockedBtn = bar.querySelector('.tx-confirm-bar-btn[disabled]');
  assert.ok(lockedBtn && /lock/i.test(lockedBtn.textContent), 'shows a disabled Locked button');
});

test('the Locked bar Cancel button clears the selection so the player can recover', async () => {
  await openTutorStage0();
  ST.txClearMoveAcceptance();
  pickableCards()[0].click();
  await wait(60);
  const bar = lockedBar();
  assert.ok(bar, 'precondition: locked bar is showing');
  const cancel = bar.querySelector('.tx-confirm-bar-btn--secondary');
  assert.ok(cancel, 'locked bar has a Cancel control');
  cancel.click();
  await wait(60);
  // After cancel the bar returns to the empty "pick a move" placeholder.
  assert.ok(!lockedBar(), 'locked bar dismissed after Cancel');
  const placeholder = host().querySelector('.tx-confirm-bar .tx-confirm-bar-btn[disabled]');
  assert.ok(placeholder, 'confirm bar reset to its empty placeholder');
});
