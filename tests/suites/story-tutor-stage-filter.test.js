// Stage/tier filter — a multi-select chip strip on the Move Tutor and Battle Dojo
// pickers, so the player can browse what's available at each tutor/belt tier and
// combine several (T1+T2). An active Stage filter shows the FULL tier (bypasses ★).
// Also guards Eviolite's move to Tier 2.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;
const doc = w.document;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const host = () => doc.getElementById('story-tutor-team');

async function prime(city, monName, build, mode) {
  ST.sm.active = true; ST.sm.runSeed = 1; ST.sm._strngState = null;
  ST.sm.settings = { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
  ST.sm.badges = Math.max(0, city - 1); ST.sm.gold = 99999; ST.sm.inventory = ST.sm.inventory || {};
  let idx = 0;
  for (let ei = 0; ei <= 140; ei++) { let c = -1; try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {} if (c === city) { idx = ei; break; } }
  ST.sm.eventIndex = idx;
  ST.sm.team = [{ name: monName, build }];
  await w.StoryMode.enterTutor(mode);
  for (let i = 0; i < 30; i++) { await wait(40); if (doc.querySelector('.tx-grid')) break; }
}
async function clickTier(kind, val) {
  const c = host().querySelector(`[data-filter-kind="tier"][data-tier-kind="${kind}"][data-filter-value="${val}"]`);
  assert.ok(c, `tier chip ${kind}/${val} exists`);
  c.click();
  for (let i = 0; i < 20; i++) { await wait(40); if (doc.querySelector('.tx-grid')) break; }
  await wait(120);
}

test('Eviolite is Tier 2 (moved up from Tier 1)', () => {
  assert.equal(ST.dojoItemTier('Eviolite'), 2);
});

test('item Stage filter: T1 shows only tier-1 items; T1+T2 combines; All resets', async () => {
  await prime(8, 'Garchomp', { m: ['Earthquake'], n: 'Jolly', a: 'Rough Skin', i: 'Life Orb' }, 'loadout');
  assert.ok(host().querySelector('[data-filter-kind="tier"][data-tier-kind="items"]'), 'item tier chips render');
  const itemTiers = () => [...host().querySelectorAll('.tx-card[data-card-kind="item"]')]
    .map((c) => ({ name: c.getAttribute('data-card-value'), tier: ST.dojoItemTier(c.getAttribute('data-card-value')) }));

  await clickTier('items', '1');
  const t1 = itemTiers().filter((x) => x.name !== 'Life Orb'); // held item is exempt
  assert.ok(t1.length > 0, 'T1 reveals tier-1 items');
  assert.ok(t1.every((x) => x.tier === 1), 'only tier-1 items show under T1 (excl. the held item)');

  await clickTier('items', '2'); // multi-select T1 + T2
  const both = itemTiers().filter((x) => x.name !== 'Life Orb').map((x) => x.tier);
  assert.ok(both.every((t) => t === 1 || t === 2), 'T1+T2 shows tiers 1 and 2 only');
  assert.ok(both.includes(1) && both.includes(2), 'both tiers are present when combined');

  await clickTier('items', 'all');
  // "All" clears the tier filter → returns to the default ★ recommended view
  // (the tier browse bypasses ★, so this is intentionally a smaller curated set).
  const allChip = host().querySelector('[data-filter-kind="tier"][data-tier-kind="items"][data-filter-value="all"]');
  assert.equal(allChip.getAttribute('data-active'), '1', 'the All chip is active after clearing tiers');
  const t1chip = host().querySelector('[data-filter-kind="tier"][data-tier-kind="items"][data-filter-value="1"]');
  assert.equal(t1chip.getAttribute('data-active'), '0', 'the T1 chip is no longer active');
  assert.ok(itemTiers().length > 0, 'the grid is non-empty after All');
});

test('ability Stage filter: Legal hides off-legal abilities', async () => {
  await prime(8, 'Squirtle', { m: ['Water Gun'], n: 'Modest', a: 'Torrent' }, 'loadout');
  host().querySelector('button.tx-tab[data-tab="ability"]').click();
  for (let i = 0; i < 20; i++) { await wait(40); if (doc.querySelector('.tx-card--ability')) break; }
  assert.ok(host().querySelector('[data-filter-kind="tier"][data-tier-kind="abilities"]'), 'ability tier chips render');
  await clickTier('abilities', 'legal');
  const cards = [...host().querySelectorAll('.tx-card--ability')];
  assert.ok(cards.length >= 1, 'legal abilities remain');
  assert.equal(cards.filter((c) => c.querySelector('.tx-pill--awaken')).length, 0, 'no off-legal abilities under the Legal filter');
});

test('move Stage filter: Natural shows only natural-tag moves', async () => {
  await prime(6, 'Garchomp', { m: ['Dragon Claw'], n: 'Jolly', a: 'Rough Skin' }, 'moves');
  assert.ok(host().querySelector('[data-filter-kind="tier"][data-tier-kind="moves"]'), 'move tier chips render');
  await clickTier('moves', 'natural');
  const cards = [...host().querySelectorAll('.tx-card[data-card-kind="move"]')];
  assert.ok(cards.length > 0, 'Natural reveals natural moves (full tier, bypassing ★)');
  const leak = cards.filter((c) => {
    const mv = c.getAttribute('data-card-value');
    if (mv === 'Dragon Claw') return false; // equipped is exempt
    let tag = null; try { tag = ST.moveTagForSpecies('Garchomp', mv); } catch (e) {}
    return tag !== 'natural';
  });
  assert.equal(leak.length, 0, 'only natural-tag moves show under the Natural filter');
});
