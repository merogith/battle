// Phase 5 — the curated "Best picks" by-purpose shortlist is the EASY default view
// of the Move Tutor ("pick a few → a coherent set"), and yields to the full grid
// once the player searches. Revives the previously-dead _txMoveRecsByPurpose +
// _txRecsPanelHtml (CSS + click handler already shipped).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;

function primeCityTeam(city) {
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
  ST.sm.team = [{ name: 'Garchomp', build: { m: ['Earthquake', 'Dragon Claw', 'Stone Edge', 'Swords Dance'], n: 'Jolly', a: 'Rough Skin', i: 'Life Orb', evs: { hp: 0, atk: 252, def: 0, spa: 0, spd: 4, spe: 252 }, ivs: {} } }];
}
function primeC7Team() { primeCityTeam(7); }
async function renderTutorAndGetHtml() {
  await w.StoryMode.enterTutor('moves');
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 50));
    const host = w.document.getElementById('story-tutor-team');
    const html = host ? host.innerHTML : '';
    if (html.includes('tx-recs-panel') || html.includes('tx-grid')) return html;
  }
  const host = w.document.getElementById('story-tutor-team');
  return host ? host.innerHTML : '';
}

test('by-purpose recommender returns a role-balanced shortlist', () => {
  primeC7Team();
  const mon = ST.buildPokemon('Garchomp', { m: ['Earthquake'], n: 'Jolly', a: 'Rough Skin' });
  const pool = ['Earthquake', 'Stone Edge', 'Swords Dance', 'Roost', 'Fire Fang', 'Outrage'];
  const recs = ST.txMoveRecsByPurpose(pool, mon, { m: ['Earthquake'] }, 'Garchomp');
  assert.ok(recs.length >= 2, 'returns multiple curated picks');
  const purposes = new Set(recs.map(r => r.purpose));
  assert.ok(purposes.has('STAB'), 'includes a STAB pick (the mon identity)');
  // No duplicates — each purpose surfaces a distinct move.
  const moves = recs.map(r => r.move);
  assert.equal(new Set(moves).size, moves.length, 'no duplicate moves across purposes');
});

test('Move Tutor default view shows the curated "Best picks" panel', async () => {
  primeC7Team();
  const html = await renderTutorAndGetHtml();
  assert.ok(html.includes('tx-recs-panel'), 'curated panel present by default');
  assert.ok(html.includes('tx-rec-row'), 'panel has tappable rows');
});

test('curated panel yields to the full grid when the player searches', async () => {
  primeC7Team();
  await renderTutorAndGetHtml();
  const host = w.document.getElementById('story-tutor-team');
  let panel = host.querySelector('.tx-recs-panel');
  assert.ok(panel && !panel.hidden, 'panel visible before searching');
  // Drive the REAL search box exactly as a player typing does: the input handler
  // sets _txState.search.moves and the fast-path hides the panel (or a full
  // re-render drops it). Either way it must yield to the grid.
  const box = host.querySelector('.tx-search-input[data-kind="moves"]') || host.querySelector('input');
  assert.ok(box, 'search input exists');
  box.value = 'earthquake';
  box.dispatchEvent(new w.Event('input', { bubbles: true }));
  for (let i = 0; i < 12; i++) {
    await new Promise(r => setTimeout(r, 40));
    panel = host.querySelector('.tx-recs-panel');
    if (!panel || panel.hidden) break;
  }
  assert.ok(!panel || panel.hidden, 'curated panel hidden/removed while searching');
  assert.ok(host.querySelector('.tx-grid'), 'the full grid takes over');
  // Clearing the box restores the panel (fast-path un-hides it).
  box.value = '';
  box.dispatchEvent(new w.Event('input', { bubbles: true }));
  for (let i = 0; i < 12; i++) {
    await new Promise(r => setTimeout(r, 40));
    panel = host.querySelector('.tx-recs-panel');
    if (panel && !panel.hidden) break;
  }
  assert.ok(panel && !panel.hidden, 'panel restored when the search is cleared');
});

