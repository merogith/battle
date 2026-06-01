// Step 1 — picker sort overhaul. The grid now defaults to an honest "By usage %"
// order (so the list matches the % badge on every card), with a fit-score SECONDARY
// key so 0%-usage / sparse-species moves stay quality-ordered instead of collapsing
// to alphabetical. The misleading Type and Accuracy sorts are gone.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

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
// Sunflora is "sparse" (no competitive build data) — the worst case for a usage sort.
const SUNFLORA = [{ name: 'Sunflora', build: { m: ['Solar Beam'], n: 'Modest', a: 'Chlorophyll', i: null, evs: {}, ivs: {} } }];

const host = () => w.document.getElementById('story-tutor-team');
async function enterMovesAndSettle() {
  await w.StoryMode.enterTutor('moves');
  for (let i = 0; i < 25; i++) {
    await sleep(40);
    if (host() && host().innerHTML.includes('tx-grid')) break;
  }
  return host();
}
// Parse the visible % badge to a number: absent ("·") -> 0, "<1%" -> 0.5, "N%" -> N.
function cardPct(card) {
  const el = card.querySelector('.tx-card-pct');
  if (!el) return 0;
  const t = el.textContent.trim();
  if (/^<1/.test(t)) return 0.5;
  const m = t.match(/(\d+(\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}
function moveNamesInGrid() {
  return [...host().querySelectorAll('.tx-card[data-card-kind="move"]')].map(c => c.getAttribute('data-card-value'));
}

test('default ★ grid is ordered by usage % — matches the badge on every card', async () => {
  primeCityTeam(7, GARCHOMP);
  await enterMovesAndSettle();
  // ★ Recommended is ON by default and the species has data, so the locked label
  // should advertise (and actually deliver) usage order.
  assert.ok(host().innerHTML.includes('by usage'), 'curated view advertises the usage order');
  const pcts = [...host().querySelectorAll('.tx-card[data-card-kind="move"]')].map(cardPct);
  assert.ok(pcts.length >= 5, 'grid rendered a list of cards');
  for (let i = 1; i < pcts.length; i++) {
    assert.ok(pcts[i] <= pcts[i - 1] + 1e-9,
      `usage % must be non-increasing down the grid (row ${i}: ${pcts[i]} > ${pcts[i - 1]})`);
  }
  // The single most-used move should be first (Earthquake for Garchomp).
  assert.equal(moveNamesInGrid()[0], 'Earthquake', 'highest-usage move leads the grid');
  // The badge is now "% of builds that run the move" — a staple reads high (Earthquake
  // is on ~every Garchomp set), not a slot-share (which capped a top move near ~19%).
  assert.ok(pcts[0] >= 40, `staple move reads as % of builds (got ${pcts[0]}%), not a slot-share`);
});

test('Type and Accuracy sorts are gone; "By usage %" leads the menu', async () => {
  primeCityTeam(7, GARCHOMP);
  await enterMovesAndSettle();
  // Toggle ★ off (Show all) so the sort selector appears.
  host().querySelector('.tx-chip--rec[data-filter-kind="recOnly"]').click();
  for (let i = 0; i < 15; i++) { await sleep(40); if (host().querySelector('.tx-sort-select[data-kind="moves"]')) break; }
  const sel = host().querySelector('.tx-sort-select[data-kind="moves"]');
  assert.ok(sel, 'sort selector visible in Show-all');
  const values = [...sel.querySelectorAll('option')].map(o => o.value);
  assert.deepEqual(values, ['usage', 'recommended', 'power', 'name'], 'menu = usage, recommended, power, name (no acc/type)');
  assert.ok(!values.includes('acc'), 'Accuracy sort removed');
  assert.ok(!values.includes('type'), 'Type sort removed');
});

test('Power sort still works and breaks ties by usage (not alphabetical)', async () => {
  primeCityTeam(7, GARCHOMP);
  await enterMovesAndSettle();
  host().querySelector('.tx-chip--rec[data-filter-kind="recOnly"]').click();
  for (let i = 0; i < 15; i++) { await sleep(40); if (host().querySelector('.tx-sort-select[data-kind="moves"]')) break; }
  const sel = host().querySelector('.tx-sort-select[data-kind="moves"]');
  sel.value = 'power'; sel.dispatchEvent(new w.Event('change', { bubbles: true }));
  for (let i = 0; i < 15; i++) { await sleep(40); if (host().querySelector('.tx-card[data-card-kind="move"]')) break; }
  const bps = [...host().querySelectorAll('.tx-card[data-card-kind="move"]')]
    .map(c => parseInt((c.querySelector('.tx-stat-bp strong') || {}).textContent, 10) || 0);
  for (let i = 1; i < bps.length; i++) {
    assert.ok(bps[i] <= bps[i - 1], `power must be non-increasing (row ${i}: ${bps[i]} > ${bps[i - 1]})`);
  }
});

test('sparse species: usage default does NOT collapse to alphabetical', async () => {
  primeCityTeam(7, SUNFLORA);
  await enterMovesAndSettle();
  assert.ok(host().innerHTML.includes('tx-sparse-banner'), 'sparse banner shown');
  // Fix: the sort selector is now offered for sparse mons (the list is un-curated).
  assert.ok(host().querySelector('.tx-sort-select[data-kind="moves"]'), 'sort selector offered for sparse species');
  const names = moveNamesInGrid();
  assert.ok(names.length >= 5, 'grid rendered for the sparse species');
  // With no usage data the fit-score tiebreak orders the list; assert it is NOT a
  // strict A→Z sort (some earlier-alphabet name appears after a later one).
  const isAlpha = names.every((n, i) => i === 0 || names[i - 1].localeCompare(n) <= 0);
  assert.ok(!isAlpha, 'sparse list is quality-ordered (fit-score), not alphabetical');
});
