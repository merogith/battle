import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const url = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5173/battle.html');
const screenshotDirectory = process.env.BATTLE_TEST_SCREENSHOTS;
const continuePrompt = [
  '[data-narr-continue]', '.story-tutorial-continue', '#modal-game-alert button', '.story-city-arrival button',
].map(selector => selector + ':visible').join(', ');
if (screenshotDirectory) await mkdir(screenshotDirectory, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });

const saved = page => page.evaluate(() => {
  const run = JSON.parse(localStorage.getItem('pbs_story_save'));
  return {
    party: run.team.map(mon => mon.name), box: run.pcBox.map(mon => mon.name),
    roaming: run.roamingLegendary, balls: run.balls, eventIndex: run.eventIndex, gold: run.gold,
    retreat: run.storyRetreatBattleRowId, receipt: run.catchRecovery,
  };
});

async function setupCheckpoint(page, { fullParty, withBalls } = {}) {
  await page.evaluate(({ fullParty, withBalls }) => {
    const story = window.__storyTest;
    const eventIndex = story.STORY_EVENTS_RAW.findIndex(row => row[0] === 56);
    const slot = (name, id) => ({ id, name, build: { m: ['Quick Attack'], n: 'Hardy' } });
    const party = fullParty ? ['Raichu', 'Vileplume', 'Fearow', 'Starmie', 'Onix', 'Gengar'] : ['Raichu'];
    story.sm = {
      ...story.sm, active: true, badges: 8, gold: 2000, eventIndex, runSeed: 27, catchTutorialDone: true,
      settings: { enabledGens: [1, 2], classicMode: true },
      balls: withBalls ? { poke: 2, great: 0, ultra: 0, master: 1 } : { poke: 0, great: 0, ultra: 0, master: 0 },
      trainerAssignments: { 56: 'Blue' },
      team: party.map((name, index) => slot(name, `partner-${index}`)),
      pcBox: [],
      roamingLegendary: { pending: { slot: 'gym8', name: 'Suicune' }, encountered: {} },
      scenesShown: {}, tracks: { main: 'classic_v2', villain: '', extra: '' },
    };
    window.StoryMode.upgrades.save();
    window.StoryMode.continueRun();
  }, { fullParty, withBalls });
}

async function resumeSavedRun(page) {
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__testReady);
  await page.locator('#app-loading-overlay').waitFor({ state: 'hidden' });
  await page.evaluate(() => window.StoryMode.continueRun());
}

async function waitForSighting(page) {
  const cinematic = page.locator('.story-legend-sighting');
  const prompt = page.locator(continuePrompt).last();
  for (let step = 0; step < 25 && !(await cinematic.isVisible()); step++) {
    if (await prompt.isVisible()) await prompt.click();
    else await page.waitForTimeout(150);
  }
  if (!(await cinematic.isVisible())) {
    const state = await saved(page);
    const screen = await page.locator('.screen:visible').first().getAttribute('id');
    assert.fail(`Sighting was not shown on ${screen}: ${JSON.stringify(state)}`);
  }
  return cinematic;
}

async function approach(page, reducedMotion = false) {
  const cinematic = await waitForSighting(page);
  if (!reducedMotion) {
    assert.equal(await cinematic.getAttribute('aria-label'), 'Tracks on the road');
    assert.equal(await cinematic.locator('.story-legend-sighting-sprite').getAttribute('alt'), '');
    assert.match(await cinematic.locator('.world-scene-plate').getAttribute('src'), /legendary-sighting\.webp$/);
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Step closer →');
    await page.keyboard.press('Enter');
  }
  await cinematic.getByRole('heading', { name: 'Suicune' }).waitFor();
  assert.match(await cinematic.getAttribute('aria-label'), /Roaming encounter · Suicune/);
  await cinematic.getByRole('button', { name: 'Approach the legend' }).click();
  await page.locator('#screen-story-catch').getByRole('heading', { name: 'Suicune' }).waitFor();
  const tutorial = page.locator('.story-tutorial-continue:visible').last();
  for (let step = 0; step < 8 && await tutorial.isVisible(); step++) await tutorial.click();
  assert.match(await page.locator('#story-catch-body').innerText(), /One throw.*If the throw misses/is);
}

