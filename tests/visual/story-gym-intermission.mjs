import assert from 'node:assert/strict';
import { chromium } from 'playwright';

/* global settings, state */
const base = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5173/battle.html');
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });

try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 },
    hasTouch: true, isMobile: true, reducedMotion: 'reduce', serviceWorkers: 'block' });
  await context.addInitScript(() => {
    window.__testHarness = true;
    window.__vsInputArmMs = 0;
    window.__victoryInputArmMs = 0;
  });
  await context.route('**/*', route => new URL(route.request().url()).origin === base.origin ? route.continue() : route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.setDefaultTimeout(15000);
  await page.goto(base.href, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__testReady);
  const run = () => page.evaluate(() => JSON.parse(localStorage.getItem('pbs_story_save')));
  const trainersWon = () => page.evaluate(() => JSON.parse(localStorage.getItem('pbs_story_meta'))?.achievements?.trainers_won?.progress || 0);
  const result = page.locator('[data-story-result-id]');
  const teamReady = () => page.waitForFunction(() => state.mode === 'story' && !state.isLocked && !state.isOver && state.battleEngine === 'showdown');

  await page.evaluate(async () => {
    await window.__testReady;
    window.__classicSimulationModule = await import('./competitive/classic-simulation.js');
    const story = window.__storyTest;
    const eventIndex = story.STORY_EVENTS_RAW.findIndex(row => row[0] === 29);
    const foes = [{ name: 'Geodude', build: { a: 'Rock Head', m: ['Tackle'], n: 'Hardy' } }];
    settings.animations = false;
    settings.battleSpeed = 'instant';
    Object.assign(story.sm, {
      active: true, version: window.__STORY_SAVE_VER, eventIndex, runSeed: 317,
      storyDifficulty: 'hard', adventureRunId: 'gym-break-fixture', badges: 4, gold: 5000,
      inventory: {}, citiesArrived: { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true },
      facilityIntros: { party: true }, storyChoices: { 'road.discovery.5': 'pass' }, catchTutorialDone: true,
      trainerAssignments: { 31: 'Koga' },
      storyLine: 'classic', settings: { ...story.sm.settings, enabledGens: [1, 9] },
      currentTrainerData: { name: 'Gym Trainer', type: 'Rock' },
      currentEnemyLock: { eventIdx: eventIndex, team: foes },
      team: [{ name: 'Blastoise', nickname: 'Breakwater', id: 'lead', build: { a: 'Torrent', m: ['Surf'], n: 'Hardy' } }],
    });
    await story.launchBattle(foes, 29);
  });
  await teamReady();

  await page.evaluate(() => {
    const write = Storage.prototype.setItem;
    let rejectNext = true;
    Storage.prototype.setItem = function (key, value) {
      if (rejectNext && key === 'pbs_story_save' && JSON.parse(value).pendingBattleResult) {
        rejectNext = false;
        throw new DOMException('Fixture blocked this write', 'QuotaExceededError');
      }
      return write.call(this, key, value);
    };
    window.__devAutoWinBattle();
  });
  const retry = page.getByRole('button', { name: 'Retry save' });
  await retry.waitFor();
  assert.equal((await run()).gold, 5000);
  assert.equal(await trainersWon(), 0, 'lifetime credit follows the authoritative save');
  await retry.click();
  await result.getByRole('heading', { name: 'Trainer cleared · 1 of 3' }).waitFor();
  const first = await run();
  assert.equal(first.pendingBattleResult.completedRowId, 29);
  assert.equal(first.pendingBattleResult.nextRowId, 30);
  assert.equal(await trainersWon(), 1);
  await result.getByRole('button', { name: 'Review team' }).click();
  assert.match(await result.locator('#gym-break-roster').innerText(), /Lead · Breakwater \(Blastoise\)/);
  await page.keyboard.press('Escape');
  await result.getByRole('button', { name: 'Next trainer' }).waitFor();

  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
  assert.equal((await run()).gold, first.gold, 'closing at a Hard break charges no retreat fee');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#app-loading-overlay').waitFor({ state: 'hidden' });
  await page.evaluate(async () => {
    window.__classicSimulationModule = await import('./competitive/classic-simulation.js');
    settings.battleSpeed = 'instant';
  });
  await page.locator('.menu-btn-quickplay--story').click();
  await page.locator('#story-continue-btn').click();
  await result.getByRole('button', { name: 'Next trainer' }).waitFor();
  assert.equal(await trainersWon(), 1, 'reopening a saved result does not grant rewards again');
  assert.equal((await run()).gold, first.gold);

  await result.getByRole('button', { name: 'Back to town' }).click();
  const resume = page.locator('#story-action-buttons').getByRole('button', { name: 'Resume Gym · Round 2 of 3' });
  await resume.waitFor();
  const town = await run();
  assert.equal(town.gold, first.gold);
  assert.equal(town.pendingBattleResult.phase, 'town');
  assert.equal(town.storyRetreatBattleRowId, 30);
  await resume.click();
  await result.getByRole('button', { name: 'Next trainer' }).click();
  const prompts = page.locator([
    '.story-tutorial-overlay .story-tutorial-continue', '.story-narr-root [data-narr-continue]',
    '[data-vs2-pick="stoic"]', '[data-vs2-battle]',
  ].map(selector => `${selector}:visible`).join(',')).last();
  const fight = page.locator('#screen-battle:not(.hidden) #command-menu:not(.hidden) [data-cmd="fight"]');
  const reachFight = async () => {
    for (let beat = 0; beat < 30; beat++) {
      if (await prompts.isVisible()) await prompts.click();
      else if (await fight.isVisible()) break;
      else await page.waitForTimeout(100);
    }
    try { await teamReady(); }
    catch (error) { throw new Error(await page.locator('body').innerText().then(text => text.slice(-1800)), { cause: error }); }
  };
  await reachFight();
  const secondStart = await run();
  assert.equal(secondStart.pendingBattleResult, null);
  assert.equal(secondStart.storyBattleCheckpoint.eventIndex, first.eventIndex);
  assert.equal(await page.evaluate(() => state.pActive.currentHp), await page.evaluate(() => state.pActive.maxHp));
  await page.evaluate(() => window.__devAutoWinBattle());
  await result.getByRole('heading', { name: 'Trainer cleared · 2 of 3' }).waitFor();
  const faceLeader = result.getByRole('button', { name: 'Face the leader' });
  const second = await run();
  assert.equal(second.pendingBattleResult.nextRowId, 31);
  assert.equal(await trainersWon(), 2);
  await faceLeader.click();
  await reachFight();
  assert.equal((await run()).storyBattleCheckpoint.eventIndex, second.eventIndex);
  await page.evaluate(() => window.__devAutoWinBattle());
  await result.getByText('Badge 5 of 8').waitFor();
  assert.equal(await result.locator('.story-victory-badge-name').innerText(), 'Soul Badge');
  assert.equal(await result.locator('.gym-badge-art').getAttribute('data-gym-type'), 'Poison');
  assert.match(await result.locator('.story-victory-v2-milestone').innerText(), /Koga · Poison/);
  assert.equal((await run()).badges, 5);
  assert.equal(await trainersWon(), 3);
  await page.evaluate(() => window.StoryMode.onBattleEnd(true, 'VICTORY!'));
  assert.equal(await trainersWon(), 3, 'a repeated result handoff cannot increment the count');
  assert.equal((await run()).badges, 5, 'a repeated result handoff cannot duplicate the badge');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#app-loading-overlay').waitFor({ state: 'hidden' });
  await page.locator('.menu-btn-quickplay--story').click();
  await page.locator('#story-continue-btn').click();
  await result.getByText('Soul Badge', { exact: true }).waitFor();
  assert.equal(await trainersWon(), 3, 'reopening the badge result keeps a single reward');
  await result.getByRole('button', { name: /^Continue/ }).click();
  await page.getByRole('button', { name: 'Team help and practice' }).click();
  await page.getByRole('button', { name: 'Journal', exact: true }).click();
  const badgeCase = page.getByRole('list', { name: '5 of 8 gym badges earned' });
  const journalBadge = badgeCase.locator('.story-badge-cell').nth(4);
  await journalBadge.getByText('Soul Badge', { exact: true }).waitFor();
  assert.match(await journalBadge.innerText(), /Soul Badge\s+Koga · Poison/);
  assert.equal(await journalBadge.locator('.gym-badge-art').getAttribute('data-gym-type'), 'Poison');
  assert.ok(await badgeCase.evaluate(node => node.scrollWidth <= node.clientWidth + 1));
  assert.deepEqual(errors, []);
  console.log('Hard Gym break recovered from a failed write, reopened without fees, resumed the saved fight, and awarded the badge once.');
} finally {
  await browser.close();
}
