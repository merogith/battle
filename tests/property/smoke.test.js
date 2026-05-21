import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

test('engine boots and exposes core internals', async () => {
  const { engine } = await loadEngine();
  assert.ok(engine.parseMoveEffects, 'parseMoveEffects exposed');
  assert.ok(engine.buildPokemon, 'buildPokemon exposed');
  assert.ok(engine.ensureMoveData, 'ensureMoveData exposed');
  assert.ok(Object.keys(engine.baseStats).length > 100, `baseStats populated (got ${Object.keys(engine.baseStats).length})`);
  assert.ok(Object.keys(engine.movesDB).length > 100, `movesDB populated (got ${Object.keys(engine.movesDB).length})`);
});

test('runTurn: Flamethrower reduces defender HP', async () => {
  const { mkMon, runTurn } = await loadEngine();
  const attacker = mkMon({ species: 'Charizard', moves: ['Flamethrower', 'Splash', 'Splash', 'Splash'] });
  const defender = mkMon({ species: 'Snorlax', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  const before = defender.currentHp;
  await runTurn({ playerMon: attacker, foeMon: defender, playerMoveSlot: 0, foeMoveSlot: 0 });
  assert.ok(defender.currentHp < before, `Flamethrower should reduce HP (before=${before} after=${defender.currentHp})`);
});

test('runTurn: Splash deals no damage', async () => {
  const { mkMon, runTurn } = await loadEngine();
  const attacker = mkMon({ species: 'Magikarp', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  const defender = mkMon({ species: 'Magikarp', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  const before = defender.currentHp;
  await runTurn({ playerMon: attacker, foeMon: defender, playerMoveSlot: 0, foeMoveSlot: 0 });
  assert.equal(defender.currentHp, before, 'Splash should not change HP');
});
