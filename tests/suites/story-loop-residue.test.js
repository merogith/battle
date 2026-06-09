// Main-loop direction (docs/story-research/08-main-loop-direction.md) — the
// maintainer-decided "authorless trap" enrichments layered onto the shipped
// loop spine WITHOUT replacing the loved/guarded prose:
//   R1 — cross-run meta carries the loop capstone (lastLoopChoice) so the
//        NEXT run can surface it as the only-you-could-author-it proof.
//   R2 — the scene branch engine can read cross-run meta (when.meta), not just
//        per-run sm.storyChoices (when.key) — the residue substrate.
//   R3 — main.event1 gains a residue/cast-of-yous outro act (remember = heavier,
//        forget = colder, first-run = "someone you used to be"); the original
//        climax act (guarded by story-loop-prose.test.js) is untouched.
//   R4 — main.mfReveal tips the teleological "save the universe" thesis toward
//        AUTHORLESS (nobody built this / no door) + a diegetic replaying gesture
//        (you come back from "outside the road"), additively — the signature
//        reveal lines stay intact.
//
// Source-level guard (same style as story-loop-prose.test.js).
// Run: node --test tests/suites/story-loop-residue.test.js

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
  return HTML.slice(start, next > start ? next : start + 4000);
}

test('R1 — cross-run meta carries the loop capstone (lastLoopChoice)', () => {
  // Declared in the empty-meta factory AND normalized on read, so it is always
  // a string and survives a round-trip through localStorage.
  assert.ok(/lastLoopChoice:\s*''/.test(HTML),
    '_emptyStoryMeta seeds lastLoopChoice');
  assert.ok(/lastLoopChoice:\s*typeof obj\.lastLoopChoice === 'string'/.test(HTML),
    'readStoryMeta normalizes lastLoopChoice to a string');
  // The capstone pick is mirrored from the per-run choice into the meta.
  assert.ok(HTML.includes("if (key === 'main.loop.remember')"),
    'the loop capstone choice is special-cased on commit');
  assert.ok(/_m\.lastLoopChoice = \(pick\.value \|\| pick\.label\)/.test(HTML),
    'the capstone pick is written into meta.lastLoopChoice');
});

test('R2 — the branch engine resolves cross-run meta (when.meta)', () => {
  assert.ok(HTML.includes('function _storyMetaValue('),
    'a meta reader exists for branch matching');
  assert.ok(HTML.includes('function _branchMatches('),
    'a unified branch matcher exists');
  assert.ok(/when\.meta != null/.test(HTML),
    '_branchMatches handles a meta-sourced when');
  // The resolver delegates to the matcher (per-run when.key path preserved).
  assert.ok(/if \(_branchMatches\(br\.when\)\)/.test(HTML),
    '_resolveActLines routes through _branchMatches');
});

test('R3 — main.event1 gains the residue / cast-of-yous outro (climax intact)', () => {
  const b = sceneBlock('main.event1');
  // The guarded climax (loop-blind professor) is still present and unmoved.
  assert.ok(b.includes('the first time. For him, it was') &&
            b.includes('old man on the bench knew better'),
    'event1 climax (story-loop-prose D1) is preserved');
  // Residue branches read the CROSS-RUN capstone, not a per-run choice.
  assert.ok(b.includes('"meta": "lastLoopChoice"'),
    'event1 residue branches key off cross-run lastLoopChoice');
  assert.ok(b.includes('"eq": "remember"') && b.includes('"eq": "forget"'),
    'event1 distinguishes the remember vs forget residue');
  // First-ever-run default plants the cast-of-yous without confirming it.
  assert.ok(b.includes('someone you used to be'),
    'event1 first-run default plants the worn-past-you resemblance');
});

test('R4 — main.mfReveal tips authorless + adds the diegetic replaying gesture', () => {
  const b = sceneBlock('main.mfReveal');
  // Signature reveal + breadcrumb callbacks (story-loop-prose D2) still intact.
  assert.ok(b.includes('The face under it is yours. Older.'),
    'mfReveal signature line preserved');
  assert.ok(b.includes('sticker that read Welcome Back'),
    'mfReveal breadcrumb callback preserved');
  // The authorless turn: no architect, no door, not going anywhere.
  assert.ok(b.includes('Nobody built this'),
    'mfReveal states the loop is authorless');
  assert.ok(b.includes('There is no door'),
    'mfReveal states there is no escape');
  // The relocate-the-fourth-wall gesture, kept diegetic (no menu-speak).
  assert.ok(b.includes('outside the road'),
    'mfReveal gestures at the player replaying from outside the fiction');
  assert.ok(b.includes('here on purpose'),
    'mfReveal hands the choosing to the player as the one un-trapped thing');
  // Guard the diegesis: the reveal must not break into save/load/menu language.
  assert.ok(!/\b(save file|load|new game|main menu|press start)\b/i.test(b),
    'mfReveal stays diegetic — no menu-speak');
});
