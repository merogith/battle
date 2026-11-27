#!/usr/bin/env node
/**
 * Drive a fresh Story campaign in Chromium and record each observed surface.
 * Fights after the real-turn sample use a controlled victory after battle entry.
 *
 * node scripts/debug/story-playthrough.mjs --seed=1 --real-battles=1
 * Options: --max-iters=1600 --real-turns=4 --viewport=430x880
 *          --out-dir=/tmp/story-playthrough --url=http://127.0.0.1:5177/battle.html
 *          --offline-pack=true (download the default offline pack, disconnect, then play)
 *          --offline-profile=compact (or full, select and verify that pack)
 *          --road-choice=scout (or help or pass)
 *          --road-choices=scout,help,pass,scout,help,pass,scout,help,pass
 *          --chapters=true --chapter-choice=clue (or listen or act)
 *          --milestone-turns=3 --fight-style=matchup
 *          --difficulty=hard --gens=1,2,4,7,9 --no-items=true
 *          --screenshots=surfaces (deduplicate) or none (only failures)
 * Env: BATTLE_TEST_URL, BATTLE_TEST_CHROMIUM, PORT
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

/* global state, settings, showEndScreen */

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = Object.fromEntries(process.argv.slice(2).map(arg => arg.replace(/^--/, '').split(/=(.*)/s, 2)));
const port = Number(process.env.PORT || 5178);
const externalUrl = args.url || process.env.BATTLE_TEST_URL;
const url = new URL(externalUrl || `http://127.0.0.1:${port}/battle.html`);
const seed = Number(args.seed ?? 1);
const difficulty = args.difficulty ?? 'normal';
const generations = args.gens === undefined
    ? Array.from({ length: 9 }, (_, index) => index + 1)
    : [...new Set(args.gens.split(',').map(Number))].sort((a, b) => a - b);
const noItems = args['no-items'] === 'true';
const screenshotMode = args.screenshots ?? 'all';
const maxIters = Number(args['max-iters'] ?? 1600);
const realBattles = Number(args['real-battles'] ?? 1);
const realTurns = Number(args['real-turns'] ?? 4);
const milestoneTurns = Number(args['milestone-turns'] ?? 0);
const fightStyle = args['fight-style'] ?? 'first';
const expectedBattleEngine = process.env.BATTLE_EXPECT_STORY_ENGINE;
const offlinePack = args['offline-pack'] === 'true';
const offlineProfile = args['offline-profile'];
const resumeOfflineTurn = offlinePack && process.env.BATTLE_TEST_RESUME_OFFLINE_TURN === '1';
const roadChoice = args['road-choice'] ?? 'scout';
const roadOptions = ['scout', 'help', 'pass'];
const mixedRoad = args['road-choices'] !== undefined;
const roadChoices = mixedRoad ? String(args['road-choices']).split(',') : Array(9).fill(roadChoice);
const chapters = args.chapters === 'true';
const chapterChoice = args['chapter-choice'] ?? 'clue';
const chapterIds = [...Array.from({ length: 9 }, (_, index) => 'chapter-' + (index + 1)), 'aftermath'];
const chapterCatalog = chapters ? Object.fromEntries(['opening', 'early', 'middle', 'finale']
    .flatMap(group => JSON.parse(readFileSync(join(root, 'data/story', 'adventure-' + group + '.json'), 'utf8')))
    .map(scene => [scene.id, scene])) : {};
const choiceForChapter = id => chapterChoice === 'clue'
    ? chapterCatalog[id].choices.find(option => option.clue)?.id || 'listen'
    : chapterChoice;
