// Move Tutor pricing: the gold CHARGED must equal the per-move-tier price the
// confirm bar shows — Natural 1,000 / Learnt 2,500 / Awakened 5,000 — not the
// per-stage fallback. Bug: tutorChangeMove() called _moveCostForStage() with no
// tag, so at Guru (stage 2) every move charged the stage price (5,000) even when
// the bar showed 2,500 for a Learnt move.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function primeGuruTutor() {
  ST.sm.active = true; ST.sm.runSeed = 1; ST.sm._strngState = null;
  ST.sm.settings = { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
  ST.sm.badges = 7; ST.sm.gold = 99999; ST.sm.inventory = ST.sm.inventory || {};
  let idx = 0;
  for (let ei = 0; ei <= 120; ei++) { let c = -1; try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {} if (c === 6) { idx = ei; break; } }
  ST.sm.eventIndex = idx;
  ST.sm.team = [{ name: 'Garchomp', build: { m: ['Dragon Claw'], n: 'Jolly', a: 'Rough Skin' } }];
  await w.StoryMode.enterTutor('moves');
  for (let i = 0; i < 30; i++) { await wait(50); if (w.document.querySelector('.tx-grid')) break; }
}

const TIER_PRICE = { natural: 1000, learnt: 2500, awakened: 5000 };

test('teaching a move charges its per-move-tier price, not the per-stage price', async () => {
  await primeGuruTutor();
  assert.equal(ST.npcStage('tutor'), 2, 'precondition: Guru stage (full pool, gate off)');

  // Auto-accept the confirmation modal so tutorChangeMove runs to completion.
  const origConfirm = w.showGameConfirm;
  w.showGameConfirm = async () => true;

  // Find one teachable move of each tier present in this mon's staged pool.
  const staged = await ST.tutorGetStagedMovePool('Garchomp', ['Dragon Claw']);
  const byTag = {};
  for (const m of staged) {
    const base = String(m).split('/')[0];
    if (base === 'Dragon Claw') continue;
    let tag = null; try { tag = ST.moveTagForSpecies ? ST.moveTagForSpecies('Garchomp', base) : null; } catch (e) {}
    if ((tag === 'natural' || tag === 'learnt' || tag === 'awakened') && !byTag[tag]) byTag[tag] = base;
  }

  try {
    let tested = 0;
    for (const tag of ['natural', 'learnt', 'awakened']) {
      const move = byTag[tag];
      if (!move) continue;
      // Reset to a single known move so the next teach fills an open slot.
      ST.sm.team[0].build.m = ['Dragon Claw'];
      ST.sm.gold = 99999;
      const before = ST.sm.gold;
      await w.StoryMode.tutorChangeMove(0, 1, move);
      const spent = before - ST.sm.gold;
      assert.equal(spent, TIER_PRICE[tag], `${tag} move "${move}" should cost ${TIER_PRICE[tag]}G (charged ${spent}G)`);
      assert.ok(ST.sm.team[0].build.m.map((x) => String(x).split('/')[0]).includes(move), 'the move was actually taught');
      tested++;
    }
    assert.ok(tested >= 1, 'exercised at least one tier (expected Learnt available at Guru)');
  } finally {
    w.showGameConfirm = origConfirm;
  }
});
