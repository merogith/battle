#!/usr/bin/env node
// Headless playthrough from explicit debug checkpoints with regular browser clicks.
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';

const base = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5177/battle.html');
const output = process.env.BATTLE_PLAYTEST_OUT || await mkdtemp(join(tmpdir(), 'battle-postgame-'));
await mkdir(output, { recursive: true });
const report = { status: 'running', findings: [], observations: [], trace: [], bypasses: [
  'Built-in Story checkpoints skip the preceding campaign and set test party/gold.',
  'The route checkpoint clears the destination’s visited marker to exercise its first approach.',
  'The Safari checkpoint fixes the run seed. Capture still uses the normal catch buttons and game rolls.',
  'Developer win/loss buttons supply selected battle outcomes. The player still enters the battles and continues through their regular UI.',
] };
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });

function button(page, name) { return page.getByRole('button', { name }).filter({ visible: true }).first(); }
const visible = (page, selector) => page.locator(`${selector}:visible`).first();
const story = (page, fields) => page.evaluate(keys => {
  const state = window.StoryMode.state;
  return Object.fromEntries(keys.map(key => [key, state[key] ?? null]));
}, fields);

async function record(page, phase, name, extra = {}) {
  const view = await page.evaluate(() => {
    const visible = el => !el.classList.contains('hidden') && el.getBoundingClientRect().width > 0 && getComputedStyle(el).visibility !== 'hidden';
    return {
      screens: [...document.querySelectorAll('.screen')].filter(visible).map(el => el.id),
      dialogs: [...document.querySelectorAll('[role="dialog"], .story-hof-gb-overlay, [data-narr-body], #story-mf-first-defeat-overlay')].filter(visible)
        .map(el => ({ id: el.id || el.className, text: el.innerText.replace(/\s+/g, ' ').trim().slice(0, 240) })),
    };
  });
  const screenshot = `${phase}-${name}.png`;
  await page.screenshot({ path: join(output, screenshot), animations: 'disabled', timeout: 5000 });
  report.trace.push({ phase, name, ...view, ...extra, screenshot });
  console.log(`${phase} ${name}`);
}

async function advanceTo(page, goal, { choice, click = false } = {}) {
  const stop = Date.now() + 28000;
  while (Date.now() < stop) {
    const alert = button(page.locator('#modal-game-alert'), 'OK');
    const next = page.locator(':is([data-narr-continue], .story-tutorial-continue, [data-arrival-dismiss], [data-vs2-battle]):visible').first();
    const option = choice && button(page, choice);
    let advanced = false;
    for (const control of [option, next, alert].filter(Boolean)) {
      if (!(await control.isVisible())) continue;
      // During transitions an alert can remain visible in the DOM under a blocking cinematic.
      if (!(await control.click({ trial: true, timeout: 350 }).then(() => true, () => false))) continue;
      await control.click({ timeout: 3500 });
      advanced = true;
      break;
    }
    if (!advanced && await goal.isVisible() && await goal.click({ trial: true, timeout: 500 }).then(() => true, () => false)) {
      if (click) await goal.click({ timeout: 6500 });
      return;
    }
    if (!advanced) await page.waitForTimeout(120);
  }
  throw new Error(`Could not reach ${goal}. Visible controls: ${await page.getByRole('button').filter({ visible: true }).allTextContents()}`);
}

async function developerAction(page, label) {
  await page.getByRole('button', { name: 'Settings', exact: true }).filter({ visible: true }).first().click();
  await page.locator('#modal-settings').getByRole('button', { name: 'Data', exact: true }).click();
  const details = page.locator('#modal-settings details').filter({ hasText: 'Developer / Story tools' });
  if (await details.getAttribute('open') === null) await details.locator('summary').click();
  await button(details, label).click();
}

