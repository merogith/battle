// Filter COMPOSITION across the two partial-render fast paths.
//
// Regression suite for the "filters are broken" bug: _txMoveGridFastUpdate keeps
// filtered-out cards in the DOM as [hidden] for cheap toggle-back, and the old
// search fast path (_txSearchFastUpdate) applied a search-only predicate — so
// typing (or clearing) the search box resurrected cards an active type/category
// chip had hidden, while the filter pill still showed active. Search on the moves
// picker now routes through the full-predicate grid fast path.
//
// Also locks the Stage/tier ACTIVE-FILTER PILLS (they're counted by
// _txActiveFilterCount, so they must render as removable pills — "Filters (1)"
// with no visible cause reads as a mysteriously short list) and the sort
// selector reappearing when a Stage filter bypasses ★ Recommended.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine, openTutorMon } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;
const doc = w.document;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const host = () => doc.getElementById('story-tutor-team');

const GARCHOMP_BUILD = {
  m: ['Earthquake', 'Dragon Claw', 'Stone Edge', 'Swords Dance'],
  n: 'Jolly', a: 'Rough Skin', i: 'Life Orb',
  evs: { hp: 0, atk: 252, def: 0, spa: 0, spd: 4, spe: 252 }, ivs: {},
};

async function prime(city) {
  ST.sm.active = true; ST.sm.runSeed = 1; ST.sm._strngState = null;
  ST.sm.settings = { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
  ST.sm.badges = Math.max(0, city - 1); ST.sm.gold = 99999; ST.sm.inventory = ST.sm.inventory || {};
  let idx = 0;
  for (let ei = 0; ei <= 140; ei++) { let c = -1; try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {} if (c === city) { idx = ei; break; } }
  ST.sm.eventIndex = idx;
  ST.sm.team = [{ name: 'Garchomp', build: { ...GARCHOMP_BUILD } }];
  await w.StoryMode.enterTutor('moves');
  await openTutorMon(doc);
  for (let i = 0; i < 30; i++) { await wait(40); if (doc.querySelector('.tx-grid')) break; }
}

const typeOf = (el) => (el.className.match(/type-([A-Z][a-z]+)/) || [])[1];
const visCards = () => [...host().querySelectorAll('.tx-card[data-card-kind="move"]:not([hidden])')];
const visTypes = () => [...new Set(visCards()
  .map((c) => c.querySelector('.tx-card-head .type-badge'))
  .filter(Boolean).map(typeOf).filter(Boolean))].sort();
const visNames = () => visCards().map((c) => c.getAttribute('data-card-value'));
// movesDB is IIFE-private — assert category filtering via damaging staples that
// exist in Garchomp's pool and MUST vanish under a Status-only filter.
const DAMAGING_STAPLES = ['Earthquake', 'Stone Edge', 'Dragon Claw', 'Fire Blast', 'Iron Head', 'Outrage'];

function setSearch(q) {
  const inp = host().querySelector('.tx-search-input[data-kind="moves"]');
  assert.ok(inp, 'search input exists');
  inp.value = q;
  inp.dispatchEvent(new w.Event('input', { bubbles: true }));
}

test('type chip (fast path) → search: search respects the active type filter', async () => {
  await prime(7);
  const tmb = host().querySelector('[data-typemenu-toggle]');
  if (tmb) { tmb.click(); await wait(160); }
  const chip = host().querySelector('.tx-typemenu-row .tx-chip--type[data-filter-value]');
  assert.ok(chip, 'a type chip exists');
  const tval = chip.getAttribute('data-filter-value');
  chip.click();
  await wait(220);
  assert.deepEqual(visTypes(), [tval], 'grid shows only the picked type after the chip');
  assert.ok(host().querySelectorAll('.tx-card[data-card-kind="move"][hidden]').length > 0,
    'precondition: the grid fast path keeps filtered-out cards hidden in the DOM');

  setSearch('a'); // matches many move names across types
  await wait(320); // covers the 140ms debounce fallback
  assert.deepEqual(visTypes(), [tval],
    `search must not resurrect off-type cards (was: all types leaked while the ${tval} pill stayed active)`);
});

test('type chip → search → CLEAR search: filter still applies (worst case of the old bug)', async () => {
  setSearch('');
  await wait(320);
  const pill = host().querySelector('.tx-active-filter[data-filter-kind="moveType"]');
  assert.ok(pill, 'type filter pill still active');
  const tval = pill.getAttribute('data-filter-value');
  assert.deepEqual(visTypes(), [tval], 'clearing the search must not unhide the whole grid');
  pill.click(); // remove the filter for the next test
  await wait(220);
  assert.ok(visTypes().length > 1, 'removing the pill restores all types');
});

test('Status quick chip → search: only Status moves stay visible', async () => {
  const chip = host().querySelector('.tx-chip--quick[data-filter-kind="quick"][data-filter-value="status"]');
  assert.ok(chip, 'status quick chip exists');
  chip.click();
  await wait(220);
  assert.ok(visCards().length > 0, 'Status filter leaves some cards visible');
  assert.ok(!visNames().some((n) => DAMAGING_STAPLES.includes(n)),
    'no damaging staples visible under the Status filter');
  setSearch('e'); // matches Earthquake, Stone Edge, … in the hidden set
  await wait(320);
  assert.ok(!visNames().some((n) => DAMAGING_STAPLES.includes(n)),
    'search must not surface Physical/Special cards under an active Status filter');
  setSearch('');
  await wait(320);
  const catPill = host().querySelector('.tx-active-filter[data-filter-kind="moveCat"]');
  if (catPill) { catPill.click(); await wait(220); }
});

test('Stage/tier filter renders a removable ACTIVE pill and re-enables the sort selector', async () => {
  const tierChip = host().querySelector('[data-filter-kind="tier"][data-tier-kind="moves"][data-filter-value="inner"]');
  assert.ok(tierChip, 'moves tier chip exists');
  assert.ok(!host().querySelector('.tx-sort-select[data-kind="moves"]'),
    'precondition: sort selector hidden in the default ★ Recommended view');
  tierChip.click();
  await wait(260);
  const pill = host().querySelector('.tx-active-filter[data-filter-kind="tier"][data-tier-kind="moves"][data-filter-value="inner"]');
  assert.ok(pill, 'active Stage filter surfaces as a removable pill (was: "Filters (1)" with no pill)');
  assert.ok(host().querySelector('.tx-sort-select[data-kind="moves"]'),
    'sort selector reappears while a Stage filter bypasses ★');
  pill.click();
  await wait(260);
  assert.ok(!host().querySelector('.tx-active-filter[data-filter-kind="tier"]'),
    'tapping the pill removes the Stage filter');
  assert.ok(!host().querySelector('.tx-sort-select[data-kind="moves"]'),
    'sort selector hides again once ★ curation resumes');
});

test('suggest panel hides while searching and returns when cleared (fast path parity)', async () => {
  const sug = host().querySelector('details.tx-suggest');
  if (!sug) return; // sparse pool in this fixture build → panel absent, nothing to assert
  assert.equal(sug.hidden, false, 'suggest panel visible with empty search');
  setSearch('claw');
  await wait(320);
  assert.equal(host().querySelector('details.tx-suggest').hidden, true, 'hidden while a query is active');
  setSearch('');
  await wait(320);
  assert.equal(host().querySelector('details.tx-suggest').hidden, false, 'restored when the box clears');
});
