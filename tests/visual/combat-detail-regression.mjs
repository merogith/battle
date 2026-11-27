/* global state, AudioSystem, updateUI */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const url = new URL(process.env.BATTLE_TEST_URL || 'http://127.0.0.1:5173/battle.html');
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });

async function battleAt(viewport) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce', serviceWorkers: 'block' });
  try {
    await context.addInitScript(() => localStorage.setItem('pbs_settings', JSON.stringify({ partySize: 3, animations: false, battleSpeed: 'instant' })));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url.href, { waitUntil: 'domcontentloaded' });
    await page.locator('#menu-more-play-summary').click();
    await page.getByRole('button', { name: 'Quick Battle', exact: true }).click();
    await page.waitForFunction(() => state.playerParty?.length === 3 && state.foeParty?.length === 3 && !state.isLocked);

    await page.evaluate(() => {
      for (const mon of [state.pActive, state.fActive]) {
        mon.ability = '';
        for (const stat of Object.keys(mon.stages)) mon.stages[stat] = 0;
      }
      state.weather = 'Snow';
      state.weatherTurns = 5;
      state.terrain = 'Electric';
      state.terrainTurns = 4;
      state.fActive.stages.atk = 1;
      state.revealedFoe = new Set();
      updateUI();
    });
    const snow = page.getByRole('button', { name: /Snow 5/ });
    await snow.focus();
    await page.keyboard.press('Enter');
    await page.locator('#text-tooltip').getByText(/Ice types gain 50% Defense/).waitFor();
    await page.locator('#text-tooltip').getByRole('button', { name: 'Close' }).click();
    await snow.focus();
    const badge = await page.evaluate(() => {
      const field = document.getElementById('field-conditions');
      const original = document.activeElement;
      const observer = new MutationObserver(() => {});
      observer.observe(field, { childList: true, subtree: true, attributes: true });
      for (let i = 0; i < 25; i++) updateUI();
      const unchangedWrites = observer.takeRecords().length;
      const focusBefore = original === document.activeElement;
      state.weatherTurns--;
      updateUI();
      observer.disconnect();
      return { unchangedWrites, focusBefore, focusAfter: original === document.activeElement, text: original.textContent.trim() };
    });
    assert.deepEqual(badge, { unchangedWrites: 0, focusBefore: true, focusAfter: true, text: '❄ Snow 4' });

    const stage = page.locator('.stage-badge').first();
    assert.equal(await stage.getAttribute('data-direction'), 'up');
    await stage.evaluate(node => { node.dataset.stageTest = 'same-node'; });
    await page.evaluate(() => { state.fActive.stages.atk = -1; updateUI(); });
    assert.equal(await stage.getAttribute('data-stage-test'), 'same-node');
    assert.equal(await stage.getAttribute('data-direction'), 'down');
    assert.equal(await stage.getAttribute('title'), 'Atk-1');
    assert.equal(await stage.evaluate(node => node.style.backgroundColor), 'rgba(244, 67, 54, 0.8)');

    const known = page.locator('#foe-party-bar .party-bar-ball[tabindex="0"]');
    const hidden = page.locator('#foe-party-bar .party-bar-ball[aria-disabled="true"]');
    assert.equal(await hidden.count(), 2);
    await known.click();
    const header = page.locator('#sum-header-name');
    await header.waitFor();
    const knownName = await header.textContent();
    assert.ok(await page.getByRole('button', { name: 'Next Pokémon' }).isDisabled());
    await page.keyboard.press('ArrowDown');
    assert.equal(await header.textContent(), knownName);
    const [activeIndex, hiddenIndex] = await page.evaluate(() => [state.foeParty.indexOf(state.fActive), state.foeParty.findIndex(mon => mon !== state.fActive)]);
    await page.evaluate(index => window.showSummary(index, false), hiddenIndex);
    assert.equal(await header.textContent(), knownName);
    await page.keyboard.press('Escape');
    await page.evaluate(index => { state.revealedFoe.add(state.foeParty[index].name); updateUI(); }, hiddenIndex);
    await page.locator('#foe-party-bar .party-bar-ball').nth(activeIndex).click();
    const next = page.getByRole('button', { name: 'Next Pokémon' });
    assert.ok(await next.isEnabled());
    await next.click();
    assert.notEqual(await header.textContent(), knownName);
    assert.ok(await next.evaluate(node => node === document.activeElement));
    await page.keyboard.press('Escape');

    const guest = await page.evaluate(() => {
      const online = window.OnlineBattle;
      const play = AudioSystem.playUiSfx;
      let cues = 0;
      window.OnlineBattle = { ...online, isActive: () => true, isHost: () => false };
      AudioSystem.playUiSfx = name => { if (name === 'lowHp') cues++; };
      state.mode = 'pvp';
      state.pActive.currentHp = 1;
      state.fActive.currentHp = state.fActive.maxHp;
      updateUI();
      const afterHost = cues;
      state.fActive.currentHp = 1;
      updateUI();
      const afterGuest = cues;
      const slot = state.foeParty.indexOf(state.fActive);
      state.foeParty = structuredClone(state.foeParty);
      state.fActive = state.foeParty[slot];
      updateUI();
      const afterClone = cues;
      state.fActive.currentHp = state.fActive.maxHp;
      updateUI();
      state.fActive.currentHp = 1;
      updateUI();
      const hostBenchMasked = document.querySelectorAll('#foe-party-bar [aria-disabled="true"]').length;
      const ownBenchVisible = document.querySelectorAll('#player-party-bar [aria-disabled="false"]').length;
      AudioSystem.playUiSfx = play;
      window.OnlineBattle = online;
      return { afterHost, afterGuest, afterClone, total: cues, hostBenchMasked, ownBenchVisible };
    });
    assert.deepEqual(guest, { afterHost: 0, afterGuest: 1, afterClone: 1, total: 2, hostBenchMasked: 2, ownBenchVisible: 3 });
    assert.deepEqual(errors, []);
    console.log(`${viewport.width}×${viewport.height}: field detail, stable focus, stage color, masked summary, and guest HP cues passed.`);
  } finally { await context.close(); }
}

