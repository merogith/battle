import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

/* global state */

const url = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5173/battle.html');
const out = process.env.BATTLE_RETRY_OUT;
if (out) await mkdir(out, { recursive: true });
const prompts = [
  '.story-cold-open button',
  '.story-tutorial-overlay .story-tutorial-continue',
  '.story-narr-root [data-narr-continue]',
  '#modal-game-alert button',
  '[data-vs2-pick="stoic"]',
  '[data-vs2-battle]',
].map(selector => selector + ':visible').join(',');

async function reach(page, target, { activate = false } = {}) {
  for (let step = 0; step < 50; step++) {
    const prompt = page.locator(prompts).last();
    try {
      if (await prompt.count()) await prompt.click({ timeout: 1000 });
      else if (await target.isVisible()) {
        await target.click({ trial: !activate, timeout: 500 });
        return;
      }
    } catch (error) {
      // An arriving tutorial can block an otherwise visible control.
      if (error.name !== 'TimeoutError') throw error;
    }
    await page.waitForTimeout(150);
  }
  assert.fail(`Could not reach ${target}`);
}

const snapshot = page => page.evaluate(() => {
  const summarize = party => party.map(mon => ({
    name: mon.name, hp: mon.currentHp, status: mon.status || null, pp: mon.moves.map(move => move.pp),
  }));
  return {
    engine: state.battleEngine || 'classic',
    turn: state.turnNumber,
    over: state.isOver,
    weather: state.weather,
    terrain: state.terrain,
    player: summarize(state.playerParty),
    opponent: summarize(state.foeParty),
  };
});
const saved = page => page.evaluate(() => {
  const run = JSON.parse(localStorage.getItem('pbs_story_save'));
  return { gold: run.gold, event: run.eventIndex, seed: run.runSeed, losses: run.stats.battlesLost, inventory: run.inventory };
});
const enemyLock = page => page.evaluate(() => JSON.parse(localStorage.getItem('pbs_story_save')).currentEnemyLock);
const acknowledge = page => page.getByRole('button', { name: 'See my options', exact: true });
async function lose(page) {
  const gameOver = page.locator('#screen-story-gameover');
  if (!await gameOver.isVisible()) {
    await page.locator('#command-menu [data-cmd="run"]').click();
    await page.locator('#modal-game-confirm').getByRole('button', { name: 'OK', exact: true }).click();
  }
  await gameOver.waitFor({ state: 'visible' });
  return gameOver;
}

async function playMove(page, fight, lowestDamage = false) {
  await page.waitForFunction(() => state.mode === 'story' && state.pActive && state.fActive && !state.isLocked && !state.isOver);
  const turn = await page.evaluate(() => state.turnNumber);
  await fight.click();
  const moves = page.locator('#move-menu .battle-btn-move:not(:disabled)');
  await moves.first().waitFor({ state: 'visible', timeout: 10000 });
  const index = lowestDamage ? await moves.evaluateAll(buttons => {
    const score = button => {
      const label = button.getAttribute('aria-label') || '';
      const matchup = button.querySelector('.move-tile-matchup')?.textContent || '';
      const typeModifier = matchup.includes('⊘') ? 0 : matchup.includes('▲') ? 2 : matchup.includes('▼') ? 0.5 : 1;
      return (Number(label.match(/Power (\d+)/)?.[1]) || 0) * typeModifier;
    };
    return buttons.indexOf(buttons.reduce((best, button) => score(button) < score(best) ? button : best));
  }) : 0;
  const move = moves.nth(index);
  const label = await move.getAttribute('aria-label');
  await move.click();
  await page.waitForFunction(previous => state.turnNumber > previous && (!state.isLocked || state.isOver), turn);
  return { label, board: await snapshot(page) };
}

