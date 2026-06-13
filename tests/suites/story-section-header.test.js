// Stage 2 — Canonical section header (presentation consolidation).
//
// The shop category strap (.story-shop-section-head + its ::after divider +
// .story-shop-section-count) is promoted to a reusable .story-section-header
// with modifiers (--grid, --divider, __count). The old class is kept as a CSS
// alias so existing markup still works; the live shop caller emits the new
// canonical classes. The distinct .story-tutor-section-title FIELD-LABEL role is
// intentionally NOT folded.
//
// Source-level guard. Run: node --test tests/suites/story-section-header.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HTML = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'battle.html'),
  'utf8'
);

test('.story-section-header canonical + modifiers are defined', () => {
  assert.ok(HTML.includes('.story-section-header, .story-shop-section-head {'),
    'canonical strap aliases the legacy class');
  assert.ok(/\.story-section-header--grid/.test(HTML), '--grid modifier');
  assert.ok(/\.story-section-header--divider::after/.test(HTML), '--divider modifier');
  assert.ok(/\.story-section-header__count/.test(HTML), '__count element');
});

test('the live shop caller emits the canonical classes', () => {
  assert.ok(
    HTML.includes('<div class="story-section-header story-section-header--grid story-section-header--divider">'),
    'the section caller must use the new canonical strap');
  assert.ok(
    HTML.includes('<span class="story-section-header__count">'),
    'the count badge must use __count');
});

test('the tutor field-label role is left intact (not folded)', () => {
  assert.ok(/\.story-tutor-section-title \{ font-size:10px; color:#8b92a4;/.test(HTML),
    '.story-tutor-section-title stays a distinct label role');
});
