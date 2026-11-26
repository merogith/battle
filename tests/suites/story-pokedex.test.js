import { after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const harness = await loadEngine();
const { window, engine } = harness;
const story = window.StoryMode;
const testStory = window.__storyTest;
const storage = new Map();
const initialStory = testStory.sm;
const metaKey = 'pbs_story_meta';
const readMeta = () => JSON.parse(storage.get(metaKey) || '{}');
let rejectSave = false;

Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
        getItem: key => storage.get(key) ?? null,
        setItem(key, value) {
            if (rejectSave && key === 'pbs_story_save') throw new Error('Fixture storage quota exhausted');
            storage.set(key, String(value));
        },
        removeItem: key => storage.delete(key),
    },
});

beforeEach(() => {
    rejectSave = false;
    storage.clear();
    harness.reset();
    testStory.sm = {
        ...initialStory,
        active: true,
        runSeed: 444,
        _strngState: null,
        badges: 0,
        eventIndex: 0,
        team: [],
        pcBox: [],
        pokedex: { seen: [], caught: [] },
    };
    testStory.catchState = null;
});

after(() => harness.teardown());

test('an observed species gets a reachable habitat lead without rolling an encounter', () => {
    const rows = testStory.STORY_EVENTS_RAW;
    const departure = rows.findIndex(event => event[0] === 6);
    const arrival = rows.findIndex(event => event[0] === 9);
    Object.assign(testStory.sm, {
        eventIndex: departure, badges: 1, roadDiscoveriesEnabled: true,
        settings: { enabledGens: [1] }, citiesArrived: { 0: true, 1: true },
        team: [{ id: 'partner', name: 'Pikachu', build: { m: ['Thunder Shock'], n: 'Hardy' } }],
        storyChoices: {}, wanderByEventIdx: {},
    });
    story._markDexSeen('Geodude', false);
    const before = JSON.stringify(testStory.sm);
    story.openCollection('pokedex');
    assert.equal(story.pokedexOpenEntry('Geodude'), true);
    const lead = () => window.document.querySelector('.pdex-habitat').textContent;
    assert.match(lead(), /Unsearched[\s\S]*Mineshaft Pass/);
    assert.equal(JSON.stringify(testStory.sm), before);

    testStory.sm.wanderByEventIdx[arrival] = { taps: 1 };
    story.pokedexOpenEntry('Geodude');
    assert.match(lead(), /No route lead yet/);
    testStory.sm.wanderByEventIdx = {};
    testStory.sm.settings.enabledGens = [9];
    story.pokedexOpenEntry('Geodude');
    assert.match(lead(), /No route lead yet/);
});

test('a structured habitat record can identify a later road while legacy sighting text stays historical', () => {
    const beforeMineRoad = testStory.STORY_EVENTS_RAW.findIndex(event => event[0] === 4);
    const location = 'Mineshaft Pass · Lower mine workings';
    Object.assign(testStory.sm, {
        eventIndex: beforeMineRoad, roadDiscoveriesEnabled: true,
        settings: { enabledGens: [1] }, citiesArrived: { 0: true, 1: true },
        team: [{ id: 'partner', name: 'Pikachu', build: { m: ['Thunder Shock'], n: 'Hardy' } }],
    });
    story._markDexSeen('Geodude', false, location);
    story.openCollection('pokedex');
    assert.equal(story.pokedexOpenEntry('Geodude'), true);
    const lead = () => window.document.querySelector('.pdex-habitat').textContent;
    assert.match(lead(), /Recorded sighting[\s\S]*Lower mine workings/);
    assert.doesNotMatch(lead(), /Later in the journey/);
    assert.equal(readMeta().pokedex.Geodude.firstWildHabitatKey, undefined);

    story._markDexSeen('Geodude', false, location, 'road.discovery.unknown');
    assert.equal(readMeta().pokedex.Geodude.firstWildHabitatKey, undefined);
    story._markDexSeen('Geodude', false, location, 'road.discovery.2');
    story.pokedexOpenEntry('Geodude');
    assert.match(lead(), /Later in the journey[\s\S]*Mineshaft Pass/);
    assert.equal(readMeta().pokedex.Geodude.firstWildLocation, location);
    assert.equal(readMeta().pokedex.Geodude.firstWildHabitatKey, 'road.discovery.2');
});

