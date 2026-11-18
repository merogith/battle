/* global state */
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const base = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5173/battle.html');
base.searchParams.set('testbattle', 'charge6');
const profiles = [
  { name: 'phone', touch: true, sizes: [[320, 568], [568, 320], [568, 260], [390, 844], [844, 390]] },
  { name: 'tablet', touch: true, sizes: [[820, 1180], [1180, 820], [1366, 1024]] },
  { name: 'desktop', touch: false, sizes: [[1600, 900], [1024, 600], [950, 1150]] },
];
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
const out = process.env.BATTLE_MAIN_RES_SHOTS;
if (out) await mkdir(out, { recursive: true });

async function tapCenter(page, locator) {
  await locator.scrollIntoViewIfNeeded();
  const point = await locator.evaluate(element => {
    const { left, top, width, height } = element.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    return { x, y, hit: element.contains(document.elementFromPoint(x, y)) };
  });
  assert.ok(point.hit, `${await locator.getAttribute('aria-label')} must receive its center tap`);
  await page.touchscreen.tap(point.x, point.y);
}

async function compactMoveTaps() {
  const context = await browser.newContext({ viewport: { width: 320, height: 568 }, hasTouch: true, isMobile: true,
    serviceWorkers: 'block', reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.route('**/*', route => new URL(route.request().url()).origin === base.origin ? route.continue() : route.abort());
  await page.goto(base.href, { waitUntil: 'domcontentloaded' });
  await page.locator('#command-menu [data-cmd="fight"]').waitFor();
  await page.evaluate(() => { window.__testHarness = true; });
  const moves = ['Outrage', 'Dig', 'Earthquake', 'Stone Edge'];

  try {
    for (const [width, height] of [[320, 568], [568, 260], [844, 390]]) {
      await page.setViewportSize({ width, height });
      for (const form of [false, true]) {
        for (const [slot, move] of moves.entries()) {
          await page.evaluate(async form => {
            await window.startCharge6TestBattle();
            state.pActive.buildData.gimmick = 'STANDARD';
            state.pActive.buildData.teraType = form ? 'Ground' : null;
          }, form);
          await page.locator('#command-menu [data-cmd="fight"]').tap();
          const gutter = page.locator('#move-menu .move-menu-controls');
          assert.equal(await gutter.locator('.gimmick-btn').count(), Number(form));
          if (form) await gutter.locator('.gimmick-btn').tap();
          if (out && slot === 0) await page.screenshot({ path: join(out, `battle-${width}x${height}-${form ? 'tera' : 'standard'}.png`) });
          const info = page.getByRole('button', { name: `${move} details`, exact: true });
          await tapCenter(page, info);
          const close = page.getByRole('button', { name: 'Close move details' });
          await close.tap();
          await close.waitFor({ state: 'hidden' });
          const tile = page.locator('#move-menu .battle-btn-move').nth(slot);
          assert.match(await tile.getAttribute('aria-label'), new RegExp(`^${move},`));
          await tapCenter(page, tile);
          try {
            await page.waitForFunction(({ move, form }) => {
              const log = document.querySelector('#battle-log').textContent;
              const awaitingReplacement = !document.querySelector('#modal-party').classList.contains('hidden');
              return log.includes(`Garchomp used ${move}!`) && (!form || log.includes('Garchomp Terastallized')) && (!state.isLocked || awaitingReplacement);
            }, { move, form }, { timeout: 8000 });
          } catch (error) {
            const log = await page.locator('#battle-log').innerText();
            throw new Error(`${width}×${height} ${move} ${form ? 'with Tera' : ''}\n${log}`, { cause: error });
          }
        }
        console.log(`phone ${width}×${height} (${form ? 'Tera armed' : 'no form'}): all four physical move and detail taps passed`);
      }
    }
  } finally {
    await context.close();
  }
}

try {
  for (const { name, touch, sizes } of profiles) {
    const [width, height] = sizes[0];
    const context = await browser.newContext({
      viewport: { width, height }, hasTouch: touch, isMobile: touch,
      serviceWorkers: 'block', reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route =>
      new URL(route.request().url()).origin === base.origin ? route.continue() : route.abort());
    await page.goto(base.href, { waitUntil: 'domcontentloaded' });
    await page.locator('#command-menu').waitFor({ state: 'visible' });

    // Viewport emulation provides no physical notch. Simulate safe-area padding on the body.
    await page.addStyleTag({ content: 'body { padding: 18px 32px 23px !important; }' });
    await page.waitForFunction(() => {
      const body = getComputedStyle(document.body);
      return body.paddingTop === '18px' && body.paddingRight === '32px' &&
        body.paddingBottom === '23px' && body.paddingLeft === '32px';
    });
    await page.evaluate(() => window.applyDisplayMode());
    for (const [width, height] of sizes) {
      const layout = touch && height > width ? 'stack' : 'arena';
      await page.setViewportSize({ width, height });
      await page.waitForFunction(({ width, height, touch, layout }) => {
        const frame = document.querySelector('#app-root').getBoundingClientRect();
        return document.querySelector('#screen-battle').dataset.battleLayout === layout &&
          Math.round(frame.left) >= 32 && Math.round(frame.right) <= width - 32 &&
          Math.round(frame.top) >= 18 && Math.round(frame.bottom) <= height - 23 &&
          (!touch || (Math.round(frame.width) === width - 64 && Math.round(frame.height) === height - 41));
      }, { width, height, touch, layout }, { timeout: 5000 });
      const fight = page.locator('#command-menu [data-cmd="fight"]');
      const move = page.locator('#move-menu .battle-btn-move').first();
      const info = page.locator('#move-menu .move-info-hit').first();
      const close = page.getByRole('button', { name: 'Close move details' });
      const back = page.locator('#move-menu .move-menu-back');
      const blocked = await page.locator('#foe-party-bar .party-bar-ball').evaluateAll(balls => {
        const gear = document.querySelector('.battle-settings-btn').getBoundingClientRect();
        return balls.some(ball => {
          const dot = ball.getBoundingClientRect();
          return dot.left < gear.right && dot.right > gear.left && dot.top < gear.bottom && dot.bottom > gear.top;
        });
      });
      assert.equal(blocked, false, 'opponent party markers must leave room for Settings');
      await fight.focus();
      await page.keyboard.press('f');
      await move.waitFor({ state: 'visible' });
      const attackLabel = await move.getAttribute('aria-label');
      if (touch) {
        assert.ok((await info.boundingBox()).width >= 44);
        await info.tap({ timeout: 5000 });
      } else {
        await info.focus();
        await page.keyboard.press('Enter');
      }
      await close.waitFor({ state: 'visible' });
      await page.keyboard.press('1');
      assert.equal(await move.getAttribute('aria-label'), attackLabel, 'inspecting must leave PP and the selected move intact');
      if (touch) await close.tap({ timeout: 5000 });
      else await page.keyboard.press('Escape');
      assert.equal(await info.evaluate(el => el === document.activeElement), true);
      if (touch) await back.tap({ timeout: 5000 });
      else await page.keyboard.press('Escape');
      assert.equal(await fight.evaluate(el => el === document.activeElement), true);
      await page.keyboard.press('f');
      await move.waitFor({ state: 'visible' });
      await page.keyboard.press('Escape');
      assert.equal(await fight.evaluate(el => el === document.activeElement), true);
      console.log(`${name} ${width}×${height} (${layout})`);
    }
    await page.keyboard.press('f');
    await page.keyboard.press('4');
    await page.waitForFunction(() => document.querySelector('#battle-log').textContent.includes('used Stone Edge'));
    assert.deepEqual(errors, []);
    await context.close();
  }
  await compactMoveTaps();
} finally {
  await browser.close();
}
