// Source guard for the 2026-06 story-guidance polish pass.
//
// Pins three correctness facts so a future edit can't silently regress them:
//  1. The removed Pokédex-milestone reward path no longer appears in player text
//     (vouchers now come from Gym Leaders + big Casino wins — see the removal note
//     near `_storyRewardItemSummary`).
//  2. The Help modal's BAG line is Story-accurate — Story Mode has a working
//     in-battle bag, so it must not claim "No items in competitive format".
//  3. Every STORY_TUTORIAL_SCENES entry carries a one-line action `cue`, and the
//     Help modal documents the four Terrains.
//
// Source-level guard. Run: node --test tests/suites/story-guidance-polish.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HTML = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'battle.html'),
  'utf8'
);

test('removed Pokédex-milestone reward path is gone from player-facing text', () => {
  assert.ok(!/Pokédex milestone/.test(HTML),
    'no "Pokédex milestone" reward references should remain');
  assert.ok(!/dex milestones/.test(HTML),
    'no "dex milestones" reward references should remain');
});

test('Help BAG line reflects the Story-mode in-battle bag', () => {
  assert.ok(!/BAG<\/b> — No items in competitive format/.test(HTML),
    'the stale "No items in competitive format" BAG line must be replaced');
  assert.ok(HTML.includes('Throw balls and use items mid-battle in Story Mode'),
    'BAG help should state items are usable in Story Mode');
});

test('the stale "🎯 Next:" chip reference is replaced by the objective bar', () => {
  assert.ok(!/🎯 Next:<\/b> chip/.test(HTML),
    'Help must not reference the removed "🎯 Next:" chip');
  assert.ok(/gold <b>objective bar<\/b>/.test(HTML),
    'Help should point at the gold objective bar');
});

test('every tutorial scene carries an action cue', () => {
  const start = HTML.indexOf('const STORY_TUTORIAL_SCENES = {');
  const end = HTML.indexOf('function _showStoryTutorialScene', start);
  assert.ok(start >= 0 && end > start, 'STORY_TUTORIAL_SCENES block must be locatable');
  const block = HTML.slice(start, end);
  const scenes = (block.match(/metaKey: 'tutorial-/g) || []).length;
  const cues = (block.match(/cue: '/g) || []).length;
  assert.ok(scenes >= 18, `expected >= 18 tutorial scenes, found ${scenes}`);
  assert.equal(cues, scenes, `every scene needs a cue (scenes=${scenes}, cues=${cues})`);
});

test('Help modal documents Terrain effects', () => {
  assert.ok(/<h3[^>]*>Terrain<\/h3>/.test(HTML), 'Help should include a Terrain section');
  ['Electric', 'Grassy', 'Psychic', 'Misty'].forEach((t) =>
    assert.ok(HTML.includes(t), `Terrain help should mention ${t}`));
});
