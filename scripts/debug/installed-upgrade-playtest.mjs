import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, readFileSync, statSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../../', import.meta.url));
const { values } = parseArgs({ options: {
  baseline: { type: 'string' },
  'baseline-dist': { type: 'string' },
  'download-timeout-ms': { type: 'string', default: '360000' },
  dist: { type: 'string', default: 'dist' },
  out: { type: 'string', default: 'agent-state/playthrough/implementation-installed-upgrade' },
  rollback: { type: 'boolean' },
} });
assert.ok(!(values.baseline && values['baseline-dist']), 'Use either --baseline or --baseline-dist');
const baselineRef = values.baseline || '540e6cd9981dc6ca0ed1f2ad8e57c780b1a2689e';
const baselineDist = values['baseline-dist'] && resolve(root, values['baseline-dist']);
const downloadTimeout = Number(values['download-timeout-ms']);
assert.ok(Number.isSafeInteger(downloadTimeout) && downloadTimeout > 0, 'Use a positive download timeout in milliseconds');
const dist = resolve(root, values.dist);
const out = resolve(root, values.out);
await mkdir(out, { recursive: true });

function baselineFile(name) {
  return execFileSync('git', ['show', baselineRef + ':' + name], {
    cwd: root, maxBuffer: 100 * 1024 * 1024,
  });
}
const baselineManifest = baselineDist
  ? readFileSync(resolve(baselineDist, 'offline-assets.json'))
  : baselineFile('offline-assets.json');
const older = JSON.parse(baselineManifest);
const newer = JSON.parse(readFileSync(resolve(dist, 'offline-assets.json')));
assert.notEqual(older.version, newer.version, 'The installed releases must differ');
const previous = new Map(older.files.map(file => [decodeURI(file.u), file]));
const current = new Map(newer.files.map(file => [decodeURI(file.u), file]));
const candidateBattle = current.get('battle.html');
assert.ok(candidateBattle, 'Candidate manifest lists the battle page');
if (values.rollback) assert.ok(previous.get('battle.html'), 'Baseline manifest lists the rollback battle page');
const oldFiles = new Map([['offline-assets.json', baselineManifest]]);
if (!baselineDist) {
  for (const [name, file] of previous) {
    if (current.get(name)?.h !== file.h) oldFiles.set(name, baselineFile(name));
  }
}

const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.gif': 'image/gif',
  '.webp': 'image/webp', '.wav': 'audio/wav', '.mp3': 'audio/mpeg',
};
let isBaseline = true;
let phase = 'baseline-install';
const transfers = [];
const offlineNetworkAttempts = [];
const server = createServer((request, response) => {
  const name = decodeURI(new URL(request.url, 'http://localhost').pathname.slice(1)) || 'index.html';
  if (phase === 'offline-continue' || phase === 'offline-rollback') {
    // Chromium may still check for service worker updates outside the emulated
    // page connection. Drop every connection here to simulate a real outage.
    offlineNetworkAttempts.push(name);
    request.socket.destroy();
    return;
  }
  const buffer = isBaseline && !baselineDist ? oldFiles.get(name) : undefined;
  const packageDir = (isBaseline && baselineDist) || dist;
  const path = resolve(packageDir, name);
  if (!path.startsWith(packageDir + sep)) { response.writeHead(400).end(); return; }
  let size;
  try {
    if (!buffer && isBaseline && !baselineDist && !previous.has(name)) throw new Error('Missing historical asset');
    size = buffer?.byteLength ?? statSync(path).size;
  } catch {
    response.writeHead(404).end();
    return;
  }
  const entry = { phase, path: name, bytes: size };
  response.once('finish', () => transfers.push(entry));
  response.writeHead(200, {
    'Content-Type': types[extname(name)] || 'application/octet-stream',
    'Content-Length': size,
    'Cache-Control': 'no-store',
  });
  if (buffer) response.end(buffer);
  else {
    const stream = createReadStream(path);
    response.on('close', () => stream.destroy());
    stream.on('error', () => response.destroy());
    stream.pipe(response);
  }
});
await new Promise((resolveListen, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolveListen));
const origin = 'http://127.0.0.1:' + server.address().port;
const report = {
  status: 'started', baseline: older.version, candidate: newer.version,
  baselineSource: baselineDist ? 'packaged artifact' : 'git tree', snapshots: [], errors: [],
};

