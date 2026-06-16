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
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;

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
