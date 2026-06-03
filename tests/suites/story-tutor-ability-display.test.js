// Battle Dojo ability panel:
//   1) the ★ chip never HIDES an ability — a mon has only 2-3, so it just sorts
//      by usage %. Off-legal (Awakened) picks stay visible even with ★ on.
//   2) Awakened abilities read as off-legal/illegal (⛔ pill, red tier stripe) and
//      show NO usage % (their % comes from illegal-format builds and misleads).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine, openTutorMon } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;
const doc = w.document;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function openDojoAbilityTabAtGrandmaster() {
  ST.sm.active = true; ST.sm.runSeed = 1; ST.sm._strngState = null;
  ST.sm.settings = { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
  ST.sm.badges = 8; ST.sm.gold = 99999; ST.sm.inventory = ST.sm.inventory || {};
  let idx = 0;
  for (let ei = 0; ei <= 140; ei++) { let c = -1; try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {} if (c === 8) { idx = ei; break; } }
  ST.sm.eventIndex = idx;
  ST.sm.team = [{ name: 'Garchomp', build: { m: ['Earthquake'], n: 'Jolly', a: 'Rough Skin' } }];
  await w.StoryMode.enterTutor('loadout');
  await openTutorMon(doc); // screen starts all-closed — open the first mon
  for (let i = 0; i < 25; i++) { await wait(50); if (doc.querySelector('.tx-grid')) break; }
  const tabBtn = doc.querySelector('button.tx-tab[data-tab="ability"]');
  if (tabBtn) tabBtn.click();
  for (let i = 0; i < 25; i++) { await wait(50); if (doc.querySelector('.tx-card--ability')) break; }
}

const abilityCards = () => [...doc.querySelectorAll('.tx-card--ability')];

test('Grandmaster precondition: dojo stage 2, off-legal abilities unlocked', () => {
  // sanity only — populated by the async open in the next tests
  assert.ok(ST.npcStage, 'npcStage exposed');
});

test('the ★ chip does not hide off-legal abilities (sort-only)', async () => {
  await openDojoAbilityTabAtGrandmaster();
  assert.equal(ST.npcStage('dojo'), 2, 'precondition: Grandmaster (awakened unlocked)');
  const cards = abilityCards();
  assert.ok(cards.length >= 3, 'ability grid renders multiple cards');
  // With the ★ chip ON by default, an off-legal pick (data-tier="awaken") must
  // still be present — before the fix the ★ filter dropped it entirely.
  const awaken = cards.filter((c) => c.getAttribute('data-tier') === 'awaken');
  assert.ok(awaken.length >= 1, 'off-legal (awakened) abilities are shown, not filtered out');
});

test('off-legal ability cards show the ⛔ pill and no usage %', async () => {
  await openDojoAbilityTabAtGrandmaster();
  const awaken = abilityCards().filter((c) => c.getAttribute('data-tier') === 'awaken');
  assert.ok(awaken.length >= 1, 'precondition: at least one off-legal ability card');
  for (const card of awaken) {
    assert.equal(card.querySelector('.tx-card-pct'), null, 'no usage % on an off-legal ability');
    const pills = card.querySelector('.tx-card-foot').textContent;
    assert.match(pills, /off-legal/i, 'off-legal ability is labelled as such');
    assert.equal(card.querySelector('.tx-card-star'), null, 'off-legal ability is never starred as recommended');
  }
});

test('a legal ability still shows its usage % (regression guard)', async () => {
  await openDojoAbilityTabAtGrandmaster();
  const legal = abilityCards().filter((c) => c.getAttribute('data-tier') !== 'awaken');
  assert.ok(legal.length >= 1, 'at least one legal ability card');
  // At least the most-used legal ability should carry a % chip (data present for Garchomp).
  const anyPct = legal.some((c) => c.querySelector('.tx-card-pct'));
  assert.ok(anyPct, 'legal abilities still display usage %');
});
