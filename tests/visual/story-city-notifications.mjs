import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const url = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5173/battle.html');
const out = process.env.BATTLE_CITY_OUT;
if (out) await mkdir(out, { recursive: true });
const profiles = [
  { touch: true, sizes: [[320, 568], [568, 320], [390, 844], [844, 390], [820, 1180], [1180, 820]] },
  { touch: false, sizes: [[1024, 600], [1600, 900]] },
];
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });

try {
  for (const { touch, sizes } of profiles) {
    const [width, height] = sizes[0];
    const context = await browser.newContext({
      viewport: { width, height }, hasTouch: touch, isMobile: touch, reducedMotion: 'reduce', serviceWorkers: 'block',
    });
    await context.addInitScript(() => { window.__testHarness = true; });
    await context.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url.href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__testReady);
    await page.evaluate(async () => {
      await window.__testReady;
      Object.assign(window.__storyTest.sm, { active: true, runSeed: 1 });
      window.__renderCityActionsForTest(0);
      window.StoryMode.enterCity();
    });
    const begin = page.getByRole('button', { name: 'Begin →', exact: true });
    if (await begin.isVisible()) await begin.click();
    const alert = page.locator('#modal-game-alert:visible');
    if (await alert.isVisible()) await alert.getByRole('button', { name: 'OK', exact: true }).click();

    const city = page.locator('#screen-story-city');
    const goal = city.locator('.story-city-objective').first();
    const more = city.locator('.story-hud-more summary');
    const notices = city.getByRole('button', { name: 'Notifications', exact: true });
    for (const [width, height] of sizes) {
      await page.setViewportSize({ width, height });
      await goal.click({ trial: true, timeout: 5000 });
      assert.match(await goal.innerText(), /Pick your starter/);
      const fit = await goal.evaluate(element => {
        const scroller = element.closest('#story-city-actions');
        const box = element.getBoundingClientRect();
        return box.left >= 0 && box.top >= 0 && box.right <= innerWidth + 1 && box.bottom <= innerHeight + 1 &&
          scroller.scrollWidth <= scroller.clientWidth + 1;
      });
      assert.ok(fit, `Objective fits ${width} × ${height}`);
      await more.click();
      await notices.click({ trial: true, timeout: 5000 });
      await more.press('Escape');
      assert.equal(await notices.isVisible(), false);
      console.log(`City ${width} × ${height}`);
    }

    if (touch) {
      await page.setViewportSize({ width: 430, height: 880 });
      const item = page.locator('#toast-host .toast-item');
      await item.waitFor({ state: 'detached' });
      await page.evaluate(() => window.showToast('Before the raid', 1000));
      await item.waitFor({ state: 'visible' });
      await page.evaluate(() => {
        window.__storyTest.showRaidEncounterIntro('Paras', 'extra.parasect.miniRaid', () => {});
        window.showToast('First raid achievement', 360);
        window.showToast('Second raid achievement', 360);
        window.showToast('💾 Saved', 360, { saved: true });
      });
      const raid = page.locator('.story-legend-sighting');
      await raid.waitFor({ state: 'visible' });
      await item.waitFor({ state: 'hidden' });
      assert.equal(await item.count(), 1);
      await page.waitForTimeout(1100);
      assert.equal(await item.innerText(), 'Before the raid');
      await page.setViewportSize({ width: 568, height: 320 });
      await raid.getByRole('button', { name: 'Stand your ground →' }).click();
      for (const text of ['Before the raid', 'First raid achievement', 'Second raid achievement', '💾 Saved']) {
        await page.waitForFunction(text => document.querySelector('#toast-host .toast-item')?.textContent === text, text);
        assert.equal(await item.count(), 1);
        await item.waitFor({ state: 'visible' });
      }
      await more.click();
      await notices.click();
      const history = await alert.locator('#modal-game-alert-text').innerText();
      assert.ok(history.includes('First raid achievement') && history.includes('Second raid achievement'));
      assert.equal(await item.isVisible(), false);
      await alert.getByRole('button', { name: 'OK', exact: true }).click();
      await more.press('Escape');
      console.log('Paras reveal and notification history');

      await page.setViewportSize({ width: 430, height: 880 });
      await page.evaluate(() => {
        const eventIndex = window.STORY_EVENTS_RAW.findIndex(row => row[1] === 'City' && row[2] === 'City1');
        Object.assign(window.__storyTest.sm, { eventIndex, citiesArrived: { 1: true }, storyCityVisit: 1 });
        document.getElementById('story-city-actions').scrollTop = 0;
        window.StoryMode.enterCity();
      });
      if (await alert.count()) await alert.getByRole('button', { name: 'OK', exact: true }).click();
      const invitation = city.locator('#story-adventure-city');
      const openChapter = invitation.getByRole('button', { name: 'The Empty Circle', exact: true });
      const archive = invitation.getByRole('button', { name: 'Field Archive', exact: true });
      await openChapter.waitFor();
      assert.match(await invitation.innerText(), /Optional story/);
      assert.equal(await invitation.evaluate(el => {
        const objective = document.querySelector('#story-city-primary .story-city-objective');
        const prep = document.getElementById('story-city-secondary');
        const earlier = node => Boolean(node.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
        return earlier(objective) && !earlier(prep);
      }), true, 'The chapter follows the primary objective and precedes other guidance');
      await item.waitFor({ state: 'detached' });
      await page.evaluate(() => window.showToast('🏅 First Catch — Capture your first wild Pokémon.', 5000));
      const docked = city.locator('.story-toast-dock .toast-item');
      await docked.waitFor();
      for (const [width, height] of [[430, 880], [844, 390]]) {
        await page.setViewportSize({ width, height });
        if (out) await page.screenshot({ path: join(out, `${width}x${height}-chapter-city.png`), animations: 'disabled' });
        for (const action of [openChapter, archive]) {
          const geometry = await action.evaluate(el => {
            const box = el.getBoundingClientRect();
            const area = document.getElementById('story-city-actions').getBoundingClientRect();
            const notice = document.querySelector('#screen-story-city .story-toast-dock .toast-item').getBoundingClientRect();
            const center = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
            return { top: box.top, bottom: box.bottom, panelTop: area.top, panelBottom: area.bottom, noticeTop: notice.top, hit: el.contains(center) };
          });
          assert.ok(geometry.top >= geometry.panelTop && geometry.bottom <= geometry.panelBottom && geometry.bottom <= geometry.noticeTop && geometry.hit,
            `${width} × ${height} chapter actions fit above the notice ${JSON.stringify(geometry)}`);
        }
      }
      const chapterBox = await openChapter.boundingBox();
      await page.touchscreen.tap(chapterBox.x + chapterBox.width / 2, chapterBox.y + chapterBox.height / 2);
      const dialog = page.getByRole('dialog', { name: 'The Empty Circle', exact: true });
      await dialog.waitFor();
      assert.equal(await docked.isVisible(), false, 'The chapter pauses the city notice');
      await dialog.getByRole('button', { name: 'Close', exact: true }).tap();
      await dialog.waitFor({ state: 'hidden' });
      await docked.waitFor({ state: 'visible' });
      console.log('First chapter invitation and docked city notice');

      await page.evaluate(() => window.showScreen('screen-story-casino'));
      await item.waitFor({ state: 'hidden' });
      await page.evaluate(() => window.showScreen('screen-story-city'));
      await docked.waitFor({ state: 'visible' });
      console.log('Global notice pauses across the Casino screen and resumes in the city');

      await item.waitFor({ state: 'detached' });
      await page.evaluate(() => {
        window.showToast('A local lead from town', 5000, { townOnly: true });
        window.showToast('A second local lead', 5000, { townOnly: true });
      });
      await docked.filter({ hasText: 'A local lead from town' }).waitFor();
      await page.evaluate(() => {
        window.showScreen('screen-story-tutor');
        window.showToast('Lesson complete', 1000);
      });
      await item.filter({ hasText: 'Lesson complete' }).waitFor();
      await page.evaluate(() => window.openNotificationHistory());
      assert.match(await alert.locator('#modal-game-alert-text').innerText(), /A second local lead[\s\S]*A local lead from town/);
      await alert.getByRole('button', { name: 'OK', exact: true }).click();
      console.log('Town leads stay in history and clear from the Tutor');
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
} finally {
  await browser.close();
}
