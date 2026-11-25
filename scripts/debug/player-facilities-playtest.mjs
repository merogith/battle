import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { stripVTControlCharacters } from 'node:util';
import { chromium } from 'playwright';

const base = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5177/battle.html');
const output = process.env.BATTLE_PLAYTEST_OUT || '/tmp/battle-facilities-playtest';
const compact = process.env.BATTLE_FACILITY_SHORT === '1';
const fixture = new URL(base);
fixture.searchParams.set('testmega', '1');
const report = {
  status: 'passed',
  fixture: 'City 7 debug save with six badges and 50,000 gold. Party IDs, a Vulpix, and one HP Up are seeded for facility checks.',
  viewport: compact ? { width: 568, height: 260 } : { width: 390, height: 844 },
  findings: [],
  observations: [],
  trace: [],
};

await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
const context = await browser.newContext({
  viewport: report.viewport,
  hasTouch: true,
  isMobile: true,
  reducedMotion: 'reduce',
  serviceWorkers: 'block',
});
const page = await context.newPage();
page.setDefaultTimeout(7000);
const externalHosts = new Set();
await page.route('**/*', route => {
  const url = new URL(route.request().url());
  if (url.origin === base.origin || url.protocol === 'data:') return route.continue();
  externalHosts.add(url.host);
  return route.abort();
});
page.on('pageerror', error => report.findings.push({ area: 'browser', message: error.message }));

const city = page.locator('#screen-story-city');
const explore = page.locator('#screen-story-city [data-action-key]');
const closedTutorial = '.story-tutorial-overlay .story-tutorial-continue:visible, ' +
  'button[data-narr-continue="1"]:visible, #modal-game-alert:not(.hidden) button:visible';
const confirm = page.locator('#modal-game-confirm');
let current;

async function uiState() {
  return page.evaluate(() => ({
    screens: [...document.querySelectorAll('.screen:not(.hidden)')].map(el => el.id),
    dialogs: [...document.querySelectorAll('.modal:not(.hidden), .story-tutorial-overlay')]
      .map(el => el.id || el.querySelector('.story-dialog-nameplate')?.textContent || el.className),
  }));
}

async function ready(target) {
  let seenUnobstructed = false;
  for (let i = 0; i < 45; i++) {
    const overlay = page.locator(closedTutorial).filter({ visible: true }).last();
    if (await overlay.count()) {
      const label = await overlay.evaluate(button => {
        const dialog = button.closest('.story-tutorial-overlay, .modal, .story-narrative-overlay');
        return (dialog || button).innerText.trim();
      });
      if (current) current.dialogs.push(label);
      await overlay.click({ timeout: 1600 });
      seenUnobstructed = false;
      continue;
    }
    const unobstructed = await target.isVisible();
    if (unobstructed && seenUnobstructed) return;
    seenUnobstructed = unobstructed;
    await page.waitForTimeout(150);
  }
  assert.fail(`Could not reach ${target} | ${JSON.stringify(await uiState())}`);
}

async function loadGame(tab, url) {
  await tab.goto(url.href, { waitUntil: 'commit', timeout: 35000 });
  await tab.locator('#app-loading-overlay').waitFor({ state: 'attached', timeout: 35000 });
  await tab.locator('#app-loading-overlay').waitFor({ state: 'hidden', timeout: 35000 });
}

async function visit(key) {
  const control = city.locator(`[data-action-key="${key}"]`);
  await ready(control);
  await control.click();
}

async function assertGoldIsClear(goldSelector) {
  const [gold, gear] = await Promise.all([
    page.locator(goldSelector).boundingBox(),
    page.locator('button.icon-btn.settings-btn').boundingBox(),
  ]);
  assert.ok(gold && gear, 'Gold and Settings must both be visible');
  assert.ok(gold.x + gold.width <= gear.x, 'Settings must leave the gold total readable');
}

async function mark(label, detail) {
  const state = await uiState();
  const screenshot = `${String(report.trace.length + 1).padStart(2, '0')}-${label}.png`;
  await page.screenshot({ path: join(output, screenshot), animations: 'disabled' });
  report.trace.push({
    step: label,
    ...state,
    dialogs: [...(current?.dialogs || []), ...state.dialogs],
    screenshot,
    detail,
  });
  if (current) current.dialogs.length = 0;
}

