import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const url = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5173/battle.html');
const output = process.env.BATTLE_PLAYTEST_OUT;
if (output) await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });

async function launchTown(page, city, inheritedChoices = {}) {
    await page.evaluate(({ city, inheritedChoices }) => {
        const rows = window.STORY_EVENTS_RAW;
        const eventIndex = rows.findIndex(row => row[1] === 'City' && row[2] === `City${city}`);
        const gym = rows.find(row => row[2] === `Gym Leader ${city}`);
        window.__storyTest.sm = {
            ...window.__storyTest.sm, active: true, storyDifficulty: 'normal',
            trainerProfile: { name: 'Traveler', sprite: 'Youngster' }, version: window.__STORY_SAVE_VER,
            eventIndex, runSeed: 52341, roadDiscoveriesEnabled: true, badges: city - 1,
            team: [{ name: 'Eevee', build: window.makeBuild('Eevee'), id: 'starter' }],
            settings: { enabledGens: [1] }, trainerAssignments: gym ? { [gym[0]]: 'Brock' } : {},
            storyEventsFired: {}, citiesArrived: {}, storyChoices: inheritedChoices,
            wanderByEventIdx: {}, campByEventIdx: {}, gymCleared: {}, errands: {},
            balls: { poke: 2, great: 0, ultra: 0, master: 0 }, inventory: { potion: 0 }, gold: 3000,
        };
        window.StoryMode.enterCity();
    }, { city, inheritedChoices });
}

async function enterAfterRoad(page) {
    const choose = page.locator('.story-road-discovery:visible [data-narr-continue]');
    await choose.click();
    const backToTown = page.locator('[data-wander-moveon]:visible');
    const enter = page.locator('[data-arrival-dismiss]:visible');
    await backToTown.or(enter).first().waitFor();
    if (await backToTown.isVisible()) await backToTown.click();
    await enter.click();
    await acknowledgeTips(page);
}

async function acknowledgeTips(page) {
    const okay = page.locator('#modal-game-alert:visible').getByRole('button', { name: 'OK' });
    for (let i = 0; i < 5 && await okay.isVisible(); i++) await okay.click();
}

