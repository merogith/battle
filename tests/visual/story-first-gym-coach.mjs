/* global settings, state */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const url = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5173/battle.html');
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    reducedMotion: 'reduce', serviceWorkers: 'block',
  });
  await context.addInitScript(() => { window.__testHarness = true; });
  await context.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__testReady);
  await page.evaluate(async () => {
    await window.__testReady;
    window.__classicSimulationModule = await import('./competitive/classic-simulation.js');
  });
  // A legal Gym 1 fixture guarantees the type-chart/ability conflict independent of the rolled leader.
  await page.evaluate(() => {
    const story = window.__storyTest;
    settings.animations = false;
    settings.battleSpeed = 'instant';
    const eventIndex = story.STORY_EVENTS_RAW.findIndex(row => row[0] === 4);
    const partner = { id: 'burrow', nickname: 'Burrow', name: 'Diglett', build: {
      a: 'Sand Veil', m: ['Mud-Slap'], n: 'Hardy',
    } };
    const foes = [{ name: 'Bronzor', build: { a: 'Levitate', m: ['Tackle'], n: 'Hardy' } }];
    Object.assign(story.sm, {
      active: true, badges: 0, runSeed: 93, eventIndex, storyDifficulty: 'normal',
      settings: { enabledGens: [1, 4, 9], classicMode: true }, gold: 4000, inventory: {},
      team: [partner], pcBox: [], trainerAssignments: { 4: 'Gym Trainer' },
      citiesArrived: { 0: true, 1: true }, facilityIntros: { tutor: true },
      facilitiesSeen: { tutor: true }, storyChoices: { 'road.discovery.1': 'pass' },
      stats: { battlesLost: 0 }, currentEnemyLock: { eventIdx: eventIndex, team: foes },
    });
    story.launchBattle(foes, 4);
  });
  const ready = () => page.waitForFunction(() => state.battleEngine === 'showdown' && !state.isLocked && !state.isOver);
  await ready();
  const fight = page.locator('#command-menu [data-cmd="fight"]');
  const detail = page.getByRole('button', { name: 'Mud-Slap details' });
  const tooltip = page.locator('#move-tooltip');
  const stateView = () => page.evaluate(() => [state.turnNumber, state.pActive.moves[0].pp]);
  const pristine = await stateView();
  await fight.tap();
  await detail.tap();
  assert.match(await tooltip.innerText(), /Basic type chart/);
  assert.doesNotMatch(await tooltip.innerText(), /Levitate/);
  assert.deepEqual(await stateView(), pristine, 'inspecting a move never consumes PP');
  await detail.press('Escape');
  await page.locator('#move-menu .battle-btn-move').first().tap();
  await page.waitForFunction(turn => state.turnNumber > turn && !state.isLocked, pristine[0]);
  await ready();
  assert.match(await page.locator('#battle-log').innerText(), /Bronzor was immune/);
  await fight.tap();
  await detail.tap();
  assert.match(await tooltip.innerText(), /Observed earlier: Bronzor’s Levitate blocked Mud-Slap/);
  await detail.press('Escape');
  await page.locator('#move-menu .move-menu-back').tap();
  await page.locator('#command-menu [data-cmd="run"]').tap();
  await page.locator('#modal-game-confirm').getByRole('button', { name: 'OK', exact: true }).tap();

  const coach = page.locator('#story-defeat-coach');
  assert.match(await coach.innerText(), /Levitate blocked Mud-Slap/);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#app-loading-overlay').waitFor({ state: 'hidden' });
  await page.locator('.menu-btn-quickplay--story').tap();
  await page.locator('#story-continue-btn').tap();
  await coach.waitFor({ state: 'visible' });
  assert.match(await coach.innerText(), /Levitate blocked Mud-Slap/);

  await page.locator('#story-gameover-btn-center').tap();
  const tip = page.getByRole('button', { name: /Preview .* for Burrow · Move Tutor/ });
  await tip.waitFor({ state: 'visible' });
  const prompts = page.locator('#modal-game-alert:visible button, .story-tutorial-overlay:visible .story-tutorial-continue');
  for (let beat = 0; beat < 12; beat++) {
    if (await prompts.count()) await prompts.last().tap();
    else if (await tip.tap({ trial: true, timeout: 500 }).then(() => true, () => false)) break;
  }
  const label = await tip.innerText();
  const selected = label.match(/^Preview (.+) for Burrow/)?.[1];
  assert.ok(selected, label);
  await tip.tap();
  const tutor = page.locator('#screen-story-tutor');
  assert.equal(await tutor.getByRole('searchbox', { name: 'Search moves' }).inputValue(), selected);
  await tutor.locator(`button[data-card-kind="move"][data-card-value=${JSON.stringify(selected)}]:enabled`).waitFor();
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem('pbs_story_save')));
  assert.equal(run.gold, 4000, 'nothing was purchased by inspecting, retreating on Normal or previewing a lesson');
  assert.deepEqual(run.team[0].build.m, ['Mud-Slap']);
  assert.deepEqual(errors, []);
  console.log('Gym coaching verified native disclosed immunity, reload, and a legal Tutor preview.');
} finally {
  await browser.close();
}
