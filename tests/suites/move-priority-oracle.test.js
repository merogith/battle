import { after, before, it } from 'node:test';
import assert from 'node:assert/strict';
import { Battle } from '@pkmn/sim';
import { loadEngine } from '../helpers/load-engine.js';
import { toShowdownSet } from '../differential/showdown-oracle.mjs';

let harness;
before(async () => { harness = await loadEngine(); });
after(() => harness?.teardown());

const mon = (species, ability, move) => ({ species, ability, moves: [move] });

async function compareTurn({ player, foe, first, dynamax = false, psychic = false, immune = false, protectedByTerrain = false, foeTookDamage = false }) {
  const oracle = new Battle({
    formatid: dynamax ? 'gen8customgame' : 'gen9customgame', seed: [1, 2, 3, 4],
    p1: { name: 'P1', team: [toShowdownSet(player)] },
    p2: { name: 'P2', team: [toShowdownSet(foe)] },
  });
  oracle.makeChoices('team 1', 'team 1');
  if (psychic) oracle.field.setTerrain('psychicterrain', oracle.sides[1].active[0]);
  oracle.makeChoices(dynamax ? 'move 1 dynamax' : 'move 1', 'move 1');
  assert.match(oracle.log.find(line => line.startsWith('|move|')), new RegExp(`^\\|move\\|p[12]a: ${first}\\|`));
  assert.equal(oracle.log.some(line => line.includes(`|-immune|p2a: ${foe.species}`)), immune);
  assert.equal(oracle.log.some(line => line.includes(`|-activate|p2a: ${foe.species}|move: Psychic Terrain`)), protectedByTerrain);
  if (foeTookDamage) assert.ok(oracle.sides[1].active[0].hp < oracle.sides[1].active[0].maxhp);

  const { engine, window, mkMon, logs, reset, seedRng } = harness;
  reset();
  seedRng(0);
  const p = mkMon(player);
  const f = mkMon(foe);
  Object.assign(engine.state, { playerParty: [p], foeParty: [f], pActive: p, fActive: f });
  if (psychic) Object.assign(engine.state, { terrain: 'Psychic', terrainTurns: 5 });
  if (dynamax) {
    p.buildData.gimmick = 'DYNAMAX';
    engine.state.p1GimmickIntent = { kind: 'DYNAMAX', slot: 0 };
  }
  engine.setForcedFoeMoveSlot(0);
  await window.playTurn(0, null);
  const out = logs.map(({ text }) => text);
  const firstAction = out.find(text => / used /.test(text));
  assert.ok(firstAction?.startsWith(`${first} used `), out.join('\n'));
  assert.equal(out.some(text => text.includes('immune to Prankster')), immune, out.join('\n'));
  assert.equal(out.some(text => text.includes('Psychic Terrain protected')), protectedByTerrain, out.join('\n'));
  if (immune || protectedByTerrain) assert.equal(f.volatile.taunt, 0);
  if (foeTookDamage) assert.ok(f.currentHp < f.maxHp, out.join('\n'));
}

it('Prankster self recovery keeps its priority into a faster grounded Dark foe in Psychic Terrain', async () => {
  await compareTurn({
    player: mon('Sableye', 'Prankster', 'Recover'), foe: mon('Umbreon', 'Synchronize', 'Tackle'),
    first: 'Sableye', psychic: true,
  });
});

it('Prankster still moves first when Dark typing makes a direct status move fail', async () => {
  await compareTurn({
    player: mon('Sableye', 'Prankster', 'Taunt'), foe: mon('Umbreon', 'Synchronize', 'Tackle'),
    first: 'Sableye', immune: true,
  });
});

it('Psychic Terrain blocks direct Prankster moves on the ground but allows side hazards and airborne targets', async () => {
  for (const [move, foe, ability, protectedByTerrain] of [
    ['Taunt', 'Eevee', 'Adaptability', true],
    ['Stealth Rock', 'Eevee', 'Adaptability', false],
    ['Taunt', 'Pidgeot', 'Keen Eye', false],
  ]) {
    await compareTurn({
      player: mon('Sableye', 'Prankster', move), foe: mon(foe, ability, 'Tackle'),
      first: 'Sableye', psychic: true, protectedByTerrain,
    });
  }
});

it('Triage boosts Synthesis', async () => {
  await compareTurn({
    player: mon('Comfey', 'Triage', 'Synthesis'), foe: mon('Eevee', 'Adaptability', 'Quick Attack'), first: 'Comfey',
  });
});

it('Gale Wings loses priority for the hit gate after taking damage earlier in the turn', async () => {
  await compareTurn({
    player: mon('Talonflame', 'Gale Wings', 'Aerial Ace'), foe: mon('Arcanine', 'Flash Fire', 'Extreme Speed'),
    first: 'Arcanine', psychic: true, foeTookDamage: true,
  });
});

it('damaging Max moves drop the source move priority and source heal flag', async () => {
  for (const player of [mon('Persian', 'Limber', 'Fake Out'), mon('Comfey', 'Triage', 'Draining Kiss')]) {
    await compareTurn({
      player, foe: mon('Eevee', 'Adaptability', 'Quick Attack'), first: 'Eevee', dynamax: true,
    });
  }
});

it('Gale Wings boosts a Flying Max move and Prankster boosts Max Guard', async () => {
  await compareTurn({
    player: mon('Talonflame', 'Gale Wings', 'Aerial Ace'), foe: mon('Ninjask', 'Speed Boost', 'Aerial Ace'),
    first: 'Talonflame', dynamax: true,
  });
  await compareTurn({
    player: mon('Whimsicott', 'Prankster', 'Tailwind'), foe: mon('Ninjask', 'Speed Boost', 'Protect'),
    first: 'Whimsicott', dynamax: true,
  });
});
