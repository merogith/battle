#!/usr/bin/env node
// Screenshots of the tutor/dojo delta UI (role chip · ★ Suitable · Auto-Build panel ·
// EV Trainer recommended spread) at phone / tablet / desktop widths, to check the new
// vertical chrome doesn't crowd small screens. Boots the dev server + pre-installed
// Chromium and drives the real page via window.__storyTest / StoryMode.
//
//   node scripts/debug/tutor-delta-shots.mjs
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const OUT = join(ROOT, 'screenshots', 'tutor-delta');
const PORT = Number(process.env.PORT || 5199);
const URL = `http://localhost:${PORT}/battle.html`;
mkdirSync(OUT, { recursive: true });

const { chromium } = await import('playwright');
const server = spawn(process.execPath, [join(ROOT, 'scripts', 'dev-server.cjs')], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
const waitFor = (ms) => new Promise((r) => setTimeout(r, ms));
await waitFor(1400);
const cleanup = () => { try { server.kill(); } catch {} };
process.on('exit', cleanup);

const VIEWPORTS = [
  { id: 'phone-360', width: 360, height: 640 },
  { id: 'phone-390', width: 390, height: 844 },
  { id: 'tablet-834', width: 834, height: 1112 },
  { id: 'desktop-1280', width: 1280, height: 720 },
];

// Runs in the page: set up a City-7 story mon and open the tutor in `mode`.
async function setup(page, mode) {
  await page.evaluate(async (mode) => {
    const ST = window.__storyTest;
    ST.sm.active = true; ST.sm.runSeed = 1; ST.sm._strngState = null;
    ST.sm.settings = { enabledGens: [1,2,3,4,5,6,7,8,9] };
    ST.sm.badges = 6; ST.sm.gold = 999999; ST.sm.inventory = { mint: 1, heartScale: 2, abilityCapsule: 1 };
    // Suppress first-visit facility intros + stage-up gift scenes so the editor renders directly.
    ST.sm.facilityIntros = { tutor: true, nature: true, evtrainer: true, dojo: true, mart: true, relic: true, bag: true, party: true, center: true };
    ST.sm.facilitiesSeen = Object.assign({}, ST.sm.facilityIntros);
    ST.sm.npcStageSeen = { tutor: 2, dojo: 2, nature: 2 };
    // Mark every STORY_TUTORIAL_SCENES metaKey seen so no first-visit scene overlays the editor.
    ST.sm.scenesShown = ST.sm.scenesShown || {};
    try {
      const scenes = (window.__storyTest && window.__storyTest.STORY_TUTORIAL_SCENES) || null;
      const keys = scenes ? Object.values(scenes).map((s) => s && s.metaKey).filter(Boolean) : [];
      for (const k of keys) ST.sm.scenesShown[k] = true;
    } catch (e) {}
    // Belt-and-braces for the move-tutor + dojo + nature + ev scenes by known metaKey.
    for (const k of ['tutorial-first-move-tutor', 'tutorial-first-battle-dojo', 'tutorial-first-nature-rater', 'tutorial-first-ev-trainer', 'tutorial-hidden-power-mentor']) ST.sm.scenesShown[k] = true;
    let idx = 0;
    for (let ei = 0; ei <= 140; ei++) { let c = -1; try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {} if (c === 7) { idx = ei; break; } }
    ST.sm.eventIndex = idx;
    ST.sm.team = [{ name: 'Garchomp', build: { m: ['Tackle'], n: 'Hardy', a: 'Rough Skin', evs: { hp:0, atk:0, def:0, spa:0, spd:0, spe:0 } } }];
    if (mode === 'ev') { window.StoryMode.enterEVTrainer(); }
    else { await window.StoryMode.enterTutor(mode); }
  }, mode);
  await waitFor(500);
  const teamSel = mode === 'ev' ? '#story-evtrainer-team' : '#story-tutor-team';
  // Click through every intro / tutorial / stage-gift overlay until the editor is reachable.
  for (let i = 0; i < 16; i++) {
    // Ready when a mon toggle is present AND no blocking dialog button is visible.
    const tog = page.locator(`${teamSel} .story-tutor-mon-toggle`).first();
    const cont = page.locator('button:has-text("Continue"), button:has-text("Next"), button:has-text("Got it"), button:has-text("OK"), button:has-text("Close")').first();
    const dialogUp = (await cont.count()) && (await cont.isVisible().catch(() => false));
    if (dialogUp) { await cont.click().catch(() => {}); await waitFor(350); continue; }
    if (await tog.count()) break;
    await waitFor(300);
  }
  // Open the mon editor.
  const tog = page.locator(`${teamSel} .story-tutor-mon-toggle`).first();
  if (await tog.count()) {
    const expanded = await tog.getAttribute('aria-expanded').catch(() => null);
    if (expanded !== 'true') { await tog.click().catch(() => {}); await waitFor(600); }
  }
}

let browser;
try {
  const EXE = process.env.CHROMIUM_EXE || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  browser = await chromium.launch({ executablePath: EXE }).catch(() => chromium.launch());
  const page = await browser.newPage();
  // Expose the test hooks (window.__storyTest) + make the app deterministic/instant.
  // This only gates test exports + animation timing — the tutor layout is unchanged.
  await page.addInitScript(() => { window.__testHarness = true; });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).split('\n')[0]));
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  // wait for game data
  await page.waitForFunction(() => window.__storyTest && window.__storyTest.baseStats && window.__storyTest.baseStats.Garchomp, { timeout: 30000 });

  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    // Moves screen (role chip + Auto-Build bar + Suitable chip)
    await setup(page, 'moves');
    await page.screenshot({ path: join(OUT, `${vp.id}-moves.png`) });
    // Open the Auto-Build panel
    const ab = page.locator('[data-fastbuild-open]').first();
    if (await ab.count()) { await ab.click().catch(() => {}); await waitFor(500); await page.screenshot({ path: join(OUT, `${vp.id}-autobuild.png`) }); }
    // Toggle Suitable filter (close any open Auto-Build panel first for a clean shot)
    await setup(page, 'moves');
    const cancel = page.locator('.tx-fb-cancel').first();
    if (await cancel.count() && await cancel.isVisible().catch(() => false)) { await cancel.click().catch(() => {}); await waitFor(300); }
    const sc = page.locator('[data-filter-kind="suitableOnly"]').first();
    if (await sc.count()) { await sc.click().catch(() => {}); await waitFor(500); await page.screenshot({ path: join(OUT, `${vp.id}-suitable.png`) }); }
    console.log('captured', vp.id);
  }
  console.log(errors.length ? `PAGE ERRORS: ${errors.slice(0, 6).join(' | ')}` : 'no page errors');
} catch (e) {
  console.error('shot run failed:', e.message);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  cleanup();
}
