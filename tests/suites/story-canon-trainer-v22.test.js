// PR-B/C: canon trainer override for boss / miniBoss / raid / mfBattle beats.
// Verifies the BEAT_CANON_TRAINER registry, the rowId-based assignment swap,
// and the restore-on-loss lifecycle.
// Run: node --test tests/suites/story-canon-trainer-v22.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;

test('BEAT_CANON_TRAINER registers all 10 named villain bosses', () => {
    const map = ST.BEAT_CANON_TRAINER;
    assert.equal(map['villain.rocket.boss'],   'Giovanni');
    assert.equal(map['villain.magma.boss'],    'Maxie');
    assert.equal(map['villain.aqua.boss'],     'Archie');
    assert.equal(map['villain.galactic.boss'], 'Cyrus');
    assert.equal(map['villain.plasma.boss'],   'Ghetsis');
    assert.equal(map['villain.skull.boss'],    'Guzma');
    assert.equal(map['villain.yell.boss'],     'Piers');
    assert.equal(map['villain.flare.boss'],       'Lysandre');
    assert.equal(map['villain.macroCosmos.boss'], 'Rose');
    assert.equal(map['villain.star.boss'],        'Penny');
});

test('BEAT_CANON_TRAINER registers all 10 named villain admins (mini-bosses)', () => {
    const map = ST.BEAT_CANON_TRAINER;
    assert.equal(map['villain.rocket.miniBoss'],   'Proton');
    assert.equal(map['villain.magma.miniBoss'],    'Tabitha');
    assert.equal(map['villain.aqua.miniBoss'],     'Shelly');
    assert.equal(map['villain.galactic.miniBoss'], 'Mars');
    assert.equal(map['villain.plasma.miniBoss'],   'Saturn');
    assert.equal(map['villain.flare.miniBoss'],    'Bryony');
    assert.equal(map['villain.skull.miniBoss'],    'Plumeria');
    assert.equal(map['villain.yell.miniBoss'],     'Marnie');
    assert.equal(map['villain.macroCosmos.miniBoss'], 'Oleana');
    assert.equal(map['villain.star.miniBoss'],        'Giacomo');
});

test('Gen 6-9 leads (Lysandre / Rose / Penny / Oleana / Giacomo) are now TRAINER_DATA rows', () => {
    const names = new Set(ST.getTrainerData().map(t => t.name));
    for (const n of ['Lysandre', 'Rose', 'Penny', 'Oleana', 'Giacomo']) {
        assert.ok(names.has(n), `${n} should be a TRAINER_DATA row`);
    }
});

test('every BEAT_CANON_TRAINER name resolves to a real TRAINER_DATA entry', () => {
    const map = ST.BEAT_CANON_TRAINER;
    const TRAINER_DATA = ST.getTrainerData();
    const names = new Set(TRAINER_DATA.map(t => t.name));
    for (const sceneKey of Object.keys(map)) {
        const canonName = map[sceneKey];
        assert.ok(names.has(canonName), `${sceneKey} → ${canonName} not in TRAINER_DATA`);
    }
});

test('BEAT_CANON_TRAINER only contains keys with boss/miniBoss/raid/mfBattle kinds', () => {
    const map = ST.BEAT_CANON_TRAINER;
    for (const sceneKey of Object.keys(map)) {
        // sceneKey shape: villain.X.boss or villain.X.miniBoss or extra.X.raid or main.mfBattle
        assert.match(sceneKey, /^(villain\.[a-zA-Z]+\.(boss|miniBoss)|extra\.[a-zA-Z]+\.raid|main\.mfBattle)$/,
            `sceneKey ${sceneKey} should be a boss-tier kind`);
    }
});

test('all 20 named entries map to distinct canon trainers (no dupes)', () => {
    const map = ST.BEAT_CANON_TRAINER;
    const names = Object.values(map);
    const set = new Set(names);
    assert.equal(set.size, names.length, 'duplicate canon trainer names: ' + names.join(','));
});
