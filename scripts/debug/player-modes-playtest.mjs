/* global state */
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

// Run against npm start. BATTLE_TEST_CHROMIUM can select a system Chromium binary.
const url = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5173/battle.html');
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && /^https?:$/.test(url.protocol));
assert.equal(url.search + url.hash, '', 'Use the normal game entry point');
const out = process.env.BATTLE_PLAYTEST_OUT
  ? resolve(process.env.BATTLE_PLAYTEST_OUT)
  : await mkdtemp(join(tmpdir(), 'battle-player-modes-'));
await mkdir(out, { recursive: true });

const desktop = { viewport: { width: 1366, height: 900 } };
const phone = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };
const landscape = { ...phone, viewport: { width: 844, height: 390 } };
const tablet = { viewport: { width: 1180, height: 820 }, hasTouch: true, isMobile: true };
const report = { status: 'passed', findings: [], trace: [], bypasses: [] };
const selectedCases = process.env.BATTLE_PLAYTEST_CASES?.split(',').map(name => name.trim()).filter(Boolean);
const nativeCases = new Set(process.env.BATTLE_EXPECT_NATIVE_MODES?.split(',').map(name => name.trim()).filter(Boolean));

const main = page => page.locator('#screen-menu');
const settings = page => page.locator('#modal-settings');
const draft = page => page.locator('#screen-draft');
const cards = page => page.locator('#draft-grid .draft-card');
const fight = page => page.locator('#command-menu [data-cmd="fight"]');
const end = page => page.locator('#modal-end-screen');
const confirmation = page => page.locator('#modal-game-confirm');
const modeButton = (page, name) => main(page).locator('.menu-mode-grid').getByRole('button', { name });

async function capture(page, screenshot) {
  const screens = await page.locator('.screen:visible').evaluateAll(nodes => nodes.map(node => node.id));
  const dialogs = await page.locator('[role="dialog"]:visible').evaluateAll(nodes => nodes.map(node => node.id));
  await page.screenshot({ path: join(out, screenshot), timeout: 7000 });
  return { screens, dialogs, screenshot };
}

async function snapshot(page, record, phase) {
  record.steps.push({ phase, ...await capture(page, record.name + '-' + phase + '.png') });
}

async function battleEngine(page, record, phase) {
  await fight(page).waitFor();
  await page.waitForFunction(() => state.pActive && state.fActive && !state.isLocked && !state.isOver);
  const engine = await page.evaluate(() => ({
    active: state.battleEngine || 'classic',
    rendered: document.getElementById('screen-battle').dataset.battleEngine || null,
    nativeReady: Boolean(state.nativeRequests?.[0]),
  }));
  record.engines ??= [];
  record.engines.push({ phase, ...engine });
  if (nativeCases.has(record.name)) {
    assert.equal(engine.active, 'showdown', `${record.name} ${phase} should run on Showdown`);
    assert.equal(engine.rendered, 'showdown');
    assert.equal(engine.nativeReady, true);
  }
}

async function openSettings(page) {
  await page.getByRole('button', { name: 'Settings', exact: true }).filter({ visible: true }).first().click();
  await settings(page).waitFor({ state: 'visible' });
}

async function closeSettings(page) {
  await settings(page).getByRole('button', { name: 'Close settings' }).click();
}

async function chooseFastBattles(page) {
  await openSettings(page);
  await settings(page).getByRole('combobox', { name: 'Battle speed', exact: true }).selectOption('instant');
  await page.locator('#sw-animations').uncheck();
  await closeSettings(page);
}

async function battleOptions(page, { teams = 'random', size = '1' } = {}) {
  await page.locator('#menu-customize-toggle').click();
  await page.getByRole('radio', { name: /Custom/ }).click();
  await page.locator('#quick-team-source').selectOption(teams);
  await page.locator('#party-size-select').selectOption(size);
  await page.locator('#menu-customize-toggle').click();
}

