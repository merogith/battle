// Stage 0 — Story-facility chrome token layer (presentation-only).
//
// The repeated neutral inset-bevel, panel gradient, and accent glow on the
// .story-action-btn family were folded onto three :root tokens so there's a
// single source of truth:
//   --shadow-bevel, --grad-panel, --shadow-glow-accent.
//
// The pre-battle VS-splash (.vs2-pick-btn @ ~2890) shares the same literal bevel
// but is battle chrome, OUT OF the story-facility scope — it deliberately keeps
// its own literal. So this guard locks the STORY sites onto the token without
// asserting global uniqueness of the literal.
//
// Value-identical swap: no computed style changed, so the city-hub DOM golden is
// untouched. This test locks the migration so a later session can't re-inline.
//
// Source-level (reads battle.html as text) — no jsdom needed.
// Run: node --test tests/suites/story-shadow-tokens.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HTML = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'battle.html'),
  'utf8'
);

test('the three chrome tokens are defined in :root with their exact values', () => {
  assert.ok(
    /--shadow-bevel:\s*inset -2px -2px 0 0 #1a1d28, inset 2px 2px 0 0 #3a4050;/.test(HTML),
    '--shadow-bevel must carry the canonical neutral bevel value');
  assert.ok(
    /--grad-panel:\s*linear-gradient\(180deg, #1a1d2a 0%, #10121a 100%\);/.test(HTML),
    '--grad-panel must carry the canonical panel gradient');
  assert.ok(
    /--shadow-glow-accent:\s*0 0 10px rgba\(255,213,79,0\.28\);/.test(HTML),
    '--shadow-glow-accent must carry the canonical accent glow');
});

test('.story-action-btn base reads the bevel + gradient tokens, not the literals', () => {
  // Isolate the base rule block.
  const m = HTML.match(/\.story-action-btn \{[\s\S]*?\n\s{8}\}/);
  assert.ok(m, '.story-action-btn base rule must exist');
  const block = m[0];
  assert.ok(block.includes('background: var(--grad-panel);'),
    '.story-action-btn must read --grad-panel for its face');
  assert.ok(block.includes('box-shadow: var(--shadow-bevel);'),
    '.story-action-btn must read --shadow-bevel for its bevel');
  assert.ok(!/linear-gradient\(180deg, ?#1a1d2a/.test(block),
    'the .story-action-btn gradient literal must be gone');
  assert.ok(!/inset -2px -2px 0px? 0px? #1a1d28/.test(block),
    'the .story-action-btn bevel literal must be gone');
});

test('the city-grid hover + suggested states read the tokens', () => {
  assert.ok(HTML.includes('box-shadow: var(--shadow-bevel), 0 6px 16px rgba(0,0,0,0.45);'),
    '.story-action-btn:hover must compose --shadow-bevel');
  assert.ok(HTML.includes('box-shadow: var(--shadow-bevel), 0 0 0 1px rgba(255,213,79,0.18);'),
    '--suggested must compose --shadow-bevel');
  assert.ok(HTML.includes('box-shadow: var(--shadow-bevel), var(--shadow-glow-accent);'),
    '--suggested:hover must compose --shadow-bevel + --shadow-glow-accent');
});

test('the battle VS-splash literal is intentionally left untouched (scope boundary)', () => {
  assert.ok(
    HTML.includes('.vs2-pick-btn'),
    'the .vs2-pick-btn rule should still exist');
  // It keeps its own literal bevel — proves we did not reach into battle chrome.
  const m = HTML.match(/\.vs2-pick-btn \{[\s\S]*?\n\s{8}\}/);
  assert.ok(m && /inset -2px -2px 0 0 #1a1d28/.test(m[0]),
    '.vs2-pick-btn keeps its literal bevel (out of story scope)');
});
