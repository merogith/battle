import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

// Regression: the Move Tutor / Battle Dojo / EV-trainer purchase flow awaits
// window.showGameConfirm(), whose Promise is settled by window._gameConfirmResult().
// A generic dismissal path (the global a11y Escape handler, a screen transition)
// used to close modal-game-confirm via closeModal() WITHOUT settling the resolver.
// The awaiting purchase then hung forever: its `finally` never ran, so
// _storyInteractionBusy stayed true AND window._gameConfirmResolve stayed truthy —
// both of which make _storyTryBeginInteraction() refuse every later purchase. The
// player sees "Confirm sometimes does nothing" until a page reload.
//
// The fix settles the resolver as a cancel inside closeModal() (and reorders
// _gameConfirmResult so it can't double-resolve), so NO close path can strand it.

const flush = () => new Promise((r) => setTimeout(r, 5));

function dispatchEscape(window) {
  window.document.dispatchEvent(
    new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
  );
}

test('Escape on game-confirm resolves the awaiter (no stranded resolver)', async () => {
  const { window } = await loadEngine();
  if (typeof window.showGameConfirm !== 'function') return;
  const modal = window.document.getElementById('modal-game-confirm');
  assert.ok(modal, 'modal-game-confirm must exist');

  let resolved = 'PENDING';
  window.showGameConfirm('Teach Thunderbolt to Pikachu?').then((v) => { resolved = v; });
  assert.equal(modal.classList.contains('hidden'), false, 'modal should be open after showGameConfirm');
  assert.ok(window._gameConfirmResolve, 'resolver should be pending while open');

  dispatchEscape(window);
  await flush();

  assert.equal(resolved, false, 'Escape must settle the awaiter as a cancel, not leave it hanging');
  assert.equal(modal.classList.contains('hidden'), true, 'modal should be closed after Escape');
  assert.equal(window._gameConfirmResolve, null, 'resolver must not be stranded after Escape');
});

test('OK / Cancel buttons still resolve with the correct boolean', async () => {
  const { window } = await loadEngine();
  if (typeof window.showGameConfirm !== 'function') return;

  let okRes = 'PENDING';
  window.showGameConfirm('Confirm OK?').then((v) => { okRes = v; });
  window._gameConfirmResult(true);
  await flush();
  assert.equal(okRes, true, 'OK must resolve true');
  assert.equal(window._gameConfirmResolve, null, 'resolver cleared after OK');

  let cancelRes = 'PENDING';
  window.showGameConfirm('Confirm cancel?').then((v) => { cancelRes = v; });
  window._gameConfirmResult(false);
  await flush();
  assert.equal(cancelRes, false, 'Cancel must resolve false');
  assert.equal(window._gameConfirmResolve, null, 'resolver cleared after Cancel');
});

test('a confirm dismissed by Escape does not wedge later confirms (lock recovery)', async () => {
  const { window } = await loadEngine();
  if (typeof window.showGameConfirm !== 'function') return;
  const modal = window.document.getElementById('modal-game-confirm');

  // First purchase confirm — player hits Escape (the wedge trigger).
  let first = 'PENDING';
  window.showGameConfirm('First purchase?').then((v) => { first = v; });
  dispatchEscape(window);
  await flush();
  assert.equal(first, false);

  // A SECOND confirm must open and resolve normally. Before the fix the stranded
  // resolver persisted, which (via _storyTryBeginInteraction) blocked the next
  // purchase from ever reaching this modal.
  let second = 'PENDING';
  window.showGameConfirm('Second purchase?').then((v) => { second = v; });
  assert.equal(modal.classList.contains('hidden'), false, 'second confirm must be able to open');
  assert.ok(window._gameConfirmResolve, 'second confirm should have a fresh pending resolver');
  window._gameConfirmResult(true);
  await flush();
  assert.equal(second, true, 'second confirm must resolve normally after an Escape-dismissed first');
});
