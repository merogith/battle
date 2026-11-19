import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const target = new URL(process.env.BATTLE_TEST_URL || 'http://127.0.0.1:5173/battle.html');
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', reducedMotion: 'no-preference' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => new URL(route.request().url()).origin === target.origin ? route.continue() : route.abort());
    await page.goto(target.href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.BattleMoveProfiles && window.BattleMotion);

    const result = await page.evaluate(async () => {
        const registry = window.BattleMoveProfiles;
        const stage = document.createElement('div');
        const source = document.createElement('div');
        const target = document.createElement('div');
        stage.style.cssText = 'position:fixed;left:0;top:0;width:320px;height:410px;overflow:hidden';
        source.style.cssText = 'position:absolute;left:15px;bottom:50px;width:70px;height:70px';
        target.style.cssText = 'position:absolute;right:15px;top:50px;width:70px;height:70px';
        stage.append(source, target);
        document.body.append(stage);

        // Advance the canvas clock in controlled increments. This is a renderer
        // safety check, while battle-motion.mjs tests ordinary browser timing.
        const originalNow = performance.now.bind(performance);
        const originalFrame = window.requestAnimationFrame;
        const context = CanvasRenderingContext2D.prototype;
        const originalFill = context.fill;
        const originalStroke = context.stroke;
        let clock = 0;
        let painted = 0;
        const failures = [];
        const families = {};
        performance.now = () => clock;
        window.requestAnimationFrame = callback => {
            queueMicrotask(() => callback(clock += 45));
            return 0;
        };
        context.fill = function (...args) { originalFill.apply(this, args); if (this.canvas.parentElement === stage) painted++; };
        context.stroke = function (...args) { originalStroke.apply(this, args); if (this.canvas.parentElement === stage) painted++; };
        try {
            for (const id of registry.ids()) {
                const profile = registry.get(id);
                const from = source;
                const to = ['self', 'ally', 'ally-side'].includes(profile.target) ? source : target;
                let contacts = 0;
                painted = 0;
                const run = window.BattleMotion.createRun(stage, { rate: () => 1, valid: () => true });
                try {
                    await run.play(profile, { from, to, outcome: profile.category === 'Status' ? 'effect' : 'hit', onImpact: () => contacts++ });
                    if (!painted || contacts !== 1) failures.push({ id, painted, contacts });
                } catch (error) {
                    failures.push({ id, error: String(error) });
                } finally {
                    run.stop();
                }
                if (stage.querySelector('canvas')) failures.push({ id, error: 'Canvas remained after stop' });
                families[profile.family] = (families[profile.family] || 0) + 1;
            }
        } finally {
            performance.now = originalNow;
            window.requestAnimationFrame = originalFrame;
            context.fill = originalFill;
            context.stroke = originalStroke;
            stage.remove();
        }
        return { moves: registry.ids().length, authored: registry.authoredIds().length, families, failures };
    });
    if (process.env.BATTLE_MOTION_CATALOG_OUT) {
        await writeFile(process.env.BATTLE_MOTION_CATALOG_OUT, JSON.stringify({ ...result, pageErrors: errors }, null, 2) + '\n');
    }
    assert.deepEqual(result.failures, []);
    assert.deepEqual(errors, []);
    assert.equal(result.moves, 954);
    console.log(`Rendered all ${result.moves} moves across ${Object.keys(result.families).length} effect families.`);
} finally {
    await browser.close();
}
