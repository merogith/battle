import assert from 'node:assert/strict';
import { chromium } from 'playwright';

/* global state */

const url = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5173/battle.html');
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
  const scenarios = [17, 253].map(seed => ({ seed, difficulty: 'hard', withBag: false }));
  if (process.env.BATTLE_TEST_STORY_BAG === '1') scenarios.push({ seed: 253, difficulty: 'veryeasy', withBag: true });
  for (const { seed, difficulty, withBag } of scenarios) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true,
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
      const initial = await snapshot(page);
      if (process.env.BATTLE_EXPECT_STORY_ENGINE) {
        assert.equal(initial.engine, process.env.BATTLE_EXPECT_STORY_ENGINE);
        await page.locator(`#screen-battle[data-battle-engine="${initial.engine}"]`).waitFor();
      }
      const before = await saved(page);
      const first = await playMove(page, fight, withBag);
      if (withBag) {
        assert.equal(first.board.over, false, 'the Bag scenario needs a second turn');
        await verifyBattleBag(page, fight);
        assert.deepEqual(errors, []);
        continue;
      }
      const gameOver = page.locator('#screen-story-gameover');
      if (!first.board.over && !await gameOver.isVisible()) {
        await page.locator('#command-menu [data-cmd="run"]').click();
        await page.locator('#modal-game-confirm').getByRole('button', { name: 'OK', exact: true }).click();
      }
      await gameOver.waitFor({ state: 'visible' });
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
      await gameOver.getByRole('button', { name: /Retry/ }).click();
      await reach(page, fight);
      assert.deepEqual(await snapshot(page), initial, 'Retry rebuilds the same opening board');
      assert.deepEqual(await playMove(page, fight), first, 'the first real action gets the same result after Retry');
      assert.deepEqual(errors, []);
      fingerprints.push(initial.opponent.map(mon => mon.name));
      console.log(`Story ${difficulty} seed ${seed} recovered its defeat and repeated the first turn`);
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
