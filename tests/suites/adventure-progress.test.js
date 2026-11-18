import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import adventure from '../../data/story/adventure-progress.js';

const idA = 'run-first-journey';
const idB = 'run-second-journey';
const idC = 'run-third-journey';
const publish = (archive, runId, storyChoices, flags = {}) => adventure.record(archive, {
    runId,
    seed: -23,
    storyChoices,
    ...flags,
});

test('the CommonJS and browser classic script entry points expose the same API', () => {
    const context = {};
    const source = readFileSync(new URL('../../data/story/adventure-progress.js', import.meta.url), 'utf8');
    runInNewContext(source, context);
    assert.deepEqual(Object.keys(context.AdventureProgress), Object.keys(adventure));
    const runIds = Array.from({ length: 32 }, () => adventure.createRunId());
    assert.ok(runIds.every(id => /^run-[a-zA-Z0-9-]{8,96}$/.test(id)));
    assert.equal(new Set(runIds).size, runIds.length);
});

test('a chapter choice and secret are recorded once without changing input saves', () => {
    const startingArchive = Object.freeze({ version: 1, runs: Object.freeze({}) });
    const storyChoices = Object.freeze({
        'adventure.chapter-1': 'listen',
        'adventure.secret.chapter-1': true,
        'adventure.secret.chapter-2': false,
        'adventure.chapter-10': 'act',
        'road.discovery.1': 'help',
    });
    const first = publish(startingArchive, idA, storyChoices);
    assert.equal(first.changed, true);
    assert.deepEqual(first.newMilestones.map(item => item.id), ['first-secret']);
    assert.deepEqual(startingArchive.runs, {});
    assert.deepEqual(first.archive.runs[idA], {
        seed: 4294967273,
        choices: { 'chapter-1': 'listen' },
        secrets: { 'chapter-1': true },
        leagueCleared: false,
        endingSeen: false,
    });

    const reload = publish(JSON.parse(JSON.stringify(first.archive)), idA, storyChoices);
    assert.deepEqual(reload, { archive: first.archive, changed: false, newMilestones: [] });
    const differentChoice = publish(reload.archive, idA, {
        'adventure.chapter-1': 'act',
        'adventure.chapter-2': 'act',
    });
    assert.equal(differentChoice.changed, true);
    assert.equal(differentChoice.archive.runs[idA].choices['chapter-1'], 'listen');
    assert.equal(differentChoice.archive.runs[idA].choices['chapter-2'], 'act');
    assert.equal(adventure.summarize(differentChoice.archive).alternateChoices, 0);
});

test('an older same-run checkpoint restores earned secrets and first choices only for that run', () => {
    const { archive } = publish(null, idA, {
        'adventure.chapter-1': 'listen',
        'adventure.secret.chapter-1': true,
        'adventure.chapter-2': 'act',
    });
    const old = Object.freeze({ 'adventure.chapter-1': 'act', 'road.discovery.1': 'scout' });
    const fixed = adventure.reconcileChoices(archive, idA, old);
    assert.deepEqual(fixed, {
        'adventure.chapter-1': 'listen',
        'adventure.secret.chapter-1': true,
        'adventure.chapter-2': 'act',
        'road.discovery.1': 'scout',
    });
    assert.equal(old['adventure.chapter-1'], 'act');
    assert.equal(adventure.reconcileChoices(archive, idB, old), old);
    assert.equal(adventure.reconcileChoices(archive, idA, fixed), fixed);
});

test('a full archive merge preserves local claims after a rollback and joins disjoint progress', () => {
    const local = publish(null, idA, {
        'adventure.chapter-1': 'listen',
        'adventure.secret.chapter-1': true,
    }, { leagueCleared: true }).archive;
    const older = publish(null, idA, {
        'adventure.chapter-1': 'act',
        'adventure.chapter-2': 'listen',
    }).archive;
    const incoming = publish(older, idB, { 'adventure.chapter-1': 'act' }).archive;
    const merged = adventure.mergeArchives(local, incoming);
    assert.equal(merged.runs[idA].choices['chapter-1'], 'listen');
    assert.equal(merged.runs[idA].choices['chapter-2'], 'listen');
    assert.equal(merged.runs[idA].secrets['chapter-1'], true);
    assert.equal(merged.runs[idA].leagueCleared, true);
    assert.equal(merged.runs[idB].choices['chapter-1'], 'act');
    assert.deepEqual(adventure.mergeArchives(merged, incoming), merged);
    const incompatible = publish(null, idA, { 'adventure.chapter-7': 'act' }, { seed: 42 }).archive;
    assert.deepEqual(adventure.mergeArchives(merged, incompatible), merged);
    assert.equal(publish(merged, idA, { 'adventure.chapter-8': 'act' }, { seed: 42 }).changed, false);
});