async function selectMove(page) {
  await fight(page).click();
  await page.locator('#move-menu .battle-btn-move:enabled .move-tile-name').first().click();
}

async function selectStrongMove(page) {
  await fight(page).click();
  const choices = page.locator('#move-menu .battle-btn-move:enabled');
  await choices.first().waitFor();
  const index = await choices.evaluateAll(buttons => {
    const score = button => {
      const label = button.getAttribute('aria-label') || '';
      const power = Number(label.match(/Power (\d+)/)?.[1] || 0);
      const accuracy = Number(label.match(/Acc (\d+)%/)?.[1] || 100);
      const matchup = button.querySelector('.move-tile-matchup')?.textContent || '';
      const multiplier = matchup.includes('▲') ? 2 : matchup.includes('▼') ? 0.5 : matchup.includes('⊘') ? 0 : 1;
      return power * accuracy * multiplier;
    };
    return buttons.indexOf(buttons.reduce((best, button) => score(button) > score(best) ? button : best));
  });
  const choice = choices.nth(index);
  const name = choice.locator('.move-tile-name');
  await (await name.count() ? name : choice).click();
}

async function waitForTurn(page, before) {
  await page.waitForFunction(n =>
    (state.turnNumber > n && !state.isLocked)
      || document.querySelector('#modal-end-screen:not(.hidden)')
      || document.querySelector('#modal-gauntlet-swap:not(.hidden)'),
  before);
  assert.match(await page.locator('#battle-log').textContent(), / used /);
}

async function switchThroughMenu(page, button, name) {
  const before = await page.evaluate(() => state.battleEvents.length);
  await button.tap();
  const logEntry = await page.waitForFunction(({ before, name }) => {
    if (state.isLocked) return null;
    return state.battleEvents.slice(before).find(event => event.native
      ? event.native.kind === 'switch' && event.native.side === 'p1'
      : event.text === `Player 1 sent out ${name}!`);
  }, { before, name });
  const { text } = await logEntry.jsonValue();
  await logEntry.dispose();
  await page.locator('#battle-log').getByText(text, { exact: true }).last().waitFor({ state: 'attached' });
  return text;
}

async function forfeit(page, expected) {
  await page.locator('#command-menu [data-cmd="run"]').click();
  const dialog = confirmation(page);
  await dialog.waitFor({ state: 'visible' });
  await dialog.getByRole('button', { name: 'OK' }).click();
  await end(page).waitFor({ state: 'visible' });
  assert.match(await page.locator('#end-title').textContent(), expected);
}

