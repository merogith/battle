// Regression for the focus-trap findings (openModal partial + _showStoryTutorialScene):
// while a modal/overlay is open, Tab / Shift+Tab must stay within the topmost one and
// not escape to the page behind it. The shared handler is keyed off the topmost open
// `.modal:not(.hidden)` or a fullscreen overlay flagged data-focus-trap.
// Run: node --test tests/suites/a11y-focus-trap.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const d = w.document;
const tab = (shift) => d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Tab', shiftKey: !!shift, bubbles: true }));

test('Tab wraps within the topmost open modal', () => {
  d.body.insertAdjacentHTML('beforeend',
    '<div id="ft-modal" class="modal" role="dialog"><button id="ft-a">A</button><button id="ft-b">B</button></div>');
  const a = d.getElementById('ft-a');
  const b = d.getElementById('ft-b');
  b.focus();
  tab(false);
  assert.equal(d.activeElement, a, 'Tab from the last focusable wraps to the first');
  a.focus();
  tab(true);
  assert.equal(d.activeElement, b, 'Shift+Tab from the first wraps to the last');
  d.getElementById('ft-modal').remove();
});

test('Tab pulls focus back in if it has escaped the trap overlay', () => {
  d.body.insertAdjacentHTML('beforeend', '<button id="ft-outside">out</button>');
  d.body.insertAdjacentHTML('beforeend',
    '<div id="ft-ov" data-focus-trap="true"><button id="ft-c">C</button></div>');
  d.getElementById('ft-outside').focus();
  tab(false);
  assert.equal(d.activeElement, d.getElementById('ft-c'), 'focus pulled into the data-focus-trap overlay');
  d.getElementById('ft-ov').remove();
  d.getElementById('ft-outside').remove();
});

test('Tab is a no-op when nothing trap-able is open', () => {
  d.body.insertAdjacentHTML('beforeend', '<button id="ft-free">free</button>');
  d.getElementById('ft-free').focus();
  tab(false); // handler returns early; must not throw or steal focus
  assert.equal(d.activeElement, d.getElementById('ft-free'), 'focus unchanged with no open modal/overlay');
  d.getElementById('ft-free').remove();
});