test('the original afterword requires opposite aftermath answers from distinct completed runs', () => {
    const listen = { 'adventure.aftermath': 'listen' };
    const act = { 'adventure.aftermath': 'act' };
    const first = publish(null, idA, listen, { leagueCleared: true, endingSeen: true });
    const alternateWithoutEnding = publish(first.archive, idB, act, { leagueCleared: true });
    const early = adventure.summarize(alternateWithoutEnding.archive);
    assert.equal(early.endings, 1);
    assert.equal(early.alternateChoices, 1);
    assert.deepEqual(early.replayScenes, []);
    const changedSameRun = publish(first.archive, idA, act, { endingSeen: true });
    assert.equal(changedSameRun.changed, false);
    assert.deepEqual(adventure.summarize(changedSameRun.archive).replayScenes, []);

    const ending = publish(alternateWithoutEnding.archive, idB, act, { endingSeen: true });
    assert.deepEqual(ending.newMilestones.map(item => item.id), ['opposite-aftermaths']);
    const summary = adventure.summarize(ending.archive);
    assert.equal(summary.leagueClears, 2);
    assert.equal(summary.endings, 2);
    assert.equal(summary.runs, 2, 'two distinct runs may use the same seed');
    assert.equal(summary.replayScenes.length, 1);
    assert.equal(summary.replayScenes[0].id, 'keepers-spare-copy');
    assert.equal(summary.replayScenes[0].speaker.name, 'The Night Clerk');
    assert.ok(summary.replayScenes[0].panels.every(panel => panel.text));
    summary.replayScenes[0].panels[0].text = 'Changed by caller';
    assert.notEqual(adventure.summarize(ending.archive).replayScenes[0].panels[0].text, 'Changed by caller');
    assert.deepEqual(publish(ending.archive, idB, act, { endingSeen: true }).newMilestones, []);
});

test('Threadkeeper counts distinct secrets within a single journey', () => {
    const secret = chapter => ({ ['adventure.secret.chapter-' + chapter]: true });
    let archive = publish(null, idA, secret(1)).archive;
    archive = publish(archive, idB, secret(2)).archive;
    archive = publish(archive, idC, secret(3)).archive;
    const spread = adventure.summarize(archive);
    assert.equal(spread.distinctSecrets, 3);
    assert.equal(spread.mostSecretsInRun, 1);
    assert.equal(spread.milestones.find(item => item.id === 'three-secrets').earned, false);
    const complete = publish(publish(archive, idA, secret(2)).archive, idA, secret(3));
    assert.deepEqual(complete.newMilestones.map(item => item.id), ['three-secrets']);
});

test('field keepsakes are derived from earned choices without changing stored records', () => {
    const ineligible = publish(null, idA, { 'adventure.chapter-1': 'act', 'adventure.chapter-7': 'listen' }).archive;
    assert.deepEqual(adventure.summarize(ineligible).keepsakes, []);

    const first = publish(null, idA, {
        'adventure.chapter-1': 'listen', 'adventure.aftermath': 'listen',
    }, { leagueCleared: true, endingSeen: true }).archive;
    const second = publish(first, idB, {
        'adventure.chapter-7': 'act', 'adventure.aftermath': 'act',
    }, { leagueCleared: true, endingSeen: true }).archive;
    const saved = JSON.stringify(second);
    const summary = adventure.summarize(second);
    assert.deepEqual(summary.keepsakes.map(item => item.id), ['survey-rubbing', 'pass-lantern', 'keepers-spare-copy']);
    assert.equal(JSON.stringify(second), saved);
    summary.keepsakes[0].note = 'caller copy';
    assert.notEqual(adventure.summarize(second).keepsakes[0].note, 'caller copy');
});

test('missing or malformed archive entries cannot invent economic rewards or milestones', () => {
    const empty = { version: 1, runs: {} };
    assert.deepEqual(adventure.normalize(), empty);
    assert.deepEqual(adventure.normalize({ version: 1, runs: [] }), empty);
    assert.deepEqual(adventure.normalize(JSON.parse('{"version":1,"runs":{"constructor":{"seed":4,"endingSeen":true}}}')), empty);
    const source = {
        version: 1,
        runs: {
            [idA]: {
                seed: 4,
                gold: 10000,
                inventory: { potion: 100000 },
                choices: { 'chapter-1': 'act', 'chapter-2': 'unknown', 'chapter-99': 'act' },
                secrets: { 'chapter-1': 'true' },
                leagueCleared: 1,
            },
        },
    };
    assert.deepEqual(adventure.normalize(source).runs[idA], {
        seed: 4,
        choices: { 'chapter-1': 'act' },
        secrets: {},
        leagueCleared: false,
        endingSeen: false,
    });
    const invalid = publish(empty, 'not-a-run', { 'adventure.chapter-1': 'listen' });
    assert.equal(invalid.changed, false);
    assert.equal(adventure.summarize(source).milestones.some(item => item.earned), false);
});
