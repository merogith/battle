// Stage 5 — Inline-style → class cleanup (two self-contained clusters).
//
// 5a Catch/Safari ball buttons: the static chrome (flex layout, padding, bg,
//    font) moved into a .story-catch-ball base rule. Only the data-driven accent
//    (color:${display.color}, and the disabled opacity/cursor) stays inline.
//    border:1px solid currentColor tracks the inline colour, so the look is
//    unchanged from the old all-inline button.
// 5b Shop card: the inline <div style="flex:1;min-width:0"> wrapper became
//    .story-shop-item-main. The data-driven buy-button colour stays inline.
//
// The bag-item DOM builder and the other ~1,300 inline styles are intentionally
// left alone.
//
// Source-level guard. Run: node --test tests/suites/story-inline-style-cleanup.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HTML = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'battle.html'),
  'utf8'
);

test('5a — .story-catch-ball base rule carries the static chrome', () => {
  const m = HTML.match(/\.story-catch-ball \{[\s\S]*?\}/);
  assert.ok(m, '.story-catch-ball base rule must exist');
  assert.ok(/justify-content:space-between/.test(m[0]) && /background:rgba\(20,28,40,0\.6\)/.test(m[0]),
    'static layout + background moved into the base rule');
  assert.ok(/border:1px solid currentColor/.test(m[0]),
    'border tracks the inline colour via currentColor');
});

test('5a — the ball button render no longer inlines the static chrome', () => {
  const m = HTML.match(/<button[^>]*class="story-catch-ball\$\{masterCls\}"[^>]*>/);
  assert.ok(m, 'the ball button must still render');
  assert.ok(!/justify-content:space-between/.test(m[0]),
    'static layout must be gone from the inline style');
  assert.ok(/color:\$\{display\.color\}/.test(m[0]),
    'the data-driven accent colour stays inline');
});

test('5b — shop card uses .story-shop-item-main instead of the inline wrapper', () => {
  assert.ok(/\.story-shop-item-main \{ flex: 1; min-width: 0; \}/.test(HTML),
    '.story-shop-item-main rule defined');
  assert.ok(HTML.includes('<div class="story-shop-item-main">'),
    'the card uses the class wrapper');
  // The buy button keeps its data-driven colour inline.
  assert.ok(/class="story-shop-buy-btn"[\s\S]*?color:\$\{buyColor\}/.test(HTML),
    'buy button keeps its inline data-driven colour');
});

test('the bag-item builder is left untouched', () => {
  // The city bag still builds items via the dynamic DOM path (.story-bag-item),
  // which this stage does not convert.
  assert.ok(/\.story-bag-item/.test(HTML), '.story-bag-item path still present');
});
