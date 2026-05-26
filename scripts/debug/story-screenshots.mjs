#!/usr/bin/env node
// Story-mode screenshot tour. Boots the dev server, drives the early-game UI in
// a real headless Chromium, and saves PNGs of each screen to screenshots/.
//
// Requires the Chromium binary:  npx playwright install chromium
// Run:  node scripts/debug/story-screenshots.mjs   (or: npm run screenshots)
//
// NOTE: written for local/CI use — the sandboxed dev environment blocks the
// Chromium download, so it is not exercised there. Selectors are best-effort by
// visible text; adjust the STEPS list if the UI labels change.

import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const OUT = join(ROOT, 'screenshots');
const PORT = Number(process.env.PORT || 5173);
const URL = `http://localhost:${PORT}/battle.html`;

mkdirSync(OUT, { recursive: true });

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.error('playwright not installed. Run: npm i -D playwright && npx playwright install chromium'); process.exit(2); }

// Boot the dev server.
const server = spawn(process.execPath, [join(ROOT, 'scripts', 'dev-server.cjs')], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
const waitFor = (ms) => new Promise(r => setTimeout(r, ms));
await waitFor(1200);

const cleanup = () => { try { server.kill(); } catch {} };
process.on('exit', cleanup);

let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 430, height: 850 } }); // phone-portrait
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  let n = 0;
  const shot = async (label) => { n++; const f = join(OUT, `${String(n).padStart(2,'0')}-${label}.png`); await page.screenshot({ path: f, fullPage: false }); console.log('captured', f); };
  const clickText = async (text) => {
    const el = page.locator(`button:has-text("${text}"), [role=button]:has-text("${text}")`).first();
    if (await el.count()) { await el.click({ timeout: 3000 }).catch(()=>{}); await waitFor(700); return true; }
    return false;
  };

  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await waitFor(1500);
  await shot('menu');

  // Best-effort early-game tour. Each step is fire-and-forget; missing labels are skipped.
  for (const step of ['Story', 'New Journey', 'New', 'Begin', 'Start']) { if (await clickText(step)) { await shot(step.toLowerCase().replace(/\s+/g,'-')); break; } }
  // Trainer creation → confirm, then the first city.
  for (const step of ['Confirm', 'Start Journey', 'Begin']) { if (await clickText(step)) { await shot('after-' + step.toLowerCase().replace(/\s+/g,'-')); break; } }
  await waitFor(800); await shot('city-0');
  // Professor + the early facilities the #42 work touches.
  for (const step of ['Professor', 'Artifact Hall', 'Move Tutor', 'Nature Rater']) { if (await clickText(step)) { await shot(step.toLowerCase().replace(/\s+/g,'-')); await clickText('Back'); await clickText('Close'); } }

  console.log(errors.length ? `\nPAGE ERRORS (${errors.length}):\n` + errors.slice(0,10).join('\n') : '\nno page errors captured');
} catch (e) {
  console.error('screenshot tour failed:', e.message);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  cleanup();
}
