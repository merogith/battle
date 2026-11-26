// Source guard for the 2026-06 story-guidance polish pass.
//
// Pins three correctness facts so a future edit can't silently regress them:
//  1. The removed Pokédex-milestone reward path no longer appears in player text
//     (vouchers now come from Gym Leaders + big Casino wins — see the removal note
//     near `_storyRewardItemSummary`).
//  2. The Help modal's BAG line is Story-accurate — Story Mode has a working
//     in-battle bag, so it must not claim "No items in competitive format".
//  3. Tutorial scenes keep cues in dialogue and battle Help points to live field details.
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
  assert.ok(HTML.includes("story ? '<dt>Bag</dt><dd>Use an item if the fight allows it."),
    'Battle Help should explain when the Story bag is available');
});

test('the stale "🎯 Next" chip guidance is replaced by the objective bar', () => {
  // The old in-game guidance pointed players at a "🎯 Next:" chip that no longer
  // exists (the city screen now shows a gold objective bar). Neither the Help
  // modal nor the first-city welcome tip should reference the chip.
  assert.ok(!HTML.includes('🎯 Next:</b> chip'),
    'Help must not reference the removed "🎯 Next:" chip');
  assert.ok(!HTML.includes('🎯 Next chip'),
    'the welcome tip must not reference the removed "🎯 Next chip"');
  assert.ok(HTML.includes('follow the objective at the top of the screen'),
    'Help should point to the town objective');
  const welcome = /_storyShowOneTimeTip\('welcome',\s*'([^']*)'/.exec(HTML)?.[1] || '';
  assert.match(welcome, /gold (?:button|objective) at the top of town/i,
    'the welcome tip should point at the gold objective bar');
});

test('tutorial scenes no longer carry the separate action-cue block', () => {
  // The white-dialogue + gold-cue "two block" look read as cluttered; the cue
  // was folded back into the dialogue. Guard the removal so it does not return.
  const start = HTML.indexOf('const STORY_TUTORIAL_SCENES = {');
  const end = HTML.indexOf('function _showStoryTutorialScene', start);
  assert.ok(start >= 0 && end > start, 'STORY_TUTORIAL_SCENES block must be locatable');
  const block = HTML.slice(start, end);
  assert.equal((block.match(/\bcue: '/g) || []).length, 0,
    'no scene should define a separate `cue` field');
});

test('battle Help points to live field effects', () => {
  assert.ok(HTML.includes('<summary>Read the battlefield</summary>'));
  assert.ok(HTML.includes('Open a weather or field label to see its effect and remaining turns.'));
});
