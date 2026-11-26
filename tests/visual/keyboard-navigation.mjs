import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const url = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5173/battle.html');
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });

const focused = locator => locator.evaluateAll(nodes => nodes.includes(document.activeElement));
async function tabTo(page, locator, stopOn) {
  await locator.waitFor({ state: 'visible', timeout: 6000 });
  for (let attempts = 0; attempts < 75; attempts++) {
    if (stopOn && await stopOn.isVisible()) return false;
    if (await focused(locator)) return true;
    await page.keyboard.press('Tab');
  }
  assert.fail(`Could not reach ${locator} with Tab`);
}
async function activate(page, locator, stopOn) {
  if (await tabTo(page, locator, stopOn)) await page.keyboard.press('Enter');
}
async function hasFocus(locator) {
  await locator.waitFor({ state: 'visible', timeout: 6000 });
  assert.ok(await focused(locator), `${locator} should be focused`);
}

async function verifyOpening(page) {
  await activate(page, page.locator('.story-menu-btn--new'));
  await tabTo(page, page.locator('#story-create-name'));
  await page.keyboard.type('Key Scout');
  await activate(page, page.locator('.story-create-advanced summary'));
  await tabTo(page, page.locator('#story-create-seed'));
  await page.keyboard.type('1');
  await activate(page, page.locator('#story-create-begin'));
  const pallet = page.getByRole('dialog', { name: 'Pallet Town' });
  const begin = pallet.getByRole('button', { name: 'Begin →' });
  await hasFocus(begin);
  assert.equal(await page.locator('#screen-story-trainercreate').getAttribute('inert'), '');
  await page.keyboard.press('Shift+Tab');
  await hasFocus(begin);
  await page.keyboard.press('Tab');
  await hasFocus(begin);
  await page.keyboard.press('Escape');
  await pallet.waitFor({ state: 'hidden' });
  assert.equal(await page.locator('#screen-story-trainercreate').getAttribute('inert'), null);
  await activate(page, page.locator('#modal-game-alert button'));
}

async function verifyRivalIntro(page) {
  const next = [
    '#modal-game-alert button',
    '.story-tutorial-continue',
    '.story-narr-root [data-narr-continue]',
    '#prof-accept-btn:enabled',
    '#story-prof-rolled-card .prof-pick-choice',
    '#story-prof-buttons button',
    '#screen-story-professor:has(#story-prof-status:has-text("joined your team")) .story-shop-back-btn',
    '#screen-story-shop .story-shop-back-btn',
    '#screen-story-city .story-city-objective',
  ];
  const rival = page.getByRole('dialog', { name: /^Battle introduction with / });
  for (let attempts = 0; attempts < 26 && !await rival.isVisible(); attempts++) {
    const control = next.map(selector => page.locator(`${selector}:visible`).first());
    for (const option of control) {
      if (!await option.isVisible()) continue;
      await activate(page, option, rival);
      break;
    }
    await page.waitForTimeout(120);
  }
  assert.ok(await rival.isVisible(), `Rival dialog absent from ${await page.locator('.screen:visible').evaluateAll(nodes => nodes.map(n => n.id))}`);
  await hasFocus(rival);
  assert.equal(await rival.getAttribute('aria-describedby'), 'story-vs-description');
  await page.keyboard.press('Tab');
  const firstChoice = rival.locator('button').first();
  await hasFocus(firstChoice);
  await page.keyboard.press('Shift+Tab');
  await hasFocus(rival.locator('button').last());
  await page.waitForTimeout(400);
  await activate(page, firstChoice);
  await hasFocus(rival.locator('[data-vs2-battle]'));
}

