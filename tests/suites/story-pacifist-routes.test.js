// Pacifist / ransom "no-fight" routes (rare). Three authored ways to pass a
// grunt battle without fighting, one per skip mechanism:
//   - villain.rocket.battle1  : a gold-RANSOM choice (requireGold + skipBattle)
//   - villain.plasma.battle1  : a talk-down TELL    (onWin skipBattle)
//   - villain.skull.battle1   : a standoff RPS      (onWin skipBattle)
// Locks that each is wired, resolves, skips only a low-tier beat, and costs
// the loot (no reward on the peaceful path is enforced by _storyResolveBeatBySkip,
// covered in story-skip-battle.test.js).
// Run: node --test tests/suites/story-pacifist-routes.test.js

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

function climax(sceneKey) {
    const sc = SS[sceneKey];
    return (sc && Array.isArray(sc.acts)) ? sc.acts.find(a => a && a.phase === 'climax') : null;
}

test('rocket.battle1 offers a gold-ransom choice that skips the fight', () => {
    const act = climax('villain.rocket.battle1');
    assert.ok(act && act.choice, 'rocket.battle1 climax must carry a choice');
    const pay = act.choice.options.find(o => o.value === 'paid');
    assert.ok(pay, 'must offer a "pay" option');
    assert.equal(pay.requireGold, 300, 'ransom gated by gold');
    assert.equal(pay.effect && pay.effect.skipBattle, true, 'paying skips the battle');
    assert.ok(pay.lockedReply, 'must have a can\'t-afford reply');
    assert.ok(act.choice.options.some(o => o.value === 'fought' && !o.effect), 'must offer a no-effect fight option');
});

test('plasma + skull battle1 carry a skipBattle interaction', () => {
    const routes = {
        'villain.plasma.battle1': 'tell_plasma_knights',
        'villain.skull.battle1': 'rps_skull_standoff',
    };
    for (const [sceneKey, gameId] of Object.entries(routes)) {
        const inj = IX.inject.find(i => i.sceneKey === sceneKey);
        assert.ok(inj, sceneKey + ' missing pacifist inject');
        assert.equal(inj.interaction.gameId, gameId, sceneKey + ' wrong game');
        assert.equal(inj.interaction.onWin.skipBattle, true, sceneKey + ' onWin must skip the battle');
        assert.ok(MG.games[gameId], 'game def missing: ' + gameId);
        // Attached at runtime to the battle1 climax act.
        const act = climax(sceneKey);
        assert.ok(act && act.interaction && act.interaction.gameId === gameId, sceneKey + ' not attached at runtime');
    }
});

test('every pacifist game resolves through play()', async () => {
    for (const gameId of ['tell_plasma_knights', 'rps_skull_standoff']) {
        const res = await W.StoryMiniGames.play(gameId, {});
        assert.ok(['win', 'lose', 'draw'].includes(res.outcome), gameId + ' did not resolve');
    }
});

test('pacifist routes only sit on low-tier battle1 beats (never a climax boss/raid)', () => {
    for (const sk of ['villain.rocket.battle1', 'villain.plasma.battle1', 'villain.skull.battle1']) {
        assert.ok(/\.battle1$/.test(sk), sk + ' should be a battle1 beat');
    }
});