const cases = [
  {
    name: 'settings-offline', profile: desktop, serviceWorkers: 'allow',
    async play(page, record) {
      await chooseFastBattles(page);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await openSettings(page);
      assert.equal(await page.locator('#setting-battle-speed').inputValue(), 'instant');
      assert.equal(await page.locator('#sw-animations').isChecked(), false);
      await closeSettings(page);
      await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 30000 });
      await page.getByRole('button', { name: 'Download the game for offline play' }).click();
      await page.locator('#offline-dl-panel').waitFor({ state: 'visible' });
      await page.waitForFunction(() =>
        /remaining.*files|files remaining/.test(document.getElementById('offline-dl-size').textContent));
      assert.equal(await page.locator('#offline-dl-start').isEnabled(), true);
      record.detail = (await page.locator('#offline-dl-size').textContent()).trim();
    },
  },
  {
    name: 'quick-vs-ai', profile: landscape,
    async play(page, record) {
      await chooseFastBattles(page);
      await battleOptions(page);
      await main(page).getByRole('button', { name: /Jump In/ }).click();
      await battleEngine(page, record, 'jump-in');
      assert.equal(await page.evaluate(() => state.mode), 'pve');
      assert.deepEqual(await page.evaluate(() => [state.playerParty.length, state.foeParty.length]), [1, 1]);
      const before = await page.evaluate(() => state.turnNumber);
      await selectMove(page);
      await waitForTurn(page, before);
      if (!(await end(page).isVisible())) await forfeit(page, /FORFEIT/);
      await snapshot(page, record, 'result');
      await page.getByRole('button', { name: /Play Again/ }).click();
      await battleEngine(page, record, 'play-again');
      assert.equal(await page.evaluate(() => state.isOver), false);
    },
  },
  {
    name: 'quick-battle', profile: desktop,
    async play(page, record) {
      await chooseFastBattles(page);
      await battleOptions(page);
      await modeButton(page, /Quick Battle/i).click();
      await battleEngine(page, record, 'random-team');
      const before = await page.evaluate(() => state.turnNumber);
      await selectStrongMove(page);
      await waitForTurn(page, before);
      if (!(await end(page).isVisible())) await forfeit(page, /FORFEIT/);
    },
  },
  {
    name: 'battle-party',
    profile: phone,
    async play(page, record) {
      await chooseFastBattles(page);
      await battleOptions(page, { size: '2' });
      await main(page).getByRole('button', { name: /Jump In/ }).tap();
      await battleEngine(page, record, 'party');
      const command = page.getByRole('button', { name: /Pokémon — switch a party member/ });
      const party = page.locator('#modal-party');
      await command.tap();
      await party.getByRole('heading', { name: 'Pokémon Party' }).waitFor();
      assert.match(await page.locator('#party-context-text').textContent(), /Pokémon to switch in.*uses your action this turn/);
      assert.equal(await party.locator('.party-slot').count(), 2);
      assert.equal(await party.locator('.active-mon').getByRole('button', { name: 'Switch' }).isDisabled(), true);
      await snapshot(page, record, 'switch-menu');
      await party.getByRole('button', { name: 'Cancel' }).tap();
      await party.waitFor({ state: 'hidden' });
      await command.tap();
      const switchButton = party.locator('.party-slot:not(.active-mon)').getByRole('button', { name: 'Switch' });
      if (await switchButton.isEnabled()) {
        const { lead, reserve } = await page.evaluate(() => ({
          lead: state.pActive.name, reserve: state.playerParty.find(mon => mon !== state.pActive).name,
        }));
        record.switchLog = [await switchThroughMenu(page, switchButton, reserve)];
        const needsReplacement = await party.isVisible();
        if (needsReplacement) {
          assert.equal(await party.getByRole('button', { name: 'Cancel' }).isDisabled(), true);
          const replacement = party.getByRole('button', { name: 'Switch', exact: true })
            .and(party.locator('button:enabled'));
          assert.equal(await replacement.count(), 1);
          await snapshot(page, record, 'forced-replacement');
          record.switchLog.push(await switchThroughMenu(page, replacement, lead));
          await party.waitFor({ state: 'hidden' });
        }
        if (!(await end(page).isVisible())) await fight(page).waitFor();
        record.detail = needsReplacement
          ? 'Switched to the reserve, then resolved the required replacement.'
          : 'Opened and cancelled the party picker, then resolved a switch turn.';
      } else {
        assert.ok(await switchButton.getAttribute('title'), 'A disabled reserve shows the trap reason');
        record.detail = 'Opened and cancelled the party picker. The foe trapped the lead.';
      }
    },
  },
  {
    name: 'quick-draft', profile: desktop,
    async play(page, record) {
      await chooseFastBattles(page);
      await battleOptions(page, { teams: 'draft' });
      await modeButton(page, /Quick Battle/i).click();
      await cards(page).first().waitFor();
      await snapshot(page, record, 'team-pool');
      await draft(page).getByRole('button', { name: "Inspect Foe's Pool" }).click();
      const enemy = page.locator('#modal-enemy-pool');
      await enemy.getByText("Foe's Potential Draft Pool").waitFor();
      const poolSize = await page.locator('#enemy-pool-grid .draft-card').count();
      await snapshot(page, record, 'opponent-pool');
      if (poolSize > 0 && poolSize !== 6 && /All six possible builds/.test(await enemy.textContent())) {
        report.findings.push({ scenario: record.name, issue: `The opponent preview says six builds and shows ${poolSize} in a 1v1 draft.` });
      }
      await enemy.getByRole('button', { name: 'Close' }).click();
      await cards(page).first().getByRole('button', { name: 'Full summary' }).click();
      const summary = page.locator('#modal-summary');
      await summary.getByRole('tab', { name: 'Moves' }).click();
      assert.equal(await summary.getByRole('tab', { name: 'Moves' }).getAttribute('aria-selected'), 'true');
      await snapshot(page, record, 'move-summary');
      await summary.getByRole('button', { name: /^Close(?: summary)?$/i }).first().click();
      await openSettings(page);
      await settings(page).getByRole('button', { name: 'VIEW', exact: true }).click();
      const guide = page.getByRole('dialog', { name: 'Help Guide' });
      await guide.waitFor();
      assert.match(await guide.textContent(), /possible builds for this draft/);
      await snapshot(page, record, 'draft-guide');
      await guide.getByRole('button', { name: 'Got it!' }).click();
      await cards(page).first().locator('img').click();
      await battleEngine(page, record, 'drafted-team');
      assert.equal(await page.evaluate(() => state.p1Draft.length), 1);
      const before = await page.evaluate(() => state.turnNumber);
      await selectStrongMove(page);
      await waitForTurn(page, before);
    },
  },
  {
    name: 'local-pvp', profile: tablet,
    async play(page, record) {
      await chooseFastBattles(page);
      await battleOptions(page);
      await modeButton(page, /Local PvP/i).tap();
      await cards(page).first().waitFor();
      assert.match(await page.locator('#draft-title').textContent(), /Player 1/);
      await cards(page).first().locator('img').tap();
      await page.getByText(/Player 2: Pick 1 Pokémon/).waitFor();
      await snapshot(page, record, 'player-two-draft');
      await cards(page).first().locator('img').tap();
      await battleEngine(page, record, 'both-teams-drafted');
      assert.equal(await page.evaluate(() => state.mode), 'pvp');
      const before = await page.evaluate(() => state.turnNumber);
      await selectMove(page);
      await page.waitForFunction(() => state.currentPlayer === 2 && !!state.p1Action);
      await selectMove(page);
      await waitForTurn(page, before);
    },
  },
  {
    name: 'gauntlet', profile: tablet,
    async play(page, record) {
      await chooseFastBattles(page);
      await battleOptions(page);
      const loot = page.locator('#modal-gauntlet-swap');
      for (let attempt = 1; attempt <= 3; attempt++) {
        await modeButton(page, /Gauntlet/i).tap();
        await cards(page).first().waitFor();
        const pick = await cards(page).evaluateAll(nodes => {
          const bst = node => Number(node.getAttribute('aria-label')?.match(/BST (\d+)/)?.[1] || 0);
          return nodes.indexOf(nodes.reduce((best, node) => bst(node) > bst(best) ? node : best));
        });
        await cards(page).nth(pick).locator('img').tap();
        await battleEngine(page, record, `round-one-attempt-${attempt}`);
        assert.match(await page.locator('#gauntlet-score').textContent(), /Score:\s*0/);
        if (attempt === 1) await snapshot(page, record, 'round-one');
        const controlled = attempt === 3;
        if (controlled) {
          report.bypasses.push('Gauntlet loot was opened with a controlled win after two attempts through live turns.');
          await page.evaluate(() => {
            state.foeParty.forEach(mon => { mon.currentHp = 0; });
            state.isOver = true;
            window.showGauntletSwap();
          });
        }
        for (let turn = 0; !controlled && turn < 10 && !await loot.isVisible() && !await end(page).isVisible(); turn++) {
          const before = await page.evaluate(() => state.turnNumber);
          await selectStrongMove(page);
          await waitForTurn(page, before);
        }
        if (await loot.isVisible()) {
          await loot.getByRole('heading', { name: /Round Cleared/ }).waitFor();
          await snapshot(page, record, 'loot');
          const capturedName = await page.evaluate(() => state.foeParty[0].name);
          const confirm = loot.getByRole('button', { name: 'Confirm Swap' });
          assert.ok(await confirm.isDisabled());
          await loot.locator('#swap-foe-grid .draft-card .mini-sprite').first().tap();
          await loot.locator('#swap-player-grid .draft-card .mini-sprite').first().tap();
          await confirm.tap();
          await battleEngine(page, record, 'round-two');
          assert.match(await page.locator('#battle-log').textContent(), /Gauntlet Round 2 begins!/);
          assert.equal(await page.evaluate(() => state.score), 1);
          assert.equal(await page.evaluate(() => state.pActive.name), capturedName);
          await snapshot(page, record, 'round-two');
          const before = await page.evaluate(() => state.turnNumber);
          await selectStrongMove(page);
          await waitForTurn(page, before);
          // A real opening move can also clear or lose the fresh round.
          if (!(await loot.isVisible()) && !(await end(page).isVisible())) await forfeit(page, /GAUNTLET OVER/);
          if (await end(page).isVisible()) assert.match(await page.locator('#end-desc').textContent(), /1 round/);
          record.detail = `Cleared round one ${controlled ? 'with a controlled win' : 'through live turns'}, swapped in the defeated Pokémon, entered round two, then ended the run.`;
          return;
        }
        if (!(await end(page).isVisible())) await forfeit(page, /GAUNTLET OVER/);
        if (attempt < 3) await end(page).getByRole('button', { name: 'Return to Main Menu' }).tap();
      }
      assert.fail('The first Gauntlet clear must expose the loot screen');
    },
  },
  {
    name: 'online-lobby-leaderboard', profile: phone,
    async play(page, record) {
      await main(page).getByRole('button', { name: /Leaderboard/i }).tap();
      const leaderboard = page.locator('#modal-gauntlet-leaderboard');
      await leaderboard.getByRole('heading', { name: /Gauntlet leaderboard/ }).waitFor();
      await page.locator('#gauntlet-lb-loading').waitFor({ state: 'hidden' });
      const leaderboardError = (await page.locator('#gauntlet-lb-err').textContent()).trim();
      record.leaderboard = leaderboardError || (await page.locator('#gauntlet-lb-scroll').textContent()).trim();
      assert.ok(record.leaderboard);
      if (leaderboardError.includes("reading 'createClient'")) {
        report.findings.push({ scenario: record.name, issue: 'Opening the leaderboard from a fresh page calls the Supabase SDK before it has loaded.' });
      }
      await snapshot(page, record, 'leaderboard');
      await leaderboard.getByRole('button', { name: 'Close' }).tap();

      const configured = await page.evaluate(() => window.__onlinePvpConfigured());
      if (!configured) {
        await modeButton(page, /Online Host/i).tap();
        const alert = page.locator('#modal-game-alert');
        await alert.waitFor();
        assert.match(await alert.textContent(), /Supabase/);
        await snapshot(page, record, 'unavailable');
        await alert.getByRole('button', { name: 'OK' }).tap();
        // Activate the same UI with a loopback-only placeholder config. This never creates a room.
        await page.route(new URL('online-config.js', url).href, route => route.fulfill({
          contentType: 'text/javascript',
          body: 'window.__PBS_SUPABASE_URL = location.origin; window.__PBS_SUPABASE_ANON_KEY = "local-playtest-placeholder-key";',
        }));
        await page.reload({ waitUntil: 'domcontentloaded' });
      }
      await modeButton(page, /Online Host/i).tap();
      const host = page.locator('#modal-online-host');
      await host.getByRole('heading', { name: /Host online battle/ }).waitFor();
      await host.getByLabel('Match format').selectOption('3');
      await host.getByLabel('Turn timers').selectOption('fast');
      await snapshot(page, record, 'host');
      await host.getByRole('button', { name: 'Cancel' }).tap();
      await modeButton(page, /Online Join/i).tap();
      const guest = page.locator('#modal-online-pvp');
      await guest.getByRole('heading', { name: /Join online battle/ }).waitFor();
      await guest.getByRole('button', { name: 'Join', exact: true }).tap();
      assert.match(await page.locator('#online-join-err').textContent(), /valid room code/);
      record.detail = (configured ? 'Configured host and join forms' : 'Host and join forms using a loopback placeholder')
        + '. Room creation, joining live rooms, and online leaderboard submissions were outside this playtest.';
    },
  },
  {
    name: 'collection-help', profile: phone,
    async play(page, record) {
      await openSettings(page);
      await settings(page).getByRole('button', { name: 'VIEW', exact: true }).click();
      const help = page.getByRole('dialog', { name: 'Help Guide' });
      await help.waitFor();
      assert.match(await help.textContent(), /Local PvP/);
      if (/six versus six/.test(await help.textContent())) {
        report.findings.push({ scenario: record.name, issue: 'The help guide describes Local PvP as six versus six. The menu allows six different party sizes.' });
      }
      await snapshot(page, record, 'guide');
      await help.getByRole('button', { name: 'Got it!' }).click();
      await main(page).getByRole('button', { name: /Story Mode/ }).tap();
      await page.locator('#screen-story-menu').getByRole('button', { name: /Collection/ }).tap();
      await page.locator('#collection-body .pdex-grid').waitFor();
      assert.ok(await page.locator('#collection-body .pdex-cell').count() > 0);
      const first = page.getByRole('tab', { name: /Pokédex/ });
      await first.focus();
      await first.press('ArrowRight');
      assert.equal(await page.getByRole('tab', { name: /Achievements/ }).getAttribute('aria-selected'), 'true');
      assert.match(await page.locator('#collection-body').textContent(), /Unlocked/);
      await snapshot(page, record, 'achievements');
      for (const name of ['Hall of Fame', 'Rivalry', 'Signatures', 'Memorial']) {
        const tab = page.getByRole('tab', { name: new RegExp(name) });
        await tab.tap();
        assert.equal(await tab.getAttribute('aria-selected'), 'true');
        assert.ok((await page.locator('#collection-body').textContent()).trim());
      }
      await page.getByRole('tab', { name: /Pokédex/ }).tap();
    },
  },
];

