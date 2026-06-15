// Villain-arc boss payoff guard (narrative enrichment, 2026-06).
//
// The villain ENDINGS already read back their arc choice (plasma.n / flare.sticker /
// macroCosmos.drone). This pass adds the 07-dossier beats that were still missing at
// the CLIMAX of three arcs, all additive + contract-safe (no path fork, no mechanics):
//   - villain.plasma.boss  : Ghetsis reacts to the `villain.plasma.n` pick AT the reveal
//                            (07 plasma [core] — pay off the N relationship at the boss,
//                            not only in the ending). A non-forking `branches` read-back.
//   - villain.flare.event6 : the AZ tragic-mirror — a long-lived figure who fired such a
//                            weapon once and grieves, ignored by Lysandre (07 flare [nice]).
//   - villain.macroCosmos.boss : Rose names the `event5` succession seed ("The First" in the
//                            PERPETUAL slot), cross-linking the corporate arc to the main loop.
//
// Source-level guard (no engine boot needed).
// Run: node --test tests/suites/story-villain-boss-payoff.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HTML = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'battle.html'),
  'utf8'
);

// Slice the STORY_SCENES entry for `key` (from its quoted key to the NEXT scene key).
// Scene keys are dotted (villain.x.y / extra.x.y / main.x); inner act keys (when/
// phase/choice/lines/branches) are not — so the boundary search matches dotted keys only.
function sceneBlock(key) {
  const start = HTML.indexOf('"' + key + '": {');
  assert.ok(start >= 0, key + ' scene must exist');
  const after = start + key.length + 6;
  const nextKey = HTML.slice(after).search(/"[a-z][a-z]*\.[\w.]+": \{/);
  const end = nextKey >= 0 ? after + nextKey : HTML.length;
  return HTML.slice(start, end);
}

test('plasma.boss pays off villain.plasma.n at the Ghetsis reveal (non-forking read-back)', () => {
  const b = sceneBlock('villain.plasma.boss');
  assert.ok(b.includes('"key": "villain.plasma.n"'), 'plasma.boss branches on villain.plasma.n');
  assert.ok(b.includes('"eq": "uncaged"') && b.includes('"eq": "ball"'),
    'plasma.boss handles both villain.plasma.n outcomes');
  assert.ok(b.includes('trick with the open ball') || b.includes('wouldn\'t open the ball'),
    'plasma.boss text references the open-ball choice');
  // Non-forking by construction: a `branches` read-back, never a `choice`. The global
  // no-fork contract is enforced authoritatively by story-choice-contract.test.js.
  assert.ok(b.includes('"branches"') && !b.includes('"choice"'),
    'plasma.boss read-back is a branches act, not a new choice');
});

test('flare.event6 carries the AZ tragic-mirror (a weapon fired once, grieved, Lysandre-ignored)', () => {
  const b = sceneBlock('villain.flare.event6');
  assert.ok(b.includes('I fired one once'), 'flare.event6 plants the long-lived weapon-bearer');
  assert.ok(b.includes('the page he skips') || b.includes('cautionary tale'),
    'flare.event6: Lysandre has stopped seeing him');
});

test('macroCosmos.boss cross-links the succession seed to the main loop (The First / perpetual)', () => {
  const b = sceneBlock('villain.macroCosmos.boss');
  assert.ok(b.includes('The First'), 'macroCosmos.boss names The First');
  assert.ok(b.includes('perpetual slot') || b.includes('succession plan'),
    'macroCosmos.boss ties back to the event5 succession seed');
});
