import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../../battle.html', import.meta.url), 'utf8');

test('the city guide updates its live region only when the full line changes', () => {
  assert.match(html, /id="story-city-quote" aria-live="polite"/);
  assert.match(html, /if \(quoteEl && quoteEl\.textContent !== quoteText\) quoteEl\.textContent = quoteText;/);
});

test('story typewriter remains available for dialogue scenes', () => {
  assert.match(html, /settings\.storyTypewriter !== false/);
  assert.match(html, /function _renderNarrativeOverlay\(/);
});