test('legacy regional-form records appear once in the species Pokédex and achievements', () => {
    assert.equal(engine.baseStats['Wooper-Paldea'].baseSpecies, 'Wooper');
    const pokedex = {
        'Wooper-Paldea': { caught: true, shinyCaught: true },
        Wooper: { seen: true, caught: true },
    };
    storage.set(metaKey, JSON.stringify({ pokedex }));

    story.openCollection('pokedex');
    story.pokedexSetGen(2);
    const collection = window.document.getElementById('collection-body');
    assert.equal(collection.querySelectorAll('.pdex-cell--caught').length, 1);
    assert.equal(collection.querySelector('.pdex-cell--caught .pdex-cell-name').textContent, 'Wooper');
    assert.equal(collection.querySelector('.pdex-cell--unknown img'), null);

    story.pokedexSetShinyView(true);
    assert.equal(collection.querySelectorAll('.pdex-cell--caught.pdex-cell--shiny').length, 1);
    story.pokedexSetShinyView(false);
    story._markDexSeen('Pikachu', false);
    assert.equal(readMeta().achievements.dex_caught.progress, 1);
    assert.equal(readMeta().achievements.dex_seen.progress, 2);
    assert.deepEqual(readMeta().pokedex['Wooper-Paldea'], pokedex['Wooper-Paldea']);
});

test('hatching adds ownership to both Pokédex views without awarding a wild catch', async () => {
    const egg = story._makeEggSlot('Pichu', -2);
    testStory.sm.team = [egg];
    assert.deepEqual(Array.from(await story._hatchEligibleEggs()), ['Pichu']);
    assert.equal(testStory.sm.pokedex.caught[0], 'Pichu');
    assert.equal(readMeta().pokedex.Pichu.caught, true);
    assert.equal(readMeta().pokedex.Pichu.acquisition, 'hatch');
    assert.equal(readMeta().achievements.wilds_caught, undefined);
    assert.equal(readMeta().achievements.first_catch, undefined);
});

test('a shiny gift records ownership without earning wild-catch achievements', () => {
    story._markDexCaught('Pikachu', true);
    assert.equal(readMeta().pokedex.Pikachu.shinyCaught, true);
    assert.equal(readMeta().achievements.first_shiny, undefined);
    assert.equal(readMeta().achievements.first_catch, undefined);
    assert.equal(readMeta().achievements.wilds_caught, undefined);
});

test('a field note is optional and follows real sightings of the selected form', () => {
    story._markDexSeen('Cubone', false, 'Breakwater Road');
    story.openCollection('pokedex');
    assert.equal(story.pokedexOpenEntry('Cubone'), true);
    const note = () => window.document.querySelector('.pdex-field-note');
    assert.equal(note(), null, 'A tutorial or ordinary seen-only record is insufficient');
    story._markDexCaught('Cubone', true, false, 'gift');
    story._markDexSeen('Cubone', false, 'Breakwater Road', null, true);
    story.pokedexOpenEntry('Cubone', false);
    assert.equal(note().open, false);
    assert.match(note().textContent, /Field note.*Regional observations.*skull/s);
    story.pokedexOpenEntry('Cubone', true);
    assert.equal(note(), null, 'A regular encounter does not prove a shiny sighting');
    story._markDexSeen('Cubone', true, 'Safari Zone', null, true);
    story.pokedexOpenEntry('Cubone', true);
    assert.ok(note());
});

test('Caught only finds early captures and composes with generation and shiny views', () => {
    story._markDexCaught('Horsea', false, false, 'starter');
    story._markDexSeen('Eevee', false);
    story.openCollection('pokedex');
    story.pokedexSetGen(0);
    story.pokedexSetShinyView(false);
    const collection = window.document.getElementById('collection-body');
    assert.match(collection.querySelector('.pdex-summary').textContent, /1\/1025 caught/);
    const filters = collection.querySelector('.pdex-more-filters');
    assert.equal(filters.open, false);
    filters.open = true;
    const toggle = () => collection.querySelector('#pdex-caught-only');
    const entries = () => [...collection.querySelectorAll('.pdex-grid [data-dex-name]')].map(button => button.dataset.dexName);
    toggle().click();
    assert.equal(toggle().getAttribute('aria-pressed'), 'true');
    assert.equal(window.document.activeElement, toggle());
    assert.equal(collection.querySelector('.pdex-more-filters').open, true);
    assert.deepEqual(entries(), ['Horsea']);
    assert.equal(collection.querySelectorAll('.pdex-cell--unknown').length, 0);

    story.pokedexSetShinyView(true);
    assert.match(collection.querySelector('.ach-empty').textContent, /No shiny Pokémon caught/);
    story._markDexCaught('Pikachu', true);
    story.pokedexSetGen(1);
    assert.deepEqual(entries(), ['Pikachu']);
    story.pokedexSetGen(2);
    assert.deepEqual(entries(), []);
    story.pokedexSetShinyView(false);
    assert.match(collection.querySelector('.ach-empty').textContent, /No Pokémon caught/);
    toggle().click();
    assert.equal(toggle().getAttribute('aria-pressed'), 'false');
    assert.ok(collection.querySelectorAll('.pdex-cell--unknown').length > 0);
});

