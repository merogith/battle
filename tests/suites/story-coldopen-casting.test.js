// Stream 2 §6 — cold-open casting guard.
//
// The story spine used to route nearly every milestone cold-open through
// Prof. Oak — one voice, one mood, the whole road. Stream 2's casting map
// (docs/story-design/story-immersion/dialogue-and-writing.md §6) re-casts:
//   • the three mid-route benches (rows 20/33/48) → a recurring Veteran
//     (same sprite all three times; familiarity escalates stranger → kinship),
//   • the Champion's Hall → world-narrator (no speaker — "let the room speak"),
//   • Oak RETAINED on his bookends + his one confession: gym1, gym4, gym8, twist.
//
// This guard locks that casting so a later session can't silently revert a
// bench back to Oak or hand the Champion's Hall back to a speaker.
//
// Source-level (reads battle.html as text) — same style as
// tests/suites/overlay-zindex-tokens.test.js; drift-tolerant (matches content,
// not line numbers). The overlay render pipeline itself is covered behaviorally
// by tests/integration/story-narration-system.test.js.
//
// Run: node --test tests/suites/story-coldopen-casting.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HTML = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'battle.html'),
  'utf8'
);

// Bound one STORY_COLD_OPENS entry to its run() body: from `<key>: {` to the
// first `}); }` that closes the _renderNarrativeOverlay call. Keeps each
// assertion scoped to a single cold-open so a window never bleeds into the next.
function coldOpenBlock(key) {
  const start = HTML.indexOf(key + ': {');
  assert.ok(start >= 0, `cold-open entry ${key} must exist`);
  const end = HTML.indexOf('}); }', start);
  assert.ok(end > start, `cold-open entry ${key} must close with }); }`);
  return HTML.slice(start, end);
}

const BENCHES = ['classic_npc_r20', 'classic_npc_r33', 'classic_npc_r48'];
const OAK_KEPT = ['classic_gym1', 'classic_gym4', 'classic_gym8', 'classic_twist'];

test('the three mid-route benches are cast to the recurring Veteran, not Oak', () => {
  for (const key of BENCHES) {
    const b = coldOpenBlock(key);
    assert.ok(/sprite:\s*'Veteran'/.test(b), `${key}: must use the Veteran sprite`);
    assert.ok(/name:\s*'Veteran'/.test(b), `${key}: nameplate speaker must be Veteran`);
    assert.ok(!/sprite:\s*'Oak'/.test(b), `${key}: must no longer be cast to Oak`);
    assert.ok(!/Prof\. Oak/.test(b), `${key}: must not name Prof. Oak`);
  }
});

test("the Champion's Hall is world-narrator (no speaker)", () => {
  const b = coldOpenBlock('classic_champion');
  assert.ok(/sprite:\s*null/.test(b), 'champion hall: sprite must be null');
  assert.ok(/name:\s*''/.test(b), 'champion hall: name must be empty');
  assert.ok(!/Prof\. Oak/.test(b), 'champion hall: must not name Prof. Oak');
  assert.ok(/THE CHAMPION/.test(b), 'champion hall: keeps its banner');
  assert.ok(/The numbered part\./.test(b), 'champion hall: the §5.2 post-game seed is present');
});

test('Oak is retained on his bookends and his one confession', () => {
  for (const key of OAK_KEPT) {
    const b = coldOpenBlock(key);
    assert.ok(/sprite:\s*'Oak'/.test(b), `${key}: Oak must still be the speaker`);
    assert.ok(/name:\s*'Prof\. Oak'/.test(b), `${key}: Oak nameplate retained`);
  }
});

test('the recurring Veteran escalates stranger → familiar → kinship', () => {
  // appearance 1 — doesn't know you (establishes the recurring visual tell)
  assert.ok(/six worn Poké Balls/.test(coldOpenBlock('classic_npc_r20')),
    'r20: establishes the Veteran with his recurring "six worn Poké Balls" tell');
  // appearance 2 — starting to place you
  assert.ok(/came past me a couple gyms back/.test(coldOpenBlock('classic_npc_r33')),
    'r33: the Veteran half-recognizes the player');
  // appearance 3 — knows you
  assert.ok(/stopped betting against you/.test(coldOpenBlock('classic_npc_r48')),
    'r48: the Veteran greets the player as a known quantity');
});

test('the replaced Oak bench lines are gone (no silent revert)', () => {
  assert.ok(!HTML.includes('tell the press I come here for the buffet'),
    'the old Oak casino-buffet line must be gone');
  assert.ok(!HTML.includes('I brought sandwiches. Take one'),
    'the old Oak sandwiches line must be gone');
});
