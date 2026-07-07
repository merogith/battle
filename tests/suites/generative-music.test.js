// Generative music system — ChiptuneEngine + MusicDirector (music PR).
//
// An original procedural chiptune engine (Web Audio) composes background music
// live from scales + chord progressions — no sample files, no copyrighted
// material. MusicDirector maps the current screen / battle to a mood and drives
// the engine ONLY when settings.generativeMusic is on; otherwise it stays
// dormant and the file-based AudioSystem BGM behaves exactly as before.
//
// Under the jsdom harness there is no AudioContext, so the engine's API stays
// callable but makes no sound (canAudio() false, isPlaying() false) — that's the
// contract this test locks, plus the wiring/guards at the source level.
//
// Run: node --test tests/suites/generative-music.test.js

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

test('ChiptuneEngine exposes a mood registry and is harness-safe', () => {
  const CE = W.ChiptuneEngine;
  assert.ok(CE, 'ChiptuneEngine present');
  const moods = CE.moods();
  for (const m of ['menu', 'field', 'town', 'route', 'battle', 'boss', 'victory', 'hof', 'safari', 'casino', 'crucible']) {
    assert.ok(moods.includes(m), `mood ${m} defined`);
  }
  assert.equal(CE.canAudio(), false, 'no Web Audio under the harness');
});

test('start() records the mood but makes no sound under the harness', () => {
  const CE = W.ChiptuneEngine;
  CE.start('boss');
  assert.equal(CE.currentMood(), 'boss', 'mood recorded (API-only)');
  assert.equal(CE.isPlaying(), false, 'no scheduler running without a real AudioContext');
  CE.start('nonsense-mood');
  assert.equal(CE.currentMood(), 'field', 'unknown mood falls back to field');
  CE.stop();
  assert.equal(CE.currentMood(), null, 'stop clears the mood');
});

test('MusicDirector maps screens to moods but stays dormant while the setting is off', () => {
  const MD = W.MusicDirector;
  assert.ok(MD, 'MusicDirector present');
  W.__engine.settings.generativeMusic = false;
  MD.setScreen('screen-battle');
  assert.equal(MD.current(), 'battle', 'battle screen → battle mood');
  MD.setScreen('screen-story-casino');
  assert.equal(MD.current(), 'casino', 'casino screen → casino mood');
  MD.setScreen('screen-unknown-xyz');
  assert.equal(MD.current(), 'field', 'unmapped screen → field mood');
  // Engine must NOT be running while the setting is off (nothing to run anyway
  // under the harness, but the guard is what matters).
  assert.equal(W.ChiptuneEngine.isPlaying(), false, 'dormant while generativeMusic is off');
});

test('the file-based BGM + battle themes early-return while generative music is on', () => {
  assert.match(SRC, /function _resumeOrStartBg\(\)\s*\{[\s\S]{0,400}if \(settings\.generativeMusic\) return;/,
    'field BGM yields to the generative engine');
  assert.match(SRC, /function _playBattleTheme\(mood\)\s*\{[\s\S]{0,400}if \(settings\.generativeMusic\)\s*\{ _battleMood = mood; return; \}/,
    'battle themes yield to the generative engine');
});

test('the setting is wired: default off, modal switch, sync pair, live apply', () => {
  assert.match(SRC, /generativeMusic: false/, 'defaults off (existing behavior preserved)');
  assert.match(SRC, /id="sw-generative-music"[\s\S]*applySettingSwitch\('generativeMusic'/, 'modal switch present');
  assert.match(SRC, /\['sw-generative-music', 'generativeMusic'\]/, 'registered in the sync list');
  assert.match(SRC, /if \(key === 'generativeMusic'\)/, 'applySettingSwitch handles it');
});
