// Battle-music drop-in API (visual-polish PR).
//
// The battle-theme mood slots (trainer/leader/rival/elite/boss) were pre-wired
// but only content was missing. AudioSystem now exposes addBattleTheme(mood,
// file) and setBattleThemes(map) so tracks can be registered at runtime without
// editing battle.html (see music/themes/README.md). Both mutate the live
// BATTLE_THEMES object in place, validate the mood key, and ignore junk.
//
// Behavioural test via the jsdom harness + the AudioSystem.__test.battleThemes()
// snapshot.
//
// Run: node --test tests/suites/battle-theme-dropins.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const AS = eng.window.AudioSystem;
const T = AS.__test;

test('the five mood slots exist and boss ships the climax track', () => {
  const themes = T.battleThemes();
  for (const mood of ['trainer', 'leader', 'rival', 'elite', 'boss']) {
    assert.ok(Object.prototype.hasOwnProperty.call(themes, mood), `mood ${mood} exists`);
    assert.ok(Array.isArray(themes[mood]), `mood ${mood} is a list`);
  }
  assert.ok(themes.boss.some((f) => /boss_climax/.test(f)), 'boss ships the climax track');
});

test('addBattleTheme appends to a mood, dedupes, and rejects unknown moods', () => {
  assert.equal(AS.addBattleTheme('leader', 'music/themes/leader.mp3'), true);
  assert.ok(T.battleThemes().leader.includes('music/themes/leader.mp3'), 'file appended to leader');
  // Duplicate is a no-op (still true, no second copy).
  AS.addBattleTheme('leader', 'music/themes/leader.mp3');
  const count = T.battleThemes().leader.filter((f) => f === 'music/themes/leader.mp3').length;
  assert.equal(count, 1, 'no duplicate entry');
  // Unknown mood is rejected without throwing.
  assert.equal(AS.addBattleTheme('nonsense', 'x.mp3'), false, 'unknown mood rejected');
  assert.ok(!Object.prototype.hasOwnProperty.call(T.battleThemes(), 'nonsense'), 'no junk key added');
});

test('setBattleThemes replaces known mood lists only', () => {
  AS.setBattleThemes({
    trainer: ['music/themes/trainer.mp3'],
    rival: ['music/themes/rival.mp3'],
    bogus: ['nope.mp3'],
  });
  const themes = T.battleThemes();
  // Spread into native arrays — battleThemes() returns jsdom-realm arrays whose
  // prototype differs from this realm's, which trips deepStrictEqual on contents-equal.
  assert.deepEqual([...themes.trainer], ['music/themes/trainer.mp3'], 'trainer replaced');
  assert.deepEqual([...themes.rival], ['music/themes/rival.mp3'], 'rival replaced');
  assert.ok(!Object.prototype.hasOwnProperty.call(themes, 'bogus'), 'unknown key ignored');
});
