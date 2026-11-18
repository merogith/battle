import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const url = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5173/battle.html');
const out = process.env.BATTLE_ONBOARDING_OUT;
if (out) await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });

async function tapInView(page, target, label) {
  await target.waitFor({ state: 'visible' });
  const geometry = await target.evaluate(element => {
    const bounds = element.getBoundingClientRect();
    const x = bounds.left + bounds.width / 2;
    const y = bounds.top + bounds.height / 2;
    const hit = document.elementFromPoint(x, y);
    const clippingPanel = element.closest('#story-prof-body, #story-shop-grid, #story-create-fields')?.getBoundingClientRect();
    const notice = element.closest('.screen')?.querySelector('.story-toast-dock .toast-item')?.getBoundingClientRect();
    return {
      x, y, height: bounds.height,
      inView: bounds.left >= 0 && bounds.right <= innerWidth + 1 && bounds.top >= 0 && bounds.bottom <= innerHeight + 1,
      hit: element.contains(hit), interceptor: element.contains(hit) ? undefined : (hit?.id || hit?.className),
      unclipped: !clippingPanel || (bounds.top >= clippingPanel.top - 1 && bounds.bottom <= clippingPanel.bottom + 1),
      unblocked: !notice || notice.height === 0 || bounds.bottom <= notice.top + 1,
    };
  });
  assert.ok(geometry.inView && geometry.hit && geometry.unclipped && geometry.unblocked && geometry.height >= 44, `${label} fits and receives touch ${JSON.stringify(geometry)}`);
  await page.touchscreen.tap(geometry.x, geometry.y);
}

async function showSaved(page, screen) {
  await page.locator('#toast-host .story-save-toast').waitFor({ state: 'detached' });
  await page.evaluate(() => window.showToast('💾 Saved', 5000, { saved: true }));
  await screen.locator('.story-toast-dock .story-save-toast').waitFor();
}

async function swipeUp(context, page, viewport) {
  const cdp = await context.newCDPSession(page);
  const x = Math.round(viewport.width / 2);
  const from = Math.round(viewport.height * 0.65);
  const to = Math.round(viewport.height * 0.28);
  try {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: from }] });
    for (let step = 1; step <= 8; step++) {
      const y = from + (to - from) * step / 8;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } finally {
    await cdp.detach();
  }
}

