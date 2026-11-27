// Player-chosen EV training focus (build.evTrainFocus).
//
// The post-battle EV grant (_grantBattleEVs) auto-picks a mon's 2 best stats
// unless the player has set a training focus via the party summary picker. When
// set, the flat per-battle grant is spread EQUALLY across the chosen stats; when
// every chosen stat is already maxed at 252, the remainder spills into the Auto
// stats so no EVs are wasted. Absent / empty / malformed focus => Auto (default).
//
//   node --test tests/suites/ev-train-focus.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installWritableStorage, loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;
const GENS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const sum = (g) => g.hp + g.atk + g.def + g.spa + g.spd + g.spe;
const EVK = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];

// Mirror the engine's round-robin (one EV per listed stat per pass, ignoring
// caps) so expectations track EV_GAIN_ACTIVE retunes instead of hardcoding.
function expectSplit(total, stats) {
  const g = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  for (let j = 0; j < total; j++) g[stats[j % stats.length]]++;
  return g;
}

// Engine-returned objects live in the jsdom realm (a different Object.prototype),
// so deepStrictEqual against a Node-realm literal fails on prototype identity even
// when the values match. Re-materialize into a plain Node object before comparing.
const norm = (g) => ({ hp: g.hp | 0, atk: g.atk | 0, def: g.def | 0, spa: g.spa | 0, spd: g.spd | 0, spe: g.spe | 0 });

function setSm(team) {
  ST.sm = {
    active: true, badges: 0, gold: 0,
    team,
    settings: { enabledGens: GENS.slice() }, unlockedGimmicks: [], storyDifficulty: 'normal',
    eventIndex: 0, trainerAssignments: {}, inventory: {}, facilityIntros: {}, facilitiesSeen: {},
    profUsed: {}, npcStageSeen: {}, gymCleared: {},
  };
  return ST.sm;
}

const zeroEvs = () => ({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 });
const monFresh = (name, extra = {}) => ({ name, build: Object.assign({ evs: zeroEvs() }, extra) });

// Pikachu has a clean offensive identity (atk 55 > spa 50, high spe) so the Auto
// picker deterministically returns ['atk','spe'] with no RNG tie-break — a stable
// baseline for the default-path and fallback assertions.
const PIKA_AUTO = ['atk', 'spe'];

test('auto default is unchanged when no focus is set', () => {
  const BOSS = ST.EV_GAIN_ACTIVE.BOSS;
  const team = [monFresh('Pikachu')];
  setSm(team);
  const rep = ST.grantBattleEVs('Gym Leader 1', team, new Set([0]));
  assert.ok(rep && rep.length === 1, 'one mon trained');
  const g = rep[0].gained;
  assert.deepEqual(norm(g), expectSplit(BOSS, PIKA_AUTO), 'auto trains the 2 strongest stats, split evenly');
  assert.equal(sum(g), BOSS, 'full grant placed');
});

test('winning fills the last available EVs and receipts show only what each Pokémon earned', () => {
  const cappedFocus = monFresh('Pikachu', { evs: { ...zeroEvs(), atk: 252, spe: 252 } });
  const almostFull = monFresh('Pikachu', { evs: { ...zeroEvs(), atk: 252, spe: 252, spa: 5 } });
  const full = monFresh('Pikachu', { evs: { ...zeroEvs(), atk: 252, spe: 252, spa: 6 } });
  const team = [cappedFocus, almostFull, full];
  setSm(team);
  const report = ST.grantBattleEVs('Gym Leader 1', team, new Set([0]));
  assert.deepEqual(Array.from(report, entry => entry.amount), [6, 1]);
  assert.equal(sum(cappedFocus.build.evs), 510);
  assert.equal(sum(almostFull.build.evs), 510);
  assert.match(ST.battleEVRewardLine(report), /\+7 EVs total across 2 Pokémon/);
  assert.match(ST.battleEVRewardLine([report[1]]), /\+1 EV for 1 Pokémon/);
  assert.equal(ST.grantBattleEVs('Gym Leader 1', team, new Set([0])), null);
});

test('the victory receipt shows a real battle stat change when EVs cross a threshold', () => {
  const mon = monFresh('Pikachu', { evTrainFocus: ['spe'] });
  setSm([mon]);
  const report = ST.grantBattleEVs('Gym Leader 1', [mon], new Set([0]));
  assert.equal(report[0].statGain.stat, 'spe');
  assert.ok(report[0].statGain.to > report[0].statGain.from);
  assert.match(ST.battleEVRewardLine(report), /Pikachu · Speed \d+ → \d+ · \+18 EVs/);
});

test('single-stat focus puts the whole grant into that stat', () => {
  const BOSS = ST.EV_GAIN_ACTIVE.BOSS;
  const team = [monFresh('Pikachu', { evTrainFocus: ['spa'] })];
  setSm(team);
  const rep = ST.grantBattleEVs('Gym Leader 1', team, new Set([0]));
  const g = rep[0].gained;
  assert.equal(g.spa, BOSS, 'all EVs go to the single chosen stat');
  assert.equal(sum(g), BOSS, 'nothing placed elsewhere');
  assert.equal(g.atk + g.def + g.hp + g.spd + g.spe, 0, 'other stats untouched');
});