try {
    const context = await browser.newContext({
        viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true,
        reducedMotion: 'reduce', serviceWorkers: 'block',
    });
    await context.addInitScript(() => { window.__testHarness = true; });
    await context.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    const options = [
        ['scout', 'Culvert marked on the shift board'],
        ['help', 'Warning lamp relit'],
        ['pass', 'Relief crew due at dawn'],
    ];
    for (const [index, [id, title]] of options.entries()) {
        await page.goto(url.href, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => Boolean(window.__testReady));
        await launchTown(page, 1);
        const decision = page.locator(`.story-road-discovery:visible [data-narr-choice-idx="${index}"]`);
        await decision.click();
        await enterAfterRoad(page);
        assert.equal(await page.locator('#story-hud-city').textContent(), 'Flintreach Town');
        const visitor = page.locator('#story-city-visitor');
        assert.equal(await visitor.textContent(), 'Brock, the Rock-type Gym Leader, is visiting from Pewter City.');
        assert.match(await visitor.evaluate(node => getComputedStyle(node).fontFamily), /system-ui/);
        const card = page.locator('#story-world-city');
        assert.equal(await card.locator('summary').textContent(), title);
        await card.locator('summary').click();
        const entry = card.locator(`[data-world-source="road"][data-world-choice="${id}"]`);
        await entry.waitFor({ state: 'visible' });
        assert.match(await entry.locator('p').evaluate(node => getComputedStyle(node).fontFamily), /system-ui/);
        await page.waitForFunction(choice => {
            const image = document.querySelector(`[data-world-source="road"][data-world-choice="${choice}"] img`);
            return image?.complete && image.naturalWidth === 192;
        }, id);
        assert.equal(await page.evaluate(() => window.__storyTest.sm.storyChoices['road.discovery.1']), id);
        assert.equal(await page.evaluate(() => window.__storyTest.sm.balls.poke), id === 'help' ? 3 : 2);
        if (output) await page.screenshot({ path: join(output, `flintreach-${id}.png`) });
        console.log(`Flintreach ${id} stayed in the city with its own notice and receipt.`);
    }

    // The Atlas only reads the run. Closing it returns to the same control.
    const snapshot = () => page.evaluate(() => {
        const run = window.StoryMode.state;
        return { index: run.eventIndex, rng: run._strngState, choices: run.storyChoices, gold: run.gold };
    });
    const beforeAtlas = await snapshot();
    const openAtlas = page.getByRole('button', { name: 'Journey Atlas', exact: true });
    await openAtlas.click();
    const atlas = page.getByRole('dialog', { name: 'Journey Atlas' });
    await atlas.waitFor();
    assert.match(await atlas.getByRole('list', { name: 'Journey stops' }).innerText(), /Flintreach Town\s+Here/);
    assert.match(await atlas.getByRole('list', { name: 'Journey stops' }).innerText(), /Kettlestone Town\s+Known/);
    assert.equal(await atlas.locator('.world-atlas-stop.locked').count(), 1);
    assert.doesNotMatch(await atlas.innerText(), /Vespergate/);
    if (output) await page.screenshot({ path: join(output, 'journey-atlas.png') });
    await atlas.getByRole('button', { name: 'Back', exact: true }).press('Escape');
    assert.equal(await atlas.count(), 0);
    assert.equal(await openAtlas.evaluate(el => el === document.activeElement), true);
    assert.deepEqual(await snapshot(), beforeAtlas);
    console.log('Journey Atlas preserves the run and restores focus.');

    // Loss of optional illustrated art leaves the town and its objective intact.
    await page.route('**/flintreach-quarry.webp', route => route.abort());
    await page.goto(url.href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => Boolean(window.__testReady));
    await launchTown(page, 1, { 'road.discovery.1': 'help' });
    const moveOn = page.locator('[data-wander-moveon]:visible');
    const enterFallbackTown = page.locator('[data-arrival-dismiss]:visible');
    await moveOn.or(enterFallbackTown).first().waitFor();
    if (await moveOn.isVisible()) await moveOn.click();
    await enterFallbackTown.click();
    await acknowledgeTips(page);
    await page.waitForFunction(() => {
        const plate = document.querySelector('#story-city-identity .world-scene-plate');
        return plate?.complete && plate.naturalWidth > 0 && plate.src.endsWith('/city-1.svg');
    });
    assert.equal(await page.locator('.story-city-objective').isVisible(), true);
    await page.unroute('**/flintreach-quarry.webp');

    // Stable row 1 follows the intro rival before any wild interruptions.
    const departureShown = await page.evaluate(() => {
        const rows = window.STORY_EVENTS_RAW;
        const eventIndex = rows.findIndex(row => row[0] === 1);
        Object.assign(window.__storyTest.sm, { eventIndex, routeShown: {}, roadDiscoveriesEnabled: false });
        window.__testDepartureContinued = false;
        return window.__storyTest.maybeShowRouteInterstitial(rows[eventIndex], () => { window.__testDepartureContinued = true; });
    });
    assert.equal(departureShown, true);
    const departure = page.locator('.world-road-departure');
    await departure.waitFor();
    assert.match(await departure.innerText(), /To Flintreach Town/i);
    await page.waitForFunction(() => {
        const plate = document.querySelector('.world-road-departure .world-scene-plate');
        return plate?.complete && plate.naturalWidth > 0 && plate.src.endsWith('/route1-unlit-signal.webp');
    });
    if (output) await page.screenshot({ path: join(output, 'breakwater-departure.png') });
    await departure.getByRole('button', { name: /Set out/ }).click();
    await page.waitForFunction(() => window.__testDepartureContinued);
    assert.equal(await page.evaluate(() => window.__storyTest.sm.roadDiscoveriesEnabled), true);

    await page.setViewportSize({ width: 568, height: 320 });
    await page.goto(url.href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => Boolean(window.__testReady));
    await launchTown(page, 4, { 'road.discovery.4': 'pass', 'adventure.chapter-3': 'listen' });
    const wander = page.locator('[data-wander-moveon]:visible');
    const arrive = page.locator('[data-arrival-dismiss]:visible');
    await wander.or(arrive).first().waitFor();
    if (await wander.isVisible()) await wander.click();
    await arrive.click();
    await acknowledgeTips(page);
    const notes = page.locator('#story-world-city');
    assert.match(await notes.locator('summary').textContent(), /Next warden shift · 2 notes/);
    await notes.locator('summary').click();
    const privateNote = notes.locator('[data-world-source="chapter-3"]');
    await privateNote.waitFor({ state: 'visible' });
    assert.match(await privateNote.textContent(), /Private field note.*Private duty-desk appointment.*away from the duty board/s);
    assert.ok(await notes.evaluate(node => node.scrollWidth <= node.clientWidth));
    if (output) await page.screenshot({ path: join(output, 'reedmarket-private-field-note.png') });
    console.log('Reedmarket kept the previous chapter’s private note in the town disclosure.');
    assert.deepEqual(errors, []);
} finally {
    await browser.close();
}
