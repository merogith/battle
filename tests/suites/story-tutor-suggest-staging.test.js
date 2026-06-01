// The "✨ Suggest a balanced set" panel must respect the Move Tutor's staging: it
// may only recommend moves teachable RIGHT NOW. (The grid renders the full pool
// with off-stage moves locked; the suggester must filter to the acceptance set, or
// it points players at a build they can't learn yet.) It must still produce a
// viable set from the narrow early pool, and improve as the tutor levels up.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;
const doc = w.document;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function openTutor(city, monName, build) {
  ST.sm.active = true; ST.sm.runSeed = 1; ST.sm._strngState = null;
  ST.sm.settings = { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
  ST.sm.badges = Math.max(0, city - 1); ST.sm.gold = 99999; ST.sm.inventory = ST.sm.inventory || {};
  let idx = 0;
  for (let ei = 0; ei <= 140; ei++) { let c = -1; try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {} if (c === city) { idx = ei; break; } }
  ST.sm.eventIndex = idx;
  ST.sm.team = [{ name: monName, build }];
  await w.StoryMode.enterTutor('moves');
  for (let i = 0; i < 30; i++) { await wait(50); if (doc.querySelector('.tx-grid')) break; }
}
const suggestedMoves = () => [...doc.getElementById('story-tutor-team').querySelectorAll('.tx-rec-row[data-card-value]')]
  .map((r) => r.getAttribute('data-card-value'));

test('at Inner, every suggested move is teachable right now (no stage-locked picks)', async () => {
  await openTutor(1, 'Garchomp', { m: ['Dragon Claw'], n: 'Jolly', a: 'Rough Skin' });
  assert.equal(ST.npcStage('tutor'), 0, 'precondition: Inner Strength');
  const suggested = suggestedMoves();
  assert.ok(suggested.length >= 2, 'still suggests a viable set from the narrow Inner pool');

  const staged = await ST.tutorGetStagedMovePool('Garchomp', ['Dragon Claw']);
  const teachable = new Set(staged.map((m) => String(m).split('/')[0]));
  teachable.add('Dragon Claw');
  for (const mv of suggested) {
    assert.ok(teachable.has(String(mv).split('/')[0]), `${mv} must be teachable at Inner (not a later-tier unlock)`);
  }
});

test('suggestions improve with tutor tier — Guru surfaces the off-stage staples', async () => {
  await openTutor(6, 'Garchomp', { m: ['Dragon Claw'], n: 'Jolly', a: 'Rough Skin' });
  assert.equal(ST.npcStage('tutor'), 2, 'precondition: Guru (full pool)');
  const suggested = suggestedMoves();
  // At Guru the gate is off, so the optimal set (Earthquake / Swords Dance etc.)
  // becomes available — at least one premier pick the early tiers couldn't offer.
  assert.ok(suggested.some((m) => ['Earthquake', 'Swords Dance', 'Stone Edge', 'Outrage'].includes(m)),
    `Guru should surface a premier pick; got: ${suggested.join(', ')}`);
});

test('a narrow pool never yields a single lonely suggestion', async () => {
  // Gastly at Inner — a frail NFE with a shallow early movepool.
  await openTutor(1, 'Gastly', { m: ['Lick'], n: 'Timid', a: 'Levitate' });
  const suggested = suggestedMoves();
  if (suggested.length === 0) return; // sparse-data mon → panel suppressed, acceptable
  assert.ok(suggested.length >= 2, 'narrow pool still fills a multi-move suggestion');
  const staged = await ST.tutorGetStagedMovePool('Gastly', ['Lick']);
  const teachable = new Set(staged.map((m) => String(m).split('/')[0])); teachable.add('Lick');
  for (const mv of suggested) assert.ok(teachable.has(String(mv).split('/')[0]), `${mv} teachable at Inner`);
});
