/* global state, getTypeDefensiveInfo */
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const url = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5173/battle.html');
const publicTitle = new URL('./', url);
const { version } = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8'));
const output = process.env.BATTLE_PLAYTEST_OUT;
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
const heavy = /\/(?:vendor\/pkmn-dex[^/]*\.js|data\/[^?#]+\.(?:json|csv)|competitive\/(?:showdown-engine|showdown-worker|classic-simulation)\.js|offline-assets\.json|sw\.js)$/;
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
    compressed: entries.some(entry => entry.encodedBodySize > 0 && entry.decodedBodySize > entry.encodedBodySize),
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
    await page.locator('#modal-settings').getByRole('button', { name: 'Data', exact: true }).click();
    await page.locator('#install-app-btn').waitFor({ state: 'visible' });
    await page.locator('#modal-settings').getByRole('button', { name: 'Close settings' }).click();
    assert.deepEqual(requests.filter(path => heavy.test(path)), [], 'title browsing avoids game and install data');
    assert.equal(await page.evaluate(async () => Boolean(await navigator.serviceWorker.getRegistration())), false);
    report.menu = await transfer(page);

    const battleOptions = page.getByRole('button', { name: 'Battle options', exact: true });
    await page.locator('#menu-more-play-summary').click();
    await battleOptions.click();
    await page.getByRole('radio', { name: 'Custom…', exact: true }).click();
    await page.getByRole('button', { name: 'Gen 1 only', exact: true }).click();
    await page.locator('#grade-4-cb').uncheck();
    assert.match(await page.locator('#classic-battle-summary').innerText(), /Gen 1 pool/);
    assert.equal(await page.locator('#pool-count-display').isVisible(), false);
    assert.equal(await page.locator('#app-loading-overlay').isVisible(), false);
    assert.equal(await page.locator('#app-root').evaluate(root => root.inert), false);
    assert.deepEqual(requests.filter(path => heavy.test(path)), [], 'reading and changing Battle options stays lightweight');
    await page.getByRole('radio', { name: 'Standard', exact: true }).click();
    await battleOptions.click();
    report.coldBattleOptions = true;

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
    let rejectedShops = false;
    let testShopFailure = false;
    await page.route('**/data/story/shops.json', route => {
      if (!testShopFailure || rejectedShops) return route.continue();
      rejectedShops = true;
      return route.fulfill({ status: 200, json: { pokemart: [], dept: [], stone: [] } });
    });
    let refusedQuotes = 0;
    let glitchyLeaderLines = 0;
    const story = page.getByRole('button', { name: /Story Mode/ });
    const alert = page.locator('#modal-game-alert');
    for (const [armFault, hasFailed] of [
      [() => {}, () => dexFailed],
      [() => {}, () => failed],
      [() => { testShopFailure = true; }, () => rejectedShops],
    ]) {
      armFault();
      await story.click();
      await alert.waitFor({ state: 'visible' });
      assert.ok(hasFailed());
      assert.match(await alert.innerText(), /Game data could not load/);
      assert.equal(await page.evaluate(() => localStorage.getItem('pbs_story_save')), null);
      await alert.getByRole('button', { name: 'OK', exact: true }).click();
    }
    await page.route('**/data/dialogue/city-guide-quotes.json', async route => {
      refusedQuotes++;
      await route.fulfill({ status: 503, body: 'Service unavailable' });
    });
    await page.route('**/data/dialogue/leader-victory-lines.json', async route => {
      if (++glitchyLeaderLines > 1) return route.continue();
      await route.fulfill({ status: 200, json: { Brock: [42] } });
    });
    await page.evaluate(() => {
      const overlay = document.getElementById('app-loading-overlay');
      window.bootStatuses = [];
      new MutationObserver(() => {
        if (!overlay.classList.contains('hidden')) window.bootStatuses.push(overlay.textContent.trim());
      }).observe(overlay, { attributes: true, childList: true, subtree: true, characterData: true });
    });
    await story.click();
    await page.locator('#screen-story-menu').waitFor({ state: 'visible' });
    assert.equal(refusedQuotes, 2);
    assert.equal(glitchyLeaderLines, 2);
    report.dataRecovery = await page.evaluate(() => ({
      statuses: [...new Set(window.bootStatuses)],
      typeRows: Object.keys(window.typeChart).length,
      fireWeakness: getTypeDefensiveInfo('Grass').weakTo.includes('Fire'),
      normalImmunity: getTypeDefensiveInfo('Ghost').immuneTo.includes('Normal'),
      workingShop: window.POKEMART_ITEMS.some(item => item.id === 'pokeBall' && item.price > 0),
      trainerLine: Boolean(window.LEADER_VICTORY_LINES.Brock),
      optionalFallback: window.CITY_GUIDE_QUOTES.length === 0,
    }));
    assert.deepEqual(report.dataRecovery, {
      statuses: ['Preparing battle data…'], typeRows: 19, fireWeakness: true, normalImmunity: true,
      workingShop: true, trainerLine: true, optionalFallback: true,
    });
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
    if (report.firstNativeAction.compressed || url.pathname.includes('/dist/')) {
      assert.ok(report.firstNativeAction.encodedBytes > 0 && report.firstNativeAction.encodedBytes < 5 * 1024 * 1024,
        `The first native action fits 5 MiB (transferred ${report.firstNativeAction.encodedBytes} bytes)`);
      report.firstNativeActionBudget = 'verified';
    } else report.firstNativeActionBudget = 'requires HTTP compression';
    assert.deepEqual(matchErrors, []);
  } finally {
    await matchContext.close();
  }

  const { context: draftContext, page: draft, requests: draftRequests, errors: draftErrors } = await fresh();
  try {
    await draft.goto(publicTitle.href, { waitUntil: 'load' });
    await draft.locator('#menu-more-play-summary').click();
    await draft.getByRole('link', { name: 'Battle options', exact: true }).click();
    await draft.getByRole('radio', { name: 'Custom…', exact: true }).click();
    await draft.getByRole('button', { name: 'Gen 1 only', exact: true }).click();
    for (const grade of [2, 3, 4]) await draft.locator(`#grade-${grade}-cb`).uncheck();
    await draft.locator('#party-size-select').selectOption('4');
    assert.deepEqual(draftRequests.filter(path => heavy.test(path)), []);

    const gauntlet = draft.getByRole('button', { name: 'Gauntlet', exact: true });
    await gauntlet.click();
    const draftAlert = draft.locator('#modal-game-alert');
    await draftAlert.waitFor();
    assert.match(await draftAlert.innerText(), /A 4v4 match needs 8 different species\. This pool has 6/);
    await draftAlert.getByRole('button', { name: 'OK', exact: true }).click();
    assert.match(await draft.locator('#pool-count-display').innerText(), /6 eligible species/);
    await draft.locator('#party-size-select').selectOption('3');
    await gauntlet.click();
    await draft.locator('#draft-grid .draft-card').first().waitFor();
    assert.equal(await draft.evaluate(() => state.p1Pool.length === 3 && state.p2Pool.length === 3), true);
    assert.deepEqual(draftErrors, []);
    report.narrowDraftRecovery = true;
  } finally {
    await draftContext.close();
  }
  console.log('Deferred title, settings, battle options, retry, Continue, and native Quick Battle verified.', JSON.stringify(report, null, 2));
  if (output) {
    await mkdir(output, { recursive: true });
    await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  }
} finally {
  await browser.close();
}
