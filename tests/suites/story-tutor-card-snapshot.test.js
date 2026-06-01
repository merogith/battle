// Step 3 — the item + ability card renderers were merged into one shared shell
// (_txSimpleCardHtml). This is a STRICT 1:1 refactor: every rendered card must
// serialize byte-for-byte identically to the pre-refactor output captured in
// tests/fixtures/tx-cards-before.json. If this fails, the merge changed output.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadEngine } from '../helpers/load-engine.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BEFORE = JSON.parse(readFileSync(join(__dirname, '..', 'fixtures', 'tx-cards-before.json'), 'utf8'));

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Mirror the capture flow EXACTLY (same mon/build/city/stage), or the snapshot is moot.
function prime(city) {
  ST.sm.active = true; ST.sm.runSeed = 1; ST.sm._strngState = null;
  ST.sm.settings = { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
  ST.sm.badges = Math.max(0, city - 1); ST.sm.gold = 99999; ST.sm.inventory = {};
  let idx = 0;
  for (let ei = 0; ei <= 120; ei++) { let c = -1; try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {} if (c === city) { idx = ei; break; } }
  ST.sm.eventIndex = idx;
  ST.sm.team = [{ name: 'Garchomp', build: { m: ['Earthquake'], n: 'Jolly', a: 'Rough Skin', i: 'Life Orb', evs: {}, ivs: {} } }];
}
const host = () => w.document.getElementById('story-tutor-team');
async function settle(needle, tries = 30) { for (let i = 0; i < tries; i++) { await sleep(40); const h = host(); if (h && h.innerHTML.includes(needle)) return; } }
async function showAll() { host().querySelector('.tx-chip--rec[data-filter-kind="recOnly"]')?.click(); await sleep(180); }
function grab(kind) {
  const out = {};
  for (const c of host().querySelectorAll(`.tx-card[data-card-kind="${kind}"]`)) out[c.getAttribute('data-card-value')] = c.outerHTML;
  return out;
}

function assertSnapshotEqual(actual, expected, kind) {
  assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort(),
    `${kind}: same set of cards rendered as before the refactor`);
  for (const k of Object.keys(expected)) {
    assert.equal(actual[k], expected[k], `${kind} card "${k}" must be byte-identical to pre-refactor output`);
  }
}

test('item cards: merged renderer is byte-identical to pre-refactor output', async () => {
  prime(7);
  await w.StoryMode.enterTutor('loadout');
  await settle('tx-grid');
  await showAll();
  assertSnapshotEqual(grab('item'), BEFORE.items, 'item');
});

test('ability cards: merged renderer is byte-identical to pre-refactor output', async () => {
  prime(7);
  await w.StoryMode.enterTutor('loadout');
  await settle('tx-grid');
  host().querySelector('button.tx-tab[data-tab="ability"]').click();
  await sleep(220);
  await showAll();
  assertSnapshotEqual(grab('ability'), BEFORE.abilities, 'ability');
});