async function verifyPreferencesAndHistory(page) {
  const settingsButton = page.getByRole('button', { name: 'Settings', exact: true });
  const settings = page.locator('#modal-settings');
  const reading = settings.getByRole('button', { name: 'Reading & accessibility' });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await activate(page, settingsButton);
  const animation = settings.getByRole('switch', { name: 'Battle animations' });
  const weather = settings.getByRole('switch', { name: 'Weather animation' });
  const particles = settings.getByRole('switch', { name: 'Particle effects' });
  const toggles = [animation, weather, particles];
  await tabTo(page, weather);
  await page.keyboard.press('Space');
  assert.deepEqual(await Promise.all(toggles.map(control => control.isChecked())), [true, false, true]);
  await activate(page, settings.getByRole('button', { name: 'Help', exact: true }));
  await activate(page, reading);
  const prefs = page.getByRole('dialog', { name: 'Reading & accessibility' });
  const readable = prefs.getByRole('checkbox', { name: 'Use a readable interface font' });
  await tabTo(page, readable);
  await page.keyboard.press('Space');
  const family = await page.locator('body').evaluate(el => getComputedStyle(el).fontFamily);
  assert.match(family, /system-ui/);
  const larger = prefs.getByRole('checkbox', { name: 'Larger Notebook and story text' });
  await tabTo(page, larger);
  await page.keyboard.press('Space');
  assert.equal(await larger.isChecked(), true);
  assert.equal(await prefs.getByRole('button', { name: 'Close' }).evaluate(el => getComputedStyle(el).whiteSpace), 'nowrap');
  const reduce = prefs.getByRole('checkbox', { name: 'Reduce interface motion' });
  await tabTo(page, reduce);
  await page.keyboard.press('Space');
  assert.equal(await settings.getAttribute('inert'), '');
  await page.goBack();
  await prefs.waitFor({ state: 'hidden' });
  await hasFocus(reading);
  await activate(page, settings.getByRole('button', { name: 'Display', exact: true }));
  assert.ok(await settings.locator('#settings-motion-note').isVisible());
  assert.deepEqual(await Promise.all(toggles.map(control => control.isDisabled())), [true, true, true]);
  assert.deepEqual(await Promise.all(toggles.map(control => control.isChecked())), [false, false, false]);
  // Saving another option while the override is active must preserve the choices.
  await tabTo(page, settings.getByRole('switch', { name: 'Terrain background' }));
  await page.keyboard.press('Space');
  await page.keyboard.press('Escape');
  await settings.waitFor({ state: 'hidden' });
  await hasFocus(settingsButton);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#app-loading-overlay').waitFor({ state: 'hidden', timeout: 40000 });
  await activate(page, settingsButton);
  assert.deepEqual(await Promise.all(toggles.map(control => control.isDisabled())), [true, true, true]);
  await activate(page, settings.getByRole('button', { name: 'Help', exact: true }));
  await activate(page, reading);
  await tabTo(page, reduce);
  await page.keyboard.press('Space');
  await page.keyboard.press('Escape');
  await prefs.waitFor({ state: 'hidden' });
  await activate(page, settings.getByRole('button', { name: 'Display', exact: true }));
  assert.deepEqual(await Promise.all(toggles.map(control => control.isDisabled())), [false, false, false]);
  assert.deepEqual(await Promise.all(toggles.map(control => control.isChecked())), [true, false, true]);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await settings.locator('#settings-motion-note').waitFor({ state: 'visible' });
  assert.deepEqual(await Promise.all(toggles.map(control => control.isDisabled())), [true, true, true]);
  await page.keyboard.press('Escape');
}

async function verifyCollection(page) {
  await activate(page, page.locator('.menu-btn-quickplay--story'));
  const trigger = page.locator('.story-menu-btn--collection');
  await trigger.waitFor({ timeout: 45000 });
  await activate(page, trigger);
  await tabTo(page, page.locator('#collection-tab-pokedex'));
  await page.keyboard.press('ArrowRight');
  await hasFocus(page.locator('#collection-tab-ach'));
  assert.equal(await page.locator('#collection-tab-ach').getAttribute('aria-selected'), 'true');
  await page.goBack();
  await page.locator('#screen-collection').waitFor({ state: 'hidden' });
  await hasFocus(trigger);
}

