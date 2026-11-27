import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const url = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5173/battle.html');
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
const context = await browser.newContext({ viewport: { width: 320, height: 568 }, serviceWorkers: 'block' });
await context.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
try {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem('pbs_settings', JSON.stringify({
      displayMode: 'desktop', battleLogDock: true, soundEnabled: false, musicEnabled: false,
    }));
  });
  await page.goto(url.href);
  const home = page.locator('#screen-menu');
  const settings = page.locator('#modal-settings');
  await home.getByRole('button', { name: 'Settings', exact: true }).click();
  assert.equal(await page.locator('body').evaluate(body => body.classList.contains('is-mobile')), true);
  assert.equal(await settings.locator('#setting-display-mode').inputValue(), 'desktop');
  await settings.getByRole('button', { name: 'Play', exact: true }).click();
  assert.equal(await settings.getByRole('switch', { name: 'Battle log at the side' }).isDisabled(), true);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForFunction(() => !document.body.classList.contains('is-mobile'));
  assert.equal(await settings.getByRole('switch', { name: 'Battle log at the side' }).isDisabled(), false);
  assert.match(await page.locator('#screen-battle').getAttribute('class'), /battle-log-dock/);
  await page.setViewportSize({ width: 568, height: 260 });
  await page.waitForFunction(() => document.body.classList.contains('is-mobile'));
  await settings.getByRole('button', { name: 'Data', exact: true }).click();
  assert.equal(await settings.getByRole('button', { name: 'Force Continue' }).isVisible(), false);
  await settings.getByRole('button', { name: 'Close settings' }).click();

  // Route changes cancel unanswered prompts and drop the previous view's focus trap.
  await page.evaluate(() => {
    window.pendingNavigationConfirm = window.showGameConfirm('Leave the route?');
    window.showScreen('screen-menu');
  });
  assert.equal(await page.evaluate(() => window.pendingNavigationConfirm), false);
  assert.equal(await home.getAttribute('inert'), null);
  assert.equal(await page.locator('#modal-game-confirm').isVisible(), false);

  const caught = await page.evaluate(async () => {
    await window.prepareGameData();
    window.StoryMode._markDexCaught('Horsea', false, true);
    window.StoryMode._markDexCaught('Pikachu', false, true);
    window.StoryMode.openCollection('pokedex');
    window.StoryMode.pokedexSetSearch('horse');
    window.StoryMode.closeCollection();
    window.showScreen('screen-story-catch');
    const button = document.createElement('button');
    button.textContent = 'View in Pokédex';
    button.onclick = () => window.StoryMode.pokedexOpenEntry('Pikachu', false);
    document.getElementById('screen-story-catch').append(button);
    return 'Pikachu';
  });
  const dex = page.locator('#screen-collection');
  const encounter = page.locator('#screen-story-catch');
  const entry = encounter.getByRole('button', { name: 'View in Pokédex', exact: true }).last();
  const goBack = [
    () => dex.getByRole('button', { name: '← Back to Catch', exact: true }).click(),
    () => page.keyboard.press('Escape'),
    () => page.goBack(),
  ];
  for (const returnToCatch of goBack) {
    await entry.click();
    await dex.getByRole('heading', { name: caught, exact: true }).waitFor();
    await returnToCatch();
    await entry.waitFor();
    assert.equal(await entry.evaluate(button => document.activeElement === button), true);
  }
  assert.equal(await page.evaluate(() => {
    window.StoryMode.openCollection('pokedex');
    return document.getElementById('pdex-search').value;
  }), 'horse', 'Catch-origin entry preserves the independent Pokédex search');
  assert.deepEqual(errors, []);
  console.log('Responsive layout, modal cancellation and all three catch return paths passed.');
} finally {
  await context.close();
  await browser.close();
}
