// Stream 2 §4.1 — Mystery climax intro guard.
//
// The post-HoF climax intro used to be cryptic AND spoilery at once: the
// pre-fight cold-open (_MYSTERY67_BY_VARIANT.classic) and the in-battle barks
// (MYSTERY_FIGURE_IDENTITIES.the_first.intros) half-stated the loop twist
// before the fight, stealing the reveal scene's weight ("I am every version of
// you…", "End this loop").
//
// Stream 2 (docs/story-design/story-immersion/dialogue-and-writing.md §4.1)
// re-cut the intro to commit to total mystery — sensory + behavioral clues only
// ("in your colors", "a cap like yours", "six you've met", "lose this on
// purpose", "Again. Harder.") — moving ALL exposition into the reveal scene
// (main.mfReveal), where it earns its weight. The reveal + ending
// (main.mfReveal / main.ending) are the bar and must stay untouched.
//
// Source-level guard (same style as overlay-zindex-tokens.test.js).
// Run: node --test tests/suites/story-mystery-intro.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HTML = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'battle.html'),
  'utf8'
);

// Bound the _MYSTERY67_BY_VARIANT.classic pre-fight cold-open.
function mysteryIntroBlock() {
  const start = HTML.indexOf('const _MYSTERY67_BY_VARIANT');
  assert.ok(start >= 0, '_MYSTERY67_BY_VARIANT must exist');
  const end = HTML.indexOf('function _variantMystery67Scene', start);
  assert.ok(end > start, '_MYSTERY67_BY_VARIANT block must close');
  return HTML.slice(start, end);
}

// Bound the MYSTERY_FIGURE_IDENTITIES.the_first identity entry (intros + outro).
function theFirstBlock() {
  const start = HTML.indexOf('the_first: { sprite:');
  assert.ok(start >= 0, 'MYSTERY_FIGURE_IDENTITIES.the_first must exist');
  const end = HTML.indexOf('_storyPickMysteryIdentity', start);
  assert.ok(end > start, 'the_first block must close');
  return HTML.slice(start, end);
}

test('the Mystery cold-open commits to dread, not exposition', () => {
  const b = mysteryIntroBlock();
  // new — behavioral / sensory clues the player can verify mid-fight
  assert.ok(/in your colors, under a cap like yours/.test(b), 'intro: the mirror clue (colors + cap)');
  assert.ok(/you have met all six before/.test(b), 'intro: the team-mirror clue');
  assert.ok(/Never before\./.test(b), 'intro: the withholding tell');
  // old — vague-yet-spoilery lines are gone
  assert.ok(!/the chair will tell you the rest after/.test(b), 'intro: the old vague line is gone');
  assert.ok(!/A figure waits in the chamber the Champion vacated/.test(b), 'intro: the old opener is gone');
});

test('the_first barks imply the twist through behavior, never state it', () => {
  const b = theFirstBlock();
  assert.ok(/lose this on purpose/.test(b), 'barks: came-to-lose behavior implies the loop');
  assert.ok(/Good\. Again\. Harder\./.test(b), "barks: the teacher's cadence");
  // the stated twist is gone
  assert.ok(!/every version of you/.test(b), 'barks: the stated twist is gone');
  assert.ok(!/End this loop/.test(b), 'barks: the stated loop is gone');
});

test('the reveal and ending (the bar) are left untouched', () => {
  assert.ok(HTML.includes('The face under it is yours. Older.'),
    'main.mfReveal signature line must be intact');
  assert.ok(HTML.includes('the number is a mercy'),
    'main.ending signature line must be intact');
});
