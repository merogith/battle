// Hidden Power tutor-card discoverability (2026-07). Once the Diviner unlocks it,
// the Move Tutor offers a single unified "Hidden Power" card. movesDB types the bare
// move Normal/BP60 (its IV-form default), which hides what the player actually gets:
// on teach it becomes THIS Pokémon's own fixed element. The card now shows that
// element and explains the mechanic, so the feature is legible instead of opaque.
//
// This locks: (1) the unified card renders the mon's own hpType as its type badge
// (not Normal) and BP 60; (2) the desc explains the "hidden element" mechanic;
// (3) on the one-time choose token the card says the player will pick the type.
// Purely presentational — the teach path is covered by hidden-power-mentor.test.js.
//
// Run: node --test tests/suites/hidden-power-tutor-card.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine, openTutorMon } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;
const HP = w.__hpTest;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const host = () => w.document.getElementById('story-tutor-team');
async function settle(needle, tries = 40) { for (let i = 0; i < tries; i++) { await sleep(40); const h = host(); if (h && h.innerHTML.includes(needle)) return true; } return false; }
async function showAll() { host().querySelector('.tx-chip--rec[data-filter-kind="recOnly"]')?.click(); await sleep(180); }
function hpCard() { return host().querySelector('.tx-card[data-card-value="Hidden Power"]'); }

function prime({ choose }) {
  ST.sm.active = true; ST.sm.runSeed = 1; ST.sm._strngState = null;
  ST.sm.settings = { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
  ST.sm.badges = 6; ST.sm.gold = 99999; ST.sm.inventory = {};
  ST.sm.hiddenPowerUnlocked = true;
  ST.sm.hiddenPowerChoosePending = !!choose;
  // A high-city (Guru) tutor so nothing gates the card; pick a mon and pin its element.
  let idx = 0;
  for (let ei = 0; ei <= 120; ei++) { let c = -1; try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {} if (c === 7) { idx = ei; break; } }
  ST.sm.eventIndex = idx;
  ST.sm.team = [{ name: 'Garchomp', build: { m: ['Earthquake'], n: 'Jolly', a: 'Rough Skin', i: 'Life Orb', hpType: 'Ice', evs: {}, ivs: {} } }];
}

test('the unified Hidden Power card shows the mon\'s own element, not Normal', async () => {
  prime({ choose: false });
  await w.StoryMode.enterTutor('moves');
  await openTutorMon(w);
  await settle('tx-grid');
  await showAll();
  const card = hpCard();
  assert.ok(card, 'the unified Hidden Power card is present at an unlocked tutor');
  const badge = card.querySelector('.type-badge');
  assert.ok(badge, 'the card has a type badge');
  assert.equal(badge.textContent.trim(), 'Ice', 'badge shows THIS mon\'s element (Ice), not Normal');
  assert.ok(/type-Ice/.test(badge.className), 'badge is coloured for the real element');
  assert.ok(!/type-Normal/.test(badge.className), 'never the misleading Normal default');
  const bp = card.querySelector('.tx-stat-bp');
  assert.ok(bp && /60/.test(bp.textContent), 'shows the canonical BP 60');
  const desc = card.querySelector('.tx-card-desc');
  assert.ok(desc && /hidden element/i.test(desc.textContent), 'desc explains the hidden-element mechanic');
  assert.ok(/Ice/.test(desc.textContent), 'desc names the resolved element');
});

test('with the one-time token, the card says the player chooses the element', async () => {
  prime({ choose: true });
  await w.StoryMode.enterTutor('moves');
  await openTutorMon(w);
  await settle('tx-grid');
  await showAll();
  const card = hpCard();
  assert.ok(card, 'card present');
  const desc = card.querySelector('.tx-card-desc');
  assert.ok(desc && /choose its type|lets you choose/i.test(desc.textContent),
    'first-lesson copy tells the player they pick the type');
});