const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
try {
  for (const name of [...(selectedCases || []), ...nativeCases]) {
    assert.ok(cases.some(entry => entry.name === name), `Unknown playtest case: ${name}`);
  }
  for (const { name, profile, serviceWorkers = 'block', play } of cases) {
    if (selectedCases?.length && !selectedCases.includes(name)) continue;
    const record = { name, viewport: profile.viewport, status: 'passed', screens: [], dialogs: [], errors: [], steps: [] };
    report.trace.push(record);
    const context = await browser.newContext({ ...profile, serviceWorkers, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    page.on('pageerror', error => record.errors.push(error.message));
    await page.route('**/*', route =>
      new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
    try {
      await page.goto(url.href, { waitUntil: 'domcontentloaded' });
      await main(page).waitFor();
      const more = page.locator('#menu-more-play-summary');
      if (await more.count() && !['offline-settings', 'collection-help'].includes(name)) await more.click();
      await play(page, record);
      assert.deepEqual(record.errors, []);
    } catch (error) {
      record.status = 'failed';
      record.error = error.message;
      report.status = 'failed';
      report.findings.push({ scenario: name, issue: error.message });
    } finally {
      try {
        Object.assign(record, await capture(page, name + '.png'));
      } catch (error) {
        record.captureError = error.message;
      }
      await context.close();
    }
    console.log(name, record.status, record.detail || record.error || '');
  }
} finally {
  await browser.close();
  await writeFile(join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
}
console.log(join(out, 'report.json'));
if (report.status === 'failed') process.exitCode = 1;