async function caseRun(name, run) {
  if (process.env.BATTLE_PLAYTEST_PHASE && process.env.BATTLE_PLAYTEST_PHASE !== name) return;
  const context = await browser.newContext({ viewport: { width: 430, height: 850 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce', serviceWorkers: 'block' });
  const page = await context.newPage();
  page.setDefaultTimeout(6500);
  page.setDefaultNavigationTimeout(45000);
  const pageErrors = [];
  const answers = [];
  const nativeDialogs = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('dialog', async dialog => {
    nativeDialogs.push({ type: dialog.type(), text: dialog.message() });
    const response = answers.shift();
    if (response === undefined) await dialog.dismiss();
    else await dialog.accept(response);
  });
  try {
    await page.route('**/*', route => new URL(route.request().url()).origin === base.origin ? route.continue() : route.abort());
    await page.goto(base.href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.StoryMode && document.getElementById('app-loading-overlay')?.classList.contains('hidden'), null, { timeout: 25000 });
    const install = visible(page, '#pwa-hint-dismiss');
    if (await install.isVisible()) await install.click();
    await run(page, answers);
    assert.equal(answers.length, 0, 'unused native dialog responses');
    assert.deepEqual(pageErrors, [], 'uncaught browser errors');
  } catch (error) {
    report.findings.push({ phase: name, severity: 'failed', message: String(error.message), pageErrors });
    await record(page, name, 'failure').catch(() => {});
    console.error(`${name}: ${error.message}`);
  } finally {
    if (nativeDialogs.length) report.trace.push({ phase: name, name: 'native-dialogs', screens: [], dialogs: nativeDialogs });
    await context.close();
  }
}

async function playHallEnding(page, phase, ending) {
  await developerAction(page, 'Debug: Post-HoF Mystery climax');
  const postGame = button(page, /Continue \(Post-Game\)/i);
  await postGame.waitFor();
  await record(page, phase, 'hall-of-fame');
  await postGame.click();
  const cipher = page.locator('.story-minigame-overlay').filter({ hasText: 'The Plate Reads A Number' });
  const zero = cipher.getByRole('button', { name: '0', exact: true });
  await advanceTo(page, zero);
  await record(page, phase, 'count-cipher');
  await zero.click();
  await zero.click();
  await cipher.getByRole('button', { name: '1', exact: true }).click();
  await cipher.getByRole('button', { name: 'Continue →', exact: true }).click();
  const command = visible(page, '#command-menu');
  await advanceTo(page, command);
  const launch = await story(page, ['crucibleBattleSource', 'postHofMysteryClimaxDone']);
  assert.equal(launch.crucibleBattleSource, 'postHofMystery');
  assert.equal(launch.postHofMysteryClimaxDone, false);
  await developerAction(page, 'Dev: Auto-win battle');

  const choice = button(page, ending.label);
  await advanceTo(page, choice);
  await choice.click();
  await page.locator('.story-narr-root').getByText(ending.reply).waitFor({ state: 'visible' });
  await record(page, phase, 'ending-reply', { choice: ending.value });

  const frontier = button(page.locator('#screen-story-crucible'), /Battle Frontier/);
  await advanceTo(page, frontier);
  const climax = await story(page, ['postHofMysteryClimaxDone', 'mfFinalResult', 'atCrucible', 'staticDrops', 'storyChoices']);
  assert.equal(climax.postHofMysteryClimaxDone, true);
  assert.equal(climax.mfFinalResult, 'won');
  assert.equal(climax.atCrucible, true);
  assert.equal(climax.staticDrops.rwdPostHofMystery, true);
  assert.equal(climax.storyChoices['main.count'], 'win');
  assert.equal(climax.storyChoices['main.loop.remember'], ending.value);
  const savedChoice = await page.evaluate(() => JSON.parse(localStorage.getItem('pbs_story_save')).storyChoices['main.loop.remember']);
  assert.equal(savedChoice, ending.value);
  await record(page, phase, 'crucible', { savedChoice });
  return { command, frontier };
}

try {
  await caseRun('route-exploration', async (page, answers) => {
    await developerAction(page, 'Debug: Mystery first encounter');
    const city = visible(page, '#screen-story-city');
    await advanceTo(page, city);
    answers.push('', '1', '9');
    await developerAction(page, /Dev: Story jump/);
    await advanceTo(page, city);
    await page.evaluate(() => {
      delete window.StoryMode.state.citiesArrived[2];
      window.StoryMode.enterCity();
    });
    const search = visible(page, '[data-wander-search]');
    const done = visible(page, '[data-wander-moveon]');
    await search.waitFor();
    await record(page, 'route-exploration', 'approach');
    await search.click();
    const skipEncounter = button(page.locator('#screen-story-catch'), /Keep going|Leave it|Run Away|Skip/);
    await done.or(skipEncounter).first().waitFor();
    if (await skipEncounter.isVisible()) await skipEncounter.click();
    await done.click();
    await advanceTo(page, city);
    const result = await story(page, ['eventIndex', 'wanderByEventIdx', 'citiesArrived']);
    assert.equal(result.wanderByEventIdx[result.eventIndex].taps, 1);
    assert.equal(result.wanderByEventIdx[result.eventIndex].done, true);
    assert.equal(result.citiesArrived[2], true);
    await record(page, 'route-exploration', 'arrival');
  });

  await caseRun('safari-underground', async (page, answers) => {
    await developerAction(page, 'Debug: Mystery first encounter');
    await advanceTo(page, visible(page, '#screen-story-city'));
    answers.push('25000', '4', '28');
    await developerAction(page, /Dev: Story jump/);
    const safari = button(page.locator('#screen-story-city'), /Safari Zone/);
    const center = button(page.locator('#screen-story-city'), /Pokémon Center/);
    await advanceTo(page, safari);
    await page.evaluate(() => {
      window.StoryMode.state.runSeed = 1;
      window.StoryMode.state._strngState = null;
    });
    await record(page, 'safari-underground', 'city5');
    const before = await story(page, ['gold', 'balls', 'pokedex']);
    await safari.click();
    const catchScreen = page.locator('#screen-story-catch');
    const safariBall = button(catchScreen, /Safari Ball/);
    await advanceTo(page, safariBall);
    const start = await story(page, ['gold', 'balls', 'safari']);
    assert.equal(start.gold, before.gold, 'first entry is free');
    assert.equal(start.safari.freeEntryUsed, true);
    assert.ok(await catchScreen.getByText('10 Safari Balls left', { exact: true }).isVisible());
    assert.equal(await catchScreen.getByRole('button', { name: /Great Ball|Ultra Ball|Master Ball|Poké Ball/ }).count(), 0);
    await button(catchScreen, /Bait/).click();
    await advanceTo(page, safariBall);
    await record(page, 'safari-underground', 'first-encounter');

    const shoot = visible(page, '[onclick*="catchThrow(\'safari\')"]');
    const finish = visible(page, '[onclick*="catchContinue()"]');
    const box = visible(page, '[onclick*="catchResolveSendToPC()"]');
    const savedCatch = () => page.evaluate(() => JSON.parse(localStorage.getItem('pbs_story_save')).catchRecovery);
    const resumeCatch = async () => {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.StoryMode &&
        document.getElementById('app-loading-overlay')?.classList.contains('hidden'), null, { timeout: 25000 });
      await page.locator('.menu-btn-quickplay--continue').click();
    };
    await page.evaluate(() => {
      const original = window.StoryFx.throwBall;
      window.StoryFx.throwBall = (...args) => args[2] === 'catch' ? new Promise(() => {}) : original(...args);
    });
    let caught = false;
    let recoveryChecked = false;
    for (let left = 10; left > 0 && !caught; left--) {
      await shoot.click();
      await page.waitForFunction(({ left }) => {
        const showed = el => el && el.getBoundingClientRect().width > 0;
        const advance = document.querySelector('[onclick*="catchContinue()"], [onclick*="catchResolveSendToPC()"]');
        const ball = document.querySelector('[onclick*="catchThrow(\'safari\')"]');
        const recovery = JSON.parse(localStorage.getItem('pbs_story_save')).catchRecovery;
        return recovery || showed(advance) || (showed(ball) && !ball.textContent.includes(`×${left}`));
      }, { left });
      const interrupted = await savedCatch();
      if (!recoveryChecked && interrupted && !interrupted.message) {
        assert.ok(interrupted.safariSession.ballsLeft < 10);
        await resumeCatch();
        await box.or(finish).waitFor({ timeout: 20000 });
        assert.equal((await savedCatch()).id, interrupted.id, 'resume restores the same accepted capture');
        await record(page, 'safari-underground', 'reopen-during-throw');
      }
      if (await box.isVisible()) await box.click();
      if (!recoveryChecked && interrupted) {
        await finish.waitFor();
        const beforeReload = await savedCatch();
        const totals = () => page.evaluate(() => JSON.parse(localStorage.getItem('pbs_story_meta')).achievements.wilds_caught.progress);
        const beforeTotal = await totals();
        assert.ok(beforeReload?.message);
        await resumeCatch();
        await finish.waitFor();
        assert.equal((await savedCatch()).id, interrupted.id);
        assert.equal(await totals(), beforeTotal, 'reopening a capture result does not award a second catch');
        await record(page, 'safari-underground', 'reopen-before-continue');
        recoveryChecked = true;
      }
      const dexLink = button(catchScreen, 'View in Pokédex');
      if (await dexLink.isVisible()) {
        const name = await dexLink.getAttribute('data-dex-name');
        await dexLink.click();
        const entry = page.locator('#screen-collection .pdex-entry');
        assert.equal(await entry.locator('h2').innerText(), name);
        assert.match(await entry.locator('.pdex-entry-facts').innerText(), /Safari catch/);
        assert.match(await entry.locator('.pdex-entry-facts').innerText(), /Wild sighting\s+Safari Zone/);
        await record(page, 'safari-underground', 'pokedex-entry-portrait');
        await page.setViewportSize({ width: 850, height: 430 });
        assert.equal(await entry.locator('h2').isVisible(), true);
        await record(page, 'safari-underground', 'pokedex-entry-landscape');
        await page.locator('#screen-collection .story-collection-head').getByRole('button', { name: 'Back' }).click();
        assert.equal(await finish.isVisible(), true, 'Back returns to the current catch result');
        await page.setViewportSize({ width: 430, height: 850 });
      }
      if (await finish.isVisible()) await finish.click();
      caught = (await story(page, ['pokedex'])).pokedex.caught.length > (before.pokedex?.caught?.length || 0);
    }
    assert.equal(caught, true, 'a Safari capture was recorded in the run Pokédex');
    assert.equal(recoveryChecked, true, 'tested both interruption points on a successful throw');
    await advanceTo(page, safariBall);
    const leave = button(catchScreen, /Leave Safari/);
    const exitCopy = await leave.getAttribute('title');
    await leave.click();
    await advanceTo(page, safari);
    assert.deepEqual((await story(page, ['balls'])).balls, before.balls, 'Safari Balls do not touch inventory');

    await safari.click();
    const confirmation = page.locator('#modal-game-confirm');
    const entryCopy = await confirmation.innerText();
    assert.match(entryCopy, /10,000G/);
    assert.match(entryCopy, /Unused Safari Balls expire when you leave/);
    assert.match(exitCopy || '', /Unused Safari Balls will be forfeited/);
    await record(page, 'safari-underground', 'entry-confirmation');
    await button(confirmation, 'Cancel').click();
    assert.equal((await story(page, ['gold'])).gold, before.gold, 'cancel does not charge');
    await safari.click();
    await button(confirmation, 'OK').click();
    await advanceTo(page, safariBall);
    assert.equal((await story(page, ['gold'])).gold, before.gold - 10000, 're-entry charges the fee once');
    await leave.click();
    await advanceTo(page, center);
    await center.click();
    const underground = visible(page, '#story-pc-tab-underground-btn');
    await advanceTo(page, underground);
    await underground.click();
    const sell = visible(page, '.pc-card-btn--sell:not([disabled])');
    const beforeSale = await story(page, ['gold', 'team', 'pcBox', 'pokedex']);
    const price = Number((await sell.innerText()).replace(/\D/g, ''));
    await sell.click();
    assert.match(await confirmation.innerText(), /cannot be undone/i);
    await button(confirmation, 'OK').click();
    const afterSale = await story(page, ['gold', 'team', 'pcBox', 'pokedex']);
    const count = slot => slot.team.length + (slot.pcBox?.length || 0);
    assert.equal(count(afterSale), count(beforeSale) - 1);
    assert.equal(afterSale.gold, beforeSale.gold + price);
    assert.deepEqual(afterSale.pokedex.caught, beforeSale.pokedex.caught);
    await record(page, 'safari-underground', 'sold', { price });
  });

  await caseRun('mystery-edge', async page => {
    await developerAction(page, 'Debug: Mystery first encounter');
    const approach = button(page.locator('#screen-story-city'), /Masked Figure Waits/);
    const command = visible(page, '#command-menu');
    await advanceTo(page, approach);
    await approach.click();
    const returnTo = button(page.locator('#screen-story-city'), /Figure Is Still Waiting/);
    await advanceTo(page, returnTo, { choice: /Who are you to sort anyone/ });
    assert.equal((await story(page, ['mfEncounter1'])).mfEncounter1, 'declined');
    await returnTo.click();
    await advanceTo(page, command, { choice: /Battle me\./ });
    const first = await story(page, ['mfFirstTeamLock', 'gold', 'inventory']);
    assert.ok(first.mfFirstTeamLock, 'opponent is frozen');
    await record(page, 'mystery-edge', 'battle');
    await developerAction(page, 'Dev: Auto-lose battle');
    const retry = visible(page, '#mf-first-defeat-retry');
    await retry.waitFor();
    const loss = await story(page, ['gold', 'inventory', 'mfEncounter1']);
    assert.equal(loss.gold, first.gold);
    assert.deepEqual(loss.inventory, first.inventory);
    assert.equal(loss.mfEncounter1, 'lost');
    await record(page, 'mystery-edge', 'free-retry');
    await retry.click();
    await advanceTo(page, command);
    assert.deepEqual((await story(page, ['mfFirstTeamLock'])).mfFirstTeamLock, first.mfFirstTeamLock);
    await developerAction(page, 'Dev: Auto-win battle');
    await advanceTo(page, visible(page, '#screen-story-city'));
    assert.equal((await story(page, ['mfEncounter1'])).mfEncounter1, 'won');
    assert.equal(await page.getByRole('button', { name: /Figure at the Edge|Masked Figure Waits/ }).filter({ visible: true }).count(), 0);
    await record(page, 'mystery-edge', 'challenge-resolved');
  });

  await caseRun('hall-frontier', async page => {
    const { command, frontier } = await playHallEnding(page, 'hall-frontier', {
      label: /Remember\. Carry it forward/,
      reply: /You keep the song running in your head/,
      value: 'remember',
    });
    await advanceTo(page, frontier, { click: true });
    const frontierScreen = page.locator('#screen-story-frontier');
    const begin = button(frontierScreen, 'Begin Battle Frontier');
    await advanceTo(page, begin);
    await begin.click();
    await button(frontierScreen, 'Begin Round 1').click();
    await advanceTo(page, command);
    await developerAction(page, 'Dev: Auto-win battle');
    const round2 = button(frontierScreen, 'Begin Round 2');
    await advanceTo(page, round2);
    assert.equal((await story(page, ['frontier'])).frontier.currentStreak, 1);
    await record(page, 'hall-frontier', 'round-2');
    await frontierScreen.getByText('Round 2 rules', { exact: true }).click();
    await button(frontierScreen, 'End run and record streak').click();
    const confirmation = page.locator('#modal-game-confirm');
    assert.match(await confirmation.innerText(), /1 win will be recorded/);
    await button(confirmation, 'OK').click();
    await advanceTo(page, begin);
    const ended = (await story(page, ['frontier'])).frontier;
    assert.equal(ended.active, false);
    assert.equal(ended.highscores[0].streak, 1);
    await frontierScreen.getByText('Top 10 streaks', { exact: true }).click();
    assert.match(await frontierScreen.innerText(), /1 round/);
    await record(page, 'hall-frontier', 'leaderboard');
  });

  await caseRun('hall-ending-forget', async page => {
    await playHallEnding(page, 'hall-ending-forget', {
      label: /Try not to remember\. Walk through clean/,
      reply: /The song goes first\. Then the handwriting\./,
      value: 'forget',
    });
  });

  await caseRun('hall-save-quit', async page => {
    const hall = page.getByRole('dialog', { name: 'Hall of Fame' });
    const readRun = () => page.evaluate(() => {
      const run = JSON.parse(localStorage.getItem('pbs_story_save'));
      return run && { active: run.active, seed: run.runSeed, event: run.eventIndex, team: run.team.map(slot => slot.name) };
    });
    const collectionBefore = await page.evaluate(() => localStorage.getItem('pbs_story_meta'));
    await developerAction(page, 'Preview Hall of Fame');
    await hall.getByRole('button', { name: 'Close preview' }).click();
    assert.equal(await readRun(), null);
    assert.equal(await page.evaluate(() => localStorage.getItem('pbs_story_meta')), collectionBefore);
    await developerAction(page, 'Debug: Post-HoF Mystery climax');
    const expected = await readRun();
    assert.equal(expected.active, true);
    await hall.waitFor();
    await page.setViewportSize({ width: 568, height: 260 });
    assert.equal(await hall.getByRole('button', { name: /End Run|Delete Run/ }).count(), 0);
    await record(page, 'hall-save-quit', 'short-landscape');
    await hall.getByRole('button', { name: 'Save & Quit' }).tap();
    const resume = page.locator('#story-continue-btn');
    await resume.waitFor();
    assert.equal(await resume.evaluate(el => el === document.activeElement), true);
    assert.deepEqual(await readRun(), expected);
    await page.locator('#story-run-tools > summary').tap();
    const deleteRun = page.locator('#story-abandon-btn');
    await deleteRun.tap();
    const confirm = page.getByRole('dialog', { name: 'Delete this run?' });
    await confirm.getByRole('button', { name: 'Keep this run' }).tap();
    assert.deepEqual(await readRun(), expected);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await button(page, /Story Mode/).tap();
    await resume.tap();
    await hall.getByRole('button', { name: /Continue \(Post-Game\)/i }).tap();
    const cipher = page.locator('.story-minigame-overlay').filter({ hasText: 'The Plate Reads A Number' });
    await advanceTo(page, cipher.getByRole('button', { name: '0', exact: true }));
    assert.deepEqual(await readRun(), expected);
    await record(page, 'hall-save-quit', 'resume-postgame');
  });
} finally {
  report.status = report.findings.length ? 'failed' : 'passed';
  await browser.close();
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`Post-game browser report: ${join(output, 'report.json')}`);
  if (report.findings.length) process.exitCode = 1;
}
