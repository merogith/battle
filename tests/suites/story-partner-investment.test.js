import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Dex } from '@pkmn/dex';
import { loadEngine } from '../helpers/load-engine.js';

const { window: W } = await loadEngine();
const Story = W.StoryMode;
const ST = W.__storyTest;
const gens = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const defaultStory = JSON.parse(JSON.stringify(ST.sm));
W.pkmn = { dex: { Dex } };
W.showGameConfirm = async () => true;

function cityIndex(city) {
    return ST.STORY_EVENTS_RAW.findIndex(row => row[1] === 'City' && row[2] === 'City' + city);
}

function partner(name, extra = {}) {
    return {
        id: 'partner',
        name,
        build: {
            ...W.__story.makeBuild(name),
            a: 'Big Pecks', i: '(none)', gimmick: 'STANDARD', ...extra,
        },
    };
}

function setTeam(city, team) {
    ST.sm = {
        ...JSON.parse(JSON.stringify(defaultStory)),
        active: true, eventIndex: cityIndex(city), badges: city - 1, runSeed: 7632,
        gold: 20000, team, pcBox: [], settings: { enabledGens: [...gens] },
        inventory: {}, cityRerollsUsed: {},
    };
    return ST.sm;
}

function battlePowerCap(slot) {
    return W._storyBattleBpCap(ST.buildPokemon(slot.name, slot.build), true, { mode: 'story' });
}

test('evolution and a paid Cable Link rebuild retain the same partner investment', async () => {
    const ivs = { hp: 23, atk: 29, def: 18, spa: 2, spd: 25, spe: 31 };
    const bonus = { hp: 10, atk: 8, def: 10, spa: 8, spd: 10, spe: 10 };
    const evTrainFocus = ['atk', 'spe'];
    const starter = partner('Fletchling', {
        ivs, bonus, evTrainFocus, expShareLevels: 3, starter: true, _isShiny: true, _gender: 'F',
    });
    starter.starter = true;
    starter.nickname = 'Flicker';
    const story = setTeam(2, [starter]);

    const assertTraining = (slot) => {
        assert.equal(slot.id, starter.id);
        assert.equal(slot.nickname, starter.nickname);
        assert.equal(slot.starter, true);
        assert.equal(slot.build.starter, true);
        assert.equal(slot.build._isShiny, true);
        assert.equal(slot.build._gender, 'F');
        assert.equal(ST.monDisplayLevel(slot.build), 53);
        assert.equal(battlePowerCap(slot), 80);
        assert.deepEqual({ ...slot.build.ivs }, ivs);
        assert.deepEqual({ ...slot.build.bonus }, bonus);
        assert.deepEqual([...slot.build.evTrainFocus], evTrainFocus);
    };
    assertTraining(starter);

    await Story.evoLabEvolve(starter.id, 'Fletchinder');
    const evolved = story.team[0];
    assert.equal(evolved.name, 'Fletchinder');
    assert.equal(story.gold, 17000);
    assertTraining(evolved);
    assert.notEqual(evolved.build.bonus, starter.build.bonus);
    assert.notEqual(evolved.build.evTrainFocus, starter.build.evTrainFocus);

    await Story.linkRebuild(0);
    assert.equal(story.team[0].name, 'Fletchinder');
    assert.equal(story.gold, 12000);
    assertTraining(story.team[0]);
    assert.notEqual(story.team[0].build.bonus, evolved.build.bonus);
});

test('evolution retains empty held-item slots and can only gain unlocked abilities', async () => {
    const random = W.Math.random;
    let state = 17;
    W.Math.random = () => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return state / 4294967296;
    };
    try {
        const emptyItems = ['(none)', 'None', 'No Item', 'NO_ITEM', '', null, undefined];
        for (let index = 0; index < 21; index++) {
            const i = emptyItems[index % emptyItems.length];
            const slot = partner('Fletchling', { i });
            const story = setTeam(2, [slot]);
            assert.equal(await W.__story.applyEvolution(slot.id, 'Fletchinder'), true);
            const evolved = story.team[0];
            assert.equal(evolved.build.a, 'Flame Body');
            assert.equal(ST.buildPokemon(evolved.name, evolved.build).item, null);
        }
        const slot = partner('Fletchling', { a: 'Gale Wings', i: 'Sitrus Berry' });
        const story = setTeam(2, [slot]);
        assert.equal(await W.__story.applyEvolution(slot.id, 'Fletchinder'), true);
        assert.equal(story.team[0].build.a, 'Gale Wings', 'a previously acquired legal ability carries over');
        assert.equal(story.team[0].build.i, 'Sitrus Berry');
    } finally {
        W.Math.random = random;
    }
});

test('both payment paths explain the city lock for an evolution from an enabled generation', async () => {
    const slot = partner('Magikarp');
    const story = setTeam(2, [slot]);
    story.inventory.rareCandy = 1;
    const alerts = [];
    const showAlert = W.showGameAlert;
    W.showGameAlert = message => alerts.push(message);
    try {
        await Story.evoLabEvolve(slot.id, 'Gyarados');
        await Story.evoLabEvolveWithCandy(slot.id, 'Gyarados');
        assert.deepEqual(alerts, ['Gyarados unlocks at the fourth city.', 'Gyarados unlocks at the fourth city.']);
        assert.equal(story.team[0].name, 'Magikarp');
        assert.equal(story.gold, 20000);
        assert.equal(story.inventory.rareCandy, 1);
    } finally {
        W.showGameAlert = showAlert;
    }
});

test('an existing save recovers a boxed starter whose build flag was lost', (t) => {
    const boxedStarter = partner('Fletchinder');
    boxedStarter.starter = true;
    delete boxedStarter.build.starter;
    const story = setTeam(2, [{ ...partner('Pikachu'), id: 'lead' }]);
    story.pcBox = [boxedStarter];
    const descriptor = Object.getOwnPropertyDescriptor(W, 'localStorage');
    const store = new Map([['pbs_story_save', JSON.stringify({ ...story, version: W.__STORY_SAVE_VER })]]);
    Object.defineProperty(W, 'localStorage', {
        configurable: true,
        value: {
            getItem: key => store.get(key) ?? null,
            setItem: (key, value) => store.set(key, String(value)),
            removeItem: key => store.delete(key),
        },
    });
    t.after(() => Object.defineProperty(W, 'localStorage', descriptor));

    assert.equal(ST.loadSaveForTest(), true);
    assert.equal(ST.sm.pcBox[0].build.starter, true);
    assert.equal(battlePowerCap(ST.sm.pcBox[0]), 80);
});