const [width, height] = (args.viewport || '430x880').split('x').map(Number);
const outDir = resolve(args['out-dir'] || join(root, 'agent-state', 'playthrough'));
const shotsDir = args['out-dir'] ? join(outDir, 'screenshots') : join(root, 'screenshots', 'playthrough');
const touch = args.touch === undefined ? width <= 900 : args.touch === 'true';
const surfaceWaitMs = 12000;
const executablePath = process.env.BATTLE_TEST_CHROMIUM ||
    (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
const wait = ms => new Promise(done => setTimeout(done, ms));
const findings = [];
const trace = [];
const capturedSurfaces = new Set();
const coverage = { battles: [], realTurns: 0, hallOfFame: false, mystery: false, crucible: false,
    roadChoices: 0, roadDecisions: {} };
if (chapters) coverage.chapters = [];

if (![seed, width, height, maxIters, realBattles, realTurns, milestoneTurns].every(value => Number.isInteger(value) && value >= 0) ||
    seed > 0xffffffff || !width || !height || !maxIters ||
    !['veryeasy', 'easy', 'normal', 'hard', 'challenge'].includes(difficulty) ||
    !['all', 'surfaces', 'none'].includes(screenshotMode) ||
    !generations.length || generations.some(value => !Number.isInteger(value) || value < 1 || value > 9) ||
    roadChoices.length !== 9 || roadChoices.some(choice => !roadOptions.includes(choice)) ||
    !['clue', 'listen', 'act'].includes(chapterChoice) || !['first', 'matchup'].includes(fightStyle) ||
    (offlineProfile && (!offlinePack || !['compact', 'full'].includes(offlineProfile)))) {
    throw new Error('Expected valid campaign settings. Select compact or full only with --offline-pack.');
}
mkdirSync(outDir, { recursive: true });
mkdirSync(shotsDir, { recursive: true });

function record(severity, area, message) {
    findings.push({ severity, area, message, step: trace.length });
    console.log(`[${severity}] ${area}: ${message}`);
}

async function readPage(page) {
    return page.evaluate(() => {
        const visible = element => {
            const style = getComputedStyle(element);
            return element.getClientRects().length > 0 && style.visibility !== 'hidden' && style.opacity !== '0';
        };
        const screenElements = [...document.querySelectorAll('.screen[id]')].filter(visible);
        const screens = screenElements.map(element => element.id);
        const overlaySelector = [
            '[role="dialog"]', '.modal', '.story-narr-root', '.story-vs-intro', '.story-hof-gb-overlay', '.story-legend-sighting', '.story-chapter-dialog',
            '[id^="story-"][id$="-scene"]', '#story-scene-overlay',
        ].join(',');
        const dialogElements = [...document.querySelectorAll(overlaySelector)].filter(visible);
        const surfaceName = element => element.id || element.getAttribute('aria-label') || element.classList[0];
        const dialogs = dialogElements.map(surfaceName).filter(Boolean);
        const content = (dialogElements.length ? dialogElements : screenElements).map(element => ({
            surface: surfaceName(element), text: (element.innerText || '').trim().slice(0, 5000),
        }));
        const sm = window.StoryMode?.state;
        const entry = window.STORY_EVENTS_RAW?.[sm?.eventIndex];
        return {
            screens, dialogs, content,
            roadCity: Number(dialogElements.find(element => element.matches('.story-road-discovery'))?.dataset.roadDiscovery) || 0,
            eventIndex: sm?.eventIndex ?? null, eventId: entry?.[0] ?? null,
            eventType: entry?.[1] ?? null, eventName: entry?.[2] ?? null,
            seed: sm?.runSeed == null ? null : sm.runSeed >>> 0,
            badges: sm?.badges || 0, gold: sm?.gold || 0,
            team: (sm?.team || []).map(member => member?.name),
            pcCount: (sm?.pcBox || []).length,
            mystery: !!sm?.postHofMysteryClimaxDone, crucible: !!sm?.atCrucible,
        };
    });
}

async function capture(page, label, snapshot = null) {
    const snapshotBeforeAction = snapshot || await readPage(page);
    const previous = trace.at(-1);
    if (previous?.label === label && previous.eventIndex === snapshotBeforeAction.eventIndex &&
        JSON.stringify(previous.content) === JSON.stringify(snapshotBeforeAction.content)) return;
    const index = String(trace.length + 1).padStart(3, '0');
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90);
    const surface = JSON.stringify([
        snapshotBeforeAction.eventId, label.replace(/-turn-\d+$/, ''),
        snapshotBeforeAction.screens, snapshotBeforeAction.dialogs,
    ]);
    let screenshot = null;
    if (label === 'blocked' || screenshotMode === 'all' || (screenshotMode === 'surfaces' && !capturedSurfaces.has(surface))) {
        const filename = join(shotsDir, `${index}-${slug || 'step'}.png`);
        await page.screenshot({ path: filename, animations: 'disabled', timeout: 15000 });
        screenshot = relative(outDir, filename);
        capturedSurfaces.add(surface);
    }
    const assessment = await page.evaluate(() => {
        const shown = [...document.querySelectorAll('.screen:not(.hidden), [role="dialog"], .story-narr-root, .story-vs-intro')]
            .filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
        const tokens = /\b(?:undefined|NaN|Infinity)\b|\[object (?:Object|Promise)\]|\$\{[^}]+\}|\{\{[^}]+\}\}/;
        const text = shown.flatMap(element => element.innerText.split('\n').filter(line => tokens.test(line)).slice(0, 4));
        const brokenImages = [...document.images].filter(image => {
            if (!image.getClientRects().length || getComputedStyle(image).visibility === 'hidden' || !image.complete || image.naturalWidth) return false;
            const src = image.currentSrc || image.getAttribute('src');
            return src && new URL(src, location.href).origin === location.origin;
        }).map(image => `Broken image: ${new URL(image.currentSrc || image.src, location.href).pathname}`);
        const dialogs = shown.filter(el => !el.classList.contains('screen'));
        const controls = (dialogs.length ? dialogs : shown).flatMap(surface => {
            const name = surface.id || surface.getAttribute('aria-label') || surface.classList[0];
            return [...surface.querySelectorAll('button, a[href], select, summary, input:not([type="hidden"])')]
                .filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden')
                .map(el => ({
                    surface: name,
                    label: (el.getAttribute('aria-label') || el.innerText || el.title || el.placeholder || el.name || el.id || el.tagName)
                        .trim().replace(/\s+/g, ' ').slice(0, 150),
                    enabled: !el.disabled && el.getAttribute('aria-disabled') !== 'true',
                }));
        });
        return { anomalies: [...new Set(text.concat(brokenImages))], controls };
    });
    trace.push({ label, ...snapshotBeforeAction, screenshot, ...assessment });
    console.log(`[${index}] ${label} · ${snapshotBeforeAction.eventId ?? '-'} ${snapshotBeforeAction.eventName || ''}`);
}

