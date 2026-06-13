// Stage 1 — Unified story button system (presentation consolidation).
//
// The two genuine near-duplicate secondary buttons (.story-tutor-btn and
// .story-link-btn — which previously differed only in border colour / radius /
// background) are folded onto one .story-btn base so the story UI has a single
// secondary-button look. A modifier set (--sm/--md/--full/--active/--primary)
// is the canonical vocabulary for new code; --primary matches the shop Buy
// button family so prominent CTAs read consistently.
//
// Intentionally NOT folded:
//   • .story-shop-buy-btn — a distinct PRIMARY role (its inline data-driven
//     colour assumes a dark face); kept prominent, not a duplicate.
//   • .story-action-btn — the city-menu nav idiom (square, left-stripe ::before).
//
// Source-level guard. Run: node --test tests/suites/story-button-system.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HTML = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'battle.html'),
  'utf8'
);

test('.story-btn base + modifier vocabulary is defined', () => {
  assert.ok(/\.story-btn \{ font-size: 11px; padding: 5px 9px; \}/.test(HTML), '.story-btn base');
  assert.ok(/\.story-btn--sm \{/.test(HTML), '--sm modifier');
  assert.ok(/\.story-btn--md \{/.test(HTML), '--md modifier');
  assert.ok(/\.story-btn--full \{/.test(HTML), '--full modifier');
  assert.ok(/\.story-btn--active \{/.test(HTML), '--active modifier');
  assert.ok(/\.story-btn--primary \{/.test(HTML), '--primary modifier');
});

test('the shared base selector folds tutor + link onto .story-btn', () => {
  assert.ok(
    HTML.includes('.story-btn, .story-tutor-btn, .story-link-btn {'),
    'tutor + link must share the .story-btn base block');
  assert.ok(
    /\.story-btn:hover:not\(:disabled\),\s*\.story-tutor-btn:hover:not\(:disabled\),\s*\.story-link-btn:hover:not\(:disabled\) \{/.test(HTML),
    'tutor + link must share the base hover');
  assert.ok(
    HTML.includes('.story-btn:disabled, .story-tutor-btn:disabled, .story-link-btn:disabled {'),
    'tutor + link must share the base disabled');
});

test('.story-link-btn no longer carries its old divergent look', () => {
  // It should keep only a compact size delta now.
  assert.ok(/\.story-link-btn \{ font-size:10px; padding:4px 8px; \}/.test(HTML),
    '.story-link-btn must be a size-only delta');
  assert.ok(!/\.story-link-btn \{[^}]*border:1px solid #444/.test(HTML),
    'the old link border:#444 must be gone');
  assert.ok(!/\.story-link-btn \{[^}]*border-radius:3px/.test(HTML),
    'the old link border-radius:3px must be gone');
});

test('the Buy CTA and city-menu button keep their distinct identities', () => {
  assert.ok(/\.story-shop-buy-btn \{/.test(HTML), '.story-shop-buy-btn primary role kept');
  // .story-action-btn keeps its square nav idiom + left-stripe.
  assert.ok(HTML.includes('border: 2px solid #4a4f5e; border-radius: 0 !important;'),
    '.story-action-btn keeps border-radius:0');
  assert.ok(/\.story-action-btn[^{]*::before/.test(HTML),
    '.story-action-btn keeps its ::before stripe');
});
