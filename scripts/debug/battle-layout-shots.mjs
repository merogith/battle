#!/usr/bin/env node
// Battle-screen layout screenshot harness. Boots the dev server, seeds the
// battle screen with representative placeholder data (no engine needed), and
// captures the responsive layout across the viewport matrix from the
// BATTLE_RESPONSIVE_LAYOUT_AUDIT brief. Purely a visual-QA aid for the
// arena/stack responsive layout — it does not assert anything.
//
//   OUT=/tmp/shots TAG=base node scripts/debug/battle-layout-shots.mjs
//
// Needs a Chromium binary; falls back to the sandbox's bundled build.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PORT = Number(process.env.PORT || 5179);
const OUT = process.env.OUT || '/tmp/shots';
const TAG = process.env.TAG || 'base';
const EXEC = process.env.CHROME_BIN || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
mkdirSync(OUT, { recursive: true });

const server = spawn(process.execPath, [join(ROOT, 'scripts', 'dev-server.cjs')], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
const wait = ms => new Promise(r => setTimeout(r, ms));
process.on('exit', () => { try { server.kill(); } catch {} });
await wait(1400);

const VIEWPORTS = [
  { label: 'desktop-1280', w: 1280, h: 720,  mode: 'desktop' },
  { label: 'desktop-1920', w: 1920, h: 1080, mode: 'desktop' },
  { label: 'phone-portrait', w: 390, h: 844, mode: 'phone' },
  { label: 'phone-landscape', w: 844, h: 390, mode: 'phone' },
  { label: 'ipad-portrait', w: 1024, h: 1366, mode: 'phone' },
  { label: 'ipad-landscape', w: 1366, h: 1024, mode: 'phone' },
];

const SEED = `(() => {
  const $ = id => document.getElementById(id);
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  const sb = $('screen-battle'); sb.classList.remove('hidden');
  try { $('foe-sprite').src = 'sprites/gen5ani/charizard.gif'; } catch(e){}
  try { $('player-sprite').src = 'sprites/gen5ani-back/venusaur.gif'; } catch(e){}
  $('foe-name').textContent = 'Charizard';
  $('player-name').textContent = 'Venusaur';
  $('foe-hp-text').textContent = '153/153';
  $('player-hp-text').textContent = '164/196';
  $('foe-hp-bar').style.width = '100%'; $('foe-hp-bar').className = 'hp-fill hp-high';
  $('player-hp-bar').style.width = '84%'; $('player-hp-bar').className = 'hp-fill hp-high';
  $('foe-types').innerHTML = '<span class="type-badge type-Fire">FIRE</span><span class="type-badge type-Flying">FLYING</span>';
  $('player-types').innerHTML = '<span class="type-badge type-Grass">GRASS</span><span class="type-badge type-Poison">POISON</span>';
  const balls = n => Array.from({length:n}).map((_,i)=>'<span class="party-bar-ball" style="width:11px;height:11px;border-radius:50%;background:'+(i<4?'#6c6':'#a33')+';display:inline-block;border:1px solid #000;"></span>').join('');
  $('foe-party-bar').innerHTML = balls(6);
  $('player-party-bar').innerHTML = balls(6);
  $('field-conditions').innerHTML = '<span class="field-pill" style="background:#3a4a88;color:#fff;">Rain 4</span><span class="field-pill" style="background:#665;color:#fff;">Stealth Rock</span>';
  $('foe-status').innerHTML = '<span class="status-indicator" style="background:#a848a0;color:#fff;">PSN</span>';
  $('command-menu').classList.remove('hidden');
  const ov = $('app-loading-overlay'); if (ov) { ov.classList.add('hidden'); ov.style.display = 'none'; }
  const ph = $('pwa-install-hint'); if (ph) ph.remove();
  $('battle-log').innerHTML = ['Go! Venusaur!','Charizard used Flamethrower!','A critical hit!',"It's super effective!",'Venusaur lost 38 HP.','What will Venusaur do?'].map(l=>'<div class="log-info">'+l+'</div>').join('');
  const sel = $('party-size-select'); if (sel) sel.value = '6';
  try { window.applyDisplayMode && window.applyDisplayMode(); } catch(e){}
  try { window.applyBattleLayoutMode && window.applyBattleLayoutMode(); } catch(e){}
  try { window.applyDesktopGameScale && window.applyDesktopGameScale(); } catch(e){}
  try { window.refreshBattleBg && window.refreshBattleBg(); } catch(e){}
  return sb.getAttribute('data-battle-layout') + ' | is-mobile=' + document.body.classList.contains('is-mobile');
})()`;

const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox', '--disable-gpu'] });
for (const v of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: 1, hasTouch: v.mode === 'phone' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await page.addInitScript(m => {
    try { localStorage.setItem('pbs_settings', JSON.stringify({ displayMode: m })); } catch (e) {}
    try { localStorage.setItem('pwaHintDismissed', '1'); } catch (e) {}
  }, v.mode);
  await page.goto(`http://localhost:${PORT}/battle.html`, { waitUntil: 'domcontentloaded' });
  await wait(2200);
  let info = '';
  try { info = await page.evaluate(SEED); } catch (e) { info = 'SEED ERR ' + e.message; }
  // Wait for the (large) stadium background to actually decode, else the shot can be black.
  try {
    await page.evaluate(async () => {
      const sb = document.getElementById('screen-battle');
      const bi = sb && getComputedStyle(sb).backgroundImage;
      const u = bi && (bi.match(/url\(["']?([^"')]+)["']?\)/) || [])[1];
      if (u) { const img = new Image(); img.src = u; try { await img.decode(); } catch (e) {} }
    });
  } catch (e) {}
  await wait(500);
  await page.screenshot({ path: `${OUT}/${TAG}-${v.label}.png`, fullPage: false });
  console.log(`${v.label.padEnd(16)} -> ${info}${errs.length ? '  [errs:' + errs.slice(0, 2).join(';') + ']' : ''}`);
  await ctx.close();
}
await browser.close();
console.log('done ->', OUT);
