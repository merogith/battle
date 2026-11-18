import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

const base = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5177/battle.html');
assert.ok(base.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname),
  'Game Corner playtest requires a local game server');
const fixture = new URL(base);
fixture.searchParams.set('testmega', '1');
const [width, height] = (process.env.BATTLE_CASINO_VIEWPORT || '844x390').split('x').map(Number);
const shortLandscape = width > height && height <= 500;
const out = resolve(process.env.BATTLE_PLAYTEST_OUT || 'agent-state/playthrough/casino');
await mkdir(out, { recursive: true });
const report = { status: 'passed', viewport: { width, height }, findings: [], observations: [], trace: [],
  fixture: 'Local debug save moved to City 5 with four badges. Bets and navigation use game controls.' };
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
let page;
let action = 'Enter City 5';

async function capture(label, details) {
  const surfaces = await page.evaluate(() => ({
    screens: Array.from(document.querySelectorAll('.screen[id]:not(.hidden)'), el => el.id),
    dialogs: Array.from(document.querySelectorAll('.modal[id]:not(.hidden)'), el => el.id),
  }));
  const screenshot = String(report.trace.length + 1).padStart(2, '0') + '.jpg';
  await page.screenshot({ path: join(out, screenshot), type: 'jpeg', quality: 76, animations: 'disabled', timeout: 5000 });
  report.trace.push({ label, screenshot, ...surfaces, details });
  console.log(label);
}

const get = selector => page.locator(selector);
const click = selector => get(selector).click();
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('pbs_story_save')));
const tutorials = [
  '.story-tutorial-overlay .story-tutorial-continue:visible',
  'button[data-narr-continue="1"]:visible', '#modal-game-alert button:visible',
].join(', ');

async function forwardUntil(selector) {
  const end = Date.now() + 12000;
  while (Date.now() < end) {
    const top = get(tutorials).last();
    if (await top.count()) await top.click({ timeout: 900 }).catch(() => {});
    else if (await get(selector).isVisible()) {
      const canClick = await get(selector).click({ trial: true, timeout: 600 }).then(() => true, () => false);
      if (canClick) return;
    }
    await page.waitForTimeout(100);
  }
  throw new Error('Could not reach ' + selector);
}

async function wager(game, trigger, result) {
  const before = await saved();
  const count = before.casinoStats?.[game]?.spins || 0;
  const previousResult = await get(result).innerText();
  await click(trigger);
  await page.waitForFunction(({ game, count }) =>
    JSON.parse(localStorage.getItem('pbs_story_save')).casinoStats?.[game]?.spins === count + 1,
  { game, count }, { timeout: 12000 });
  await page.waitForFunction(({ result, previousResult }) => {
    const element = document.querySelector(result);
    return element && !element.classList.contains('empty') && element.innerText !== previousResult;
  }, { result, previousResult }, { timeout: 12000 });
  const after = await saved();
  const resultText = await get(result).innerText();
  assert.ok(resultText.length > 5);
  return { result: resultText, goldBefore: before.gold, goldAfter: after.gold, spins: count + 1 };
}

async function expectVisibleAction(selector) {
  const hit = await get(selector).evaluate(el => {
    const box = el.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    return box.top >= 0 && box.bottom <= innerHeight && box.height >= 44
      && el.contains(document.elementFromPoint(x, y));
  });
  assert.ok(hit, `${selector} fits and receives a tap before scrolling`);
}

