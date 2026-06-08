// Stream 2 §11.1 (maintainer-locked) — rival-name treatment guard.
//
// The rival's battle nameplate is the RBY in-joke "<Player> Sucks"
// (_storyRivalTauntName). Locked decision §11.1: KEEP the gag on the battle HUD /
// nameplate, but render the rival as "your rival" in all NARRATION (the opening
// cold-open, story beats) — no sincere prose ever weaves the "<Player> Sucks"
// string. Before this fix the opening cold-open interpolated {rival} →
// "Mer Sucks" straight into Prof. Oak's earnest scene-setting.
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

test('the opening cold-open narration says "your rival", not the taunt token', () => {
  const b = introBlock();
  assert.ok(b.includes('Your rival got their starter'), 'intro: narration names "your rival"');
  assert.ok(!b.includes('{rival}'), 'intro: no {rival} taunt-name interpolation in the narration');
});

test('no {rival} taunt token survives in any narration line', () => {
  // The intro was the only narration that interpolated the taunt; lock it gone.
  assert.ok(!HTML.includes('{rival}'), 'no narration line interpolates the taunt name');
});

test('the "<Player> Sucks" gag is preserved on the battle HUD', () => {
  // the taunt formatter still builds the gag…
  assert.ok(HTML.includes('`${pn} Sucks`'), '_storyRivalTauntName still builds the gag');
  // …and the rival battle nameplate still applies it (canonName preserves the
  // real identity for dialogue + quote lookups).
  assert.ok(HTML.includes('name: _storyRivalTauntName(trainer.name)'),
    'the rival battle nameplate still reads "<player> Sucks"');
});
