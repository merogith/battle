import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const harness = await loadEngine();
const { window } = harness;
const story = window.StoryMode;
const debug = window.__storyTest;
const storage = new Map();
let refuseSave = false;

Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
        getItem: key => storage.get(key) ?? null,
        setItem(key, value) {
            if (key === 'pbs_story_save' && refuseSave) throw new Error('storage quota');
            storage.set(key, String(value));
        },
        removeItem: key => storage.delete(key),
    },
});

function arriveAt(city, overrides = {}) {
    const eventIndex = window.STORY_EVENTS_RAW.findIndex(row => row[1] === 'City' && row[2] === `City${city}`);
    debug.sm = {
        ...debug.sm,
        active: true, roadDiscoveriesEnabled: true, runSeed: 52341, _strngState: null,
        team: [{ name: 'Eevee', build: window.makeBuild('Eevee'), id: 'starter' }],
        badges: city - 1, eventIndex, balls: { poke: 2 }, inventory: { potion: 0 },
        settings: { enabledGens: [1] }, storyChoices: {}, citiesArrived: {}, wanderByEventIdx: {},
        gymCleared: {}, storyEventsFired: {}, campByEventIdx: {},
        ...overrides,
    };
    story.enterCity();
    return window.document.querySelector('.story-road-discovery');
}

function moveIntoTown() {
    window.document.querySelector('[data-wander-moveon]')?.click();
    window.document.querySelector('[data-arrival-dismiss]')?.click();
}

async function waitForEncounter() {
    for (let i = 0; i < 80 && !debug.catchState; i++) {
        await new Promise(resolve => setTimeout(resolve, 25));
    }
    assert.ok(debug.catchState?.encounter);
    return JSON.parse(JSON.stringify(debug.catchState.encounter));
}

after(() => harness.teardown());

test('the courier choice rolls back a failed write and persists a single reward on retry', () => {
    const scene = arriveAt(1);
    assert.match(scene.textContent, /The Unlit Signal/);
    assert.match(scene.querySelector('.world-scene-plate').getAttribute('src'), /route1-unlit-signal\.webp/);
    const escort = scene.querySelector('[data-narr-choice-idx="1"]');
    assert.match(escort.textContent, /Poké Ball \+ Potion/);
    const cityRow = debug.sm.eventIndex;
    refuseSave = true;
    escort.click();
    assert.equal(debug.sm.balls.poke, 2);
    assert.equal(debug.sm.inventory.potion, 0);
    assert.equal(debug.sm.storyChoices['road.discovery.1'], undefined);
    assert.equal(debug.sm.wanderByEventIdx[cityRow], undefined);
    assert.ok(escort.isConnected);
    refuseSave = false;
    escort.click();
    escort.click();
    const saved = JSON.parse(storage.get('pbs_story_save'));
    assert.equal(saved.storyChoices['road.discovery.1'], 'help');
    assert.equal(saved.balls.poke, 3);
    assert.equal(saved.inventory.potion, 1);
    assert.equal(saved.wanderByEventIdx[cityRow].done, true);
    assert.match(scene.textContent, /Received Poké Ball \+ Potion/);

    scene.querySelector('[data-narr-continue]').click();
    assert.equal(window.document.querySelector('[data-wander-moveon]'), null);
    moveIntoTown();
    const town = window.document.getElementById('story-world-city');
    assert.match(town.querySelector('summary').textContent, /Warning lamp relit/);
    assert.match(town.querySelector('[data-world-choice="help"]').textContent, /Iona’s dispatch.*you waited till she was clear/);
    assert.match(window._journalRenderHTML(), /Escort the courier/);
    story.enterCity();
    assert.equal(window.document.querySelector('.story-road-discovery'), null);
    assert.equal(debug.sm.balls.poke, 3);
});

test('the mine detour grants a redeemable evolution reward, and the main road grants none', () => {
    let scene = arriveAt(2);
    const help = scene.querySelector('[data-narr-choice-idx="1"]');
    assert.match(help.textContent, /Choose a free evolution stone/);
    help.click();
    assert.match(scene.textContent, /Received Stonewise Token.*Redeem it at Stones and Beyond/s);
    assert.equal(debug.sm.inventory.stoneToken, 1);
    scene.querySelector('[data-narr-continue]').click();
    assert.equal(window.document.querySelector('[data-wander-moveon]'), null);
    moveIntoTown();

    scene = arriveAt(2);
    const pass = scene.querySelector('[data-narr-choice-idx="2"]');
    assert.match(pass.textContent, /Go straight to your destination/);
    pass.click();
    assert.equal(debug.sm.storyChoices['road.discovery.2'], 'pass');
    assert.equal(debug.sm.inventory.stoneToken, undefined);
    scene.querySelector('[data-narr-continue]').click();
    assert.equal(window.document.querySelector('[data-wander-moveon]'), null);
    moveIntoTown();
});

