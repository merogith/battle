// Stream 2 §4.3 — tutorial re-voice mechanics-intact guard.
//
// firstColress / firstCasino / firstFanClub were dense "manual" walls. Stream 2
// re-voiced them (Colress's clinical fascination; the Game Corner manager; the
// Fan Club chairman) under one hard caveat: clarity outranks edge — a re-voice
// may NOT drop a single mechanic
// (docs/story-design/story-immersion/dialogue-and-writing.md §1.5, §4.3).
//
// Guard the main action and reward in the welcome, with details checked on the
// screen where the player uses them.
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

test('the Game Corner welcome explains the gift and the tables explain play', () => {
  const b = sceneBlock('firstCasino');
  ['We bet gold here', 'Lucky Chip', '500 G', 'casinoChip500: 1']
    .forEach(f => present(b, f, 'firstCasino'));
  const tables = HTML.slice(HTML.indexOf('id="screen-story-casino"'), HTML.indexOf('id="screen-story-artifacts"'));
  ['Coin Flip', 'Three straight wins on the same side', 'Slots', '7-7-7',
    'Rare Voucher and vitamins', 'Roulette', '11×', 'Stats']
    .forEach(f => present(tables, f, 'Game Corner controls and rules'));
});

test('the Fan Club explains vitamin amounts, with IV details available below the roster', () => {
  const b = sceneBlock('firstFanClub');
  ['three IV points', 'thirty-one', 'five of each', 'onContinue: _grantFanClubWelcome']
    .forEach(f => present(b, f, 'firstFanClub'));
  const roster = HTML.slice(HTML.indexOf('function renderFanClubRoster()'), HTML.indexOf('function enterFanClub()'));
  ['How vitamins work', 'Individual values (IVs)', 'up to 31', 'no vitamin back',
    'HP Up', 'Protein', 'Iron', 'Calcium', 'Zinc', 'Carbos']
    .forEach(f => present(roster, f, 'Fan Club roster and receipt'));
});

test('the Move Tutor teaches the first action and offers recommendations in the picker', () => {
  const b = sceneBlock('firstMoveTutor');
  ['Choose a partner and a move slot', 'then Teach', 'badges open up stronger moves', 'Heart Scale', 'heartScale: 1']
    .forEach(f => present(b, f, 'firstMoveTutor'));
  ['Suggested moves', 'Same set as the Battle Mentor', 'data-apply-set']
    .forEach(f => present(HTML, f, 'Move Tutor picker'));
});