test('multi-stat focus spreads the grant equally (remainder to earlier stats)', () => {
  const BOSS = ST.EV_GAIN_ACTIVE.BOSS; // divides evenly by 3
  const ACE = ST.EV_GAIN_ACTIVE.ACE;   // does not — exercises the remainder
  const focus = ['atk', 'def', 'spe'];

  const teamBoss = [monFresh('Snorlax', { evTrainFocus: focus.slice() })];
  setSm(teamBoss);
  const gBoss = ST.grantBattleEVs('Gym Leader 1', teamBoss, new Set([0]))[0].gained;
  assert.deepEqual(norm(gBoss), expectSplit(BOSS, focus), `BOSS ${BOSS} splits ${BOSS / 3} each across 3 stats`);
  assert.equal(gBoss.hp + gBoss.spa + gBoss.spd, 0, 'unchosen stats stay at 0');

  const teamAce = [monFresh('Snorlax', { evTrainFocus: focus.slice() })];
  setSm(teamAce);
  const gAce = ST.grantBattleEVs('Elite Trainer', teamAce, new Set([0]))[0].gained;
  assert.deepEqual(norm(gAce), expectSplit(ACE, focus), `ACE ${ACE} splits as evenly as integer division allows`);
  assert.equal(sum(gAce), ACE, 'full grant placed, remainder included');
});

test('malformed focus falls back to Auto and never writes a junk EV key', () => {
  const BOSS = ST.EV_GAIN_ACTIVE.BOSS;
  const autoExpect = expectSplit(BOSS, PIKA_AUTO);
  for (const bad of [[], null, undefined, ['bogus'], ['atk', 'nope'], 'atk', 42]) {
    const mon = monFresh('Pikachu', { evTrainFocus: bad });
    setSm([mon]);
    const g = ST.grantBattleEVs('Gym Leader 1', [mon], new Set([0]))[0].gained;
    assert.deepEqual(norm(g), autoExpect, `focus ${JSON.stringify(bad)} => Auto spread`);
    // No stray key leaked into the live EV object.
    const stray = Object.keys(mon.build.evs).filter(k => !EVK.includes(k));
    assert.equal(stray.length, 0, `no junk EV key for focus ${JSON.stringify(bad)} (saw ${stray})`);
  }
});

test('a fully-capped focus spills the remainder into the Auto stats (no wasted EVs)', () => {
  const BOSS = ST.EV_GAIN_ACTIVE.BOSS;
  // atk is the sole focus and already near the 252 cap; only 2 EVs fit before it
  // maxes, so the other BOSS-2 EVs must spill into the Auto stats (Pikachu: spe).
  const evs = Object.assign(zeroEvs(), { atk: 250 });
  const mon = { name: 'Pikachu', build: { evs, evTrainFocus: ['atk'] } };
  setSm([mon]);
  const g = ST.grantBattleEVs('Gym Leader 1', [mon], new Set([0]))[0].gained;
  assert.equal(g.atk, 2, 'chosen stat filled to the 252 cap');
  assert.equal(evs.atk, 252, 'atk reached the per-stat cap');
  assert.equal(g.spe, BOSS - 2, 'the remainder spilled into the Auto stat (spe)');
  assert.equal(sum(g), BOSS, 'the whole grant landed — nothing wasted');
});

test('the grant stays story-only-safe: crucible battles never train', () => {
  const team = [monFresh('Pikachu', { evTrainFocus: ['spa'] })];
  const s = setSm(team);
  s.crucibleBattleSource = 'frontier';
  const rep = ST.grantBattleEVs('Gym Leader 1', team, new Set([0]));
  assert.equal(rep, null, 'crucible/frontier bypass the battle-EV grant');
  assert.equal(sum(team[0].build.evs), 0, 'no EVs applied');
});

test('StoryMode.setEvTrainFocus persists and clears the focus, and it survives a save round-trip', () => {
  installWritableStorage(W);
  const team = [monFresh('Pikachu')];
  setSm(team);
  W.StoryMode.setEvTrainFocus(0, ['atk', 'def', 'spe']);
  assert.deepEqual(team[0].build.evTrainFocus, ['atk', 'def', 'spe'], 'focus written to the saved slot');

  // Invalid keys are filtered out on write.
  W.StoryMode.setEvTrainFocus(0, ['spa', 'bogus']);
  assert.deepEqual(team[0].build.evTrainFocus, ['spa'], 'only valid stat keys are stored');

  const persistedBuild = () => JSON.parse(W.localStorage.getItem(W.GameStorage.storyKey)).team[0].build;
  assert.deepEqual(persistedBuild().evTrainFocus, ['spa'], 'focus is in the saved run');

  // Empty/invalid selection clears the field back to Auto (absent).
  W.StoryMode.setEvTrainFocus(0, []);
  assert.equal('evTrainFocus' in team[0].build, false, 'clearing the focus removes the field (Auto)');
  assert.equal('evTrainFocus' in persistedBuild(), false, 'the cleared focus is saved');
});
