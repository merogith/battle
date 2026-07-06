// Per-type emblem glyphs — CSS-only mask layer on .type-badge (visual-polish PR).
//
// Types were text/colour chips only. This adds an original solid-fill SVG emblem
// per type, applied as a ::before mask in currentColor so it reads on any chip
// background. It's a pseudo-element + custom property, so type-chip innerHTML is
// untouched (the story-card-tile / story-pc-party-card golden snapshots still
// pass unchanged). Glyphs are original geometric shapes, base64-encoded so no
// data-URI escaping can corrupt them.
//
// Source-level guard (reads battle.html as text): every type has a well-formed
// glyph and the mask plumbing is present.
//
// Run: node --test tests/suites/type-emblem-glyphs.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HTML = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'battle.html'),
  'utf8'
);

const TYPES = ['Normal','Fire','Water','Grass','Electric','Ice','Fighting','Poison',
  'Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon','Dark','Steel','Fairy'];

test('.type-badge::before renders a currentColor mask glyph', () => {
  assert.ok(/\.type-badge::before\{[^}]*background-color:currentColor/.test(HTML),
    '::before must paint currentColor');
  assert.ok(/\.type-badge::before\{[^}]*mask:var\(--tg\)/.test(HTML),
    '::before must mask via the per-type --tg variable');
});

test('all 18 types define a --tg glyph as a base64 SVG data URI', () => {
  for (const t of TYPES) {
    const m = HTML.match(new RegExp('\\.type-' + t + '\\{--tg:url\\("data:image/svg\\+xml;base64,([A-Za-z0-9+/=]+)"\\)'));
    assert.ok(m, `type ${t} must define a base64 --tg glyph`);
    const svg = Buffer.from(m[1], 'base64').toString('utf8');
    assert.ok(svg.startsWith('<svg') && svg.includes('</svg>'), `type ${t} glyph must decode to valid SVG`);
    // Solid-fill only — no strokes / evenodd holes that could mask into a broken box.
    assert.ok(!/stroke=/.test(svg), `type ${t} glyph must be solid-fill (no strokes) for a clean mask`);
  }
});

test('the 18 glyphs are distinct (no accidental copy-paste duplication)', () => {
  const uris = TYPES.map((t) => {
    const m = HTML.match(new RegExp('\\.type-' + t + '\\{--tg:url\\("([^"]+)"\\)'));
    return m && m[1];
  });
  assert.equal(new Set(uris).size, 18, 'every type has a unique glyph');
});
