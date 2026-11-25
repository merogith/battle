import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const base = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5173/battle.html');
const output = process.env.BATTLE_MILESTONE_SHOTS;
if (output) await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });

try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 568, height: 320 }, { width: 820, height: 1180 }, { width: 1440, height: 900 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce', serviceWorkers: 'block' });
    try {
      await context.addInitScript(() => { window.__testHarness = true; });
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        return url.origin === base.origin || url.protocol === 'data:' ? route.continue() : route.abort();
      });
      const page = await context.newPage();
      page.setDefaultTimeout(12000);
      const save = () => page.evaluate(() => JSON.parse(localStorage.getItem('pbs_story_save')));
      const capture = async name => {
        if (output) await page.screenshot({ path: join(output, `${viewport.width}x${viewport.height}-${name}.png`), animations: 'disabled' });
      };
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base.href, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.__testReady);
      await page.locator('#app-loading-overlay').waitFor({ state: 'hidden' });

      // Start at the badge result. Promotion uses the ordinary controls and save path.
      await page.evaluate(() => {
        const ST = window.__storyTest;
        const rows = ST.STORY_EVENTS_RAW;
        const eventIndex = rows.findIndex(row => row[0] === 6);
        const make = (name, id, m) => ({ name, id, build: { m, n: 'Hardy' } });
        ST.sm = {
          ...ST.sm, active: true, badges: 1, gold: 4500, eventIndex, runSeed: 27,
          team: [make('Pikachu', 'pikachu', ['Thunder Shock']), make('Rattata', 'rattata', ['Tackle'])],
          pcBox: [make('Abra', 'abra', ['Psyshock']), make('Eevee', 'eevee', ['Tackle'])],
          settings: { enabledGens: [1] }, inventory: {}, scenesShown: {}, storyChoices: {},
          citiesArrived: { 0: true, 1: true }, trainerAssignments: { 5: 'Jasmine' },
        };
        window.__victoryInputArmMs = 0;
        ST.showVictoryOverlay('Victory', 200, true, () => { window.StoryMode.enterCity(); }, 'Gym Leader 1', 5, []);
      });
      const result = page.locator('.story-victory-v2');
      await result.getByRole('button', { name: 'Add from PC' }).press('Enter');
      const reserves = result.getByRole('combobox', { name: 'Choose a Pokémon' });
      await reserves.selectOption('eevee');
      await capture('badge-reserves');
      await result.getByRole('button', { name: 'Add to party' }).click();
      assert.match(await result.getByRole('status').innerText(), /Eevee joined your party/);
      assert.ok((await save()).team.some(slot => slot.id === 'eevee'));
      assert.equal((await save()).pcBox.length, 1);
      await result.getByRole('button', { name: /Continue/ }).click();
      await result.waitFor({ state: 'detached' });

      // A visited City 5 fixture keeps the real hub, legal Tutor pool, and lesson flow.
      await page.evaluate(() => {
        document.querySelectorAll('.story-narr-root, .story-tutorial-overlay, .story-journey-overlay').forEach(overlay => overlay.remove());
        const ST = window.__storyTest;
        const row = ST.STORY_EVENTS_RAW.findIndex(event => event[1] === 'City' && event[2] === 'City5');
        Object.assign(ST.sm, {
          eventIndex: row, badges: 4, gold: 4500, pcBox: [], gymCleared: {}, inventory: {},
          team: [{ name: 'Gyarados', id: 'favorite', nickname: 'Wake', favorite: true, build: { m: ['Tackle'], n: 'Hardy', a: 'Intimidate' } }],
          citiesArrived: { 0: true, 1: true, 5: true }, storyChoices: { 'road.discovery.5': 'pass' },
          scenesShown: { 'tutorial-first-tutor': true }, npcStageSeen: { tutor: 2 },
          facilitiesSeen: { tutor: true }, facilityIntros: { tutor: true },
        });
        window.showScreen('screen-story-city');
        window.__renderCityActionsForTest(row);
      });
      const action = page.locator('#story-city-milestone button').filter({ hasText: 'Teach Wake' });
      await action.waitFor();
      const label = await action.locator('strong').innerText();
      const move = label.match(/^Teach Wake (.+)$/)?.[1];
      assert.ok(move, label);
      await capture('city-power-unlock');
      await action.click();
      const tutor = page.locator('#screen-story-tutor');
      const moveCard = tutor.locator(`button[data-card-kind="move"][data-card-value=${JSON.stringify(move)}]:enabled`);
      await moveCard.waitFor();
      assert.equal(await tutor.getByRole('searchbox', { name: 'Search moves' }).inputValue(), move);
      const intro = page.locator('.story-tutorial-overlay:visible .story-tutorial-continue, #modal-game-alert:not(.hidden) button:visible');
      for (let beat = 0; beat < 20; beat++) {
        if (await intro.count()) await intro.last().click();
        else if (await moveCard.click({ trial: true, timeout: 500 }).then(() => true, () => false)) break;
      }
      await moveCard.click();
      await capture('tutor-lesson-preview');
      assert.equal((await save()).gold, 4500, 'the preview leaves gold intact');
      assert.deepEqual((await save()).team[0].build.m, ['Tackle']);
      await tutor.locator('.tx-confirm-bar [data-action="move"]').click();
      const confirmation = page.locator('#modal-game-confirm');
      assert.match(await confirmation.innerText(), /1,000G/);
      await confirmation.getByRole('button', { name: 'OK', exact: true }).click();
      await page.waitForFunction(moveName => JSON.parse(localStorage.getItem('pbs_story_save')).team[0].build.m.includes(moveName), move);
      assert.deepEqual((await save()).team[0].build.m, ['Tackle', move]);
      assert.equal((await save()).gold, 3500);
      assert.deepEqual(errors, []);
      console.log(`${viewport.width}×${viewport.height} passed badge recruitment and the City 5 Tutor shortcut`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
