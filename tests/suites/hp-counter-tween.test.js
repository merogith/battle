// HP numeric readout tween (visual-polish PR).
//
// The HP bar already eases (width 0.8s ease-out) but the "cur/max" number
// snapped instantly, reading as a jump next to the sliding bar. _setHpText now
// counts the displayed number toward its target over ~0.6s. Critically it must
// SNAP (no rAF) under the jsdom harness, reduced motion, or when battle
// animations are off, so the DOM always lands on the exact final string that a
// reader — or the battle-driving suites that assert #player-hp-text — expect.
//
// Source-level guard (reads battle.html as text). The behavioural snap path is
// exercised by the existing battle suites (multihit-replay, hit-impact) which
// drive updateUI() under the harness and read the HP text.
//
// Run: node --test tests/suites/hp-counter-tween.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HTML = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'battle.html'),
  'utf8'
);

// Isolate the _setHpText body for assertions.
const fnStart = HTML.indexOf('function _setHpText(');
assert.ok(fnStart !== -1, '_setHpText helper must exist');
const body = HTML.slice(fnStart, fnStart + 2000);

test('the HP update site routes through _setHpText, not a raw innerText snap', () => {
  assert.ok(HTML.includes('_setHpText(el.hpText, mon.currentHp, mon.maxHp)'),
    'updateUI must call _setHpText for the HP readout');
  assert.ok(!/el\.hpText\.innerText\s*=\s*`\$\{mon\.currentHp\}/.test(HTML),
    'the old instant innerText snap must be gone');
});

test('_setHpText suppresses the tween under the jsdom harness', () => {
  assert.ok(/window\.__testHarness\s*!==\s*true/.test(body),
    'animation must be gated off when window.__testHarness === true');
});

test('_setHpText suppresses the tween under reduced motion and animations-off', () => {
  assert.ok(/settings\.animations\s*!==\s*false/.test(body),
    'animation must be gated on settings.animations');
  assert.ok(/StoryFx\.isReducedMotion\s*\(\s*\)/.test(body),
    'animation must be gated on StoryFx.isReducedMotion()');
});

test('_setHpText always lands on the exact target string (snap path + tween end)', () => {
  // Snap path assigns `target`; the tween end also assigns `target`.
  assert.ok(/const target = `\$\{cur\}\/\$\{max\}`/.test(body), 'builds an exact cur/max target');
  const assigns = (body.match(/node\.innerText\s*=\s*target/g) || []).length;
  assert.ok(assigns >= 2, 'target must be assigned on both the snap path and the tween-complete path');
});

test('_setHpText cancels any in-flight tween before starting a new one', () => {
  assert.ok(/cancelAnimationFrame\(node\._hpTweenRaf\)/.test(body),
    'a re-entrant call must cancel the previous rAF so counters never race');
});
