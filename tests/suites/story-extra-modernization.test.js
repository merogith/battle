// Extra/anomaly-arc modernization: one signature interaction per arc via the
// data/story overlay. Same contract as the villain suite — choice-free attach
// point, defined game, cosmetic-only effect, authored choice preserved.
// Run: node --test tests/suites/story-extra-modernization.test.js

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

const EXTRA = IX.inject.filter(i => i.sceneKey.startsWith('extra.'));

test('every extra arc has exactly one signature inject', () => {
    const arcs = new Set(EXTRA.map(i => i.sceneKey.split('.')[1]));
    for (const arc of ['cubone', 'yamask', 'hypno', 'phantump', 'mimikyu', 'drifloon', 'parasect', 'mewtwo']) {
        assert.ok(arcs.has(arc), 'missing signature for extra.' + arc);
    }
    assert.equal(EXTRA.length, 8, 'expected 8 extra signatures');
});

test('each extra signature names a defined game and a cosmetic-only effect', () => {
    for (const inj of EXTRA) {
        const gid = inj.interaction.gameId;
        assert.ok(MG.games[gid], inj.sceneKey + ' references undefined game ' + gid);
        const eff = inj.interaction.onWin || {};
        assert.ok(!('softenBattle' in eff), inj.sceneKey + ' must not soften battle');
        for (const k of Object.keys(eff)) {
            assert.ok(['flag', 'gold', 'item', 'giftPokemon'].includes(k), inj.sceneKey + ' illegal effect key ' + k);
        }
    }
});

test('signatures attach to a real, choice-free act at runtime', () => {
    for (const inj of EXTRA) {
        const sc = SS[inj.sceneKey];
        assert.ok(sc && Array.isArray(sc.acts), 'missing scene ' + inj.sceneKey);
        const act = sc.acts.find(a => a && a.phase === inj.phase);
        assert.ok(act, inj.sceneKey + ' has no ' + inj.phase + ' act');
        assert.ok(!act.choice, inj.sceneKey + ' ' + inj.phase + ' already has a choice');
        assert.ok(act.interaction && act.interaction.gameId === inj.interaction.gameId,
            inj.sceneKey + ' interaction not attached at runtime');
    }
});

test("each extra arc's authored choice is preserved", () => {
    const canon = {
        cubone: 'extra.cubone.burial', yamask: 'extra.yamask.mirror', hypno: 'extra.hypno.pendulum',
        phantump: 'extra.phantump.song', mimikyu: 'extra.mimikyu.seen', drifloon: 'extra.drifloon.crossing',
        parasect: 'extra.parasect.trainer', mewtwo: 'extra.mewtwo.drawing',
    };
    for (const [arc, pk] of Object.entries(canon)) {
        let found = false;
        for (const key of Object.keys(SS)) {
            if (!key.startsWith('extra.' + arc + '.')) continue;
            for (const a of (SS[key].acts || [])) if (a && a.choice && a.choice.persistKey === pk) found = true;
        }
        assert.ok(found, 'arc ' + arc + ' lost its authored choice ' + pk);
    }
});

test('every extra signature game resolves through play()', async () => {
    for (const inj of EXTRA) {
        const res = await W.StoryMiniGames.play(inj.interaction.gameId, {});
        assert.ok(['win', 'lose'].includes(res.outcome), inj.interaction.gameId + ' did not resolve');
    }
});
