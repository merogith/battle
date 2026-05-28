// Regression for Phase 4.0c: a stale enemy build whose gimmick was set to MEGA
// in a prior session (post-G5 unlock, C7+ city) must be sanitized to STANDARD
// when the lock is restored at a pre-C7 city. Without this, a Mega Sableye fires
// at C3 even though the roll-time gate forbids it — the battle-time activation
// block doesn't re-check city/unlock.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const ST = eng.window.__storyTest;

function primeAtCity(city) {
  ST.sm.active = true;
  ST.sm.runSeed = 99;
  ST.sm._strngState = null;
  if (!ST.sm.settings) ST.sm.settings = {};
  ST.sm.settings.enabledGens = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  ST.sm.badges = 0;
  // First event idx whose city is the target.
  let idx = 0;
  for (let ei = 0; ei <= 120; ei++) {
    let c = -1;
    try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {}
    if (c === city) { idx = ei; break; }
  }
  ST.sm.eventIndex = idx;
  ST.sm.unlockedGimmicks = []; // pre-unlock state
}

test('stale MEGA build is downgraded to STANDARD when restored at a pre-C7 city', () => {
  primeAtCity(3); // C3 — Mega ineligible
  // Simulate a stale lock: a Sableye build flagged MEGA with a Sablenite item.
  const staleTeam = [
    { name: 'Sableye', build: { gimmick: 'MEGA', i: 'Sablenite', m: ['Foul Play','Will-O-Wisp','Recover','Toxic'], n: 'Bold', a: 'Magic Bounce', evs: { hp: 252, def: 252, spd: 4 }, ivs: { hp: 31, atk: 0, def: 31, spa: 31, spd: 31, spe: 31 } } },
    { name: 'Pikachu', build: { gimmick: 'ZMOVE', i: 'Pikanium Z', m: ['Thunderbolt','Volt Tackle','Quick Attack','Iron Tail'], n: 'Jolly', a: 'Static', evs: { hp: 4, atk: 252, spe: 252 }, ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 } } },
  ];
  const sanitized = eng.window.StoryMode && eng.window.StoryMode.storyFreezeFoeTeamForPersistence
    ? eng.window.StoryMode.storyFreezeFoeTeamForPersistence(staleTeam)
    : ST.storyFreezeFoeTeamForPersistence
      ? ST.storyFreezeFoeTeamForPersistence(staleTeam)
      : null;
  assert.ok(sanitized, 'freeze fn is reachable from the test harness');
  assert.equal(sanitized.length, 2);
  // Sableye no longer Mega-flagged + Sablenite stripped.
  assert.equal(sanitized[0].build.gimmick, 'STANDARD', 'Sableye gimmick downgraded to STANDARD at C3');
  assert.notEqual(sanitized[0].build.i, 'Sablenite', 'Sablenite stripped from STANDARD build');
  // Pikachu's Z-Move tag should likewise be cleared at C3.
  assert.equal(sanitized[1].build.gimmick, 'STANDARD', 'Pikachu Z-Move tag also downgraded');
  assert.notEqual(sanitized[1].build.i, 'Pikanium Z', 'Pikanium Z stripped');
});

test('at C7+ with unlock, the gimmick passes through unchanged', () => {
  primeAtCity(7);
  ST.sm.unlockedGimmicks = ['mega'];
  // applyMechanicsToSettings is what _storyEnemyMechKeys reads from; mirror megaOn.
  if (ST.sm.settings) ST.sm.settings.megaOn = true;
  const team = [
    { name: 'Sableye', build: { gimmick: 'MEGA', i: 'Sablenite', m: ['Foul Play','Will-O-Wisp','Recover','Toxic'], n: 'Bold', a: 'Magic Bounce', evs: { hp: 252, def: 252, spd: 4 }, ivs: { hp: 31, atk: 0, def: 31, spa: 31, spd: 31, spe: 31 } } },
  ];
  const fn = (eng.window.StoryMode && eng.window.StoryMode.storyFreezeFoeTeamForPersistence) || ST.storyFreezeFoeTeamForPersistence;
  const sanitized = fn(team);
  assert.equal(sanitized[0].build.gimmick, 'MEGA', 'Mega passes through at C7+ with unlock');
  assert.equal(sanitized[0].build.i, 'Sablenite', 'Sablenite kept');
});
