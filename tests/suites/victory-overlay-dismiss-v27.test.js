// Victory card dismissal contract (P0.1) — the card used to auto-close after
// 6s and dismiss on any click/key, which made rewards unreadable (the exact
// moment loot/EV lines render is the moment the player is still mashing from
// the battle's final exchange). New contract:
//   • no auto-close — the card waits for the player,
//   • background click does NOT dismiss,
//   • Continue / Enter / Esc dismiss, but only after a ~400ms input-arm
//     window (tests zero it via window.__victoryInputArmMs).
//   node --test tests/suites/victory-overlay-dismiss-v27.test.js
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadEngine } from '../helpers/load-engine.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

let W, ST;
before(async () => {
  ({ window: W } = await loadEngine());
  ST = W.__storyTest;
  assert.ok(ST && typeof ST.showVictoryOverlay === 'function', 'story test surface exposed');
});

function setSm() {
  ST.sm = {
    active: true, badges: 1, gold: 5000,
    team: [{ name: 'Pikachu', build: { m: ['Thunderbolt'], i: null, a: null, n: 'Hardy', evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 } } }],
    settings: { enabledGens: [1] }, unlockedGimmicks: [], storyDifficulty: 'normal',
    eventIndex: 0, trainerAssignments: {}, inventory: {}, facilityIntros: {}, facilitiesSeen: {},
    profUsed: {}, npcStageSeen: {}, gymCleared: {},
  };
}

function mountVictory(armMs) {
  setSm();
  W.__victoryInputArmMs = armMs;
  let cbCount = 0;
  ST.showVictoryOverlay('VICTORY!', 100, false, () => { cbCount++; }, 'Basic Trainer', 5, []);
  const ov = W.document.querySelector('div[role="dialog"][aria-label="VICTORY!"]');
  assert.ok(ov, 'victory overlay mounted');
  const cont = [...ov.querySelectorAll('button')].find(b => /Continue/.test(b.textContent || ''));
  assert.ok(cont, 'Continue button present');
  return { ov, cont, cbCount: () => cbCount };
}

// ── No auto-close — source-level guard ───────────────────────────────────────
test('the 6s auto-close timer is gone from the engine source', () => {
  const src = readFileSync(join(ROOT, 'battle.html'), 'utf8');
  assert.ok(!src.includes('autoClose'), 'no autoClose identifier remains');
  assert.match(src, /VICTORY_INPUT_ARM_MS = 400/, 'input-arm constant present');
});

// ── Click-anywhere removed; Continue still dismisses ─────────────────────────
test('background click no longer dismisses; Continue does (and fires cb once)', () => {
  const { ov, cont, cbCount } = mountVictory(0);

  ov.click(); // the old click-anywhere dismiss
  assert.ok(ov.isConnected, 'card survives a background click');
  assert.equal(cbCount(), 0, 'cb not fired by background click');

  cont.click();
  assert.ok(!ov.isConnected, 'Continue dismisses');
  assert.equal(cbCount(), 1, 'cb fired exactly once');

  cont.click(); // double-fire guard
  assert.equal(cbCount(), 1, 'cb still fired exactly once after a second click');
});

// ── Buffered-input guard ─────────────────────────────────────────────────────
test('input inside the arm window is ignored (buffered taps cannot blow the card away)', () => {
  const { ov, cont, cbCount } = mountVictory(60000);

  cont.click();
  assert.ok(ov.isConnected, 'Continue is inert while the arm window is open');

  W.document.dispatchEvent(new W.KeyboardEvent('keydown', { key: 'Escape' }));
  assert.ok(ov.isConnected, 'Escape is inert while the arm window is open');
  assert.equal(cbCount(), 0, 'cb never fired');

  ov.remove(); // cleanup for the next test
});

// ── Keyboard dismissal still works once armed ────────────────────────────────
test('Enter dismisses the card after the arm window', () => {
  const { ov, cbCount } = mountVictory(0);
  W.document.dispatchEvent(new W.KeyboardEvent('keydown', { key: 'Enter' }));
  assert.ok(!ov.isConnected, 'Enter dismisses once armed');
  assert.equal(cbCount(), 1, 'cb fired');
});
