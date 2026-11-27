import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const url = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5173/battle.html');
url.searchParams.set('testmega', '1');
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });

try {
    for (const viewport of [{ width: 320, height: 568 }, { width: 568, height: 260 }]) {
        const context = await browser.newContext({ viewport, hasTouch: true, isMobile: true,
            reducedMotion: 'reduce', serviceWorkers: 'block' });
        try {
            await context.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
            const page = await context.newPage();
            page.setDefaultTimeout(8000);
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(url.href, { waitUntil: 'domcontentloaded' });
            await page.waitForFunction(() => window.StoryMode?.state?.active);
            await page.evaluate(() => {
                // Start at an unlocked postgame hub. All field-tool and service interactions use visible controls.
                const run = window.StoryMode.state;
                run.badges = 8;
                run.postHofMysteryClimaxDone = true;
                (run.inventory ??= {}).heartScale = 1;
                (run.facilityIntros ??= {}).bag = true;
                run.facilityIntros.party = true;
                run.facilityIntros.tutor = true;
                (run.npcStageSeen ??= {}).tutor = 2;
                window.StoryMode.enterCrucible();
            });
            await page.locator('#app-loading-overlay').waitFor({ state: 'hidden' });
            const hub = page.getByRole('region', { name: 'The Crucible', exact: true });
            const tools = hub.getByRole('navigation', { name: 'Field tools' });
            const tool = name => tools.getByRole('button', { name, exact: true });
            for (const name of ['Party', 'Bag', 'Trainer’s Notebook', 'Pokédex', 'Journey Atlas']) {
                const button = tool(name);
                await button.click({ trial: true });
                const bounds = await button.boundingBox();
                assert.ok(bounds.height >= 44 && bounds.x >= 0 && bounds.x + bounds.width <= viewport.width, name);
            }
            await tool('Party').click();
            const party = page.locator('#modal-story-party');
            await party.waitFor();
            await page.keyboard.press('Escape');
            await party.waitFor({ state: 'hidden' });

            await tool('Trainer’s Notebook').click();
            const notebook = page.getByRole('dialog', { name: 'Trainer’s Notebook' });
            await notebook.getByRole('heading', { name: 'Choose a challenge at the Crucible' }).waitFor();
            await notebook.getByText('Services at the Crucible', { exact: true }).click();
            for (const name of ['Pokémart', 'Department Store', 'Relics', 'Poké Game Corner']) {
                await notebook.getByRole('button', { name: `Visit ${name}`, exact: true }).waitFor();
            }
            await notebook.getByRole('button', { name: 'Visit Move Tutor' }).click();
            const tutor = page.getByRole('region', { name: 'Training Facility' });
            const lesson = page.getByRole('dialog', { name: 'Move Tutor', exact: true });
            await lesson.locator('.story-tutorial-continue').click();
            await tutor.getByRole('button', { name: 'Back to The Crucible' }).first().click();

            await tool('Bag').click();
            const countHeartScales = () => page.evaluate(() => window.StoryMode.state.inventory.heartScale);
            const before = await countHeartScales();
            const bag = page.locator('#modal-story-bag');
            const heartScale = bag.locator('[data-bag-item="heartScale"]');
            await heartScale.locator('summary').click();
            const voucher = heartScale.getByRole('button', { name: 'Visit Move Tutor with this voucher' });
            await voucher.click();
            await tutor.getByRole('button', { name: 'Back to Bag' }).first().click();
            await voucher.waitFor();
            assert.equal(await voucher.evaluate(node => node === document.activeElement), true);
            assert.equal(await countHeartScales(), before);
            await bag.getByRole('button', { name: 'Close', exact: true }).click();

            await tool('Pokédex').click();
            const collection = page.getByRole('region', { name: 'Collection' });
            await collection.waitFor();
            await page.keyboard.press('Escape');
            await hub.waitFor();

            await tool('Journey Atlas').click();
            await page.getByRole('dialog', { name: 'Journey Atlas' }).waitFor();
            assert.deepEqual(errors, []);
            console.log(`Crucible field tools, local services and voucher return passed at ${viewport.width}×${viewport.height}`);
        } finally {
            await context.close();
        }
    }
} finally {
    await browser.close();
}
