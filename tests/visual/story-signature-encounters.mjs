import assert from 'node:assert/strict';
import { chromium } from 'playwright';

/* global settings, state */
const url = new URL(process.env.BATTLE_TEST_URL || 'http://127.0.0.1:5177/battle.html');
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(url.hostname));
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
try {
  const context = await browser.newContext({ viewport: { width: 320, height: 568 },
    hasTouch: true, isMobile: true, reducedMotion: 'reduce', serviceWorkers: 'block' });
  await context.addInitScript(() => { window.__testHarness = true; });
  await context.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__testReady);
  await page.evaluate(async () => {
    await window.__testReady;
    window.__classicSimulationModule = await import('./competitive/classic-simulation.js');
    const story = window.__storyTest;
    const scene = 'extra.cubone.raid';
    const tracks = { main: 'classic_v2', villain: 'flare', extra: 'cubone' };
    const fired = {};
    for (const table of [story.MAIN_STORY_BEATS, story.VILLAIN_STORY_BEATS.flare, story.EXTRA_STORY_BEATS.cubone]) {
      for (const beat of Object.values(table)) if (beat.sceneKey !== scene) fired[beat.sceneKey] = true;
    }
    const road = story.EXTRA_STORY_BEATS.cubone.raid.roadAnchor;
    const eventIndex = story.STORY_EVENTS_RAW.findIndex((row, index) => row[1] === 'Battle' &&
      row[2] === 'Basic Trainer' && story.roadForArrayIdx(index) === road);
    if (eventIndex < 0) throw new Error('The staged raid road needs a trainer battle.');
    settings.animations = false;
    settings.battleSpeed = 'instant';
    Object.assign(story.sm, { active: true, version: window.__STORY_SAVE_VER, eventIndex,
      runSeed: 22180, storyDifficulty: 'normal', badges: 5, gold: 3400, inventory: { potion: 2 },
      settings: { ...story.sm.settings, enabledGens: [1] }, tracks, storyEventsFired: fired,
      routeShown: { [eventIndex]: true }, currentEnemyLock: null, _activeBeatBattleKey: scene,
      team: [{ id: 1, name: 'Blastoise', build: { a: 'Torrent', i: 'Leftovers',
        m: ['Surf', 'Water Gun', 'Protect'], _bossHpScale: 4, _isShiny: false } }],
    });
    story.campMarkDone(eventIndex);
    story.enterBattleEvent(story.STORY_EVENTS_RAW[eventIndex], true, true, true);
  });

  const cinematic = page.getByRole('dialog', { name: /Marowak/ });
  await cinematic.waitFor();
  assert.match(await cinematic.innerText(), /Solo raid · Final encounter[\s\S]*50% HP/);
  const enter = cinematic.getByRole('button', { name: 'Stand your ground →' });
  const firstBox = await enter.boundingBox();
  assert.ok(firstBox && firstBox.y + firstBox.height <= 568);
  const saved = () => page.evaluate(() => {
    const run = JSON.parse(localStorage.getItem('pbs_story_save'));
    return { lock: run.currentEnemyLock, gold: run.gold, inventory: run.inventory };
  });
  const immutable = await saved();
  assert.equal(immutable.lock.bossProfile.sceneKey, 'extra.cubone.raid');
  assert.equal(immutable.lock.bossProfile.revision, 1);
  assert.equal(immutable.lock.team[0].name, 'Marowak');

  await enter.tap();
  const screen = page.locator('#screen-battle[data-battle-engine="showdown"]');
  const fight = screen.locator('#command-menu [data-cmd="fight"]');
  const hpMarks = screen.locator('.boss-hp-threshold');
  const pending = screen.locator('#boss-status-indicator button[data-next="true"]');
  const detail = screen.locator('#boss-mechanic-popover');
  const ready = () => page.waitForFunction(() => state.battleEngine === 'showdown' && !state.isLocked && !state.isOver);
  const choose = async move => {
    await ready();
    const turn = await page.evaluate(() => state.turnNumber);
    await fight.tap();
    await screen.locator('#move-menu .battle-btn-move:enabled').filter({ hasText: move }).first().tap();
    await page.waitForFunction(previous => state.isOver || (state.turnNumber > previous && !state.isLocked), turn);
  };
  await ready();
  assert.equal(await hpMarks.count(), 1);
  const snapshot = () => page.evaluate(() => ({ turn: state.turnNumber, hp: state.fActive.currentHp,
    pp: state.pActive.moves.map(move => move.pp), phases: state._storyNativeBossPhases }));
  const initial = await snapshot();
  for (let round = 0; round < 9 && !(await pending.count()); round++) await choose('Surf');
  assert.equal(await pending.count(), 1, `expected one pending native phase; first=${JSON.stringify(initial)} now=${JSON.stringify(await snapshot())}\n${await screen.locator('#battle-log').innerText()}`);
  await pending.waitFor({ timeout: 3000 });
  const crossed = await snapshot();
  assert.ok(crossed.hp < initial.hp);
  assert.deepEqual(crossed.phases.map(({ id, category, status, remainingTurns }) => [id, category, status, remainingTurns]),
    [['graveGuard', 'Special', 'pending', 2]]);
  assert.match(await screen.locator('#battle-log').innerText(), /25% less damage from Special/);

  await page.locator('.story-boss-banner').first().waitFor({ state: 'detached' });
  for (const [width, height] of [[320, 568], [568, 320], [820, 1180], [1600, 900]]) {
    await page.setViewportSize({ width, height });
    await pending.focus();
    await pending.press('Enter');
    const bounds = await detail.boundingBox();
    assert.ok(bounds && bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= width + 1 &&
      bounds.y + bounds.height <= height + 1, `phase detail is clipped at ${width}×${height}`);
    assert.match(await detail.innerText(), /25% less damage/);
    await pending.press('Escape');
    assert.equal(await detail.isVisible(), false);
  }
  await choose('Protect');
  assert.deepEqual((await snapshot()).phases.map(({ status, remainingTurns }) => [status, remainingTurns]), [['active', 1]]);
  await choose('Water Gun');
  assert.deepEqual((await snapshot()).phases, []);

  await page.evaluate(() => window.StoryMode.retryFromGameOver());
  try {
    await cinematic.waitFor({ timeout: 6000 });
  } catch (error) {
    const summary = await page.evaluate(() => ({ row: window.StoryMode.state.eventIndex,
      beat: window.StoryMode.state._activeBeatBattleKey,
      saved: JSON.parse(localStorage.getItem('pbs_story_save'))?.eventIndex,
      visible: [...document.querySelectorAll('.screen:not(.hidden), .modal:not(.hidden), [role="dialog"]')]
        .filter(element => element.getClientRects().length).map(element => [element.id || element.className, element.textContent.trim().slice(0, 130)]),
      saveError: window.__storySaveError }));
    throw new Error(`Retry did not reopen the raid card: ${JSON.stringify(summary)}`, { cause: error });
  }
  assert.deepEqual(await saved(), immutable);
  await enter.tap();
  await ready();
  assert.deepEqual(await snapshot(), initial);
  for (let round = 0; round < crossed.turn - initial.turn; round++) await choose('Surf');
  assert.deepEqual(await snapshot(), crossed);
  assert.deepEqual(errors, []);
  console.log('Authored solo raid locked before the cinematic, explained its native guard at four viewports, expired on time, and replayed identically from the saved retry.');
} finally {
  await browser.close();
}
