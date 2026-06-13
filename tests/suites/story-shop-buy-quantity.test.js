// Stage 6 — Shop buy-quantity (functional, maintainer-approved).
//
// Repeatable consumables get a −/+ stepper; the Buy button routes through the
// single-source buyItem(itemId, price, qty) so every existing purchase gate
// (gold check, no-item-run filter, ball routing, spend tracking, per-city
// featured lockout) is reused, not duplicated. Featured one-per-city items are
// forced to a single copy (no stepper, qty clamped to 1).
//
// Mixes a DOM-unit test of the stepper (the live shopQtyStep) with source-level
// locks on the buyItem multiplication.
//
// Run: node --test tests/suites/story-shop-buy-quantity.test.js

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

test('buyItem multiplies gold / inventory by the quantity (source lock)', () => {
  assert.ok(/async function buyItem\(itemId, price, qty\)/.test(HTML),
    'buyItem must accept a qty parameter');
  assert.ok(/const _qty = _isFeatured \? 1 : Math\.max\(1, Math\.min\(99, \(qty \| 0\) \|\| 1\)\);/.test(HTML),
    'qty must be clamped 1..99 and forced to 1 for featured items');
  assert.ok(/const _total = price \* _qty;/.test(HTML), 'total = price * qty');
  assert.ok(/if \(sm\.gold < _total\) return;/.test(HTML), 'gold check uses the total');
  assert.ok(/sm\.gold -= _total;/.test(HTML), 'gold deducts the total');
  assert.ok(/sm\.balls\[_itemRow\.ballKey\] = \(sm\.balls\[_itemRow\.ballKey\] \|\| 0\) \+ _qty;/.test(HTML),
    'balls add qty');
  assert.ok(/sm\.inventory\[itemId\] = \(sm\.inventory\[itemId\]\|\|0\) \+ _qty;/.test(HTML),
    'inventory adds qty');
});

test('the card renders a stepper for repeatable items only, and routes Buy through the card helper', () => {
  assert.ok(/const showStepper = !opts\.featured && !alreadyBought;/.test(HTML),
    'stepper gated to non-featured, unclaimed rows');
  assert.ok(HTML.includes('class="story-shop-qty"'), 'stepper markup present');
  assert.ok(HTML.includes('window.StoryMode.shopQtyStep(this,-1)') &&
            HTML.includes('window.StoryMode.shopQtyStep(this,1)'), 'stepper buttons wired');
  assert.ok(HTML.includes("window.StoryMode.shopBuyFromCard(this,'${item.id}',${item.price})"),
    'buy button routes through shopBuyFromCard');
  assert.ok(/enterShop, buyItem, shopQtyStep, shopBuyFromCard,/.test(HTML),
    'helpers exported on StoryMode');
});

test('shopQtyStep clamps 1..99 and live-updates the price readout (DOM unit)', () => {
  const doc = W.document;
  const host = doc.createElement('div');
  host.innerHTML = `<div class="story-shop-item" data-unit-price="300">
    <div class="story-shop-item-bottom">
      <span class="price">300</span>
      <div class="story-shop-buy-wrap">
        <div class="story-shop-qty">
          <button class="story-shop-qty-btn dec">-</button>
          <span class="story-shop-qty-val">1</span>
          <button class="story-shop-qty-btn inc">+</button>
        </div>
        <button class="story-shop-buy-btn">Buy</button>
      </div>
    </div>
  </div>`;
  doc.body.appendChild(host);
  const inc = host.querySelector('.inc');
  const dec = host.querySelector('.dec');
  const val = host.querySelector('.story-shop-qty-val');
  const price = host.querySelector('.price');

  W.StoryMode.shopQtyStep(inc, 1); // 1 -> 2
  assert.equal(val.textContent, '2');
  assert.match(price.textContent, /600/, 'price readout reflects 300 x 2');

  // floor at 1
  W.StoryMode.shopQtyStep(dec, -1); // 2 -> 1
  W.StoryMode.shopQtyStep(dec, -1); // stays 1
  assert.equal(val.textContent, '1');

  // ceiling at 99
  for (let i = 0; i < 120; i++) W.StoryMode.shopQtyStep(inc, 1);
  assert.equal(val.textContent, '99');

  // shopBuyFromCard reads the count (defaults to 1 when no stepper present)
  assert.equal(typeof W.StoryMode.shopBuyFromCard, 'function');
  assert.equal(typeof W.StoryMode.shopQtyStep, 'function');

  host.remove();
});