async function verifyBattleBag(page, fight) {
  const readActive = () => page.evaluate(() => ({
    turn: state.turnNumber,
    name: state.pActive.name,
    hp: state.pActive.currentHp,
    maxHp: state.pActive.maxHp,
    pp: state.pActive.moves.map(move => move.pp),
    maxPp: state.pActive.moves.map(move => move.maxPp),
    engine: state.battleEngine,
  }));
  const before = await readActive();
  assert.equal(before.engine, 'showdown');
  assert.ok(before.pp.some((pp, slot) => pp < before.maxPp[slot]), 'the first real move spent PP');
  assert.equal((await saved(page)).inventory.maxElixir, 1);

  await page.locator('#command-menu [data-cmd="bag"]').click();
  const bag = page.locator('#modal-story-bag');
  await bag.getByRole('button', { name: /^Max Elixir,/ }).click();
  await bag.getByRole('button', { name: /^Use on / }).first().click();
  await bag.waitFor({ state: 'hidden' });
  await page.waitForFunction(turn => state.turnNumber > turn && !state.isLocked, before.turn);
  const restored = await readActive();
  assert.equal(restored.turn, before.turn + 1, 'the item spent exactly one turn');
  assert.equal(restored.engine, 'showdown');
  assert.equal(restored.name, before.name);
  assert.deepEqual(restored.pp, restored.maxPp, 'Showdown kept the restored PP');
  assert.equal((await saved(page)).inventory.maxElixir || 0, 0, 'one item was consumed');
  assert.match(await page.locator('#battle-log').innerText(), /PP fully restored!/);
  assert.equal(await page.locator('#player-hp-text').innerText(), `${restored.hp}/${restored.maxHp}`);
  assert.ok(restored.hp > 0, `${restored.name} needs to remain in battle after using the item`);

  const savedTurn = await snapshot(page);
  const checkpoint = await page.evaluate(() => JSON.parse(localStorage.getItem('pbs_story_save')).storyBattleCheckpoint);
  assert.ok(checkpoint?.resume?.simulation, 'The Bag action stores a native checkpoint');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('.menu-btn-quickplay--continue').click();
  await fight.waitFor({ state: 'visible' });
  await page.waitForFunction(() => !state.isLocked && state.resumedStoryTurn);
  assert.deepEqual(await snapshot(page), savedTurn, 'Continue restores the exact board after the bag turn');
  assert.equal((await saved(page)).inventory.maxElixir || 0, 0, 'Continue keeps the item consumed');

  await playMove(page, fight);
  const afterMove = await readActive();
  assert.equal(afterMove.turn, restored.turn + 1);
  assert.ok(afterMove.pp.some((pp, slot) => pp < restored.pp[slot]), 'a native move spent PP again after using the item');
  assert.equal(await page.locator('#player-hp-text').innerText(), `${afterMove.hp}/${afterMove.maxHp}`);
  console.log('Story Bag spent one Max Elixir and one native turn; Continue kept the board and accepted the next move.');
}

