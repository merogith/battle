// The Move Tutor groups its filters in one collapsed sheet. Type choices come
// from the Pokémon's own catalog and stay available during multi-selection.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine, openTutorMon } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function primeCityTeam(city, team) {
  ST.sm.active = true;
  ST.sm.runSeed = 1;
  ST.sm._strngState = null;
  ST.sm.settings = { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
  ST.sm.badges = Math.max(0, city - 1);
  ST.sm.gold = 99999;
  ST.sm.inventory = ST.sm.inventory || {};
  let idx = 0;
  for (let ei = 0; ei <= 120; ei++) { let c = -1; try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {} if (c === city) { idx = ei; break; } }
  ST.sm.eventIndex = idx;
  ST.sm.team = team;
}
const GARCHOMP = [{ name: 'Garchomp', build: { m: ['Earthquake', 'Dragon Claw', 'Stone Edge', 'Swords Dance'], n: 'Jolly', a: 'Rough Skin', i: 'Life Orb', evs: { hp: 0, atk: 252, def: 0, spa: 0, spd: 4, spe: 252 }, ivs: {} } }];

const host = () => w.document.getElementById('story-tutor-team');
async function enterMovesAndSettle() {
  await w.StoryMode.enterTutor('moves');
  await openTutorMon(w); // screen starts all-closed — open the first mon
  for (let i = 0; i < 25; i++) { await sleep(40); if (host() && host().innerHTML.includes('tx-grid')) break; }
  return host();
}
async function waitFor(sel, present = true, tries = 15) {
  for (let i = 0; i < tries; i++) { await sleep(40); if (!!host().querySelector(sel) === present) return; }
}
const typeOf = (el) => (el.className.match(/type-([A-Z][a-z]+)/) || [])[1];
// Only VISIBLE cards — the filter fast path keeps removed cards in the DOM as [hidden].
const gridTypes = () => [...new Set([...host().querySelectorAll('.tx-card[data-card-kind="move"]:not([hidden]) .tx-card-head .type-badge')].map(typeOf).filter(Boolean))].sort();

test('move bar: Type ▾ collapsed by default, no inline type chips, no category row', async () => {
  primeCityTeam(7, GARCHOMP);
  await enterMovesAndSettle();
  assert.ok(host().querySelector('[data-typemenu-toggle]'), 'Type ▾ toggle present');
  assert.ok(!host().querySelector('.tx-typemenu-row'), 'type menu is collapsed by default');
  assert.equal(host().querySelector('.tx-filter-sheet').hidden, true, 'advanced filters start collapsed');
  const categories = host().querySelector('[aria-label="Move category"]');
  assert.deepEqual([...categories.querySelectorAll('button')].map(button => button.textContent),
    ['Any category', 'Damage', 'Physical', 'Special', 'Status']);
});

test('opening Type ▾ reveals only the types present in the current view', async () => {
  primeCityTeam(7, GARCHOMP);
  await enterMovesAndSettle();
  host().querySelector('[data-typemenu-toggle]').click();
  await waitFor('.tx-typemenu-row', true);
  const menuTypes = [...host().querySelectorAll('.tx-typemenu-row .tx-chip--type')]
    .map(b => b.getAttribute('data-filter-value')).sort();
  assert.ok(menuTypes.length > 0 && menuTypes.length < 18,
    `menu lists a relevant subset, not all 18 (got ${menuTypes.length})`);
  assert.deepEqual(menuTypes, gridTypes(), 'menu offers exactly the types present in the grid');
});

test('picking a type filters the grid and keeps the menu open (multi-select)', async () => {
  primeCityTeam(7, GARCHOMP);
  await enterMovesAndSettle();
  host().querySelector('[data-typemenu-toggle]').click();
  await waitFor('.tx-typemenu-row', true);
  const chip = host().querySelector('.tx-typemenu-row .tx-chip--type');
  const tval = chip.getAttribute('data-filter-value');
  chip.click();
  await sleep(160);
  const shown = gridTypes();
  assert.deepEqual(shown, [tval], `grid filtered to ${tval} only`);
  assert.ok(host().querySelector('.tx-typemenu-row'), 'menu stays open after a pick (multi-select)');
  assert.ok(host().querySelector('.tx-active-filter[data-filter-kind="moveType"]'),
    'active-filter pill surfaces the type selection above the grid');
});