async function saved() {
  return page.evaluate(() => JSON.parse(localStorage.getItem('pbs_story_save')));
}

async function decide(label, evidence) {
  await confirm.waitFor({ state: 'visible' });
  const message = await confirm.locator('p').innerText();
  current.dialogs.push(message);
  if (evidence) await mark(evidence, { selection: label });
  await confirm.getByRole('button', { name: label, exact: true }).click();
  await confirm.waitFor({ state: 'hidden' });
  return message;
}

async function back(screen) {
  const control = page.locator(`#${screen} .story-shop-back-btn`);
  await ready(control);
  await control.click();
  await ready(city);
}

async function resumeCity() {
  await loadGame(page, base);
  const start = page.locator('.menu-btn-quickplay--story');
  await ready(start);
  await start.click();
  const resume = page.getByRole('button', { name: /Continue Run/ });
  await ready(resume);
  await resume.click();
  await ready(city);
}

async function step(name, action) {
  current = { name, dialogs: [] };
  try {
    await action();
    console.log(`PASS ${name}`);
  } catch (error) {
    report.status = 'failed';
    const message = stripVTControlCharacters(error.message);
    report.findings.push({ area: name, message });
    console.error(`FAIL ${name} ${message}`);
    await mark(`${name}-error`).catch(() => {});
    if (await confirm.isVisible()) await decide('Cancel').catch(() => {});
    const exit = page.locator('.screen:not(.hidden) .story-shop-back-btn:visible').first();
    if (await exit.isVisible()) {
      await ready(exit).then(() => exit.click()).catch(() => {});
    }
  } finally {
    current = null;
  }
}

