import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

const url = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5177/battle.html');
assert.ok(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname),
  'Playtest requires a local Battle server');
const out = resolve(process.env.BATTLE_PLAYTEST_OUT || 'agent-state/playthrough/progress');
await mkdir(out, { recursive: true });

const trace = [];
const findings = [];
const trainer = 'Field Tester';
const pageErrors = [];
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
let page;
let current = 'Launch';
let status = 'passed';

async function newPhone(viewport) {
  const context = await browser.newContext({
    viewport, hasTouch: true, isMobile: true, reducedMotion: 'reduce',
    serviceWorkers: 'block', acceptDownloads: true,
  });
  await context.route('**/*', route =>
    new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
  const phone = await context.newPage();
  phone.setDefaultTimeout(6000);
  phone.on('pageerror', error => pageErrors.push({ severity: 'error', area: current, message: error.message }));
  await phone.goto(url.href, { waitUntil: 'domcontentloaded' });
  await phone.locator('#app-loading-overlay').waitFor({ state: 'hidden', timeout: 25000 });
  return phone;
}

async function capture(label, details = {}) {
  current = label;
  const snapshot = await page.evaluate(() => {
    const visible = node => node.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
    const all = selector => Array.from(document.querySelectorAll(selector)).filter(visible);
    const title = node => node.querySelector('h1,h2,h3,.story-dialog-nameplate')?.textContent.trim() || '';
    const dialogs = all('.modal[id], .upgrade-dialog, .story-narr-root, .story-tutorial-overlay');
    const front = dialogs.at(-1) || all('.screen[id]').at(-1);
    return {
      screens: all('.screen[id]').map(node => node.id),
      dialogs: dialogs.map(node => node.id || title(node) || node.classList[0]),
      viewport: [innerWidth, innerHeight],
      text: front?.innerText.trim().replace(/\s+/g, ' ').slice(0, 700) || '',
    };
  });
  const screenshot = String(trace.length + 1).padStart(3, '0') + '-' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.jpg';
  await page.screenshot({ path: join(out, screenshot), type: 'jpeg', quality: 76, animations: 'disabled', timeout: 5000 });
  trace.push({ label, screenshot, ...snapshot, ...details });
  console.log(label);
}

const button = (name, host = page) => host.getByRole('button', { name, exact: true });
const panel = () => page.locator('.upgrade-dialog');
const settings = () => page.locator('#modal-settings');
const visible = selector => page.locator(selector).first();
const state = () => page.evaluate(() => {
  const s = window.StoryMode.state;
  return {
    name: s.trainerProfile?.name, eventIndex: s.eventIndex, gold: s.gold, badges: s.badges,
    team: s.team.map(mon => ({ name: mon.name, favorite: Boolean(mon.favorite), moves: mon.build.m })),
  };
});

async function reach(selector) {
  const overlay = page.locator([
    'button:text-is("Begin →"):visible', 'button[data-narr-continue="1"]:visible',
    '.story-tutorial-overlay .story-tutorial-continue:visible', '#modal-game-alert button:visible',
  ].join(', ')).last();
  const start = Date.now();
  while (Date.now() - start < 15000) {
    const target = visible(selector);
    if (await overlay.count()) {
      const title = await overlay.innerText();
      if (trace.at(-1)?.details?.interstitial !== title) {
        await capture('Opening interstitial', { details: { interstitial: title } });
      }
      await overlay.click({ timeout: 1000 }).catch(() => {});
    } else if (await target.isVisible()) {
      const actionable = await target.click({ trial: true, timeout: 700 }).then(() => true, () => false);
      if (actionable) return target;
    }
    await new Promise(resolveWait => setTimeout(resolveWait, 120));
  }
  throw new Error('Opening never exposed ' + selector);
}

async function openUpgrade(name) {
  if (!await settings().isVisible()) await button('Settings').click();
  await button(name, settings()).click();
  await panel().waitFor({ state: 'visible' });
}

try {
  page = await newPhone({ width: 390, height: 844 });
  current = 'Story creation';
  await visible('.menu-btn-quickplay--story').click();
  await visible('.story-menu-btn--new').click();
  await visible('#story-create-name').fill(trainer);
  await button('Next sprite').click();
  await visible('[data-diff="challenge"]').click();
  assert.ok(await visible('#story-create-diff-kaizo-hint').isVisible());
  await visible('[data-diff="normal"]').click();
  await visible('[data-preset="custom"].story-create-gen-preset').click();
  await visible('#story-gen-cb-9').uncheck();
  assert.equal(await visible('#story-gen-cb-9').isChecked(), false);
  await visible('[data-preset="all"].story-create-gen-preset').click();
  await visible('.story-create-advanced summary').click();
  for (const id of ['#story-mech-mega', '#story-mech-z', '#story-mech-dyna', '#story-mech-tera', '#story-mode-classic-rb']) {
    assert.equal(await visible(id).isChecked(), true);
  }
  await capture('Character, difficulty, generations and rules');
  await visible('#story-create-begin').click();
  await (await reach('.story-city-objective')).click();
  await (await reach('#story-prof-rolled-card .prof-pick-choice')).click();
  await visible('#prof-accept-btn').click();
  await (await reach('#screen-story-professor:has(#story-prof-rolled-card:empty) .story-shop-back-btn')).click();
  await reach('.story-city-objective');
  assert.equal((await state()).team.length, 1);
  await capture('Pallet after starter selection', { savedState: await state() });
  const early = await state();
  await button('Save and quit to Story menu').click();
  await visible('#screen-story-menu').waitFor({ state: 'visible' });
  await capture('Save and quit to story menu');
  await visible('#story-continue-btn').click();
  await reach('.story-city-objective');
  assert.deepEqual(await state(), early);

  current = 'City More and run rules';
  const cityMore = page.locator('#screen-story-city .story-hud-more');
  const moreToggle = cityMore.locator('summary');
  await moreToggle.click();
  await capture('City More actions');
  await button('Run settings and info', cityMore).click();
  assert.match(await visible('#story-run-summary-body').innerText(), /one activation per team per battle/);
  await capture('Run summary and locked rules');
  await button('Close', visible('#modal-story-run-summary')).click();
  if (await cityMore.getAttribute('open') !== null) await moreToggle.click();
  current = 'City party and bag';
  for (const key of ['party', 'bag']) {
    await visible(`.story-action-btn[data-action-key="${key}"]`).click();
    const dialog = visible('#modal-story-' + key);
    await dialog.waitFor({ state: 'visible' });
    await capture(key === 'party' ? 'City party' : 'City bag');
    await button('Close', dialog).click();
  }

  current = 'Trainer Notebook';
  await openUpgrade('Trainer’s Notebook');
  await capture('Notebook next objective');
  await button('My team', panel()).click();
  await button('Protect as favorite', panel()).click();
  assert.equal((await state()).team[0].favorite, true);
  await capture('Notebook team and favorite');
  await button('Story & clues', panel()).click();
  await capture('Notebook story and clues');
  await button('Battle rules', panel()).click();
  await capture('Notebook battle rules');
  await button('Close', panel()).click();

  const beforePractice = await state();
  current = 'Practice lessons';
  await openUpgrade('Practice lessons');
  const answers = [
    'It is four times effective', 'A Ground-type partner', 'Quick Attack', 'Special Attack',
    'You are locked into one move until switching', 'Use an available reset, burn, defensive switch or faster threat',
    'The attacker’s relevant stat stages, including drops',
    'Whether the team has safe switch-ins and an immediate threat',
  ];
  await button('It is resisted', panel()).click();
  assert.match(await panel().getByRole('status').innerText(), /Try another approach/);
  for (const [i, answer] of answers.entries()) {
    await button(answer, panel()).click();
    assert.match(await panel().getByRole('status').innerText(), /Correct\./);
    await capture('Practice lesson ' + (i + 1));
    if (i < answers.length - 1) await button('Next lesson', panel()).click();
  }
  assert.deepEqual(await state(), beforePractice);
  await button('Close', panel()).click();

  current = 'Accessibility options';
  await openUpgrade('Reading & accessibility');
  await panel().getByRole('checkbox', { name: 'Use a readable interface font' }).check();
  await panel().getByRole('checkbox', { name: 'Larger Notebook and story text' }).check();
  assert.equal(await page.locator('body').evaluate(body => body.classList.contains('upgrade-readable')), true);
  await capture('Reading and accessibility');
  await button('Close', panel()).click();

  current = 'Save manager';
  await openUpgrade('Save & recovery');
  await panel().locator('.upgrade-card').filter({ has: page.getByRole('heading', { name: 'Save slot 1' }) })
    .getByRole('button', { name: 'Save here' }).click();
  await button('Review and load', panel()).click();
  await capture('Review saved slot');
  await button('Close', panel()).click();
  await openUpgrade('Save & recovery');
  const downloadEvent = page.waitForEvent('download');
  await button('Download complete backup', panel()).click();
  const download = await downloadEvent;
  const path = await download.path();
  const backupFile = await readFile(path);
  const backup = JSON.parse(backupFile.toString());
  assert.equal(backup.entries.pbs_story_save.trainerProfile.name, trainer);
  assert.equal(backup.entries.pbs_story_save.team[0].favorite, true);
  const expected = await state();
  await capture('Downloaded save backup', { details: { file: download.suggestedFilename(), bytes: backupFile.length } });

  current = 'Restore in a new browser profile';
  page = await newPhone({ width: 844, height: 390 });
  assert.equal(await page.evaluate(() => localStorage.getItem('pbs_story_save')), null);
  await openUpgrade('Save & recovery');
  const input = panel().locator('input[type="file"]');
  await input.setInputFiles({
    name: 'invalid-backup.json', mimeType: 'application/json', buffer: Buffer.from('{}'),
  });
  await panel().getByRole('status').waitFor();
  assert.match(await panel().getByRole('status').innerText(), /missing required data/);
  assert.equal(await page.evaluate(() => localStorage.getItem('pbs_story_save')), null);
  await capture('Invalid backup feedback');
  await input.setInputFiles({
    name: download.suggestedFilename(), mimeType: 'application/json', buffer: backupFile,
  });
  await panel().getByRole('heading', { name: 'Review restoration' }).waitFor();
  assert.match(await panel().innerText(), new RegExp(expected.team[0].name));
  await capture('Review backup on a fresh landscape profile');
  await Promise.all([
    page.waitForEvent('framenavigated', frame => frame === page.mainFrame()),
    button('Restore this backup', panel()).click(),
  ]);
  await page.locator('#app-loading-overlay').waitFor({ state: 'hidden', timeout: 25000 });
  await visible('.menu-btn-quickplay--story').click();
  await visible('#story-abandon-btn').click();
  await capture('Review delete-run confirmation');
  await button('Keep this run').click();
  await visible('#story-continue-btn').click();
  await reach('.story-city-objective');
  assert.deepEqual(await state(), expected);
  assert.equal(await page.locator('body').evaluate(body => body.classList.contains('upgrade-readable')), true);
  await capture('Resume restored progress', { savedState: await state() });
} catch (error) {
  status = 'failed';
  findings.push({ severity: 'error', area: current, message: error.message });
  console.error(error.stack);
  if (page && !page.isClosed()) await capture('Failure at ' + current).catch(() => {});
} finally {
  await browser.close();
  findings.push(...pageErrors);
  if (pageErrors.length) status = 'failed';
  await writeFile(join(out, 'report.json'), JSON.stringify({ status, trace, findings }, null, 2) + '\n');
}

if (status === 'failed') process.exitCode = 1;
