/* global AudioSystem */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const game = new URL(process.env.BATTLE_TEST_URL || 'http://127.0.0.1:5173/battle.html');
const title = new URL('index.html', game);
const store = { save: 'pbs_story_save', settings: 'pbs_settings', prefs: 'pbs_accessibility' };
const run = {
  version: 28, active: true, trainerProfile: { name: 'Rin' }, eventIndex: 0,
  badges: 0, gold: 4500, team: [{ name: 'Pikachu', build: { m: ['Quick Attack'] } }],
};
const put = (page, key, value) => page.evaluate(([name, data]) => localStorage.setItem(name, JSON.stringify(data)), [key, value]);
const get = (page, key) => page.evaluate(name => JSON.parse(localStorage.getItem(name)), key);
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });

try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await context.route('**/*', route => new URL(route.request().url()).origin === game.origin ? route.continue() : route.abort());
  const classic = await context.newPage();
  const publicTitle = await context.newPage();
  const errors = [];
  for (const page of [classic, publicTitle]) page.on('pageerror', error => errors.push(error.message));
  await classic.goto(game.href);
  await put(classic, store.save, run);
  await publicTitle.goto(title.href);
  await publicTitle.locator('#title-continue').waitFor();

  const newer = { ...run, version: 999 };
  await put(classic, store.save, newer);
  await publicTitle.locator('#title-continue').waitFor({ state: 'hidden' });
  assert.match(await publicTitle.locator('#title-save-issue').textContent(), /newer game version/);
  await publicTitle.getByRole('link', { name: 'Save & recovery' }).click();
  await publicTitle.getByRole('heading', { name: 'Save & recovery' }).waitFor();
  assert.deepEqual(await get(publicTitle, store.save), newer);
  await classic.goto(new URL('battle.html?entry=continue', game).href);
  await classic.getByRole('heading', { name: 'Save & recovery' }).waitFor();
  assert.match(await classic.locator('.upgrade-dialog').innerText(), /newer game version/);
  assert.equal(await classic.locator('#menu-continue-slot button').isVisible(), false);
  assert.deepEqual(await get(classic, store.save), newer);

  await put(publicTitle, store.save, run);
  const selector = '#upgrade-backup-file';
  const selectedFile = data => ({ name: 'review.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) });
  await classic.locator(selector).setInputFiles(selectedFile({ format: 'battle-backup', version: 1, entries: { pbs_settings: { battleSpeed: 'fast' } } }));
  await classic.getByRole('heading', { name: 'Review restoration' }).waitFor();
  assert.equal(await classic.getByRole('heading', { name: 'Incoming backup' }).count(), 0);
  assert.equal(await classic.getByText('game settings', { exact: true }).count(), 1);
  await classic.keyboard.press('Escape');
  assert.equal(await classic.evaluate(() => document.activeElement.id), 'upgrade-backup-file');

  const incoming = { ...run, trainerProfile: { name: 'Backup' }, gold: 1700 };
  await classic.locator(selector).setInputFiles(selectedFile(incoming));
  await classic.getByRole('heading', { name: 'Review restoration' }).waitFor();
  assert.match(await classic.locator('.upgrade-restore-summary').last().innerText(), /Rin/);
  const external = { ...run, trainerProfile: { name: 'From other tab' }, gold: 3200, badges: 2 };
  await put(publicTitle, store.save, external);
  await classic.getByRole('button', { name: 'Restore this backup' }).click();
  assert.deepEqual(await get(classic, store.save), external);
  assert.match(await classic.locator('.upgrade-dialog .upgrade-error').first().innerText(), /local data changed/);
  assert.match(await classic.locator('.upgrade-restore-summary').last().innerText(), /From other tab/);
  await Promise.all([
    classic.waitForEvent('framenavigated'),
    classic.getByRole('button', { name: 'Restore this backup' }).click(),
  ]);
  await classic.waitForLoadState('load');
  await classic.waitForFunction(() => typeof window._registerAppDialog === 'function');
  assert.deepEqual(await get(classic, store.save), incoming);

  await classic.evaluate(() => {
    window.GameUpgrades.openPreferences();
    const write = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'pbs_accessibility' && window.rejectReading) throw new Error('Test storage rejection');
      return write.call(this, key, value);
    };
    window.rejectReading = true;
  });
  const reading = classic.getByRole('checkbox', { name: 'Use a readable interface font' });
  await reading.focus();
  await reading.press('Space');
  assert.equal(await reading.isChecked(), false);
  assert.equal(await classic.locator('body.upgrade-readable').count(), 0);
  assert.match(await classic.locator('.upgrade-dialog [role="status"]').innerText(), /could not be saved/);
  await classic.evaluate(() => { window.rejectReading = false; });
  await reading.press('Space');
  assert.equal(await reading.isChecked(), true);
  assert.equal(await classic.locator('body.upgrade-readable').count(), 1);
  const arena = await context.newPage();
  arena.on('pageerror', error => errors.push(error.message));
  await put(publicTitle, store.prefs, { readable: true, reducedMotion: true });
  await arena.goto(new URL('competitive/index.html', game).href);
  await arena.locator('#match[data-motion="false"]').waitFor({ state: 'attached' });
  await arena.getByRole('button', { name: 'Start battle' }).click();
  await arena.getByRole('button', { name: /Great Tusk.*Lead/ }).click();
  await arena.locator('#moves button:enabled').first().waitFor();
  assert.equal(await arena.locator('#match').getAttribute('data-motion'), 'false');
  await put(publicTitle, store.prefs, { readable: false, reducedMotion: false });
  await classic.locator('body:not(.upgrade-readable)').waitFor({ state: 'attached' });
  assert.equal(await reading.isChecked(), false);
  await arena.locator('#match[data-motion="true"]').waitFor({ state: 'attached' });
  await arena.getByLabel('Battle speed').selectOption('instant');
  await classic.waitForFunction(() => document.getElementById('setting-battle-speed').value === 'instant');
  await classic.evaluate(() => {
    window.applySettingSwitch('weatherAnimation', false);
    AudioSystem.setSoundVolume(0.37);
    window.persistMiscSettings('soundVol');
  });
  const prefs = await get(classic, store.settings);
  assert.equal(prefs.battleSpeed, 'instant');
  assert.equal(prefs.weatherAnimation, false);
  assert.equal(prefs.soundVol, 0.37);
  await arena.waitForFunction(key => {
    const latest = JSON.parse(localStorage.getItem(key));
    return latest?.battleSpeed === 'instant' && latest.weatherAnimation === false && latest.soundVol === 0.37;
  }, store.settings);
  await arena.locator('#match[data-motion="false"]').waitFor({ state: 'attached' });
  assert.deepEqual(errors, []);
  await context.close();
  console.log('Save recovery passed forward saves, stale two-tab restore, import scope and focus, denied preferences, two-tab settings and live Arena motion.');
} finally {
  await browser.close();
}
