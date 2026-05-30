#!/usr/bin/env node
// Renders the VS-splash overlay markup (the exact innerHTML showBattleIntro builds)
// with the real .vs-* CSS classes, for 3 tiers, and screenshots each. Isolates the
// *visual* question (does the VS treatment look right?) that the closure-internal
// showBattleIntro can't easily be driven to show in a tour.

import { spawn } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const OUT = join(ROOT, 'screenshots', 'audit');
const PORT = Number(process.env.PORT || 5181);
const URL = `http://localhost:${PORT}/battle.html`;
const CHROME = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell'].find(existsSync);
mkdirSync(OUT, { recursive: true });
const { chromium } = await import('playwright');
const server = spawn(process.execPath, [join(ROOT, 'scripts', 'dev-server.cjs')], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await wait(1200);
process.on('exit', () => { try { server.kill(); } catch {} });

// (label, accent, big?, playerSprite, foeSprite, roleLabel, quote)
const TIERS = [
  ['vs-tier-rival',    '#ff9800', true,  'Red.png',      'Blue.png',     'Rival',      "So it comes to this. Show me what you've built."],
  ['vs-tier-champion', '#ffd700', true,  'Red.png',      'Lance.png',    'Champion',   'The strongest Trainer in the land stands before you.'],
  ['vs-tier-basic',    '#b0bec5', false, 'Red.png',      'Youngster.png','Bug Catcher',"Hey! You wanna battle?"],
];

function overlayHTML(accent, big, player, foe, role, quote) {
  return `
    ${big ? '<div class="vs-flash" aria-hidden="true"></div>' : ''}
    <div class="vs-stage${big ? ' vs-big' : ''}" style="--vs-accent:${accent};">
      <img class="vs-fighter vs-fighter-player" src="sprites/trainers/${player}" onerror="this.style.visibility='hidden'" alt="">
      <div class="vs-glyph" aria-hidden="true">VS</div>
      <img class="vs-fighter vs-fighter-foe" src="sprites/trainers/${foe}" onerror="this.style.display='none'" alt="">
    </div>
    <div style="color:var(--accent);font-size:20px;font-weight:bold;">${role}</div>
    <div class="story-dialog-host story-battle-intro-dialog vs-intro-dialog" style="margin-top:4px;">
      <div class="story-dialog-nameplate">${role}</div>
      <div class="story-dialog-box"><p class="story-dialog-text">"${quote}"</p></div>
    </div>
    <div style="font-size:11px;color:#555;margin-top:8px;">Battle starting…</div>`;
}

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 430, height: 850 } });
try {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await wait(2500);
  let n = 90;
  for (const [label, accent, big, player, foe, role, quote] of TIERS) {
    await page.evaluate(({ html }) => {
      document.querySelectorAll('.__vsprev').forEach((e) => e.remove());
      const o = document.createElement('div');
      o.className = '__vsprev';
      o.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.92);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;';
      o.innerHTML = html;
      document.body.appendChild(o);
    }, { html: overlayHTML(accent, big, player, foe, role, quote) });
    await wait(1200); // let slide-in + glyph pop settle
    await page.screenshot({ path: join(OUT, `${++n}-${label}.png`) });
    console.log('captured', label);
  }
} finally {
  await browser.close();
  try { server.kill(); } catch {}
}
