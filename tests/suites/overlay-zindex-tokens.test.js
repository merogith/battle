// §6 Story Overlay Unification — z-index token contract (PR1: tokenization sweep).
//
// This sweep collapsed every story-overlay z-index literal onto the --sn-z-*
// scale defined in :root. The value-aligned sites (most overlays) are a pure
// behaviour-preserving swap — each already painted at its tier's numeric value.
// Two formerly off-scale narrative overlays (_storyScene z10000,
// _daycareOpenDropOff z9990) were also folded onto the overlay tier; they live
// in the city hub and never co-occur with the spotlight-tier battle cards, so
// their stacking order is unchanged in practice. Removing the literals kills the
// ad-hoc collisions ("overlay paints behind/over the wrong thing").
//
// This guard locks that migration so a later session can't silently
// re-introduce a literal or drift the scale:
//   • the five tokens exist at the documented tiers,
//   • the scale is strictly ascending (scrim < battle-banner < overlay <
//     spotlight < toast),
//   • each migrated overlay references its token (and the old literal is gone).
//
// Source-level (reads battle.html as text) — no jsdom needed. The companion
// DOM assertion ("the live canonical overlay carries --sn-z-overlay") lives in
// tests/integration/story-narration-system.test.js.
//
// Run: node --test tests/suites/overlay-zindex-tokens.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HTML = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'battle.html'),
  'utf8'
);

const TIERS = {
  'scrim': 1200,
  'battle-banner': 9000,
  'overlay': 9998,
  'spotlight': 9999,
  'toast': 10001,
};

const tokenValue = (name) => {
  const m = HTML.match(new RegExp('--sn-z-' + name + ':\\s*(\\d+)'));
  assert.ok(m, `--sn-z-${name} must be defined in :root`);
  return Number(m[1]);
};

test('the five --sn-z-* tokens are defined at the documented tiers', () => {
  for (const [name, val] of Object.entries(TIERS)) {
    assert.equal(tokenValue(name), val, `--sn-z-${name} tier value`);
  }
});

test('the z-scale is strictly ascending: scrim < battle-banner < overlay < spotlight < toast', () => {
  const order = ['scrim', 'battle-banner', 'overlay', 'spotlight', 'toast'].map(tokenValue);
  for (let i = 1; i < order.length; i++) {
    assert.ok(order[i] > order[i - 1],
      `${order[i]} (tier ${i}) must sit strictly above ${order[i - 1]} (tier ${i - 1})`);
  }
});

// Each row: a unique fragment that MUST be present (token form), and an
// optional pre-migration literal fragment that MUST now be absent.
const MIGRATED = [
  ['z-index: var(--sn-z-scrim);', 'z-index: 1200;', '.modal scrim'],
  ['z-index: var(--sn-z-toast);', 'z-index: 15000;', '#toast-host container'],
  ['letter-spacing:0.06em;z-index:var(--sn-z-toast);', null, '_maybeShowSaveToast pill'],
  ['z-index: var(--sn-z-battle-banner);', null, '.gimmick-banner'],
  // overlay tier (9998)
  ['background:#000;z-index:var(--sn-z-overlay);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px', null, '_showCityArrivalScreen'],
  ['background:#000;z-index:var(--sn-z-overlay);display:flex;flex-direction:column;align-items:center;justify-content:safe center;overflow-y:auto;gap:18px;padding:20px', null, 'city0 cold-open (enterCity)'],
  ['height:100%;z-index:var(--sn-z-overlay);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px;box-sizing:border-box;background:linear-gradient', null, '_showWanderScreen'],
  // overlay tier — formerly off-scale (z10000 / z9990), folded onto the scale here
  ['background:rgba(0,0,0,0.93);z-index:var(--sn-z-overlay);display:flex;align-items:safe center;justify-content:safe center;padding:20px;overflow-y:auto;', 'rgba(0,0,0,0.93);z-index:10000', '_storyScene engine (was z10000)'],
  ['background:rgba(0,0,0,0.92);z-index:var(--sn-z-overlay);display:flex;align-items:safe center;justify-content:safe center;padding:20px;overflow-y:auto;', 'rgba(0,0,0,0.92);z-index:9990', '_daycareOpenDropOff (was z9990)'],
  // spotlight tier (9999)
  ['z-index:var(--sn-z-spotlight);pointer-events:none;opacity:0;', null, '_showBossBanner'],
  ['background:rgba(0,0,0,0.93);z-index:var(--sn-z-spotlight);', null, '_showFirstSightingLoreOverlay'],
  ['background:rgba(0,0,0,0.92);z-index:var(--sn-z-spotlight);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;', null, 'showBattleIntro'],
  ['background:rgba(0,0,0,0.92);z-index:var(--sn-z-spotlight);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;', null, 'showVictoryOverlay'],
  ['height:100%;z-index:var(--sn-z-spotlight);display:flex;flex-direction:column;align-items:center;justify-content:center;box-sizing:border-box;padding:max(16px', null, 'showHallOfFame grid'],
];

test('every migrated story overlay references its --sn-z-* token', () => {
  for (const [present, , label] of MIGRATED) {
    assert.ok(HTML.includes(present), `${label}: expected token fragment is present`);
  }
});

test('no migrated story overlay still carries its old z-index literal', () => {
  for (const [, absent, label] of MIGRATED) {
    if (absent) assert.ok(!HTML.includes(absent), `${label}: stale literal "${absent}" must be gone`);
  }
});

test('the migrated CSS-class overlays sit on the overlay tier via the token', () => {
  for (const cls of ['story-tutorial-overlay', 'storyfx-evo-overlay', 'story-legend-sighting']) {
    const re = new RegExp('\\.' + cls + '\\s*\\{[\\s\\S]*?z-index: var\\(--sn-z-overlay\\);');
    assert.ok(re.test(HTML), `.${cls} must use var(--sn-z-overlay)`);
  }
});

test('the casino celebration overlays sit on the scale (jackpot below the prize reveal)', () => {
  // Jackpot is the full-screen backdrop (overlay tier); the prize-reveal card
  // rides above it on the spotlight tier — the casino's "victory card". The
  // relative order (jackpot below prize) matches the old 9000 < 9100 layering.
  assert.ok(/\.casino-jackpot-overlay\s*\{[\s\S]*?z-index: var\(--sn-z-overlay\);/.test(HTML),
    '.casino-jackpot-overlay must use var(--sn-z-overlay)');
  assert.ok(/\.casino-prize-banner\s*\{[\s\S]*?z-index: var\(--sn-z-spotlight\);/.test(HTML),
    '.casino-prize-banner must use var(--sn-z-spotlight)');
  assert.ok(!/\.casino-jackpot-overlay\s*\{[\s\S]*?z-index: 9000;/.test(HTML),
    'casino jackpot literal z9000 must be gone');
  assert.ok(!/\.casino-prize-banner\s*\{[\s\S]*?z-index: 9100;/.test(HTML),
    'casino prize literal z9100 must be gone');
});

test('the save toast no longer hand-rolls a z-index:99999 literal', () => {
  // 99999 may still appear in the dev/debug overlay (monospace), but never on
  // the .story-save-toast element built by _maybeShowSaveToast.
  const saveToastNearLiteral = /story-save-toast[\s\S]{0,500}z-index:99999/.test(HTML);
  assert.ok(!saveToastNearLiteral, 'story-save-toast must not use z-index:99999');
});
