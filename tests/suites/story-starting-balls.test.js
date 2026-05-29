// Regression for ISSUE-007: a brand-new story run started with 0 Poke Balls. The
// v15 starter stock of 5 Poke Balls (STORY_MODE_FLOW §1/§6/§10) was only granted by
// migrateStoryPreV15 (for old saves) — startNewRun's sm literal defaulted balls to
// poke:0, so a new player reached their first route wild with nothing to throw.
// Run: node --test tests/suites/story-starting-balls.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;

// startNewRun reads a few trainer-create UI elements; stub them (mirrors
// tests/story-walkthrough.mjs) so the run can be started headlessly.
function simulateNewRunUI() {
  const doc = w.document;
  for (const id of ['story-mech-mega', 'story-mech-z', 'story-mech-dyna', 'story-mech-tera']) {
    if (!doc.getElementById(id)) {
      const el = doc.createElement('input');
      el.type = 'checkbox'; el.id = id; el.checked = false;
      doc.body.appendChild(el);
    }
  }
  let diff = doc.getElementById('story-difficulty');
  if (!diff) {
    diff = doc.createElement('select'); diff.id = 'story-difficulty';
    const opt = doc.createElement('option'); opt.value = 'normal'; diff.appendChild(opt);
    doc.body.appendChild(diff);
  }
  diff.value = 'normal';
}

test('a fresh story run starts with the v15 starter 5 Poke Balls (ISSUE-007)', () => {
  simulateNewRunUI();
  w.StoryMode.startNewRun();
  const sm = w.StoryMode.state;
  assert.ok(sm && sm.active, 'run started');
  assert.ok(sm.balls, 'balls inventory exists');
  assert.equal(sm.balls.poke | 0, 5, 'new player gets 5 Poke Balls');
  assert.equal(sm.balls.great | 0, 0, 'no Great Balls yet');
  assert.equal(sm.balls.ultra | 0, 0, 'no Ultra Balls yet');
  assert.equal(sm.balls.master | 0, 0, 'no Master Ball yet');
});
