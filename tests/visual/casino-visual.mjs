#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// Casino visual test — Poké Game Corner (story mode).
//
// Boots battle.html in a real headless Chromium, opens the Game Corner with a
// seeded story run, and screenshots every game tab across a matrix of screen
// sizes (phone → big-screen). Also runs lightweight layout assertions so this
// doubles as a regression test, not just a screenshot dump:
//   • the primary action button is inside the visible viewport (not clipped)
//   • no horizontal overflow on the active panel
//   • no uncaught page errors
//
// Run:   node tests/visual/casino-visual.mjs           (or: npm run screenshots:casino)
//        OUTDIR=/tmp/foo node tests/visual/casino-visual.mjs
//
// Chromium: uses PLAYWRIGHT_BROWSERS_PATH if a binary is present there,
// otherwise the version Playwright manages. In the sandbox the binary is
// pre-installed under /opt/pw-browsers — we auto-discover it.
// ─────────────────────────────────────────────────────────────────────────
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const require = createRequire(join(ROOT, 'package.json'));

const OUT = process.env.OUTDIR || join(__dirname, '__screens__', 'current');
const PORT = Number(process.env.PORT || 5188);
const URL = `http://localhost:${PORT}/battle.html`;
mkdirSync(OUT, { recursive: true });

let chromium;
try { ({ chromium } = require('playwright')); }
catch { console.error('playwright not installed. Run: npm i -D playwright'); process.exit(2); }

// Resolve a usable Chromium binary.
function resolveChrome() {
  try {
    const p = chromium.executablePath();
    if (p && existsSync(p)) return p;
  } catch {}
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  try {
    for (const d of readdirSync(base)) {
      if (!/^chromium-/.test(d)) continue;
      for (const sub of ['chrome-linux/chrome', 'chrome-linux64/chrome']) {
        const cand = join(base, d, sub);
        if (existsSync(cand)) return cand;
      }
    }
  } catch {}
  return undefined; // let Playwright try its default
}
const EXEC = resolveChrome();

