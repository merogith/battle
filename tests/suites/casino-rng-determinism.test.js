// Casino RNG determinism (2026-06): the four casino games (_casinoRollPrize /
// _slotsPickSymbol / casinoFlipSpin / casinoRoulSpin, plus the shared _randPick)
// previously rolled outcomes with bare Math.random(), so payouts were NOT part
// of the seeded story replay (CLAUDE.md: "never bare Math.random() for
// user-visible rolls"). They now route through _casinoRng(), which delegates to
// the seeded window.storyRngNext stream. This test locks that in: a future edit
// that reintroduces a bare Math.random() inside a casino roll will fail here.
// Run: node --test tests/suites/casino-rng-determinism.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const SRC = readFileSync('battle.html', 'utf8');

// Extract a function body by name via brace matching (battle.html is one file,
// so we can't import — we scan the source). Returns the text from the opening
// `function NAME(` through the matching closing brace.
function extractFn(src, name) {
  const start = src.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `function ${name} present in battle.html`);
  const braceOpen = src.indexOf('{', start);
  let depth = 0;
  for (let i = braceOpen; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error(`unbalanced braces scanning ${name}`);
}

// Strip line comments so the explanatory text in _casinoRng doesn't trip the
// bare-Math.random scan.
function stripComments(s) {
  return s.replace(/\/\/[^\n]*/g, '');
}

test('_casinoRng delegates to the seeded storyRngNext stream', () => {
  const body = extractFn(SRC, '_casinoRng');
  assert.match(body, /storyRngNext/, '_casinoRng must use window.storyRngNext');
});

for (const fn of ['_randPick', '_casinoRollPrize', '_slotsPickSymbol', 'casinoFlipSpin', 'casinoRoulSpin']) {
  test(`${fn} rolls outcomes through _casinoRng, not bare Math.random()`, () => {
    const body = stripComments(extractFn(SRC, fn));
    assert.equal(
      /Math\.random\s*\(/.test(body),
      false,
      `${fn} must not call Math.random() directly — route casino rolls through _casinoRng()`,
    );
    // Sanity: each of these either calls _casinoRng directly or via _randPick.
    assert.match(body, /_casinoRng\s*\(|_randPick\s*\(/, `${fn} should consume the seeded casino RNG`);
  });
}
