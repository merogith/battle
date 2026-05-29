// Regression for two P2 a11y findings:
//  • openModal() un-hid the dialog but never moved focus into it — SR/keyboard users
//    stayed on the trigger behind the overlay. Now focuses the dialog container;
//    closeModal() still restores focus to the trigger.
//  • _renderNarrativeOverlay() (every story cold-open / choice scene) was a plain
//    fullscreen div: no role/aria-modal/label, no ESC, no focus. Now mirrors
//    _showStoryTutorialScene — labeled dialog, Continue focused, ESC dismisses
//    (but never skips a pending choice).
// Run: node --test tests/suites/a11y-modal-narrative-focus.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const d = w.document;
const ST = w.__storyTest;

test('openModal moves focus into the dialog; closeModal restores it to the trigger', () => {
  d.body.innerHTML =
    '<button id="trigger">open</button>' +
    '<div id="m-test" class="modal hidden" role="dialog" aria-modal="true" aria-label="Test sheet">' +
    '<button id="m-ok">OK</button></div>';
  const trigger = d.getElementById('trigger');
  const modal = d.getElementById('m-test');
  trigger.focus();
  assert.equal(d.activeElement, trigger, 'precondition: focus on the trigger');

  w.openModal('m-test');
  assert.ok(modal === d.activeElement || modal.contains(d.activeElement),
    'focus moved into the dialog');

  w.closeModal('m-test');
  assert.equal(d.activeElement, trigger, 'focus restored to the trigger on close');
});

test('narrative overlay is a labeled dialog, focuses Continue, and ESC dismisses it', () => {
  let done = false;
  const ov = ST.renderNarrativeOverlay({ lines: ['Hello, trainer.'], name: 'Professor Oak', onDone: () => { done = true; } });
  assert.equal(ov.getAttribute('role'), 'dialog', 'role=dialog');
  assert.equal(ov.getAttribute('aria-modal'), 'true', 'aria-modal');
  assert.match(ov.getAttribute('aria-label') || '', /Oak/, 'labeled by the speaker');

  const cont = ov.querySelector('button[data-narr-continue="1"]');
  assert.equal(d.activeElement, cont, 'Continue button is focused for keyboard advance');

  ov.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(done, true, 'ESC fired onDone');
  assert.equal(d.body.contains(ov), false, 'overlay removed from the DOM');
});

test('narrative overlay with a pending choice does NOT dismiss on ESC', () => {
  let done = false;
  const ov = ST.renderNarrativeOverlay({
    lines: ['Choose:'], name: 'Oak',
    choices: [{ label: 'Left', reply: ['ok'] }, { label: 'Right', reply: ['ok'] }],
    onDone: () => { done = true; },
  });
  ov.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(done, false, 'ESC must not skip a pending choice');
  assert.equal(d.body.contains(ov), true, 'overlay stays until a choice is picked');
  ov.remove(); // cleanup
});
