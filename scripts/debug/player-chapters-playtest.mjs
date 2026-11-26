#!/usr/bin/env node
// Exercise both answers to every native chapter and the Archive with arrival checkpoints.
// Use story-playthrough.mjs --chapters=true to exercise all chapters in one campaign.
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, webkit } from 'playwright';

const root = fileURLToPath(new URL('../../', import.meta.url));
const url = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5177/battle.html');
assert.ok(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname),
    'Use a loopback Battle server');
const engine = process.env.BATTLE_TEST_ENGINE || 'chromium';
assert.ok(engine === 'chromium' || engine === 'webkit', 'Use chromium or webkit');
const out = resolve(process.env.BATTLE_PLAYTEST_OUT || join(root, 'agent-state/playthrough/adventure-chapters'));
await mkdir(out, { recursive: true });

const groups = await Promise.all(['opening', 'early', 'middle', 'finale'].map(group => readFile(
    join(root, 'data/story', 'adventure-' + group + '.json'), 'utf8').then(JSON.parse)));
const catalog = new Map(groups.flat().map(chapter => [chapter.id, chapter]));
const report = {
    status: 'running',
    browser: engine,
    trace: [],
    findings: [],
    fixtures: 'Starts two real adventures with the same seed using the normal setup screen. Save fixtures move each run to the nine arrived towns and the completed Mystery aftermath, bypassing those battles and earlier travel. Both chapter answers, all discoveries, returns and archive replays use the public controls.',
};
const browser = engine === 'webkit' ? await webkit.launch({ executablePath: process.env.BATTLE_TEST_WEBKIT })
    : await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce',
    serviceWorkers: 'block', acceptDownloads: true,
});
await context.route('**/*', route =>
    new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
const page = await context.newPage();
page.setDefaultTimeout(8500);
page.setDefaultNavigationTimeout(45000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const modal = () => page.locator('dialog.story-chapter-dialog[open]');
const control = name => modal().locator('[data-adventure-' + name + ']');
const card = id => page.locator(`[data-adventure-open="${id}"]:visible`);
const chosen = id => 'adventure.' + id;
const discovery = id => 'adventure.secret.' + id;
const seed = 314159;
let phase = 'open';

async function progress() {
    return page.evaluate(() => {
        const saved = JSON.parse(localStorage.getItem('pbs_story_save') || '{}');
        const meta = JSON.parse(localStorage.getItem('pbs_story_meta') || '{}');
        return {
            name: saved.trainerProfile?.name, seed: saved.runSeed, id: saved.adventureRunId,
            choices: Object.fromEntries(Object.entries(saved.storyChoices || {}).filter(([key]) => key.startsWith('adventure.'))),
            archive: meta.adventureArchive || null,
        };
    });
}

async function capture(step, extra = {}) {
    const name = String(report.trace.length + 1).padStart(2, '0') + '-' + step + '.png';
    const snapshot = await page.evaluate(() => {
        const dialog = document.querySelector('dialog.story-chapter-dialog[open]');
        return {
            viewport: [innerWidth, innerHeight],
            screens: [...document.querySelectorAll('.screen[id]:not(.hidden)')].map(node => node.id),
            dialogs: dialog ? [dialog.className] : [],
            text: dialog?.innerText.trim().slice(0, 2400) || '',
        };
    });
    await page.screenshot({ path: join(out, name), timeout: 6000, animations: 'disabled' });
    report.trace.push({ phase, step, screenshot: name, ...snapshot, ...extra });
    console.log(phase, step);
}

async function boot() {
    await page.goto(url.href, { waitUntil: 'domcontentloaded' });
    await page.locator('.menu-btn-quickplay--story').waitFor();
    await page.locator('#app-loading-overlay').waitFor({ state: 'hidden', timeout: 25000 });
}

async function chooseStarter() {
    const controls = [
        page.getByRole('button', { name: /^Begin →$/ }),
        page.locator('#modal-game-alert button:visible'),
        page.locator('.story-tutorial-overlay:visible .story-tutorial-continue'),
        page.locator('.story-narr-root:visible [data-narr-continue]'),
        page.locator('#prof-accept-btn:enabled:visible'),
        page.locator('#story-prof-rolled-card .prof-pick-card .mini-sprite:visible'),
        page.locator('#story-city-tips .story-city-objective:visible'),
    ];
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
        if (await page.evaluate(() => Boolean(JSON.parse(localStorage.getItem('pbs_story_save') || '{}').team?.length))) return;
        let clicked = false;
        for (const target of controls) {
            if (!await target.first().isVisible()) continue;
            if (!await target.first().tap({ trial: true, timeout: 250 }).then(() => true, () => false)) continue;
            await target.first().tap();
            clicked = true;
            break;
        }
        if (!clicked) await page.waitForTimeout(100);
    }
    throw Error('The starting journey did not save a starter');
}

async function newJourney(name) {
    await boot();
    await page.locator('.menu-btn-quickplay--story').tap();
    await page.locator('#screen-story-menu').waitFor({ timeout: 45000 });
    await page.locator('.story-menu-btn--new').tap();
    await page.locator('#story-create-name').fill(name);
    const input = page.locator('#story-create-seed');
    if (!await input.isVisible()) await page.locator('.story-create-advanced summary').tap();
    await input.fill(String(seed));
    await page.locator('#story-create-begin').tap();
    const confirm = page.locator('#modal-game-confirm');
    await page.waitForFunction(expected =>
        JSON.parse(localStorage.getItem('pbs_story_save') || '{}').trainerProfile?.name === expected ||
        !document.querySelector('#modal-game-confirm').classList.contains('hidden'), name);
    if (await confirm.isVisible()) await confirm.getByRole('button', { name: 'OK', exact: true }).tap();
    await page.waitForFunction(expected => JSON.parse(localStorage.getItem('pbs_story_save') || '{}')
        .trainerProfile?.name === expected, name);
    await chooseStarter();
    const saved = await progress();
    assert.equal(saved.seed, seed);
    return saved;
}

async function continueFromSave() {
    await boot();
    await page.locator('.menu-btn-quickplay--continue').tap();
}

async function waitForCityControl(target) {
    const overlay = page.locator([
        '#modal-game-alert button:visible',
        '.story-narr-root:visible [data-narr-continue]',
        '.story-tutorial-overlay:visible .story-tutorial-continue',
        '[data-arrival-dismiss]:visible',
    ].join(', ')).last();
    for (let pass = 0; pass < 45; pass++) {
        if (await overlay.isVisible() && await overlay.tap({ trial: true, timeout: 350 }).then(() => true, () => false)) {
            await overlay.tap();
            continue;
        }
        if (await target.isVisible() && await target.tap({ trial: true, timeout: 350 }).then(() => true, () => false)) return;
        await page.waitForTimeout(125);
    }
    throw Error('City control stayed blocked: ' + target);
}

async function checkpoint(chapterId) {
    const scene = catalog.get(chapterId);
    await page.evaluate(({ city }) => {
        const save = window.StoryMode.state;
        const destination = city ?? 9;
        save.eventIndex = window.STORY_EVENTS_RAW.findIndex(row => row[1] === 'City' && row[2] === 'City' + destination);
        if (save.eventIndex < 0) throw Error('No campaign city for checkpoint');
        save.citiesArrived = { ...save.citiesArrived, [destination]: true };
        save.badges = Math.min(8, destination - 1);
        save.gymCleared = Object.fromEntries(Array.from({ length: save.badges }, (_, index) => [index + 1, true]));
        if (city === null) {
            save.atCrucible = true;
            save.postHofMysteryClimaxDone = true;
            save._hofCountedThisRun = true;
        }
        if (!window.StoryMode.upgrades.save()) throw Error('Could not save chapter checkpoint');
    }, scene);
    await continueFromSave();
    await waitForCityControl(card(chapterId));
}

async function openScene(id) {
    await waitForCityControl(card(id));
    const chapter = catalog.get(id);
    if (chapter.hideSpeakerOnInvite) {
        const invitation = card(id).locator('..');
        assert.ok(!(await invitation.innerText()).includes(chapter.speaker.name));
    }
    await card(id).tap();
    await modal().waitFor();
    await modal().getByRole('heading', { name: chapter.title, exact: true }).waitFor();
}

async function readPanels() {
    const lines = new Set();
    for (let index = 0; index < 12; index++) {
        const current = modal().locator('.story-chapter-caption');
        if (await current.isVisible()) {
            const register = await current.evaluate(node => ({
                kind: node.closest('.story-chapter-body').dataset.chapterRegister,
                tag: node.tagName,
            }));
            assert.equal(register.tag, register.kind === 'speech' ? 'BLOCKQUOTE' : 'P');
            lines.add((await current.innerText()).trim());
        }
        const readingProgress = modal().getByRole('progressbar', { name: 'Scene progress' });
        if (await readingProgress.isVisible()) {
            assert.equal(await readingProgress.evaluate(node => node.value), index + 1, 'Progress must follow the visible panel');
        }
        if (!await control('next').isVisible()) return lines;
        await control('next').tap();
    }
    throw Error('Cinematic panel did not reach a choice or end');
}

function checkPanels(id, lines) {
    for (const panel of catalog.get(id).panels) assert.ok(lines.has(panel.text), 'Missing panel in ' + id);
}

async function pick(id, answer, { secret, echo, echoes = [] } = {}) {
    const lines = await readPanels();
    checkPanels(id, lines);
    if (echo) assert.ok(lines.has(echo), 'Previous choice did not change the scene');
    for (const line of echoes) assert.ok(lines.has(line), 'Missing a scene consequence from a previous choice');
    const scene = catalog.get(id);
    const option = scene.choices.find(choice => choice.id === answer);
    assert.equal(await control('next').count(), 0, 'The final line presents the choices without a duplicate advance');
    await modal().locator('[data-chapter-phase="choice"]').waitFor();
    if (id === 'chapter-1' || id === 'chapter-4' || id === 'chapter-7' || id === 'aftermath') await capture(id + '-choice');
    await modal().locator(`[data-adventure-pick="${answer}"]`).tap();
    await modal().getByText(option.reply, { exact: true }).waitFor();
    if (option.consequence && id === 'chapter-1') {
        const detail = modal().getByText('What changed', { exact: true });
        const outcome = detail.locator('..').locator('p');
        assert.equal(await outcome.isVisible(), false);
        await detail.tap();
        assert.equal(await outcome.innerText(), option.consequence);
        await detail.tap();
    }
    if (option.clue) {
        const evidence = modal().locator('.story-chapter-evidence');
        await evidence.getByText('Clue saved', { exact: true }).waitFor();
        await evidence.getByText(option.clue, { exact: true }).waitFor();
    }
    assert.equal((await progress()).choices[chosen(id)], answer);
    if (secret === false) {
        assert.equal(await control('secret').count(), 0, 'Discovery unlocked without its evidence');
        assert.equal((await progress()).choices[discovery(id)], undefined);
    }
    await capture(id + '-' + answer, { availableSecret: await control('secret').isVisible() });
    if (secret) {
        await control('secret').tap();
        await modal().getByText(scene.secret.text, { exact: true }).waitFor();
        await modal().getByRole('heading', { name: scene.secret.title, exact: true }).waitFor();
        assert.equal((await progress()).choices[discovery(id)], true);
        await capture(id + '-secret');
    }
    await control('done').tap();
    await modal().waitFor({ state: 'hidden' });
    assert.equal(await card(id).evaluate(node => document.activeElement === node), true, 'Return focuses invitation');
    if (option.townNote) await page.getByText(option.townNote, { exact: true }).waitFor();
}

async function visitChapter(id, answer) {
    const scene = catalog.get(id);
    const { choices } = await progress();
    const echoes = (scene.echoes || []).filter(entry => choices[chosen(entry.from)] === entry.choice).map(entry => entry.text);
    const hasClue = (entry, selection) => entry.choices.some(option => option.id === selection && option.clue);
    const secret = hasClue(scene, answer) && scene.secret.requires.every(requirement =>
        hasClue(catalog.get(requirement), choices[chosen(requirement)]));
    await checkpoint(id);
    await openScene(id);
    await pick(id, answer, { secret, echoes });
}

async function archive() {
    await page.locator('[data-adventure-archive]:visible').tap();
    await modal().getByRole('heading', { name: 'Field Archive', exact: true }).waitFor();
    const screening = modal().locator('.story-archive-screening');
    if (await screening.count()) {
        const quotes = screening.locator('blockquote');
        assert.equal(await quotes.first().isVisible(), false);
        const toggle = screening.getByText('Old screening', { exact: true });
        await toggle.tap();
        assert.deepEqual(await screening.locator('figcaption').allTextContents(), ['Meowth', 'Mewtwo']);
        assert.equal(await quotes.last().isVisible(), true);
        await toggle.tap();
    }
}

async function recovery() {
    await page.getByRole('button', { name: 'Settings', exact: true }).filter({ visible: true }).first().tap();
    await page.locator('#modal-settings').getByRole('button', { name: 'Data', exact: true }).tap();
    await page.locator('#modal-settings').getByRole('button', { name: 'Save & recovery', exact: true }).tap();
    const panel = page.locator('.upgrade-dialog');
    await panel.getByRole('heading', { name: 'Save & recovery', exact: true }).waitFor();
    return panel;
}

try {
    phase = 'clue-path-and-reload';
    const first = await newJourney('Chapter One');
    await checkpoint('chapter-1');
    const manager = await recovery();
    const [backup] = await Promise.all([
        page.waitForEvent('download'),
        manager.getByRole('button', { name: 'Download complete backup', exact: true }).tap(),
    ]);
    const backupBytes = await readFile(await backup.path());
    await manager.getByRole('button', { name: 'Close', exact: true }).tap();
    await page.locator('#modal-settings').getByRole('button', { name: 'Close settings', exact: true }).tap();
    await openScene('chapter-1');
    await control('next').tap();
    await capture('chapter-1-before-reload');
    assert.equal((await progress()).choices[chosen('chapter-1')], undefined);
    await continueFromSave();
    await openScene('chapter-1');
    await pick('chapter-1', 'listen', { secret: true });
    const firstClueRun = await progress();
    assert.ok(firstClueRun.id);
    if (first.id) assert.equal(firstClueRun.id, first.id);
    await continueFromSave();
    await openScene('chapter-1');
    await modal().getByText(catalog.get('chapter-1').choices[0].reply, { exact: true }).waitFor();
    assert.equal(await control('pick').count(), 0);
    await capture('chapter-1-saved-reply');
    const beforeReadAgain = await progress();
    await control('read').tap();
    checkPanels('chapter-1', await readPanels());
    assert.equal(await control('pick').count(), 0, 'Reading a committed scene cannot change its answer');
    await control('done').tap();
    assert.equal(await control('read').evaluate(button => button === document.activeElement), true);
    assert.deepEqual(await progress(), beforeReadAgain);
    await control('done').tap();
    await modal().waitFor({ state: 'hidden' });

    phase = 'readonly-replay';
    const beforeReplay = await progress();
    await archive();
    const rubbing = modal().locator('[data-adventure-keepsake="survey-rubbing"]');
    await rubbing.tap();
    await modal().getByRole('heading', { name: 'Survey Rubbing', exact: true }).waitFor();
    await modal().getByText(/A graphite circle with a dent/).waitFor();
    await page.waitForFunction(() => document.querySelector('.story-archive-keepsake-art')?.naturalWidth === 192);
    await capture('chapter-1-survey-rubbing');
    await control('done').tap();
    assert.equal(await rubbing.evaluate(button => button === document.activeElement), true);
    assert.equal(await modal().locator('[data-adventure-replay="chapter-2"]').count(), 0);
    const firstChapterReplay = modal().locator('[data-adventure-replay="chapter-1"]');
    await firstChapterReplay.tap();
    checkPanels('chapter-1', await readPanels());
    assert.equal(await control('pick').count(), 0);
    assert.equal(await control('secret').count(), 0);
    await capture('chapter-1-readonly-replay');
    await control('done').tap();
    assert.equal(await firstChapterReplay.evaluate(button => button === document.activeElement), true);
    const discovery = modal().locator('[data-adventure-replay-secret="chapter-1"]');
    await discovery.tap();
    await modal().getByText(catalog.get('chapter-1').secret.text, { exact: true }).waitFor();
    await control('done').tap();
    assert.equal(await discovery.evaluate(button => button === document.activeElement), true);
    await control('close').tap();
    await modal().waitFor({ state: 'hidden' });
    assert.deepEqual(await progress(), beforeReplay, 'Replay changed progress');

    phase = 'same-run-backup-restore';
    const restore = await recovery();
    await restore.locator('input[type="file"]').setInputFiles({
        name: 'earlier-backup.json', mimeType: 'application/json', buffer: backupBytes,
    });
    await restore.getByRole('heading', { name: 'Review restoration', exact: true }).waitFor();
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
        restore.getByRole('button', { name: 'Restore this backup', exact: true }).tap(),
    ]);
    await page.locator('.menu-btn-quickplay--continue').tap();
    await card('chapter-1').waitFor();
    assert.deepEqual(await progress(), beforeReplay, 'Same-run restore erased a chapter choice or discovery');
    await openScene('chapter-1');
    await modal().getByText(catalog.get('chapter-1').choices[0].reply, { exact: true }).waitFor();
    await capture('chapter-1-restored-choice');
    await control('done').tap();
    await modal().waitFor({ state: 'hidden' });

    phase = 'clue-followthrough';
    await checkpoint('chapter-2');
    await openScene('chapter-2');
    const echoes = catalog.get('chapter-2').echoes;
    await pick('chapter-2', 'act', { secret: true, echo: echoes.find(echo => echo.choice === 'listen').text });
    const firstAnswers = ['act', 'listen', 'listen', 'listen', 'listen', 'listen', 'listen', 'listen'];
    const laterChapters = ['chapter-3', 'chapter-4', 'chapter-5', 'chapter-6', 'chapter-7', 'chapter-8', 'chapter-9', 'aftermath'];
    for (const [index, id] of laterChapters.entries()) await visitChapter(id, firstAnswers[index]);

    phase = 'missed-clue-and-other-ending';
    await page.setViewportSize({ width: 844, height: 390 });
    await newJourney('Chapter Two');
    await checkpoint('chapter-1');
    await openScene('chapter-1');
    await pick('chapter-1', 'act', { secret: false });
    const second = await progress();
    assert.notEqual(second.id, firstClueRun.id);
    assert.equal(second.seed, firstClueRun.seed);
    assert.equal(second.archive.runs[firstClueRun.id].choices['chapter-1'], 'listen');
    assert.equal(second.archive.runs[second.id].choices['chapter-1'], 'act');
    await checkpoint('chapter-2');
    await openScene('chapter-2');
    await pick('chapter-2', 'listen', { secret: false, echo: echoes.find(echo => echo.choice === 'act').text });
    for (const [index, id] of laterChapters.entries()) await visitChapter(id, firstAnswers[index] === 'act' ? 'listen' : 'act');

    phase = 'archive-afterword';
    const final = await progress();
    assert.equal(final.archive.runs[firstClueRun.id].choices.aftermath, 'listen');
    assert.equal(final.archive.runs[second.id].choices.aftermath, 'act');
    await archive();
    assert.equal(await modal().locator('[data-adventure-replay="chapter-1"]').count(), 2);
    const firstRunSecondChapter = modal().locator('[data-adventure-replay="chapter-2"]')
        .filter({ hasText: catalog.get('chapter-2').choices.find(option => option.id === 'act').label });
    await firstRunSecondChapter.tap();
    const replay = await readPanels();
    assert.ok(replay.has(echoes.find(echo => echo.choice === 'listen').text), 'Replay must show the recorded run’s context');
    assert.ok(!replay.has(echoes.find(echo => echo.choice === 'act').text), 'An active run must not overwrite the recorded context');
    await control('done').tap();
    await control('close').tap();
    await modal().waitFor({ state: 'hidden' });
    await page.evaluate(({ runId, archive }) => {
        const meta = JSON.parse(localStorage.getItem('pbs_story_meta'));
        // One recorded answer can occur in different journeys with different evidence.
        // Seed only the missing archive variant without replaying the active campaign.
        const run = archive.runs[runId];
        meta.adventureArchive.runs['run-test-replay-with-echo'] = { ...run, choices: { ...run.choices, 'chapter-2': 'act' } };
        localStorage.setItem('pbs_story_meta', JSON.stringify(meta));
    }, { runId: second.id, archive: final.archive });
    const beforeAlternateReplay = await progress();
    await archive();
    await firstRunSecondChapter.tap();
    const journeys = modal().locator('[data-adventure-replay-journey="chapter-2"]');
    assert.equal(await journeys.count(), 2, 'Equivalent answers with distinct earlier evidence have different read-only journeys');
    await journeys.filter({ hasText: catalog.get('chapter-1').choices.find(option => option.id === 'act').label }).tap();
    const alternate = await readPanels();
    assert.ok(alternate.has(echoes.find(echo => echo.choice === 'act').text));
    assert.ok(!alternate.has(echoes.find(echo => echo.choice === 'listen').text));
    await control('done').tap();
    assert.deepEqual(await progress(), beforeAlternateReplay, 'Archive branch selection changed a recorded journey');
    await page.evaluate(() => {
        const meta = JSON.parse(localStorage.getItem('pbs_story_meta'));
        delete meta.adventureArchive.runs['run-test-replay-with-echo'];
        localStorage.setItem('pbs_story_meta', JSON.stringify(meta));
    });
    const afterword = modal().locator('[data-adventure-reward]');
    await afterword.tap();
    await modal().getByRole('heading', { name: 'The Keeper’s Spare Copy', exact: true }).waitFor();
    const epilogue = await readPanels();
    assert.ok([...epilogue].some(line => line.includes('Both have your handwriting.')), 'Archive afterword is empty');
    assert.equal(await control('pick').count(), 0);
    await capture('afterword');
    await control('done').tap();
    await control('close').tap();
    await modal().waitFor({ state: 'hidden' });

    const clerkCopy = page.locator('[data-adventure-crucible-keepsake="keepers-spare-copy"]:visible');
    await clerkCopy.tap();
    await modal().getByText(/Two dispatches sit beneath the same brass key/).waitFor();
    await capture('crucible-clerk-copy');
    await control('done').tap();
    await modal().waitFor({ state: 'hidden' });
    assert.equal(await clerkCopy.evaluate(button => button === document.activeElement), true);
    assert.deepEqual(await progress(), final);
    assert.deepEqual(errors, []);
    report.progress = final;
    report.status = 'passed';
} catch (error) {
    report.status = 'failed';
    report.findings.push({ phase, issue: error.stack, errors });
    await capture('blocked').catch(() => {});
    process.exitCode = 1;
    console.error(error);
} finally {
    await browser.close();
    await writeFile(join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(join(out, 'report.json'));
}
