// Phase 3A — Daycare visual unification (presentation-only).
//
// The Daycare Inn overlay was the one facility Phase 2 missed: it rendered with
// a bespoke green literal (#aed581) and an emoji header (🥚) instead of the
// shared --fac-* category palette + facility icon registry. Phase 3A folds it
// onto the canonical system:
//   • the local accent now reads the --fac-recover token (daycare lives under
//     the "recover" category in the city menu),
//   • the overlay header uses the registry egg icon (storyFacilityIconHtml),
//     not a raw 🥚,
//   • the egg-event / idle narrative scenes carry the same token accent.
//
// No flow branch, save field, or RNG call changed — the diff is markup/CSS.
// This guard locks the migration so a later session can't silently re-introduce
// the magic hue or the emoji header.
//
// Source-level (reads battle.html as text) — no jsdom needed.
//
// Run: node --test tests/suites/story-daycare-facility-tokens.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HTML = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'battle.html'),
  'utf8'
);

test('--fac-recover is the green token daycare adopts', () => {
  assert.ok(/--fac-recover:\s*#81c784/.test(HTML),
    '--fac-recover must be defined in :root');
});

test('the daycare overlay accent reads the --fac-recover token, not the #aed581 literal', () => {
  assert.match(HTML, /\.story-daycare-card\s*\{[^}]*border:\s*1px solid var\(--fac-recover\)/);
  assert.match(HTML, /\.story-daycare-header h2\s*\{[^}]*color:\s*var\(--fac-recover\)/);
});

test('the overlay header uses the registry egg icon, not a raw 🥚', () => {
  assert.match(HTML, /<h2>\$\{storyFacilityIconHtml\('daycare', \{ size: 18, cls: '' \}\)\}Daycare Inn<\/h2>/);
});

test('available trade buttons use the recover token', () => {
  const available = HTML.match(/\.story-daycare-partner button:enabled\s*\{([^}]+)\}/)?.[1];
  assert.match(available, /(?:^|;)\s*color:\s*var\(--fac-recover\)/);
  assert.match(available, /border-color:\s*var\(--fac-recover\)/);
});

test('the egg-event and idle scenes carry the token accent', () => {
  // The one-time drop-off narrative (sensitive flow) — accent only, no branch.
  assert.ok(/\{ accent:'var\(--fac-recover\)', title:'Daycare Inn', html:`You set/.test(HTML),
    'the drop-off scene beat must use the token accent');
  assert.ok(/\{ id:'end', accent:'var\(--fac-recover\)'/.test(HTML),
    'the egg-received scene beat must use the token accent');
  assert.ok(/_daycareScene\(\[\{ accent:'var\(--fac-recover\)', title:'Daycare Inn', html \}\], null, 'story-daycare-idle'\)/.test(HTML),
    'the idle scene must use the token accent');
});
