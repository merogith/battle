import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { loadEngine } from '../helpers/load-engine.js';

const harness = await loadEngine();
const { window } = harness;
const story = window.__storyTest;
const data = JSON.parse(readFileSync(new URL('../../data/story/campaign.json', import.meta.url), 'utf8'));
const backgrounds = JSON.parse(readFileSync(new URL('../../sprites/story/backgrounds/manifest.json', import.meta.url), 'utf8'));

after(() => harness.teardown());

test('the nine roads expose all three saved outcomes without changing their run', () => {
    for (let city = 1; city <= 9; city++) {
        const titles = new Set();
        for (const choice of ['scout', 'help', 'pass']) {
            const run = { storyChoices: { [`road.discovery.${city}`]: choice }, runSeed: 23, gold: 900, inventory: {}, _strngState: 41 };
            const previous = JSON.stringify(run);
            const [entry] = story.worldNotes(city, run);
            assert.equal(entry.source, 'road');
            assert.equal(entry.choice, choice);
            assert.equal(entry.copy, data.roads[city][choice].copy);
            titles.add(entry.title);
            assert.equal(JSON.stringify(run), previous);
        }
        assert.equal(titles.size, 3);
        assert.equal(story.worldNotes(city, {}).length, 0);
        assert.equal(story.worldNotes(city, { storyChoices: { [`road.discovery.${city}`]: 'unknown' } }).length, 0);
    }
});

test('the twenty chapter callbacks are scoped to their later location', () => {
    for (const chapter of data.chapters) {
        for (const choice of ['listen', 'act']) {
            const run = { storyChoices: { [`adventure.${chapter.choice}`]: choice } };
            const [entry] = story.worldNotes(chapter.city, run);
            assert.equal(entry.source, chapter.choice);
            assert.equal(entry.choice, choice);
            assert.equal(entry.title, chapter[choice].title);
            assert.equal(entry.private, chapter[choice].private);
            const unrelatedCity = chapter.city === 1 ? 2 : 1;
            assert.equal(story.worldNotes(unrelatedCity, run).length, 0);
        }
    }
});

test('public aftermaths require their own completed ending and respect its choices', () => {
    const run = {
        tracks: { extra: 'cubone', villain: 'rocket' },
        storyChoices: { 'extra.cubone.burial': 'accepted' },
        storyEventsFired: { 'extra.cubone.raid': true, 'villain.rocket.boss': true },
    };
    assert.equal(story.worldNotes(8, run).length, 0);
    run.storyEventsFired['extra.cubone.ending'] = true;
    run.storyEventsFired['villain.rocket.ending'] = true;
    assert.equal(story.worldNotes(6, run).length, 0);
    assert.equal(story.worldNotes(7, run).length, 1);
    assert.match(story.worldNotes(8, run)[0].copy, /grandmother’s letter/);
    assert.equal(story.worldNotes(8, run)[1].title, 'A truck without a logo');
});

test('the world card keeps private labels within a read-only disclosure', () => {
    story.sm.storyChoices = { 'adventure.chapter-3': 'listen' };
    story.renderWorldContext(4);
    const host = window.document.getElementById('story-world-city');
    assert.equal(host.hidden, false);
    const details = host.querySelector('details');
    assert.equal(details.open, false);
    assert.equal(details.querySelector('summary').textContent, 'Private field note');
    assert.match(details.querySelector('h3').textContent, /Private duty-desk appointment/);
    details.open = true;
    story.renderWorldContext(4);
    assert.equal(host.querySelector('details'), details, 'unchanged renders retain the disclosure node');
    story.renderWorldContext(3);
    assert.equal(host.hidden, true);
});

test('each of the ten guided locations uses an explicit packaged city backdrop', () => {
    assert.equal(backgrounds.cityUrls.length, 10);
    assert.equal(new Set(backgrounds.cityUrls).size, 10);
    for (const [city, path] of backgrounds.cityUrls.entries()) {
        assert.equal(story.cityBackgroundUrl(city), path);
        assert.ok(existsSync(new URL('../../' + path, import.meta.url)), path);
    }
});