async function snapshot(page, name) {
  await page.screenshot({ path: resolve(out, name + '.png'), timeout: 10000 });
  report.snapshots.push(name + '.png');
}

async function install(page, version, { replaces } = {}) {
  const deadline = Date.now() + 45000;
  // Playwright's waitForFunction considers an async predicate's Promise truthy.
  // Await the boolean explicitly before deciding whether the worker took control.
  while (Date.now() < deadline) {
    try {
      const installed = await page.evaluate(async ({ version, replaces }) => {
        const { serviceWorker } = navigator;
        const names = await caches.keys();
        if (!names.includes(version + '-shell') || (replaces && names.includes(replaces + '-shell'))) return false;
        const registration = await serviceWorker.getRegistration();
        const active = registration?.active;
        return active?.state === 'activated' && serviceWorker.controller === active;
      }, { version, replaces });
      if (installed) return;
    } catch (error) {
      // The game may reload by itself when the new worker takes control.
      if (!/Execution context was destroyed|Cannot find context/i.test(error.message)) throw error;
    }
    await delay(150);
  }
  assert.fail(`Service worker ${version} did not take control`);
}

async function confirmPackageDocument(page, { file, version, replaces, navigations }) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await page.reload({ waitUntil: 'domcontentloaded' });
    const bytes = await response.body();
    const hash = createHash('sha1').update(bytes).digest('hex').slice(0, 16);
    const controlled = response.fromServiceWorker();
    navigations.push({ hash, controlled });
    if (controlled && hash === file.h) return hash;
    // A navigation can race the worker claim. Inspect the served document again
    // after the new controller has had time to take over.
    await page.waitForTimeout(600);
    await install(page, version, { replaces });
  }
  assert.fail(`The activated worker did not serve the verified ${version} battle page`);
}

async function downloaded(page) {
  const storage = await page.evaluate(async () => {
    const cache = await caches.open('battle-assets');
    const files = (await cache.match('__OFFLINE_MANIFEST__'));
    const metadata = files ? await files.json() : null;
    const settings = JSON.parse(localStorage.getItem('pbs_settings'));
    return { files: metadata?.files.length || 0, cached: (await cache.keys()).length, settings: settings.offlineDownload };
  });
  assert.equal(storage.settings.completed, true);
  assert.ok(storage.cached >= storage.files);
  return storage;
}

async function download(page) {
  await page.locator('#menu-offline-entry').click();
  const button = page.locator('#offline-dl-start');
  await page.waitForFunction(() => {
    const text = document.getElementById('offline-dl-size')?.textContent || '';
    const action = document.getElementById('offline-dl-start');
    return /\bfiles?\b|Up to date|full offline pack|available without internet/.test(text) &&
      action && !action.disabled && action.textContent !== 'Check again';
  }, null, { timeout: 25000 });
  const plan = (await page.locator('#offline-dl-size').innerText()).trim();
  console.log('Offline pack plan:', plan);
  if (!/^(Ready to play offline|Done)/.test(await page.locator('#offline-dl-status').innerText())) {
    await button.click();
  }
  await page.waitForFunction(() => /^(Done|Ready to play offline|Download incomplete|Download stalled)/.test(
    document.getElementById('offline-dl-status')?.textContent || ''
  ), null, { polling: 250, timeout: downloadTimeout });
  const result = (await page.locator('#offline-dl-status').innerText()).trim();
  assert.match(result, /^(Done|Ready to play offline)/);
  assert.doesNotMatch(result, /[1-9]\d* failed/);
  await page.getByRole('button', { name: 'Close settings' }).click();
  return { plan, result };
}

