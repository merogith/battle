import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const url = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5173/battle.html');
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
await context.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());

try {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url.href);
  await page.evaluate(() => {
    window.OnlineBattle.getServiceClient = async () => ({
      from: () => ({
        select: () => ({
          order: () => ({
            limit: () => new Promise(resolve => { window.finishScores = resolve; }),
          }),
        }),
      }),
    });
  });

  const home = page.locator('#screen-menu');
  await page.locator('#menu-more-play-summary').click();
  const opener = home.getByRole('button', { name: 'Gauntlet scores' });
  const leaderboard = page.getByRole('dialog', { name: 'Gauntlet leaderboard' });
  const scores = leaderboard.getByRole('region', { name: 'Scores' });
  const close = leaderboard.getByRole('button', { name: 'Close', exact: true });
  await opener.focus();
  await page.keyboard.press('Enter');
  await leaderboard.waitFor();
  assert.equal(await home.evaluate(element => element.inert), true);
  assert.equal(await close.evaluate(element => element === document.activeElement), true);
  assert.equal(await leaderboard.locator('#gauntlet-lb-scroll').getAttribute('aria-busy'), 'true');

  await page.waitForFunction(() => typeof window.finishScores === 'function');
  await page.evaluate(() => {
    window.finishScores({ data: Array.from({ length: 100 }, (_, index) => ({
      display_name: index === 0 ? '<Trainer>' : 'MarineTrainer'.repeat(3),
      rounds_cleared: 100 - index,
      final_party: index === 0 ? [{ name: 'Pikachu' }] : [],
    })) });
  });
  await scores.getByText('<Trainer>', { exact: true }).waitFor();
  const partySprite = scores.getByRole('img', { name: 'Pikachu' });
  assert.equal(await partySprite.getAttribute('loading'), 'lazy');
  assert.deepEqual(await partySprite.evaluate(element => [element.clientWidth, element.clientHeight]), [28, 28]);
  for (const [width, height] of [[320, 568], [568, 260], [768, 1024], [1280, 800]]) {
    await page.setViewportSize({ width, height });
    assert.equal(await scores.evaluate(element => element.scrollHeight > element.clientHeight), true);
    const headingBounds = await leaderboard.getByRole('heading').boundingBox();
    const closeBounds = await close.boundingBox();
    assert.ok(headingBounds && headingBounds.x >= 0 && headingBounds.y >= 0, `heading fits ${width}×${height}`);
    assert.ok(closeBounds && closeBounds.y + closeBounds.height <= height, `close fits ${width}×${height}`);
  }
  await page.keyboard.press('Tab');
  assert.equal(await scores.evaluate(element => element === document.activeElement), true);
  await page.goBack();
  await leaderboard.waitFor({ state: 'hidden' });
  assert.equal(await home.evaluate(element => element.inert), false);
  assert.equal(await opener.evaluate(element => element === document.activeElement), true);

  await page.evaluate(() => {
    window.OnlineBattle.getServiceClient = async () => null;
  });
  await opener.click();
  await leaderboard.getByText('Leaderboard unavailable. Try again when you’re online.').waitFor();
  await page.keyboard.press('Escape');
  await leaderboard.waitFor({ state: 'hidden' });
  assert.equal(await opener.evaluate(element => element === document.activeElement), true);

  await page.evaluate(() => {
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: false });
    document.documentElement.webkitRequestFullscreen = undefined;
  });
  const settings = page.locator('#modal-settings');
  await home.getByRole('button', { name: 'Settings', exact: true }).click();
  await settings.getByRole('button', { name: 'Play', exact: true }).click();
  const fullscreen = settings.locator('#toggle-fs-btn');
  assert.equal(await fullscreen.isDisabled(), true);
  assert.equal(await fullscreen.getAttribute('aria-label'), 'Fullscreen unavailable');

  await page.evaluate(() => {
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: true });
    document.documentElement.requestFullscreen = () => Promise.reject(new Error('Access denied'));
    document.dispatchEvent(new Event('fullscreenchange'));
  });
  await fullscreen.click();
  const alert = page.locator('#modal-game-alert');
  await alert.getByText('Fullscreen is unavailable in this window.').waitFor();
  await page.keyboard.press('Escape');
  await alert.waitFor({ state: 'hidden' });
  assert.equal(await fullscreen.evaluate(element => element === document.activeElement), true);

  await page.evaluate(() => {
    const root = document.documentElement;
    let element = null;
    root.requestFullscreen = undefined;
    document.exitFullscreen = undefined;
    Object.defineProperty(document, 'webkitFullscreenElement', { configurable: true, get: () => element });
    root.webkitRequestFullscreen = function () {
      element = this;
      document.dispatchEvent(new Event('webkitfullscreenchange'));
    };
    document.webkitExitFullscreen = function () {
      element = null;
      document.dispatchEvent(new Event('webkitfullscreenchange'));
    };
  });
  await fullscreen.click();
  assert.equal(await fullscreen.getAttribute('aria-label'), 'Exit fullscreen');
  await fullscreen.click();
  assert.equal(await fullscreen.getAttribute('aria-label'), 'Enter fullscreen');
  assert.deepEqual(errors, []);
  console.log('Gauntlet scores focus, browser Back, offline feedback, and fullscreen fallbacks passed.');
} finally {
  await context.close();
  await browser.close();
}
