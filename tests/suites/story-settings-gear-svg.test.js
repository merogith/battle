// Stage 4 — Story settings gear ⚙ → inline SVG (device-independent glyph).
//
// The two STORY settings buttons (.icon-btn.settings-btn on the menu, and
// .story-hud-settings on the city HUD) rendered a raw ⚙ emoji, which draws
// differently per OS font — the exact thing uiSvgCheck/uiSvgX were introduced to
// fix. They now render the uiSvgGear cog. The BATTLE settings button
// (.battle-settings-btn) is battle chrome and is intentionally left untouched.
// Prose mentions of ⚙ (hint text, "⚙ Manage" relic label) are also left as-is.
//
// Source-level guard. Run: node --test tests/suites/story-settings-gear-svg.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HTML = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'battle.html'),
  'utf8'
);

test('uiSvgGear helper is defined alongside uiSvgX', () => {
  assert.ok(/window\.uiSvgGear = function\(size\)\{/.test(HTML), 'uiSvgGear must be defined');
});

test('the two story settings buttons render the SVG cog, not ⚙', () => {
  const menuBtn = HTML.match(/<button class="icon-btn settings-btn"[^>]*>[\s\S]*?<\/button>/);
  assert.ok(menuBtn, 'menu settings button exists');
  assert.ok(/<svg class="ui-glyph"/.test(menuBtn[0]) && !menuBtn[0].includes('⚙'),
    'menu settings button must use the SVG cog, not the emoji');

  const hudBtn = HTML.match(/<button type="button" class="story-hud-settings"[^>]*>[\s\S]*?<\/button>/);
  assert.ok(hudBtn, 'HUD settings button exists');
  assert.ok(/<svg class="ui-glyph"/.test(hudBtn[0]) && !hudBtn[0].includes('⚙'),
    'HUD settings button must use the SVG cog, not the emoji');
});

test('the battle settings button is left untouched (out of scope)', () => {
  const battleBtn = HTML.match(/<button type="button" class="battle-settings-btn"[^>]*>[\s\S]*?<\/button>/);
  assert.ok(battleBtn, 'battle settings button exists');
  assert.ok(battleBtn[0].includes('⚙'),
    '.battle-settings-btn keeps its own glyph (battle chrome)');
});