// Screen matrix — covers phones, tablets, desktop, and a 4K-ish big screen.
const PROFILES = [
  { name: 'phone-sm',     width: 360,  height: 740,  mobile: true  },
  { name: 'phone',        width: 390,  height: 844,  mobile: true  },
  { name: 'ipad-port',    width: 834,  height: 1112, mobile: true  },
  { name: 'ipad-land',    width: 1180, height: 820,  mobile: true  },
  { name: 'desktop',      width: 1280, height: 800,  mobile: false },
  { name: 'big',          width: 1920, height: 1080, mobile: false },
];
const TABS = ['flip', 'slots', 'roulette'];
const ACTION_BTN = {
  flip:     '#story-casino-flip-go',
  slots:    '#story-casino-slots-spin',
  roulette: '#story-casino-roul-spin',
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const server = spawn(process.execPath, [join(ROOT, 'scripts', 'dev-server.cjs')], {
  cwd: ROOT, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore',
});
await wait(1300);
const cleanup = () => { try { server.kill(); } catch {} };
process.on('exit', cleanup);

const failures = [];
const pageErrors = [];
let browser;
try {
  browser = await chromium.launch({ executablePath: EXEC });
  for (const p of PROFILES) {
    const ctx = await browser.newContext({
      viewport: { width: p.width, height: p.height },
      hasTouch: p.mobile, isMobile: p.mobile, deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => pageErrors.push(`[${p.name}] ${e}`));
    page.on('console', (m) => {
      if (m.type() !== 'error') return;
      const t = m.text();
      // Ignore environmental asset-load noise (dev server self-signed cert / 404s).
      if (/ERR_CERT|Failed to load resource|net::ERR|favicon/i.test(t)) return;
      pageErrors.push(`[${p.name}] console: ${t}`);
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    // The overlay is hidden initially, then async data loading shows it
    // mid-flight, then hides it again. Wait for a SUSTAINED hidden state
    // (~1.2s of continuous hidden) so we don't catch the pre-load window.
    await page.waitForFunction(() => {
      const ov = document.getElementById('app-loading-overlay');
      if (!ov) return true;
      const hidden = ov.classList.contains('hidden') || getComputedStyle(ov).display === 'none';
      if (!hidden) { window.__loadOverlaySettled = 0; return false; }
      window.__loadOverlaySettled = (window.__loadOverlaySettled || 0) + 1;
      return window.__loadOverlaySettled >= 6;   // ~1.2s at 200ms polling
    }, { polling: 200, timeout: 25000 }).catch(() => {});
    await wait(300);

    // Match the production mobile/desktop branch for this profile.
    await page.evaluate((mobile) => document.body.classList.toggle('is-mobile', !!mobile), p.mobile);

    // Seed a story run with gold + lifetime stats, then open the Game Corner.
    const opened = await page.evaluate(() => {
      try {
        const SM = window.StoryMode;
        if (!SM || !SM.state) return 'no StoryMode.state';
        const sm = SM.state;
        sm.active = true;
        sm.gold = 48650;
        sm.casinoStats = {
          flip:  { wins: 42, losses: 55, won: 9200,  lost: 7100, biggestWin: 2000, longestStreak: 5 },
          slots: { wins: 18, losses: 73, won: 14400, lost: 9100, biggestWin: 6000, freeRespins: 6 },
          roul:  { wins: 9,  losses: 38, won: 8800,  lost: 6300, biggestWin: 5400 },
          totals:{ won: 32400, lost: 22500, prizes: 14 },
        };
        SM.enterCasino();
        return 'ok';
      } catch (e) { return 'err: ' + e.message; }
    });
    if (opened !== 'ok') failures.push(`[${p.name}] enterCasino → ${opened}`);
    // Drop any tutorial overlay that may have popped on first visit.
    await page.evaluate(() => document.querySelectorAll('.story-tutorial-overlay').forEach((e) => e.remove()));
    await wait(300);

    for (const tab of TABS) {
      await page.evaluate((t) => { try { window.StoryMode.casinoSwitchTab(t); } catch {} }, tab);
      await wait(500);
      const file = join(OUT, `${p.name}-${tab}.png`);
      await page.screenshot({ path: file, fullPage: false });

      // ── Layout assertions ──
      // Phones (< 768px) may scroll the panel to reach the action button, so we
      // only require it to be horizontally un-clipped and reachable. Tablets and
      // desktop must show it without any vertical scroll — that's the whole point
      // of the two-column table redesign.
      const sel = ACTION_BTN[tab];
      const requireInView = p.width >= 768;
      const check = await page.evaluate(({ sel, vw, vh }) => {
        const out = {};
        const btn = document.querySelector(sel);
        if (btn) {
          const r = btn.getBoundingClientRect();
          out.exists = r.width > 0 && r.height > 0;
          out.inView = r.top >= -1 && r.left >= -1 && r.bottom <= vh + 1 && r.right <= vw + 1;
          out.hClipped = r.left < -1 || r.right > vw + 1;
          out.rect = { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right) };
        } else out.exists = false;
        const panel = document.querySelector('.casino-panel:not(.hidden)');
        if (panel) out.hOverflow = panel.scrollWidth - panel.clientWidth;
        return out;
      }, { sel, vw: p.width, vh: p.height });

      if (!check.exists) {
        failures.push(`[${p.name}/${tab}] action button missing/zero-size`);
      } else if (check.hClipped) {
        failures.push(`[${p.name}/${tab}] action button clipped horizontally: ${JSON.stringify(check.rect)} (vw ${p.width})`);
      } else if (requireInView && !check.inView) {
        failures.push(`[${p.name}/${tab}] action button needs scroll on wide screen: ${JSON.stringify(check.rect)} (viewport ${p.width}x${p.height})`);
      }
      if (check.hOverflow > 2) {
        failures.push(`[${p.name}/${tab}] horizontal overflow on panel: ${check.hOverflow}px`);
      }
      console.log(`captured ${p.name}-${tab}  inView=${check.inView} hClip=${check.hClipped} hOverflow=${check.hOverflow ?? '-'}`);
    }

    // Stats board open (flip tab).
    await page.evaluate(() => { try { window.StoryMode.casinoSwitchTab('flip'); window.StoryMode.casinoToggleStats(); } catch {} });
    await wait(350);
    await page.screenshot({ path: join(OUT, `${p.name}-stats.png`), fullPage: false });
    console.log(`captured ${p.name}-stats`);

    // Prize-celebration card preview — inject a banner DOM that mirrors what
    // the casino emits on a jackpot, so we can verify the celebration visually.
    await page.evaluate(() => {
      try { window.StoryMode.casinoToggleStats(); } catch {}      // close stats
      const host = document.getElementById('story-casino-prize-host');
      if (!host) return;
      // Clear any prior banner.
      host.querySelectorAll('.casino-prize-banner').forEach((e) => e.remove());
      const banner = document.createElement('div');
      banner.className = 'casino-prize-banner tier-jackpot';
      banner.style.animation = 'none';   // freeze for screenshot
      banner.innerHTML = `
        <div class="casino-prize-backdrop" aria-hidden="true"></div>
        <div class="casino-prize-card" style="animation:none;">
          <span class="sparkle"></span><span class="sparkle"></span>
          <span class="sparkle"></span><span class="sparkle"></span>
          <div class="casino-prize-banner-title">&#10022; JACKPOT! &#10022;</div>
          <div class="casino-prize-banner-items">
            <div class="casino-prize-item">
              <img src="sprites/pokesprite/items/rare-candy.png" alt="" width="40" height="40">
              <span class="casino-prize-item-label">Rare Candy</span>
              <span class="casino-prize-item-count">&times;1</span>
            </div>
            <div class="casino-prize-item">
              <img src="sprites/pokesprite/items/protein.png" alt="" width="40" height="40">
              <span class="casino-prize-item-label">Protein</span>
              <span class="casino-prize-item-count">&times;2</span>
            </div>
            <div class="casino-prize-item">
              <img src="sprites/pokesprite/items/ability-capsule.png" alt="" width="40" height="40">
              <span class="casino-prize-item-label">Ability Capsule</span>
              <span class="casino-prize-item-count">&times;1</span>
            </div>
          </div>
          <p class="casino-prize-tap-hint">Tap anywhere to dismiss</p>
        </div>`;
      host.appendChild(banner);
    });
    await wait(450);
    await page.screenshot({ path: join(OUT, `${p.name}-prize.png`), fullPage: false });
    console.log(`captured ${p.name}-prize`);

    await ctx.close();
  }
} catch (e) {
  console.error('visual run failed:', e.message);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  cleanup();
}

console.log('\n──────── RESULT ────────');
console.log(`screenshots → ${OUT}`);
if (pageErrors.length) {
  console.log(`\nPAGE ERRORS (${pageErrors.length}):`);
  console.log(pageErrors.slice(0, 15).join('\n'));
}
if (failures.length) {
  console.log(`\nLAYOUT FAILURES (${failures.length}):`);
  console.log(failures.join('\n'));
  process.exitCode = 1;
} else if (!pageErrors.length) {
  console.log('all layout assertions passed, no page errors ✓');
}