async function screenshot(page, name) {
  if (screenshotDirectory) await page.screenshot({ path: join(screenshotDirectory, name + '.png'), animations: 'disabled' });
}

async function verifyVisibleAction(page, button) {
  await button.scrollIntoViewIfNeeded();
  await button.click({ trial: true });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no viewport overflow');
}

async function play(viewport, reducedMotion, scenario) {
  const isMobile = viewport.width < 1000;
  const context = await browser.newContext({ viewport, hasTouch: isMobile, isMobile, reducedMotion, serviceWorkers: 'block' });
  try {
    await context.addInitScript(() => { window.__testHarness = true; });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
    await page.goto(url.href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__testReady);
    await page.locator('#app-loading-overlay').waitFor({ state: 'hidden' });
    await scenario(page);
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
}

try {
  await play({ width: 390, height: 844 }, 'no-preference', async page => {
    await setupCheckpoint(page, { withBalls: true });
    await waitForSighting(page);
    await screenshot(page, 'roaming-signs-phone');
    await approach(page);
    const run = page.getByRole('button', { name: 'Leave encounter' });
    await run.click();
    await page.locator('#modal-game-confirm').getByRole('button', { name: 'Cancel' }).click();
    assert.equal((await saved(page)).roaming.pending.name, 'Suicune');
    const encounter = () => page.evaluate(() => window.__storyTest.catchState.encounter);
    const first = await encounter();
    const beforeReload = await saved(page);
    await resumeSavedRun(page);
    await approach(page);
    assert.equal((await saved(page)).gold, beforeReload.gold, 'reload is free during a sighting');
    assert.equal((await saved(page)).eventIndex, beforeReload.eventIndex);
    assert.deepEqual(await encounter(), first, 'reloading before a throw preserves the generated encounter');
    const masterBall = page.getByRole('button', { name: /Master Ball.*guaranteed/i });
    await verifyVisibleAction(page, masterBall);
    await screenshot(page, 'roaming-one-throw-phone');

    await page.evaluate(() => { window.__storyExternalSave = true; });
    await masterBall.click();
    assert.equal((await saved(page)).balls.master, 1);
    assert.equal(await page.evaluate(() => window.__storyTest.sm.roamingLegendary.pending.name), 'Suicune');
    await page.evaluate(() => { window.__storyExternalSave = false; });
    await page.locator('#upgrade-save-alert').getByRole('button', { name: 'Retry' }).click();
    await masterBall.click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('pbs_story_save')).catchRecovery?.ballKey === 'master');
    await resumeSavedRun(page);
    const hero = page.locator('.story-capture-hero');
    await hero.getByRole('heading', { name: 'Suicune' }).waitFor();
    assert.equal(await hero.getByAltText('Master Ball').count(), 1);
    const caught = await saved(page);
    assert.equal(caught.roaming.pending, null);
    assert.equal(caught.roaming.encountered.gym8, true);
    assert.equal(caught.party.filter(name => name === 'Suicune').length, 1);
    assert.equal(caught.balls.master, 0);
    await screenshot(page, 'roaming-caught-phone');
    await page.getByRole('button', { name: 'View in Pokédex' }).click();
    await page.getByRole('heading', { name: 'Suicune', exact: true }).and(page.locator('#pdex-entry-title')).waitFor();
    await page.locator('#screen-collection').getByRole('button', { name: 'Back', exact: true }).click();
    await page.locator('[data-catch-continue]').click();
    assert.equal((await saved(page)).receipt, null);
  });
  console.log('Portrait: two-stage keyboard sighting, cancel, save rollback, guaranteed catch, reload recovery and Pokédex.');

  await play({ width: 568, height: 320 }, 'reduce', async page => {
    await setupCheckpoint(page, { fullParty: true, withBalls: true });
    await approach(page, true);
    await page.getByRole('button', { name: /Master Ball.*guaranteed/i }).click();
    const pcButton = page.getByRole('button', { name: 'Send Suicune to PC' });
    await verifyVisibleAction(page, pcButton);
    await screenshot(page, 'roaming-placement-landscape');
    await pcButton.click();
    const placed = await saved(page);
    assert.equal(placed.party.length, 6);
    assert.deepEqual(placed.box, ['Suicune']);
    assert.match(await page.locator('#story-catch-body').innerText(), /waiting at the PC/);
    await resumeSavedRun(page);
    await page.getByRole('heading', { name: 'Suicune' }).waitFor();
    assert.deepEqual((await saved(page)).box, ['Suicune']);
    await page.locator('[data-catch-continue]').click();
  });
  console.log('Reduced-motion landscape: direct reveal, full party, PC placement and exactly-once resume.');

  await play({ width: 768, height: 1024 }, 'reduce', async page => {
    await setupCheckpoint(page);
    await approach(page, true);
    const blocked = await saved(page);
    assert.match(await page.locator('#story-catch-body').innerText(), /no balls left.*one throw will be waiting/s);
    await page.getByRole('button', { name: 'Return to town' }).click();
    const city = page.locator('#screen-story-city');
    const prompt = page.locator(continuePrompt).last();
    for (let step = 0; step < 25 && !(await city.isVisible()); step++) {
      if (await prompt.isVisible()) await prompt.click();
      else await page.waitForTimeout(150);
    }
    if (!(await city.isVisible())) {
      const active = await page.locator('[role="dialog"]:visible').last().textContent({ timeout: 1000 }).catch(() => null);
      assert.fail(`Town was not reached after returning from the encounter. Active dialog: ${active}`);
    }
    assert.equal((await saved(page)).roaming.pending.name, 'Suicune');
    assert.equal((await saved(page)).retreat, 56);
    const returnButton = page.locator('#screen-story-city [onclick*="proceedToNextBattle"]:visible').first();
    await returnButton.click();
    await approach(page, true);
    assert.equal((await saved(page)).eventIndex, blocked.eventIndex);
    await page.getByRole('button', { name: 'Leave encounter' }).click();
    await page.locator('#modal-game-confirm').getByRole('button', { name: 'OK' }).click();
    await page.locator('[data-catch-continue]').waitFor();
    await resumeSavedRun(page);
    const receipt = page.locator('#story-catch-body');
    assert.equal(await receipt.getByRole('heading', { name: 'You left the encounter' }).count(), 1);
    assert.match(await receipt.innerText(), /won’t appear again this run/);
    assert.equal(await page.getByRole('button', { name: 'View in Pokédex' }).count(), 0);
    await page.locator('[data-catch-continue]').click();
    assert.equal((await saved(page)).receipt, null);
    assert.equal((await saved(page)).roaming.encountered.gym8, true);
  });
  console.log('Tablet: no-ball preparation, exact route return, confirmed departure and aftermath resume.');

  await play({ width: 1440, height: 900 }, 'no-preference', async page => {
    await setupCheckpoint(page, { withBalls: true });
    await approach(page);
    // This cursor's first roll is above the Poké Ball threshold. The throw
    // still goes through the same button, animation, and save as a real miss.
    await page.evaluate(() => { window.__storyTest.sm._strngState = 0x80000000; });
    await page.getByRole('button', { name: /Poké Ball ×2/i }).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('pbs_story_save')).catchRecovery?.roamingOutcome);
    await resumeSavedRun(page);
    const receipt = page.locator('#story-catch-body');
    await receipt.getByRole('heading', { name: 'The legend fled' }).waitFor();
    assert.match(await receipt.innerText(), /Suicune.*(?:gone for good|won’t appear again this run)/is);
    const escaped = await saved(page);
    assert.equal(escaped.balls.poke, 1);
    assert.equal(escaped.balls.master, 1);
    assert.equal(escaped.roaming.encountered.gym8, true);
    assert.equal(escaped.party.includes('Suicune'), false);
    assert.equal(await page.getByRole('button', { name: 'View in Pokédex' }).count(), 0);
    await screenshot(page, 'roaming-fled-desktop');
    await page.locator('[data-catch-continue]').click();
    assert.equal((await saved(page)).receipt, null);
  });
  console.log('Desktop: a fixture-selected miss spends one ball and preserves the departure screen on reload.');
} finally {
  await browser.close();
}
