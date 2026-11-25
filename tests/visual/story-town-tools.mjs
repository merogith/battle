import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const url = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5173/battle.html');
const out = process.env.BATTLE_PLAYTEST_OUT;
if (out) await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });

try {
  for (const [width, height, touch] of [[320, 568, true], [568, 320, true], [1280, 800, false]]) {
    const context = await browser.newContext({
      viewport: { width, height }, hasTouch: touch, isMobile: touch, serviceWorkers: 'block',
    });
    try {
      await context.addInitScript(() => { window.__testHarness = true; });
      await context.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(url.href, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.__testReady);
      await page.evaluate(async () => {
        await window.__testReady;
        window.__testHarness = false;
        const story = window.__storyTest;
        const partner = (name, id, a, m, i = '') => ({ name, id,
          build: { a, m, i, n: 'Hardy', evs: {}, ivs: {}, _isShiny: false } });
        Object.assign(story.sm, { active: true, runSeed: 11, badges: 0, gold: 35000,
          flags: {}, scenesShown: { 'city0-coldopen': true, 'tutorial-first-pokemon-center': true },
          profUsed: { 0: true }, citiesArrived: { 0: true, 2: true, 6: true, 7: true }, storyCityVisit: 0,
          npcStageSeen: { tutor: 2, dojo: 3 }, inventory: {}, storyChoices: {},
          team: [partner('Garchomp', 'garchomp', 'Rough Skin', ['Earthquake', 'Swords Dance'], 'Assault Vest'),
            partner('Alakazam', 'alakazam', 'Synchronize', ['Psychic']),
            partner('Blastoise', 'blastoise', 'Torrent', ['Surf'])],
          pcBox: [partner('Eevee', 'eevee', 'Adaptability', ['Tackle'])],
          settings: { ...story.sm.settings, enabledGens: [1, 4] },
        });
        window.showScreen('screen-story-city');
        window.__renderCityActionsForTest(0);
        const quote = document.querySelector('#story-city-quote');
        window.townQuoteProbe = { text: quote.textContent, node: quote.firstChild, changes: 0 };
        new MutationObserver(records => { window.townQuoteProbe.changes += records.length; })
          .observe(quote, { childList: true, subtree: true, characterData: true });
      });
      const city = page.locator('#screen-story-city');
      const quote = city.locator('#story-city-quote');
      const notebook = page.getByRole('dialog', { name: 'Trainer’s Notebook' });
      const storyFlags = () => page.evaluate(() => JSON.parse(localStorage.getItem('pbs_story_save')).flags);
      const openNotebook = async () => {
        await city.getByRole('button', { name: 'Team help and practice' }).click();
        await notebook.waitFor();
        assert.equal(await notebook.evaluate(el => el.scrollWidth <= el.clientWidth + 1), true);
      };
      await quote.waitFor();
      assert.equal((await storyFlags())['heard:relic'], true);
      await openNotebook();
      assert.match(await notebook.innerText(), /rel(?:ic|ics)/i);
      assert.deepEqual(await notebook.locator('.upgrade-tabs button').allTextContents(), ['What next?', 'My team', 'Journal']);
      await notebook.getByRole('button', { name: 'My team', exact: true }).click();
      const teamCards = await notebook.locator('.upgrade-grid .upgrade-card > p').evaluateAll(cards => cards.map(card => card.textContent));
      const actual = await page.evaluate(() => window.StoryMode.upgrades.snapshot().team.map(mon =>
        ({ total: mon.hp + Object.values(mon.stats).reduce((sum, stat) => sum + stat, 0), style: mon.attackStyle })));
      assert.deepEqual(actual.map(mon => mon.style), ['Physical', 'Special', 'Hybrid']);
      for (const [index, mon] of actual.entries()) assert.ok(teamCards[index].endsWith(`Stats ${mon.total} · ${mon.style}`));
      await notebook.getByRole('button', { name: 'Journal', exact: true }).click();
      assert.match(await notebook.innerText(), /Heard in town/);
      if (out) await page.screenshot({ path: join(out, `notebook-${width}.png`) });
      await notebook.getByRole('button', { name: 'Close', exact: true }).click();

      // Re-enter from the Pokémart. A stale typewriter used to reset the guide and move the buttons.
      await city.locator('button[data-action-key="mart"]').click();
      const tutorial = page.locator('.story-tutorial-overlay .story-tutorial-continue');
      const shop = page.locator('#screen-story-shop');
      for (let i = 0; i < 8 && await tutorial.count(); i++) await tutorial.click();
      const alert = page.locator('#modal-game-alert:visible');
      if (await alert.count()) await alert.getByRole('button', { name: 'OK', exact: true }).click();
      await shop.getByRole('button', { name: /Back/ }).first().click();
      await city.waitFor();
      for (let i = 0; i < 8 && await tutorial.count(); i++) await tutorial.click();
      assert.deepEqual(await quote.evaluate(el => {
        const probe = window.townQuoteProbe;
        return [el.textContent === probe.text, el.firstChild === probe.node, probe.changes];
      }), [true, true, 0]);

      const town = (cityNumber, badges, extra = {}) => page.evaluate(({ cityNumber, badges, extra }) => {
        const story = window.__storyTest;
        const index = story.STORY_EVENTS_RAW.findIndex(row => row[1] === 'City' && row[2] === 'City' + cityNumber);
        Object.assign(story.sm, { badges, eventIndex: index, storyCityVisit: cityNumber, ...extra });
        window.showScreen('screen-story-city');
        window.__renderCityActionsForTest(index);
      }, { cityNumber, badges, extra });
      await town(2, 1, { daycare: { unlocked: true } });
      await town(2, 1);
      assert.equal((await storyFlags())['heard:underground'], true);
      assert.equal((await storyFlags())['heard:egg'], true);
      const tutor = page.locator('#screen-story-tutor');
      const checkToxic = async starter => {
        await page.evaluate(starter => {
          const slot = window.StoryMode.state.team[0];
          slot.starter = starter;
          slot.build.starter = starter;
          return window.StoryMode.enterTutor('moves', { partnerId: 'garchomp', move: 'Toxic' });
        }, starter);
        const card = tutor.locator('[data-card-kind="move"][data-card-value="Toxic"]:visible');
        await card.waitFor();
        for (let i = 0; i < 8 && await tutorial.count(); i++) await tutorial.click();
        if (await alert.count()) await alert.getByRole('button', { name: 'OK', exact: true }).click();
        assert.equal(await card.isEnabled(), starter);
        assert.match(await card.innerText(), starter ? /Starter bond/ : /Opens in/);
        assert.match(await tutor.locator('.tx-move-tier-note').innerText(), starter ? /Starter bond through Tier 3/ : /Lessons through Tier 2/);
        if (!starter) {
          await tutor.getByRole('button', { name: 'Filters', exact: true }).click();
          await tutor.getByRole('button', { name: 'Can learn now', exact: true }).click();
          assert.equal(await card.count(), 0);
          assert.match(await tutor.locator('.tx-grid-empty').innerText(), /No moves match/);
        }
      };
      await checkToxic(false);
      await checkToxic(true);
      await page.evaluate(() => {
        const slot = window.StoryMode.state.team[0];
        delete slot.starter;
        delete slot.build.starter;
        window.StoryMode.state.team.push({ id: 'ninetales', name: 'Ninetales',
          build: { a: 'Flash Fire', m: ['Ember'], n: 'Hardy' } });
      });
      const checkMasterGear = async city => {
        await town(city, city - 1);
        const open = dojoTab => page.evaluate(dojoTab =>
          window.StoryMode.enterTutor('loadout', { partnerId: 'ninetales', dojoTab }), dojoTab);
        await open('ability');
        const ability = tutor.locator('[data-card-kind="ability"][data-card-value="Drought"]');
        await ability.waitFor();
        for (let i = 0; i < 8 && await tutorial.count(); i++) await tutorial.click();
        if (await alert.count()) await alert.getByRole('button', { name: 'OK', exact: true }).click();
        assert.equal(await ability.isEnabled(), city >= 6);
        if (city < 6) assert.match(await ability.innerText(), /Master/);
        await open('item');
        await tutor.getByRole('searchbox', { name: 'Search items' }).fill('Focus Sash');
        const item = tutor.locator('[data-card-kind="item"][data-card-value="Focus Sash"]');
        await item.waitFor();
        assert.equal(await item.isEnabled(), city >= 6);
        if (city < 6) assert.match(await item.innerText(), /Master/);
      };
      await checkMasterGear(4);
      await checkMasterGear(6);
      await page.evaluate(() => window.StoryMode.state.team.pop());
      await town(6, 6);
      assert.equal((await storyFlags())['heard:matron'], true);
      assert.match(await city.locator('[data-action-key="daycare"]').innerText(), /Speak to the matron/);

      await town(7, 6);
      await page.evaluate(() => window.StoryMode.enterTutor('moves', { partnerId: 'garchomp' }));
      const moves = tutor.locator('.tx-card[data-card-kind="move"]:visible');
      await moves.first().waitFor();
      for (let i = 0; i < 8 && await tutorial.count(); i++) await tutorial.click();
      if (await alert.count()) await alert.getByRole('button', { name: 'OK', exact: true }).click();
      const sort = tutor.getByRole('combobox', { name: 'Sort' });
      await sort.selectOption('name');
      const names = async () => moves.evaluateAll(cards => cards.map(card => card.dataset.cardValue));
      const all = await names();
      assert.deepEqual(all, all.slice().sort((a, b) => a.localeCompare(b)));
      const filters = tutor.getByRole('button', { name: /^Filters/ });
      const search = tutor.getByRole('searchbox', { name: 'Search moves' });
      assert.equal(await filters.getAttribute('aria-expanded'), 'false');
      const toolbar = tutor.locator('.tx-toolbar--moves');
      assert.ok(await toolbar.evaluate(el => el.scrollWidth <= el.clientWidth + 1));
      assert.ok(await tutor.locator('.tx-slot-name').evaluateAll(labels =>
        labels.every(label => label.scrollWidth <= label.clientWidth + 1)));
      if (touch) {
        for (const control of [search, filters, sort]) {
          assert.ok(await control.evaluate(element => element.offsetHeight >= 44));
        }
      }
      if (out) {
        await toolbar.scrollIntoViewIfNeeded();
        await page.screenshot({ path: join(out, `move-tutor-${width}.png`) });
      }
      await filters.press('Enter');
      assert.equal(await filters.evaluate(el => el === document.activeElement), true);
      const types = tutor.getByRole('button', { name: /^Choose types/ });
      await types.press('Enter');
      assert.equal(await types.evaluate(el => el === document.activeElement), true);
      const ground = tutor.getByRole('group', { name: 'Filter by move type' }).getByRole('button', { name: 'Ground', exact: true });
      await ground.press('Enter');
      assert.equal(await ground.getAttribute('aria-pressed'), 'true');
      assert.equal(await ground.evaluate(el => el === document.activeElement), true);
      assert.ok(await moves.count() > 0);
      assert.ok(await moves.evaluateAll(cards => cards.every(card => card.querySelector('.tx-card-head .type-Ground'))));
      await filters.press('Enter');
      await tutor.getByRole('button', { name: 'Remove Ground filter', exact: true }).press('Enter');
      assert.equal(await filters.evaluate(el => el === document.activeElement), true);
      assert.deepEqual(await names(), all);
      await filters.press('Enter');
      const special = tutor.getByRole('group', { name: 'Move category' }).getByRole('button', { name: 'Special', exact: true });
      await special.press('Enter');
      assert.ok(await moves.count() > 0);
      assert.deepEqual(await moves.locator('.tx-pill--cat-Special').count(), await moves.count());
      await tutor.locator('[data-filter-kind="quick"][data-filter-value="status"]').click();
      assert.ok(await moves.count() < all.length);
      assert.ok((await names()).every(name => !['Earthquake', 'Dragon Claw'].includes(name)));
      await search.fill('Earthquake');
      assert.equal(await moves.count(), 0, 'search respects the active Status filter and hidden cards stay hidden');
      await tutor.getByRole('button', { name: 'Clear', exact: true }).press('Enter');
      assert.equal(await sort.inputValue(), 'name');
      assert.equal(await search.evaluate(el => el === document.activeElement), true);
      await sort.selectOption('tier');
      const tiers = async () => moves.evaluateAll(cards => cards.map(card => Number(card.dataset.stage)));
      const orderedTiers = await tiers();
      assert.deepEqual(orderedTiers, orderedTiers.slice().sort((a, b) => a - b));
      await tutor.locator('[data-tier-kind="moves"][data-filter-value="3"]').click();
      assert.ok((await tiers()).includes(3));
      assert.ok((await tiers()).every(tier => tier === 3));
      await tutor.getByRole('button', { name: 'Clear', exact: true }).click();
      await tutor.locator('.tx-suggest-summary').click();
      const plan = await page.evaluate(() => window._txBuildFastBuildPlan(0));
      const suggestions = await tutor.locator('.tx-suggest [data-rec-slot]').evaluateAll(rows =>
        rows.map(row => ({ move: row.dataset.cardValue, slot: Number(row.dataset.recSlot) })));
      assert.deepEqual(suggestions, plan.moveSteps.map(step => ({ move: step.move, slot: step.slot })));
      const itemPart = plan.parts.find(part => part.kind === 'item');
      const nature = plan.parts.find(part => part.kind === 'nature');
      const evs = plan.parts.find(part => part.kind === 'evs');
      assert.ok(itemPart && nature && evs, 'there is compatible advice for each upgrade');
      assert.ok(!['Assault Vest', 'Choice Band', 'Choice Specs', 'Choice Scarf'].includes(itemPart.to));

      await page.evaluate(() => window.StoryMode.enterTutor('loadout', { partnerId: 'garchomp' }));
      const firstItem = tutor.locator('.tx-rec-row[data-card-kind="item"]').first();
      await firstItem.waitFor();
      assert.equal(await firstItem.getAttribute('data-card-value'), itemPart.to);
      for (let i = 0; i < 8 && await tutorial.count(); i++) await tutorial.click();
      if (await alert.count()) await alert.getByRole('button', { name: 'OK', exact: true }).click();
      assert.equal(await tutor.locator('.tx-rec-row[data-card-kind="item"]:visible').count(), 1);
      const abilityTab = tutor.getByRole('tab', { name: /^Ability/ });
      const lockedCount = abilityTab.locator('.tx-tab-badge');
      await (await lockedCount.count() ? lockedCount : abilityTab).click();
      assert.equal(await abilityTab.getAttribute('aria-selected'), 'true', `Ability tab activates. Browser errors: ${errors.join(' | ')}`);
      const abilityPick = tutor.locator('.tx-rec-row[data-card-kind="ability"]').first();
      await abilityPick.waitFor();
      const ability = plan.parts.find(part => part.kind === 'ability');
      assert.equal(await abilityPick.getAttribute('data-card-value'), ability?.to || 'Rough Skin');

      await page.evaluate(() => window.StoryMode.enterTutor('nature', { partnerId: 'garchomp' }));
      const naturePick = tutor.locator('.tx-rec-row[data-card-kind="nature"]');
      assert.equal(await naturePick.getAttribute('data-card-value'), nature.to);
      assert.match(await naturePick.innerText(), /Raises Attack by 10%/);
      assert.equal(await tutor.locator('.tx-nature-grid').isVisible(), false);
      for (let i = 0; i < 8 && await tutorial.count(); i++) await tutorial.click();
      if (await alert.count()) await alert.getByRole('button', { name: 'OK', exact: true }).click();
      await naturePick.click();
      const attack = await tutor.locator('.tx-nature-preview .tx-stat-row-val').first().innerText();
      const expectedAttack = await page.evaluate(target => {
        const story = window.StoryMode.state;
        const previous = story.team[0].build.n;
        const before = window.StoryMode.upgrades.snapshot().team[0].stats.atk;
        story.team[0].build.n = target;
        const after = window.StoryMode.upgrades.snapshot().team[0].stats.atk;
        story.team[0].build.n = previous;
        const delta = after - before;
        return delta ? `${after} (${delta > 0 ? '+' : ''}${delta})` : String(after);
      }, nature.to);
      assert.equal(attack, expectedAttack);

      await page.evaluate(() => window.StoryMode.enterEVTrainer('garchomp'));
      const preset = page.locator('#evpreset-0-rec-role');
      await preset.waitFor();
      assert.match(await preset.innerText(), /Recommended/);
      assert.deepEqual(await page.evaluate(() => window._evTrainerRecPreset('Garchomp').evs), evs.evs);
      await preset.getByRole('button', { name: /^Buy 508 EVs/ }).waitFor();
      const comparison = page.getByText('Current EVs and other training spreads', { exact: true });
      assert.equal(await comparison.evaluate(el => el.parentElement.open), false);

      await page.evaluate(() => window.StoryMode.enterMentor());
      const mentor = page.locator('#screen-story-mentor');
      const preview = mentor.locator('[data-fastbuild-open="0"]');
      await preview.waitFor();
      for (let i = 0; i < 8 && await tutorial.count(); i++) await tutorial.click();
      if (await alert.count()) await alert.getByRole('button', { name: 'OK', exact: true }).click();
      await preview.click();
      assert.equal(await mentor.locator('.tx-fb-row').count(), 1);
      assert.ok(await mentor.locator('[data-fastbuild-apply]').evaluate(el => el.getBoundingClientRect().height >= 44));
      await mentor.getByRole('button', { name: 'Review full build' }).click();
      assert.ok(await mentor.locator('.tx-fb-row').count() > 1);
      await mentor.getByRole('button', { name: 'Cancel', exact: true }).click();
      assert.equal(await preview.evaluate(el => el === document.activeElement), true);
      assert.deepEqual(errors, []);
      console.log(`${width}×${height} · guide, Notebook, saved clues, visible filters, and matching Mentor advice verified`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
