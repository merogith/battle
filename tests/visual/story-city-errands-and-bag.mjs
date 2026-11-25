import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const url = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5173/battle.html');
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
const context = await browser.newContext({ viewport: { width: 390, height: 844 },
    hasTouch: true, isMobile: true, reducedMotion: 'reduce', serviceWorkers: 'block' });
await context.addInitScript(() => { window.__testHarness = true; });
await context.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
const page = await context.newPage();
page.setDefaultTimeout(8000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));

const button = (name, host = page) => host.getByRole('button', { name, exact: typeof name === 'string' });
const offer = button(/Optional errand/);
const scene = page.locator('.story-narr-root:visible');
const bag = page.locator('#modal-story-bag');
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('pbs_story_save')));

async function setCheckpoint(city, fresh = false) {
    // Fixture only establishes a visited hub. All offer, recovery and Bag
    // interactions below use the controls shown on the actual game screens.
    await page.evaluate(({ city, fresh }) => {
        const key = 'pbs_story_save';
        const rows = window.STORY_EVENTS_RAW;
        const eventIndex = rows.findIndex(row => row[1] === 'City' && row[2] === `City${city}`);
        const makeMon = (name, id, atk) => {
            const build = window.makeBuild(name);
            return { name, id, build: { ...build, ivs: { ...build.ivs, atk } } };
        };
        const state = fresh ? {
            ...window.__storyTest.sm, active: true, storyDifficulty: 'normal', runSeed: 484,
            trainerProfile: { name: 'Collector', sprite: 'Youngster' }, version: window.__STORY_SAVE_VER,
            badges: 0, settings: { enabledGens: [1] },
            team: [makeMon('Eevee', 'starter', 2), makeMon('Pikachu', 'maxed', 31)],
            pcBox: [makeMon('Squirtle', 'stored', 5)],
            trainerAssignments: { [rows.find(row => row[2] === 'Gym Leader 1')[0]]: 'Fantina' },
            storyEventsFired: {}, citiesArrived: { 1: true, 2: true, 4: true, 5: true },
            facilityIntros: { bag: true }, storyChoices: {}, errands: {}, npcsMet: {},
            balls: { poke: 1, great: 2, ultra: 0, master: 0 }, gold: 3000,
            inventory: city === 1 ? { protein: 1, calcium: 1 } : {},
        } : JSON.parse(localStorage.getItem(key));
        state.eventIndex = eventIndex;
        window.__storyTest.sm = state;
        if (!window.StoryMode.upgrades.save()) throw Error('Could not save the arrived fixture');
    }, { city, fresh });
}

async function openStoryMenu() {
    await page.locator('#app-loading-overlay').waitFor({ state: 'hidden', timeout: 28000 });
    await button('◆ Story Mode').click();
    await button('▶ Continue Run').waitFor();
}

async function continueRun() {
    await button('▶ Continue Run').click();
    const alert = button('OK', page.locator('#modal-game-alert'));
    if (await alert.isVisible()) await alert.click();
}

async function reloadToStoryMenu() {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await openStoryMenu();
}

try {
    await page.goto(url.href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => Boolean(window.__testReady));
    await setCheckpoint(1, true);
    await openStoryMenu();
    assert.match(await page.locator('#story-menu-resume-meta').innerText(), /Party 2\/2/);
    assert.match(await page.locator('#story-menu-resume-status').innerText(), /Currently at Flintreach Town/);
    await continueRun();
    await page.getByRole('heading', { name: 'Flintreach Town', exact: true }).waitFor();

    await button('Bag (4 types)').click();
    const calcium = bag.locator('.story-bag-item').filter({ hasText: 'Calcium' });
    assert.match(await calcium.innerText(), /Sp\. Atk IV by 3 \(cap 31\)\./);
    const protein = bag.locator('.story-bag-item').filter({ hasText: 'Protein' });
    assert.doesNotMatch(await protein.innerText(), /31\)\.\./);
    await button('Use', protein).press('Enter');
    assert.equal(await page.locator(':focus').innerText(), '← Back to Bag');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').getAttribute('aria-label'), 'Apply Protein to Eevee in your party, Atk IV 2 to 5');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').getAttribute('aria-label'), 'Apply Protein to Squirtle in PC storage, Atk IV 5 to 8');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Enter');
    await bag.getByRole('heading', { name: 'Your Bag' }).waitFor();
    assert.equal((await saved()).team[0].build.ivs.atk, 5);
    assert.equal((await saved()).inventory.protein, undefined);
    await button('Sell 250G', bag.locator('.story-bag-item').filter({ hasText: 'Poké Ball' })).click();
    await button('Close', bag).click();
    await button('Bag (2 types)').waitFor();

    await offer.click();
    assert.match(await offer.innerText(), /Talk to Mine Foreman/);
    assert.match(await scene.innerText(), /Mine Foreman/i);
    assert.match(await scene.innerText(), /Flintreach Town/i);
    await button(/Not right now/, scene).click();
    assert.equal(await scene.locator('[data-narr-body]').evaluate(node => node === document.activeElement), true);
    await button('Continue →', scene).click();
    await offer.waitFor();
    assert.equal(await offer.evaluate(node => node === document.activeElement), true);
    assert.equal((await saved()).errands.deliver_route_ledger, undefined);
    await offer.click();
    await button(/Take the job/, scene).click();
    assert.equal((await saved()).errands.deliver_route_ledger.state, 'active');
    await reloadToStoryMenu();
    await continueRun();
    await page.getByRole('heading', { name: 'Flintreach Town', exact: true }).waitFor();
    assert.equal(await offer.count(), 0);
    await setCheckpoint(2);
    await reloadToStoryMenu();
    await continueRun();
    const ledger = button(/Hand over Sealed Ledger/);
    const gold = (await saved()).gold;
    await ledger.click();
    assert.match(await scene.innerText(), /Reward: 1,200 G/);
    await button('Continue →', scene).click();
    assert.equal((await saved()).gold, gold + 1200);
    assert.equal(await ledger.count(), 0);

    await setCheckpoint(4, true);
    await reloadToStoryMenu();
    await continueRun();
    await button('Bag (2 types)').waitFor();
    await offer.click();
    await button(/Take the job/, scene).click();
    await button('Continue →', scene).click();
    const pouch = button(/Hand over Warden’s Pouch/);
    assert.equal(await pouch.count(), 0);
    assert.equal((await saved()).errands.recover_trail_pouch.recovered, undefined);
    await setCheckpoint(5);
    await reloadToStoryMenu();
    await continueRun();
    await button(/Pick up the pouch/, scene).click();
    assert.equal((await saved()).errands.recover_trail_pouch.recovered, true);
    await reloadToStoryMenu();
    await continueRun();
    await pouch.click();
    await button('Continue →', scene).click();
    assert.equal((await saved()).errands.recover_trail_pouch.state, 'done');
    assert.equal((await saved()).balls.ultra, 1);
    assert.equal(await pouch.count(), 0);

    assert.deepEqual(errors, []);
    console.log('Passed city summary, keyboard vitamin use, errand decline, acceptance and recovery across reloads.');
} catch (error) {
    console.error((await page.locator('body').ariaSnapshot()).slice(0, 6500));
    throw error;
} finally {
    await browser.close();
}
