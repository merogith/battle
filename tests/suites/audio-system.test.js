// Audio-system polish guards (2026-06): cross-fades + reliability + SFX-bus pass.
// Real playback is impossible in jsdom, so we stub window.Audio with a fake that
// records constructions / volume / play() and drive the AudioSystem.__test hook.
// Locks the behavior the polish pass introduced:
//   · _fade ramps an element's volume to the target and lands exactly on it
//   · a resume point too close to a track's end is discarded (no instant skip)
//   · two back-to-back playBattleTheme() calls start ONE theme (re-entrancy guard)
//   · endBattleTheme(true) plays the victory sting, then restores field BGM
//   · the SFX bus dedupes same-src same-tick cues and honors the voice cap
// Run: node --test tests/suites/audio-system.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadEngine } from '../helpers/load-engine.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = readFileSync(join(ROOT, 'battle.html'), 'utf8');

const eng = await loadEngine();
const W = eng.window;

test('double-KO plays BOTH faint cries (foe immediately, player staggered)', () => {
    // Source-level: the simultaneous-faint branch is deep in the battle loop and
    // can't be driven headlessly, so lock the fix at the source.
    const i = SRC.indexOf('if (foeFainted && playerFainted) {');
    assert.ok(i >= 0, 'simultaneous-faint branch present');
    const block = SRC.slice(i, i + 900);
    assert.match(block, /playFaintCry\(state\.fActive\.name\)/, 'foe faint cry');
    assert.match(block, /_pFaintName\s*=\s*state\.pActive\.name/, 'player name captured');
    assert.match(block, /setTimeout\([^;]*playFaintCry\(_pFaintName\)/s, 'player faint cry staggered');
});

// ── Fake Audio ────────────────────────────────────────────────────────────────
// Minimal HTMLAudioElement stand-in. play() resolves immediately and simulates the
// `playing` event (so the field-BGM watchdog clears itself and never fires during
// the test). Never auto-fires `ended`, so the SFX voice-cap test can fill the pool.
const built = [];
function makeFakeAudio() {
    function FakeAudio(src) {
        this.src = src || '';
        this.volume = 1;
        this.loop = false;
        this.paused = true;
        this.ended = false;
        this.currentTime = 0;
        this.duration = 200;       // pretend every clip is 200s
        this.readyState = 1;       // metadata available → synchronous seek path
        this.playbackRate = 1;
        this.onended = this.onerror = this.onplaying = this.ontimeupdate = null;
        built.push(this);
    }
    FakeAudio.prototype.play = function () {
        this.paused = false;
        this.readyState = 4;
        if (this.onplaying) { try { this.onplaying(); } catch (e) {} }
        return Promise.resolve();
    };
    FakeAudio.prototype.pause = function () { this.paused = true; };
    FakeAudio.prototype.load = function () {};
    FakeAudio.prototype.removeAttribute = function (name) { if (name === 'src') this.src = ''; };
    FakeAudio.prototype.addEventListener = function (ev, fn) { if (ev === 'loadedmetadata') { try { fn(); } catch (e) {} } };
    FakeAudio.prototype.removeEventListener = function () {};
    return FakeAudio;
}
W.Audio = makeFakeAudio();

const AS = W.AudioSystem;
const T = AS.__test;
const C = T.consts;

function builtWith(substr) { return built.filter(a => String(a.src).includes(substr)); }

test('AudioSystem.__test hook + constants are exposed', () => {
    assert.ok(AS, 'window.AudioSystem mirrored');
    assert.ok(T && typeof T.fade === 'function', '__test.fade present');
    assert.equal(typeof C.MUSIC_FADE_MS, 'number');
    assert.equal(C.MIN_RESUME_REMAINING_SEC, 12);
    assert.ok(C.SFX_MAX_VOICES >= 1);
});

test('_fade ramps volume to the target and lands exactly on it', async () => {
    const el = { volume: 0 };
    await new Promise((res) => T.fade(el, 0.6, 80, res));
    assert.ok(Math.abs(el.volume - 0.6) < 1e-6, `landed on target, got ${el.volume}`);
});

test('_fade is clamped to [0,1]', async () => {
    const el = { volume: 0 };
    await new Promise((res) => T.fade(el, 5, 40, res)); // over-range target
    assert.ok(el.volume <= 1 && el.volume >= 0, `clamped, got ${el.volume}`);
});

test('resume point near the end of a track is discarded (no instant skip)', () => {
    built.length = 0;
    // Saved 198s into a 200s track → only 2s left, under MIN_RESUME_REMAINING_SEC.
    T.startBgTrack(0, 198);
    const field = built.find(a => a.src === C.BACKGROUND_TRACKS[0]);
    assert.ok(field, 'a field element was created');
    assert.equal(field.currentTime, 0, 'near-end resume restarts from 0');
});

test('a comfortable resume point is honored', () => {
    built.length = 0;
    T.startBgTrack(0, 50); // 150s left → fine
    const field = built.find(a => a.src === C.BACKGROUND_TRACKS[0]);
    assert.ok(field, 'a field element was created');
    assert.equal(field.currentTime, 50, 'mid-track resume seeks to the saved point');
});

test('field playback requests one short track and waits until it ends to load another', () => {
    built.length = 0;
    T.startBgTrack(0, 0);
    assert.equal(built.length, 1);
    const first = built[0];
    assert.equal(first.src, 'music/background/short1.mp3');
    assert.equal(first.preload, 'metadata');
    first.onended();
    assert.equal(built.length, 2);
    assert.equal(first.src, '');
    assert.match(built[1].src, /music\/background\/short[23]\.mp3$/);
});

test('opting into full mixes restores the old playlist position without changing the short-track save', () => {
    const original = Object.getOwnPropertyDescriptor(W, 'localStorage');
    const storage = new Map([['pbs_bg_state', JSON.stringify({ src: 'music/background/background2.mp3', time: 40 })]]);
    Object.defineProperty(W, 'localStorage', { configurable: true, value: {
        getItem: key => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
        removeItem: key => storage.delete(key),
    } });
    try {
        T.startBgTrack(0, 24);
        AS.setFieldMusicMode('full');
        assert.equal(T.state().bgAudio.src, 'music/background/background2.mp3');
        assert.equal(T.state().bgAudio.currentTime, 40);
        assert.equal(JSON.parse(storage.get('pbs_settings')).fieldMusicMode, 'full');
        AS.setFieldMusicMode('short');
        assert.equal(T.state().bgAudio.src, 'music/background/short1.mp3');
        assert.equal(T.state().bgAudio.currentTime, 24);
    } finally {
        Object.defineProperty(W, 'localStorage', original);
    }
});

test('two back-to-back playBattleTheme() calls start ONE theme (re-entrancy guard)', () => {
    built.length = 0;
    T.playBattleTheme('boss');
    T.playBattleTheme('boss'); // same tick → must be a no-op
    assert.equal(builtWith('boss_climax').length, 1, 'exactly one boss theme element');
    assert.equal(T.state().battleMood, 'boss');
});

test('endBattleTheme(true) plays the victory sting', () => {
    built.length = 0;
    T.playBattleTheme('boss');
    T.endBattleTheme(true);
    assert.equal(builtWith('victory').length, 1, 'victory sting fired on a win');
    assert.equal(T.state().battleMood, 'victory');
});

// ── No "music mixing": the field track never resumes under an override layer ──
// _resumeOrStartBg() is reached by event-driven paths (tab visibility change,
// the first-gesture autoplay retry) that previously saw the *ducked* (paused)
// field track and resumed it ON TOP OF a still-looping battle/intro theme.
test('resumeOrStartBg is a no-op while a battle theme owns the foreground', () => {
    built.length = 0;
    T.startBgTrack(0, 0);                 // field BGM rolling
    T.playBattleTheme('boss');           // ducks field, boss theme is the foreground
    const boss = T.state().battleAudio;
    assert.ok(boss, 'boss theme is the active battle audio');
    const fieldBefore = builtWith(C.BACKGROUND_TRACKS[0]).length;

    T.resumeOrStartBg();                  // simulates visibility-change / gesture retry

    assert.equal(T.state().battleAudio, boss, 'battle theme is untouched (no swap)');
    assert.equal(T.state().battleMood, 'boss', 'mood unchanged');
    assert.equal(builtWith(C.BACKGROUND_TRACKS[0]).length, fieldBefore,
        'no new field track started under the battle theme');
    T.endBattleTheme(false);             // clean up for later tests
});

test('resumeOrStartBg is a no-op while the char-creation jingle owns the foreground', () => {
    built.length = 0;
    T.startBgTrack(0, 0);                 // field BGM rolling
    T.playIntroTheme();                   // ducks field, intro jingle is the foreground
    const intro = T.state().introAudio;
    assert.ok(intro, 'intro jingle is the active intro audio');
    const fieldBefore = builtWith(C.BACKGROUND_TRACKS[0]).length;

    T.resumeOrStartBg();

    assert.equal(T.state().introAudio, intro, 'intro jingle is untouched');
    assert.equal(builtWith(C.BACKGROUND_TRACKS[0]).length, fieldBefore,
        'no new field track started under the jingle');
    AS.stopIntroTheme();                  // clean up
});

test('starting a battle theme stops a lingering char-creation jingle', () => {
    built.length = 0;
    T.playIntroTheme();
    assert.ok(T.state().introAudio, 'intro jingle active');
    T.playBattleTheme('boss');
    assert.equal(T.state().introAudio, null, 'jingle stopped — no overlap with battle theme');
    T.endBattleTheme(false);
});

test('SFX bus dedupes the same source within the dedupe window', () => {
    built.length = 0;
    const a = T.playOneShot('music/ui_sfx/buy.wav', 0.5);
    const b = T.playOneShot('music/ui_sfx/buy.wav', 0.5); // same tick → collapsed
    assert.ok(a, 'first cue plays');
    assert.equal(b, null, 'duplicate within window is dropped');
    assert.equal(builtWith('buy.wav').length, 1, 'only one Audio constructed');
});

test('SFX bus honors the voice cap', () => {
    built.length = 0;
    // The fake never fires `ended`, so prior tests may leave voices live — count
    // only how many MORE we can add before the cap, from the current baseline.
    const baseline = T.state().sfxActive;
    const room = C.SFX_MAX_VOICES - baseline;
    const made = [];
    for (let i = 0; i < room + 4; i++) {
        // distinct srcs + noDedupe so only the cap can stop us
        made.push(T.playOneShot('music/ui_sfx/voice' + i + '.wav', 0.4, { noDedupe: true }));
    }
    const live = made.filter(Boolean).length;
    assert.equal(live, room, `capped at ${C.SFX_MAX_VOICES} total (room was ${room})`);
    assert.equal(T.state().sfxActive, C.SFX_MAX_VOICES, 'pool is at the cap');
});

test('switching soundtracks keeps one music layer and carries a boss mood into its fight', () => {
    W.applySettingSwitch('generativeMusic', false);
    T.startBgTrack(0, 0);
    const field = T.state().bgAudio;
    W.applySettingSwitch('generativeMusic', true);
    assert.equal(field.paused, true);
    assert.equal(field.src, '');

    built.length = 0;
    T.playIntroTheme();
    T.playBattleTheme('boss');
    W.MusicDirector.setScreen('screen-battle');
    assert.equal(W.ChiptuneEngine.currentMood(), 'boss');
    T.endBattleTheme(true);
    assert.equal(W.ChiptuneEngine.currentMood(), 'victory');
    assert.equal(built.length, 0, 'generated mode loads neither intro audio nor the victory file');

    T.playBattleTheme('boss');
    W.applySettingSwitch('generativeMusic', false);
    assert.match(T.state().battleAudio.src, /boss_climax/);
    T.endBattleTheme(false);
    AS.stopIntroTheme();
});

test('changing music volume during a boss entrance lets the field fade finish', async () => {
    T.startBgTrack(0, 0);
    const field = T.state().bgAudio;
    const before = AS.getMusicVolume();
    await Promise.resolve();
    T.playBattleTheme('boss');
    AS.setMusicVolume(0.2);
    await new Promise(resolve => setTimeout(resolve, C.MUSIC_FADE_MS + 100));
    assert.equal(field.paused, true);
    assert.ok(Math.abs(T.state().battleAudio.volume - 0.2) < 1e-6);
    T.endBattleTheme(false);
    AS.setMusicVolume(before);
});

test('the story motif pauses file music, honors its volume and releases the same position', () => {
    W.applySettingSwitch('generativeMusic', false);
    W.applySettingSwitch('musicEnabled', true);
    const previous = AS.getMusicVolume();
    T.startBgTrack(0, 48);
    const field = T.state().bgAudio;
    try {
        const stop = AS.playStoryMotif('partner');
        const cue = builtWith('first-partner.mp3').at(-1);
        assert.equal(AS.storyMotifPlaying(), true);
        assert.equal(field.paused, true);
        T.resumeOrStartBg();
        assert.equal(field.paused, true, 'Resume does not layer field music underneath the motif');
        AS.setMusicVolume(0.24);
        assert.ok(Math.abs(cue.volume - 0.192) < 1e-6);
        stop();
        assert.equal(cue.paused, true);
        assert.equal(cue.src, '');
        assert.equal(field.paused, false);
        assert.equal(field.currentTime, 48);
    } finally {
        AS.setMusicVolume(previous);
    }
});

test('the story motif suppresses generated music, and music mute releases the motif', () => {
    W.applySettingSwitch('generativeMusic', true);
    W.MusicDirector.setScreen('screen-menu');
    try {
        assert.equal(W.ChiptuneEngine.currentMood(), 'menu');
        const stop = AS.playStoryMotif('gallery');
        assert.equal(W.ChiptuneEngine.currentMood(), null, 'The motif is the only music source');
        const cue = builtWith('the-portrait.mp3').at(-1);
        W.applySettingSwitch('musicEnabled', false);
        assert.equal(cue.src, '');
        assert.equal(AS.storyMotifPlaying(), false);
        assert.equal(AS.playStoryMotif('relay'), null);
        W.applySettingSwitch('musicEnabled', true);
        assert.equal(W.ChiptuneEngine.currentMood(), 'menu');
        stop();
        assert.equal(AS.storyMotifPlaying(), false);
    } finally {
        W.applySettingSwitch('musicEnabled', true);
        W.applySettingSwitch('generativeMusic', false);
    }
});

test('turning off effects interrupts live cries and cancels already queued cues', async () => {
    // Clear the fake voices left by the capacity check.
    W.applySettingSwitch('soundEnabled', false);
    W.applySettingSwitch('soundEnabled', true);
    built.length = 0;
    AS.playFaintCry('Pikachu');
    const cry = builtWith('pikachu.mp3')[0];
    assert.ok(cry, 'the cry is playing before mute');
    W.applySettingSwitch('soundEnabled', false);
    assert.equal(cry.paused, true);
    assert.equal(T.state().sfxActive, 0);
    W.applySettingSwitch('soundEnabled', true);
    await new Promise(resolve => setTimeout(resolve, 330));
    assert.equal(builtWith('faint.wav').length, 0, 'the previous faint cue did not survive mute');
});

test('place ambience retains one bed, releases on mute and switches only to the latest place', () => {
    const coast = 'music/world/coast-surf.mp3';
    const quarry = 'music/world/quarry-air.mp3';
    try {
        W.applySettingSwitch('soundEnabled', true);
        AS.setSoundVolume(0.55);
        AS.setPlaceAmbience(coast);
        const first = T.state().placeBed;
        assert.ok(first?.loop && !first.paused);
        assert.equal(first.src, coast);
        AS.setPlaceAmbience(coast);
        assert.equal(T.state().placeBed, first);
        W.applySettingSwitch('soundEnabled', false);
        assert.equal(first.src, '');
        const count = built.length;
        AS.setPlaceAmbience(quarry);
        assert.equal(built.length, count, 'mute avoids loading the next place');
        W.applySettingSwitch('soundEnabled', true);
        const second = T.state().placeBed;
        assert.equal(second?.src, quarry);
        AS.setPlaceAmbience('');
        assert.equal(second.src, '');
        assert.equal(T.state().placeBed, null);
        AS.playPlaceCue('music/world/camp-ember.mp3');
        const cue = builtWith('camp-ember.mp3').at(-1);
        assert.ok(cue);
        AS.setPlaceAmbience('');
        assert.equal(cue.src, '', 'leaving still stops a cue when no bed was active');
    } finally {
        AS.setPlaceAmbience('');
        W.applySettingSwitch('soundEnabled', true);
    }
});

test('a rejected effect returns its voice to the live pool', async () => {
    const Audio = W.Audio;
    const starting = T.state().sfxActive;
    try {
        W.Audio = class BlockedAudio extends Audio {
            play() { return Promise.reject(new Error('playback denied')); }
        };
        assert.ok(T.playOneShot('music/ui_sfx/rejected.wav', 0.4));
        await Promise.resolve();
        assert.equal(T.state().sfxActive, starting);
    } finally {
        W.Audio = Audio;
    }
});

test('a browser autoplay block retries the current raid theme on the next gesture', async () => {
    const Audio = W.Audio;
    let attempts = 0;
    try {
        W.Audio = class AutoplayBlockedAudio extends Audio {
            play() {
                if (this.src.endsWith('/raid-omen.mp3') && ++attempts === 1) {
                    return Promise.reject(new W.DOMException('Gesture required', 'NotAllowedError'));
                }
                return super.play();
            }
        };
        AS.init();
        AS.playBattleTheme('raid');
        const raid = T.state().battleAudio;
        await Promise.resolve();
        assert.equal(raid.paused, true);
        W.document.dispatchEvent(new W.Event('click'));
        await Promise.resolve();
        assert.equal(T.state().battleAudio, raid);
        assert.equal(raid.paused, false);
        assert.equal(attempts, 2);
    } finally {
        W.Audio = Audio;
        AS.endBattleTheme(false);
    }
});

test('a hidden game pauses the battle track at its position and releases effects', () => {
    let hidden = false;
    Object.defineProperty(W.document, 'hidden', { configurable: true, get: () => hidden });
    const changeVisibility = value => {
        hidden = value;
        W.document.dispatchEvent(new W.Event('visibilitychange'));
    };
    try {
        AS.init();
        T.startBgTrack(0, 16);
        const field = T.state().bgAudio;
        AS.playBattleTheme('leader');
        const theme = T.state().battleAudio;
        theme.currentTime = 7;
        const cue = T.playOneShot('test-effect.mp3', 0.5);
        changeVisibility(true);
        assert.equal(theme.paused, true);
        assert.equal(field.paused, true);
        assert.equal(cue.src, '');
        assert.equal(T.playOneShot('test-effect.mp3', 0.5), null);
        changeVisibility(false);
        assert.equal(theme.paused, false);
        assert.equal(theme.currentTime, 7);
        assert.equal(field.paused, true);
        assert.equal(field.currentTime, 16);
    } finally {
        delete W.document.hidden;
        AS.endBattleTheme(false);
    }
});

test('zero music volume defers theme loading and zero effect volume releases active cues', () => {
    const musicVolume = AS.getMusicVolume();
    const soundVolume = AS.getSoundVolume();
    try {
        AS.setMusicVolume(0);
        AS.playBattleTheme('elite');
        assert.equal(T.state().battleAudio, null);
        assert.equal(T.state().bgAudio.paused, true);
        AS.setMusicVolume(musicVolume);
        assert.match(T.state().battleAudio.src, /league-chamber\.mp3$/);
        assert.equal(T.state().battleAudio.paused, false);
        const cue = T.playOneShot('test-effect.mp3', 0.5);
        AS.setSoundVolume(0);
        assert.equal(cue.src, '');
        assert.equal(T.playOneShot('test-effect.mp3', 0.5), null);
    } finally {
        AS.setMusicVolume(musicVolume);
        AS.setSoundVolume(soundVolume);
        AS.endBattleTheme(false);
    }
});
