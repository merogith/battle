import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

// Phase 0 of the "Evolve from PC" work made the Evolution Lab id-addressable:
// evoLabEvolve / _evoLabApplyEvolution resolve a mon by its stable `id` (via
// _pcFindSlotById) and write the evolved form back to whichever array holds it
// (sm.team OR sm.pcBox). These tests lock both halves:
//   1. a party mon still evolves in place (no regression), and
//   2. a PC-boxed mon evolves in place without touching the battle team.

async function story() {
  const eng = await loadEngine();
  await eng.window.__testReady;
  const S = eng.window.__story;
  assert.ok(S && S.applyEvolution && S.findSlotById && S.makeBuild,
    '__story test surface (applyEvolution/findSlotById/makeBuild) must be exposed');
  return S;
}

test('Evolution Lab: a team mon evolves in place, preserving identity (regression)', async () => {
  const S = await story();
  const sm = S.sm;
  const build = S.makeBuild('Bulbasaur');
  build.evs = { hp: 0, atk: 0, def: 0, spa: 100, spd: 0, spe: 0 };
  build._isShiny = true;
  sm.team = [{ name: 'Bulbasaur', id: 'team-1', nickname: 'Bud', build }];
  sm.pcBox = [];

  const ok = await S.applyEvolution('team-1', 'Ivysaur');
  assert.equal(ok, true, 'applyEvolution resolves true for a valid team evolution');
  assert.equal(sm.team[0].name, 'Ivysaur', 'team slot species changed in place');
  assert.equal(sm.team[0].id, 'team-1', 'stable id preserved');
  assert.equal(sm.team[0].nickname, 'Bud', 'nickname preserved');
  assert.equal(sm.team[0].build.evs.spa, 100, 'EV investment carried through evolution');
  assert.equal(sm.team[0].build._isShiny, true, 'shiny identity carried through evolution');
  assert.equal(sm.team.length, 1, 'team size unchanged');
});

test('Evolution Lab: a PC-boxed mon evolves in place; the battle team is untouched', async () => {
  const S = await story();
  const sm = S.sm;
  sm.team = [{ name: 'Charmander', id: 'team-A', build: S.makeBuild('Charmander') }];
  const boxBuild = S.makeBuild('Bulbasaur');
  boxBuild.evs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 252 };
  sm.pcBox = [{ name: 'Bulbasaur', id: 'pc-7', nickname: 'Boxy', build: boxBuild }];

  // the finder must place this mon in the PC, not the team
  assert.equal(S.findSlotById('pc-7').where, 'pc', 'boxed mon resolves to the PC');

  const ok = await S.applyEvolution('pc-7', 'Ivysaur');
  assert.equal(ok, true, 'applyEvolution resolves true for a PC evolution');
  assert.equal(sm.pcBox[0].name, 'Ivysaur', 'PC slot species changed IN PLACE');
  assert.equal(sm.pcBox[0].id, 'pc-7', 'stable id preserved on the boxed mon');
  assert.equal(sm.pcBox[0].nickname, 'Boxy', 'nickname preserved');
  assert.equal(sm.pcBox[0].build.evs.spe, 252, 'EV investment carried through on the boxed mon');
  assert.equal(sm.pcBox.length, 1, 'PC still holds exactly the (now evolved) mon');

  // the whole point of evolving in the box: the active party never moves
  assert.equal(sm.team.length, 1, 'party size unchanged');
  assert.equal(sm.team[0].name, 'Charmander', 'party mon left untouched');
  assert.equal(sm.team[0].id, 'team-A', 'party mon id untouched');
});

test('Evolution Lab: evolving an unknown id is a safe no-op', async () => {
  const S = await story();
  const sm = S.sm;
  sm.team = [{ name: 'Pikachu', id: 'team-1', build: S.makeBuild('Pikachu') }];
  sm.pcBox = [];
  const ok = await S.applyEvolution('does-not-exist', 'Raichu');
  assert.equal(ok, false, 'unresolvable id returns false rather than throwing');
  assert.equal(sm.team[0].name, 'Pikachu', 'nothing mutated');
});