test('the ten-species trophy counts distinct base species', () => {
    const names = ['Bulbasaur', 'Charmander', 'Squirtle', 'Caterpie', 'Weedle', 'Pidgey', 'Ekans', 'Pikachu', 'Wooper'];
    for (const name of names) story._markDexCaught(name, false);
    story._markDexCaught('Wooper-Paldea', true);
    assert.equal(readMeta().achievements.dex_caught.progress, 9);
    assert.equal(readMeta().achievements.r_catch_some, undefined);
    story._markDexCaught('Sandshrew', false);
    assert.equal(readMeta().achievements.r_catch_some.currentRank, 1);
});

test('Safari captures earn their trophy when a full party sends the Pokémon to the PC', async () => {
    testStory.sm.team = [{ name: 'Pikachu', build: {} }, { name: 'Eevee', build: {} }];
    testStory.sm.safari = { freeEntryUsed: false };
    testStory.sm.scenesShown = { firstSafari: true };
    await story.enterSafariZone();
    for (let i = 0; i < 40 && !testStory.catchState; i++) {
        await new Promise(resolve => setTimeout(resolve, 25));
    }
    const encounter = testStory.catchState;
    assert.equal(encounter?.safariMode, true);
    encounter.forcedCatchRate = Infinity;
    await story.catchThrow('safari');
    assert.equal(testStory.sm.pcBox.length, 0);

    story.catchResolveSendToPC();
    assert.equal(testStory.sm.pcBox[0].name, encounter.encounter.name);
    assert.equal(readMeta().achievements.r_safari.currentRank, 1);
    assert.equal(readMeta().achievements.first_catch.currentRank, 1);
    assert.equal(readMeta().achievements.wilds_caught.progress, 1);

    const name = encounter.encounter.name;
    assert.equal(readMeta().pokedex[name].acquisition, 'safari');
    assert.equal(readMeta().pokedex[name].firstWildLocation, 'Safari Zone');
    const dexButton = window.document.querySelector('#story-catch-body [data-dex-name]');
    dexButton.focus();
    dexButton.click();
    assert.equal(window.document.getElementById('pdex-entry-title').textContent, name);
    assert.equal(window.document.activeElement.id, 'pdex-entry-title');
    assert.match(window.document.querySelector('.pdex-entry-facts').textContent, /Safari catch.*Safari Zone/s);
    assert.equal(testStory.catchState, encounter);
    story.closeCollection();
    assert.equal(window.document.getElementById('screen-story-catch').classList.contains('hidden'), false);
    assert.equal(window.document.activeElement, dexButton);
});

test('known family opens observed forms, preserves field evidence, and restores the grid', () => {
    story._markDexSeen('Wooper-Paldea', false, 'Harbor pond');
    story._markDexCaught('Wooper-Paldea', false, false, 'gift');
    story._markDexSeen('Wooper-Paldea', true, 'Washed-out culvert');
    story._markDexCaught('Wooper-Paldea', true, true);
    story._markDexSeen('Wooper-Paldea', false, 'Safari Zone');
    story._markDexCaught('Wooper', false, false, 'gift');
    story._markDexCaught('Wooper', false, false, 'trade');
    assert.equal(readMeta().pokedex['Wooper-Paldea'].firstWildLocation, 'Harbor pond');
    assert.equal(readMeta().pokedex['Wooper-Paldea'].firstShinyWildLocation, 'Washed-out culvert');
    assert.equal(readMeta().pokedex.Wooper.acquisition, 'gift');

    story.openCollection('pokedex');
    story.pokedexSetShinyView(false);
    story.pokedexSetGen(2);
    const collection = window.document.getElementById('collection-body');
    const wooper = collection.querySelector('button[data-dex-name="Wooper"]');
    assert.equal(collection.querySelector('.pdex-cell--unknown button'), null);
    assert.equal(story.pokedexOpenEntry('Pichu'), false);
    collection.scrollTop = 162;
    wooper.click();
    assert.equal(window.document.getElementById('pdex-entry-title').textContent, 'Wooper');
    assert.match(collection.textContent, /Recorded sourceGift/);

    collection.querySelector('.pdex-entry-forms [data-dex-name="Wooper-Paldea"]').click();
    assert.equal(window.document.getElementById('pdex-entry-title').textContent, 'Wooper-Paldea');
    assert.match(collection.textContent, /Wild sightingHarbor pond/);
    story.pokedexCloseEntry();
    assert.equal(collection.scrollTop, 162);
    assert.equal(window.document.activeElement.dataset.dexName, 'Wooper');

    story.pokedexSetShinyView(true);
    collection.querySelector('button[data-dex-name="Wooper"]').click();
    assert.equal(window.document.getElementById('pdex-entry-title').textContent, 'Wooper-Paldea');
    assert.equal(collection.querySelector('.pdex-entry-hero img').dataset.shiny, 'true');
    assert.match(collection.textContent, /Recorded sourceWild catch/);
    assert.match(collection.textContent, /Wild sightingWashed-out culvert/);
    assert.equal(collection.querySelector('.pdex-entry-forms'), null);
});