try {
  // Seed 75 puts the long, dual-type Voltorb-Hisui first in the short Lab layout.
  for (const [width, height, journeySeed] of [[320, 568], [568, 260, 75], [390, 844]]) {
    const viewport = { width, height };
    const profile = `${width}x${height}`;
    const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true, reducedMotion: 'reduce', serviceWorkers: 'block' });
    await context.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const capture = state => out && page.screenshot({ path: join(out, `${profile}-${state}.png`), animations: 'disabled' });
    await page.goto(url.href, { waitUntil: 'domcontentloaded' });
    await page.locator('#screen-menu').getByRole('button', { name: /Story Mode/ }).tap();
    await page.getByRole('button', { name: /New Adventure/ }).tap();

    const heading = page.getByRole('heading', { name: 'New Adventure', exact: true });
    const name = page.getByRole('textbox', { name: 'Trainer name', exact: true });
    const begin = page.locator('#story-create-begin');
    await heading.waitFor();
    assert.equal(await name.evaluate(el => el === document.activeElement), false, `${profile} opens without focusing the input`);
    assert.equal(await page.locator('#story-create-fields').evaluate(el => el.scrollTop), 0);
    const avatar = page.locator('#story-create-sprite');
    await capture('trainer');
    for (const label of ['Previous sprite', /Random/, 'Next sprite']) {
      const before = await avatar.getAttribute('src');
      await tapInView(page, page.getByRole('button', { name: label }), `${profile} ${label}`);
      assert.notEqual(await avatar.getAttribute('src'), before);
    }
    await tapInView(page, begin, `${profile} Begin before name`);
    assert.equal(await name.getAttribute('aria-invalid'), 'true');
    assert.match(await page.locator('#story-create-name-error').innerText(), /trainer name/);
    await name.fill('@');
    assert.equal(await name.getAttribute('aria-invalid'), 'true');
    await name.fill('Field Tester');
    assert.equal(await name.getAttribute('aria-invalid'), null);
    assert.equal(await page.locator('#story-create-name-error').textContent(), '');
    if (journeySeed) {
      await page.locator('.story-create-advanced summary').tap();
      await page.locator('#story-create-seed').fill(String(journeySeed));
    }
    await tapInView(page, begin, `${profile} Begin after correction`);

    await tapInView(page, page.getByRole('button', { name: 'Begin →', exact: true }), `${profile} Pallet cinematic Begin`);
    const alert = page.locator('#modal-game-alert');
    const ok = alert.getByRole('button', { name: 'OK', exact: true });
    await ok.waitFor();
    await capture('welcome');
    await tapInView(page, ok, `${profile} Pallet welcome OK`);

    const objective = page.locator('#story-city-tips .story-city-objective');
    await objective.waitFor();
    const savedOverlap = await objective.evaluate(el => {
      const toast = document.querySelector('.story-save-toast');
      if (!toast || !toast.getClientRects().length) return false;
      const objective = el.getBoundingClientRect();
      const saved = toast.getBoundingClientRect();
      return objective.left < saved.right && objective.right > saved.left && objective.top < saved.bottom && objective.bottom > saved.top;
    });
    assert.equal(savedOverlap, false, `${profile} Saved pill clears the city objective`);
    await tapInView(page, objective, `${profile} Lab objective`);

    const lab = page.getByRole('region', { name: "Professor's Lab" });
    const choose = lab.locator('.prof-pick-choice');
    const accept = lab.locator('#prof-accept-btn');
    const back = lab.getByRole('button', { name: 'Back to City', exact: true });
    await choose.first().waitFor();
    if (await ok.isVisible()) await tapInView(page, ok, `${profile} Lab introduction OK`);
    assert.equal(await back.count(), 1);
    assert.equal(await accept.isDisabled(), true);
    await showSaved(page, lab);
    await capture('lab');
    const summary = page.locator('#modal-summary');
    const inspectFirst = async label => {
      await tapInView(page, lab.locator('.prof-pick-summary').first(), `${profile} ${label}`);
      await summary.waitFor({ state: 'visible' });
      assert.equal(await accept.isDisabled(), true, 'Inspecting a starter leaves it unselected');
      await summary.getByRole('button', { name: 'Close', exact: true }).first().tap();
      await summary.waitFor({ state: 'hidden' });
    };
    if (journeySeed) assert.equal(await choose.first().getAttribute('aria-label'), 'Choose Voltorb-Hisui');
    await inspectFirst('first starter detail');
    if (journeySeed) {
      const nameSize = () => choose.first().locator('.prof-pick-title strong').evaluate(el => parseFloat(getComputedStyle(el).fontSize));
      const standardSize = await nameSize();
      await page.evaluate(() => document.body.classList.add('upgrade-large-text'));
      await page.waitForFunction(size => {
        const name = document.querySelector('#story-prof-rolled-card .prof-pick-title strong');
        return name && parseFloat(getComputedStyle(name).fontSize) > size;
      }, standardSize);
      await capture('lab-large');
      await inspectFirst('first starter detail with enlarged text');
    }
    await tapInView(page, choose.first(), `${profile} first starter selection`);
    assert.equal(await choose.first().getAttribute('aria-pressed'), 'true');
    await swipeUp(context, page, viewport);
    const longestChoice = (await choose.evaluateAll(options => options.map((el, index) => ({ index, length: el.textContent.trim().length }))))
      .sort((a, b) => b.length - a.length)[0].index;
    const currentChoice = choose.nth(longestChoice);
    const card = lab.locator('.prof-pick-card').nth(longestChoice);
    await card.locator('.prof-pick-summary').tap();
    await summary.waitFor({ state: 'visible' });
    assert.equal(await choose.first().getAttribute('aria-pressed'), 'true', 'Full summary leaves selection alone');
    await summary.getByRole('button', { name: 'Close', exact: true }).first().tap();
    await summary.waitFor({ state: 'hidden' });
    await currentChoice.scrollIntoViewIfNeeded();
    await tapInView(page, currentChoice, `${profile} longest starter selection`);
    const species = (await currentChoice.getAttribute('aria-label')).slice('Choose '.length);
    assert.equal(await accept.innerText(), `Take ${species}`);
    await capture('confirmation');
    await tapInView(page, accept, `${profile} confirm starter`);
    await page.waitForFunction(() => document.getElementById('story-prof-status').textContent.includes('joined your team'));
    assert.equal(await back.count(), 1);
    await tapInView(page, back, `${profile} single Lab exit`);

    await tapInView(page, objective, `${profile} Pokémart objective`);
    const tutorial = page.locator('.story-tutorial-overlay .story-tutorial-continue');
    await tutorial.tap();
    await page.waitForFunction(() => document.querySelector('#story-shop-grid .story-shop-item-qty')?.textContent === '×5');
    if (await ok.isVisible()) await tapInView(page, ok, `${profile} Pokémart gift OK`);
    const item = page.locator('#story-shop-grid .story-shop-item').first();
    const quantity = item.locator('.story-shop-item-qty');
    assert.equal(await quantity.innerText(), '×5');
    await showSaved(page, page.locator('#screen-story-shop'));
    await capture('mart');
    await tapInView(page, item.getByRole('button', { name: 'Buy', exact: true }), `${profile} first Buy`);
    assert.equal(await quantity.innerText(), '×6');
    assert.deepEqual(errors, []);
    console.log(`Fresh touch onboarding passed at ${profile}`);
    await context.close();
  }
} finally {
  await browser.close();
}
