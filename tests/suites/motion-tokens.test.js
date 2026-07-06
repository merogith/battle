// Motion foundation — easing + duration token scale (visual-polish PR).
//
// The design layer had only two duration tokens (--dur-fast, --dur-med) and
// zero easing tokens; ~30+ animations hand-inlined cubic-bezier() literals.
// This sweep added a named ramp so new motion pulls from one vocabulary:
//   • --dur-slow rounds out the duration tier (fast < med < slow),
//   • four --ease-* curves cover entrance / exit / move / pop intent.
//
// This guard locks the tokens in :root so a later session can't drop them or
// let the duration tier drift out of order. Source-level (reads battle.html as
// text) — no jsdom needed.
//
// Run: node --test tests/suites/motion-tokens.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HTML = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'battle.html'),
  'utf8'
);

const durSeconds = (name) => {
  const m = HTML.match(new RegExp('--dur-' + name + ':\\s*([0-9.]+)s'));
  assert.ok(m, `--dur-${name} must be defined in :root`);
  return Number(m[1]);
};

test('the three duration tokens exist and ascend: fast < med < slow', () => {
  const fast = durSeconds('fast');
  const med = durSeconds('med');
  const slow = durSeconds('slow');
  assert.ok(fast < med, `--dur-fast (${fast}) must be < --dur-med (${med})`);
  assert.ok(med < slow, `--dur-med (${med}) must be < --dur-slow (${slow})`);
});

test('the four --ease-* curves are defined as cubic-bezier tokens', () => {
  for (const name of ['out-quart', 'in-quart', 'in-out', 'back']) {
    const re = new RegExp('--ease-' + name + ':\\s*cubic-bezier\\(');
    assert.ok(re.test(HTML), `--ease-${name} must be defined as a cubic-bezier() token in :root`);
  }
});

test('the --ease-back curve overshoots (its 2nd control-point y > 1)', () => {
  // A spring/pop curve is the one easing whose value leaves the [0,1] box.
  const m = HTML.match(/--ease-back:\s*cubic-bezier\(\s*[0-9.]+\s*,\s*([0-9.]+)\s*,/);
  assert.ok(m, '--ease-back must be a cubic-bezier');
  assert.ok(Number(m[1]) > 1, '--ease-back should overshoot (y1 > 1) to read as a spring');
});
