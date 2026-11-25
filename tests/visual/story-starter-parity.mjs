import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const url = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5173/battle.html');
const fixtures = [
  { seed: 17, species: 'Electrike' },
  { seed: 253, species: 'Togepi' },
  { seed: 166, species: 'Horsea' },
];
const introControls = [
  '.story-cold-open button:visible',
  '.story-narr-root [data-narr-continue="1"]:visible',
  '.story-tutorial-overlay .story-tutorial-continue:visible',
  '#modal-game-alert button:visible',
  '[data-vs2-pick="stoic"]:visible',
  '.vs2-battle-btn:visible',
].join(', ');

async function reach(page, target, { activate = false } = {}) {
  for (let step = 0; step < 40; step += 1) {
    const advance = page.locator(introControls).last();
    try {
      if (await advance.count()) {
        await advance.click({ timeout: 1000 });
      } else if (await target.isVisible()) {
        await target.click({ trial: !activate, timeout: 500 });
        return;
      }
    } catch (error) {
      // An arriving tutorial can block an otherwise visible control.
      if (error.name !== 'TimeoutError') throw error;
    }
    await page.waitForTimeout(120);
  }
  throw new Error(`Could not reach ${target}`);
}

const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
try {
  for (const { seed, species } of fixtures) {
    const context = await browser.newContext({
      viewport: seed === 17 ? { width: 320, height: 568 } : { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    try {
      await context.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(url.href, { waitUntil: 'domcontentloaded' });
      await page.locator('#app-loading-overlay').waitFor({ state: 'hidden' });

      const storyMode = page.locator('.menu-btn-quickplay--story');
      await storyMode.click();
      await page.locator('.story-menu-btn--new').click();
      await page.getByRole('textbox', { name: 'Trainer name' }).fill(species);
      await page.locator('.story-create-advanced summary').click();
      await page.locator('#story-create-seed').fill(String(seed));
      await page.locator('#story-create-begin').click();

      const objective = page.locator('.story-city-objective').first();
      const choose = page.getByRole('button', { name: `Choose ${species}`, exact: true });
      await reach(page, objective);
      await objective.click();
      await reach(page, choose);
      const roleCue = choose.locator('.prof-pick-role .story-stat-style');
      assert.match(await roleCue.getAttribute('data-attack-style'), /^(Physical|Special|Hybrid)$/);
      const displayedTotal = await roleCue.locator('strong').innerText();
      assert.ok(Number(displayedTotal) > 0);
      const previewNames = await choose.locator('.prof-pick-move').allTextContents();
      assert.ok(previewNames.length >= 1 && previewNames.length <= 4, `${species} has playable moves`);
      assert.ok(previewNames.every(move => !move.startsWith('Hidden Power')), `${species} has no mentor-locked Hidden Power`);

      await page.getByRole('button', { name: `Full summary of ${species}`, exact: true }).click();
      const summary = page.locator('#modal-summary');
      assert.equal(await summary.locator('#sum-page-1 .sum-stat-total b').innerText(), displayedTotal);
      assert.equal(await summary.locator('#sum-training-details').evaluate(details => details.open), false);
      await summary.getByText('Training details', { exact: true }).click();
      assert.ok(await summary.getByText('IVs', { exact: true }).isVisible());
      await summary.getByRole('tab', { name: 'Moves', exact: true }).click();
      const summaryMoves = await summary.locator('#sum-page-2 .sum-move-card').evaluateAll(cards => cards.map(card => {
        const name = card.querySelector('.sum-move-name').textContent.trim();
        const type = card.querySelector('.type-badge').textContent.trim();
        const power = Number(card.querySelector('.sum-move-stat-val').textContent.trim()) || 0;
        return { name, type, power };
      }));
      assert.deepEqual(summaryMoves.map(move => move.name), previewNames, 'Full Summary matches the offer');
      assert.ok(summaryMoves.every(move => move.power <= 60), `${species} obeys the Pallet starter power cap`);
      await summary.getByRole('button', { name: 'Close', exact: true }).click();
      await choose.click();
      const accept = page.locator('#prof-accept-btn');
      if (seed === 17) {
        const afterFailure = () => page.evaluate(() => ({
          current: window.StoryMode.state,
          saved: JSON.parse(localStorage.getItem('pbs_story_save')),
          dex: JSON.parse(localStorage.getItem('pbs_story_meta')).pokedex,
        }));
        const before = await afterFailure();
        await page.evaluate(() => { window.__storyExternalSave = true; });
        await accept.click();
        await page.getByText(/Your partner could not be saved/).waitFor();
        const blocked = await afterFailure();
        assert.deepEqual(blocked, before, 'A failed save preserves the roster, Pokédex, memory and seed state');
        assert.equal(await page.getByRole('button', { name: 'Back up now', exact: true }).isVisible(), true);
        await page.evaluate(() => { window.__storyExternalSave = false; });
      }
      await accept.click();
      await page.locator('#story-prof-status').filter({ hasText: `${species} joined your team!` }).waitFor();
      const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('pbs_story_save')));
      assert.equal(persisted.starterMemory.slotId, persisted.team[0].id);
      assert.equal(persisted.starterMemory.speciesAtGift, species);
      assert.equal(persisted.starterMemory.shinyAtGift, persisted.team[0].build._isShiny === true);

      // Reload the actual claimed save before the first Rival fight.
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.locator('#app-loading-overlay').waitFor({ state: 'hidden' });
      await storyMode.click();
      await page.locator('#story-continue-btn').click();
      await reach(page, objective);
      assert.match(await objective.innerText(), /Pokémart/);
      await objective.click();
      const leaveMart = page.locator('#screen-story-shop .story-shop-back-btn');
      await reach(page, leaveMart, { activate: true });
      await reach(page, objective);
      assert.match(await objective.innerText(), /Rival/i);
      await objective.click();
      const fight = page.locator('#command-menu [data-cmd="fight"]');
      await reach(page, fight);
      await fight.click();

      const fightMoves = await page.locator('#move-menu .battle-btn-move[aria-label]').evaluateAll(buttons => buttons.map(button => {
        const [name, type] = button.getAttribute('aria-label').split(', ');
        return { name, type };
      }));
      assert.deepEqual(fightMoves, summaryMoves.map(({ name, type }) => ({ name, type })), `${species} kept the previewed moves after reload`);
      if (seed === 17) {
        const immuneMarker = page.locator('.move-tile-matchup[title="Basic type chart: immune"]');
        const choice = page.locator('#move-menu .move-choice').filter({ has: immuneMarker }).first();
        const immune = choice.locator('.move-tile-matchup');
        await immune.waitFor({ state: 'visible' });
        assert.equal((await immune.innerText()).trim(), '⊘', 'Pocket battle shows the immunity cue from the tutorial');
        await choice.locator('.move-info-hit').tap();
        assert.match(await page.locator('#move-tooltip').innerText(), /Basic type chart: immune/);
        await page.locator('#move-tooltip .move-tip-close').tap();
        assert.ok(await choice.locator('.battle-btn-move').isVisible());
      }
      assert.deepEqual(errors, []);
      console.log(`${species} (seed ${seed}) · ${previewNames.join(', ')}`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
