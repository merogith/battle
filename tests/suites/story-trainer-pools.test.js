// Verifies the trainer-pool restructure (Phase 3.5): the Elite Trainer pool
// includes gym leaders (who may recur), while gym-leader slots dedup so there's
// never a duplicate LEADER fight in a run.
// Run: node --test tests/suites/story-trainer-pools.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const E = eng.window.__rivalTest;
const GENS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const base = (n) => E.baseTrainerName(n);

function prime() {
  E.sm.active = false;
  E.sm.storyDifficulty = 'normal';
  if (!E.sm.settings) E.sm.settings = {};
  E.sm.settings.enabledGens = GENS.slice();
}
prime();

test('5c: a gym leader can fill an Elite Trainer slot', () => {
  let sawLeader = false;
  for (let s = 0; s < 100 && !sawLeader; s++) {
    eng.seedRng(20000 + s);
    const t = E.selectTrainerForRole('Elite Trainer', GENS, new Set());
    if (t && /^Gym Leader/i.test(String(t.role))) sawLeader = true;
  }
  assert.ok(sawLeader, 'gym leaders are part of the Elite Trainer pool');
});

test('5b: gym-leader slots dedup — a used leader never fills the next leader slot', () => {
  eng.seedRng(21000);
  const gl1 = E.selectTrainerForRole('Gym Leader 1', GENS, new Set());
  assert.ok(gl1 && /^Gym Leader/i.test(String(gl1.role)), 'GL1 returns a leader');
  const used = new Set([base(gl1.name)]);
  for (let s = 0; s < 80; s++) {
    eng.seedRng(21000 + s);
    const gl2 = E.selectTrainerForRole('Gym Leader 2', GENS, used);
    assert.notEqual(base(gl2.name), base(gl1.name), `duplicate leader fight at seed ${21000 + s}`);
  }
});

test('5c-recur: leaders spent as leaders still appear in the Elite Trainer pool', () => {
  // Spend several leaders (as if assigned to gym slots), then confirm the Elite pool
  // still surfaces one of those spent leaders — i.e. leader-dedup is bypassed there.
  const used = new Set();
  for (let s = 0; s < 8; s++) {
    eng.seedRng(22000 + s);
    const l = E.selectTrainerForRole('Gym Leader ' + ((s % 8) + 1), GENS, used);
    if (l) used.add(base(l.name));
  }
  assert.ok(used.size >= 3, 'spent at least a few distinct leaders');
  let sawSpentLeader = false;
  for (let s = 0; s < 200 && !sawSpentLeader; s++) {
    eng.seedRng(23000 + s);
    const t = E.selectTrainerForRole('Elite Trainer', GENS, used);
    if (t && /^Gym Leader/i.test(String(t.role)) && used.has(base(t.name))) sawSpentLeader = true;
  }
  assert.ok(sawSpentLeader, 'a spent leader still appears in the Elite pool (leader-dedup bypassed there)');
});
