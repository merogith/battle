import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const url = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5173/battle.html');
const out = process.env.BATTLE_PLAYTEST_OUT;
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
const report = [];

async function installProbe(page) {
    // Observe original Chromium media elements and Web Audio gain. No playback mocks.
    await page.addInitScript(() => {
        const NativeAudio = window.Audio;
        const connect = AudioNode.prototype.connect;
        window.audioProbe = { elements: [], masters: [] };
        window.Audio = function (...args) {
            const audio = new NativeAudio(...args);
            window.audioProbe.elements.push({ audio, requestedSource: args[0] || '' });
            return audio;
        };
        window.Audio.prototype = NativeAudio.prototype;
        AudioNode.prototype.connect = function (...args) {
            if (args[0] === this.context.destination && this instanceof GainNode) window.audioProbe.masters.push(this);
            return connect.apply(this, args);
        };
    });
}

try {
    for (const [width, height, touch] of [[390, 844, true], [1440, 900, false]]) {
        const reducedMotion = touch ? 'reduce' : 'no-preference';
        const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch, reducedMotion });
        const page = await context.newPage();
        const errors = [];
        const requests = [];
        await page.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
        page.on('pageerror', err => errors.push(err.message));
        page.on('response', res => {
            if (/\.(mp3|wav)$/.test(res.url())) requests.push({ path: new URL(res.url()).pathname, status: res.status() });
        });
        await installProbe(page);
        const press = target => touch ? target.tap() : target.click();
        const gear = page.getByRole('button', { name: 'Settings', exact: true }).filter({ visible: true }).first();
        const close = page.getByRole('button', { name: 'Close settings' });
        const audio = page.locator('#modal-settings').getByRole('button', { name: 'Audio', exact: true });
        const toggle = async id => {
            const control = page.locator(`label[for="${id}"]`);
            if (id === 'sw-generative-music' && !await control.isVisible()) {
                await press(page.getByText('Soundtrack options', { exact: true }));
            }
            await press(control);
        };
        const state = () => page.evaluate(() => ({
            playing: window.audioProbe.elements.filter(({ audio }) => !audio.paused && !audio.ended).map(({ audio }) => new URL(audio.src).pathname),
            generated: window.ChiptuneEngine.isPlaying(), mood: window.ChiptuneEngine.currentMood(),
            gain: window.audioProbe.masters.at(-1)?.gain.value ?? null,
        }));
        const waitForField = () => page.waitForFunction(() => window.audioProbe.elements.some(({ audio }) =>
            audio.src.includes('/music/background/short') && audio.currentTime > 0 && !audio.paused));

        await page.goto(url.href, { waitUntil: 'domcontentloaded' });
        await page.locator('#app-loading-overlay').waitFor({ state: 'hidden' });
        await press(gear);
        assert.equal(await page.locator('#settings-motion-note').isVisible(), touch);
        await press(audio);
        await waitForField();
        const field = await state();
        assert.equal(field.playing.length, 1);

        // Verify actual file playback, a single foreground layer, and a short win cue.
        for (const [mood, file] of [['rival', 'rival-pursuit'], ['leader', 'gym-bout'], ['elite', 'league-chamber'], ['raid', 'raid-omen']]) {
            const path = new URL(`music/themes/${file}.mp3`, url).pathname;
            await page.evaluate(key => window.AudioSystem.playBattleTheme(key), mood);
            await page.waitForFunction(track => {
                const playing = window.audioProbe.elements.filter(({ audio }) => !audio.paused && !audio.ended);
                return playing.length === 1 && playing[0].audio.src.endsWith(track) && playing[0].audio.currentTime > 0;
            }, path);
            assert.ok(requests.some(entry => entry.path === path && entry.status < 400));
        }
        await page.evaluate(() => window.AudioSystem.endBattleTheme(true));
        const victoryLength = await page.waitForFunction(() => window.audioProbe.elements.find(({ audio, requestedSource }) =>
            requestedSource.endsWith('/victory.mp3') && Number.isFinite(audio.duration))?.audio.duration);
        assert.ok(await victoryLength.jsonValue() < 4);
        await waitForField();

        await page.evaluate(() => window.AudioSystem.playStoryMotif('gallery'));
        await page.waitForFunction(() => window.audioProbe.elements.some(({ audio, requestedSource }) =>
            requestedSource.endsWith('/the-portrait.mp3') && audio.currentTime > 0 && !audio.paused));
        const gallery = await state();
        assert.equal(gallery.playing.length, 1);
        assert.match(gallery.playing[0], /\/music\/story\/the-portrait\.mp3$/);
        await toggle('sw-music');
        assert.deepEqual((await state()).playing, []);
        assert.equal(await page.evaluate(() => window.AudioSystem.storyMotifPlaying()), false);
        await toggle('sw-music');
        await waitForField();
        const volume = page.getByRole('slider', { name: 'Music volume' });
        await toggle('sw-generative-music');
        await volume.fill('28');
        await page.waitForFunction(() => window.ChiptuneEngine.isPlaying() && Math.abs(window.audioProbe.masters.at(-1)?.gain.value - 0.0896) < 0.006);
        assert.deepEqual((await state()).playing, []);
        await volume.fill('0');
        await page.waitForFunction(() => window.audioProbe.masters.at(-1)?.gain.value === 0);
        assert.equal((await state()).generated, false);
        await volume.fill('24');
        await toggle('sw-music');
        assert.equal((await state()).generated, false);
        await page.waitForFunction(() => window.audioProbe.masters.at(-1)?.gain.value === 0);

        // Reload the actual settings store while Music remains off.
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.locator('#app-loading-overlay').waitFor({ state: 'hidden' });
        await press(gear);
        await press(audio);
        assert.equal(await volume.inputValue(), '24');
        assert.equal(await page.locator('#sw-generative-music').isChecked(), true);
        assert.equal(await page.locator('#sw-music').isChecked(), false);
        await toggle('sw-music');
        await page.waitForFunction(() => window.ChiptuneEngine.isPlaying() && window.audioProbe.masters.at(-1)?.gain.value > 0.06);
        if (out) {
            await mkdir(out, { recursive: true });
            await page.screenshot({ path: join(out, `${width}x${height}-audio-settings.png`) });
        }

        // Exercise trainer creation while the generated soundtrack owns the mix.
        await press(close);
        await press(page.getByRole('button', { name: /Story Mode/ }));
        await press(page.getByRole('button', { name: /New Adventure/ }));
        await page.locator('#screen-story-trainercreate').waitFor();
        assert.equal((await state()).generated, true);
        assert.ok(!(await state()).playing.some(src => src.includes('/music/themes/')));
        await press(page.getByRole('button', { name: 'Back to story menu' }));
        await press(page.getByRole('button', { name: 'Back to Main Menu' }));
        await press(gear);
        await press(audio);
        await toggle('sw-generative-music');
        await waitForField();
        assert.equal((await state()).generated, false);

        // Start the fixture just before the real switch changes, independent of tap latency.
        await page.evaluate(() => document.getElementById('sw-sound').addEventListener('click', () => {
            window.AudioSystem.playFaintCry('Pikachu');
        }, { once: true }));
        await toggle('sw-sound');
        assert.equal(await page.evaluate(() => window.AudioSystem.__test.state().sfxActive), 0);
        await toggle('sw-sound');
        await page.waitForTimeout(350);
        assert.equal(requests.some(({ path }) => path.endsWith('/faint.wav')), false);
        await page.evaluate(() => window.AudioSystem.playMoveSound({ name: 'Unmapped Fire cue', type: 'Fire', cat: 'Special' }));
        const fireCue = await page.waitForFunction(() => window.audioProbe.elements.find(({ audio, requestedSource }) =>
            requestedSource.endsWith('music/moves/fire.mp3') && Number.isFinite(audio.duration))?.audio.duration);
        const fireDuration = await fireCue.jsonValue();
        assert.ok(fireDuration > 0 && fireDuration < 1.5, `The Fire fallback should be a short cue (${fireDuration} seconds)`);
        await press(close);

        // Load an in-game battle fixture, then command a real native turn through the UI.
        const battleUrl = new URL(url.href);
        battleUrl.searchParams.set('testbattle', 'charge6');
        await page.goto(battleUrl.href, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => document.getElementById('screen-battle').dataset.battleEngine === 'showdown'
            && !document.getElementById('command-menu').classList.contains('hidden'));
        await press(page.locator('#command-menu [data-cmd="fight"]'));
        const impact = page.waitForResponse(res => /hit(?:_strong|_weak)?\.wav$/.test(new URL(res.url()).pathname) && res.ok());
        await press(page.getByRole('button', { name: /Earthquake/ }).filter({ visible: true }).first());
        await impact;
        await page.waitForFunction(() => window.audioProbe.elements.some(({ requestedSource }) => /hit(?:_strong|_weak)?\.wav/.test(requestedSource)));
        await page.waitForFunction(() => Array.from(document.querySelectorAll('#battle-log > *')).some(el => el.textContent.includes('used Earthquake')));
        assert.deepEqual(errors, []);
        assert.ok(requests.some(({ path, status }) => /hit(?:_strong|_weak)?\.wav/.test(path) && status < 400));
        report.push({ viewport: `${width}×${height}`, touch, reducedMotion, controls: ['settings', 'encounter themes', 'victory cue', 'gallery cue', 'mute', 'slider', 'reload', 'trainer creation', 'preset battle turn'], fireDuration, requests });
        console.log(`${width}×${height} audio controls, reload, trainer creation and Showdown impact passed`);
        await context.close();
    }
    if (out) await writeFile(join(out, 'audio.json'), JSON.stringify(report, null, 2));
} finally {
    await browser.close();
}
