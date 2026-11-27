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

test('generated beat tables remain current without including curated scenes or reward rules', () => {
  const generated = fs.readFileSync(new URL('../../scripts/build/story-scenes.generated.js', import.meta.url), 'utf8');
  const match = /^        const MAIN_STORY_BEATS = /m;
  const start = HTML.match(match)?.index;
  const end = HTML.indexOf('END generated story beat tables');
  assert.ok(start != null && end > start);
  const tables = HTML.slice(start, HTML.lastIndexOf('\n', end)).trimEnd();
  assert.equal(tables, generated.slice(generated.match(match).index).trimEnd());
  assert.doesNotMatch(tables, /STORY_SCENES|STORY_REWARD_TIERS/);
  for (const scene of ['main.mfFirst', 'main.mfFirstReturn', 'main.mfSpare']) {
    assert.ok(HTML.includes(`"${scene}": {`), `${scene} is still authored in the runtime`);
  }
});

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
  assert.match(coldOpenBlock('classic_npc_r20'), /six worn Poké Balls.*green thread/i,
    'r20: the Veteran introduces the repaired glove while he makes room on the bench');
  // appearance 2 — starting to place you
  assert.match(coldOpenBlock('classic_npc_r33'), /green thread[\s\S]*You sat by me/,
    'r33: the Veteran remembers the bench and puts the player on the safe side of the road');
  // appearance 3 — knows you
  assert.match(coldOpenBlock('classic_npc_r48'), /green thread[\s\S]*go as far as the window with you/,
    'r48: the Veteran is waiting and offers to walk with the player');
});

test('the replaced Oak bench lines are gone (no silent revert)', () => {
  assert.ok(!HTML.includes('tell the press I come here for the buffet'),
    'the old Oak casino-buffet line must be gone');
  assert.ok(!HTML.includes('I brought sandwiches. Take one'),
    'the old Oak sandwiches line must be gone');
});
