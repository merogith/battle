import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

const base = new URL(process.env.BATTLE_TEST_URL || 'http://127.0.0.1:5173/battle.html');
const output = resolve(process.env.BATTLE_PLAYTEST_OUT || 'agent-state/playthrough/side-activities/focus');
const fixture = new URL(base);
fixture.searchParams.set('testmega', '1');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
const results = { findings: [], trace: [], fixture: 'Visited hub debug saves. Payments, wagers, choices, navigation, and Fight Club team selection use game controls. Fight Club defeat uses the developer control after a played turn.' };

async function record(page, name, details = {}) {
  const screenshot = `${name}.png`;
  await page.screenshot({ path: join(output, screenshot), animations: 'disabled' });
  results.trace.push({ name, screenshot, ...details });
  console.log(name);
}

async function advance(page, target) {
  const next = page.locator(':is(.story-tutorial-continue,[data-arrival-dismiss],[data-narr-continue],[data-vs2-battle],#modal-game-alert button):visible');
  for (let step = 0; step < 30; step++) {
    if (await next.count() && await next.last().click({ timeout: 750 }).then(() => true, () => false)) continue;
    if (await target.click({ trial: true, timeout: 500 }).then(() => true, () => false)) return;
  }
  assert.fail(`Could not reach ${target}`);
}

async function checkpoint(page, city, changes, afterGym = false) {
  await page.evaluate(({ city, changes, afterGym }) => {
    const run = window.StoryMode.state;
    const rowMatches = row => row[1] === 'City' && row[2] === `City${city}`;
    run.eventIndex = afterGym ? window.STORY_EVENTS_RAW.findLastIndex(rowMatches) : window.STORY_EVENTS_RAW.findIndex(rowMatches);
    run.citiesArrived[city] = true;
    run.roadDiscoveriesEnabled = false;
    Object.assign(run, changes);
    run.team.forEach((slot, index) => { slot.id ||= `side-team-${index}`; });
    window.StoryMode.upgrades.save();
    window.StoryMode.enterCity();
  }, { city, changes, afterGym });
}

async function reloadAndContinue(page) {
  await page.goto(base.href, { waitUntil: 'domcontentloaded' });
  await page.locator('#app-loading-overlay').waitFor({ state: 'hidden', timeout: 25000 });
  await page.locator('.menu-btn-quickplay--continue').click();
}

const live = (page, ...keys) => page.evaluate(fields => Object.fromEntries(fields.map(key => [key, window.StoryMode.state[key]])), keys);
const paidSafari = page => page.locator('#screen-story-catch [onclick*="catchThrow(\'safari\')"]');
const safSession = async page => (await live(page, 'safari')).safari.session;
const action = (page, name) => page.locator(`#screen-story-city [data-action-key="${name}"]`);
const confirmButton = (page, name) => page.locator('#modal-game-confirm').getByRole('button', { name, exact: true });

async function caseRun(name, viewport, run, reducedMotion = 'reduce') {
  if (process.env.BATTLE_SIDE_PHASE && process.env.BATTLE_SIDE_PHASE !== name) return;
  const context = await browser.newContext({ viewport, reducedMotion, serviceWorkers: 'block' });
  try {
    await context.route('**/*', route => new URL(route.request().url()).origin === base.origin ? route.continue() : route.abort());
    const page = await context.newPage();
    page.setDefaultTimeout(9000);
    page.on('pageerror', error => results.findings.push({ name, message: error.message }));
    await page.goto(fixture.href, { waitUntil: 'domcontentloaded' });
    await page.locator('#screen-story-city:visible').waitFor({ timeout: 25000 });
    await run(page);
  } catch (error) {
    results.findings.push({ name, message: error.message });
    console.error(name, error.stack);
    const page = context.pages()[0];
    if (page) await record(page, `${name}-issue`).catch(() => {});
  } finally {
    await context.close();
  }
}