async function verifyNotebookAndRecovery(page) {
  const cityNotebook = page.locator('#screen-story-city').getByRole('button', { name: /Trainer’s Notebook/ });
  await activate(page, cityNotebook);
  const notebook = page.getByRole('dialog', { name: 'Trainer’s Notebook' });
  const primaryObjective = notebook.locator('.upgrade-objective > h3 + button');
  assert.equal(await primaryObjective.innerText(), 'Go to my next action');
  if (page.viewportSize().width < 600) {
    assert.equal(await notebook.locator('.upgrade-tabs').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length), 3);
  }
  const team = notebook.getByRole('button', { name: 'My team', exact: true });
  await activate(page, team);
  await hasFocus(team);
  await page.keyboard.press('Tab');
  await hasFocus(notebook.getByRole('button', { name: 'Journal' }));
  await page.keyboard.press('Escape');
  await hasFocus(cityNotebook);

  const settings = page.locator('#modal-settings');
  await activate(page, page.locator('.story-hud-settings'));
  await activate(page, settings.getByRole('button', { name: 'Data', exact: true }));
  const entry = settings.getByRole('button', { name: 'Save & recovery' });
  await activate(page, entry);
  const recovery = page.getByRole('dialog', { name: 'Save & recovery' });
  const input = recovery.getByLabel('Import a backup file');
  await input.setInputFiles({ name: 'invalid-backup.json', mimeType: 'application/json', buffer: Buffer.from('{') });
  const feedback = recovery.getByRole('status').filter({ hasText: 'Choose a Pokémon Arena JSON backup.' });
  await feedback.waitFor({ state: 'visible' });
  assert.equal(await input.getAttribute('aria-invalid'), 'true');
  const fieldBox = await input.boundingBox();
  const errorBox = await feedback.boundingBox();
  assert.ok(errorBox.y >= fieldBox.y + fieldBox.height && errorBox.y - fieldBox.y - fieldBox.height < 28);
  assert.ok(errorBox.y + errorBox.height <= page.viewportSize().height);
  const slot = recovery.locator('.upgrade-grid .upgrade-card').first();
  await activate(page, slot.getByRole('button', { name: 'Save here' }));
  const replace = slot.getByRole('button', { name: 'Replace this slot' });
  await activate(page, replace);
  const confirmation = page.getByRole('dialog', { name: /^Replace this saved slot\?/ });
  await hasFocus(confirmation.getByRole('button', { name: 'Cancel' }));
  await page.keyboard.press('Escape');
  await hasFocus(replace);
  await activate(page, replace);
  await page.goBack();
  await confirmation.waitFor({ state: 'hidden' });
  await hasFocus(replace);

  const backupButton = recovery.getByRole('button', { name: 'Download complete backup' });
  await tabTo(page, backupButton);
  const contrast = await backupButton.evaluate(el => {
    const css = getComputedStyle(el);
    const luminance = color => color.match(/\d+(?:\.\d+)?/g).slice(0, 3).reduce((total, channel, i) => {
      const srgb = Number(channel) / 255;
      return total + [0.2126, 0.7152, 0.0722][i] * (srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4);
    }, 0);
    const [dark, light] = [luminance(css.color), luminance(css.backgroundColor)].sort((a, b) => a - b);
    return (light + 0.05) / (dark + 0.05);
  });
  assert.ok(contrast >= 4.5, `Keyboard focus contrast was ${contrast.toFixed(2)}:1`);
  const download = page.waitForEvent('download', { timeout: 6000 });
  await activate(page, backupButton);
  const save = await download;
  assert.equal(save.suggestedFilename(), 'pokemon-battle-backup.json');
  const backup = await readFile(await save.path());
  const entries = JSON.parse(backup).entries;
  const savedSlot = entries.pbs_slot_1.entries.pbs_story_save;
  assert.equal(savedSlot.trainerProfile?.name || savedSlot.trainerName, 'Key Scout');
  assert.equal(entries.pbs_settings?.offlineDownload, undefined);
  await activate(page, slot.getByRole('button', { name: 'Review and load' }));
  const restore = page.getByRole('dialog', { name: 'Review restoration' });
  await restore.waitFor({ state: 'visible' });
  assert.match(await restore.innerText(), /Save slot 1.*Restoring will replace your Story run.*Incoming backup.*Key Scout.*Pallet Town.*On this device.*Key Scout/s);
  const cancelBox = await restore.getByRole('button', { name: 'Cancel' }).boundingBox();
  assert.ok(cancelBox.y + cancelBox.height <= page.viewportSize().height);
  assert.match(await restore.getByRole('button', { name: 'Restore this backup' }).getAttribute('class'), /upgrade-danger/);
  await page.keyboard.press('Escape');
  await restore.waitFor({ state: 'hidden' });
  await hasFocus(entry);
  await page.keyboard.press('Escape');
  await settings.waitFor({ state: 'hidden' });
  await hasFocus(page.locator('.story-hud-settings'));
  return backup;
}