function button(page, scope, name) {
    return page.locator(scope).getByRole('button', { name }).first();
}

async function click(page, match, label, snapshot = null) {
    if (!await match.isVisible()) return false;
    try { await match.click({ trial: true, timeout: 6500 }); }
    catch (error) {
        if (error.name !== 'TimeoutError') throw error;
        return false;
    }
    await capture(page, label, snapshot);
    await match.click({ timeout: 8000 });
    return true;
}

async function choosePlayerMove(attacks) {
    if (fightStyle === 'first') return attacks.first();
    const index = await attacks.evaluateAll(buttons => {
        const score = button => {
            const label = button.getAttribute('aria-label') || '';
            const power = Number(label.match(/Power (\d+)/)?.[1] || 0);
            const accuracy = Number(label.match(/Acc (\d+)%/)?.[1] || 100);
            const matchup = button.querySelector('.move-tile-matchup')?.textContent || '';
            const multiplier = matchup.includes('▲') ? 2 : matchup.includes('▼') ? 0.5 : matchup.includes('⊘') ? 0 : 1;
            return power * accuracy * multiplier;
        };
        return buttons.length ? buttons.indexOf(buttons.reduce((best, button) => score(button) > score(best) ? button : best)) : 0;
    });
    return attacks.nth(index);
}

async function playMinigame(page, label, view) {
    const overlay = page.locator('.story-minigame-overlay:visible');
    if (!await overlay.count()) return false;
    const pads = overlay.locator('.story-mg-pad:enabled');
    if (await pads.count()) {
        const order = await overlay.locator('.story-mg-order').allTextContents();
        const lines = order.length ? order : await overlay.locator('.story-dialog-box .story-dialog-text').allTextContents();
        const sequence = order.length ? [...order[0].matchAll(/\b\d+\b/g)].map(match => new RegExp('^Tile ' + match[0] + ','))
            : lines[1]?.trim().split(/\s+/) || [];
        if (!sequence.length) throw new Error('The memory scene did not expose its prompt in reduced-motion mode.');
        await capture(page, label + '-remember', view);
        for (const tile of sequence) await overlay.getByRole('button', { name: tile, exact: true }).click();
        return true;
    }
    return await click(page, overlay.getByRole('button', { name: /^Continue\s*→$/ }).first(), label + '-continue', view) ||
        await click(page, overlay.locator('.story-mg-btn:enabled').filter({ hasNotText: /Replay pattern|Read pattern|Continue without/ }).first(), label + '-pick', view);
}

async function waitForServer() {
    for (let attempt = 0; attempt < 30; attempt++) {
        try {
            const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(900) });
            if (response.ok) return;
        } catch {}
        await wait(150);
    }
    throw new Error(`Could not reach ${url.href}`);
}

