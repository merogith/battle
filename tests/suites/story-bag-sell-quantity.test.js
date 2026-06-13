// Stage 7 — Bag sell-quantity (functional, maintainer-approved).
//
// Stackable bag items can be sold N-at-a-time via a −/+ stepper (shown only when
// you hold more than one). Sell routes through the single-source sellItem(itemId,
// sellPrice, qty), which clamps N to the amount held and reuses every existing
// sell gate (perm-boost lock, featured Mega/Ultra lock). The Underground
// mon-selling system (deliberately tuned prices) is NOT touched.
//
// Run: node --test tests/suites/story-bag-sell-quantity.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEngine } from '../helpers/load-engine.js';

const HTML = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'battle.html'),
  'utf8'
);

const eng = await loadEngine();
const W = eng.window;
await W.__testReady;

test('sellItem multiplies gold and decrements held count by qty (source lock)', () => {
  assert.ok(/function sellItem\(itemId, sellPrice, qty\)/.test(HTML),
    'sellItem must accept a qty parameter');
  assert.ok(/const n = Math\.max\(1, Math\.min\(have, \(qty \| 0\) \|\| 1\)\);/.test(HTML),
    'n clamped to 1..held');
  assert.ok(/sm\.inventory\[itemId\] -= n;/.test(HTML), 'inventory decrements by n');
  assert.ok(/sm\.gold \+= sellPrice \* n;/.test(HTML), 'gold credits sellPrice * n');
  // The perm-boost + featured sell locks are preserved.
  assert.ok(/if \(PERM_BOOST_IDS\.has\(itemId\)\) return;/.test(HTML), 'perm-boost lock kept');
  assert.ok(HTML.includes("itemId.startsWith('mega_') || itemId.startsWith('ultra_')"),
    'featured sell-lock kept');
});

test('the sell row renders a stepper only when holding more than one, routed via the helper', () => {
  assert.ok(HTML.includes('${qty > 1 ? `<div class="story-shop-qty story-bag-qty"'),
    'stepper gated to qty > 1');
  assert.ok(HTML.includes("window.StoryMode.bagSellFromCard(this,'${item.id}',${sellPrice})"),
    'sell button routes through bagSellFromCard');
  assert.ok(/openBattleBag, useBagItemOn, openCityBag, sellItem, bagQtyStep, bagSellFromCard,/.test(HTML),
    'helpers exported on StoryMode');
});

test('bagQtyStep clamps 1..held and updates the sell total (DOM unit)', () => {
  const doc = W.document;
  const host = doc.createElement('div');
  // A bag row holding 4 of an item that sells for 150 each.
  host.innerHTML = `<div class="story-bag-item" data-have="4" data-unit-sell="150">
    <div class="story-shop-qty story-bag-qty">
      <button class="story-shop-qty-btn dec">-</button>
      <span class="story-shop-qty-val">1</span>
      <button class="story-shop-qty-btn inc">+</button>
    </div>
    <button class="sell">Sell<br><span class="story-bag-sell-total">150</span></button>
  </div>`;
  doc.body.appendChild(host);
  const inc = host.querySelector('.inc');
  const dec = host.querySelector('.dec');
  const val = host.querySelector('.story-shop-qty-val');
  const total = host.querySelector('.story-bag-sell-total');

  W.StoryMode.bagQtyStep(inc, 1); // 1 -> 2
  assert.equal(val.textContent, '2');
  assert.match(total.textContent, /300/, 'total reflects 150 x 2');

  // ceiling at held count (4)
  for (let i = 0; i < 10; i++) W.StoryMode.bagQtyStep(inc, 1);
  assert.equal(val.textContent, '4', 'cannot exceed the amount held');
  assert.match(total.textContent, /600/, 'total reflects 150 x 4');

  // floor at 1
  for (let i = 0; i < 10; i++) W.StoryMode.bagQtyStep(dec, -1);
  assert.equal(val.textContent, '1');

  host.remove();
});
