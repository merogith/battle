import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { chromium } from 'playwright';

const [previousDirectory, candidateDirectory] = process.argv.slice(2).map(dir => resolve(dir));
assert.ok(previousDirectory && candidateDirectory, 'Pass previous and candidate release directories');
const hash = (bytes, length) => createHash('sha1').update(bytes).digest('hex').slice(0, length);
const loadRelease = async directory => ({ directory, manifest: JSON.parse(await readFile(resolve(directory, 'offline-assets.json'))), overrides: new Map() });
const previous = await loadRelease(previousDirectory);
const candidate = await loadRelease(candidateDirectory);
assert.notEqual(previous.manifest.version, candidate.manifest.version, 'Use two successive builds');

// A test-only release adds one small piece of media so the differential path is
// exercised even when the two real releases only differ in their app shell.
const existingClip = candidate.manifest.files.find(file => /^music\/voices\/.+\.mp3$/.test(file.u));
assert.ok(existingClip, 'The release contains voice media');
const clip = await readFile(resolve(candidate.directory, decodeURI(existingClip.u)));
const probe = { u: `music/voices/update-fixture-${existingClip.h}.mp3`, h: existingClip.h, b: clip.byteLength };
const generatedVersion = `battle-v5-${hash(candidate.manifest.version + probe.u, 12)}`;
const worker = (await readFile(resolve(candidate.directory, 'sw.js'), 'utf8')).replace(candidate.manifest.version, generatedVersion);
const updatedFiles = candidate.manifest.files.map(file => file.u === 'sw.js'
    ? { u: file.u, h: hash(worker, 16), b: Buffer.byteLength(worker) }
    : file).concat(probe).sort((first, second) => first.u < second.u ? -1 : first.u > second.u ? 1 : 0);
const fixture = {
    directory: candidate.directory,
    manifest: { ...candidate.manifest, version: generatedVersion, totalBytes: updatedFiles.reduce((size, file) => size + file.b, 0),
        digest: hash(updatedFiles.map(file => `${file.u}:${file.h}`).join('\n'), 16), fileCount: updatedFiles.length, files: updatedFiles },
    overrides: new Map([['sw.js', Buffer.from(worker)], [probe.u, clip]]),
};
fixture.overrides.set('offline-assets.json', Buffer.from(JSON.stringify(fixture.manifest)));

