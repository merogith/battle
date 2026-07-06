// ★ Suitable filter — narrows the move grid to competitive-tagged utility/singleton
// moves so a player can jump straight to the "good stuff". Equipped moves always pass.
//
//   node --test tests/suites/story-tutor-suitable-filter.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine, openTutorMon } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;
const doc = w.document;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const host = () => doc.getElementById('story-tutor-team');
const visMoves = () => [...host().querySelectorAll('.tx-grid > .tx-card:not([hidden])')].map((c) => c.getAttribute('data-card-value'));

async function prime(city, build) {
  ST.sm.active = true; ST.sm.runSeed = 1; ST.sm._strngState = null;
  ST.sm.settings = { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
  ST.sm.badges = Math.max(0, city - 1); ST.sm.gold = 999999; ST.sm.inventory = {};
  let idx = 0;
  for (let ei = 0; ei <= 140; ei++) { let c = -1; try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {} if (c === city) { idx = ei; break; } }
  ST.sm.eventIndex = idx;
  ST.sm.team = [{ name: 'Garchomp', build }];
  await w.StoryMode.enterTutor('moves');
  await openTutorMon(doc);
  for (let i = 0; i < 40; i++) { await wait(40); if (doc.querySelector('.tx-grid')) break; }
}

test('the Suitable chip renders in the moves toolbar', async () => {
  await prime(7, { m: ['Earthquake'], n: 'Jolly', a: 'Rough Skin' });
  assert.ok(host().querySelector('[data-filter-kind="suitableOnly"][data-filter-value="moves"]'), 'chip present');
});

test('toggling Suitable narrows the grid to competitive-tagged moves (+ equipped)', async () => {
  await prime(7, { m: ['Earthquake'], n: 'Jolly', a: 'Rough Skin' });
  // expand to the full pool first (turn off ★ Recommended) so the narrowing is meaningful
  const rec = host().querySelector('.tx-chip--rec');
  if (rec && rec.dataset.active === '1') { rec.click(); await wait(200); }
  const before = visMoves().length;
  host().querySelector('[data-filter-kind="suitableOnly"]').click();
  await wait(250);
  const after = visMoves();
  assert.ok(after.length >= 3, 'some suitable moves remain');
  assert.ok(after.length < before, `grid narrowed (${before} → ${after.length})`);
  for (const m of after) {
    const base = String(m).split('/')[0];
    const ok = !!w._txCompetitiveTag(base) || base === 'Earthquake'; // equipped always passes
    assert.ok(ok, `${m} is competitive-tagged or the equipped move`);
  }
});

test('the equipped move survives the Suitable filter even if it is not tagged', async () => {
  await prime(7, { m: ['Scale Shot'], n: 'Jolly', a: 'Rough Skin' }); // Scale Shot: not in the table
  assert.equal(w._txCompetitiveTag('Scale Shot'), null, 'Scale Shot is not tagged');
  const rec = host().querySelector('.tx-chip--rec');
  if (rec && rec.dataset.active === '1') { rec.click(); await wait(200); }
  host().querySelector('[data-filter-kind="suitableOnly"]').click();
  await wait(250);
  assert.ok(visMoves().includes('Scale Shot'), 'the equipped move is never filtered out');
});