test('a successful throw survives reload during its animation and before Continue', async () => {
    testStory.sm.eventIndex = testStory.STORY_EVENTS_RAW.findIndex(row => row[2] === 'Basic Trainer');
    testStory.sm.balls = { poke: 1 };
    testStory.catchState = {
        encounter: { name: 'Pikachu', id: 'interrupted-pikachu', build: { m: ['Tackle'] } },
        forcedCatchRate: 1,
        tutorialMode: true,
        location: 'Route 1',
    };
    testStory.catchRender();
    const original = window.StoryFx.throwBall;
    let finishAnimation;
    window.StoryFx.throwBall = () => new Promise(resolve => { finishAnimation = resolve; });
    try {
        const action = story.catchThrow('poke');
        const before = JSON.parse(storage.get('pbs_story_save'));
        assert.equal(typeof finishAnimation, 'function');
        assert.equal(before.catchRecovery.caught.name, 'Pikachu');
        assert.equal(before.balls.poke, 0);
        assert.equal(before.team.length, 0);
        window.dispatchEvent(new window.Event('pagehide'));
        assert.equal(JSON.parse(storage.get('pbs_story_save')).eventIndex, before.eventIndex);

        story.continueRun();
        assert.equal(testStory.sm.team[0].name, 'Pikachu');
        assert.equal(testStory.sm.catchTutorialDone, true);
        assert.equal(readMeta().achievements.wilds_caught.progress, 1);
        assert.equal(readMeta().pokedex.Pikachu.firstWildLocation, 'Route 1');
        assert.equal(window.document.querySelector('#story-catch-body [data-dex-name]').dataset.dexName, 'Pikachu');

        finishAnimation();
        await action;
        story.continueRun();
        assert.equal(testStory.sm.team.length, 1);
        assert.equal(testStory.sm.balls.poke, 0);
        assert.equal(readMeta().achievements.wilds_caught.progress, 1);
        assert.ok(window.document.querySelector('#story-catch-body [data-catch-continue]'));
    } finally {
        finishAnimation?.();
        window.StoryFx.throwBall = original;
    }
});

test('an unsuccessful save leaves the throw, roster and gameplay RNG unspent', async () => {
    testStory.sm.balls = { poke: 1 };
    testStory.catchState = {
        encounter: { name: 'Pikachu', build: { m: ['Tackle'] } },
        forcedCatchRate: 1,
    };
    testStory.catchRender();
    const beforeRng = testStory.sm._strngState;
    rejectSave = true;
    try {
        await story.catchThrow('poke');
        assert.equal(testStory.sm.balls.poke, 1);
        assert.equal(testStory.sm._strngState, beforeRng);
        assert.equal(testStory.sm.team.length, 0);
        assert.equal(testStory.sm.catchRecovery, null);
        assert.equal(readMeta().achievements?.wilds_caught, undefined);
    } finally {
        rejectSave = false;
    }
    await story.catchThrow('poke');
    assert.equal(testStory.sm.team[0].name, 'Pikachu');
    assert.equal(readMeta().achievements.wilds_caught.progress, 1);
});

test('Quick Battle does not record opponents in a loaded story Pokédex', async () => {
    engine.state.p1Draft = [{ name: 'Pikachu', build: { m: ['Tackle'], _isShiny: false } }];
    engine.state.p2Draft = [{ name: 'Eevee', build: { m: ['Tackle'], _isShiny: false } }];
    await window.startBattle();
    assert.equal(engine.state.foeParty[0].name, 'Eevee');
    assert.equal(readMeta().pokedex?.Eevee, undefined);
    assert.equal(testStory.sm.pokedex.seen.length, 0);
});
