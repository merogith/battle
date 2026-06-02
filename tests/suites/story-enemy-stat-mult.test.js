// Unified foe stat scaling — the single source of truth for story-foe strength.
//
//   _storyEnemyStatMult(): NORMAL-difficulty progression curve, pure fn of
//     (event, city, row). FOE_POWER_CURVE C0..C9 = 0.80 / 0.85 / 0.90 / 0.95 /
//     1.00 / 1.00 / 1.05 / 1.08 / 1.10 / 1.15. Boss overrides: E1-E4 1.15,
//     Champion 1.20, Mystery Figure 1.30, intro Rival 0.75.
//   _foeDifficultyMult(): orthogonal difficulty knob — 0.70 / 0.85 / 1.00 /
//     1.15 / 1.30 (veryeasy / easy / normal / hard / challenge).
//
// The two are multiplied ONCE at enemy-roll time into build._storyStatMult, and
// buildPokemon applies that single value once to maxHp + every combat stat (no
// compounding, one floor per stat). Wilds + Professor gifts are exempt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const ST = eng.window.__storyTest;

test('progression curve: soft early, parity mid, demanding by the League', () => {
  const expected = { 0: 0.80, 1: 0.85, 2: 0.90, 3: 0.95, 4: 1.00, 5: 1.00, 6: 1.05, 7: 1.08, 8: 1.10, 9: 1.15 };
  for (const [c, mult] of Object.entries(expected)) {
    const m = ST.storyEnemyStatMult('Basic Trainer', +c, 0);
    assert.ok(Math.abs(m - mult) < 1e-9, `C${c} curve should be ${mult} (got ${m})`);
  }
});

test('late-game ladder: a smooth climb to the post-Champion Rival finale', () => {
  // Elite Four steps up E1→E4, the Champion sits above E4, the league Rival is
  // the FINAL main-story fight (timeline row 65, after the Champion) and is the
  // true peak, and the post-game Mystery Figure tops everything.
  assert.equal(ST.storyEnemyStatMult('E1', 9, 0), 1.14, 'E1 +14%');
  assert.equal(ST.storyEnemyStatMult('E2', 9, 0), 1.16, 'E2 +16%');
  assert.equal(ST.storyEnemyStatMult('E3', 9, 0), 1.18, 'E3 +18%');
  assert.equal(ST.storyEnemyStatMult('E4', 9, 0), 1.20, 'E4 +20%');
  assert.equal(ST.storyEnemyStatMult('Champion', 9, 0), 1.23, 'Champion +23%');
  assert.equal(ST.storyEnemyStatMult('Rival', 9, 65), 1.26, 'League Rival finale +26% (row 65)');
  assert.equal(ST.storyEnemyStatMult('Mystery Figure', 0, 0), 1.30, 'Mystery +30% regardless of city');
  assert.equal(ST.storyEnemyStatMult('Mystery Figure', 9, 0), 1.30);
  // Monotonic non-decreasing ladder, no anticlimax.
  const ladder = [
    ST.storyEnemyStatMult('E1', 9, 0), ST.storyEnemyStatMult('E2', 9, 0),
    ST.storyEnemyStatMult('E3', 9, 0), ST.storyEnemyStatMult('E4', 9, 0),
    ST.storyEnemyStatMult('Champion', 9, 0), ST.storyEnemyStatMult('Rival', 9, 65),
    ST.storyEnemyStatMult('Mystery Figure', 9, 0),
  ];
  for (let i = 1; i < ladder.length; i++) {
    assert.ok(ladder[i] >= ladder[i - 1], `ladder step ${i} must not drop (${ladder[i - 1]} → ${ladder[i]})`);
  }
});

test('rival overrides: intro debuff vs league finale vs mid-run curve', () => {
  assert.equal(ST.storyEnemyStatMult('Rival', 0, 68), 0.75, 'Intro rival -25% (row 68)');
  assert.equal(ST.storyEnemyStatMult('Rival', 9, 65), 1.26, 'League rival is the finale, not the curve');
  // A non-intro, non-league rival (mid-run) has no override → follows the city curve.
  assert.equal(ST.storyEnemyStatMult('Rival', 3, 12), 0.95, 'Mid rival at C3 follows the curve');
});

test('out-of-story callers (city = -1) get no scaling', () => {
  assert.equal(ST.storyEnemyStatMult('Basic Trainer', -1, 0), 1, 'city -1 → no curve');
});