try {
  await loadGame(page, fixture);
  await ready(city);
  await page.evaluate(() => {
    const run = window.StoryMode.state;
    // The debug route builds a party without the IDs normally set by catches.
    run.team.forEach((slot, index) => { slot.id ||= `facility-fixture-${index}`; });
    const last = run.team.length - 1;
    run.team[last] = { ...run.team[last], name: 'Vulpix', build: window.makeBuild('Vulpix') };
    const charizard = run.team.find(slot => slot.name === 'Charizard');
    charizard.build.ivs = { ...charizard.build.ivs, hp: 18 };
    run.inventory.hpUp = 1;
    window.StoryMode.upgrades.save();
  });
  const initial = await saved();
  assert.equal(initial.badges, 6);
  assert.ok(initial.team.find(slot => slot.name === 'Charizard'));
  await mark('city-7-hub', { actions: await explore.allInnerTexts() });

  await step('pokemart', async () => {
    await visit('mart');
    const card = page.locator('#story-shop-grid [data-item-id="pokeBall"]');
    const buy = card.getByRole('button', { name: 'Buy' });
    await ready(buy);
    const before = await saved();
    const ballCount = await page.evaluate(() => window.StoryMode.state.balls?.poke || 0);
    if (ballCount !== (before.balls?.poke || 0)) {
      report.observations.push({
        area: 'first Mart visit',
        message: `The welcome gift was displayed and added to the live bag (${ballCount}), but the primary save still contained ${before.balls?.poke || 0} until another save occurred.`,
      });
    }
    const price = Number((await card.locator('.price').innerText()).replace(/[^0-9]/g, ''));
    assert.ok(price > 0);
    await buy.click();
    await page.waitForFunction(gold => JSON.parse(localStorage.getItem('pbs_story_save')).gold === gold, before.gold - price);
    const after = await saved();
    assert.equal(after.gold, before.gold - price);
    assert.equal(after.balls.poke, ballCount + 1);
    await mark('pokemart-purchase', { item: 'Poké Ball', price, before: ballCount, after: after.balls.poke });
    await back('screen-story-shop');
  });

  await step('pokemon-center', async () => {
    await visit('center');
    const center = page.locator('#screen-story-pokemoncenter');
    const member = center.locator('.pc-card[data-pc-row="party"]').filter({ hasText: 'Lucario' });
    const deposit = member.getByRole('button', { name: 'Deposit' });
    await ready(deposit);
    await deposit.click();
    const stored = center.locator('.pc-card[data-pc-row="pc"]').filter({ hasText: 'Lucario' });
    const withdraw = stored.getByRole('button', { name: 'Withdraw' });
    await ready(withdraw);
    assert.ok((await saved()).pcBox.some(slot => slot.name === 'Lucario'));
    const search = center.getByRole('searchbox', { name: 'Search PC box by name' });
    await search.fill('Lucario');
    await mark('pc-lucario-deposited');
    await withdraw.click();
    await ready(deposit);
    const run = await saved();
    assert.ok(run.team.some(slot => slot.name === 'Lucario'));
    assert.ok(!run.pcBox.some(slot => slot.name === 'Lucario'));
    await mark('pc-lucario-withdrawn');
    await back('screen-story-pokemoncenter');
  });

  /**
   * All three training facilities use the same governed confirm flow.
   * Check that cancel changes neither cash nor build, then buy the same preview.
   */
  async function train(key, kind, optionSelector, attr, field) {
    await visit(key);
    const facility = page.locator('#screen-story-tutor');
    const partner = facility.locator('.story-tutor-mon-toggle').filter({ hasText: 'Charizard' });
    await ready(partner);
    await assertGoldIsClear('#story-tutor-gold');
    await partner.tap();
    if (kind === 'nature') await facility.getByText('Compare all natures', { exact: true }).tap();
    const option = facility.locator(optionSelector).first();
    await ready(option);
    const selection = await option.getAttribute(attr);
    assert.ok(selection);
    const before = await saved();
    const beforeBuild = before.team.find(slot => slot.name === 'Charizard').build;
    await option.tap();
    const apply = facility.locator(`.tx-confirm-bar-btn[data-action="${kind}"]:enabled`);
    await ready(apply);
    const confirmation = await apply.innerText();
    assert.match(confirmation, /Confirm/i);
    await mark(`${key}-preview`, { selection });
    await apply.tap();
    const text = await decide('Cancel', key === 'tutor' ? 'tutor-purchase-confirmation' : undefined);
    const cancelled = await saved();
    assert.equal(cancelled.gold, before.gold);
    assert.deepEqual(cancelled.team.find(slot => slot.name === 'Charizard').build, beforeBuild);
    if (!(await apply.isVisible())) await option.tap();
    await apply.tap();
    await decide('OK');
    await page.waitForFunction(({ field, selection }) => {
      const run = JSON.parse(localStorage.getItem('pbs_story_save'));
      const value = run.team.find(slot => slot.name === 'Charizard').build[field];
      return Array.isArray(value) ? value.includes(selection) : value === selection;
    }, { field, selection });
    const after = await saved();
    assert.ok(after.gold < before.gold);
    await mark(`${key}-committed`, { selection, cost: before.gold - after.gold, confirmation: text });
    await back('screen-story-tutor');
  }

  await step('move-tutor', () => train('tutor', 'move',
    'button.tx-card[data-card-kind="move"]:not([data-disabled="1"]):not([data-equipped="1"]):not([disabled]):visible',
    'data-card-value', 'm'));
  await step('battle-dojo', () => train('dojo', 'item',
    'button.tx-card[data-card-kind="item"]:not([data-disabled="1"]):not([data-equipped="1"]):not([data-card-value="None"]):not([data-active="1"]):not([disabled]):visible',
    'data-card-value', 'i'));
  await step('nature-rater', () => train('nature', 'nature',
    'button.tx-nature-cell[data-nature]:not([disabled]):visible', 'data-nature', 'n'));

  await step('ev-trainer', async () => {
    await visit('evtrainer');
    const facility = page.locator('#screen-story-evtrainer');
    const partner = facility.locator('.story-tutor-mon-toggle').filter({ hasText: 'Charizard' });
    await ready(partner);
    await assertGoldIsClear('#story-evtrainer-gold');
    await partner.tap();
    await facility.getByText('Current EVs and other training spreads', { exact: true }).tap();
    const buy = facility.locator('[id$="-equal"]').getByRole('button', { name: 'Buy 504 EVs · 5,000G', exact: true });
    await ready(buy);
    const before = await saved();
    await buy.tap();
    await decide('OK');
    await page.waitForFunction(gold => JSON.parse(localStorage.getItem('pbs_story_save')).gold === gold, before.gold - 5000);
    const after = await saved();
    assert.deepEqual(after.team.find(slot => slot.name === 'Charizard').build.evs,
      { hp: 84, atk: 84, def: 84, spa: 84, spd: 84, spe: 84 });
    await mark('ev-trainer-equal-spread', { cost: before.gold - after.gold, totalEVs: 504 });
    await back('screen-story-evtrainer');
  });

  await step('colress', async () => {
    await visit('colress');
    if (compact) {
      const lesson = page.getByRole('dialog', { name: 'Colress', exact: true });
      const reader = lesson.getByRole('group', { name: 'Tutorial text' });
      const proceed = lesson.getByRole('button', { name: /Continue/ });
      await reader.waitFor();
      await page.waitForFunction(() => document.activeElement.classList.contains('story-tutorial-scene'));
      const readingStart = await reader.evaluate(el => ({
        scrollTop: el.scrollTop,
        pageTop: el.querySelector('.story-dialog-text').getBoundingClientRect().top,
        bottom: el.getBoundingClientRect().bottom,
      }));
      assert.equal(readingStart.scrollTop, 0);
      assert.ok(readingStart.pageTop >= 0 && readingStart.pageTop < readingStart.bottom, 'Lesson starts on its first paragraph');
      const footer = await proceed.boundingBox();
      assert.ok(footer.y >= 0 && footer.y + footer.height <= report.viewport.height && footer.height >= 44, 'Continue fits while reading');
      await mark('colress-lesson-start', readingStart);
      await page.keyboard.press('End');
      await page.waitForFunction(() => document.querySelector('.story-tutorial-scene').scrollTop > 0);
      await page.keyboard.press('Tab');
      assert.ok(await proceed.evaluate(el => document.activeElement === el));
      await page.keyboard.press('Shift+Tab');
      assert.ok(await reader.evaluate(el => document.activeElement === el));
      await mark('colress-lesson-end');
      await proceed.tap();
    }
    const facility = page.locator('#screen-story-colress');
    const partner = facility.locator('.story-tutor-mon-toggle').filter({ hasText: 'Charizard' });
    await ready(partner);
    await assertGoldIsClear('#story-colress-gold');
    await partner.tap();
    const type = facility.locator('.tx-tera-grid [data-tera-type]:not([data-current="1"])').first();
    await ready(type);
    const selection = await type.getAttribute('data-tera-type');
    const before = await saved();
    await type.tap();
    await decide('OK');
    await page.waitForFunction(gold => JSON.parse(localStorage.getItem('pbs_story_save')).gold === gold, before.gold - 5000);
    const after = await saved();
    const build = after.team.find(slot => slot.name === 'Charizard').build;
    assert.equal(build.gimmick, 'TERA');
    assert.equal(build.teraType, selection);
    assert.equal(build.i, before.team.find(slot => slot.name === 'Charizard').build.i);
    await mark('colress-tera-purchase', { type: selection, cost: before.gold - after.gold, item: build.i });
    const voucher = facility.getByRole('checkbox', { name: /Use a Wishing Piece/ });
    await voucher.tap();
    assert.equal(await voucher.isChecked(), true);
    const alternative = facility.locator('.tx-tera-grid [data-tera-type]:not([data-current="1"])').first();
    const voucherType = await alternative.getAttribute('data-tera-type');
    await alternative.tap();
    await confirm.waitFor({ state: 'visible' });
    assert.match(await confirm.innerText(), /Uses one Wishing Piece/);
    await decide('OK');
    const paidWithVoucher = await saved();
    assert.equal(paidWithVoucher.team.find(slot => slot.name === 'Charizard').build.teraType, voucherType);
    assert.equal(paidWithVoucher.gold, after.gold);
    assert.equal(paidWithVoucher.inventory.wishingPiece || 0, after.inventory.wishingPiece - 1);
    await mark('colress-tera-voucher', { type: voucherType, voucherCost: 1 });
    await back('screen-story-colress');
  });

  await step('battle-mentor', async () => {
    await visit('mentor');
    const facility = page.locator('#screen-story-mentor');
    const build = facility.locator('.story-tutor-mon').filter({ hasText: 'Charizard' }).locator('[data-fastbuild-open]');
    await ready(build);
    await build.click();
    const apply = facility.locator('[data-fastbuild-apply]:enabled');
    await ready(apply);
    const before = await saved();
    const price = (await apply.innerText()).match(/([\d,]+)G/);
    assert.ok(price, 'The mentor must show a priced plan before applying it');
    const cost = Number(price[1].replaceAll(',', ''));
    await mark('mentor-priced-plan', { cost });
    await apply.click();
    await decide('OK');
    await page.waitForFunction(gold => JSON.parse(localStorage.getItem('pbs_story_save')).gold === gold, before.gold - cost);
    const after = await saved();
    assert.notDeepEqual(after.team[0].build, before.team[0].build);
    await mark('mentor-build-applied', { cost });
    await back('screen-story-mentor');
  });

  await step('fan-club', async () => {
    await visit('fanclub');
    const facility = page.locator('#screen-story-fanclub');
    const partner = facility.locator('.story-tutor-mon-toggle').filter({ hasText: 'Charizard' });
    await ready(partner);
    await partner.click();
    const use = facility.locator('button[onclick*="applyPermBoost(\'hpUp\'"]:enabled');
    await ready(use);
    const before = await saved();
    await use.click();
    await page.waitForFunction(hp => JSON.parse(localStorage.getItem('pbs_story_save')).team[0].build.ivs.hp === hp,
      before.team[0].build.ivs.hp + 3);
    const after = await saved();
    assert.equal(after.inventory.hpUp || 0, before.inventory.hpUp - 1);
    assert.equal(after.gold, before.gold);
    await mark('fan-club-hp-up', { hpIVBefore: before.team[0].build.ivs.hp, hpIVAfter: after.team[0].build.ivs.hp });
    await back('screen-story-fanclub');
  });

  await step('stone-shop', async () => {
    await visit('stoneShop');
    const card = page.locator('#story-stone-shop-grid .story-shop-card').filter({ has: page.getByRole('heading', { name: 'Fire Stone', exact: true }) });
    const buy = card.getByRole('button', { name: /Buy/ });
    await ready(buy);
    const before = await saved();
    await buy.click();
    await decide('OK');
    await page.waitForFunction(gold => JSON.parse(localStorage.getItem('pbs_story_save')).gold === gold, before.gold - 500);
    const after = await saved();
    assert.equal(after.inventory.fireStone, (before.inventory.fireStone || 0) + 1);
    await mark('fire-stone-purchase', { cost: 500 });
    await back('screen-story-stone-shop');
  });

  await step('evolution-tutor', async () => {
    await visit('evolab');
    const facility = page.locator('#screen-story-evolab');
    const partner = facility.locator('.story-tutor-mon-toggle').filter({ hasText: 'Vulpix' });
    await ready(partner);
    await partner.click();
    const evolve = facility.locator('button[onclick*="evoLabEvolve("]:enabled').filter({ hasText: /Evolve/ });
    await ready(evolve);
    const before = await saved();
    const id = before.team.find(slot => slot.name === 'Vulpix').id;
    await evolve.click();
    await decide('OK');
    await page.waitForFunction(id => JSON.parse(localStorage.getItem('pbs_story_save')).team
      .some(slot => slot.id === id && slot.name === 'Ninetales'), id);
    const after = await saved();
    assert.equal(after.inventory.fireStone || 0, before.inventory.fireStone - 1);
    assert.ok(after.gold < before.gold);
    const owned = await page.evaluate(() => JSON.parse(localStorage.getItem('pbs_story_meta')).pokedex.Ninetales.caught);
    assert.equal(owned, true);
    await mark('vulpix-evolved', { cost: before.gold - after.gold, id, fireStoneConsumed: true });
    await back('screen-story-evolab');
  });

  await step('cable-link', async () => {
    await visit('link');
    const facility = page.locator('#screen-story-link');
    const partner = facility.locator('.story-tutor-mon-toggle').filter({ hasText: 'Rattata' }).first();
    await ready(partner);
    const index = Number(await partner.getAttribute('data-team'));
    if (compact) {
      await partner.scrollIntoViewIfNeeded();
      assert.ok(await partner.evaluate(el => {
        const { left, top, width, height } = el.getBoundingClientRect();
        return el.contains(document.elementFromPoint(left + width / 2, top + height / 2));
      }), 'The switcher clears the Cable Link card touch target');
      await mark('cable-link-card-target');
      await partner.tap();
    } else {
      await partner.click();
    }
    const trade = facility.getByRole('button', { name: /Same Tier Swap \(/ });
    await ready(trade);
    const before = await saved();
    await trade.click();
    await decide('OK');
    await page.waitForFunction(index => JSON.parse(localStorage.getItem('pbs_story_save')).team[index].name !== 'Rattata', index);
    const after = await saved();
    assert.ok(after.gold < before.gold);
    const received = after.team[index].name;
    const owned = await page.evaluate(name => JSON.parse(localStorage.getItem('pbs_story_meta')).pokedex[name].caught, received);
    assert.equal(owned, true);
    await mark('cable-link-trade', { from: 'Rattata', to: received, cost: before.gold - after.gold });
    await back('screen-story-link');
  });

  await step('reload-progress', async () => {
    const before = await saved();
    await resumeCity();
    const after = await saved();
    for (const field of ['gold', 'badges', 'eventIndex', 'balls']) assert.deepEqual(after[field], before[field]);
    const party = run => run.team.map(({ name, build }) =>
      [name, build.m, build.i, build.n, build.evs, build.gimmick, build.teraType]);
    assert.deepEqual(party(after), party(before));
    await mark('reload-progress', { badges: after.badges, gold: after.gold });
  });

  await step('relics-annex', async () => {
    // City 7 only offers Relic management. Use this fixture's own save as a
    // snapshot of the just-cleared City 6 to exercise the Annex purchase.
    const eventIndex = await page.evaluate(() => {
      const snapshot = JSON.parse(localStorage.getItem('pbs_story_save'));
      snapshot.eventIndex = window.STORY_EVENTS_RAW.findIndex(row => row[0] === 40);
      window.StoryMode.state.active = false; // stop the old fixture from writing on pagehide
      localStorage.setItem('pbs_story_save', JSON.stringify(snapshot));
      return snapshot.eventIndex;
    });
    assert.ok(eventIndex > 0);
    await resumeCity();
    assert.equal((await saved()).eventIndex, eventIndex);
    await visit('relic');
    const shop = page.locator('#screen-story-artifact-shop');
    const buy = shop.locator('.story-artifact-card .story-shop-buy-btn:enabled').first();
    await ready(buy);
    const before = await saved();
    await buy.click();
    await decide('OK', 'relic-claim-confirmation');
    await page.waitForFunction(gold => JSON.parse(localStorage.getItem('pbs_story_save')).gold === gold, before.gold - 5000);
    const bought = await saved();
    const id = bought.artifacts.find(artifact => !before.artifacts.includes(artifact));
    assert.ok(id);
    assert.ok(bought.artifactsDisabled.includes(id));
    assert.equal(bought.artifactShopPurchasedByCity['6'], id);
    assert.equal(await shop.locator('.story-artifact-card .story-shop-buy-btn:enabled').count(), 0);
    await mark('relic-claimed-inactive', { id, cost: 5000 });

    await shop.getByRole('button', { name: /Manage/ }).click();
    const hall = page.locator('#screen-story-artifacts');
    const enable = hall.getByRole('button', { name: 'Enable Relic' });
    await ready(enable);
    await enable.click();
    assert.ok(!(await saved()).artifactsDisabled.includes(id));
    await mark('relic-enabled', { id });
    await hall.getByRole('button', { name: 'Disable Relic' }).click();
    assert.ok((await saved()).artifactsDisabled.includes(id));
    await back('screen-story-artifacts');
  });

  await step('department-store', async () => {
    await visit('dept');
    const shop = page.locator('#screen-story-shop');
    const card = shop.locator('.story-featured-section [data-item-id^="mega_"], .story-featured-section [data-item-id^="ultra_"]').first();
    const buy = card.locator('.story-shop-buy-btn:enabled');
    await ready(buy);
    const id = await card.getAttribute('data-item-id');
    const price = Number((await card.locator('.price').innerText()).replace(/[^0-9]/g, ''));
    assert.ok(price > 0);
    const before = await saved();
    await buy.click();
    await decide('OK');
    await page.waitForFunction(gold => JSON.parse(localStorage.getItem('pbs_story_save')).gold === gold, before.gold - price);
    const after = await saved();
    assert.equal(after.inventory[id], (before.inventory[id] || 0) + 1);
    assert.equal(after.deptShopPurchasedByCity['6'][id], true);
    assert.equal(await card.getByRole('button', { name: /Claimed/ }).isDisabled(), true);
    await mark('department-featured-purchase', { id, price, secondPurchaseLocked: true });
    await back('screen-story-shop');
  });

  await step('interrupted-mart-welcome', async () => {
    const isolated = await browser.newContext({
      viewport: report.viewport,
      hasTouch: true,
      isMobile: true,
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    const second = await isolated.newPage();
    await second.route('**/*', route => new URL(route.request().url()).origin === base.origin ? route.continue() : route.abort());
    try {
      const mart = second.locator('#screen-story-city [data-action-key="mart"]');
      const welcome = second.locator('.story-tutorial-overlay').filter({ hasText: 'five Poké Balls' });
      const giftState = () => second.evaluate(() => {
        const run = JSON.parse(localStorage.getItem('pbs_story_save'));
        return {
          marked: !!run?.scenesShown?.['tutorial-first-mart'],
          balls: window.StoryMode.state.balls?.poke || 0,
        };
      });
      await loadGame(second, fixture);
      await mart.click();
      await welcome.waitFor({ state: 'visible' });
      const interrupted = await giftState();
      const screenshot = 'interrupted-mart-before-reload.png';
      await second.screenshot({ path: join(output, screenshot), animations: 'disabled' });
      report.trace.push({
        step: 'mart-welcome-before-reload',
        screens: ['screen-story-shop'],
        dialogs: [await welcome.innerText()],
        screenshot,
        detail: interrupted,
      });

      await loadGame(second, base);
      await second.locator('.menu-btn-quickplay--story').click();
      await second.getByRole('button', { name: /Continue Run/ }).click();
      await mart.click();
      const returned = await welcome.waitFor({ state: 'visible', timeout: 1200 }).then(() => true, () => false);
      if (returned) {
        await welcome.locator('.story-tutorial-continue').click();
        await welcome.waitFor({ state: 'hidden' });
      }
      const resumed = await giftState();
      const resumedScreenshot = 'interrupted-mart-after-reload.png';
      await second.screenshot({ path: join(output, resumedScreenshot), animations: 'disabled' });
      report.trace.push({
        step: 'mart-welcome-after-reload',
        screens: ['screen-story-shop'],
        dialogs: [],
        screenshot: resumedScreenshot,
        detail: { returned, ...resumed },
      });
      assert.equal(resumed.balls, 5, 'Leaving before the Mart welcome finishes must not permanently remove the five-ball gift');
      assert.equal(resumed.marked, true, 'The completed welcome must be saved with the gift');
      assert.equal(await second.locator('#modal-game-alert').isVisible(), false, 'The gift needs only one confirmation');
    } finally {
      await isolated.close();
    }
  });
} catch (error) {
  report.status = 'failed';
  report.findings.push({ area: 'setup', message: error.message });
  console.error(error);
  await mark('setup-error').catch(() => {});
} finally {
  if (report.findings.length) report.status = 'failed';
  report.externalHostsBlocked = [...externalHosts].sort();
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`Facility playtest ${report.status} · ${join(output, 'report.json')}`);
  await browser.close();
}
process.exitCode = report.status === 'passed' ? 0 : 1;
