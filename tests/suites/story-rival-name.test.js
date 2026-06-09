// Stream 2 §11.1 (maintainer-locked, REVISED 2026-06) — rival-name treatment guard.
//
// The rival's sprite is a visual filler, not a fixed canonical character, so the
// rival is presented GENERICALLY everywhere a name is shown:
//   - battle HUD / nameplate / VS splash → "Rival"
//   - narration (cold-open, story beats)  → "your rival"
//   - rivalry journal / epilogue / pills  → "Rival"
// The old RBY in-joke nameplate "<Player> Sucks" (_storyRivalTauntName) is GONE.
// The rolled identity (Blue/Silver/…) survives ONLY as `canonName` for the
// per-name dialogue/quote lookups — it is never surfaced to the player.
//
// Source-level guard. Run: node --test tests/suites/story-rival-name.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HTML = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'battle.html'),
  'utf8'
);

function introBlock() {
  const start = HTML.indexOf('const _STORY_INTRO_SCENES');
  assert.ok(start >= 0, '_STORY_INTRO_SCENES must exist');
  const end = HTML.indexOf('};', start);
  assert.ok(end > start, '_STORY_INTRO_SCENES block must close');
  return HTML.slice(start, end);
}

test('the opening cold-open narration says "your rival", not a name token', () => {
  const b = introBlock();
  assert.ok(b.includes('Your rival got their starter'), 'intro: narration names "your rival"');
  assert.ok(!b.includes('{rival}'), 'intro: no {rival} name interpolation in the narration');
});

test('no {rival} name token survives in any narration line', () => {
  assert.ok(!HTML.includes('{rival}'), 'no narration line interpolates a rival-name token');
});

test('the "<Player> Sucks" gag is fully removed', () => {
  // The taunt formatter is deleted…
  assert.ok(!HTML.includes('_storyRivalTauntName'), '_storyRivalTauntName must be gone');
  // …and the gag string is gone from the entire file (code AND comments).
  assert.ok(!HTML.includes('Sucks'), 'no "<player> Sucks" gag string remains anywhere');
});

test('the rival battle nameplate is the generic "Rival" (canonName kept for dialogue)', () => {
  // The rival event swap now displays "Rival" and preserves the rolled identity
  // only as canonName for the per-name quote lookups.
  assert.ok(HTML.includes("name: 'Rival',"), "the rival nameplate reads the generic 'Rival'");
  assert.ok(HTML.includes('canonName: trainer.name,'),
    'canonName still preserves the rolled identity for dialogue lookups');
});
