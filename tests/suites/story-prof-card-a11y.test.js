// Regression for ISSUE-003 (P1 a11y): the Professor "Choose This Pokémon" pick
// cards were click-only <div>s — no role, tabindex, or keydown — so keyboard /
// screen-reader users could never select a team mon (and the Accept button stayed
// disabled, making the required action unreachable). Fixed to mirror renderDraft:
// role="button" + tabIndex 0 + aria-label + Enter/Space activation.
// Run: node --test tests/suites/story-prof-card-a11y.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;

test('Professor pick card exposes button semantics + a label (ISSUE-003)', () => {
  const choice = { name: 'Bulbasaur', build: {}, g: 3 };
  ST.pendingProfChoices = [choice];
  const card = ST.buildProfPickCardElement(choice, 0);
  assert.equal(card.getAttribute('role'), 'button', 'role=button');
  assert.equal(card.tabIndex, 0, 'in the tab order');
  const label = card.getAttribute('aria-label') || '';
  assert.match(label, /Bulbasaur/, 'aria-label names the Pokémon');
  assert.match(label, /choose|select|team/i, 'aria-label states the action');
});

test('Enter on a focused Professor pick card selects it (ISSUE-003)', () => {
  const choice = { name: 'Charmander', build: {}, g: 3 };
  ST.pendingProfChoices = [choice];
  const card = ST.buildProfPickCardElement(choice, 0);
  // Dispatched on the card itself, so e.target === card (not an excluded inner control).
  card.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  assert.equal(ST.profSelectedIdx, 0, 'Enter selects the focused card');
});

test('Space also activates the card, and inner controls are excluded', () => {
  const choice = { name: 'Squirtle', build: {}, g: 3 };
  ST.pendingProfChoices = [choice];
  const card = ST.buildProfPickCardElement(choice, 0);
  card.dispatchEvent(new w.KeyboardEvent('keydown', { key: ' ', bubbles: true }));
  assert.equal(ST.profSelectedIdx, 0, 'Space selects the focused card');
});
