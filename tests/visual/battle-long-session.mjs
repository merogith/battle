/* global applyNativeBattleView, nativeBattle, settings, state, updateUI */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const url = new URL(process.env.BATTLE_TEST_URL || 'http://127.0.0.1:5173/battle.html');
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
try {
  const context = await browser.newContext({
    viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true,
    reducedMotion: 'reduce', serviceWorkers: 'block',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route =>
    new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
  await context.addInitScript(() => {
    window.__testHarness = true;
    window.__classicSimulationModule = import(new URL('./competitive/classic-simulation.js', location.href).href);
  });
  await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  assert.equal(await page.evaluate(() => window.prepareGameData()), true);

  await page.evaluate(async () => {
    const { sm, STORY_EVENTS_RAW, launchBattle } = window.__storyTest;
    const eventIndex = STORY_EVENTS_RAW.findIndex(event => event[1] === 'Battle' && event[2] === 'Gym Leader 8');
    const team = [{ id: 'mew', name: 'Mew', build: { a: 'Synchronize', m: ['Splash'] } }];
    const foes = [{ name: 'Magikarp', build: { a: 'Swift Swim', m: ['Splash'] } }];
    settings.animations = false;
    settings.battleSpeed = 'instant';
    Object.assign(sm, {
      active: true, badges: 7, runSeed: 50841, eventIndex, adventureRunId: 'long-session-test',
      trainerProfile: { name: 'Field Tester', sprite: 'Red.png' }, currentTrainerData: { name: 'Gym Leader' },
      storyDifficulty: 'normal', gold: 4000, inventory: {}, team, pcBox: [],
      settings: { ...sm.settings, enabledGens: [1, 2, 3, 4], classicMode: true },
      currentEnemyLock: { eventIdx: eventIndex, team: foes },
    });
    await launchBattle(foes, STORY_EVENTS_RAW[eventIndex][0]);
    settings.storyBattleItems = false;
    // The fixture has enough PP to reach the log limit through normal player controls.
    for (const [id, party] of [['p1', state.playerParty], ['p2', state.foeParty]]) {
      Object.assign(party[0].moves[0], { pp: 64, maxPp: 64 });
      nativeBattle.applyPartyState(id, party);
    }
    applyNativeBattleView(nativeBattle.view());
  });

  const fight = page.locator('#command-menu [data-cmd="fight"]');
  await fight.waitFor();
  await page.evaluate(() => {
    const paint = updateUI;
    window.hudPaints = 0;
    updateUI = (...args) => {
      window.hudPaints++;
      return paint(...args);
    };
  });
  const splash = page.locator('#move-menu .battle-btn-move:enabled').filter({ hasText: 'Splash' });
  for (let turn = 1; turn <= 48; turn++) {
    const priorPaints = await page.evaluate(() => window.hudPaints);
    await fight.tap();
    assert.equal(await splash.evaluate(button => document.activeElement === button), true);
    await splash.tap();
    await page.waitForFunction(turn => !state.isLocked && state.turnNumber === turn, turn);
    const paints = await page.evaluate(() => window.hudPaints);
    assert.equal(paints - priorPaints, 1, `Turn ${turn} should settle the HUD once`);
    assert.equal(await fight.evaluate(button => document.activeElement === button), true);
  }

  assert.equal(await page.locator('#battle-log').evaluate(log => log.children.length), 100);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('pbs_story_save'))
    .storyBattleCheckpoint.resume.simulation.battle.turn), 49);
  assert.deepEqual(errors, []);
  console.log('48 native Story turns kept one HUD refresh, keyboard focus, a bounded log, and the latest turn checkpoint.');
} finally {
  await browser.close();
}
