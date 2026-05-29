// Regression for ISSUE-004 (P1 soft-lock) / ISSUE-020 (P2 waste): catchThrow
// decrements the ball BEFORE resolving the outcome. When a catch succeeds but the
// party AND PC are both full, _catchHandleSuccess discarded the caught mon and
// returned WITHOUT refunding the ball. For the unique, boss-only Master Ball that
// permanently soft-locks the Caged God arc (the "free a slot and try again"
// instruction is impossible — the ball is gone). Fixed by refunding the ball on
// that rejection path.
// Run: node --test tests/suites/story-catch-refund.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const ST = eng.window.__storyTest;

// Simulate the post-catchThrow state: the ball has already been consumed (0 left),
// party is at the cap, PC is at PC_BOX_CAP — i.e. nowhere to put a successful catch.
function fullSm(ballKey) {
  const balls = { poke: 0, great: 0, ultra: 0, master: 0 };
  balls[ballKey] = 0; // consumed by catchThrow
  return {
    active: true, badges: 8, eventIndex: 0,
    team: Array.from({ length: 6 }, (_, i) => ({ name: 'Filler' + i })),
    pcBox: Array.from({ length: 30 }, (_, i) => ({ name: 'Boxed' + i })),
    balls,
    settings: { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  };
}

test('Master Ball is refunded when a boss catch succeeds with no room (ISSUE-004)', () => {
  const prev = ST.sm;
  ST.sm = fullSm('master');
  try {
    const before = ST.sm.team.length;
    ST.catchHandleSuccess({ name: 'Subject Zero', build: {}, id: 9001 }, 'master');
    assert.equal(ST.sm.balls.master, 1, 'unique Master Ball returned to inventory (was lost)');
    assert.equal(ST.sm.team.length, before, 'party unchanged');
    assert.equal(ST.sm.pcBox.length, 30, 'PC unchanged');
  } finally {
    ST.sm = prev;
  }
});

test('a regular ball is also refunded on the no-room rejection (ISSUE-020)', () => {
  const prev = ST.sm;
  ST.sm = fullSm('ultra');
  try {
    ST.catchHandleSuccess({ name: 'Tauros', build: {}, id: 128 }, 'ultra');
    assert.equal(ST.sm.balls.ultra, 1, 'Ultra Ball returned to inventory');
  } finally {
    ST.sm = prev;
  }
});
