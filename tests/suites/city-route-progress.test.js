// City-hub journey route indicator (visual-polish PR).
//
// The hub conveyed progress only through badge pips. This adds a route track in
// the identity band: eight city nodes + a League node, with cleared cities
// filled, the current city pulsing, and future cities dimmed. It's a
// presentation-only element rendered alongside the badge pips from the same
// already-resolved cityIdx + sm.gymCleared — and it is NOT a button, so the
// city-hub-layout golden (which captures only buttons) is unaffected.
//
// Source-level guard (reads battle.html as text).
//
// Run: node --test tests/suites/city-route-progress.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HTML = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'battle.html'),
  'utf8'
);

test('the identity band contains a non-button route element', () => {
  assert.ok(/id="story-city-route"/.test(HTML), 'route container present in the city screen');
  // It must live inside the identity band, not the action-button column.
  const band = HTML.slice(HTML.indexOf('id="story-city-identity"'), HTML.indexOf('<div class="story-city-main-row">'));
  assert.ok(/id="story-city-route"/.test(band), 'route element sits in the identity band');
  assert.ok(!/story-city-route[^>]*<button/.test(band), 'route element is not a button');
});

test('the route renders eight city nodes + a League node from run state', () => {
  const i = HTML.indexOf("const _routeEl = document.getElementById('story-city-route')");
  assert.ok(i !== -1, 'route render block exists');
  const block = HTML.slice(i, i + 1500);
  assert.ok(/for \(let i = 1; i <= 8; i\+\+\)/.test(block), 'iterates the eight cities');
  assert.ok(/sm\.gymCleared/.test(block), 'cleared state keyed to gym progress');
  assert.ok(/i === \(cityIdx \| 0\)/.test(block), 'current node keyed to the active city');
  assert.ok(/story-route-league/.test(block), 'appends a League node');
});

test('the current node pulse is disabled under reduced motion', () => {
  assert.ok(/@keyframes storyRoutePulse/.test(HTML), 'pulse keyframe defined');
  assert.ok(/prefers-reduced-motion: reduce\s*\)\s*\{[^}]*story-route-node\.is-current[^}]*animation: none/.test(HTML),
    'current-node pulse is disabled under reduced motion');
});
