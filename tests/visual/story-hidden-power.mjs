import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const url = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5173/battle.html');
const output = process.env.BATTLE_HP_SHOTS;
if (output) await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
try {
  for (const viewport of [{ width: 320, height: 568 }, { width: 568, height: 260 }]) {
    const context = await browser.newContext({ viewport, hasTouch: true, isMobile: true,
      reducedMotion: 'reduce', serviceWorkers: 'block' });
    try {
      await context.addInitScript(() => { window.__testHarness = true; });
      await context.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
      const page = await context.newPage();
      page.setDefaultTimeout(10000);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(url.href, { waitUntil: 'domcontentloaded' });
      await page.evaluate(async () => {
        await window.__testReady;
        const story = window.__storyTest;
        const eventIndex = story.STORY_EVENTS_RAW.findIndex(row => row[1] === 'City' && row[2] === 'City3');
        Object.assign(story.sm, {
          active: true, eventIndex, badges: 2, runSeed: 3, gold: 5000, inventory: { heartScale: 1 },
          scenesShown: { 'tutorial-first-move-tutor': true, 'tutorial-hidden-power-mentor': true }, npcStageSeen: { tutor: 2 },
          hiddenPowerUnlocked: true, hiddenPowerChoosePending: true, hpChooseGranted: true,
          team: [
            { id: 'scout', name: 'Garchomp', build: { m: ['Dragon Claw'], a: 'Rough Skin', hpType: 'Ice' } },
            { id: 'ash', name: 'Gengar', build: { m: ['Shadow Ball'], a: 'Cursed Body', hpType: 'Steel' } },
          ],
        });
        window.StoryMode.enterTutor('moves', { partnerId: 'scout', move: 'Hidden Power Ice' });
      });
      const tutor = page.locator('#screen-story-tutor');
      const card = tutor.locator('button[data-card-value="Hidden Power"]');
      const picker = page.getByRole('dialog', { name: 'Choose Hidden Power type' });
      const confirmation = page.locator('#modal-game-confirm');
      const snapshot = () => page.evaluate(() => JSON.parse(localStorage.getItem('pbs_story_save')));
      const pricePrompt = async (pattern, action) => {
        await confirmation.waitFor();
        assert.match(await confirmation.innerText(), pattern);
        await confirmation.getByRole('button', { name: action, exact: true }).tap();
      };
      await card.tap();
      await tutor.locator('button[data-action="move"]').tap();
      const keep = picker.getByRole('button', { name: 'Keep Ice' });
      assert.equal(await keep.evaluate(button => button === document.activeElement), true);
      assert.ok((await keep.boundingBox()).height >= 44);
      const lastType = picker.locator('[data-hp]').last();
      assert.ok(await lastType.evaluate(button => {
        const { bottom, height } = button.getBoundingClientRect();
        return height >= 44 && bottom <= button.closest('.story-tutorial-scene').getBoundingClientRect().bottom + 1;
      }), 'The final type is in view without scrolling the picker');
      const label = `${viewport.width}×${viewport.height}`;
      if (output) await page.screenshot({ path: join(output, `${viewport.width}x${viewport.height}-diviner.png`) });
      await keep.tap();
      await pricePrompt(/Teach Hidden Power \(Ice\).*2,500G/s, 'OK');
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('pbs_story_save'))?.team[0].build.m.includes('Hidden Power Ice'));
      assert.equal((await snapshot()).hiddenPowerChoosePending, true);
      await page.evaluate(() => window.StoryMode.enterTutor('moves', { partnerId: 'ash', move: 'Hidden Power Steel' }));
      const chooseFire = async () => {
        await card.tap();
        await tutor.locator('button[data-action="moveVoucher"]').tap();
        await picker.getByRole('button', { name: 'Choose Fire' }).tap();
      };
      await chooseFire();
      await pricePrompt(/Heart Scale to teach Hidden Power \(Fire\)/, 'Cancel');
      assert.equal((await snapshot()).inventory.heartScale, 1);
      assert.equal((await snapshot()).hiddenPowerChoosePending, true);
      await chooseFire();
      await pricePrompt(/Heart Scale to teach Hidden Power \(Fire\)/, 'OK');
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('pbs_story_save'))?.team[1].build.m.includes('Hidden Power Fire'));
      const save = await snapshot();
      assert.equal(save.hiddenPowerChoosePending, false);
      assert.equal(save.inventory.heartScale, undefined);
      assert.equal(save.gold, 2500);

      // An independent saved state in which the favor is available and a caught
      // partner already knows its natural Hidden Power.
      await page.evaluate(() => {
        const { sm } = window.__storyTest;
        sm.hiddenPowerChoosePending = true;
        sm.team[0].currentHp = 38;
        sm.team[0].pp = [9, 3];
        window.StoryMode.enterTutor('moves', { partnerId: 'scout', move: 'Hidden Power' });
      });
      const changeType = tutor.getByRole('button', { name: 'Change type', exact: true });
      const chooseGround = async () => {
        await changeType.tap();
        await picker.getByRole('button', { name: 'Choose Ground' }).tap();
      };
      await chooseGround();
      await pricePrompt(/Use your favor.*Hidden Power to Ground/, 'Cancel');
      assert.equal(await changeType.isVisible(), true);
      await chooseGround();
      await pricePrompt(/Use your favor.*Hidden Power to Ground/, 'OK');
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('pbs_story_save'))?.team[0].build.m.includes('Hidden Power Ground'));
      const retuned = await snapshot();
      assert.deepEqual(retuned.team[0].build.m, ['Dragon Claw', 'Hidden Power Ground']);
      assert.deepEqual(retuned.team[0].pp, [9, 3]);
      assert.equal(retuned.team[0].currentHp, 38);
      assert.equal(retuned.hiddenPowerChoosePending, false);
      assert.equal(retuned.gold, 2500);
      assert.equal(await changeType.count(), 0);
      assert.deepEqual(errors, []);
      console.log(`${label} verified natural lessons, typed voucher lessons and one-time changes to equipped Hidden Power`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
