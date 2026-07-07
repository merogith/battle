// In-city dialogue reveal — hub quote box parity with the narrative overlay.
//
// The full-screen narrative overlay had a typewriter reveal + entrance; the
// in-city hub quote box just wrote textContent instantly. _cityQuoteReveal
// brings the hub box toward parity: an entrance rise + a typewriter re-type,
// reusing the overlay's gate. It writes the FULL text synchronously first so
// the jsdom harness (and the city golden/arrival suites that read the quote)
// always see the complete line; the animated re-type runs only in a real
// browser and is suppressed under the harness, reduced motion, or when the
// Story text-reveal setting is off.
//
// Source-level guard (reads battle.html as text).
//
// Run: node --test tests/suites/city-dialogue-reveal.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HTML = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'battle.html'),
  'utf8'
);

const i = HTML.indexOf('function _cityQuoteReveal(');
assert.ok(i !== -1, '_cityQuoteReveal must exist');
const body = HTML.slice(i, i + 1500);

test('the city quote is rendered through _cityQuoteReveal, not a raw textContent set', () => {
  assert.ok(/if \(quoteEl\) _cityQuoteReveal\(quoteEl, quoteText\)/.test(HTML),
    'renderCityActions must route the quote through _cityQuoteReveal');
  assert.ok(!/if \(quoteEl\) quoteEl\.textContent = quoteText;/.test(HTML),
    'the old instant textContent set must be gone');
});

test('_cityQuoteReveal writes the full text synchronously before any animation', () => {
  // First statement after the guard must assign the complete text.
  assert.ok(/if \(!el\) return;\s*el\.textContent = text;/.test(body),
    'full text is set synchronously first (harness / a11y safe)');
});

test('_cityQuoteReveal shares the overlay gate (harness / setting / reduced motion)', () => {
  assert.ok(/window\.__testHarness\s*!==\s*true/.test(body), 'suppressed under the jsdom harness');
  assert.ok(/settings\.storyTypewriter\s*!==\s*false/.test(body), 'honors the Story text-reveal setting');
  assert.ok(/StoryFx\.isReducedMotion\s*\(\s*\)/.test(body), 'honors reduced motion');
});

test('the entrance keyframe exists and is reduced-motion gated', () => {
  assert.ok(/@keyframes storyCityQuoteIn/.test(HTML), 'entrance keyframe defined');
  assert.ok(/\.story-city-quote-in\s*\{\s*animation: storyCityQuoteIn/.test(HTML), 'entrance class wired');
  assert.ok(/prefers-reduced-motion: reduce\s*\)\s*\{\s*\.story-city-quote-in\s*\{\s*animation: none/.test(HTML),
    'entrance is disabled under reduced motion');
});