test('difficulty knob: the single multiplier layered on top of the curve', () => {
  assert.equal(ST.foeDifficultyMult('veryeasy'), 0.70);
  assert.equal(ST.foeDifficultyMult('easy'), 0.85);
  assert.equal(ST.foeDifficultyMult('normal'), 1.00);
  assert.equal(ST.foeDifficultyMult('hard'), 1.15);
  assert.equal(ST.foeDifficultyMult('challenge'), 1.30);
  assert.equal(ST.foeDifficultyMult(undefined), 1.00, 'unknown → normal baseline');
  assert.equal(ST.foeDifficultyMult('garbage'), 1.00);
});

test('curve × difficulty resolves to one clean number (Spe 100 example)', () => {
  // C8 leader on Hard: 1.10 × 1.15 = 1.265 → a final Spe of 100 lands on 126.
  const resolved = ST.storyEnemyStatMult('Gym Leader 8', 8, 0) * ST.foeDifficultyMult('hard');
  assert.ok(Math.abs(resolved - 1.265) < 1e-9, `C8 hard resolves to 1.265 (got ${resolved})`);
  assert.equal(Math.floor(100 * resolved), 126);
});

test('buildPokemon applies build._storyStatMult once to maxHp + combat stats', () => {
  const base = { m: ['Earthquake'], i: '', n: 'Hardy', a: 'Sand Veil', evs: { hp: 252, atk: 252, def: 0, spa: 0, spd: 0, spe: 4 }, ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 } };
  const mk = (extra) => ST.buildPokemon('Garchomp', { ...base, evs: { ...base.evs }, ivs: { ...base.ivs }, ...extra });
  const baseMon  = mk({});
  const debufMon = mk({ _storyStatMult: 0.80 });
  const buffMon  = mk({ _storyStatMult: 1.30 });
  // -20% debuff: every stat AND maxHp is ~80% of base (one floor per stat).
  assert.ok(Math.abs(debufMon.maxHp / baseMon.maxHp - 0.80) < 0.02, 'debuf maxHp ≈ 0.80×');
  assert.ok(debufMon.stats.atk < baseMon.stats.atk, 'debuf atk lower');
  assert.equal(debufMon.stats.spe, Math.floor(baseMon.stats.spe * 0.80), 'spe scaled by exactly one floor');
  // +30% buff: ~130%.
  assert.ok(Math.abs(buffMon.maxHp / baseMon.maxHp - 1.30) < 0.02, 'buff maxHp ≈ 1.30×');
  assert.equal(buffMon.stats.spe, Math.floor(baseMon.stats.spe * 1.30));
  // mon._storyStatMult is exposed for the battle-summary UI when it bites.
  assert.equal(debufMon._storyStatMult, 0.80);
  assert.equal(buffMon._storyStatMult, 1.30);
  assert.equal(baseMon._storyStatMult, undefined, 'unstamped mon has no mult field');
});

test('leak guard: _foeMultApplied is set even at ×1.00 so nothing double-scales', () => {
  const base = { m: ['Tackle'], i: '', n: 'Hardy', a: 'Levitate', evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }, ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 } };
  const parityMon = ST.buildPokemon('Garchomp', { ...base, evs: { ...base.evs }, ivs: { ...base.ivs }, _storyStatMult: 1.00 });
  // At exactly 1.00 the stats are untouched, but the foe is still flagged as
  // "scaled" so applyFoeDifficultyScaling skips it — this is the fix for the old
  // band×stage double-application leak.
  assert.equal(parityMon._foeMultApplied, true, 'parity foe is flagged applied');
  assert.equal(parityMon._storyStatMult, undefined, 'no UI chip at exactly parity');
  const unstamped = ST.buildPokemon('Garchomp', { ...base, evs: { ...base.evs }, ivs: { ...base.ivs } });
  assert.equal(unstamped._foeMultApplied, undefined, 'unstamped (wild/player) foe is not flagged');
});

test('Shedinja: maxHp stays at 1 even with a multiplier', () => {
  const mon = ST.buildPokemon('Shedinja', { m: ['Tackle'], i: '', n: 'Hardy', a: 'Wonder Guard', evs: { hp: 0, atk: 252, def: 0, spa: 0, spd: 0, spe: 252 }, ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 }, _storyStatMult: 1.30 });
  assert.equal(mon.maxHp, 1, 'Shedinja HP gimmick preserved');
  assert.ok(mon.stats.atk > 0, 'Shedinja attack still buffed');
});
