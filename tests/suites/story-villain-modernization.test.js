// Villain-arc modernization: one signature interaction per arc, delivered
// through the data/story/interactions.json overlay + data/story/minigames.json
// defs. Locks: every arc's signature is attached to a real choice-free act
// (no collision with the arc's authored choice), the def resolves, and the
// effect is cosmetic (a flag — never a battle-mechanic change).
// Run: node --test tests/suites/story-villain-modernization.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadEngine } from '../helpers/load-engine.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MG = JSON.parse(readFileSync(join(ROOT, 'data/story/minigames.json'), 'utf8'));
const IX = JSON.parse(readFileSync(join(ROOT, 'data/story/interactions.json'), 'utf8'));

const eng = await loadEngine();
const W = eng.window;
const SS = (W.__narrationTest && W.__narrationTest.STORY_SCENES) || W.STORY_SCENES;

const VILLAIN = IX.inject.filter(i => i.sceneKey.startsWith('villain.'));
// The arc "signatures" are the cosmetic event-beat interactions; the rare
// pacifist "no-fight" routes (on battle1 beats) are validated separately in
// story-pacifist-routes.test.js because they legitimately carry skipBattle.
const SIGNATURES = VILLAIN.filter(i => /\.event\d+$/.test(i.sceneKey));

test('every villain arc has exactly one signature inject', () => {
    const arcs = new Set(SIGNATURES.map(i => i.sceneKey.split('.')[1]));
    for (const arc of ['rocket', 'magma', 'aqua', 'galactic', 'plasma', 'flare', 'skull', 'yell', 'macroCosmos', 'star']) {
        assert.ok(arcs.has(arc), 'missing signature for villain.' + arc);
    }
    assert.equal(SIGNATURES.length, 10, 'expected 10 villain event-beat signatures');
});

test('each villain signature names a defined game and a cosmetic-only effect', () => {
    for (const inj of SIGNATURES) {
        const gid = inj.interaction.gameId;
        assert.ok(MG.games[gid], inj.sceneKey + ' references undefined game ' + gid);
        // Effect must be flag/gold/item/gift only — never a battle-mechanic change.
        const eff = inj.interaction.onWin || {};
        assert.ok(!('softenBattle' in eff), inj.sceneKey + ' must not soften battle');
        assert.ok(!('skipBattle' in eff) || eff.skipBattle === undefined, inj.sceneKey + ' villain signature should not skip battle');
        const keys = Object.keys(eff);
        for (const k of keys) assert.ok(['flag', 'gold', 'item', 'giftPokemon'].includes(k), inj.sceneKey + ' illegal effect key ' + k);
    }
});

test('signatures attach to a real, choice-free act (no collision with the authored choice)', () => {
    for (const inj of VILLAIN) {
        const sc = SS[inj.sceneKey];
        assert.ok(sc && Array.isArray(sc.acts), 'missing scene ' + inj.sceneKey);
        const act = sc.acts.find(a => a && a.phase === inj.phase);
        assert.ok(act, inj.sceneKey + ' has no ' + inj.phase + ' act');
        assert.ok(!act.choice, inj.sceneKey + ' ' + inj.phase + ' already has a choice — interaction would shadow it');
        // After boot, the overlay must have attached the interaction.
        assert.ok(act.interaction && act.interaction.gameId === inj.interaction.gameId,
            inj.sceneKey + ' interaction not attached at runtime');
    }
});

test("each arc's original authored choice is preserved somewhere in the arc", () => {
    // Map arc → the persistKey it must still carry (the one-choice-per-arc canon).
    const canon = {
        rocket: 'villain.rocket.driver', magma: 'villain.magma.water', aqua: 'villain.aqua.chart',
        galactic: 'villain.galactic.keeper', plasma: 'villain.plasma.n', flare: 'villain.flare.sticker',
        skull: 'villain.skull.kids', yell: 'villain.yell.proof', macroCosmos: 'villain.macroCosmos.drone',
        star: 'villain.star.bullies',
    };
    for (const [arc, pk] of Object.entries(canon)) {
        let found = false;
        for (const key of Object.keys(SS)) {
            if (!key.startsWith('villain.' + arc + '.')) continue;
            for (const a of (SS[key].acts || [])) {
                if (a && a.choice && a.choice.persistKey === pk) found = true;
            }
        }
        assert.ok(found, 'arc ' + arc + ' lost its authored choice ' + pk);
    }
});

test('every villain signature game resolves to a real outcome through play()', async () => {
    for (const inj of SIGNATURES) {
        const res = await W.StoryMiniGames.play(inj.interaction.gameId, {});
        assert.ok(['win', 'lose'].includes(res.outcome), inj.interaction.gameId + ' did not resolve');
    }
});