function save(page) {
  return page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('pbs_story_save') || 'null');
    if (!data) return null;
    return {
      active: data.active, name: data.trainerProfile?.name, seed: data.seed ?? data.runSeed,
      team: (data.team || []).map(mon => mon.name),
      badges: data.badges || 0, eventIndex: data.eventIndex,
    };
  });
}

async function startStory(page) {
  await page.locator('.menu-btn-quickplay--story').click();
  await page.locator('.story-menu-btn--new').click();
  await page.locator('#story-create-name').fill('Upgrade Run');
  await page.locator('#story-create-begin').click();
  const steps = [
    '#modal-game-alert:visible button:last-of-type',
    '.story-tutorial-overlay:visible .story-tutorial-continue',
    '.story-narr-root:visible [data-narr-continue]',
    '[data-scene-cont]:visible',
    '#prof-accept-btn:enabled:visible',
    '#story-prof-rolled-card .prof-pick-card .mini-sprite:visible',
    '#story-prof-buttons button:visible',
    '#story-city-tips .story-city-objective:enabled:visible',
    '#screen-story-city button[onclick*="Professor"]:visible',
  ];
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    const progress = await save(page);
    if (progress?.active && progress.team.length) return progress;
    const begin = page.getByRole('button', { name: /^Begin →$/ });
    if (await begin.isVisible()) {
      await begin.click();
      continue;
    }
    let acted = false;
    for (const selector of steps) {
      const button = page.locator(selector).first();
      if (!await button.isVisible()) continue;
      try {
        await button.click({ timeout: 2000 });
        acted = true;
        break;
      } catch (error) {
        if (error.name !== 'TimeoutError') throw error;
      }
    }
    if (!acted) await page.waitForTimeout(100);
  }
  await snapshot(page, 'baseline-story-blocked');
  throw new Error('Could not start a story and choose a starter using earlier-release controls');
}

function summarize(name) {
  const requests = transfers.filter(entry => entry.phase === name);
  return { requests: requests.length, bytes: requests.reduce((n, entry) => n + entry.bytes, 0) };
}

