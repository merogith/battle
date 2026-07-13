// Regression: the move-tutor type/category filter must stay authoritative even when a
// move's data isn't resolved in movesDB yet.
//
// Older moves (Cut, Metal Claw, Scratch, Earthquake, …) are NOT in data/moves.json — the
// real browser resolves them asynchronously via @pkmn/dex. _txApplyMoveFilters used to read
// the raw `movesDB[m]` and treat an unresolved entry as "passes" (`if (!md) return true`),
// so those moves slipped past the type/category chips. It bit hardest at late cities, where
// the BP cap is Infinity and _txMoveStageKey returns 'inner' via an early return WITHOUT
// calling ensureMoveData — so an active Stage filter never warmed the cache either. The user
// saw Physical moves (Metal Claw, Cut) listed under an active "Status" filter.
//
// The filter now resolves move data the SAME way the card render does
// (`movesDB[m] || ensureMoveData(m)`), so the grid always agrees with the category pill.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine, openTutorMon } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;
const doc = w.document;
const movesDB = eng.engine.movesDB;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const host = () => doc.getElementById('story-tutor-team');

const visCards = () => [...host().querySelectorAll('.tx-card[data-card-kind="move"]:not([hidden])')];
const visInfo = () => visCards().map((c) => {
  const name = c.getAttribute('data-card-value');
  const catPill = c.querySelector('[class*="tx-pill--cat-"]');
  return { name, cat: catPill ? catPill.textContent.trim() : '?' };
});

async function prime(city, team) {
  ST.sm.active = true; ST.sm.runSeed = 1; ST.sm._strngState = null;
  ST.sm.settings = { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
  ST.sm.badges = Math.max(0, city - 1); ST.sm.gold = 99999; ST.sm.inventory = ST.sm.inventory || {};
  let idx = 0;
  for (let ei = 0; ei <= 140; ei++) { let c = -1; try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {} if (c === city) { idx = ei; break; } }
  ST.sm.eventIndex = idx;
  ST.sm.team = team;
  await w.StoryMode.enterTutor('moves');
}

test('Status filter hides damaging moves even when their movesDB entry is unresolved (∞-cap city)', async () => {
  // City 5 → BP cap is Infinity, so _txMoveStageKey('inner') returns via its early exit
  // without calling ensureMoveData: the exact real-world condition for the leak.
  await prime(5, [
    { name: 'Diglett', build: { m: ['Scratch', 'Cut'], n: 'Jolly', a: 'Sand Veil' } },
  ]);
  await openTutorMon(doc, 0);
  for (let i = 0; i < 40; i++) { await wait(40); if (doc.querySelector('.tx-grid')) break; }

  // Inner-Strength Stage filter (bypasses ★ Recommended, so the full pool shows).
  host().querySelector('[data-filter-kind="tier"][data-tier-kind="moves"][data-filter-value="inner"]').click();
  await wait(250);

  const before = visInfo();
  const damaging = before.filter((v) => v.cat === 'Physical' || v.cat === 'Special').map((v) => v.name);
  assert.ok(damaging.length > 0, 'precondition: damaging moves visible under Stage=inner');

  // Simulate the real-browser async gap: unresolve some damaging moves in movesDB so the
  // filter predicate must fall back to ensureMoveData to learn their category.
  const wiped = damaging.slice(0, 6);
  for (const n of wiped) delete movesDB[n];

  // Apply the Status quick filter.
  host().querySelector('.tx-chip--quick[data-filter-value="status"]').click();
  await wait(300);

  const after = visInfo();
  // Every visible card must be Status now — no Physical/Special leakage.
  const nonStatus = after.filter((v) => v.cat !== 'Status');
  assert.deepEqual(nonStatus, [],
    `no non-Status card may remain under a Status filter (leaked: ${JSON.stringify(nonStatus)})`);
  // And specifically none of the unresolved damaging moves survived.
  const leaked = after.filter((v) => wiped.includes(v.name));
  assert.deepEqual(leaked, [],
    `unresolved damaging moves must not bypass the Status filter (leaked: ${JSON.stringify(leaked)})`);
});

test('Type filter hides off-type moves even when their movesDB entry is unresolved', async () => {
  await prime(5, [
    { name: 'Diglett', build: { m: ['Scratch', 'Cut'], n: 'Jolly', a: 'Sand Veil' } },
  ]);
  await openTutorMon(doc, 0);
  for (let i = 0; i < 40; i++) { await wait(40); if (doc.querySelector('.tx-grid')) break; }

  // Open the Type menu and pick Ground.
  const tmb = host().querySelector('[data-typemenu-toggle]');
  if (tmb) { tmb.click(); await wait(160); }
  const ground = host().querySelector('.tx-typemenu-row .tx-chip--type[data-filter-value="Ground"]');
  assert.ok(ground, 'Ground type chip exists in Diglett\'s pool');

  // Unresolve a couple of non-Ground moves before applying the type filter.
  for (const n of ['Cut', 'Scratch', 'Sucker Punch']) delete movesDB[n];

  ground.click();
  await wait(300);

  const typeOfCard = (c) => {
    const badge = c.querySelector('.tx-card-head .type-badge');
    return badge && (badge.className.match(/type-([A-Z][a-z]+)/) || [])[1];
  };
  const offType = visCards()
    .filter((c) => { const t = typeOfCard(c); return t && t !== 'Ground'; })
    .map((c) => c.getAttribute('data-card-value'));
  assert.deepEqual(offType, [],
    `no off-type card may remain under a Ground filter (leaked: ${JSON.stringify(offType)})`);
});