test('a No Item Run previews and grants usable supplies', () => {
    const scene = arriveAt(1, { settings: { enabledGens: [1], noItemRun: true } });
    const escort = scene.querySelector('[data-narr-choice-idx="1"]');
    assert.match(escort.textContent, /Poké Ball/);
    assert.doesNotMatch(escort.textContent, /Potion/);
    escort.click();
    assert.equal(debug.sm.balls.poke, 3);
    assert.equal(debug.sm.inventory.potion, 0);
    scene.querySelector('[data-narr-continue]').click();
    moveIntoTown();
});

test('Scout uses the assigned Gym and an attack already on the team', () => {
    const gym = window.STORY_EVENTS_RAW.find(row => row[2] === 'Gym Leader 1');
    const team = [{ name: 'Pikachu', build: { ...window.makeBuild('Pikachu'), m: ['Thunder Shock'] }, id: 'starter' }];
    const scene = arriveAt(1, { trainerAssignments: { [gym[0]]: 'Misty' }, team });
    const scout = scene.querySelector('[data-narr-choice-idx="0"]');
    assert.match(scout.textContent, /Find a wild Pokémon and get a battle tip/);
    scout.click();
    assert.match(scene.textContent, /Gym favors Water types\. Pikachu already knows Thunder Shock/);
    scene.querySelector('[data-narr-continue]').click();
    assert.match(window.document.querySelector('[data-wander-moveon]').textContent, /^Continue to /);
    moveIntoTown();

    const campKey = debug.campGrassKey({ destIdx: debug.sm.eventIndex });
    debug.showWanderScreen(campKey, 1, () => {});
    assert.match(window.document.querySelector('[data-wander-search]').textContent, /Search the Tall Grass/);
    const leave = window.document.querySelector('[data-wander-moveon]');
    assert.equal(leave.textContent, 'Back to camp');
    refuseSave = true;
    leave.click();
    assert.ok(leave.isConnected);
    assert.equal(debug.sm.wanderByEventIdx[campKey].done, false);
    refuseSave = false;
    leave.click();
    assert.equal(debug.sm.wanderByEventIdx[campKey].done, true);
});

test('scouting creates an optional habitat encounter within the selected generations', async () => {
    const scene = arriveAt(1);
    scene.querySelector('[data-narr-choice-idx="0"]').click();
    assert.equal(debug.sm.storyChoices['road.discovery.1'], 'scout');
    assert.equal(debug.sm.balls.poke, 2);
    scene.querySelector('[data-narr-continue]').click();
    const tracks = window.document.querySelector('[data-wander-search]');
    assert.equal(tracks.textContent, 'Follow the tracks');
    tracks.click();
    const encounter = await waitForEncounter();
    const species = harness.engine.baseStats[encounter.name];
    assert.equal(species.gen, 1);
    assert.ok(['Water', 'Ground'].some(type => species.t1 === type || species.t2 === type));
    story.catchRun();
    moveIntoTown();
    assert.match(window._journalRenderHTML(), /Investigate the culvert/);
});

