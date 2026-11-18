import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, test } from 'node:test';
import { setTimeout as wait } from 'node:timers/promises';
import * as native from '../../scripts/competitive/classic-simulation.mjs';
import { loadEngine } from '../helpers/load-engine.js';

const { window: W } = await loadEngine();
const story = W.__storyTest;
const document = W.document;
const plain = value => JSON.parse(JSON.stringify(value));
const profiles = JSON.parse(readFileSync(new URL('../../data/story/boss-profiles.json', import.meta.url), 'utf8'));
const initial = story.sm;
const key = 'extra.cubone.raid';
const raidCard = () => document.querySelector('.story-raid-cinematic');
const storage = new Map();
Object.defineProperty(W, 'localStorage', { configurable: true, value: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key),
} });
const until = async (predicate, failure) => {
    for (let i = 0; i < 200; i++) {
        const value = predicate();
        if (value) return value;
        await wait(15);
    }
    assert.fail(failure);
};
W.__classicSimulationModule = native;
after(() => W.close());

function staged(sceneKey = key, enabledGens = [1]) {
    document.querySelectorAll('.story-raid-cinematic,.story-narrative-overlay,.vs-stage,.intro-tutorial-card')
        .forEach(element => element.remove());
    const tracks = { main: 'classic_v2', villain: null, extra: sceneKey.split('.')[1] };
    story.sm = { ...plain(initial), tracks, active: true, badges: 5, runSeed: 22180, gold: 3400,
        currentEnemyLock: null, storyCityFoeMemory: null, storyDifficulty: 'normal', storyEventsFired: {},
        team: [{ id: 1, name: 'Blastoise', build: { a: 'Torrent', m: ['Surf', 'Protect'], _isShiny: false } }],
        settings: { ...initial.settings, enabledGens }, inventory: { potion: 2 },
    };
    for (const group of [story.MAIN_STORY_BEATS, story.EXTRA_STORY_BEATS[tracks.extra]]) {
        for (const scene of Object.values(group)) {
            if (scene.sceneKey !== sceneKey) story.sm.storyEventsFired[scene.sceneKey] = true;
        }
    }
    const exactRoad = story.EXTRA_STORY_BEATS[tracks.extra].raid.roadAnchor;
    const index = story.STORY_EVENTS_RAW.findIndex((row, idx) => row[1] === 'Battle' &&
        row[2] === 'Basic Trainer' && story.roadForArrayIdx(idx) === exactRoad);
    assert.notEqual(index, -1, `stage on ${exactRoad}`);
    story.sm.eventIndex = index;
    story.sm._activeBeatBattleKey = sceneKey;
    story.campMarkDone(index);
    const enter = () => story.enterBattleEvent(story.STORY_EVENTS_RAW[index], true, true, true);
    return { index, enter };
}

test('all 28 profiles in the actual game match the bundled catalog and exclude ordinary encounters', () => {
    for (const [sceneKey, profile] of Object.entries(profiles)) {
        assert.deepEqual(plain(story.resolveStoryBossProfile(sceneKey)), profile, sceneKey);
    }
    for (const sceneKey of ['main.event1', 'villain.rocket.boss', 'extra.cubone.ending', 'frontier.ace']) {
        assert.equal(story.resolveStoryBossProfile(sceneKey), null, sceneKey);
    }
});

test('generation restrictions apply to every tier in a rolled family', () => {
    const tracks = generations => Array.from(story.eligibleExtraTracks(generations));
    assert.deepEqual(tracks([1]), ['cubone', 'hypno', 'parasect', 'mewtwo']);
    assert.deepEqual(tracks([2, 3]), []);
    assert.deepEqual(tracks([5]), ['yamask']);
    assert.deepEqual(tracks([7]), ['mimikyu']);
    assert.deepEqual(tracks([1, 4, 5, 6, 7, 9]),
        ['cubone', 'yamask', 'hypno', 'phantump', 'mimikyu', 'drifloon', 'parasect', 'mewtwo']);
});

test('the real Parasect stage keeps legal attacks and only one sleep move', async () => {
    const scene = 'extra.parasect.raid';
    const { index } = staged(scene);
    const source = { name: 'Parasect', build: { i: 'Assault Vest', a: 'Effect Spore',
        m: ['Sleep Powder', 'Dream Eater', 'Leech Life', 'X-Scissor'] } };
    await story.prepareStoryProfileMoves(story.resolveStoryBossProfile(scene), [source], story.STORY_EVENTS_RAW[index][0]);
    assert.deepEqual(Array.from(source.build.m), ['Spore', 'Leech Life', 'X-Scissor']);
    assert.equal(source.build.i, '');
    assert.equal(source.build.a, 'Effect Spore');
});

test('a real route entry locks its authored opponent before the cinematic and keeps an older valid revision', async () => {
    const { enter, index } = staged();
    assert.equal(story.activeBattleBeatForCurrentRow()?.sceneKey, key);
    enter();
    const card = await until(raidCard, 'the authored solo-raid intro was not mounted');
    assert.match(card.textContent, /Marowak.*50% HP/s);
    const stored = JSON.parse(W.localStorage.getItem('pbs_story_save'));
    assert.equal(stored.currentEnemyLock.eventIdx, index);
    assert.deepEqual(stored.currentEnemyLock.bossProfile, profiles[key]);
    assert.deepEqual(stored.currentEnemyLock.team.map(mon => mon.name), ['Marowak']);
    assert.equal(stored.inventory.potion, 2);
    assert.equal(stored.gold, 3400);
    card.remove();

    const revision = { ...profiles[key], revision: 22, phases: plain(profiles[key].phases) };
    revision.phases[0].trigger.percent = 70;
    const frozen = stored.currentEnemyLock.team;
    story.sm.currentEnemyLock = { eventIdx: index, team: frozen, bossProfile: revision };
    enter();
    const resumed = await until(raidCard, 'the frozen raid revision did not load');
    assert.match(resumed.textContent, /70% HP/);
    assert.deepEqual(plain(story.sm.currentEnemyLock.team), frozen);
    resumed.remove();
});

test('failed lock persistence rolls back scoped state, then retry preserves the original foe and no fees', async () => {
    const { enter, index } = staged();
    const expected = plain(story.rollExtraRaidBossTeam(key));
    assert.equal(expected[0].name, 'Marowak');
    const memory = { city: -1, species: ['Pikachu'] };
    story.sm.storyCityFoeMemory = memory;
    const originalConfirm = W.showGameConfirm;
    const messages = [];
    W.__storyExternalSave = true;
    W.showGameConfirm = async message => {
        messages.push(message);
        if (messages.length > 1) return false;
        assert.equal(story.sm.currentEnemyLock, null);
        assert.equal(story.sm.storyCityFoeMemory, memory);
        assert.equal(raidCard(), null);
        W.__storyExternalSave = false;
        return true;
    };
    try {
        enter();
        await until(raidCard, 'retry did not persist the encounter and enter its cinematic');
        assert.equal(messages.length, 1);
        assert.match(messages[0], /could not be saved.*retry/i);
        const saved = JSON.parse(W.localStorage.getItem('pbs_story_save'));
        assert.equal(saved.currentEnemyLock.eventIdx, index);
        assert.equal(saved.currentEnemyLock.team[0].name, 'Marowak');
        assert.deepEqual(saved.currentEnemyLock.bossProfile, profiles[key]);
        assert.equal(saved.gold, 3400);
        assert.equal(saved.inventory.potion, 2);
    } finally {
        W.showGameConfirm = originalConfirm;
        W.__storyExternalSave = false;
        raidCard()?.remove();
    }
});
