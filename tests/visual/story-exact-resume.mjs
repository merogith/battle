/* global settings, state */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const url = new URL(process.env.BATTLE_TEST_URL || 'http://127.0.0.1:5173/battle.html');
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
const context = await browser.newContext({ viewport: { width: 844, height: 390 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(error.message));
page.on('console', message => {
  if (/Exact turn could not be restored|Could not save the resolved battle turn|Could not prepare the saved battle/.test(message.text())) console.error(message.text());
});
const save = () => page.evaluate(() => JSON.parse(localStorage.getItem('pbs_story_save')));
const fight = page.locator('#command-menu [data-cmd="fight"]');
const party = page.locator('#modal-party');
const result = page.locator('[data-story-result-id]');

async function stage(kind) {
  await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  assert.equal(await page.evaluate(() => window.prepareGameData()), true);
  await page.evaluate(async kind => {
    const story = window.__storyTest;
    settings.animations = false;
    settings.battleSpeed = 'instant';
    const mystery = kind === 'mystery';
    const row = story.STORY_EVENTS_RAW.findIndex(event => event[0] === (mystery ? 55 : 53));
    const rowId = story.STORY_EVENTS_RAW[row][0];
    const pivot = kind !== 'knockout';
    const team = pivot ? [
      { id: 'scizor', name: 'Scizor', build: { a: 'Technician', n: 'Jolly', m: ['U-turn'] } },
      { id: 'pikachu', name: 'Pikachu', build: { a: 'Static', n: 'Hardy', m: ['Thunderbolt'] } },
    ] : [{ id: 'magnezone', name: 'Magnezone', build: { a: 'Sturdy', n: 'Modest', m: ['Thunderbolt'], evs: { spa: 252, spe: 252 } } }];
    const foes = pivot
      ? [{ name: 'Blissey', build: { a: 'Natural Cure', m: ['Seismic Toss'] } }]
      : [{ name: 'Magikarp', build: { a: 'Swift Swim', m: ['Splash'] } }];
    Object.assign(story.sm, {
      active: true, badges: mystery ? 8 : 7, runSeed: 50841, eventIndex: row, adventureRunId: `resume-${kind}`,
      trainerProfile: { name: 'Field Tester', sprite: 'Red.png' }, currentTrainerData: { name: 'Gym Leader' },
      storyDifficulty: 'normal', gold: 4000, inventory: { potion: 2 }, team, pcBox: [],
      settings: { ...story.sm.settings, enabledGens: [1, 2, 3, 4], classicMode: true },
      currentEnemyLock: mystery ? null : { eventIdx: row, team: foes },
      mfEncounter1: mystery ? 'declined' : null,
      mfFirstTeamLock: mystery ? foes : null,
    });
    if (mystery) story.mfFirstLaunchFight();
    else await story.launchBattle(foes, rowId);
    // Hold presentation so closing the page interrupts the accepted action before the UI settles.
    window.presentNativeBattleEvents = () => new Promise(() => {});
  }, kind);
  await fight.waitFor();
}

async function resume() {
  await page.goto(new URL('./', url).href, { waitUntil: 'domcontentloaded' });
  await page.getByRole('link', { name: /Continue .*Field Tester/ }).click();
}

async function choose(move) {
  await fight.click();
  await page.locator('#move-menu .battle-btn-move:enabled').filter({ hasText: move }).click();
}

try {
  await context.addInitScript(() => {
    if (!location.pathname.endsWith('/battle.html')) return;
    window.__testHarness = true;
    window.__classicSimulationModule = import(new URL('./competitive/classic-simulation.js', location.href).href);
  });
  await stage('pivot');
  await choose('U-turn');
  await page.waitForFunction(() => state.isLocked && state.nativeRequests?.[0]?.phase === 'replace' &&
    JSON.parse(localStorage.getItem('pbs_story_save')).storyBattleCheckpoint?.resume?.simulation?.battle?.requestState === 'switch');
  const before = await save();
  const lead = await page.evaluate(() => ({ hp: state.pActive.currentHp, pp: state.pActive.moves[0].pp }));
  await resume();
  await party.waitFor({ state: 'visible' });
  await page.waitForFunction(() => state.resumedStoryTurn && state.nativeRequests[0]?.phase === 'replace');
  assert.deepEqual(await page.evaluate(() => ({ hp: state.pActive.currentHp, pp: state.pActive.moves[0].pp })), lead);
  assert.equal((await save()).gold, before.gold);
  const replacement = party.locator('.party-slot').filter({ hasText: 'Pikachu' }).getByRole('button', { name: 'Switch' });
  await replacement.click();
  await page.waitForFunction(() => state.pActive.name === 'Pikachu' && !state.isLocked && state.turnNumber >= 1);
  assert.match(await page.locator('#battle-log').innerText(), /Blissey used Seismic Toss/);
  assert.equal(await page.evaluate(() => state.playerParty[0].moves[0].pp), lead.pp, 'The resumed replacement does not repeat U-turn');
  console.log('Closed during U-turn presentation and resumed the exact forced replacement.');

  await page.evaluate(() => localStorage.clear());
  await stage('knockout');
  await choose('Thunderbolt');
  await page.waitForFunction(() => state.isLocked && JSON.parse(localStorage.getItem('pbs_story_save'))
    .storyBattleCheckpoint?.resume?.simulation?.battle?.ended === true);
  assert.equal((await save()).gold, 4000);
  await resume();
  await result.waitFor();
  const awarded = await save();
  assert.ok(awarded.gold > 4000);
  assert.equal(awarded.storyBattleCheckpoint, null);
  await resume();
  await result.waitFor();
  const again = await save();
  assert.equal(again.gold, awarded.gold);
  assert.equal(again.pendingBattleResult.id, awarded.pendingBattleResult.id);
  console.log('Closed before the KO animation and recovered one victory receipt without awarding gold twice.');

  await stage('pivot');
  await page.evaluate(() => {
    const key = 'pbs_story_save';
    const run = JSON.parse(localStorage.getItem(key));
    run.storyBattleCheckpoint.resume.simulation.engineVersion = 'older-simulator';
    run.storyBattleCheckpoint.resume.inventory.potion = 1;
    run.inventory.potion = 1;
    localStorage.setItem(key, JSON.stringify(run));
  });
  await resume();
  await fight.waitFor();
  assert.equal(await page.evaluate(() => state.resumedStoryTurn), false);
  assert.equal(await page.evaluate(() => state.turnNumber), 0);
  assert.equal((await save()).inventory.potion, 2);
  assert.equal((await save()).gold, 4000);
  assert.match(await page.locator('#battle-log').innerText(), /original items have been restored/);
  console.log('An incompatible simulator checkpoint restarted the original encounter with its items and gold intact.');

  await page.evaluate(() => localStorage.clear());
  await stage('mystery');
  await choose('U-turn');
  await page.waitForFunction(() => state.isLocked && state.nativeRequests?.[0]?.phase === 'replace' &&
    JSON.parse(localStorage.getItem('pbs_story_save')).storyBattleCheckpoint?.resume?.simulation?.battle?.requestState === 'switch');
  const mystery = await save();
  assert.equal(mystery.storyBattleCheckpoint.kind, 'mystery-first');
  await resume();
  await party.waitFor({ state: 'visible' });
  await page.waitForFunction(() => state.resumedStoryTurn && state.nativeRequests[0]?.phase === 'replace');
  assert.deepEqual((await save()).mfFirstTeamLock, mystery.mfFirstTeamLock);
  assert.equal((await save()).eventIndex, mystery.eventIndex);
  await party.locator('.party-slot').filter({ hasText: 'Pikachu' }).getByRole('button', { name: 'Switch' }).click();
  await page.waitForFunction(() => state.pActive.name === 'Pikachu' && !state.isLocked && state.turnNumber >= 1);
  assert.match(await page.locator('#battle-log').innerText(), /Blissey used Seismic Toss/);
  assert.deepEqual(pageErrors, []);
  console.log('The optional Vespergate Mystery encounter resumed its exact replacement and retained the original town and roster.');
} finally {
  await browser.close();
}
