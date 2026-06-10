// Guard: simultaneous battle popups (CRITICAL! + Super Effective! on one hit, or rapid
// damage/heal numbers) must NOT render on top of each other. showBattlePopup used to pin
// every popup to one fixed coord per side; a crit+super-effective hit stacked both labels
// at identical top/left and they were unreadable. They now stagger 9% per concurrent popup
// (capped at 3 rows) and decrement as each clears. Purely visual — no state/RNG change.
// Run: node --test tests/suites/battle-popup-stagger.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadEngine } from '../helpers/load-engine.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = readFileSync(join(ROOT, 'battle.html'), 'utf8');

const eng = await loadEngine();
const W = eng.window;
const document = W.document;

assert.equal(typeof W.showBattlePopup, 'function', 'showBattlePopup is exposed under the harness');

// The function mounts into #screen-battle — ensure the container exists in the harness DOM.
if (!document.getElementById('screen-battle')) {
    const el = document.createElement('div');
    el.id = 'screen-battle';
    document.body.appendChild(el);
}
const container = document.getElementById('screen-battle');
const foeSide = () => Array.from(container.querySelectorAll('.battle-popup')).filter(p => p.style.left === '55%');

test('two simultaneous same-side popups do not overlap (different top, same left)', () => {
    const before = foeSide().length;
    W.showBattlePopup('CRITICAL!', 'popup-crit', false);
    W.showBattlePopup('Super Effective!', 'popup-super', false);
    const after = foeSide();
    assert.ok(after.length >= before + 2, 'both popups mounted');
    const a = after[after.length - 2], b = after[after.length - 1];
    assert.equal(a.style.left, b.style.left, 'same side → same horizontal anchor');
    assert.notEqual(a.style.top, b.style.top, 'staggered vertically — this is the overlap bug fix');
});

test('a third concurrent popup offsets further still', () => {
    const start = foeSide().length;
    W.showBattlePopup('Not very effective...', 'popup-nve', false);
    const after = foeSide();
    const tops = after.slice(-3).map(p => parseFloat(p.style.top));
    // strictly increasing top% across the three concurrent foe popups (9% steps)
    assert.ok(tops[0] < tops[1] && tops[1] < tops[2], `staggered tops increase: ${tops.join(' < ')}`);
    assert.ok(after.length >= start + 1, 'third popup mounted');
});

test('player-side popups anchor to the opposite column (15%, not 55%)', () => {
    W.showBattlePopup('CRITICAL!', 'popup-crit', true);
    const playerPopup = Array.from(container.querySelectorAll('.battle-popup'))
        .filter(p => p.style.left === '15%').pop();
    assert.ok(playerPopup, 'player-side popup mounted at left:15%');
});

test('the stagger is capped (does not run off-screen)', () => {
    // Fire several more; beyond the cap the offset must plateau, never grow unbounded.
    for (let i = 0; i < 6; i++) W.showBattlePopup('+1', 'popup-heal', false);
    const tops = foeSide().map(p => parseFloat(p.style.top));
    const maxTop = Math.max(...tops);
    // base 15% + cap(3) * 9% = 42% — assert nothing exceeds that ceiling.
    assert.ok(maxTop <= 15 + 3 * 9 + 0.001, `foe-side popup top capped at 42% (saw max ${maxTop}%)`);
});

test('source: popup render is gated by settings.animations', () => {
    const body = SRC.slice(SRC.indexOf('function showBattlePopup'), SRC.indexOf('function showBattlePopup') + 600);
    assert.match(body, /if \(!settings\.animations\) return;/, 'early-returns when animations are off');
    assert.match(body, /_activePopups\[side\]/, 'tracks concurrent popups per side');
});