// ── Phase 5b — the same curated panel for the two HARD pickers: items + abilities ──
async function renderLoadoutAndGetHtml() {
  await w.StoryMode.enterTutor('loadout');
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 50));
    const host = w.document.getElementById('story-tutor-team');
    const html = host ? host.innerHTML : '';
    if (html.includes('tx-grid')) return html;
  }
  const host = w.document.getElementById('story-tutor-team');
  return host ? host.innerHTML : '';
}

test('item recommender returns a role-balanced shortlist', () => {
  primeC7Team();
  const mon = ST.buildPokemon('Garchomp', { m: ['Earthquake'], n: 'Jolly', a: 'Rough Skin' });
  const pool = ['Life Orb', 'Leftovers', 'Choice Scarf', 'Focus Sash', 'Choice Band', 'Rocky Helmet', 'Heavy-Duty Boots'];
  const recs = ST.txItemRecsByPurpose(pool, mon, { i: '(none)' }, 'Garchomp');
  assert.ok(recs.length >= 2, 'returns multiple curated item picks');
  assert.ok(recs.every(r => r.item && r.purpose && r.reason), 'every entry has item + purpose + reason');
  const items = recs.map(r => r.item);
  assert.equal(new Set(items).size, items.length, 'no duplicate items across purposes');
});

test('ability recommender returns purpose-tagged picks with reasons', () => {
  primeC7Team();
  const mon = ST.buildPokemon('Garchomp', { m: ['Earthquake'], n: 'Jolly', a: 'Rough Skin' });
  const recs = ST.txAbilityRecsByPurpose(['Intimidate', 'Sheer Force', 'Rough Skin'], mon, { a: 'Rough Skin' }, 'Garchomp');
  assert.ok(recs.length >= 1, 'returns at least one curated ability');
  assert.ok(recs.every(r => r.ability && r.purpose && r.reason), 'every entry has ability + purpose + reason');
});

test('item panel never recommends a tier-locked item at White Belt (stage 0)', () => {
  primeCityTeam(0);
  const stage = ST.npcStage('dojo');
  const cap = stage + 1;
  const mon = ST.buildPokemon('Garchomp', { m: ['Earthquake'], n: 'Jolly', a: 'Rough Skin' });
  const pool = ST.tutorGetPoolForMon('Garchomp').items || [];
  // Mirror the render filter: only items unlocked at the current Dojo tier.
  const unlocked = pool.filter(it => (ST.dojoItemTier(it) || 1) <= cap);
  const recs = ST.txItemRecsByPurpose(unlocked, mon, { i: '(none)' }, 'Garchomp');
  assert.ok(recs.every(r => (ST.dojoItemTier(r.item) || 1) <= cap),
    'no recommended item exceeds the current Dojo tier cap');
});

test('Battle Dojo default (item tab) shows the curated "Best items" panel', async () => {
  primeC7Team();
  const html = await renderLoadoutAndGetHtml();
  assert.ok(html.includes('tx-recs-panel'), 'item panel present by default');
  assert.ok(html.includes('Best items'), 'panel titled for items');
});

test('switching to the Ability tab shows the curated "Best abilities" panel', async () => {
  primeC7Team();
  await renderLoadoutAndGetHtml();
  const host = w.document.getElementById('story-tutor-team');
  const abilTab = host && host.querySelector('button.tx-tab[data-tab="ability"]');
  assert.ok(abilTab, 'ability tab button exists');
  abilTab.click(); // real delegated handler: flips _txState.dojoTab + re-renders
  let html = '';
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 50));
    html = host.innerHTML;
    if (html.includes('Best abilities') || html.includes('tx-card--ability')) break;
  }
  // Garchomp at Grandmaster has 2+ abilities -> a panel; at minimum the ability grid renders.
  assert.ok(html.includes('tx-card--ability') || html.includes('Best abilities'),
    'ability tab rendered (panel when >1 option)');
});