const mime = new Map(Object.entries({ '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json',
    '.webmanifest': 'application/manifest+json', '.css': 'text/css', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4',
    '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.png': 'image/png', '.gif': 'image/gif', '.jpg': 'image/jpeg',
    '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }));
let served = previous;
const requests = new Map();
const server = createServer(async (request, response) => {
    try {
        const url = new URL(request.url, 'http://localhost');
        const relative = decodeURI(url.pathname.slice(1) || 'index.html');
        const entry = served;
        const path = resolve(entry.directory, relative);
        if (!path.startsWith(entry.directory + sep)) { response.writeHead(403).end(); return; }
        const bytes = entry.overrides.get(relative);
        const info = bytes ? null : await stat(path);
        if (info && !info.isFile()) { response.writeHead(404).end(); return; }
        requests.set(relative, (requests.get(relative) || 0) + 1);
        response.writeHead(200, { 'Content-Length': bytes?.byteLength ?? info.size, 'Cache-Control': 'no-store',
            'Content-Type': mime.get(extname(path)) || 'application/octet-stream' });
        if (bytes) response.end(bytes);
        else {
            const stream = createReadStream(path);
            response.on('close', () => stream.destroy());
            stream.on('error', error => response.destroy(error));
            stream.pipe(response);
        }
    } catch { response.writeHead(404).end(); }
});
await new Promise((ready, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', ready);
});
const base = new URL(`http://127.0.0.1:${server.address().port}/battle.html`);
let browser;
try {
    browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
    const context = await browser.newContext({ serviceWorkers: 'allow', viewport: { width: 390, height: 844 },
        hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
    await context.route('**/*', route => new URL(route.request().url()).origin === base.origin ? route.continue() : route.abort());
    const errors = [];
    async function appReady(page) {
        await page.locator('#app-loading-overlay').waitFor({ state: 'hidden' });
        await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 60000 });
    }
    async function load(page) {
        await page.goto(base.href, { waitUntil: 'domcontentloaded' });
        await page.locator('#app-loading-overlay').waitFor({ state: 'hidden' });
        if (await page.evaluate(() => typeof window.prepareOfflineWorker !== 'function')) await appReady(page);
    }
    async function createPage() {
        const page = await context.newPage();
        page.on('pageerror', error => errors.push(error.message));
        await load(page);
        return page;
    }
    async function openPack(page) {
        await page.locator('#menu-offline-entry').click();
        const start = page.locator('#offline-dl-start');
        await page.waitForFunction(() => {
            const button = document.getElementById('offline-dl-start');
            return button && !button.disabled && /^(Download all|Resume download|Check for updates|Update)$/.test(button.textContent.trim());
        }, null, { timeout: 45000 });
        return start;
    }
    async function packReady(page) {
        await page.waitForFunction(() => /^(Ready to play offline\.|Done\.|Download incomplete|Download stalled)/.test(
            document.getElementById('offline-dl-status')?.textContent), null, { timeout: 480000 });
        assert.match(await page.locator('#offline-dl-status').innerText(), /^(Ready to play offline\.|Done\.)/);
    }
    let page = await createPage();
    await (await openPack(page)).click();
    const pause = page.locator('#offline-dl-pause');
    await pause.waitFor({ state: 'visible', timeout: 45000 });
    await pause.click();
    await page.waitForFunction(() => /Download paused/.test(document.getElementById('offline-dl-status')?.textContent));
    await page.close();
    page = await createPage();
    const resume = await openPack(page);
    assert.match(await resume.textContent(), /Resume download/);
    await resume.click();
    await packReady(page);
    console.log(`Installed ${previous.manifest.version} after pause, close and resume.`);

    await context.setOffline(true);
    await load(page);
    await page.locator('.menu-btn-quickplay--story').click();
    await page.locator('.story-menu-btn--new').click();
    await page.locator('#story-create-name').fill('Offline Ace');
    await page.locator('#story-create-begin').click();
    await page.waitForFunction(() => Number.isInteger(JSON.parse(localStorage.getItem('pbs_story_save'))?.runSeed));
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pbs_story_save')));
    assert.ok(Number.isInteger(saved.runSeed));
    await context.setOffline(false);
    await load(page);

    async function applyRelease(next) {
        served = next;
        requests.clear();
        const reload = page.waitForEvent('framenavigated', { predicate: frame => frame === page.mainFrame() && frame.url() === base.href,
            timeout: 60000 });
        await page.evaluate(() => { void navigator.serviceWorker.getRegistration().then(registration => registration.update()); });
        await reload;
        await page.waitForFunction(async version => (await caches.keys()).some(key => key.includes(version) && key.endsWith('-shell')),
            next.manifest.version, { timeout: 60000 });
        // The old worker releases its shell only on activation of the complete new build.
        await page.waitForFunction(async version => (await caches.keys()).filter(key => key.endsWith('-shell')).every(key => key.includes(version)),
            next.manifest.version, { timeout: 60000 });
        await appReady(page);
        const start = await openPack(page);
        if (!/Check for updates/.test(await start.textContent())) await start.click();
        await packReady(page);
        const currentSave = await page.evaluate(() => JSON.parse(localStorage.getItem('pbs_story_save')));
        assert.equal(currentSave.runSeed, saved.runSeed);
        assert.equal(currentSave.eventIndex, saved.eventIndex);
    }

    await applyRelease(candidate);
    const candidateDownloads = Array.from(requests.keys()).filter(path => /^(sprites|music)\//.test(path));
    assert.ok(candidateDownloads.length < 100, `Unexpected bulk media transfer during upgrade: ${candidateDownloads.length} URLs`);
    console.log(`Upgraded to ${candidate.manifest.version} with saved journey intact and ${candidateDownloads.length} media URLs served.`);

    await applyRelease(fixture);
    assert.equal(requests.get(probe.u), 1, 'The fixture update fetches the added clip exactly once');
    const unrelatedClips = Array.from(requests.keys()).filter(path => path.startsWith('music/voices/') && path !== probe.u);
    assert.deepEqual(unrelatedClips, [], 'The fixture update reuses existing clips');

    await context.setOffline(true);
    requests.clear();
    await load(page);
    const cached = await page.evaluate(async path => {
        const buffer = await fetch(path).then(response => response.arrayBuffer());
        const digest = await crypto.subtle.digest('SHA-1', buffer);
        return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('').slice(0, 16);
    }, probe.u);
    assert.equal(cached, probe.h);
    await page.locator('.menu-btn-quickplay--continue').click();
    const city = page.locator('#screen-story-city');
    await city.waitFor({ state: 'visible' });
    assert.equal(await city.locator('#story-hud-trainer-name').innerText(), 'Offline Ace');
    const liveAssets = [...requests.keys()].filter(path => path !== 'sw.js');
    assert.deepEqual(liveAssets, [], 'The installed pack resumed the saved town without fetching any gameplay assets');
    assert.deepEqual(errors, []);
    console.log('The one-file update kept existing media, loaded the new clip by hash, and continued the saved town offline without fetching gameplay assets.');

    if (process.env.BATTLE_TEST_SWITCH_PACK === '1') {
        await context.setOffline(false);
        await load(page);
        await openPack(page);
        const pack = page.getByLabel('Offline pack', { exact: true });
        assert.equal(await pack.inputValue(), 'full', 'Existing full downloads keep their profile');
        await pack.selectOption('compact');
        const change = page.getByRole('button', { name: 'Switch to Compact', exact: true });
        await change.waitFor({ state: 'visible' });
        requests.clear();
        await change.click();
        await packReady(page);
        assert.match(await page.locator('#offline-dl-size').innerText(), /Compact pack installed/);
        const bulk = await page.evaluate(async () => {
            const keys = await (await caches.open('battle-assets')).keys();
            return keys.map(key => new URL(key.url).pathname.slice(1));
        });
        assert.ok(bulk.includes('sprites/compact-frames.bin'));
        assert.equal(bulk.some(key => /^sprites\/gen5ani[^/]*\//.test(key)), false);
        assert.equal(requests.get('sprites/compact-frames.bin'), 1);
        assert.equal([...requests.keys()].some(key => /^sprites\/gen5ani[^/]*\//.test(key)), false);
        await context.setOffline(true);
        await page.goto(new URL('./', base).href, { waitUntil: 'domcontentloaded' });
        await page.getByRole('link', { name: /Continue .*Offline Ace/ }).click();
        await city.waitFor();
        assert.equal(await city.locator('#story-hud-trainer-name').innerText(), 'Offline Ace');
        assert.deepEqual(errors, []);
        console.log('Switched the installed Full pack to Compact with one archive download and continued from the offline title.');
    }
} finally {
    await browser?.close();
    await new Promise(resolveClose => server.close(resolveClose));
}
