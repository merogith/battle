// Story Immersion Stream 2 §D (CONCLUSION.md) — the three maintainer-decided
// loop-prose items:
//   D1 — main.event1: the loop is invisible to the professor (narrator contrast —
//        he saw you off "like the first time"; the bench old man knew better).
//   D2 — main.mfReveal: an ADDITIVE breadcrumb call-back naming the four
//        ANOMALY_SEEDS payoffs (the Welcome-Back sticker / the handwriting /
//        "tell The First hi"). The reveal's signature line (the bar) stays intact.
//   D3 — main.battle2: the unkept "matched slot-for-slot mirror" promise softened
//        (there is no canon mirror team — BEAT_CANON_TRAINER has no main.battle2
//        entry, so the engine rolls a generic foe; the prose no longer over-promises).
//
// Source-level guard (same style as the other Stream 2 guards).
// Run: node --test tests/suites/story-loop-prose.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HTML = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'battle.html'),
  'utf8'
);

// Bound one STORY_SCENES entry: from `"<key>": {` to the next scene key (each
// scene key sits at the same 18-space indent).
function sceneBlock(key) {
  const marker = '"' + key + '": {';
  const start = HTML.indexOf(marker);
  assert.ok(start >= 0, `scene ${key} must exist`);
  const next = HTML.indexOf('\n                  "', start + marker.length);
  return HTML.slice(start, next > start ? next : start + 2500);
}

test('D1 — main.event1 plants the loop as invisible to the professor', () => {
  const b = sceneBlock('main.event1');
  assert.ok(b.includes('the first time. For him, it was'),
    'main.event1: the professor saw you off as if for the first time (loop-blind)');
  assert.ok(b.includes('old man on the bench knew better'),
    'main.event1: contrast with the loop-aware figure');
});

test('D2 — main.mfReveal names the four anomaly breadcrumbs, additively', () => {
  const b = sceneBlock('main.mfReveal');
  assert.ok(b.includes('sticker that read Welcome Back'), 'callback names the sticker seed (row 7)');
  assert.ok(b.includes('sentence in your Pokédex in handwriting'),
    'callback names the handwriting seed (rows 14/49) and holds the Pokédex diacritic');
  assert.ok(b.includes('told you to say hi'), 'callback names the "tell The First" seed (row 30)');
  // the bar stays intact — the call-back is additive, the reveal signature is untouched
  assert.ok(b.includes('The face under it is yours. Older.'),
    'main.mfReveal signature line still present');
});

test('D3 — main.battle2 no longer promises a literal slot-for-slot mirror', () => {
  const b = sceneBlock('main.battle2');
  assert.ok(!b.includes('Slot for slot'), 'the unkept slot-for-slot promise is gone');
  assert.ok(!b.includes('your starter line'), 'the literal "your starter line" claim is gone');
  assert.ok(b.includes('built the way yours is built'),
    'reframed as a near-self foe a strong generic roll can deliver');
});
