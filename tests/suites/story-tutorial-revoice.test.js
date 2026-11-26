// Stream 2 §4.3 — tutorial re-voice mechanics-intact guard.
//
// firstColress / firstCasino / firstFanClub were dense "manual" walls. Stream 2
// re-voiced them (Colress's clinical fascination; the Game Corner manager; the
// Fan Club chairman) under one hard caveat: clarity outranks edge — a re-voice
// may NOT drop a single mechanic
// (docs/story-design/story-immersion/dialogue-and-writing.md §1.5, §4.3).
//
// This guard pins every load-bearing fact in each scene so a future polish can't
// silently lose one, plus a marker confirming the re-voice actually landed.
//
// Source-level guard. Run: node --test tests/suites/story-tutorial-revoice.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HTML = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'battle.html'),
  'utf8'
);

// Bound one STORY_TUTORIAL_SCENES entry: from `<key>: {` to the *next* scene's
// `metaKey: 'tutorial-…'`. (firstColress's block spans both its getLines() base
// and its static lines fallback — both must carry the mechanics.)
function sceneBlock(key) {
  const start = HTML.indexOf(key + ': {');
  assert.ok(start >= 0, `tutorial scene ${key} must exist`);
  const ownMeta = HTML.indexOf("metaKey: 'tutorial-", start);
  const nextMeta = HTML.indexOf("metaKey: 'tutorial-", ownMeta + 10);
  const end = nextMeta > start ? nextMeta : start + 2400;
  return HTML.slice(start, end);
}

// Apostrophe-free fragments only (source escapes ' as \', so quote contents
// won't match a literal apostrophe).
const present = (block, frag, label) =>
  assert.ok(block.includes(frag), `${label}: mechanic "${frag}" must survive the re-voice`);

test('firstColress keeps every battle-form mechanic', () => {
  const b = sceneBlock('firstColress');
  ['Six badges open my lab',
   'any move a form requires',
   'one form per partner',
   'Under Classic rules, the team can activate one per battle',
   'Mega Stones and Z-Crystals take the held-item slot',
   'Dynamax and Tera leave it free',
   'A Z-Move is one strike',
   'Dynamax lasts up to three turns',
   'Mega Evolution and Terastallization last for the rest of the battle',
  ].forEach((f) => present(b, f, 'firstColress'));
});

test('firstCasino keeps every Game Corner mechanic', () => {
  const b = sceneBlock('firstCasino');
  ['coin swap',          // gold plays straight, no coin swap
   'Vitamins',           // win big → Vitamins
   'IV by three',        // each Vitamin +3 IV
   'Rare Candies',       // jackpot reward
   'Ability Capsules',   // jackpot reward
   'Coin Flip',          // game 1
   'streak of three',    // …its prize-tier rule
   'Slots',              // game 2
   '7-7-7',              // …its jackpot
   'Roulette',           // game 3
   '11×',                // …its single-cell payout
   'Stats',              // the stats tracker
   'Lucky Chip',         // the grant (matches casinoChip500 onContinue)
   '500G',
  ].forEach((f) => present(b, f, 'firstCasino'));
});

test('firstFanClub keeps every IV / Vitamin mechanic', () => {
  const b = sceneBlock('firstFanClub');
  ['Individual Values',  // IVs
   'thirty-one',         // the 0–31 range / ceiling
   'IV by three',        // each Vitamin +3
   'five of each',       // the welcome grant (granted at the call site)
   // all six Vitamins must still be named
   'HP Up', 'Protein', 'Iron', 'Calcium', 'Zinc', 'Carbos',
  ].forEach((f) => present(b, f, 'firstFanClub'));
});

test('firstMoveTutor explains teaching, unlocks, recommendations, and the free lesson', () => {
  const b = sceneBlock('firstMoveTutor');
  ['Pick a slot', 'empty one', 'tap Teach', 'stronger moves as you earn badges',
   'show you a set', 'Heart Scale', 'One lesson’s on me', 'heartScale: 1',
  ].forEach((f) => present(b, f, 'firstMoveTutor'));
});
