// Step 4 — the moves grid uses a partial fast path on filter (type/quick) and sort
// toggles: it keyed-reconciles the card grid instead of rebuilding the whole editor.
// This is the SAFETY GUARDRAIL: for a sequence of real toggles, the fast-path result
// (visible cards + order + count + chip states + active pills) must be identical to a
// full render of the same state. Toggling the drawer twice preserves the Pokémon,
// the active filters and the sort while forcing a full render.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine, openTutorMon } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function primeTwoMon() {
  ST.sm.active = true; ST.sm.runSeed = 1; ST.sm._strngState = null;
  ST.sm.settings = { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
  ST.sm.badges = 6; ST.sm.gold = 99999; ST.sm.inventory = {};
  let idx = 0;
  for (let ei = 0; ei <= 120; ei++) { let c = -1; try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {} if (c === 7) { idx = ei; break; } }
  ST.sm.eventIndex = idx;
  ST.sm.team = [
    { name: 'Garchomp', build: { m: ['Earthquake', 'Dragon Claw', 'Stone Edge', 'Swords Dance'], n: 'Jolly', a: 'Rough Skin', i: 'Life Orb', evs: {}, ivs: {} } },
    { name: 'Rotom-Wash', build: { m: ['Hydro Pump', 'Volt Switch', 'Will-O-Wisp', 'Pain Split'], n: 'Modest', a: 'Levitate', i: 'Leftovers', evs: {}, ivs: {} } },
  ];
}
const host = () => w.document.getElementById('story-tutor-team');
const monNode = (i) => { const tg = host().querySelector(`.story-tutor-mon-toggle[data-team="${i}"]`); return tg ? tg.closest('.story-tutor-mon') : null; };
const openBody = () => monNode(0) && monNode(0).querySelector('.story-tutor-mon-body');
async function enterMovesAndSettle() {
  await w.StoryMode.enterTutor('moves');
  await openTutorMon(w, 0); // screen starts all-closed — open the first mon
  for (let i = 0; i < 25; i++) { await sleep(40); if (host() && host().innerHTML.includes('tx-grid')) break; }
}
async function forceFullRender() {
  for (let i = 0; i < 2; i++) {
    host().querySelector('[data-filters-toggle]').click();
    await sleep(40);
  }
}
function snap() {
  const body = openBody();
  return {
    cards: [...body.querySelectorAll('.tx-grid > .tx-card:not([hidden])')].map(c => c.dataset.cardValue),
    count: (body.querySelector('.tx-count-pill') || {}).textContent ? body.querySelector('.tx-count-pill').textContent.replace(/\s+/g, ' ').trim() : null,
    activeTypes: [...body.querySelectorAll('.tx-typemenu-row .tx-chip--type[data-active="1"]')].map(c => c.dataset.filterValue).sort(),
    quick: [...body.querySelectorAll('.tx-chip--quick')].map(c => `${c.dataset.filterValue}:${c.dataset.active}`).sort(),
    pills: [...body.querySelectorAll('.tx-active-filter[data-filter-kind]')].map(p => `${p.dataset.filterKind}:${p.dataset.filterValue}`).sort(),
  };
}
function assertEquiv(label) {
  const a = snap();
  return forceFullRender().then(() => {
    const b = snap();
    assert.deepEqual(a.cards, b.cards, `${label}: visible cards + order match a full render`);
    assert.equal(a.count, b.count, `${label}: count pill matches`);
    assert.deepEqual(a.activeTypes, b.activeTypes, `${label}: active type chips match`);
    assert.deepEqual(a.quick, b.quick, `${label}: quick chip states match`);
    assert.deepEqual(a.pills, b.pills, `${label}: active-filter pills match`);
  });
}

test('filter fast path (type + quick) is equivalent to a full render', async () => {
  primeTwoMon();
  await enterMovesAndSettle();
  host().querySelector('[data-typemenu-toggle]').click(); await sleep(160); // open Type menu (full render)
  const types = [...openBody().querySelectorAll('.tx-typemenu-row .tx-chip--type')].map(c => c.dataset.filterValue);

  // 1) apply a type (narrows) — must leave HIDDEN cards behind, proving the fast path ran
  openBody().querySelector(`.tx-typemenu-row .tx-chip--type[data-filter-value="${types[0]}"]`).click(); await sleep(160);
  assert.ok(openBody().querySelector('.tx-grid > .tx-card[hidden]'), 'fast path ran (removed cards are hidden, not rebuilt away)');
  await assertEquiv('apply type ' + types[0]);

  // 2) add a second type (widens via OR — exercises building newly-passing cards)
  openBody().querySelector(`.tx-typemenu-row .tx-chip--type[data-filter-value="${types[1]}"]`).click(); await sleep(160);
  await assertEquiv('add type ' + types[1]);

  // 3) remove the first type
  openBody().querySelector(`.tx-typemenu-row .tx-chip--type[data-filter-value="${types[0]}"]`).click(); await sleep(160);
  await assertEquiv('remove type ' + types[0]);

  // 4) quick chips
  openBody().querySelector('.tx-chip--quick[data-filter-value="status"]').click(); await sleep(160);
  await assertEquiv('quick status on');
  openBody().querySelector('.tx-chip--quick[data-filter-value="damage"]').click(); await sleep(160);
  await assertEquiv('quick damage');
});

test('sort fast path is equivalent to a full render', async () => {
  primeTwoMon();
  await enterMovesAndSettle();
  for (const v of ['power', 'name', 'recommended', 'usage']) {
    const sel = openBody().querySelector('.tx-sort-select[data-kind="moves"]');
    sel.value = v; sel.dispatchEvent(new w.Event('change', { bubbles: true }));
    await sleep(160);
    await assertEquiv('sort ' + v);
  }
});

test('search and clear leave cards in place when the catalog order is unchanged', async () => {
  primeTwoMon();
  await enterMovesAndSettle();
  const grid = openBody().querySelector('.tx-grid');
  const initial = [...grid.children];
  const observer = new w.MutationObserver(() => {});
  observer.observe(grid, { childList: true });
  try {
    const search = openBody().querySelector('.tx-search-input');
    search.value = 'Earthquake';
    search.dispatchEvent(new w.Event('input', { bubbles: true }));
    assert.deepEqual(snap().cards, ['Earthquake']);
    const clear = openBody().querySelector('[data-clear-filters="moves"]');
    clear.focus();
    let cardsAtFocus = null;
    search.addEventListener('focus', () => { cardsAtFocus = snap().cards; }, { once: true });
    clear.click();
    assert.deepEqual(cardsAtFocus, ['Earthquake']);
    assert.deepEqual([...grid.children], initial);
    assert.equal(grid.querySelectorAll('.tx-card[hidden]').length, 0);
    assert.deepEqual(observer.takeRecords(), []);
  } finally {
    observer.disconnect();
  }
});
