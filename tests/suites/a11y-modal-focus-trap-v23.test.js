// Modal dialog a11y — focus-in-on-open + global Tab focus-trap.
// Closes ISSUE-144 (openModal saved/restored focus but never moved it INTO the
// dialog) and ISSUE-190 (no Tab focus-trap — keyboard focus could walk out the
// back of an open modal). The shared openModal/closeModal infra + a global Tab
// handler now mirror the existing global Escape handler.
//
// Run: node --test tests/suites/a11y-modal-focus-trap-v23.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const h = await loadEngine();
const { window } = h;
const { document } = window;

function closeAllModals() {
    // Closing a dialog also releases its focus snapshot and the inert backdrop.
    // Toggling CSS alone leaves that state registered for the following case.
    for (const modal of [...document.querySelectorAll('.modal:not(.hidden)[id]')].reverse()) {
        window.closeModal(modal.id, { restoreFocus: false });
    }
}
function pressTab(shift = false) {
    const e = new window.KeyboardEvent('keydown', { key: 'Tab', shiftKey: shift, bubbles: true, cancelable: true });
    document.dispatchEvent(e);
    return e;
}

test('openModal applies dialog semantics idempotently', () => {
    closeAllModals();
    const el = document.getElementById('modal-game-alert');
    el.removeAttribute('role');
    el.removeAttribute('aria-modal');
    window.openModal('modal-game-alert');
    assert.equal(el.getAttribute('role'), 'dialog');
    assert.equal(el.getAttribute('aria-modal'), 'true');
    closeAllModals();
});

test('_modalFocusablesIn lists tabbable controls and skips hidden subtrees', () => {
    closeAllModals();
    window.openModal('modal-game-confirm'); // helper is only meaningful on an open modal
    const el = document.getElementById('modal-game-confirm');
    const f = window._modalFocusablesIn(el);
    assert.ok(f.length >= 2, 'confirm dialog exposes Cancel + OK');
    f[0].classList.add('hidden');
    assert.ok(!window._modalFocusablesIn(el).includes(f[0]), 'a .hidden control is excluded');
    f[0].classList.remove('hidden');
    closeAllModals();
});

test('openModal moves focus INTO the dialog; closeModal restores it to the opener', () => {
    closeAllModals();
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    assert.equal(document.activeElement, opener, 'precondition: opener holds focus');

    window.openModal('modal-game-confirm');
    const first = window._modalFocusablesIn(document.getElementById('modal-game-confirm'))[0];
    assert.equal(document.activeElement, first, 'focus moved to the first control in the dialog');

    window.closeModal('modal-game-confirm');
    assert.equal(document.activeElement, opener, 'focus restored to the opener on close');
    opener.remove();
    closeAllModals();
});

test('Tab focus-trap wraps at both ends and reels escaped focus back in', () => {
    closeAllModals();
    window.openModal('modal-game-confirm');
    const el = document.getElementById('modal-game-confirm');
    const f = window._modalFocusablesIn(el);
    const first = f[0];
    const last = f[f.length - 1];

    last.focus();
    let e = pressTab(false);
    assert.equal(document.activeElement, first, 'Tab at the end wraps to the first control');
    assert.ok(e.defaultPrevented, 'the wrap is preventDefaulted');

    first.focus();
    pressTab(true);
    assert.equal(document.activeElement, last, 'Shift+Tab at the start wraps to the last control');

    const outsider = document.createElement('button');
    document.body.appendChild(outsider);
    outsider.focus();
    pressTab(false);
    assert.equal(document.activeElement, first, 'focus that escaped the dialog is pulled back in');
    outsider.remove();
    closeAllModals();
});

test('Tab trap is inert when no modal is open', () => {
    closeAllModals();
    const btn = document.createElement('button');
    document.body.appendChild(btn);
    btn.focus();
    const e = pressTab(false);
    assert.ok(!e.defaultPrevented, 'with no modal open the trap leaves Tab alone');
    btn.remove();
});
