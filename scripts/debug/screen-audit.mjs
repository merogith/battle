#!/usr/bin/env node
// Visual screen audit. Boots the dev server, launches the real headless Chromium
// at PLAYWRIGHT_BROWSERS_PATH via executablePath (the bundled v1194 build — the
// downloader is blocked in-sandbox but this binary runs fine), arms an active
// post-game run, then visits each Story screen, screenshots it, and reports any
// JS/console errors + broken <img> (failed loads). Use to eyeball the gen3
// backdrops, shop item icons, and the VS splash after asset changes.
//
// Run: node scripts/debug/screen-audit.mjs   →   screenshots/audit/*.png

import { spawn } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const OUT = join(ROOT, 'screenshots', 'audit');
const PORT = Number(process.env.PORT || 5179);
const URL = `http://localhost:${PORT}/battle.html`;
const CHROME = [
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
].find(existsSync);

mkdirSync(OUT, { recursive: true });
if (!CHROME) { console.error('no chromium under /opt/pw-browsers'); process.exit(2); }
const { chromium } = await import('playwright');
const server = spawn(process.execPath, [join(ROOT, 'scripts', 'dev-server.cjs')], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await wait(1200);
process.on('exit', () => { try { server.kill(); } catch {} });

// Arm a generous post-game run so every hub/shop/facility is reachable.
const ARM = `(() => {
  const SM = window.StoryMode; if (!SM || !SM.state) return 'no StoryMode';
  Object.assign(SM.state, {
    active:true, badges:8, gold:60000, eventIndex:0, catchUnlocked:true,
    team:[], atCrucible:true,
    trainerProfile:{ name:'Auditor', sprite:'Red.png' },
    balls:{ poke:20, great:20, ultra:20, master:5 },
    // Suppress one-time tips/intros (deduped via these maps) so screens render clean.
    scenesShown: new Proxy({}, { get: () => true, set: () => true }),
    facilityIntros: new Proxy({}, { get: () => true, set: () => true }),
    inventory: Object.assign({}, SM.state.inventory, {
      potion:10,superPotion:10,hyperPotion:10,maxPotion:10,fullRestore:5,fullHeal:5,
      ether:5,elixir:5,maxElixir:5, hpUp:5,protein:5,iron:5,calcium:5,zinc:5,carbos:5,
    }),
  });
  return 'armed';
})()`;

// label → expression run in-page. Order roughly hub → shops → facilities → encounters → VS.
const SCREENS = [
  ['crucible',       "window.StoryMode.enterCrucible()"],
  ['frontier',       "window.StoryMode.enterFrontierHub()"],
  ['professor',      "window.StoryMode.enterProfessor()"],
  ['shop-mart',      "window.StoryMode.enterShop('mart')"],
  ['shop-dept',      "window.StoryMode.enterShop('dept')"],
  ['stone-shop',     "window.StoryMode.enterStoneShop()"],
  ['artifact-shop',  "window.StoryMode.enterArtifactShop()"],
  ['ev-trainer',     "window.StoryMode.enterEVTrainer()"],
  ['evo-lab',        "window.StoryMode.enterEvolutionLab()"],
  ['tutor-moves',    "window.StoryMode.enterTutor('moves')"],
  ['colress',        "window.StoryMode.enterColress()"],
  ['pokemon-center', "window.StoryMode.enterPokemonCenter()"],
  ['casino',         "window.StoryMode.enterCasino()"],
  ['link',           "window.StoryMode.enterLink()"],
  ['fanclub',        "window.StoryMode.enterFanClub && window.StoryMode.enterFanClub()"],
  ['artifact-hall',  "window.StoryMode.enterArtifactHall && window.StoryMode.enterArtifactHall()"],
  ['safari',         "window.StoryMode.enterSafariZone()"],
  ['catch-wild',     "window.StoryMode.crucibleWildEncounter && window.StoryMode.crucibleWildEncounter()"],
  ['vs-rival',       "window.StoryMode.crucibleRivalFight && window.StoryMode.crucibleRivalFight()"],
  ['vs-mystery',     "window.StoryMode.crucibleMysteryFight && window.StoryMode.crucibleMysteryFight()"],
];

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 430, height: 850 } });
const errors = [];
const netfail = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e));
page.on('console', (m) => { if (m.type() === 'error') errors.push('[console] ' + m.text()); });
page.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith('http://localhost')) netfail.push(r.status() + ' ' + r.url().replace(/^http:\/\/[^/]+\//, '')); });
const results = [];
let n = 0;
const shot = async (label) => { const f = join(OUT, `${String(++n).padStart(2, '0')}-${label}.png`); await page.screenshot({ path: f }); };
try {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await wait(3500); // async data load (species/moves/etc.)
  await shot('menu');
  console.log('arm:', await page.evaluate(ARM));
  await wait(300);
  for (const [label, expr] of SCREENS) {
    const before = errors.length;
    const err = await page.evaluate((e) => { try { (0, eval)(e); return null; } catch (x) { return String(x); } }, expr);
    await wait(label.startsWith('vs') ? 850 : 650); // VS: catch mid-animation, before the intro auto-advances
    await shot(label);
    const broken = await page.evaluate(() => Array.from(document.images).filter((i) => i.complete && i.naturalWidth === 0 && (i.currentSrc || i.src)).map((i) => i.currentSrc || i.src));
    results.push({ label, err, newErrors: errors.length - before, broken });
    console.log(`${label.padEnd(15)} ${err ? 'THREW: ' + err.slice(0, 80) : 'ok'}${broken.length ? '  | BROKEN IMG x' + broken.length : ''}`);
    // bounce back toward the crucible hub between screens where possible
    await page.evaluate(() => { try { window.StoryMode.enterCrucible(); } catch (e) {} });
    await wait(200);
  }
} catch (e) {
  console.error('audit failed:', e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  try { server.kill(); } catch {}
}
const brokenAll = {};
for (const r of results) for (const u of r.broken) brokenAll[u] = (brokenAll[u] || 0) + 1;
console.log('\n=== broken-image summary ===');
console.log(Object.keys(brokenAll).length ? Object.entries(brokenAll).map(([u, c]) => `${c}x  ${u}`).join('\n') : 'none on toured screens');
console.log('\n=== LOCAL 4xx/5xx (real broken assets) ===');
console.log(netfail.length ? [...new Set(netfail)].join('\n') : 'none — all local assets resolved');
console.log(`\n=== page/console errors: ${errors.length} ===`);
if (errors.length) console.log([...new Set(errors)].slice(0, 20).join('\n'));