let browser;
let page;
try {
  browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
  const context = await browser.newContext({ viewport: { width: 430, height: 880 },
    hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  await context.route('**/*', route =>
    new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('pbs_settings')) {
      localStorage.setItem('pbs_settings', JSON.stringify({ musicEnabled: false, soundEnabled: false, storyTypewriter: false }));
    }
  });
  page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  await page.goto(origin + '/battle.html', { waitUntil: 'domcontentloaded' });
  await install(page, older.version);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#app-loading-overlay').waitFor({ state: 'hidden' });

  phase = 'baseline-download';
  console.log('Downloading earlier release', older.version, older.fileCount, older.totalBytes);
  report.originalDownload = await download(page);
  report.originalStorage = await downloaded(page);
  assert.equal(report.originalStorage.settings.digest, older.digest);
  assert.ok(report.originalStorage.files > 0 && report.originalStorage.files <= older.fileCount);
  await snapshot(page, 'baseline-installed');

  phase = 'baseline-story';
  report.saveBeforeUpgrade = await startStory(page);
  assert.equal(report.saveBeforeUpgrade.name, 'Upgrade Run');
  assert.ok(Number.isInteger(report.saveBeforeUpgrade.seed), 'The baseline run has its own seed');
  await snapshot(page, 'baseline-campaign-saved');

  phase = 'candidate-activate';
  isBaseline = false;
  // An installed release waits for the new worker to verify its shell before taking control.
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    registration.update().catch(console.warn);
  });
  await install(page, newer.version, { replaces: older.version });
  report.candidateNavigations = [];
  report.activatedBattleHash = await confirmPackageDocument(page, {
    file: candidateBattle, version: newer.version, replaces: older.version, navigations: report.candidateNavigations,
  });
  await page.locator('#app-loading-overlay').waitFor({ state: 'hidden' });
  report.saveAfterActivation = await save(page);
  assert.deepEqual(report.saveAfterActivation, report.saveBeforeUpgrade);
  await snapshot(page, 'updated-home');

  phase = 'candidate-download';
  console.log('Updating installed media', newer.version);
  report.deltaDownload = await download(page);
  report.updatedStorage = await downloaded(page);
  assert.equal(report.updatedStorage.settings.digest, newer.digest);
  report.unchangedOptionalTransfers = transfers.filter(entry => entry.phase === phase &&
    current.has(entry.path) && previous.get(entry.path)?.h === current.get(entry.path)?.h).map(entry => entry.path);
  assert.deepEqual(report.unchangedOptionalTransfers, []);
  await snapshot(page, 'updated-pack');

  phase = 'offline-continue';
  await context.setOffline(true);
  const offline = await page.reload({ waitUntil: 'domcontentloaded' });
  assert.equal(offline.fromServiceWorker(), true);
  await page.locator('.menu-btn-quickplay--continue').click();
  await page.locator('#screen-story-city').waitFor({ state: 'visible' });
  report.saveAfterContinue = await save(page);
  assert.deepEqual(report.saveAfterContinue, report.saveBeforeUpgrade);
  assert.deepEqual(report.errors, []);
  await snapshot(page, 'updated-campaign-offline');
  assert.equal(summarize('offline-continue').bytes, 0);
  if (values.rollback) {
    phase = 'rollback-activate';
    isBaseline = true;
    await context.setOffline(false);
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      registration.update().catch(console.warn);
    });
    await install(page, older.version, { replaces: newer.version });
    report.rollbackNavigations = [];
    report.rollbackBattleHash = await confirmPackageDocument(page, {
      file: previous.get('battle.html'), version: older.version, replaces: newer.version, navigations: report.rollbackNavigations,
    });
    assert.deepEqual(await save(page), report.saveBeforeUpgrade);
    await snapshot(page, 'rollback-home');
    phase = 'offline-rollback';
    await context.setOffline(true);
    const restored = await page.reload({ waitUntil: 'domcontentloaded' });
    assert.equal(restored.fromServiceWorker(), true);
    await page.locator('.menu-btn-quickplay--continue').click();
    await page.locator('#screen-story-city').waitFor({ state: 'visible' });
    report.saveAfterRollback = await save(page);
    assert.deepEqual(report.saveAfterRollback, report.saveBeforeUpgrade);
    assert.equal(summarize('offline-rollback').bytes, 0);
    assert.deepEqual(report.errors, []);
    await snapshot(page, 'rollback-campaign-offline');
  }
  report.status = 'passed';
} catch (error) {
  report.status = 'failed';
  report.failure = error.stack;
  report.failedPhase = phase;
  if (page) {
    report.offlinePanelAtFailure = await page.locator('#offline-dl-panel').innerText({ timeout: 1000 }).catch(() => null);
    await snapshot(page, `failed-${phase}`).catch(() => {});
  }
  throw error;
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise(resolveClose => server.close(resolveClose));
  report.transfers = Object.fromEntries(
    ['baseline-install', 'baseline-download', 'baseline-story', 'candidate-activate', 'candidate-download', 'offline-continue',
      ...(values.rollback ? ['rollback-activate', 'offline-rollback'] : [])]
      .map(name => [name, summarize(name)])
  );
  report.candidateRequests = transfers.filter(entry => entry.phase.startsWith('candidate'));
  const media = transfers.filter(entry => entry.phase === 'candidate-download' && entry.path !== 'sw.js');
  report.mediaDelta = { requests: media.length, bytes: media.reduce((n, entry) => n + entry.bytes, 0) };
  report.offlineNetworkAttempts = offlineNetworkAttempts;
  await writeFile(resolve(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(report.status, JSON.stringify(report.transfers));
}