test('reload restores a scout encounter and never gives back a resolved search', async () => {
    const scene = arriveAt(1);
    scene.querySelector('[data-narr-choice-idx="0"]').click();
    scene.querySelector('[data-narr-continue]').click();
    const find = window.document.querySelector('[data-wander-search]');
    assert.equal(find.textContent, 'Follow the tracks');
    const worldRng = debug.sm._strngState;
    find.click();
    const cityRow = debug.sm.eventIndex;
    const getSavedSearch = () => JSON.parse(storage.get('pbs_story_save')).wanderByEventIdx[cityRow];
    const first = await waitForEncounter();
    const firstLocation = debug.catchState.location;
    assert.equal(debug.sm._strngState, worldRng);
    assert.equal(getSavedSearch().pendingEncounter.encounter.id, first.id);
    assert.equal(getSavedSearch().pendingEncounter.habitatKey, 'road.discovery.1');
    assert.equal(JSON.parse(storage.get('pbs_story_meta')).pokedex[first.name].firstWildHabitatKey, 'road.discovery.1');

    debug.catchState = null;
    story.continueRun();
    assert.deepEqual(await waitForEncounter(), first);
    assert.equal(debug.catchState.location, firstLocation);
    assert.equal(debug.catchState.habitatKey, 'road.discovery.1');
    assert.equal(debug.sm.balls.poke, 2);
    assert.equal(getSavedSearch().taps, 1);
    assert.equal(getSavedSearch().hits, 1);

    refuseSave = true;
    story.catchRun();
    assert.equal(debug.catchState.encounter.id, first.id);
    assert.equal(getSavedSearch().pendingEncounter.encounter.id, first.id);
    refuseSave = false;
    story.catchRun();
    assert.equal(getSavedSearch().pendingEncounter, undefined);
    assert.equal(getSavedSearch().taps, 1);
    assert.equal(getSavedSearch().hits, 1);
    assert.match(window.document.querySelector('[data-wander-search]').textContent, /Search the Tall Grass/);
    moveIntoTown();
});

test('a saved successful throw resumes the optional catch result and clears the find once', async () => {
    const scene = arriveAt(1);
    scene.querySelector('[data-narr-choice-idx="0"]').click();
    scene.querySelector('[data-narr-continue]').click();
    window.document.querySelector('[data-wander-search]').click();
    const encounter = await waitForEncounter();
    debug.catchState.forcedCatchRate = 1;
    const cityRow = debug.sm.eventIndex;
    let finishAnimation;
    const original = window.StoryFx.throwBall;
    window.StoryFx.throwBall = () => new Promise(resolve => { finishAnimation = resolve; });
    try {
        const action = story.catchThrow('poke');
        const savedThrow = JSON.parse(storage.get('pbs_story_save'));
        assert.equal(savedThrow.catchRecovery.wanderKey, cityRow);
        assert.equal(savedThrow.catchRecovery.habitatKey, 'road.discovery.1');
        assert.equal(savedThrow.balls.poke, 1);
        assert.equal(savedThrow.team.length, 1);

        debug.catchState = null;
        story.continueRun();
        assert.ok(debug.catchState?.ended);
        assert.equal(debug.sm.team.filter(partner => partner.id === encounter.id).length, 1);
        story.catchContinue();
        const finished = JSON.parse(storage.get('pbs_story_save'));
        assert.equal(finished.catchRecovery, null);
        assert.equal(finished.wanderByEventIdx[cityRow].pendingEncounter, undefined);
        assert.equal(finished.wanderByEventIdx[cityRow].hits, 1);
        assert.equal(finished.balls.poke, 1);
        assert.equal(finished.team.filter(partner => partner.id === encounter.id).length, 1);
        finishAnimation();
        await action;
    } finally {
        window.StoryFx.throwBall = original;
    }
    moveIntoTown();
});

test('a missed throw keeps the same encounter until the Pokémon flees', async () => {
    const scene = arriveAt(1);
    scene.querySelector('[data-narr-choice-idx="0"]').click();
    scene.querySelector('[data-narr-continue]').click();
    window.document.querySelector('[data-wander-search]').click();
    const encounter = await waitForEncounter();
    const cityRow = debug.sm.eventIndex;
    const original = window.StoryFx.throwBall;
    window.StoryFx.throwBall = async () => {};
    try {
        debug.catchState.forcedCatchRate = 0;
        debug.catchState.forcedFleeRate = 0;
        await story.catchThrow('poke');
        assert.equal(debug.sm.balls.poke, 1);
        debug.catchState = null;
        story.continueRun();
        assert.deepEqual(await waitForEncounter(), encounter);
        assert.equal(debug.sm.balls.poke, 1);

        debug.catchState.forcedCatchRate = 0;
        debug.catchState.forcedFleeRate = 1;
        await story.catchThrow('poke');
        const saved = JSON.parse(storage.get('pbs_story_save'));
        assert.equal(saved.balls.poke, 0);
        assert.equal(saved.wanderByEventIdx[cityRow].pendingEncounter, undefined);
        story.catchContinue();
    } finally {
        window.StoryFx.throwBall = original;
    }
    moveIntoTown();
});