try {
  const context = await browser.newContext({
    viewport: { width, height }, hasTouch: true, isMobile: true,
    reducedMotion: 'reduce', serviceWorkers: 'block',
  });
  await context.route('**/*', route =>
    new URL(route.request().url()).origin === base.origin ? route.continue() : route.abort());
  page = await context.newPage();
  page.setDefaultTimeout(7000);
  page.on('pageerror', error => report.findings.push({ severity: 'error', area: action, message: error.message }));
  await page.goto(fixture.href, { waitUntil: 'domcontentloaded' });
  await forwardUntil('.story-hud-savequit');
  await page.evaluate(() => {
    const run = window.StoryMode.state;
    run.eventIndex = window.STORY_EVENTS_RAW.findIndex(row => row[1] === 'City' && row[2] === 'City5');
    run.badges = 4;
    run.gold = 5000;
    window.StoryMode.upgrades.save();
  });
  await click('.story-hud-savequit');
  await click('#story-continue-btn');
  const casino = '.story-action-btn[data-action-key="casino"]';
  await forwardUntil(casino);
  await click(casino);
  await forwardUntil('#story-casino-flip-go');
  await expectVisibleAction('#story-casino-flip-go');
  await expectVisibleAction('#story-casino-flip-pick-tails');
  await expectVisibleAction('#story-casino-flip-bet');
  await capture('Game Corner entrance');

  action = 'Coin Flip';
  await click('#story-casino-flip-pick-tails');
  await get('#story-casino-flip-bet').fill('250');
  const flip = await wager('flip', '#story-casino-flip-go', '#story-casino-flip-result');
  await forwardUntil('#story-casino-tab-slots');
  const redeemed = flip.goldAfter - flip.goldBefore;
  assert.ok([-250, 250, 750].includes(redeemed), 'Coin flip applies the posted wager and any welcome chip');
  await capture('Coin Flip result', flip);

  action = 'Slots';
  await click('#story-casino-tab-slots');
  await expectVisibleAction('#story-casino-slots-spin');
  await click('#story-casino-slots-coins-2');
  const slots = await wager('slots', '#story-casino-slots-spin', '#story-casino-slots-result');
  await capture('Slots result', slots);

  action = 'Roulette';
  await click('#story-casino-tab-roulette');
  await expectVisibleAction('#story-casino-roul-spin');
  const chip = get('#story-casino-roul-board button').first();
  await chip.click();
  assert.match(await get('#story-casino-roul-staked').innerText(), /50\s*G/);
  const roul = await wager('roul', '#story-casino-roul-spin', '#story-casino-roul-result');
  assert.ok([-50, 500].includes(roul.goldAfter - roul.goldBefore));
  await capture('Roulette result', roul);

  action = 'Short-landscape Roulette and stats';
  const panel = get('#story-casino-panel-roulette');
  const stats = get('#story-casino-stats');
  const statsToggle = get('#story-casino-stats-btn');
  const closedHeight = await panel.evaluate(element => element.clientHeight);
  await statsToggle.click();
  assert.equal(await statsToggle.textContent(), 'Close stats');
  assert.equal(await statsToggle.getAttribute('aria-expanded'), 'true');
  assert.ok(await stats.isVisible());
  const layout = await panel.evaluate(element => {
    const game = element.getBoundingClientRect();
    const statsPanel = document.getElementById('story-casino-stats');
    const stats = statsPanel.getBoundingClientRect();
    return {
      visibleHeight: element.clientHeight,
      statsAlongside: stats.left >= game.right - 1 && Math.abs(stats.bottom - game.bottom) <= 1,
      statsScrollable: statsPanel.scrollHeight > statsPanel.clientHeight,
    };
  });
  if (shortLandscape) {
    assert.ok(layout.statsAlongside, 'Stats sits beside Roulette on short landscapes');
    assert.ok(layout.visibleHeight >= height - 125 && layout.visibleHeight >= closedHeight - 4,
      `Stats keeps the Roulette controls usable (${layout.visibleHeight}px open, ${closedHeight}px closed)`);
  }
  assert.ok(layout.statsScrollable, 'Lifetime stats scroll independently');
  await expectVisibleAction('#story-casino-roul-spin');
  await stats.press('End');
  await page.waitForFunction(() => document.getElementById('story-casino-stats').scrollTop > 0);
  await click('#story-casino-roul-repeat');
  assert.match(await get('#story-casino-roul-staked').innerText(), /50\s*G/);
  const repeat = await wager('roul', '#story-casino-roul-spin', '#story-casino-roul-result');
  assert.equal(repeat.spins, 2);
  await capture('Repeated Roulette bet with lifetime stats open', { ...repeat, closedHeight, layout });
  await statsToggle.click();
  await stats.waitFor({ state: 'hidden' });
  assert.equal(await statsToggle.textContent(), 'Stats');
  assert.equal(await statsToggle.getAttribute('aria-expanded'), 'false');
  await chip.click();
  assert.match(await get('#story-casino-roul-staked').innerText(), /50\s*G/);
  await statsToggle.click();
  await click('#screen-story-casino .story-shop-back-btn');
  await get('#screen-story-city').waitFor({ state: 'visible' });
  await click(casino);
  await statsToggle.waitFor({ state: 'visible' });
  assert.equal(await statsToggle.getAttribute('aria-expanded'), 'false');
  await stats.waitFor({ state: 'hidden' });
} catch (error) {
  report.findings.push({ severity: 'error', area: action, message: error.message });
  console.error(error.stack);
  if (page) await capture('Blocked at ' + action).catch(() => {});
} finally {
  await browser.close();
  if (report.findings.length) report.status = 'failed';
  await writeFile(join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
}

if (report.status === 'failed') process.exitCode = 1;
