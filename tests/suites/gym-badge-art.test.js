// Gym-badge art — original SVG medallions + journal badge case (visual-polish PR).
//
// The victory medallion showed a 🏅 emoji and the journal showed only a
// "N / 8 earned" line. This replaces both with eight distinct original
// geometric badge SVGs (not reproductions of any existing badge art): the
// earned badge fills the victory medallion, and the journal renders an 8-slot
// badge case (earned filled, rest dim). The victory-overlay tests still lock
// the .story-victory-v2-medallion class + "Badge N of 8" line — this only
// swaps the medallion's inner glyph.
//
// Source-level guard (reads battle.html as text).
//
// Run: node --test tests/suites/gym-badge-art.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HTML = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'battle.html'),
  'utf8'
);

test('eight distinct badge shapes are defined with an accent colour each', () => {
  const i = HTML.indexOf('const _GYM_BADGE_DEFS = [');
  assert.ok(i !== -1, '_GYM_BADGE_DEFS must exist');
  const block = HTML.slice(i, HTML.indexOf('];', i));
  const colours = block.match(/c:\s*'#[0-9a-fA-F]{6}'/g) || [];
  assert.equal(colours.length, 8, 'exactly eight badges');
  assert.equal(new Set(colours).size, 8, 'each badge has a distinct accent colour');
  // Shape variety: at least a few distinct silhouette kinds so they don't all read alike.
  const kinds = new Set((block.match(/s:\s*'(\w+)'/g) || []));
  assert.ok(kinds.size >= 3, 'badges use at least three distinct shape kinds');
});

test('_gymBadgeSvg emits inline SVG and dims un-earned slots', () => {
  const i = HTML.indexOf('function _gymBadgeSvg(');
  assert.ok(i !== -1, '_gymBadgeSvg must exist');
  const body = HTML.slice(i, i + 700);
  assert.ok(/<svg class="gym-badge-svg"/.test(body), 'returns an inline <svg>');
  assert.ok(/earned \?/.test(body), 'branches on earned vs locked');
  assert.ok(/opacity:0\.55/.test(body), 'un-earned slot is dimmed');
});

test('the victory medallion uses the earned badge SVG for gym events', () => {
  assert.ok(/isGymBadgeEvent \? _gymBadgeSvg\(\(sm\.badges \| 0\) - 1, true\)/.test(HTML),
    'gym-badge wins render _gymBadgeSvg of the just-earned index');
  assert.ok(/story-victory-v2-medallion/.test(HTML), 'the locked medallion class is preserved');
});

test('the journal renders an eight-slot badge case', () => {
  assert.ok(/class="story-badge-case"/.test(HTML), 'badge case container present');
  assert.ok(/_bi < 8/.test(HTML), 'iterates eight slots');
  assert.ok(/_bi < \(sm\.badges \| 0\)/.test(HTML), 'earned state keyed to badge count');
  assert.ok(/\.story-badge-case\s*\{[^}]*grid-template-columns:\s*repeat\(8/.test(HTML),
    'badge case is laid out as an 8-column grid');
});