const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
try {
  const fingerprints = [];
  const scenarios = [
    { seed: 17, difficulty: 'hard', viewport: { width: 320, height: 568 }, playToLoss: true },
    { seed: 253, difficulty: 'hard', viewport: { width: 568, height: 320 } },
  ];
  if (process.env.BATTLE_TEST_STORY_BAG === '1') scenarios.push({ seed: 253, difficulty: 'veryeasy', withBag: true });
  for (const { seed, difficulty, withBag, playToLoss, viewport = { width: 390, height: 844 } } of scenarios) {
    const context = await browser.newContext({
      viewport, hasTouch: true, isMobile: true,
      reducedMotion: 'reduce', serviceWorkers: 'block',
    });
    try {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => {
        if (/Exact turn could not be restored|Could not save the resolved battle turn|Could not prepare the saved battle/.test(message.text())) console.error(message.text());
      });
      await page.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
      await page.goto(url.href, { waitUntil: 'domcontentloaded' });
      await page.locator('#app-loading-overlay').waitFor({ state: 'hidden' });
      const story = page.locator('.menu-btn-quickplay--story');
      await story.click();
      await page.locator('.story-menu-btn--new').click();
      await page.getByRole('textbox', { name: 'Trainer name' }).fill('Retry Scout');
      await page.locator(`.story-create-diff-card[data-diff="${difficulty}"]`).click();
      await page.locator('.story-create-advanced summary').click();
      await page.locator('#story-create-seed').fill(String(seed));
      await page.locator('#story-create-begin').click();

      const objective = page.locator('.story-city-objective').first();
      await reach(page, objective);
      await objective.click();
      const choose = page.locator('#story-prof-rolled-card .prof-pick-choice').first();
      await reach(page, choose);
      await choose.click();
      await page.locator('#prof-accept-btn').click();
      await page.getByText(/joined your team!/).waitFor();
      const bond = page.getByRole('dialog').filter({ hasText: 'Your first partner' });
      await bond.waitFor();
      assert.match(await bond.innerText(), /one tier ahead of each town/);
      await bond.getByRole('button', { name: 'Back to the lab', exact: true }).click();
      await page.locator('#screen-story-professor .story-shop-back-btn').click();
      await reach(page, objective);
      const objectiveName = await objective.innerText();
      if (withBag && !objectiveName.includes('Pokémart')) {
        await page.locator('#screen-story-city').getByRole('button', { name: /Department Store/ }).first().click();
      } else {
        assert.match(objectiveName, /Pokémart/);
        await objective.click();
      }
      const leaveMart = page.locator('#screen-story-shop .story-shop-back-btn');
      if (withBag) {
        const stock = page.locator('#screen-story-shop [data-item-id="maxElixir"]');
        await reach(page, stock.getByRole('button', { name: 'Buy', exact: true }), { activate: true });
        assert.equal((await saved(page)).inventory.maxElixir, 1);
      }
      await reach(page, leaveMart.filter({ visible: true }).or(objective.filter({ visible: true })).first());
      if (await leaveMart.isVisible()) await leaveMart.click();
      await reach(page, objective);
      assert.match(await objective.innerText(), /Rival/i);
      await objective.click();
      const fight = page.locator('#command-menu [data-cmd="fight"]');
      await reach(page, fight);
      const crop = viewport.height > viewport.width ? 'portrait' : 'landscape';
      await page.waitForFunction(crop => {
        const field = document.querySelector('#battle-field');
        return field?.dataset.crop === crop && getComputedStyle(field).backgroundImage.includes('/story/pallet-harbor.webp');
      }, crop, { timeout: 5000 });
      if (out) await page.screenshot({ path: join(out, `rival-battle-${viewport.width}.png`) });
      const initial = await snapshot(page);
      if (process.env.BATTLE_EXPECT_STORY_ENGINE) {
        assert.equal(initial.engine, process.env.BATTLE_EXPECT_STORY_ENGINE);
        await page.locator(`#screen-battle[data-battle-engine="${initial.engine}"]`).waitFor();
      }
      const before = await saved(page);
      const first = await playMove(page, fight, withBag || playToLoss);
      if (withBag) {
        assert.equal(first.board.over, false, 'the Bag scenario needs a second turn');
        await verifyBattleBag(page, fight);
        assert.deepEqual(errors, []);
        continue;
      }
      const locked = await enemyLock(page);
      if (playToLoss) {
        let board = first.board;
        for (let turn = 1; turn < 30 && !board.over; turn++) board = (await playMove(page, fight, true)).board;
        assert.ok(board.over && board.player.every(mon => mon.hp === 0), 'one scenario loses naturally through real battle turns');
      }
      const gameOver = await lose(page);
      await acknowledge(page).waitFor();
      assert.match(await page.getByRole('dialog', { name: 'Rival', exact: true }).innerText(), /One to nothing/);
      if (out) await page.screenshot({ path: join(out, `rival-scene-${viewport.width}.png`) });
      await acknowledge(page).click();
      const advance = gameOver.getByRole('button', { name: /^Continue the story/ });
      assert.match(await advance.innerText(), /Keep your gold/);
      assert.match(await gameOver.innerText(), /A rematch is optional/);
      assert.equal(await page.locator('#toast-host').isVisible(), false, 'town notifications wait while the defeat choices are open');
      const advanceBox = await advance.boundingBox();
      assert.ok(advanceBox.y >= 0 && advanceBox.y + advanceBox.height <= viewport.height, 'the main action fits without scrolling');
      if (out) await page.screenshot({ path: join(out, `rival-options-${viewport.width}.png`) });
      if (initial.engine === 'showdown') {
        await gameOver.getByRole('button', { name: 'Understand this battle' }).click();
        const review = page.getByRole('dialog', { name: 'Explain this battle' });
        await review.getByRole('heading', { name: 'What happened' }).waitFor();
        assert.match(await review.innerText(), / used /);
        assert.doesNotMatch(await review.innerText(), /outcomes appear here after the first attack/);
        await review.getByRole('button', { name: 'Close', exact: true }).click();
      }
      const defeat = await saved(page);
      assert.equal(defeat.gold, before.gold);
      assert.equal(defeat.event, before.event);
      assert.equal(defeat.losses, before.losses + 1);

      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.locator('#app-loading-overlay').waitFor({ state: 'hidden' });
      await story.click();
      await page.locator('#story-continue-btn').click();
      assert.deepEqual(await saved(page), defeat, 'reloading a defeat keeps the saved battle, inventory and gold');
      await gameOver.waitFor({ state: 'visible', timeout: 5000 });
      assert.equal(await acknowledge(page).count(), 0, 'an acknowledged scene does not replay on reload');
      await gameOver.getByRole('button', { name: /Retry/ }).click();
      await reach(page, fight);
      assert.deepEqual(await snapshot(page), initial, 'Retry rebuilds the same opening board');
      assert.deepEqual(await playMove(page, fight, playToLoss), first, 'the first real action gets the same result after Retry');
      await lose(page);
      await gameOver.getByRole('button', { name: /Return to last city/i }).click();
      await reach(page, objective);
      assert.deepEqual(await enemyLock(page), locked, 'retreat preserves the entire rival build');
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.locator('#app-loading-overlay').waitFor({ state: 'hidden' });
      await story.click();
      await page.locator('#story-continue-btn').click();
      await reach(page, objective);
      assert.match(await objective.innerText(), /Rival/i);
      await objective.click();
      await reach(page, fight);
      assert.deepEqual((await snapshot(page)).opponent, initial.opponent, 'town reload and re-entry keep the same rival');
      assert.deepEqual(await enemyLock(page), locked);
      await lose(page);
      const atChoice = await saved(page);
      await advance.click();
      await gameOver.waitFor({ state: 'hidden' });
      const continued = await page.evaluate(() => JSON.parse(localStorage.getItem('pbs_story_save')));
      assert.equal(continued.gold, atChoice.gold, 'the opening loss has no gold penalty');
      assert.ok(continued.eventIndex > atChoice.event);
      assert.equal(continued.rivalEncounterLog.at(-1).won, false);
      assert.deepEqual(continued.rivalEncounterLog.at(-1).team, initial.opponent.map(mon => mon.name));
      assert.equal(continued.currentEnemyLock, null);
      assert.deepEqual(errors, []);
      fingerprints.push(initial.opponent.map(mon => mon.name));
      console.log(`Story ${difficulty} seed ${seed} verified Starter bond, defeat scene, same-roster retry/retreat/reload, and story continuation`);
    } catch (error) {
      const [page] = context.pages();
      if (page) {
        const visible = await page.locator('.screen:visible, [role="dialog"]:visible').evaluateAll(nodes =>
          nodes.map(node => node.id || node.getAttribute('aria-label')));
        console.error(`Story ${difficulty} seed ${seed} stopped at`, visible);
      }
      throw error;
    } finally {
      await context.close();
    }
  }
  assert.notDeepEqual(fingerprints[0], fingerprints[1], 'different journey seeds rolled distinct opponents');
} finally {
  await browser.close();
}
