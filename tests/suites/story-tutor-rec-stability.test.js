// Recommendations must be STABLE — they show the ideal set and MARK the picks you
// already run (✓ Equipped), instead of dropping the equipped pick and surfacing a
// worse alternative. Before the fix the panel was a moving target: it hid your best
// move/item and recommended the next-best; the moment you swapped to it, the panel
// flipped to recommend the very move/item you just gave up.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;
const doc = w.document;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function moveRecRows(city, monName, build) {
  ST.sm.active = true; ST.sm.runSeed = 1; ST.sm._strngState = null;
  ST.sm.settings = { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
  ST.sm.badges = Math.max(0, city - 1); ST.sm.gold = 99999; ST.sm.inventory = ST.sm.inventory || {};
  let idx = 0;
  for (let ei = 0; ei <= 140; ei++) { let c = -1; try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {} if (c === city) { idx = ei; break; } }
  ST.sm.eventIndex = idx;
  ST.sm.team = [{ name: monName, build }];
  await w.StoryMode.enterTutor('moves');
  for (let i = 0; i < 30; i++) { await wait(40); if (doc.querySelector('.tx-grid')) break; }
  return [...doc.getElementById('story-tutor-team').querySelectorAll('.tx-rec-row[data-card-value]')]
    .map((r) => ({ move: r.getAttribute('data-card-value'), equipped: !!r.querySelector('.tx-rec-equipped'), inert: r.getAttribute('data-disabled') === '1' }));
}

test('move suggester is stable: the same ideal set regardless of what is equipped', async () => {
  // Guru Garchomp. Same ideal set whether or not it already runs the picks.
  const withIdeal = await moveRecRows(6, 'Garchomp', { m: ['Earthquake', 'Swords Dance'], n: 'Jolly', a: 'Rough Skin' });
  const withoutIdeal = await moveRecRows(6, 'Garchomp', { m: ['Dragon Claw'], n: 'Jolly', a: 'Rough Skin' });
  assert.ok(withIdeal.length >= 3, 'panel renders the suggestion rows');
  assert.deepEqual(withIdeal.map((r) => r.move), withoutIdeal.map((r) => r.move),
    'the suggested set is identical regardless of equipped moves (no moving target)');
});

test('equipped moves are SHOWN and marked ✓, not hidden', async () => {
  const rows = await moveRecRows(6, 'Garchomp', { m: ['Earthquake', 'Swords Dance'], n: 'Jolly', a: 'Rough Skin' });
  const eq = rows.find((r) => r.move === 'Earthquake');
  const sd = rows.find((r) => r.move === 'Swords Dance');
  assert.ok(eq, 'the equipped Earthquake still appears in the suggestion (not dropped)');
  assert.equal(eq.equipped, true, 'Earthquake is marked ✓ Equipped');
  assert.equal(eq.inert, true, 'an equipped suggestion is inert (you already have it)');
  assert.ok(sd && sd.equipped, 'Swords Dance is also marked equipped');
  // The moves the player does NOT yet run are still tappable to add.
  assert.ok(rows.some((r) => !r.equipped && !r.inert), 'not-yet-run picks remain tappable');
});

test('item recommender is stable: the held item is marked, never dropped', () => {
  const mon = ST.buildPokemon('Garchomp', { n: 'Jolly', a: 'Rough Skin' });
  const pool = ['Choice Band', 'Life Orb', 'Leftovers', 'Rocky Helmet', 'Lum Berry', 'Yache Berry'];
  const withNone = ST.txItemRecsByPurpose(pool, mon, { i: '(none)' }, 'Garchomp');
  const withCB = ST.txItemRecsByPurpose(pool, mon, { i: 'Choice Band' }, 'Garchomp');
  assert.deepEqual(withCB.map((e) => e.item), withNone.map((e) => e.item),
    'the recommended item set is identical regardless of held item (stable)');
  const cb = withCB.find((e) => e.item === 'Choice Band');
  assert.ok(cb, 'a top-role held item (Choice Band) is included, not dropped');
  assert.equal(cb.equipped, true, 'the held item is marked equipped');
  assert.ok(withNone.find((e) => e.item === 'Choice Band' && !e.equipped), 'when not held it is a normal pick');
});