async function verifyFreshRecovery(backup) {
  const context = await browser.newContext({
    viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true,
    reducedMotion: 'reduce', serviceWorkers: 'block',
  });
  try {
    const page = await context.newPage();
    await page.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
    await page.goto(url.href, { waitUntil: 'domcontentloaded' });
    await page.locator('#app-loading-overlay').waitFor({ state: 'hidden', timeout: 40000 });
    await activate(page, page.getByRole('button', { name: 'Settings', exact: true }));
    await activate(page, page.locator('#modal-settings').getByRole('button', { name: 'Data', exact: true }));
    await activate(page, page.getByRole('button', { name: 'Save & recovery' }));
    const recovery = page.getByRole('dialog', { name: 'Save & recovery' });
    assert.match(await recovery.innerText(), /No Story run on this device/);
    assert.equal(await recovery.getByRole('button', { name: 'Download complete backup' }).count(), 0);
    assert.equal(await recovery.getByRole('button', { name: 'Save here' }).count(), 0);
    await recovery.getByLabel('Import a backup file').setInputFiles({ name: 'key-scout.json', mimeType: 'application/json', buffer: backup });
    const restore = page.getByRole('dialog', { name: 'Review restoration' });
    await restore.waitFor({ state: 'visible' });
    assert.match(await restore.innerText(), /key-scout\.json.*Incoming backup.*Key Scout.*On this device.*No Story run on this device/s);
    assert.match(await restore.innerText(), /save slot 1/i);
    assert.equal(await restore.getByRole('button', { name: 'Back up current progress' }).count(), 0);
    const restoreBox = await restore.getByRole('button', { name: 'Restore this backup' }).boundingBox();
    assert.ok(restoreBox.y + restoreBox.height <= page.viewportSize().height);
    await activate(page, restore.getByRole('button', { name: 'Cancel' }));
    await restore.waitFor({ state: 'hidden' });
    const recoveryButton = page.getByRole('button', { name: 'Save & recovery' });
    await hasFocus(recoveryButton);
    await activate(page, recoveryButton);
    await recovery.getByLabel('Import a backup file').setInputFiles({ name: 'key-scout.json', mimeType: 'application/json', buffer: backup });
    await Promise.all([
      page.waitForEvent('framenavigated', { predicate: frame => frame === page.mainFrame() }),
      activate(page, restore.getByRole('button', { name: 'Restore this backup' })),
    ]);
    const imported = await page.evaluate(() => ({
      run: JSON.parse(localStorage.getItem('pbs_story_save')),
      slot: JSON.parse(localStorage.getItem('pbs_slot_1')),
    }));
    const { entries } = JSON.parse(backup);
    assert.deepEqual(imported.run, entries.pbs_story_save);
    assert.deepEqual(imported.slot, entries.pbs_slot_1);
  } finally {
    await context.close();
  }
}

async function verifyBattleBack() {
  const context = await browser.newContext({ reducedMotion: 'reduce', serviceWorkers: 'block' });
  try {
    await context.route('**/*', route =>
      new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
    const page = await context.newPage();
    await page.goto(url.href, { waitUntil: 'domcontentloaded' });
    const home = page.getByRole('region', { name: 'Main menu' });
    await home.getByText('Battles', { exact: true }).click();
    await home.getByRole('button', { name: 'Quick Battle', exact: true }).click();
    const fight = page.getByRole('region', { name: 'Battle', exact: true }).getByRole('button', { name: /^Fight/ });
    const confirm = page.locator('#modal-game-confirm');
    await fight.waitFor({ timeout: 40000 });
    await page.goBack();
    await confirm.getByRole('button', { name: 'Cancel', exact: true }).click();
    await fight.waitFor();
    await page.goBack();
    await confirm.getByRole('button', { name: 'OK', exact: true }).click();
    await home.waitFor();
    console.log('Browser Back guards Quick Battle and permits cancel then confirmed forfeit.');
  } finally {
    await context.close();
  }
}

try {
  for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
    const touch = viewport.width < 600;
    const context = await browser.newContext({
      viewport, hasTouch: touch, isMobile: touch,
      acceptDownloads: true, reducedMotion: 'reduce', serviceWorkers: 'block',
    });
    try {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/*', route =>
        new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
      await page.goto(url.href, { waitUntil: 'domcontentloaded' });
      await page.locator('#app-loading-overlay').waitFor({ state: 'hidden', timeout: 40000 });
      if (!touch) {
        assert.ok(await page.locator('#menu-offline-entry').evaluate(entry => {
          const bounds = entry.getBoundingClientRect();
          const menu = entry.closest('#screen-menu').getBoundingClientRect();
          return bounds.top >= menu.top && bounds.bottom <= menu.bottom;
        }), 'The offline shortcut should fit in the initial laptop title view');
      }
      await verifyPreferencesAndHistory(page);
      await verifyCollection(page);
      await verifyOpening(page);
      const backup = await verifyNotebookAndRecovery(page);
      await verifyRivalIntro(page);
      if (touch) await verifyFreshRecovery(backup);
      assert.deepEqual(errors, []);
      console.log(`Keyboard navigation passed at ${viewport.width}×${viewport.height}`);
    } catch (error) {
      const page = context.pages()[0];
      if (page) {
        const layerNames = await page.locator('.screen:visible,[role="dialog"]:visible').evaluateAll(nodes =>
          nodes.map(node => node.getAttribute('aria-label') || node.id || node.className));
        console.error(`Visible layers at ${viewport.width}×${viewport.height}`, layerNames);
      }
      throw error;
    } finally {
      await context.close();
    }
  }
  await verifyBattleBack();
} finally {
  await browser.close();
}
