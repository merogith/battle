// Phase 4.4 — per-event enemy stat multiplier curve.
//   City band C0..C9: -20 / -17 / -13 / -10 / -7 / -3 / 0 / +7 / +13 / +20  (%).
//   Overrides: Intro Rival -25%, Champion +25%, Mystery Figure +30%.
// The multiplier is stamped onto the build at enemy-roll time and applied inside
// buildPokemon after nature + fatigue, scaling maxHp + every combat stat. Wilds
// and Professor gifts are exempt (they don't go through the enemy roll path).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const ST = eng.window.__storyTest;

test('city band: smooth per-city steps from -20% at C0 to +20% at C9', () => {
  const expected = { 0: -20, 1: -17, 2: -13, 3: -10, 4: -7, 5: -3, 6: 0, 7: 7, 8: 13, 9: 20 };
  for (const [c, pct] of Object.entries(expected)) {
    const m = ST.storyEnemyStatMult('Basic Trainer', +c, 0);
    assert.equal(Math.round((m - 1) * 100), pct, `C${c} band should be ${pct}% (got ${(m - 1) * 100}%)`);
  }
});

test('overrides: Mystery Figure +30, Champion +25, intro Rival -25', () => {
  // Intro rival uses STORY_RIVAL_ROW_INTRO = 68 — pass that as storyRowIdx.
  assert.equal(ST.storyEnemyStatMult('Mystery Figure', 0, 0), 1.30, 'Mystery +30% regardless of city');
  assert.equal(ST.storyEnemyStatMult('Mystery Figure', 9, 0), 1.30);
  assert.equal(ST.storyEnemyStatMult('Champion', 9, 0), 1.25, 'Champion +25%');
  assert.equal(ST.storyEnemyStatMult('Rival', 0, 68), 0.75, 'Intro rival -25%');
  // Non-intro rival follows the city band.
  assert.equal(ST.storyEnemyStatMult('Rival', 3, 12), 0.90, 'Mid rival at C3 follows band (-10%)');
});

test('buildPokemon applies build._storyStatMult to maxHp + combat stats', () => {
  // Baseline build (Garchomp, level-50 standard).
  const base = { m: ['Earthquake'], i: '', n: 'Hardy', a: 'Sand Veil', evs: { hp: 252, atk: 252, def: 0, spa: 0, spd: 0, spe: 4 }, ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 } };
  const baseMon  = ST.buildPokemon('Garchomp', { ...base, evs: { ...base.evs }, ivs: { ...base.ivs } });
  const debufMon = ST.buildPokemon('Garchomp', { ...base, evs: { ...base.evs }, ivs: { ...base.ivs }, _storyStatMult: 0.80 });
  const buffMon  = ST.buildPokemon('Garchomp', { ...base, evs: { ...base.evs }, ivs: { ...base.ivs }, _storyStatMult: 1.30 });
  // -20% debuff: every stat AND maxHp should be ~80% of base (floor rounding).
  assert.ok(debufMon.maxHp < baseMon.maxHp, `debuf maxHp ${debufMon.maxHp} < base ${baseMon.maxHp}`);
  assert.ok(debufMon.stats.atk < baseMon.stats.atk, 'debuf atk lower');
  const ratioHp = debufMon.maxHp / baseMon.maxHp;
  assert.ok(Math.abs(ratioHp - 0.80) < 0.02, `debuf maxHp ratio ${ratioHp.toFixed(2)} ≈ 0.80`);
  // +30% buff: every stat AND maxHp should be ~130%.
  assert.ok(buffMon.maxHp > baseMon.maxHp);
  const ratioBuff = buffMon.maxHp / baseMon.maxHp;
  assert.ok(Math.abs(ratioBuff - 1.30) < 0.02, `buff maxHp ratio ${ratioBuff.toFixed(2)} ≈ 1.30`);
  // mon._storyStatMult is exposed for the battle-summary UI.
  assert.equal(debufMon._storyStatMult, 0.80);
  assert.equal(buffMon._storyStatMult, 1.30);
  // The base mon (no mult) shouldn't expose the field.
  assert.equal(baseMon._storyStatMult, undefined, 'base mon has no mult field');
});

test('Shedinja: maxHp is preserved at 1 even with a multiplier', () => {
  const mon = ST.buildPokemon('Shedinja', { m:['Tackle'], i:'', n:'Hardy', a:'Wonder Guard', evs:{hp:0,atk:252,def:0,spa:0,spd:0,spe:252}, ivs:{hp:31,atk:31,def:31,spa:31,spd:31,spe:31}, _storyStatMult: 1.30 });
  assert.equal(mon.maxHp, 1, 'Shedinja HP gimmick preserved');
  assert.ok(mon.stats.atk > 0, 'Shedinja attack still buffed');
});
