// Hidden Power unification (2026-06): Hidden Power is now ONE logical move whose
// type is a single per-Pokémon label (`buildData.hpType`, one of the 16 legal HP
// types — every type except Normal and Fairy). `resolveHiddenPowerForBuild` is the
// single source of truth: it resolves/persists the type and PROJECTS the equipped
// "Hidden Power" move onto its typed variant ("Hidden Power Fire") so damage / AI /
// UI keep reading an ordinary typed move. buildPokemon (the universal constructor,
// also used to rehydrate saved mons) runs it, so old saves self-heal — no migration.
//
// These tests lock in: (1) a bare "Hidden Power" projects to a legal non-Normal
// typed variant with a matching move-object type; (2) a build-specified variant is
// preserved (Smogon coverage); (3) the type is stable across rebuilds (save / PC /
// evolution rehydrate via buildData); (4) the fallback pick is deterministic
// (replay-safe — no story-RNG-stream perturbation).
// Run: node --test tests/suites/hidden-power-unification.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const E = await loadEngine();
const W = E.window;

test('the 16 legal Hidden Power types are exposed (no Normal / Fairy)', () => {
    assert.ok(Array.isArray(W.HP_TYPES), 'HP_TYPES is an array');
    assert.equal(W.HP_TYPES.length, 16, 'exactly 16 types');
    assert.ok(!W.HP_TYPES.includes('Normal'), 'excludes Normal');
    assert.ok(!W.HP_TYPES.includes('Fairy'), 'excludes Fairy');
});

test('a bare "Hidden Power" projects to a legal non-Normal typed variant', () => {
    const mon = E.mkMon({ species: 'Pikachu', moves: ['Hidden Power', 'Thunderbolt', 'Tackle', 'Tackle'] });
    const t = mon.buildData.hpType;
    assert.ok(W.HP_TYPES.includes(t), `hpType is legal (${t})`);
    const hp = mon.moves.find(m => /^Hidden Power/.test(m.name));
    assert.ok(hp, 'a Hidden Power move is equipped');
    assert.equal(hp.name, 'Hidden Power ' + t, 'move name projected to the typed variant');
    assert.equal(hp.type, t, 'move-object type matches hpType');
    assert.notEqual(hp.type, 'Normal', 'never resolves to Normal');
});

test('a build-specified variant is preserved (competitive coverage intact)', () => {
    const mon = E.mkMon({ species: 'Greninja', moves: ['Hidden Power Fire', 'Surf', 'Dark Pulse', 'Ice Beam'] });
    assert.equal(mon.buildData.hpType, 'Fire', 'specified type captured as hpType');
    const hp = mon.moves.find(m => /^Hidden Power/.test(m.name));
    assert.equal(hp.type, 'Fire', 'equipped move is Fire-typed');
});

test('the type is stable when a mon is rebuilt from its saved buildData', () => {
    const mon = E.mkMon({ species: 'Gengar', moves: ['Hidden Power', 'Shadow Ball', 'Sludge Wave', 'Tackle'] });
    const t = mon.buildData.hpType;
    const rebuilt = E.engine.buildPokemon('Gengar', mon.buildData);
    assert.equal(rebuilt.buildData.hpType, t, 'hpType survives a save→rebuild round-trip');
    const hp = rebuilt.moves.find(m => /^Hidden Power/.test(m.name));
    assert.equal(hp.type, t, 'equipped type unchanged after rebuild');
});

test('an explicit hpType on the build always wins over parsing/rolling', () => {
    const out = W.resolveHiddenPowerForBuild({ m: ['Hidden Power', 'Tackle'], n: 'Hardy', hpType: 'Ice' }, 'Snorlax');
    assert.equal(out, 'Ice', 'pre-set hpType is honored');
});

test('the fallback pick is deterministic for identical builds (replay-safe)', () => {
    const a = W.resolveHiddenPowerForBuild({ m: ['Hidden Power', 'Tackle'], n: 'Hardy' }, 'Eevee');
    const b = W.resolveHiddenPowerForBuild({ m: ['Hidden Power', 'Tackle'], n: 'Hardy' }, 'Eevee');
    assert.equal(a, b, 'same inputs → same type, with no global RNG perturbation');
    assert.ok(W.HP_TYPES.includes(a), 'and it is a legal type');
});
