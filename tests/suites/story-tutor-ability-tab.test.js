// Battle Dojo ability tab redesign:
//   • No "Best abilities" recommendations panel and no ★ Recommended toggle — a mon
//     runs exactly ONE ability, so there's no set to suggest. The single best legal
//     ability just carries the ★ on its card.
//   • Every ability card carries a ROLE tag (Offensive / Defensive / Utility / …),
//     derived intrinsically so it works even with no Smogon usage data.
//   • Order is legal-first → Hidden → off-legal Awakened.
//   • The Torrent case: a good legal ability with no competitive build still gets the
//     ★ and a meaningful role tag (not buried under high-usage off-legal picks).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;
const doc = w.document;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function openAbilityTab(city, monName, build) {
  ST.sm.active = true; ST.sm.runSeed = 1; ST.sm._strngState = null;
  ST.sm.settings = { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
  ST.sm.badges = Math.max(0, city - 1); ST.sm.gold = 99999; ST.sm.inventory = ST.sm.inventory || {};
  let idx = 0;
  for (let ei = 0; ei <= 140; ei++) { let c = -1; try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {} if (c === city) { idx = ei; break; } }
  ST.sm.eventIndex = idx;
  ST.sm.team = [{ name: monName, build }];
  await w.StoryMode.enterTutor('loadout');
  for (let i = 0; i < 30; i++) { await wait(40); if (doc.querySelector('.tx-grid')) break; }
  doc.querySelector('button.tx-tab[data-tab="ability"]').click();
  for (let i = 0; i < 25; i++) { await wait(40); if (doc.querySelector('.tx-card--ability')) break; }
}
const host = () => doc.getElementById('story-tutor-team');
const abilityCards = () => [...host().querySelectorAll('.tx-card--ability')];

test('no "Best abilities" panel and no ★ Recommended toggle', async () => {
  await openAbilityTab(5, 'Diglett', { m: ['Earthquake'], n: 'Jolly', a: 'Arena Trap' });
  assert.ok(!host().innerHTML.includes('Best abilities'), 'the recommendations panel is gone');
  assert.equal(host().querySelector('[data-filter-kind="recOnly"][data-filter-value="abilities"]'), null,
    'the ★ Recommended chip is gone for abilities');
});

test('every ability card carries a role tag', async () => {
  await openAbilityTab(5, 'Diglett', { m: ['Earthquake'], n: 'Jolly', a: 'Arena Trap' });
  const cards = abilityCards();
  assert.ok(cards.length >= 3, 'ability cards render');
  for (const c of cards) {
    const tag = c.querySelector('.tx-rec-tag--card');
    assert.ok(tag && tag.textContent.trim().length, `${c.getAttribute('data-card-value')} has a role tag`);
  }
});

test('order is legal-first → Hidden → off-legal', async () => {
  await openAbilityTab(5, 'Diglett', { m: ['Earthquake'], n: 'Jolly', a: 'Arena Trap' });
  const ranks = abilityCards().map((c) => {
    if (c.querySelector('.tx-pill--awaken')) return 2;        // off-legal
    if (c.querySelector('.tx-pill--ha')) return 1;            // Hidden
    return 0;                                                  // legal
  });
  const sorted = [...ranks].sort((a, b) => a - b);
  assert.deepEqual(ranks, sorted, 'legal abilities sort before Hidden, which sort before off-legal');
});

test('Torrent case: a no-Smogon-data legal ability still gets the ★ and a role tag', async () => {
  await openAbilityTab(8, 'Squirtle', { m: ['Water Gun'], n: 'Modest', a: 'Torrent' });
  const torrent = abilityCards().find((c) => c.getAttribute('data-card-value') === 'Torrent');
  assert.ok(torrent, 'Torrent card is shown');
  assert.ok(torrent.querySelector('.tx-card-star'), 'Torrent is starred as the best legal ability despite no usage data');
  const tag = torrent.querySelector('.tx-rec-tag--card');
  assert.ok(tag && /offensive/i.test(tag.textContent), 'Torrent reads as an Offensive ability');
  assert.equal(torrent.querySelector('.tx-pill--awaken'), null, 'Torrent is legal, not off-legal');
  // It must lead — appear before every off-legal card.
  const idxTorrent = abilityCards().indexOf(torrent);
  const firstOffLegal = abilityCards().findIndex((c) => c.querySelector('.tx-pill--awaken'));
  assert.ok(firstOffLegal === -1 || idxTorrent < firstOffLegal, 'Torrent appears before off-legal abilities');
});