async function arenaRecovery() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    const Worker = window.Worker;
    window.Worker = class extends Worker {
      constructor(...args) {
        super(...args);
        if (args[1]?.name === 'arena-showdown') window.fixtureArenaWorker = this;
      }
      postMessage(message) {
        const fault = window.fixtureArenaFault;
        if (message.method !== 'choose' || !fault) return super.postMessage(message);
        window.fixtureArenaFault = '';
        if (fault === 'choice') setTimeout(() => this.dispatchEvent(new MessageEvent('message', { data: { id: message.id, error: 'Choose a legal move.' } })), 0);
        else setTimeout(() => this.dispatchEvent(new Event(fault)), 0);
      }
    };
  });
  await page.goto(new URL('competitive/index.html', url).href, { waitUntil: 'domcontentloaded' });
  const start = page.getByRole('button', { name: 'Start battle', exact: true });
  const lead = page.locator('#switches button:enabled').first();
  await start.click();
  await lead.waitFor();
  await page.evaluate(() => { window.fixtureArenaFault = 'choice'; });
  await lead.click();
  await page.getByText('Choose a legal move.', { exact: true }).waitFor();
  await lead.waitFor();
  for (const fault of ['error', 'messageerror']) {
    await page.evaluate(value => { window.fixtureArenaFault = value; }, fault);
    await lead.click();
    await start.waitFor();
    assert.ok(await start.evaluate(node => node === document.activeElement));
    assert.ok(await lead.isHidden());
    assert.ok(await page.locator('#setup-error').isVisible());
    await start.click();
    await lead.waitFor();
  }
  await page.evaluate(() => window.fixtureArenaWorker.dispatchEvent(new Event('error')));
  await start.waitFor();
  await start.click();
  await lead.click();
  await page.getByRole('heading', { name: 'Choose an action' }).waitFor();
  await page.locator('#moves button:enabled').first().click();
  await page.waitForFunction(() => document.getElementById('turn').textContent === 'Turn 2');
  assert.deepEqual(errors, []);
  await page.close();
  console.log('Arena: invalid choice, worker loss during a choice, message error, idle worker loss, and new match passed.');
}

try {
  for (const viewport of [{ width: 320, height: 568 }, { width: 820, height: 1180 }, { width: 1440, height: 900 }]) await battleAt(viewport);
  await arenaRecovery();
} finally { await browser.close(); }
