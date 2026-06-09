// Bark layer wiring (data/dialogue/barks.json → battle log). Stream 2 §8 follow-up.
// Proves: (1) the loader pulls barks.json into BARK_POOLS end-to-end (integration),
// (2) the _emitBark helper is story-gated + seeded + crash-safe, and (3) the four
// call sites are wired with the right event keys + guards (source).
//
// Note: a "does a bark appear mid-battle" assertion would need a seeded story battle
// run to a faint — the helper reads the module-scoped `state` (not window-exposed),
// so it can't be driven from outside the engine. Source + integration cover the
// wiring; the firing conditions are pinned by the call-site assertions below.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEngine } from '../helpers/load-engine.js';

const HTML = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'battle.html'), 'utf8'
);

test('loader pulls barks.json into BARK_POOLS (end-to-end)', async () => {
  const eng = await loadEngine();
  const b = eng.window.BARK_POOLS || {};
  for (const k of ['playerLastFaint', 'foeLastFaint', 'fledRoad', 'critKO']) {
    assert.ok(Array.isArray(b[k]) && b[k].length >= 1, `BARK_POOLS.${k} loaded`);
  }
  assert.equal(typeof eng.window._emitBark, 'function', '_emitBark helper exposed');
});

test('_emitBark is story-gated, seeded, and crash-safe', () => {
  const m = HTML.match(/window\._emitBark = function[\s\S]*?\n        };/);
  assert.ok(m, '_emitBark helper present');
  const src = m[0];
  assert.ok(/state\.mode !== 'story'/.test(src), 'gated to story battles (no barks in quick-play/gauntlet/pvp)');
  assert.ok(/storyRngNext/.test(src), 'uses the seeded RNG (deterministic replays)');
  assert.ok(/logMsg\(line/.test(src), 'appends via logMsg (additive, never replaces a line)');
  assert.ok(/try\s*\{[\s\S]*\}\s*catch/.test(src), 'wrapped so a bark can never break a battle');
});

test('the four events are wired at the right sites', () => {
  // flee — directly after the canonical "You fled!" line
  assert.ok(/logMsg\("You fled!", "dmg"\); _emitBark\('fledRoad'\);/.test(HTML),
    'fledRoad fires right after the flee line');
  // win — both last-foe paths (simultaneous-KO + single-faint blocks are byte-identical)
  assert.equal((HTML.match(/_emitBark\('foeLastFaint'\)/g) || []).length, 2,
    'foeLastFaint on both VICTORY paths');
  // loss — the last-player-down path, before the GAME OVER screen
  assert.ok(/_emitBark\('playerLastFaint'\);\n\s*state\.isOver = true;/.test(HTML),
    'playerLastFaint on the loss path');
  // crit-KO — guarded by isPlayer + actual KO + NOT-the-last-foe, so it never
  // double-barks with foeLastFaint on a finishing crit
  const crit = HTML.match(
    /if \(isPlayer && defender\.currentHp <= 0 && state\.foeParty\.some\(m => m\.currentHp > 0 && m !== defender\)\) _emitBark\('critKO'\);/g
  ) || [];
  assert.equal(crit.length, 2, 'critKO wired at both crit sites with the non-last-foe guard');
});
