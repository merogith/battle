/* global state, settings */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const url = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5173/battle.html');
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 568, height: 260 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce', serviceWorkers: 'block' });
    await context.addInitScript(() => { window.__testHarness = true; });
    await context.route('**/*', route =>
      new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
    await context.route(/\/sprites\/gen5ani-shiny\/horsea\.gif$/, route => route.fulfill({ status: 404 }));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url.href);
    await page.evaluate(async () => {
      await window.__testReady;
      await window.prepareGameData();
      const run = window.StoryMode.state;
      Object.assign(run, {
        active: true, runSeed: 63, _strngState: 123,
        team: [
          { name: 'Pikachu', id: 'pilot', build: { m: ['Thunderbolt'], a: 'Static', evTrainFocus: ['atk'], _isShiny: false } },
          { name: 'Eevee', id: 'bench', build: { m: ['Tackle'], a: 'Run Away', _isShiny: false } },
        ],
        settings: { enabledGens: [1] },
        facilityIntros: { party: true },
      });
      window.StoryMode.upgrades.save();
      window.showScreen('screen-story-city');
      window.StoryMode.openPartyModal();
      const write = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === 'pbs_story_save' && window.denyFieldToolSave) throw new Error('Save denied in test');
        return write.call(this, key, value);
      };
    });
    const party = page.locator('#modal-story-party');
    const summary = page.locator('#modal-summary');
    const inspector = party.locator('[data-action-key="party-member-pilot"]');
    const focusDetails = summary.locator('#sum-training-details > summary');
    const speedChip = summary.locator('[data-ev-focus="spe"]');
    const reorder = summary.getByRole('button', { name: 'Move down in party' });
    const isFocused = locator => locator.evaluate(control => control === document.activeElement);
    const snapshot = () => page.evaluate(() => {
      const run = window.StoryMode.state;
      const keys = team => team.map(slot => [slot.id, slot.build.evTrainFocus || []]);
      return {
        rng: run._strngState, live: keys(run.team),
        saved: keys(JSON.parse(localStorage.getItem('pbs_story_save')).team),
        legacyGender: run.team.find(slot => slot.id === 'pilot').build._gender ?? null,
      };
    });

    const starting = await snapshot();
    await inspector.click();
    await summary.waitFor();
    assert.equal(await party.getAttribute('inert'), '');
    assert.deepEqual(await snapshot(), starting, 'read-only inspection leaves encounter seed and legacy build alone');
    const slotNav = summary.locator('#sum-nav-down');
    await slotNav.click();
    await summary.locator('#sum-nav-up').click();
    assert.deepEqual(await snapshot(), starting, 'browsing the party leaves the encounter seed alone');
    await focusDetails.click();
    await page.evaluate(() => { window.denyFieldToolSave = true; });
    await speedChip.click();
    assert.equal(await speedChip.getAttribute('aria-pressed'), 'false');
    assert.deepEqual(await snapshot(), starting, 'denied EV-focus edit changes neither live nor saved state');
    assert.equal(await isFocused(speedChip), true);
    const saveAlert = page.locator('#upgrade-save-alert');
    assert.equal(await summary.locator('#upgrade-save-alert').count(), 1);
    await reorder.click();
    assert.deepEqual(await snapshot(), starting, 'denied party edit leaves the stored and live order identical');
    await page.keyboard.press('Escape');
    assert.equal(await isFocused(inspector), true);
    assert.equal(await saveAlert.evaluate(alert => alert.parentElement === document.body), true);
    await inspector.click();
    assert.equal(await summary.locator('#upgrade-save-alert').count(), 1);

    await page.evaluate(() => { window.denyFieldToolSave = false; });
    await summary.getByRole('tab', { name: 'Overview' }).focus();
    await page.keyboard.press('Tab');
    assert.equal(await isFocused(saveAlert.getByRole('button', { name: 'Back up now' })), true);
    await page.keyboard.press('Tab');
    assert.equal(await isFocused(saveAlert.getByRole('button', { name: 'Retry' })), true);
    await page.keyboard.press('Enter');
    await saveAlert.waitFor({ state: 'hidden' });
    await focusDetails.click();
    await speedChip.click();
    assert.equal(await isFocused(speedChip), true);
    await slotNav.click();
    await summary.locator('#sum-nav-up').click();
    assert.equal(await speedChip.getAttribute('aria-pressed'), 'true');
    await reorder.click();
    const updated = await snapshot();
    assert.deepEqual(updated.live, [['bench', []], ['pilot', ['atk', 'spe']]]);
    assert.deepEqual(updated.saved, updated.live);
    await page.keyboard.press('Escape');
    assert.equal(await summary.isVisible(), false);
    assert.equal(await party.getAttribute('inert'), null);
    assert.equal(await isFocused(inspector), true, 'Summary returns to the same Pokémon after the Party rows repaint');
    await page.keyboard.press('Escape');
    await party.waitFor({ state: 'hidden' });
    assert.equal(await page.locator('#screen-story-city').getAttribute('inert'), null);

    await page.evaluate(() => {
      const run = window.StoryMode.state;
      run.badges = 1;
      run.scenesShown = { 'tutorial-first-pokemon-center': true };
      run.pcBox = [
        { name: 'Horsea', id: 'mint', build: { m: ['Bubble'], a: 'Swift Swim', _isShiny: true } },
        { name: 'Pichu', id: 'volt', build: { m: ['Thunder Shock'], a: 'Static', _isShiny: false } },
      ];
      window.StoryMode.enterPokemonCenter();
    });
    const center = page.locator('#screen-story-pokemoncenter');
    const box = center.locator('#story-pc-box-grid');
    const horsea = box.locator('[data-pc-id="mint"]');
    const search = center.getByRole('searchbox');
    const type = center.getByRole('combobox', { name: 'Filter by type' });
    const shiny = center.getByRole('button', { name: 'Shinies only' });
    await horsea.waitFor();
    await horsea.locator('img[src="sprites/gen5ani/horsea.gif"]').waitFor();
    await center.locator('.pc-box-tools > summary').click();
    await shiny.press('Enter');
    assert.equal(await shiny.getAttribute('aria-pressed'), 'true');
    assert.equal(await isFocused(shiny), true);
    assert.equal(await box.locator('[data-pc-id="volt"]').count(), 0);
    await search.fill('missing');
    await box.getByRole('button', { name: 'Clear filters' }).click();
    assert.equal(await isFocused(search), true);
    assert.equal(await search.inputValue(), '');
    assert.equal(await shiny.getAttribute('aria-pressed'), 'false');
    await type.selectOption('Water');
    assert.equal(await box.locator('[data-pc-id="volt"]').count(), 0);
    await horsea.getByRole('button', { name: 'Withdraw' }).click();
    assert.equal(await type.inputValue(), '');
    await box.locator('[data-pc-id="volt"]').waitFor();
    assert.deepEqual(await page.evaluate(() => window.StoryMode.state.pcBox.map(slot => slot.id)), ['volt']);

    await page.evaluate(async () => {
      settings.animations = false;
      settings.battleSpeed = 'instant';
      state.mode = 'pve';
      state.p1Draft = [
        { name: 'Pikachu', build: { a: 'Static', m: ['Thunderbolt'] } },
        { name: 'Raichu', build: { a: 'Static', m: ['Thunderbolt'] } },
      ];
      state.p2Draft = [{ name: 'Blissey', build: { a: 'Natural Cure', m: ['Seismic Toss'] } }];
      await window.startBattle();
    });
    const battle = page.locator('#screen-battle');
    const battleParty = page.locator('#modal-party');
    const switchCommand = battle.locator('[data-cmd="party"]');
    const firstSummary = battleParty.locator('[data-action-key="summary-0"]');
    await switchCommand.focus();
    await page.keyboard.press('Enter');
    await battleParty.waitFor();
    assert.equal(await battle.getAttribute('inert'), '');
    assert.equal(await isFocused(firstSummary), true);
    await page.keyboard.press('Enter');
    await summary.waitFor();
    assert.equal(await battleParty.getAttribute('inert'), '');
    await page.keyboard.press('Escape');
    assert.equal(await isFocused(firstSummary), true);
    await page.keyboard.press('Escape');
    await battleParty.waitFor({ state: 'hidden' });
    assert.equal(await battle.getAttribute('inert'), null);
    assert.equal(await isFocused(switchCommand), true);

    // Exercise the compatibility presentation of a mandatory replacement. The
    // separate classic-native-pivot browser suite plays the simulator's real KO.
    await page.evaluate(() => {
      state.battleEngine = 'compatibility';
      state.pActive.currentHp = 0;
      window.openParty(true);
    });
    await battleParty.waitFor();
    await page.keyboard.press('Escape');
    assert.equal(await battleParty.isVisible(), true);
    assert.equal(await battleParty.locator('#btn-cancel-party').isDisabled(), true);
    assert.equal(await battleParty.locator('[data-action-key="switch-1"]').isEnabled(), true);
    await page.evaluate(() => window.showScreen('screen-menu'));
    await battleParty.waitFor({ state: 'hidden' });
    assert.equal(await page.locator('#screen-menu').getAttribute('inert'), null);
    assert.deepEqual(errors, []);
    console.log(`Field and battle tools passed at ${viewport.width}×${viewport.height}.`);
    await context.close();
  }
} finally {
  await browser.close();
}
