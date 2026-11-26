/* global state */
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const url = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5173/battle.html');
const publicTitle = new URL('./', url);
const { version } = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8'));
const output = process.env.BATTLE_PLAYTEST_OUT;
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
const heavy = /\/(?:vendor\/pkmn-dex[^/]*\.js|data\/(?:species\.json|moves\.json|builds\.csv)|competitive\/showdown-engine\.js|offline-assets\.json|sw\.js)$/;
const report = {};

async function fresh() {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await context.route(request => request.origin !== url.origin, route => route.abort());
  const page = await context.newPage();
  page.setDefaultTimeout(25000);
  await page.addInitScript(() => {
    performance.setResourceTimingBufferSize(2000);
    if (!localStorage.getItem('pbs_settings')) {
      localStorage.setItem('pbs_settings', JSON.stringify({ musicEnabled: false, soundEnabled: false, animations: false }));
    }
  });
  const requests = [];
  const errors = [];
  context.on('request', request => requests.push(new URL(request.url()).pathname));
  page.on('pageerror', error => errors.push(error.message));
  return { context, page, requests, errors };
}

async function title(page) {
  await page.goto(url.href, { waitUntil: 'load', timeout: 45000 });
  await page.locator('#app-loading-overlay').waitFor({ state: 'hidden' });
  await page.getByRole('button', { name: /Story Mode/ }).waitFor();
  await page.getByText(`Version ${version}`, { exact: true }).waitFor({ state: 'visible' });
}

const transfer = page => page.evaluate(() => {
  const entries = [...performance.getEntriesByType('navigation'), ...performance.getEntriesByType('resource')];
  return {
    encodedBytes: entries.reduce((sum, entry) => sum + (entry.encodedBodySize || 0), 0),
    largest: entries.map(entry => ({ path: new URL(entry.name).pathname, bytes: entry.encodedBodySize || 0 }))
      .sort((a, b) => b.bytes - a.bytes).slice(0, 8),
  };
});

try {
  const { context, page, requests, errors } = await fresh();
  try {
    await page.goto(publicTitle.href, { waitUntil: 'load' });
    await page.getByRole('heading', { name: 'Pokémon Arena', exact: true }).waitFor();
    await page.getByText(`Version ${version}`, { exact: true }).waitFor({ state: 'visible' });
    assert.equal(await page.getByRole('link', { name: /Continue/ }).count(), 0);
    assert.deepEqual(requests.filter(path => heavy.test(path) || path.endsWith('/battle.html')), []);
    report.publicTitle = await transfer(page);
    assert.ok(report.publicTitle.encodedBytes > 0 && report.publicTitle.encodedBytes < 1024 * 1024, 'The public title fits 1 MiB');
    await page.getByRole('link', { name: 'Settings', exact: true }).click();
    await page.locator('#modal-settings').waitFor({ state: 'visible' });
    await page.locator('#modal-settings').getByRole('button', { name: 'Close settings' }).click();
    requests.length = 0;
    await title(page);
    await page.getByRole('button', { name: 'Settings', exact: true }).first().click();
    await page.locator('#install-app-btn').waitFor({ state: 'visible' });
    await page.locator('#modal-settings').getByRole('button', { name: 'Close settings' }).click();
    assert.deepEqual(requests.filter(path => heavy.test(path)), [], 'title browsing avoids game and install data');
    assert.equal(await page.evaluate(async () => Boolean(await navigator.serviceWorker.getRegistration())), false);
    report.menu = await transfer(page);

    let dexFailed = false;
    await page.route('**/vendor/pkmn-dex.min.js', route => {
      if (dexFailed) return route.continue();
      dexFailed = true;
      return route.abort();
    });
    let failed = false;
    await page.route('**/data/species.json', route => {
      if (failed) return route.continue();
      failed = true;
      return route.abort();
    });
    const story = page.getByRole('button', { name: /Story Mode/ });
    const alert = page.locator('#modal-game-alert');
    for (const hasFailed of [() => dexFailed, () => failed]) {
      await story.click();
      await alert.waitFor({ state: 'visible' });
      assert.ok(hasFailed());
      assert.match(await alert.innerText(), /Game data could not load/);
      assert.equal(await page.evaluate(() => localStorage.getItem('pbs_story_save')), null);
      await alert.getByRole('button', { name: 'OK', exact: true }).click();
    }
    await story.click();
    await page.locator('#screen-story-menu').waitFor({ state: 'visible' });
    assert.ok(requests.some(path => path.endsWith('/data/builds.csv')));
    await page.locator('#screen-story-menu').getByRole('button', { name: /New Adventure/ }).click();
    await page.getByRole('textbox', { name: 'Trainer name', exact: true }).fill('Field Tester');
    await page.locator('#story-create-begin').click();
    await page.getByRole('button', { name: 'Begin →', exact: true }).click();
    await alert.getByRole('button', { name: 'OK', exact: true }).click();
    const save = await page.evaluate(() => JSON.parse(localStorage.getItem('pbs_story_save')));
    assert.ok(save?.active);
    requests.length = 0;
    await page.goto(publicTitle.href, { waitUntil: 'load' });
    assert.deepEqual(requests.filter(path => heavy.test(path)), [], 'a saved game still opens a lightweight title');
    await page.getByRole('link', { name: /Continue .*Field Tester/ }).click();
    await page.locator('#screen-story-city').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#story-hud-city').innerText(), 'Pallet Town');
    assert.equal(await page.locator('#story-hud-trainer-name').innerText(), 'Field Tester');
    assert.ok(requests.some(path => path.endsWith('/data/species.json')));
    assert.deepEqual(errors, []);
    report.storyDataRetry = true;
    report.coldContinue = true;
  } finally {
    await context.close();
  }

  const { context: matchContext, page: match, errors: matchErrors } = await fresh();
  try {
    await match.goto(url.href, { waitUntil: 'load' });
    const gameMenu = match.getByRole('region', { name: 'Main menu', exact: true });
    const gameModes = await gameMenu.locator('.home-modes .home-choice').allTextContents();
    await match.goto(publicTitle.href, { waitUntil: 'load' });
    assert.deepEqual(await match.locator('.home-modes .home-choice').allTextContents(), gameModes);
    assert.equal(await match.getByRole('link', { name: 'Quick Battle' }).isVisible(), false);
    await match.locator('#menu-more-play-summary').click();
    assert.equal(await match.getByRole('link', { name: 'Same device' }).isVisible(), false);
    assert.equal(await match.locator('.home-mode-help dl').isVisible(), false);
    await match.getByRole('link', { name: 'Quick Battle' }).click();
    await match.locator('#screen-battle[data-battle-engine="showdown"] #command-menu [data-cmd="fight"]').click();
    const turn = await match.evaluate(() => state.turnNumber);
    await match.locator('#move-menu .battle-btn-move:enabled').first().click();
    await match.waitForFunction(previous => state.isOver || (!state.isLocked &&
      (state.turnNumber > previous || state.nativeRequests[0]?.phase === 'replace')), turn);
    report.firstNativeAction = await transfer(match);
    assert.deepEqual(matchErrors, []);
  } finally {
    await matchContext.close();
  }
  console.log('Deferred title, settings, retry, Continue, and native Quick Battle verified.', JSON.stringify(report, null, 2));
  if (output) {
    await mkdir(output, { recursive: true });
    await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  }
} finally {
  await browser.close();
}
