/* global settings, state */
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const url = new URL(process.env.BATTLE_TEST_URL || 'http://127.0.0.1:5177/battle.html');
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(url.hostname));
const out = process.env.BATTLE_PLAYTEST_OUT;
if (out) await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });

try {
  const context = await browser.newContext({
    viewport: { width: 320, height: 568 }, hasTouch: true, isMobile: true,
    reducedMotion: 'reduce', serviceWorkers: 'block',
  });
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
  });
  const screenshot = name => out && page.screenshot({ path: join(out, `${name}.png`) });

  // The actual raid loader keeps its party scaling, rolled moves, held item and
  // phase pool. The fixtures make the stage repeatable and keep the partner on
  // the field long enough to inspect the cues.
  await page.evaluate(() => {
    const story = window.__storyTest;
    settings.animations = false;
    settings.battleSpeed = 'instant';
    const scene = 'extra.cubone.raid';
    const eventIndex = story.STORY_EVENTS_RAW.findLastIndex(row => row[1] === 'Battle' && row[2] === 'Basic Trainer');
    const rowId = story.STORY_EVENTS_RAW[eventIndex][0];
    Object.assign(story.sm, {
      active: true, badges: 6, runSeed: 19, eventIndex, storyDifficulty: 'normal', _activeBeatBattleKey: scene,
      currentTrainerData: null, team: [{ id: 1, name: 'Blastoise', build: {
        a: 'Torrent', i: 'Leftovers', m: ['Surf', 'Protect', 'Iron Defense', 'Water Gun'],
        _bossHpScale: 4,
      } }],
    });
    const foes = story.rollExtraRaidBossTeam(scene);
    story.showRaidEncounterIntro(foes[0].name, scene, () => story.launchBattle(foes, rowId));
  });
  const cinematic = page.getByRole('dialog', { name: /Marowak/ });
  await cinematic.waitFor();
  assert.match(await cinematic.innerText(), /Solo raid · Final encounter/);
  assert.match(await cinematic.evaluate(element => getComputedStyle(element).backgroundImage), /menu_bg_ground\.webp/);
  const commit = cinematic.getByRole('button', { name: 'Stand your ground →' });
  const promptBox = await commit.boundingBox();
  assert.ok(promptBox.y + promptBox.height <= 568, 'the raid entry action fits the smallest portrait');
  await screenshot('raid-cinematic-portrait');
  await page.setViewportSize({ width: 568, height: 320 });
  await commit.tap();
  await cinematic.waitFor({ state: 'detached' });

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
    await page.waitForFunction(lastTurn => state.isOver || (state.turnNumber > lastTurn && !state.isLocked), turn);
  };
  await ready();
  assert.equal(await hpMarks.count(), 3);
  const hitPoints = () => page.evaluate(() => [state.fActive.currentHp, state.fActive.maxHp]);
  const initial = await hitPoints();
  await choose('Surf');
  assert.ok((await hitPoints())[0] < initial[0], 'a real move damaged the raid boss');
  for (let turn = 0; turn < 7 && !(await pending.count()); turn++) {
    const [hp, max] = await hitPoints();
    await choose(hp <= max * 0.75 ? 'Protect' : 'Surf');
  }
  await pending.first().waitFor();
  const pendingEffect = await page.evaluate(() => state._bossPendingTelegraphs[0].effect);
  assert.ok(['ward', 'shield'].includes(pendingEffect));
  await page.locator('.story-boss-banner').first().waitFor({ state: 'detached' });
  for (const [width, height] of [[320, 568], [568, 320], [820, 1180], [1600, 900]]) {
    await page.setViewportSize({ width, height });
    await pending.first().focus();
    await pending.first().press('Enter');
    await detail.waitFor();
    const bounds = await detail.boundingBox();
    assert.ok(bounds && bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= width + 1 && bounds.y + bounds.height <= height + 1,
      `the boss phase detail fits ${width}×${height} (${JSON.stringify(bounds)})`);
    await screenshot(`raid-phase-${width}x${height}`);
    if (width === 320) await pending.first().press('Escape');
    else await pending.first().tap();
    assert.equal(await detail.isVisible(), false);
    await fight.tap({ trial: true });
  }
  await choose('Protect');
  await page.waitForFunction(effect => effect === 'ward' ? state._bossWardTurns > 0 : state._bossShieldHp > 0, pendingEffect);
  assert.match(await screen.locator('#battle-log').innerText(), /used Surf![\s\S]*prepares .*for next turn[\s\S]*(less damage|raises a barrier)/i);
  assert.equal(await pending.count(), 0);
  console.log('Raid phase crossed through actual moves, persisted after the banner, and activated after the next choice.');

  // Gym introduction and fully playable battle controls in a second encounter.
  await page.evaluate(() => {
    const story = window.__storyTest;
    const gym = { name: 'Brock', role: 'Gym Leader 1', spriteFile: 'Brock', type: 'Rock' };
    const eventIndex = story.STORY_EVENTS_RAW.findIndex(row => row[1] === 'Battle' && row[2] === 'Gym Leader 1');
    Object.assign(story.sm, { eventIndex, _activeBeatBattleKey: null, currentTrainerData: gym });
    story.showBattleIntro(gym, 'Gym Leader 1', () => story.launchBattle([{ name: 'Onix', build: { a: 'Sturdy', m: ['Rock Throw'] } }]));
  });
  await page.locator('.story-tutorial-continue').click();
  const gym = page.getByRole('dialog', { name: /Battle introduction with Brock/ });
  await gym.waitFor();
  assert.match(await gym.innerText(), /Gym 1 of 8 · Rock-type specialist/i);
  await screenshot('gym-intro-desktop');
  await gym.getByRole('button', { name: 'Challenge the Gym Leader' }).click();
  await ready();
  assert.equal(await hpMarks.count(), 0);
  await choose('Surf');
  assert.match(await screen.locator('#battle-log').innerText(), /Blastoise used Surf!/);

  // This scenario is an injected villain boss even though the general timeline
  // still classes its underlying slot as a basic road trainer.
  await page.evaluate(() => {
    const story = window.__storyTest;
    const trainer = { name: 'Archie', role: 'Team Aqua', spriteFile: 'Archie', type: 'Water' };
    Object.assign(story.sm, { _activeBeatBattleKey: 'villain.aqua.boss', currentTrainerData: trainer });
    story.showBattleIntro(trainer, 'Basic Trainer', () => story.launchBattle([
      { name: 'Sharpedo', build: { a: 'Rough Skin', m: ['Crunch'] } },
      { name: 'Mightyena', build: { a: 'Intimidate', m: ['Bite'] } },
    ]));
  });
  const villain = page.getByRole('dialog', { name: /Battle introduction with Archie/ });
  await villain.waitFor();
  assert.match(await villain.innerText(), /Team Leader/i);
  await screenshot('aqua-boss-intro-desktop');
  await villain.getByRole('button', { name: 'Begin battle' }).click();
  await ready();
  assert.equal(await page.evaluate(() => state.weather), 'Rain');
  await choose('Protect');
  assert.match(await pending.first().innerText(), /Next turn · Power Up/);
  await choose('Iron Defense');
  assert.match(await screen.locator('#boss-status-indicator button').first().innerText(), /Power Up · 2 turns/);

  // The Mystery Figure uses turn cadence, a different trigger from HP or foe KOs.
  await page.evaluate(() => {
    const story = window.__storyTest;
    Object.assign(story.sm, { _activeBeatBattleKey: null, currentTrainerData: { role: 'Mystery Figure' } });
    return story.launchBattle([{ name: 'Smeargle', build: { a: 'Own Tempo', m: ['Splash'], _bossHpScale: 4 } }]);
  });
  await ready();
  for (const move of ['Protect', 'Iron Defense', 'Protect', 'Iron Defense']) await choose(move);
  assert.match(await pending.first().innerText(), /Next turn · Immune/);
  const beforeImmunity = await hitPoints();
  await choose('Surf');
  assert.deepEqual(await hitPoints(), beforeImmunity, 'immunity blocks the actual attack');
  assert.equal(await screen.locator('#boss-status-indicator button').count(), 0, 'one-turn immunity expires before the next choice');
  await choose('Surf');
  assert.ok((await hitPoints())[0] < beforeImmunity[0], 'damage resumes after the immunity round');
  assert.deepEqual(errors, []);
  console.log('Gym challenge, Team Aqua opening Rain and power-up, and Mystery Figure immunity were verified through player controls.');
} finally {
  await browser.close();
}
