// Stage 3 — Mon-card shared CSS shell (presentation consolidation, alias-only).
//
// The expandable Pokémon card was already mostly one implementation: the facility
// headers render through storyMonTileMain() + .story-tutor-mon-toggle at 40px. This
// stage:
//   • adds BEM aliases .story-mon-card / __head / __body grouped onto the existing
//     .story-tutor-mon / -toggle / -body rules (old strings keep working),
//   • removes the dead .story-link-mon-header* rules (no element emits them) — which
//     also retires the stale 56px sprite rule,
//   • formalises Link's frame as the .story-mon-card--link variant.
//
// It does NOT merge the six headers into one function (each keeps its
// facility-specific body + buildPokemon perf short-circuit). Existing mon-card DOM
// goldens (story-tutor-card-snapshot, story-pc-party-card) must still pass unchanged.
//
// Source-level guard. Run: node --test tests/suites/story-mon-card-shell.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HTML = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'battle.html'),
  'utf8'
);

test('the BEM shell aliases are grouped onto the existing chrome rules', () => {
  assert.ok(HTML.includes('.story-tutor-mon, .story-mon-card {'),
    '.story-mon-card aliases .story-tutor-mon');
  assert.ok(HTML.includes('.story-tutor-mon-toggle, .story-mon-card__head {'),
    '__head aliases -toggle');
  assert.ok(/\.story-tutor-mon-body, \.story-mon-card__body \{/.test(HTML),
    '__body aliases -body');
  assert.ok(/\.story-link-mon, \.story-mon-card--link \{ border:1px solid #333/.test(HTML),
    '--link variant keeps the #333 frame');
});

test('the dead .story-link-mon-header rules are gone', () => {
  // The only surviving mentions are in the explanatory comment, never as a selector.
  assert.ok(!/\n\s*\.story-link-mon-header[ .>{]/.test(HTML),
    'no .story-link-mon-header CSS rule may remain');
  assert.ok(!/\.story-link-mon-header img \{/.test(HTML),
    'the stale 56px link-sprite rule must be gone');
});

test('all facility headers still render through storyMonTileMain at 40px', () => {
  // storyMonTileMain: 1 definition + the per-facility callers.
  const calls = (HTML.match(/storyMonTileMain\(/g) || []).length;
  assert.ok(calls >= 7, `expected the shared tile helper to drive the headers (saw ${calls})`);
  // No facility sprite may drift back to the old 48/42 sizes.
  assert.ok(!/width:48px;height:48px/.test(HTML), 'no 48px facility sprite');
  assert.ok(!/width:42px;height:42px/.test(HTML), 'no 42px facility sprite');
  // The toggle class is still the shared header for the facility cards.
  for (const fac of ['link', 'evolab', 'colress', 'fanclub', 'evtrainer']) {
    assert.ok(HTML.includes(`data-facility="${fac}"`), `${fac} still uses the shared toggle`);
  }
});
