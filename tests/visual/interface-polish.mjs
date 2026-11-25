import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const url = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5173/battle.html');
url.searchParams.set('testbattle', 'charge6');
const output = process.env.BATTLE_INTERFACE_OUT;
if (output) await mkdir(output, { recursive: true });
const profiles = [
  { width: 320, height: 568, touch: true },
  { width: 568, height: 260, touch: true },
  { width: 820, height: 1180, touch: true },
  { width: 1440, height: 900, touch: false },
];
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
try {
  for (const { width, height, touch } of profiles) {
    const size = `${width}x${height}`;
    const context = await browser.newContext({ viewport: { width, height }, isMobile: touch, hasTouch: touch,
      reducedMotion: 'reduce', serviceWorkers: 'block' });
    try {
      await context.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
      await context.addInitScript(() => { window.__testHarness = true; });
      const page = await context.newPage();
      page.setDefaultTimeout(12000);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const capture = async name => { if (output) await page.screenshot({ path: join(output, `${size}-${name}.png`) }); };
      await page.goto(url.href, { waitUntil: 'domcontentloaded' });
      const battle = page.getByRole('region', { name: 'Battle', exact: true });
      const fight = battle.getByRole('button', { name: /^Fight/ });
      await fight.waitFor();
      const gear = battle.getByRole('button', { name: 'Settings', exact: true });
      await gear.click();
      const settings = page.getByRole('dialog', { name: 'Settings' });
      const sections = settings.getByRole('navigation', { name: 'Settings sections' });
      assert.equal(await sections.getByRole('button').count(), 5);
      const clippedLabels = locator => locator.evaluateAll(elements => elements
        .filter(element => element.scrollWidth > element.clientWidth + 1).map(element => element.textContent.trim()));
      assert.deepEqual(await clippedLabels(sections.getByRole('button')), [], `${size} settings labels fit`);
      for (const [name, heading] of [['Audio', 'Audio'], ['Play', 'Gameplay'], ['Help', 'Help & accessibility'], ['Data', 'App & data'], ['Display', 'Display']]) {
        await sections.getByRole('button', { name, exact: true }).click();
        const section = settings.getByRole('heading', { name: heading, exact: true });
        assert.equal(await section.evaluate(element => document.activeElement === element), true);
        const bounds = await section.evaluate(element => {
          const toolbar = element.closest('.modal-content').querySelector('.settings-header').getBoundingClientRect();
          const { top, bottom } = element.getBoundingClientRect();
          return { toolbar: toolbar.bottom, top, bottom, viewport: innerHeight, scroll: element.parentElement.scrollTop };
        });
        assert.ok(bounds.top >= bounds.toolbar - 1 && bounds.bottom <= bounds.viewport,
          `${size} ${heading} remains below the fixed settings toolbar: ${JSON.stringify(bounds)}`);
      }
      await capture('settings');
      await settings.getByRole('button', { name: 'Close settings' }).click();
      assert.equal(await gear.evaluate(element => element === document.activeElement), true);

      await page.evaluate(() => {
        const first = { name: 'Garchomp', build: { a: 'Rough Skin', i: 'Leftovers', m: ['Earthquake', 'Swords Dance'], n: 'Jolly' } };
        const second = { name: 'Bulbasaur', build: { a: 'Overgrow', m: ['Vine Whip'], n: 'Hardy' } };
        window.showDraftPokemonSummary(first, { partyList: [first, second] });
      });
      const summary = page.locator('#modal-summary');
      const overview = summary.getByRole('tab', { name: 'Overview' });
      const moves = summary.getByRole('tab', { name: 'Moves' });
      const matchups = summary.getByRole('tab', { name: 'Matchups' });
      assert.deepEqual(await clippedLabels(summary.getByRole('tab')), [], `${size} summary tabs fit`);
      await overview.press('ArrowRight');
      assert.equal(await moves.getAttribute('aria-selected'), 'true');
      assert.equal(await moves.evaluate(element => element === document.activeElement), true);
      await moves.press('End');
      assert.equal(await matchups.getAttribute('aria-selected'), 'true');
      await matchups.press('Home');
      const ability = summary.locator('summary').filter({ hasText: 'Rough Skin' });
      await ability.press('Enter');
      assert.equal(await ability.evaluate(element => element.parentElement.open), true);
      assert.match(await ability.locator('..').innerText(), /contact/i);
      await capture('pokemon-summary');
      await summary.getByRole('button', { name: 'Next Pokémon' }).click();
      assert.match(await summary.locator('#sum-header-name').innerText(), /Bulbasaur/);
      assert.equal(await summary.getByRole('button', { name: 'Previous Pokémon' }).evaluate(element => element === document.activeElement), true);
      await summary.locator('.sum-corner-close:visible, .sum-close-btn:visible').first().click();

      await fight.click();
      const tiles = battle.locator('#move-menu .battle-btn-move');
      assert.equal(await tiles.count(), 4);
      assert.equal(await tiles.first().locator('[title="Power"], [title="Accuracy"], [title="Priority"]').count(), 0);
      assert.match(await tiles.first().locator('[title="PP"]').textContent(), /PP\s+\d+\/\d+/);
      const category = tiles.first().locator('.move-tile-cat svg');
      assert.equal(await category.getAttribute('aria-label'), 'Physical category');
      assert.ok(await category.evaluate(icon => {
        const { width: w, height: h } = icon.getBoundingClientRect();
        const scale = document.getElementById('screen-battle').getBoundingClientRect().width / document.getElementById('screen-battle').offsetWidth;
        return Math.abs(w / scale - 14) < 1 && Math.abs(h / scale - 14) < 1;
      }), `${size} shows a fixed-size category icon`);
      if (height <= 360) {
        const crowded = await tiles.evaluateAll(buttons => buttons.filter(button => {
          const bounds = button.getBoundingClientRect();
          const badges = [...button.querySelectorAll('.type-badge, .move-tile-cat, [title="PP"], .move-tile-matchup')]
            .map(badge => badge.getBoundingClientRect());
          return badges.some((box, index) => box.left < bounds.left || box.right > bounds.right ||
            badges.slice(index + 1).some(other => box.top < other.bottom && other.top < box.bottom &&
              box.left < other.right && other.left < box.right));
        }).map(button => button.getAttribute('aria-label')));
        assert.deepEqual(crowded, [], `${size} keeps the move badges, category and PP inside their own tile without overlap`);
        assert.deepEqual(await clippedLabels(tiles.locator('.type-badge')), [], `${size} displays the full move type labels`);
      }
      if (width === 320) {
        const clipped = await tiles.evaluateAll(buttons => buttons.filter(button => {
          const scroll = button.closest('.move-menu-scroll').getBoundingClientRect();
          return button.getBoundingClientRect().bottom > scroll.bottom + 1;
        }).map(button => button.getAttribute('aria-label')));
        assert.deepEqual(clipped, [], 'All four move choices fit above Back on the small portrait phone');
        const earthquake = tiles.locator('.move-tile-name').filter({ hasText: /^Earthquake$/ });
        assert.ok(await earthquake.evaluate(label => {
          const range = document.createRange();
          range.selectNodeContents(label);
          return range.getClientRects().length === 1 && range.getBoundingClientRect().right <= label.getBoundingClientRect().right + 1;
        }), 'The single-word move name fits without a mid-word break');
      }
      await capture('battle-moves');
      const info = battle.getByRole('button', { name: 'Outrage details', exact: true });
      const ppBefore = await tiles.first().locator('[title="PP"]').innerText();
      await info.click();
      assert.match(await page.locator('#move-tooltip').innerText(), /Power:[\s\S]*Acc:[\s\S]*Priority:/);
      await page.getByRole('button', { name: 'Close move details' }).click();
      assert.equal(await tiles.first().locator('[title="PP"]').innerText(), ppBefore);
      await page.evaluate(async () => {
        await window.__testReady;
        window.__storyTest.renderNarrativeOverlay({ name: 'Mine Foreman', banner: 'Flintreach Town', sprite: 'Youngster',
          lines: ['The foreman has a note for the next town.', 'The paper is already stamped.'],
          revealLines: true, continueLabel: 'Back to town' });
      });
      const scene = page.getByRole('dialog', { name: 'Mine Foreman' });
      assert.equal(await scene.getByText('Mine Foreman', { exact: true }).count(), 1);
      const reveal = scene.getByRole('button', { name: 'Next line', exact: true });
      assert.ok(await reveal.evaluate(element => {
        const box = element.getBoundingClientRect();
        return box.width >= 44 && box.height >= 44;
      }));
      await reveal.click();
      assert.match(await scene.locator('[data-narr-body]').innerText(), /paper is already stamped/);
      assert.equal(await scene.evaluate(element => element.scrollWidth <= element.clientWidth + 1), true);
      const backToTown = scene.getByRole('button', { name: 'Back to town', exact: true });
      assert.ok(await backToTown.evaluate(button => {
        const box = button.getBoundingClientRect();
        return box.top >= 0 && box.bottom <= innerHeight;
      }), `${size} fits the scene action in the viewport after the next line`);
      await capture('story-dialogue');
      await backToTown.click();
      await scene.waitFor({ state: 'hidden' });
      if (height <= 360) {
        await page.evaluate(() => window.__storyTest.renderNarrativeOverlay({ name: 'Mine Foreman',
          banner: 'Flintreach Town', sprite: 'Youngster', lines: ['Choose which path to take.'],
          choices: [{ label: 'Take the shortcut', reply: ['The foreman points to the mine.', 'Watch for loose rock. '.repeat(40)] },
            { label: 'Keep to the road', reply: ['See you in town.'] }], continueLabel: 'Back to town' }));
        await scene.getByRole('button', { name: 'Take the shortcut' }).click();
        const replyStart = scene.getByText('The foreman points to the mine.', { exact: true });
        assert.ok(await replyStart.evaluate(element => {
          const box = element.getBoundingClientRect();
          return box.top >= 0 && box.bottom <= innerHeight && element.parentElement === document.activeElement;
        }), 'The beginning of a long reply stays visible and focused in short landscape');
        await scene.getByRole('button', { name: 'Back to town' }).click();
        await scene.waitFor({ state: 'hidden' });
      }
      if (!touch) {
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        const prose = 'The foreman checks the route and unfolds the note. '.repeat(9).trim();
        await page.evaluate(line => window.__storyTest.renderNarrativeOverlay({ name: 'Mine Foreman',
          lines: [line], typewriter: true, continueLabel: 'Back to town' }), prose);
        const skip = scene.getByRole('button', { name: 'Show full text', exact: true });
        await skip.waitFor();
        const body = scene.locator('[data-narr-body]');
        const reservedHeight = await body.evaluate(element => element.offsetHeight);
        assert.notEqual(await body.innerText(), prose);
        await skip.click();
        assert.equal(await body.innerText(), prose);
        assert.equal(await body.evaluate(element => element.offsetHeight), reservedHeight);
        await scene.getByRole('button', { name: 'Back to town' }).click();
        await scene.waitFor({ state: 'hidden' });
      }
      assert.deepEqual(errors, []);
      console.log(`${size} settings, summary keyboard navigation, move icons, and story dialogue passed`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
