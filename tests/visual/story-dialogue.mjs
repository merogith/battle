import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, webkit } from 'playwright';
import { dialogueLines } from '../../data/story/dialogue-lines.js';

const url = new URL(process.env.BATTLE_TEST_URL || 'http://127.0.0.1:5173/battle.html');
const assetPath = relative => new URL(relative, url).pathname;
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(url.hostname));
url.searchParams.set('testmega', '1');
const out = process.env.BATTLE_PLAYTEST_OUT;
if (out) await mkdir(out, { recursive: true });

const engine = process.env.BATTLE_TEST_ENGINE || 'chromium';
const browserType = { chromium, webkit }[engine];
assert.ok(browserType, `Unsupported browser engine ${engine}`);
const browser = await browserType.launch(engine === 'chromium' ? {
    executablePath: process.env.BATTLE_TEST_CHROMIUM,
    args: ['--autoplay-policy=user-gesture-required'],
} : {});
try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true,
        hasTouch: true, reducedMotion: 'reduce', serviceWorkers: 'block' });
    const page = await context.newPage();
    const requests = [];
    const errors = [];
    let failure = null;
    await page.route('**/*', async route => {
        const request = new URL(route.request().url());
        if (request.origin !== url.origin) return route.abort();
        if (request.pathname.includes('/music/voices/')) {
            requests.push(request.pathname);
            if (failure === 'slow') {
                await new Promise(resolve => setTimeout(resolve, 1100));
                return route.continue().catch(() => {});
            }
            if (failure === 'missing') return route.fulfill({ status: 404 });
        }
        return route.continue();
    });
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
        const originalStart = AudioBufferSourceNode.prototype.start;
        const originalStop = AudioBufferSourceNode.prototype.stop;
        const originalConnect = AudioNode.prototype.connect;
        const originalDecode = AudioContext.prototype.decodeAudioData;
        const originalResume = AudioContext.prototype.resume;
        const decoded = new WeakSet();
        const NativeAudio = window.Audio;
        window.dialogueProbe = { played: [], stopped: [], music: [], gains: [], contexts: new Set(), decodeErrors: [] };
        AudioContext.prototype.resume = function (...args) {
            window.dialogueProbe.contexts.add(this);
            return originalResume.apply(this, args);
        };
        AudioContext.prototype.decodeAudioData = async function (...args) {
            window.dialogueProbe.contexts.add(this);
            try {
                const buffer = await originalDecode.apply(this, args);
                decoded.add(buffer);
                return buffer;
            } catch (error) {
                window.dialogueProbe.decodeErrors.push(error.message);
                throw error;
            }
        };
        AudioBufferSourceNode.prototype.start = function (...args) {
            const result = originalStart.apply(this, args);
            if (decoded.has(this.buffer)) window.dialogueProbe.played.push(this);
            return result;
        };
        AudioBufferSourceNode.prototype.stop = function (...args) {
            const result = originalStop.apply(this, args);
            if (decoded.has(this.buffer)) window.dialogueProbe.stopped.push(this);
            return result;
        };
        AudioNode.prototype.connect = function (...args) {
            if (this instanceof GainNode && args[0] === this.context.destination) window.dialogueProbe.gains.push(this);
            return originalConnect.apply(this, args);
        };
        window.Audio = function (...args) {
            const audio = new NativeAudio(...args);
            window.dialogueProbe.music.push(audio);
            return audio;
        };
        window.Audio.prototype = NativeAudio.prototype;
    });

    const card = page.locator('[data-adventure-open="chapter-7"]:visible');
    const dialog = page.locator('dialog.story-chapter-dialog[open]');
    const settings = page.locator('#modal-settings');
    const gear = page.getByRole('button', { name: 'Settings', exact: true }).filter({ visible: true }).first();
    const dialogueVolume = settings.getByRole('slider', { name: 'Dialogue volume' });
    const closeSettings = () => settings.getByRole('button', { name: 'Close settings' }).tap();
    const openAudio = async () => {
        await gear.tap();
        await settings.getByRole('button', { name: 'Audio', exact: true }).tap();
    };
    const toggle = async id => {
        const control = settings.locator(`label[for="${id}"]`);
        if (id === 'sw-generative-music' && !await control.isVisible()) {
            await settings.getByText('Soundtrack options', { exact: true }).tap();
        }
        await control.tap();
    };
    const start = async () => {
        await page.goto(url.href, { waitUntil: 'domcontentloaded' });
        await page.locator('#app-loading-overlay').waitFor({ state: 'hidden' });
        await card.waitFor();
        for (let pass = 0; pass < 20; pass++) {
            if (await card.tap({ trial: true, timeout: 250 }).then(() => true, () => false)) return;
            const overlay = page.locator('[data-arrival-dismiss]:visible, [data-narr-continue="1"]:visible, .story-tutorial-continue:visible, #modal-game-alert:not(.hidden) button:visible').last();
            if (await overlay.isVisible()) await overlay.tap({ timeout: 600 }).catch(() => {});
        }
        throw Error('Chapter 7 card remained behind an overlay');
    };
    const relayLine = dialogueLines['relay-reserve'];
    const enterVoicedPanel = async () => {
        await card.tap();
        await dialog.locator('[data-adventure-next]').tap();
        await dialog.getByText('Relay terminal', { exact: true }).waitFor();
        assert.equal(await dialog.locator('.story-chapter-caption').innerText(), relayLine.caption);
    };
    const apiVoice = (id, text) => page.evaluate(([key, line]) => {
        window.stopVoiceProbe = window.AudioSystem.playDialogue(key, line);
    }, [id, text]);
    const stats = () => page.evaluate(() => ({
        plays: window.dialogueProbe.played.length,
        stops: window.dialogueProbe.stopped.length,
        musicVolume: window.AudioSystem.getMusicOutputVolume(),
    }));

    await start();
    assert.equal(requests.length, 0, 'Opening the game and hub does not load voice clips');
    if (await page.evaluate(() => navigator.userActivation?.hasBeenActive === false)) {
        await apiVoice('relay-reserve', relayLine.caption);
        await page.waitForTimeout(950);
        assert.equal(requests.length, 0, 'A blocked audio context does not fetch speech');
    }
    await openAudio();
    await dialogueVolume.fill('62');
    await closeSettings();
    await page.waitForFunction(() => window.dialogueProbe.music.some(audio => audio.src.includes('/music/background/')
        && !audio.paused && audio.currentTime > 0), undefined, { timeout: 10000 });
    await enterVoicedPanel();
    await page.waitForFunction(() => window.dialogueProbe.played.length === 1, undefined, { timeout: 5500 }).catch(async error => {
        const audio = await page.evaluate(() => ({
            state: [...window.dialogueProbe.contexts].map(context => context.state),
            decodeErrors: window.dialogueProbe.decodeErrors,
            userActivation: navigator.userActivation?.hasBeenActive,
        }));
        throw new Error(`Relay speech failed to start in ${engine}: ${JSON.stringify({ audio, requests, errors })}`, { cause: error });
    });
    await page.waitForFunction(() => {
        const music = window.dialogueProbe.music.find(audio => audio.src.includes('/music/background/') && !audio.paused);
        return music && Math.abs(music.volume - 0.45 * 0.28) < 0.025;
    }, undefined, { timeout: 2200 }).catch(async error => {
        const audio = await page.evaluate(() => ({
            music: window.dialogueProbe.music.filter(el => el.src.includes('/music/')).map(el => ({
                path: new URL(el.src).pathname,
                paused: el.paused,
                time: el.currentTime,
                volume: el.volume,
                ready: el.readyState,
                error: el.error?.code,
            })),
            mix: window.AudioSystem.getMusicOutputVolume(),
        }));
        throw new Error(`File music did not duck in ${engine}: ${JSON.stringify(audio)}`, { cause: error });
    });
    assert.ok(Math.abs(await page.evaluate(() => window.dialogueProbe.gains.at(-1).gain.value) - 0.62) < 0.01);
    if (out) await page.screenshot({ path: join(out, '390x844-relay-caption.png'), animations: 'disabled' });
    await dialog.locator('[data-adventure-next]').tap();
    await dialog.getByText('Ivo', { exact: false }).first().waitFor();
    await page.waitForFunction(() => window.dialogueProbe.stopped.length === 1 && window.AudioSystem.getMusicOutputVolume() === 0.45);
    await dialog.getByRole('button', { name: 'Close', exact: true }).tap();
    assert.deepEqual(requests, [assetPath(relayLine.url)]);

    await openAudio();
    await toggle('sw-dialogue');
    await closeSettings();
    await enterVoicedPanel();
    await dialog.locator('[data-adventure-next]').tap();
    await dialog.getByRole('button', { name: 'Close', exact: true }).tap();
    assert.equal(requests.length, 1, 'Mute still shows the full story caption and fetches no clip');

    await start();
    await openAudio();
    assert.equal(await dialogueVolume.inputValue(), '62');
    assert.equal(await settings.locator('#sw-dialogue').isChecked(), false);
    await toggle('sw-dialogue');
    await toggle('sw-generative-music');
    await closeSettings();
    await page.waitForFunction(() => window.ChiptuneEngine.isPlaying()
        && window.dialogueProbe.gains.some(node => Math.abs(node.gain.value - 0.144) < 0.015));
    await page.evaluate(() => {
        window.chipGainProbe = window.dialogueProbe.gains.find(node => Math.abs(node.gain.value - 0.144) < 0.015);
    });
    await apiVoice('league-champion-announcer', 'Incorrect branch caption.');
    await page.waitForTimeout(125);
    assert.equal(requests.length, 1, 'An outdated caption cannot trigger an incorrect recording');

    await apiVoice('league-champion-announcer', 'Challenger confirmed. Open the arena.');
    await page.waitForFunction(() => window.dialogueProbe.played.length === 1, undefined, { timeout: 4000 });
    await page.waitForFunction(() => window.chipGainProbe.gain.value < 0.06, undefined, { timeout: 4000 });
    await page.evaluate(() => window.stopVoiceProbe?.());
    await page.waitForFunction(() => window.dialogueProbe.stopped.includes(window.dialogueProbe.played[0])
        && window.chipGainProbe.gain.value > 0.1, undefined, { timeout: 5000 }).catch(async error => {
        const state = await page.evaluate(() => ({
            stopped: window.dialogueProbe.stopped.length,
            chipGain: window.chipGainProbe.gain.value,
            gains: window.dialogueProbe.gains.map(node => node.gain.value),
            musicOutput: window.AudioSystem.getMusicOutputVolume(),
            generated: window.ChiptuneEngine.isPlaying(),
        }));
        throw new Error('Stop and chiptune recovery failed: ' + JSON.stringify(state), { cause: error });
    });

    failure = 'missing';
    await apiVoice('flintreach-gym-announcer', 'Challenger at the gate. The match can begin.');
    await page.waitForTimeout(125);
    assert.deepEqual(await stats(), { plays: 1, stops: 1, musicVolume: 0.45 });

    failure = 'slow';
    await apiVoice('freight-sweep', 'Night sweep in progress. First gate secured.');
    await page.waitForTimeout(1250);
    assert.deepEqual(await stats(), { plays: 1, stops: 1, musicVolume: 0.45 });
    assert.ok(requests.includes(assetPath(dialogueLines['freight-sweep'].url)));

    failure = null;
    for (const [id, line] of Object.entries(dialogueLines)) {
        const target = (await stats()).plays + 1;
        await apiVoice(id, line.caption);
        await page.waitForFunction(count => window.dialogueProbe.played.length === count, target, { timeout: 4000 });
        await page.evaluate(() => window.stopVoiceProbe?.());
    }

    const beforeReentry = await stats();
    await enterVoicedPanel();
    await page.waitForFunction(count => window.dialogueProbe.played.length === count, beforeReentry.plays + 1);
    await page.evaluate(async () => {
        window.interruptedDialogue = window.dialogueProbe.played.at(-1);
        await window.interruptedDialogue.context.suspend();
    });
    await page.waitForFunction(() => window.dialogueProbe.stopped.includes(window.interruptedDialogue)
        && window.AudioSystem.getMusicOutputVolume() === 0.45, undefined, { timeout: 1500 });
    assert.equal(await dialog.locator('.story-chapter-caption').innerText(), relayLine.caption);
    await page.evaluate(() => window.interruptedDialogue.context.resume());
    await dialog.getByRole('button', { name: 'Close', exact: true }).tap();
    assert.equal((await stats()).plays, beforeReentry.plays + 1, 'Resuming audio does not restart interrupted speech');

    await enterVoicedPanel();
    await page.waitForFunction(count => window.dialogueProbe.played.length === count, beforeReentry.plays + 2);
    await dialog.getByRole('button', { name: 'Close', exact: true }).tap();
    await page.waitForFunction(() => window.dialogueProbe.stopped.includes(window.dialogueProbe.played.at(-1)));

    await apiVoice('relay-reserve', relayLine.caption);
    await page.waitForFunction(count => window.dialogueProbe.played.length === count, beforeReentry.plays + 3);
    await openAudio();
    await toggle('sw-dialogue');
    await page.waitForFunction(() => window.dialogueProbe.stopped.includes(window.dialogueProbe.played.at(-1))
        && window.AudioSystem.getMusicOutputVolume() === 0.45);
    assert.deepEqual(errors, []);
    console.log(`${engine}: Voice playback, interruption, scene re-entry, live mute, two music sources, and asset fallback passed. All ${Object.keys(dialogueLines).length} clips decoded.`);
    await context.close();
} finally {
    await browser.close();
}
