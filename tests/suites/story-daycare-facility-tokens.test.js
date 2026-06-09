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
  assert.ok(HTML.includes("const accent = 'var(--fac-recover)';"),
    "_daycareRenderHTML must set accent = var(--fac-recover)");
  assert.ok(!HTML.includes("const accent = '#aed581';"),
    "the bespoke #aed581 daycare accent literal must be gone");
});

test('the overlay header uses the registry egg icon, not a raw 🥚', () => {
  assert.ok(HTML.includes("storyFacilityIconHtml('daycare', { size: 18, cls: '' })"),
    'daycare header must render the registry icon via storyFacilityIconHtml');
  assert.ok(HTML.includes('<span>Daycare Inn</span>'),
    'daycare header text must sit beside the icon in its own span');
  assert.ok(!HTML.includes('>🥚 Daycare Inn</div>'),
    'the raw 🥚 header literal must be gone');
});

test('the Drop Off button tracks the recover token', () => {
  assert.ok(HTML.includes("color:${canDrop?'var(--fac-recover)':'#555'}"),
    'the Drop Off button colour must read the recover token');
  assert.ok(HTML.includes("border:1px solid ${canDrop?'var(--fac-recover)':'#444'}"),
    'the Drop Off button border must read the recover token');
});

test('the egg-event and idle scenes carry the token accent', () => {
  // The one-time drop-off narrative (sensitive flow) — accent only, no branch.
  assert.ok(/\{ accent:'var\(--fac-recover\)', title:'Daycare Inn', html:`You set/.test(HTML),
    'the drop-off scene beat must use the token accent');
  assert.ok(/\{ id:'end', accent:'var\(--fac-recover\)'/.test(HTML),
    'the egg-received scene beat must use the token accent');
  assert.ok(/_storyScene\(\[\{ accent:'var\(--fac-recover\)', title:'Daycare Inn', html \}\]/.test(HTML),
    'the idle scene must use the token accent');
});