try {
  await caseRun('safari', { width: 430, height: 850 }, async page => {
    await checkpoint(page, 5, { badges: 4, gold: 35000, safari: { freeEntryUsed: true }, runSeed: 1, _strngState: null });
    await advance(page, action(page, 'safari'));
    await action(page, 'safari').click();
    await confirmButton(page, 'Cancel').click();
    assert.equal((await live(page, 'gold')).gold, 35000);
    await action(page, 'safari').click();
    await confirmButton(page, 'OK').click();
    await advance(page, paidSafari(page));
    const admission = await safSession(page);
    assert.equal((await live(page, 'gold')).gold, 25000);
    assert.equal(admission.ballsLeft, 10);
    assert.equal(admission.encountersUsed, 1);
    await reloadAndContinue(page);
    await advance(page, paidSafari(page));
    assert.equal((await safSession(page)).encounter.id, admission.encounter.id);
    assert.equal((await live(page, 'gold')).gold, 25000);
    await record(page, 'safari-resumed-ticket', { encounter: admission.encounter.name });

    const catchScreen = page.locator('#screen-story-catch');
    const next = catchScreen.locator('[data-catch-continue]');
    await catchScreen.getByRole('button', { name: /Bait/ }).click();
    const baited = await safSession(page);
    assert.equal(baited.baitCount, 1);
    await reloadAndContinue(page);
    if (baited.resolved) await next.waitFor();
    else await advance(page, paidSafari(page));
    assert.equal((await safSession(page)).baitCount, 1);
    assert.equal((await safSession(page)).message, baited.message);
    if (baited.resolved) { await next.click(); await advance(page, paidSafari(page)); }
    await catchScreen.getByRole('button', { name: /Rock/ }).click();
    assert.equal((await safSession(page)).rockCount, 1);
    if ((await safSession(page)).resolved) { await next.click(); await advance(page, paidSafari(page)); }
    const beforeSkip = await safSession(page);
    await catchScreen.getByRole('button', { name: /Next encounter|Skip/ }).click();
    await advance(page, paidSafari(page));
    assert.equal((await safSession(page)).encountersUsed, beforeSkip.encountersUsed + 1);
    await catchScreen.getByRole('button', { name: /Leave Safari/ }).click();
    await advance(page, action(page, 'safari'));
    await reloadAndContinue(page);
    await advance(page, action(page, 'safari'));
    assert.equal(await safSession(page), undefined);
    await record(page, 'safari-left-and-reloaded');
  });

  await caseRun('roulette', { width: 844, height: 390 }, async page => {
    await checkpoint(page, 5, { badges: 4, gold: 35000 });
    await advance(page, action(page, 'casino'));
    await action(page, 'casino').click();
    const roulette = page.locator('#story-casino-tab-roulette');
    await advance(page, roulette);
    await roulette.click();
    const board = page.locator('#story-casino-roul-board button');
    assert.equal(await board.count(), 12);
    for (const cell of await board.all()) await cell.click();
    const result = page.locator('#story-casino-roul-result');
    await page.locator('#story-casino-roul-spin').click();
    await page.waitForFunction(() => window.StoryMode.state.casinoStats?.roul?.spins === 1);
    await page.waitForFunction(() => document.getElementById('story-casino-roul-result').textContent.includes('−50G net'));
    const stats = (await live(page, 'casinoStats')).casinoStats.roul;
    assert.equal(stats.wins || 0, 0);
    assert.equal(stats.prizesEarned || 0, 0);
    assert.equal(stats.lost, 50);
    assert.match(await result.innerText(), /−50G net/);
    await advance(page, board.first());
    await record(page, 'roulette-net-loss', { stats });
    await board.first().click();
    assert.equal(await page.locator('#story-casino-roul-repeat').isDisabled(), true);
    await page.locator('[onclick*="casinoRoulClear()"]').click();
    assert.equal(await page.locator('#story-casino-roul-repeat').isEnabled(), true);
  });

  await caseRun('casino-reload', { width: 844, height: 390 }, async page => {
    await checkpoint(page, 5, { badges: 4, gold: 35000 });
    const casino = action(page, 'casino');
    const tables = [
      { game: 'flip', tab: 'flip', button: 'flip-go', seed: 123456789, gold: 35000, expected: 35050 },
      { game: 'slots', tab: 'slots', button: 'slots-spin', seed: 6413, gold: 50, expected: 0 },
      { game: 'roul', tab: 'roulette', button: 'roul-spin', seed: 1, gold: 35000, expected: 35500 },
    ];
    const readCommitted = game => page.evaluate(game => {
      const run = JSON.parse(localStorage.getItem('pbs_story_save'));
      return { gold: run.gold, rng: run._strngState, stats: run.casinoStats?.[game] || {}, inventory: run.inventory, result: run.casinoLastResults?.[game], replay: run.casinoSlotsReplay };
    }, game);
    const openTable = async tab => {
      await advance(page, casino);
      await casino.click();
      const control = page.locator(`#story-casino-tab-${tab}`);
      await advance(page, control);
      await control.click();
    };
    for (const table of tables) {
      await openTable(table.tab);
      await page.evaluate(({ seed, gold }) => {
        const run = window.StoryMode.state;
        run.gold = gold;
        run._strngState = seed;
        run.inventory.casinoChip500 = 0;
        window.StoryMode.upgrades.save();
      }, table);
      if (table.game === 'roul') await page.locator('#story-casino-roul-board button').nth(2).click();
      const before = await readCommitted(table.game);
      const spin = page.locator(`#story-casino-${table.button}`);
      const result = page.locator(`#story-casino-${table.game}-result`);
      await spin.click();
      assert.match(await result.getAttribute('class'), /\bempty\b/, 'the normal-speed animation has not revealed the result');
      const committed = await readCommitted(table.game);
      assert.equal(committed.gold, table.expected);
      assert.equal(committed.stats.spins, (before.stats.spins || 0) + 1);
      assert.notEqual(committed.rng, before.rng);
      if (table.game === 'roul') {
        assert.equal(committed.stats.prizesEarned, 1);
        assert.notDeepEqual(committed.inventory, before.inventory);
      }
      await page.goto(base.href, { waitUntil: 'domcontentloaded' });
      await page.locator('#app-loading-overlay').waitFor({ state: 'hidden', timeout: 25000 });
      assert.deepEqual(await readCommitted(table.game), committed, 'reload persists the entire settled wager once');
      await page.locator('.menu-btn-quickplay--continue').click();
      await openTable(table.tab);
      assert.match(await result.innerText(), /^Last spin/);
      assert.ok((await result.innerText()).includes(committed.result.text));
      await record(page, `casino-${table.game}-resume`, { gold: committed.gold, stats: committed.stats });
      if (table.game === 'slots') {
        const hold = page.locator('#story-casino-slots-hold-0');
        assert.equal(committed.replay.tier, 1);
        assert.equal(await spin.isEnabled(), true, 'the free play can be redeemed with no gold');
        assert.equal(await page.locator('#story-casino-slots-coins-3').isDisabled(), true, 'free play is locked to the wager that earned it');
        await page.evaluate(() => { window.StoryMode.state._strngState = 123456789; });
        await hold.click();
        await spin.click();
        await page.waitForFunction(() => document.getElementById('story-casino-slots-result').textContent.includes('Your re-spin was free'));
        assert.equal(await page.locator('#story-casino-slots-reels .casino-slots-symbol').first().textContent(), '↻', 'the held reel stayed in place');
        const replayed = await readCommitted('slots');
        assert.equal(replayed.stats.spins, committed.stats.spins + 1);
        assert.equal(replayed.stats.lost || 0, committed.stats.lost || 0);
      }
      await page.locator('#screen-story-casino').getByRole('button', { name: 'Back to City' }).click();
    }
  }, 'no-preference');

  await caseRun('daycare', { width: 390, height: 844 }, async page => {
    const daycare = action(page, 'daycare');
    const scene = page.locator('#story-daycare-scene');
    const secret = page.locator('#story-daycare-secret');
    await checkpoint(page, 2, { badges: 1, daycare: { unlocked: true, freeEggClaimed: false, eggEventDone: false } });
    await advance(page, daycare);
    const numEggs = async () => {
      const { team, pcBox } = await live(page, 'team', 'pcBox');
      return [...team, ...pcBox].filter(slot => slot.isEgg).length;
    };
    const before = await numEggs();
    await daycare.click();
    const intro = page.locator('.story-tutorial-continue:visible');
    if (await intro.count()) await intro.click();
    await scene.locator('[data-scene-cont]').waitFor();
    assert.equal(await numEggs(), before + 1);
    await record(page, 'daycare-free-egg');
    await scene.locator('[data-scene-cont]').click();

    const picker = page.getByRole('dialog', { name: 'Daycare Inn' });
    await advance(page, daycare);
    await daycare.click();
    const trade = picker.locator('[data-daycare-drop]:enabled').first();
    const tradeId = await trade.getAttribute('data-daycare-drop');
    await trade.click();
    await confirmButton(page, 'Cancel').click();
    assert.equal(await numEggs(), before + 1);
    assert.equal(await trade.evaluate(button => button === document.activeElement), true);
    await trade.click();
    await confirmButton(page, 'OK').click();
    assert.equal(await numEggs(), before + 2);
    const { team, pcBox } = await live(page, 'team', 'pcBox');
    assert.equal([...team, ...pcBox].some(slot => slot.id === tradeId), false);
    await scene.locator('[data-scene-cont]').click();
    await scene.getByRole('button', { name: /Wait.*going/ }).click();
    await scene.getByRole('button', { name: /A career/ }).click();
    await scene.getByRole('button', { name: /back/ }).click();
    await record(page, 'daycare-went-looking');
    await scene.getByRole('button', { name: /take the egg and go/i }).click();
    await scene.locator('[data-scene-cont]').click();

    await checkpoint(page, 6, { badges: 6, pits: { fightClubUnlocked: false } }, true);
    const hatch = page.locator('#story-hatch-scene');
    await hatch.waitFor({ state: 'visible' });
    assert.match(await hatch.innerText(), /Your Eggs Hatched!/i);
    assert.equal(await hatch.locator('.story-egg-hatch-mon').count(), 2);
    await record(page, 'daycare-two-eggs-hatched');
    await hatch.locator('[data-scene-cont]').click();
    await advance(page, daycare);
    await daycare.click();
    await secret.getByRole('button', { name: /No thanks/ }).click();
    assert.equal((await live(page, 'pits')).pits.fightClubUnlocked, false);
    await daycare.click();
    await secret.getByRole('button', { name: /Tell me/ }).click();
    await secret.locator('[data-scene-cont]').click();
    await secret.getByRole('button', { name: /down the stairs/ }).click();
    await record(page, 'daycare-underground-door');
    await secret.getByRole('button', { name: /Step inside/ }).click();
    assert.equal((await live(page, 'pits')).pits.fightClubUnlocked, true);
  });

  await caseRun('crucible', { width: 768, height: 1024 }, async page => {
    const hub = page.locator('#screen-story-crucible');
    const club = hub.getByRole('button', { name: /Fight Club/ });
    await checkpoint(page, 9, { badges: 8, atCrucible: true, postHofMysteryClimaxDone: true, pcBox: [], pits: { championSnapshot: { badges: 8 } } });
    await page.evaluate(() => {
      const run = window.StoryMode.state;
      run.team = run.team.filter(slot => slot.build && !slot.isEgg).slice(0, 3);
      window.StoryMode.enterCrucible();
    });
    await advance(page, club);
    for (const label of ['Battle Mentor', 'Pokémon Fan Club', 'Stones and Beyond']) assert.equal(await hub.getByRole('button', { name: new RegExp(label) }).count(), 1);
    const saved = await live(page, 'eventIndex', 'team');
    assert.equal(saved.team.length, 3);
    await club.click();
    const alert = page.locator('#modal-game-alert');
    assert.match(await alert.innerText(), /Keep one extra fighter/);
    await alert.getByRole('button', { name: 'OK' }).click();
    await page.evaluate(() => {
      const run = window.StoryMode.state;
      run.pcBox = [{ ...structuredClone(run.team[0]), id: 'side-reserve' }];
    });
    await club.click();
    const picker = page.getByRole('dialog', { name: 'Fight Club' });
    const picks = picker.locator('[data-pits-pick]');
    await picks.first().focus();
    await page.keyboard.press('Enter');
    assert.equal(await picks.first().getAttribute('aria-pressed'), 'true');
    assert.equal(await picks.first().evaluate(button => button === document.activeElement), true);
    await picks.nth(1).click();
    await picks.nth(2).click();
    await picker.locator('#pits-start-btn').click();
    const draft = page.locator('#story-pits-draft-overlay');
    assert.equal(await draft.locator('[role="list"]').first().locator(':scope > *').count(), 6);
    await record(page, 'fight-club-house-draft');
    await draft.locator('#pits-draft-go').click();
    const fight = page.locator('#command-menu [data-cmd="fight"]');
    await advance(page, fight);
    await fight.click();
    const move = page.locator('#move-menu .battle-btn-move:enabled').first();
    await record(page, 'fight-club-real-battle');
    const switches = page.locator('#modal-party button:enabled:visible').and(page.getByRole('button', { name: 'Switch', exact: true }));
    await move.click();
    await fight.or(switches.first()).first().waitFor({ state: 'visible' });
    if (await switches.count()) await switches.first().click();
    await page.locator('#screen-battle').getByRole('button', { name: 'Settings', exact: true }).click();
    const dev = page.locator('#modal-settings details.settings-dev-block');
    if (await dev.getAttribute('open') === null) await dev.locator('summary').click();
    await dev.getByRole('button', { name: 'Dev: Auto-lose battle' }).click();
    const forfeit = page.locator('#pits-defeat-forfeit');
    await advance(page, forfeit);
    await forfeit.click();
    const confirmation = page.locator('#modal-game-confirm');
    const confirmationText = await confirmation.innerText();
    for (const fighter of saved.team) assert.ok(confirmationText.includes(fighter.nickname || fighter.name));
    await record(page, 'fight-club-forfeit-warning');
    await confirmButton(page, 'Cancel').click();
    assert.equal((await live(page, 'pits')).pits._activePickIds.length, 3);
    await forfeit.click();
    await confirmButton(page, 'OK').click();
    await alert.getByText(/joined your party from the PC/).waitFor();
    await alert.getByRole('button', { name: 'OK' }).click();
    await advance(page, club);
    const after = await live(page, 'team', 'pcBox');
    assert.deepEqual(after.team.map(slot => slot.id), ['side-reserve']);
    assert.equal(after.pcBox.length, 0);

    const rematch = hub.getByRole('button', { name: /Random Gym Rematch/ });
    await rematch.click();
    await advance(page, fight);
    await reloadAndContinue(page);
    await advance(page, club);
    assert.equal((await live(page, 'eventIndex')).eventIndex, saved.eventIndex);
    await record(page, 'crucible-resumed-after-rematch');
    await hub.getByRole('button', { name: /Save and quit to Story menu/ }).click();
    await page.locator('.story-menu-btn--collection').click();
    await page.getByRole('tab', { name: 'Memorial' }).click();
    const memorial = page.locator('#screen-collection [role="listitem"]');
    assert.equal(await memorial.count(), 3);
    await record(page, 'fight-club-memorial');
  });
} finally {
  await browser.close();
  results.status = results.findings.length ? 'failed' : 'passed';
  await writeFile(join(output, 'report.json'), JSON.stringify(results, null, 2));
  if (results.findings.length) process.exitCode = 1;
}