async function main() {
    const server = externalUrl ? null : spawn(process.execPath, [join(root, 'scripts/dev-server.cjs')], {
        env: { ...process.env, PORT: String(port) }, stdio: 'ignore',
    });
    let browser;
    let page;
    try {
        await waitForServer();
        browser = await chromium.launch({ executablePath });
        const context = await browser.newContext({
            viewport: { width, height }, hasTouch: touch, isMobile: touch,
            reducedMotion: 'reduce', serviceWorkers: offlinePack ? 'allow' : 'block',
        });
        await context.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
        await context.addInitScript(() => {
            const nativeRandom = Math.random;
            Math.random = function () {
                if (window.__storyPlaythroughSeed === undefined) return nativeRandom();
                const value = window.__storyPlaythroughSeed;
                delete window.__storyPlaythroughSeed;
                return Math.min(1, (value + 0.25) / 0xffffffff);
            };
        });
        page = await context.newPage();
        page.setDefaultTimeout(5000);
        page.on('pageerror', error => record('error', 'page', error.message));
        const seenConsole = new Set();
        page.on('console', message => {
            const type = message.type();
            const text = message.text();
            if (expectedBattleEngine && text.startsWith('[battle] Showdown initialization failed:')) {
                record('error', 'battle-engine', text.slice(0, 450));
                return;
            }
            if (type !== 'error' || /Failed to load resource|net::ERR_|favicon/i.test(text) || seenConsole.has(text)) return;
            seenConsole.add(text);
            record(type, 'console', text.slice(0, 300));
        });
        await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.locator('#app-loading-overlay').waitFor({ state: 'hidden', timeout: 25000 });
        if (offlinePack) {
            await page.locator('#menu-offline-entry').click();
            await page.waitForFunction(() => navigator.serviceWorker?.controller, null, { timeout: 120000 });
            const download = page.locator('#offline-dl-start');
            if (offlineProfile) await page.getByLabel('Offline pack', { exact: true }).selectOption(offlineProfile);
            await page.waitForFunction(() => /remaining.*files|files remaining/.test(document.getElementById('offline-dl-size')?.textContent), null, { timeout: 20000 });
            await capture(page, 'offline-download-size');
            await download.click();
            await page.waitForFunction(() => {
                const text = document.getElementById('offline-dl-status')?.textContent || '';
                return /^(Ready to play offline\.|Done\.|Download incomplete|Download stalled)/.test(text);
            }, null, { timeout: 480000 });
            const result = await page.locator('#offline-dl-status').innerText();
            if (!/^(Ready to play offline\.|Done\.)/.test(result)) throw new Error(result);
            await capture(page, 'offline-download-complete');
            console.log(result);
            await context.setOffline(true);
            await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
            await page.locator('#app-loading-overlay').waitFor({ state: 'hidden', timeout: 25000 });
            coverage.offlinePack = true;
            coverage.offlineProfile = await page.evaluate(() =>
                JSON.parse(localStorage.getItem('pbs_settings') || '{}').offlineDownload?.profile || 'full');
            if (offlineProfile) assert.equal(coverage.offlineProfile, offlineProfile, 'The requested pack stayed active after disconnecting');
            if (coverage.offlineProfile === 'compact') {
                const sprite = await page.evaluate(async () => {
                    const path = 'sprites/gen5ani/pikachu.gif';
                    const response = await fetch(path);
                    const image = new Image();
                    image.src = path;
                    await image.decode();
                    return { type: response.headers.get('content-type'), width: image.naturalWidth };
                });
                if (sprite.type !== 'image/webp' || !sprite.width) throw new Error('Compact pack did not decode its offline sprite.');
                coverage.compactSprite = sprite;
            }
        }
        await page.locator('.menu-btn-quickplay--story').waitFor({ state: 'visible' });
        const action = (selector, label, snapshot) => click(page, page.locator(selector).first(), label, snapshot);
        if (!await action('.menu-btn-quickplay--story', 'home')) throw new Error('Story mode was not actionable.');
        const launch = page.locator('.story-menu-btn--new:visible, #story-create-name:visible');
        // Opening Story may load the first run's local data on a cold boot.
        await launch.first().waitFor({ timeout: 35000 });
        if (await page.locator('.story-menu-btn--new').isVisible() &&
            !await action('.story-menu-btn--new', 'story-menu')) throw new Error('Story creation was not actionable.');
        await page.locator('#story-create-name').fill('Field Tester');
        if (difficulty !== 'normal') {
            await page.locator(`.story-create-diff-card[data-diff="${difficulty}"]`).click();
        }
        const seedInput = page.locator('#story-create-seed');
        const supportsSeedField = (await seedInput.count()) > 0;
        if (generations.length !== 9 || supportsSeedField || noItems) {
            const advanced = page.locator('.story-create-advanced');
            if (await advanced.count() && !await advanced.evaluate(details => details.open)) {
                await advanced.locator('summary').click();
            }
        }
        if (generations.length !== 9) {
            await page.locator('.story-create-gen-preset[data-preset="custom"]').click();
            for (let gen = 1; gen <= 9; gen++) {
                await page.locator('#story-gen-cb-' + gen).setChecked(generations.includes(gen));
            }
        }
        if (noItems) await page.locator('#story-no-item-run').check();
        if (supportsSeedField) {
            await seedInput.fill(String(seed));
        } else {
            await page.locator('#story-create-begin').evaluate((element, requestedSeed) => {
                element.addEventListener('click', () => { window.__storyPlaythroughSeed = requestedSeed; }, { once: true, capture: true });
            }, seed);
        }
        if (!await action('#story-create-begin', 'trainer-create')) throw new Error('Adventure could not start.');

        let advancingSince = Date.now();
        let unchanged = 0;
        let activeBattle = null;
        let activeChapter = null;
        let lastBattle = null;
        let viewedDex = false;
        let previousView = '';
        const sampled = new Set();
        const searched = new Set();
        for (let iter = 0; iter < maxIters; iter++) {
            const view = await readPage(page);
            if (view.seed !== null && view.seed !== seed) throw new Error(`Expected run seed ${seed}, observed ${view.seed}`);
            const signature = JSON.stringify(view);
            unchanged = signature === previousView ? unchanged + 1 : 0;
            previousView = signature;
            coverage.mystery ||= view.mystery;
            const eventName = view.eventName || 'Opening';
            const selectedRoadChoice = roadChoices[view.roadCity - 1];
            const selectedRoadIndex = roadOptions.indexOf(selectedRoadChoice);
            const run = (selector, label) => action(selector, label, view);
            const byName = (scope, name, label) => click(page, button(page, scope, name), label, view);
            let advanced = false;
            try {
                const inCrucible = view.screens.includes('screen-story-crucible');
                const city = view.screens.includes('screen-story-city') && /^City([1-9])$/.exec(eventName);
                const chapter = inCrucible ? 'aftermath' : city ? 'chapter-' + city[1] : null;
                const chapterPending = chapters && chapter && !coverage.chapters.some(item => item.id === chapter);
                const chapterModal = '.story-chapter-dialog:visible';
                if (chapters && activeChapter && await page.locator(chapterModal).count()) {
                    const choice = choiceForChapter(activeChapter.id);
                    const discovery = page.locator(chapterModal + ' [data-adventure-secret]').first();
                    if (await run(chapterModal + ` [data-adventure-pick="${choice}"]`, 'chapter-choice-' + activeChapter.id)) {
                        activeChapter.choice = choice;
                        advanced = true;
                    } else if (await run(chapterModal + ' [data-adventure-next]', 'chapter-panel-' + activeChapter.id)) {
                        activeChapter.panels++;
                        advanced = true;
                    } else if (!activeChapter.secret && await discovery.count()) {
                        // A momentarily unsettled discovery button must finish before the driver leaves the scene.
                        advanced = await click(page, discovery, 'chapter-secret-' + activeChapter.id, view);
                        if (advanced) activeChapter.secret = true;
                    } else if (await run(chapterModal + ' [data-adventure-done]', 'chapter-return-' + activeChapter.id)) {
                        activeChapter = null;
                        advanced = true;
                    }
                } else if (chapterPending && !view.dialogs.length &&
                           await run(`[data-adventure-open="${chapter}"]:visible`, 'chapter-open-' + chapter)) {
                    activeChapter = { id: chapter, choice: null, panels: 0, secret: false };
                    coverage.chapters.push(activeChapter);
                    advanced = true;
                } else if (inCrucible && !view.dialogs.length && !chapterPending) {
                    coverage.crucible = view.crucible;
                    await capture(page, 'crucible', view);
                    break;
                } else if (await run('.story-victory-v2:visible .story-victory-v2-continue', `victory-${lastBattle?.eventName || eventName}`)) {
                    if (lastBattle) lastBattle.outcome = lastBattle.controlled ? 'controlled win' : 'win';
                    activeBattle = null;
                    advanced = true;
                } else if (await byName('#modal-game-alert:visible', /^OK$/, 'game-alert')) advanced = true;
                else if (await run('.story-hof-gb-overlay:visible .story-hof-gb-btn-primary', 'hall-of-fame')) {
                    coverage.hallOfFame = true;
                    advanced = true;
                } else if (await page.locator('.story-minigame-overlay').first().isVisible()) {
                    advanced = await playMinigame(page, `minigame-${eventName}`, view);
                } else if (view.dialogs.includes('camp-microgame')) {
                    advanced = await run('#camp-microgame [data-camp-exit]', `camp-leave-activity-${eventName}`);
                } else if (view.dialogs.includes('story-camp-scene')) {
                    const options = page.locator('#story-camp-scene [data-scene-opt]');
                    if (await click(page, options.filter({ hasText: /Break camp/ }).first(), `camp-${eventName}`, view)) {
                        // The next encounter may load after Camp is gone while the old catch screen remains underneath.
                        const destination = page.locator([
                            '.story-vs-intro:visible button:enabled', '.story-narr-root:visible button:enabled',
                            '.story-legend-sighting:visible button:enabled', '.story-minigame-overlay:visible button:enabled',
                            '.story-tutorial-overlay:visible .story-tutorial-continue',
                            '#screen-battle:visible #command-menu:visible', '#modal-game-alert:visible',
                        ].join(', '));
                        await page.locator('#story-camp-scene').waitFor({ state: 'hidden', timeout: surfaceWaitMs });
                        try { await destination.first().waitFor({ timeout: surfaceWaitMs }); }
                        catch (error) { throw new Error(`Breaking camp at row ${view.eventId} did not lead to a battle or story scene.`, { cause: error }); }
                        advanced = true;
                    } else {
                        advanced = await click(page, options.filter({ hasText: /Back/ }).first(), `camp-back-${eventName}`, view)
                            || await run('#story-camp-scene [data-scene-cont]', `camp-continue-${eventName}`);
                    }
                } else if (await run('.story-legend-sighting:visible button', `legend-or-raid-${eventName}`)) advanced = true;
                else if (await run('.story-vs-intro:visible [data-vs2-battle]', `vs-start-${eventName}`) ||
                           await run('.story-vs-intro:visible [data-vs2-pick="stoic"]', `vs-choices-${eventName}`)) advanced = true;
                else if (await run('.story-tutorial-overlay:visible .story-tutorial-continue', `tutorial-${eventName}`)) advanced = true;
                else if (selectedRoadIndex >= 0 && await run(
                    `.story-road-discovery[data-road-discovery="${view.roadCity}"]:visible [data-narr-choice-idx="${selectedRoadIndex}"]`,
                    `road-${selectedRoadChoice}-${eventName}`
                )) {
                    coverage.roadDecisions[view.roadCity] = selectedRoadChoice;
                    coverage.roadChoices = Object.keys(coverage.roadDecisions).length;
                    advanced = true;
                }
                else if (await run('.story-narr-root:visible [data-narr-continue]', `narration-${eventName}`) ||
                         await run('.story-narr-root:not(.story-road-discovery):visible [data-narr-choice-idx]', `narration-choice-${eventName}`)) advanced = true;
                else if (await run('[data-scene-cont]:visible', `scene-${eventName}`) ||
                         await run('[data-scene-opt]:visible', `scene-choice-${eventName}`)) advanced = true;
                else if (await byName('body', /^Begin →$/, 'pallet-cold-open')) advanced = true;
                else if (await page.locator('.story-city-arrival [data-arrival-dismiss]').isVisible()) {
                    const usable = await page.locator('[data-arrival-dismiss]').evaluate(element => {
                        const rect = element.getBoundingClientRect();
                        return rect.height >= 44 && rect.bottom <= innerHeight && rect.top >= 0 &&
                            element.contains(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2));
                    });
                    if (!usable) throw new Error(`City arrival button is clipped or obstructed at ${eventName}.`);
                    advanced = await run('[data-arrival-dismiss]:visible', `arrive-${eventName}`);
                }
                else if (await run('[data-arrival-dismiss]:visible', `arrive-${eventName}`)) advanced = true;
                else if (!searched.has(view.eventIndex) && await run('[data-wander-search]:visible', `wander-search-${eventName}`)) {
                    searched.add(view.eventIndex);
                    advanced = true;
                } else if (await run('[data-wander-moveon]:visible', `wander-move-on-${eventName}`)) advanced = true;
                else if (view.screens.includes('screen-story-catch')) {
                    const scope = '#screen-story-catch:not([inert])';
                    const receipt = `${scope} [data-catch-continue]:visible`;
                    if (!viewedDex && await run(`${scope} button[data-dex-name]:visible`, `catch-open-dex-${eventName}`)) {
                        advanced = true;
                    } else if (await run(receipt, `catch-result-${eventName}`)) {
                        // A finished catch may show the same receipt until the next dialog takes focus.
                        await page.locator(receipt).waitFor({ state: 'hidden', timeout: surfaceWaitMs });
                        advanced = true;
                    } else {
                        advanced = await run(`${scope} [onclick*="catchResolveSendToPC"]:visible`, `catch-party-full-${eventName}`) ||
                            await run(`${scope} [data-ball-type]:enabled:visible`, `throw-ball-${eventName}`) ||
                            await run(`${scope} #story-catch-run-btn:enabled:visible`, `leave-wild-encounter-${eventName}`);
                    }
                } else if (view.screens.includes('screen-collection') && !viewedDex) {
                    await page.locator('#pdex-entry-title').waitFor({ state: 'visible', timeout: 6000 });
                    advanced = await run('#screen-collection .pdex-entry button:has-text("Back to Catch")', 'catch-dex-entry');
                    if (advanced) {
                        coverage.catchDex = true;
                        viewedDex = true;
                    }
                } else if (view.screens.includes('screen-story-gameover')) {
                    if (lastBattle && !lastBattle.outcome) lastBattle.outcome = 'loss';
                    activeBattle = null;
                    advanced = await run('#screen-story-gameover [onclick*="retryFromGameOver"]', `defeat-retry-${eventName}`);
                } else if (view.screens.includes('screen-battle')) {
                    const engine = await page.evaluate(() => ({
                        story: state.mode === 'story', turn: state.turnNumber || 0, isOver: !!state.isOver,
                        locked: !!state.isLocked, active: !!state.pActive && !!state.fActive,
                        name: state.battleEngine,
                        boss: !!state._bossMechanics?.length || !!state._storyBossProfile,
                        bossProfile: state._storyBossProfile?.sceneKey || null,
                    }));
                    const party = page.locator('#modal-party');
                    if (engine.story && !engine.isOver && await party.isVisible()) {
                        const replacement = party.getByRole('button', { name: 'Switch', exact: true })
                            .and(party.locator('button:enabled')).first();
                        advanced = await click(page, replacement, `battle-replacement-${eventName}`, view);
                    } else if (engine.story && engine.active && !engine.isOver && await page.locator('#command-menu').isVisible()) {
                        if (!activeBattle) {
                            if (engine.locked) {
                                await page.waitForFunction(() => !state.isLocked || state.isOver);
                                continue;
                            }
                            if (expectedBattleEngine && engine.name !== expectedBattleEngine) {
                                throw new Error(`${eventName} started with ${engine.name || 'no engine'}; expected ${expectedBattleEngine}.`);
                            }
                            const milestone = engine.boss || /^(Gym Leader \d|Rival|E[1-4]|Champion|Mystery Figure)$/.test(eventName);
                            const limit = sampled.has(view.eventIndex) ? 0
                                : Math.max(sampled.size < realBattles ? realTurns : 0, milestone ? milestoneTurns : 0);
                            if (limit) sampled.add(view.eventIndex);
                            activeBattle = { id: view.eventId, eventName, engine: engine.name, boss: engine.boss,
                                ...(engine.bossProfile ? { bossProfile: engine.bossProfile } : {}),
                                real: limit > 0, turnLimit: limit, turns: 0 };
                            lastBattle = activeBattle;
                            coverage.battles.push(activeBattle);
                            await page.evaluate(() => { settings.battleSpeed = 'instant'; });
                        }
                        if (resumeOfflineTurn && !coverage.offlineResume && engine.turn > 0 && !engine.locked) {
                            const board = () => page.evaluate(() => ({ turn: state.turnNumber,
                                hp: [state.pActive.currentHp, state.fActive.currentHp],
                                pp: state.pActive.moves.map(move => move.pp), phase: state.nativeRequests[0]?.phase }));
                            const before = await board();
                            await page.goto(new URL('./', url).href, { waitUntil: 'domcontentloaded' });
                            await page.getByRole('link', { name: /Continue/ }).click();
                            await page.waitForFunction(() => typeof state !== 'undefined' && state.resumedStoryTurn && !state.isLocked);
                            assert.deepEqual(await board(), before, 'The offline title resumes the exact battle decision');
                            coverage.offlineResume = before;
                            await capture(page, 'offline-resume-turn');
                            advanced = true;
                        } else if (activeBattle.turns < activeBattle.turnLimit) {
                            advanced = await run('#command-menu [data-cmd="fight"]', `battle-fight-${eventName}-turn-${engine.turn + 1}`);
                        } else {
                            await capture(page, `battle-command-${eventName}`, view);
                            activeBattle.controlled = true;
                            activeBattle.outcome = 'controlled win';
                            await page.evaluate(() => {
                                state.isOver = true;
                                showEndScreen('VICTORY', 'Playthrough controlled win', true);
                            });
                            activeBattle = null;
                            advanced = true;
                        }
                    } else if (engine.story && !engine.isOver && await page.locator('#move-menu').isVisible()) {
                        const moves = page.locator('#move-menu .move-menu-scroll button:not(.move-info-hit):enabled:visible');
                        const attack = moves.filter({ hasNotText: 'Switch Pokémon' });
                        advanced = await click(page, await choosePlayerMove(attack), `battle-moves-${eventName}-turn-${engine.turn + 1}`, view);
                        if (advanced && activeBattle) {
                            activeBattle.turns++;
                            coverage.realTurns++;
                        }
                    } else if (engine.isOver) activeBattle = null;
                } else if (view.screens.includes('screen-story-professor')) {
                    for (const [selector, label] of [
                        ['#prof-accept-btn:enabled:visible', 'accept-starter'],
                        ['#story-prof-rolled-card .prof-pick-choice:visible', 'choose-starter'],
                        ['#screen-story-professor:has(#story-prof-status:has-text("joined your team")) .story-shop-back-btn', 'leave-professor'],
                    ]) if (await run(selector, label)) { advanced = true; break; }
                } else if (view.screens.includes('screen-story-shop')) {
                    advanced = await run('#screen-story-shop .story-shop-back-btn', `leave-shop-${eventName}`);
                } else if (view.screens.includes('screen-story-pokemoncenter')) {
                    advanced = await run('#screen-story-pokemoncenter .story-shop-back-btn', `leave-center-${eventName}`);
                } else if (view.screens.includes('screen-story-city') && !chapterPending) {
                    advanced = await run('#story-city-tips .story-city-objective:enabled:visible', `city-objective-${eventName}`);
                }
            } catch (error) {
                if (error.name !== 'TimeoutError') throw error;
            }
            if (!advanced && view.dialogs.includes('story-vs-intro') && !unchanged) {
                await capture(page, `vs-splash-${eventName}`, view);
            }
            if (unchanged > 85) {
                await capture(page, 'blocked', view);
                throw new Error(`Repeated action without advancing row ${view.eventId} ${eventName} (${view.screens.concat(view.dialogs).join(', ')})`);
            }
            if (advanced) {
                advancingSince = Date.now();
                if (unchanged) await wait(90);
            } else {
                if (Date.now() - advancingSince > surfaceWaitMs) {
                    const live = await readPage(page);
                    const surface = ({ eventId, screens, dialogs }) => JSON.stringify([eventId, screens, dialogs]);
                    if (surface(live) !== surface(view)) {
                        advancingSince = Date.now();
                        continue;
                    }
                    await capture(page, 'blocked', live);
                    throw new Error(`No actionable surface at row ${live.eventId} ${live.eventName || 'Opening'} (${live.screens.concat(live.dialogs).join(', ')})`);
                }
                await wait(110);
            }
        }
        if (!coverage.crucible) throw new Error('The main story run did not reach the Crucible.');
        if (resumeOfflineTurn) assert.ok(coverage.offlineResume, 'The offline run reopens an active native battle');
        if (!coverage.hallOfFame || !coverage.mystery) throw new Error('The finish omitted the Hall of Fame or Mystery climax.');
        coverage.rules = await page.evaluate(() => {
            const { storyDifficulty, settings } = JSON.parse(localStorage.getItem('pbs_story_save'));
            return { difficulty: storyDifficulty, generations: settings.enabledGens, noItems: !!settings.noItemRun };
        });
        assert.deepEqual(coverage.rules, { difficulty, generations, noItems });
        if (chapters) {
            const choices = await page.evaluate(() => {
                const saved = JSON.parse(localStorage.getItem('pbs_story_save') || '{}');
                return saved.storyChoices || {};
            });
            for (const [index, id] of chapterIds.entries()) {
                const completed = coverage.chapters[index];
                const choice = choiceForChapter(id);
                if (completed?.id !== id || completed.choice !== choice || choices['adventure.' + id] !== choice) {
                    throw new Error('Expected a saved, observed choice in ' + id + '.');
                }
                if (completed.panels < chapterCatalog[id].panels.length - 1) {
                    throw new Error('Some cinematic panels did not play in ' + id + '.');
                }
                if (chapterChoice === 'clue' && chapterCatalog[id].secret && !completed.secret) {
                    throw new Error('Expected the complete clue path to unlock a secret in ' + id + '.');
                }
                if (completed.secret && choices['adventure.secret.' + id] !== true) {
                    throw new Error('The claimed secret was not saved for ' + id + '.');
                }
            }
        }
        if (await seedInput.count()) {
            if (coverage.roadChoices !== 9) throw new Error(`Observed ${coverage.roadChoices || 0} of 9 road choices.`);
            const decisions = await page.evaluate(() => Object.entries(window.StoryMode.state.storyChoices)
                .filter(([key]) => key.startsWith('road.discovery.')));
            const savedRoads = Object.fromEntries(decisions);
            if (decisions.length !== 9 || roadChoices.some((choice, index) =>
                savedRoads[`road.discovery.${index + 1}`] !== choice || coverage.roadDecisions[index + 1] !== choice)) {
                throw new Error('Saved road decisions differ from the choices made in the playthrough.');
            }
            if (!coverage.catchDex) throw new Error('The first catch did not open a Pokédex entry.');
        }
    } catch (error) {
        record('error', 'harness', String(error.stack || error));
        if (page && trace.at(-1)?.label !== 'blocked') await capture(page, 'blocked').catch(() => {});
        process.exitCode = 1;
    } finally {
        if (browser) await browser.close();
        server?.kill();
        const summary = { seed, difficulty, generations, noItems, roadChoice: mixedRoad ? 'mixed' : roadChoice, ...(mixedRoad ? { roadChoices } : {}),
            ...(chapters ? { chapterChoice } : {}), viewport: { width, height, touch }, screenshotMode,
            completed: coverage.crucible && coverage.hallOfFame && coverage.mystery,
            coverage, steps: trace.length, findings: findings.length };
        writeFileSync(join(outDir, 'findings.json'), JSON.stringify({ ...summary, findings }, null, 2));
        writeFileSync(join(outDir, 'trace.json'), JSON.stringify(trace, null, 2));
        writeFileSync(join(outDir, 'trace.txt'), trace.map((entry, index) =>
            `${index + 1}\t${entry.eventId ?? '-'}\t${entry.label}\t${entry.screenshot ?? '-'}`).join('\n'));
        console.log(`Report: ${join(outDir, 'findings.json')}`);
    }
}

await main();
