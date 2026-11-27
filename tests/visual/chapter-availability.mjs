import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const game = new URL(process.env.BATTLE_TEST_URL || 'http://127.0.0.1:5173/battle.html');
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });

try {
  for (const [shard, missingCity, healthyCity] of [
    ['opening', 1, 2], ['early', 2, 1], ['middle', 5, 1], ['finale', null, 1],
  ]) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    const requestCounts = new Map();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let blockShard = true;
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin !== game.origin) return route.abort();
      const part = /adventure-(opening|early|middle|finale)\.json$/.exec(url.pathname)?.[1];
      if (part) requestCounts.set(part, (requestCounts.get(part) || 0) + 1);
      if (part === shard && blockShard) return route.fulfill({ status: 503, body: 'Temporarily unavailable' });
      return route.continue();
    });
    await page.goto(game.href);
    await page.evaluate(async ({ missingCity, healthyCity }) => {
      const { mountAdventure } = await import(new URL('data/story/adventure.js', location.href));
      const host = document.createElement('div');
      host.id = 'test-chapter-host';
      Object.assign(host.style, { position: 'fixed', inset: '72px 12px auto', zIndex: '9999' });
      document.body.append(host);
      const runId = 'run-test-shard-collision';
      const archived = { 'adventure.chapter-1': 'listen', 'adventure.secret.chapter-1': true };
      const run = { runId, seed: 22, storyChoices: {} };
      window.chapterTestRun = run;
      const firstRecord = { runId, seed: 21, storyChoices: archived };
      let archive = window.AdventureProgress.record(null, firstRecord).archive;
      const bridge = {
        isCurrent: () => true,
        readRun: () => run,
        readArchive: () => archive,
        writeRun: (choices, id) => { Object.assign(run, { runId: id, storyChoices: choices }); return true; },
        writeArchive: value => { archive = value; return true; },
      };
      await mountAdventure(host, healthyCity, bridge);
      window.openMissingChapter = () => mountAdventure(host, missingCity, bridge);
    }, { missingCity, healthyCity });
    const host = page.locator('#test-chapter-host');
    await host.locator('[data-adventure-open]').waitFor();
    await host.getByRole('button', { name: 'Field Archive' }).click();
    await page.getByRole('dialog', { name: 'Field Archive' }).waitFor();
    assert.match(await page.locator('.story-archive-count').textContent(), /1 recorded scene/);
    if (shard !== 'opening') await page.getByRole('heading', { name: 'The Empty Circle' }).waitFor();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await page.evaluate(() => window.openMissingChapter());
    assert.equal(await host.locator('[data-adventure-open]').isVisible(), false);
    const retry = host.getByRole('button', { name: 'Retry chapters' });
    await retry.waitFor();
    blockShard = false;
    await retry.click();
    await host.locator('[data-adventure-open]').waitFor();
    assert.equal(await retry.isVisible(), false);
    assert.equal(await page.evaluate(() => document.activeElement.hasAttribute('data-adventure-open')), true);
    for (const [part, count] of requestCounts) assert.equal(count, part === shard ? 3 : 1, `${part} refetch count`);

    if (missingCity !== null) {
      await host.locator('[data-adventure-open]').click();
      const next = page.locator('[data-adventure-next]:visible');
      while (await next.count()) await next.click();
      await page.locator('[data-adventure-pick="act"]').click();
      const actual = await page.evaluate(() => window.chapterTestRun);
      assert.notEqual(actual.runId, 'run-test-shard-collision');
      assert.equal(actual.storyChoices['adventure.secret.chapter-1'], undefined);
      assert.equal(Object.values(actual.storyChoices).length, 1);
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('Field chapters passed all four single-shard failures, isolated Archive identity, retry and focus.');
} finally {
  await browser.close();
}
