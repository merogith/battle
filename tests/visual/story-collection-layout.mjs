import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const url = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5173/battle.html');
const output = process.env.BATTLE_COLLECTION_OUT;
const profiles = [
  { touch: true, sizes: [[320, 568], [390, 844], [568, 260], [844, 390]] },
  { touch: false, sizes: [[1024, 768]] },
];
const screens = [];
if (output) await mkdir(output, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
try {
  for (const { touch, sizes } of profiles) {
    const [firstWidth, firstHeight] = sizes[0];
    const context = await browser.newContext({
      viewport: { width: firstWidth, height: firstHeight },
      isMobile: touch,
      hasTouch: touch,
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    try {
      await context.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const activate = locator => touch ? locator.tap() : locator.click();
      await page.goto(url.href, { waitUntil: 'domcontentloaded' });
      await page.locator('#app-loading-overlay').waitFor({ state: 'hidden' });
      await page.evaluate(() => {
        window.StoryMode._markDexCaught('Horsea', false, false, 'starter');
        window.StoryMode._memorialAddFallen({ name: 'Horsea', nickname: 'Beacon' }, 'Fight Club');
        window.StoryMode._memorialAddDefeated('Machamp', 'Fight Club');
      });
      await activate(page.locator('.menu-btn-quickplay--story'));
      await activate(page.getByRole('button', { name: /Collection/ }));

      const collection = page.locator('#screen-collection');
      const panel = collection.getByRole('tabpanel');
      const generation = panel.getByRole('combobox', { name: 'Generation', exact: true });
      const caught = panel.getByRole('button', { name: 'Caught only', exact: true });
      const filters = panel.locator('.pdex-more-filters');
      const filtersToggle = filters.locator('summary');
      const dex = collection.getByRole('tab', { name: 'Pokédex', exact: true });
      const achievements = collection.getByRole('tab', { name: 'Achievements', exact: true });
      const memorial = collection.getByRole('tab', { name: 'Memorial', exact: true });

      for (const [width, height] of sizes) {
        const size = `${width}x${height}`;
        await page.setViewportSize({ width, height });
        await activate(dex);
        if (!await filters.evaluate(details => details.open)) await activate(filtersToggle);
        await generation.selectOption('0');
        if (await caught.getAttribute('aria-pressed') === 'true') await activate(caught);
        assert.equal(await generation.locator('option').count(), 10);
        await activate(filtersToggle);
        assert.equal(await generation.isVisible(), false);

        const targetSize = touch ? 44 : 32;
        const layout = await collection.evaluate((screen, minimum) => {
          const tabs = [...screen.querySelectorAll('[role="tab"]')].map(tab => {
            const box = tab.getBoundingClientRect();
            const range = document.createRange();
            range.selectNodeContents(tab);
            const label = range.getBoundingClientRect();
            return {
              name: tab.textContent,
              top: Math.round(box.top),
              fits: box.left >= 0 && box.right <= innerWidth + 1 && box.top >= 0 && box.bottom <= innerHeight + 1 &&
                box.width >= minimum && box.height >= minimum && label.left >= box.left + 2 && label.right <= box.right - 2,
            };
          });
          const body = screen.querySelector('[role="tabpanel"]');
          const first = body.querySelector('.pdex-grid').firstElementChild.getBoundingClientRect();
          return {
            clippedTabs: tabs.filter(tab => !tab.fits).map(tab => tab.name),
            tabRows: new Set(tabs.map(tab => tab.top)).size,
            bodyFits: body.scrollWidth <= body.clientWidth + 1,
            speciesTop: first.top,
            speciesBottom: first.bottom,
            panelBottom: body.getBoundingClientRect().bottom,
          };
        }, targetSize);
        assert.deepEqual(layout.clippedTabs, [], `Full tab labels and ${targetSize}px targets fit at ${size}`);
        assert.equal(layout.tabRows, width >= 540 ? 1 : 2, `Collection tabs fit at ${size}`);
        assert.ok(layout.bodyFits, `Collection panel does not overflow horizontally at ${size}`);
        assert.ok(layout.speciesBottom <= layout.panelBottom, `First Pokédex row is visible at ${size}: ${JSON.stringify(layout)}`);
        if (output) await page.screenshot({ path: join(output, `${size}-pokedex.png`), animations: 'disabled' });

        await activate(filtersToggle);
        await generation.selectOption('1');
        await activate(caught);
        await activate(panel.getByRole('button', { name: 'Shiny', exact: true }));
        await panel.getByText('No shiny Pokémon caught in this view yet.').waitFor();
        assert.equal(await generation.inputValue(), '1');
        await activate(panel.getByRole('button', { name: 'Regular', exact: true }));
        const search = panel.getByRole('searchbox', { name: 'Search Pokédex by name or number' });
        const originalSearch = await search.elementHandle();
        await search.fill('#116');
        assert.equal(await panel.locator('.pdex-grid .pdex-cell').count(), 1);
        await search.fill('horse');
        assert.equal(await originalSearch.evaluate(element => element === document.activeElement && element.isConnected), true);
        assert.equal(await search.evaluate(el => el === document.activeElement && el.selectionStart === 5), true);
        await activate(panel.getByRole('button', { name: 'Horsea — caught', exact: true }));
        await panel.getByRole('heading', { name: 'Horsea', exact: true }).waitFor();
        await activate(panel.getByRole('button', { name: '← Back to Pokédex', exact: true }));
        assert.equal(await generation.inputValue(), '1');
        assert.equal(await caught.getAttribute('aria-pressed'), 'true');
        assert.equal(await search.inputValue(), 'horse');
        await search.fill('no-match');
        await panel.getByText('No entries match this search.').waitFor();
        await search.fill('');

        await activate(achievements);
        assert.equal(await panel.locator('.ach-cat-title').first().textContent(), 'Story Milestones');
        const browse = panel.locator('details.ach-browse');
        const firstCatch = panel.getByText('First Catch', { exact: true });
        if (!await firstCatch.isVisible()) {
          assert.equal(await browse.evaluate(details => details.open), false);
          await activate(browse.locator('summary').first());
        }
        await firstCatch.waitFor();
        await activate(firstCatch);
        await panel.locator('.ach-row-desc').filter({ hasText: 'Capture your first wild Pokémon.' }).waitFor();
        const hidden = panel.locator('details.ach-hidden');
        assert.equal(await hidden.evaluate(details => details.open), false);
        await activate(hidden.locator('summary'));
        assert.equal(await hidden.evaluate(details => details.open), true);
        assert.match(await hidden.innerText(), /Look beyond the League ceremony/);
        assert.doesNotMatch(await hidden.innerText(), /Mystery Figure|Mask Removed|Two Ways Forward/);
        if (output) await page.screenshot({ path: join(output, `${size}-secret-hints.png`), animations: 'disabled' });
        await page.evaluate(() => window.StoryMode._markDexCaught('Horsea', false, true));
        await activate(achievements);
        const earned = panel.locator('.ach-row--unlocked').filter({ hasText: 'First Catch' });
        await earned.waitFor();
        assert.equal(await browse.evaluate(details => details.open), false);
        assert.equal(await earned.locator('.ach-row-desc').isVisible(), false);
        await activate(memorial);
        await panel.getByText('Beacon', { exact: true }).waitFor();
        assert.equal(await panel.getByRole('listitem').count(), 2, `Memorial shows both sides at ${size}`);
        assert.ok(await panel.evaluate(body => body.scrollWidth <= body.clientWidth + 1), `Populated Memorial fits at ${size}`);
        if (output) await page.screenshot({ path: join(output, `${size}-memorial.png`), animations: 'disabled' });
        screens.push({ width, height, touch, ...layout });
        console.log(`Collection ${size} · ${layout.tabRows} tab rows · first Dex row visible`);
      }
      assert.deepEqual(errors, []);
    } finally {
      await context.close();
    }
  }
  if (output) await writeFile(join(output, 'report.json'), JSON.stringify({ status: 'passed', screens }, null, 2) + '\n');
} finally {
  await browser.close();
}
