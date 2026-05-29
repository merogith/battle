// Regression for the P3 dx finding: two near-duplicate global Escape keydown handlers
// (__pbsGlobalEscBound + _modalEscapeBound) both closed the topmost modal, double-firing
// on every Escape. Worse, the first listener lacked the game-confirm carve-out, so a
// source-topmost confirm could be closeModal'd WITHOUT resolving its Promise (hanging the
// awaiter). Consolidated into one listener: game-confirm → resolver, then data-no-escape
// opt-out, then close-topmost.
// Run: node --test tests/suites/modal-escape-dedup.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const d = w.document;
const esc = () => d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

test('Escape on game-confirm resolves its Promise (false), not just hides it', async () => {
  let resolved = 'pending';
  const p = w.showGameConfirm('Proceed?').then((v) => { resolved = v; });
  const gc = d.getElementById('modal-game-confirm');
  assert.equal(gc.classList.contains('hidden'), false, 'confirm is open');
  esc();
  await p;
  assert.equal(resolved, false, 'Escape resolved the confirm with false (Promise contract honored)');
  assert.equal(gc.classList.contains('hidden'), true, 'confirm closed');
});

test('Escape closes the topmost normal modal', () => {
  d.getElementById('modal-game-confirm').classList.add('hidden');
  d.body.insertAdjacentHTML('beforeend', '<div id="esc-normal" class="modal hidden" role="dialog"><button>x</button></div>');
  w.openModal('esc-normal');
  assert.equal(d.getElementById('esc-normal').classList.contains('hidden'), false, 'precondition: open');
  esc();
  assert.equal(d.getElementById('esc-normal').classList.contains('hidden'), true, 'normal modal closed by Escape');
  d.getElementById('esc-normal').remove();
});

test('Escape respects data-no-escape (modal stays open)', () => {
  d.getElementById('modal-game-confirm').classList.add('hidden');
  d.body.insertAdjacentHTML('beforeend',
    '<div id="esc-locked" class="modal hidden" role="dialog" data-no-escape="true"><button>x</button></div>');
  w.openModal('esc-locked');
  esc();
  assert.equal(d.getElementById('esc-locked').classList.contains('hidden'), false,
    'data-no-escape modal must NOT be closed by Escape');
  d.getElementById('esc-locked').remove();
});
