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

// Each test release adds one small clip so both entry points exercise differential downloads.
const existingClip = candidate.manifest.files.find(file => /^music\/voices\/.+\.mp3$/.test(file.u));
assert.ok(existingClip, 'The release contains voice media');
const clip = await readFile(resolve(candidate.directory, decodeURI(existingClip.u)));
const candidateWorker = await readFile(resolve(candidate.directory, 'sw.js'), 'utf8');
async function addClip(release, name, shellDocument) {
    const probe = { u: `music/voices/update-fixture-${name}-${existingClip.h}.mp3`, h: existingClip.h, b: clip.byteLength };
    const version = `battle-v5-${hash(release.manifest.version + probe.u, 12)}`;
    const worker = Buffer.from(candidateWorker.replace(candidate.manifest.version, version));
    const html = await readFile(resolve(release.directory, shellDocument), 'utf8');
    assert.ok(html.includes('</head>'));
    const document = Buffer.from(html.replace('</head>', `<meta name="offline-test-release" content="${version}">\n</head>`));
    const changed = new Map([['sw.js', worker], [shellDocument, document]]);
    const files = release.manifest.files.map(file => {
        const bytes = changed.get(file.u);
        return bytes ? { u: file.u, h: hash(bytes, 16), b: bytes.byteLength } : file;
    })
        .concat(probe).sort((first, second) => first.u < second.u ? -1 : first.u > second.u ? 1 : 0);
    const manifest = { ...release.manifest, version, totalBytes: files.reduce((size, file) => size + file.b, 0),
        digest: hash(files.map(file => `${file.u}:${file.h}`).join('\n'), 16), fileCount: files.length, files };
    const overrides = new Map(release.overrides);
    for (const [file, bytes] of changed) overrides.set(file, bytes);
    overrides.set(probe.u, clip);
    overrides.set('offline-assets.json', Buffer.from(JSON.stringify(manifest)));
    return { directory: release.directory, manifest, overrides, probe };
}
const settingsRelease = await addClip(candidate, 'settings', 'battle.html');
const titleRelease = await addClip(settingsRelease, 'title', 'index.html');

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
const title = new URL('./', base);
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
    async function packAction(page) {
        const start = page.locator('#offline-dl-start');
        await start.waitFor({ state: 'visible' });
        await page.waitForFunction(() => {
            const button = document.getElementById('offline-dl-start');
            return button && !button.disabled && /^(Download all|Resume download|Check for updates|Update)$/.test(button.textContent.trim());
        }, null, { timeout: 45000 });
        return start;
    }
    async function openPack(page) {
        await page.locator('#menu-offline-entry').click();
        return packAction(page);
    }
    async function packReady(page) {
        await page.waitForFunction(() => /^(Ready to play offline\.|Done\.|Download incomplete|Download stalled)/.test(
            document.getElementById('offline-dl-status')?.textContent), null, { timeout: 480000 });
        assert.match(await page.locator('#offline-dl-status').innerText(), /^(Ready to play offline\.|Done\.)/);
    }
    let page = await createPage();
    const download = await openPack(page);
    if (process.env.BATTLE_TEST_SWITCH_PACK === '1') {
        await page.getByLabel('Offline pack', { exact: true }).selectOption('full');
        await packAction(page);
    }
    await download.click();
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
    await page.close();
    let pendingRelease;

    async function assertSaved() {
        const currentSave = await page.evaluate(() => JSON.parse(localStorage.getItem('pbs_story_save')));
        assert.equal(currentSave.runSeed, saved.runSeed);
        assert.equal(currentSave.eventIndex, saved.eventIndex);
        assert.equal(currentSave.badges, saved.badges);
        assert.deepEqual(currentSave.trainerProfile, saved.trainerProfile);
        assert.deepEqual(currentSave.team, saved.team);
    }
    async function waitForRelease(next) {
        // The old shell is removed only when the complete new build activates.
        await page.waitForFunction(async version => {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration?.active?.state !== 'activated' || registration.active !== navigator.serviceWorker.controller ||
                registration.installing || registration.waiting) return false;
            const shells = (await caches.keys()).filter(key => key.endsWith('-shell'));
            return shells.length === 1 && shells[0] === `${version}-shell`;
        }, next.manifest.version, { timeout: 60000 });
    }
    async function checkFromOpenPage(next, path, button) {
        const releaseMarker = page.locator('meta[name="offline-test-release"]');
        assert.equal(await releaseMarker.count(), 0, 'The existing document is still open');
        pendingRelease = next;
        // Expose the staged server files when the visible button calls the real
        // update helper. A navigation-triggered check cannot discover them early.
        await page.evaluate(() => {
            const check = window.checkForGameUpdate;
            if (typeof check !== 'function') throw new Error('The update helper is missing from the active page.');
            window.checkForGameUpdate = async (...args) => {
                window.checkForGameUpdate = check;
                await window.__publishOfflineTestRelease();
                return check(...args);
            };
        });
        try {
            await Promise.all([
                page.waitForEvent('framenavigated', { predicate: frame => frame === page.mainFrame() && new URL(frame.url()).pathname === path,
                    timeout: 60000 }),
                button.click(),
            ]);
        } catch (error) {
            const status = await page.locator('#offline-dl-status, #title-update-status').allTextContents();
            throw new Error(`Checking from ${path} did not load ${next.manifest.version}. Status: ${status.join(' ')}. Worker requests: ${requests.get('sw.js') || 0}.`, { cause: error });
        }
        await waitForRelease(next);
        assert.equal(pendingRelease, null, 'The visible button initiated the update check');
        assert.equal(await releaseMarker.getAttribute('content'), next.manifest.version);
        assert.ok(requests.get('sw.js') >= 1, 'The UI explicitly checked the live release');
        await assertSaved();
    }
    async function updateOneClip(next, start) {
        assert.equal(await start.textContent(), 'Update');
        assert.match(await page.locator('#offline-dl-size').innerText(), /\b1 changed file\b/);
        assert.equal(requests.get(next.probe.u), undefined, 'Checking for an update leaves the media opt-in');
        requests.clear();
        await start.click();
        await packReady(page);
        assert.equal(requests.get(next.probe.u), 1, 'The differential update fetches its new clip exactly once');
        const media = Array.from(requests.keys()).filter(path => /^(music|sprites)\//.test(path));
        assert.deepEqual(media, [next.probe.u], 'The differential update reuses all unchanged media');
        await assertSaved();
    }

    // Historical builds discover the candidate when the player next opens the app.
    served = candidate;
    requests.clear();
    await context.setOffline(false);
    page = await createPage();
    await waitForRelease(candidate);
    if (!await page.evaluate(() => typeof window.checkForGameUpdate === 'function')) {
        // The historical page can receive its first controller after loading.
        // Reload that page once the verified replacement is already in control.
        await page.reload({ waitUntil: 'commit' });
        await waitForRelease(candidate);
    }
    await page.waitForFunction(() => typeof window.checkForGameUpdate === 'function', null, { timeout: 15000 });
    await appReady(page);
    await page.exposeFunction('__publishOfflineTestRelease', () => {
        assert.ok(pendingRelease, 'A player update check must have a staged release');
        served = pendingRelease;
        pendingRelease = null;
        requests.clear();
    });
    const upgrade = await openPack(page);
    if (await upgrade.textContent() === 'Update') await upgrade.click();
    await packReady(page);
    await assertSaved();
    const candidateDownloads = Array.from(requests.keys()).filter(path => /^(sprites|music)\//.test(path));
    assert.ok(candidateDownloads.length < 100, `Unexpected bulk media transfer during upgrade: ${candidateDownloads.length} URLs`);
    console.log(`Upgraded to ${candidate.manifest.version} with saved journey intact and ${candidateDownloads.length} media URLs served.`);

    const check = page.getByRole('button', { name: 'Check for updates', exact: true });
    // Finish any navigation-triggered recheck before the next version exists.
    await check.click();
    await packReady(page);
    await check.click({ trial: true });
    await checkFromOpenPage(settingsRelease, base.pathname, check);
    await appReady(page);
    await updateOneClip(settingsRelease, await packAction(page));
    console.log('The open Settings panel found a new release, reopened after the shell reload, and installed one changed file.');

    await page.goto(title.href, { waitUntil: 'load' });
    const titleCheck = page.locator('#title-update');
    await context.setOffline(true);
    await titleCheck.click();
    await page.waitForFunction(() => /connect.*try again/i.test(document.getElementById('title-update-status')?.textContent));
    assert.ok(await titleCheck.isEnabled());
    await context.setOffline(false);
    await titleCheck.click();
    await page.waitForFunction(() => document.getElementById('title-update-status')?.textContent.trim() === 'The game is up to date.');
    await checkFromOpenPage(titleRelease, title.pathname, titleCheck);
    await page.getByRole('link', { name: 'Offline play', exact: true }).click();
    await appReady(page);
    await updateOneClip(titleRelease, await packAction(page));
    console.log('The opening screen reported it was current, then found the next release and left its one-file media download opt-in.');

    await context.setOffline(true);
    requests.clear();
    await load(page);
    for (const { probe } of [settingsRelease, titleRelease]) {
        const cached = await page.evaluate(async path => {
            const buffer = await fetch(path).then(response => response.arrayBuffer());
            const digest = await crypto.subtle.digest('SHA-1', buffer);
            return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('').slice(0, 16);
        }, probe.u);
        assert.equal(cached, probe.h);
    }
    await page.locator('.menu-btn-quickplay--continue').click();
    const city = page.locator('#screen-story-city');
    await city.waitFor({ state: 'visible' });
    assert.equal(await city.locator('#story-hud-trainer-name').innerText(), 'Offline Ace');
    const liveAssets = [...requests.keys()].filter(path => path !== 'sw.js');
    assert.deepEqual(liveAssets, [], 'The installed pack resumed the saved town without fetching any gameplay assets');
    assert.deepEqual(errors, []);
    console.log('Both one-file updates kept existing media. The new clips verified by hash, and the saved town resumed offline without fetching gameplay assets.');

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
