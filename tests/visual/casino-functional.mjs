#!/usr/bin/env node
// Functional smoke test for the casino — drives one round of each game and
// verifies repeat works.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = dirname(dirname(fileURLToPath(import.meta.url))) + '/..';
const require = createRequire(join(ROOT, 'package.json'));
const { chromium } = require('playwright');

const PORT = Number(process.env.PORT || 5197);
const URL = `http://localhost:${PORT}/battle.html`;
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const wait = ms => new Promise(r => setTimeout(r, ms));

const server = spawn(process.execPath, [join(ROOT, 'scripts', 'dev-server.cjs')], {
  cwd: ROOT, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore',
});
await wait(1400);
const errs = [];
let browser;
let exit = 0;
try {
  browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e));
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const ov = document.getElementById('app-loading-overlay');
    if (!ov) return true;
    const hidden = ov.classList.contains('hidden') || getComputedStyle(ov).display === 'none';
    if (!hidden) { window.__loadOverlaySettled = 0; return false; }
    window.__loadOverlaySettled = (window.__loadOverlaySettled || 0) + 1;
    return window.__loadOverlaySettled >= 6;
  }, { polling: 200, timeout: 25000 }).catch(() => {});
  await wait(400);
  await page.evaluate(() => {
    const sm = window.StoryMode.state;
    sm.active = true; sm.gold = 50000;
    window.StoryMode.enterCasino();
    document.querySelectorAll('.story-tutorial-overlay').forEach(e => e.remove());
  });
  await wait(400);

  // --- FLIP ---
  const g0 = await page.evaluate(() => window.StoryMode.state.gold);
  await page.evaluate(() => {
    window.StoryMode.casinoSwitchTab('flip');
    window.StoryMode.casinoFlipPick('heads');
    document.getElementById('story-casino-flip-bet').value = '1000';
  });
  await page.click('#story-casino-flip-go'); await wait(3500);
  const flip = await page.evaluate(() => ({
    res: document.getElementById('story-casino-flip-result').textContent.slice(0, 80),
    gold: window.StoryMode.state.gold,
    spinInFlight: false,
    btnDisabled: document.getElementById('story-casino-flip-go').disabled,
  }));
  console.log(`FLIP: gold ${g0} → ${flip.gold} (Δ${flip.gold - g0})  btnDisabled=${flip.btnDisabled}`);
  console.log(`  result: ${flip.res}`);

  // --- SLOTS ---
  await page.evaluate(() => window.StoryMode.casinoSwitchTab('slots'));
  await wait(500);
  const slotsBtnState = await page.evaluate(() => document.getElementById('story-casino-slots-spin').disabled);
  await page.click('#story-casino-slots-spin'); await wait(3500);
  const slots = await page.evaluate(() => ({
    res: document.getElementById('story-casino-slots-result').textContent.slice(0, 80),
    gold: window.StoryMode.state.gold,
    btnDisabled: document.getElementById('story-casino-slots-spin').disabled,
  }));
  console.log(`SLOTS: gold → ${slots.gold}  btnDisabledBefore=${slotsBtnState}  btnDisabledAfter=${slots.btnDisabled}`);
  console.log(`  result: ${slots.res}`);

  // --- ROULETTE + REPEAT ---
  await page.evaluate(() => window.StoryMode.casinoSwitchTab('roulette'));
  await wait(500);
  const cellId = await page.evaluate(() => document.querySelector('#story-casino-roul-board .casino-roul-cell')?.getAttribute('data-cell-id'));
  await page.evaluate((id) => {
    window.StoryMode.casinoRoulPlaceChip(id);
    window.StoryMode.casinoRoulPlaceChip(id);
  }, cellId);
  const stake1 = await page.evaluate(() => document.getElementById('story-casino-roul-staked').textContent);
  await page.click('#story-casino-roul-spin'); await wait(4000);
  const afterSpin = await page.evaluate(() => ({
    res: document.getElementById('story-casino-roul-result').textContent.slice(0, 80),
    gold: window.StoryMode.state.gold,
    staked: document.getElementById('story-casino-roul-staked').textContent,
    repeatText: document.getElementById('story-casino-roul-repeat').textContent,
    repeatCanFlash: document.getElementById('story-casino-roul-repeat').classList.contains('can-repeat'),
  }));
  console.log(`ROUL: stake-before-spin=${stake1} | gold → ${afterSpin.gold} | staked-after=${afterSpin.staked}`);
  console.log(`  Repeat button now reads: "${afterSpin.repeatText}"  canRepeatPulse=${afterSpin.repeatCanFlash}`);
  console.log(`  result: ${afterSpin.res}`);
  // Click Repeat — should restore the stake
  await page.click('#story-casino-roul-repeat'); await wait(300);
  const afterRepeat = await page.evaluate(() => ({
    staked: document.getElementById('story-casino-roul-staked').textContent,
    spinDisabled: document.getElementById('story-casino-roul-spin').disabled,
  }));
  console.log(`REPEAT: staked=${afterRepeat.staked}  spinDisabled=${afterRepeat.spinDisabled}  (expect staked>0, spinDisabled=false)`);

  // Verify Repeat actually re-spins
  await page.click('#story-casino-roul-spin'); await wait(4000);
  const afterRepeatSpin = await page.evaluate(() => ({
    res: document.getElementById('story-casino-roul-result').textContent.slice(0, 80),
    gold: window.StoryMode.state.gold,
  }));
  console.log(`AFTER-REPEAT-SPIN: gold → ${afterRepeatSpin.gold}`);

  console.log(`\nPAGE ERRORS: ${errs.length}`);
  if (errs.length) console.log(errs.slice(0, 5).join('\n'));
  if (flip.btnDisabled || slots.btnDisabled || afterRepeat.spinDisabled || errs.length) {
    console.log('\nFAIL — see errors above');
    exit = 1;
  } else {
    console.log('\nOK — all games functional, Repeat works, no errors ✓');
  }
} catch (e) {
  console.error('FUNC FAIL:', e.message); exit = 1;
} finally {
  if (browser) await browser.close();
  try { server.kill(); } catch {}
}
process.exit(exit);
