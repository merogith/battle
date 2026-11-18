import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInThisContext } from 'node:vm';

const source = readFileSync(new URL('../../data/story/frontier-challenges.js', import.meta.url), 'utf8');
const browser = {};
runInThisContext(`(function(window) {${source}})`)(browser);
const challenges = browser.FrontierChallenges;
const matchup = { name: 'Bulbasaur', build: { m: ['Vine Whip'] } };
const quarry = challenges.catalog[0];

function attempt() {
    return {
        ...quarry, revision: challenges.revision, round: 1, status: 'ready', runGens: [1],
        mechanics: { classicMode: true, megaOn: false, zOn: false, dynaOn: false, teraOn: false },
        roster: [matchup], opponents: [[matchup], [matchup], [matchup]], lastCommittedResult: null,
    };
}

test('catalog IDs, seed revisions and round seeds stay stable', () => {
    assert.deepEqual(challenges.catalog.map(({ id, seed }) => [id, seed]), [
        ['frontier-quarry', 0x4e520101], ['frontier-lakeside', 0x4e520102], ['frontier-plateau', 0x4e520103],
    ]);
    const seeds = challenges.catalog.flatMap(({ seed }) => Array.from({ length: 6 }, (_, i) => challenges.roundSeed(seed, i + 1)));
    assert.equal(new Set(seeds).size, 18);
    assert.equal(challenges.roundSeed(quarry.seed, 3), seeds[2]);
    assert.equal(challenges.key(quarry.id), 'frontier-quarry/v1');
});

test('a reload restores the prepared lineup and round, but invalid attempts are rejected', () => {
    const frozen = challenges.normalize({ ...attempt(), status: 'in-progress' });
    assert.deepEqual(challenges.normalize(JSON.parse(JSON.stringify(frozen))), frozen);
    assert.equal(challenges.normalize({ ...frozen, revision: 2 }), null);
    assert.equal(challenges.normalize({ ...frozen, runGens: [1, 1] }), null);
    assert.equal(challenges.normalize({ ...frozen, round: 2 }), null);
    assert.equal(challenges.normalize({ ...frozen, opponents: [] }), null);
    assert.equal(challenges.normalize({ ...frozen, roster: [{ name: 'Bulbasaur', build: { m: [] } }] }), null);
    assert.equal(challenges.normalize({ ...frozen, mechanics: {} }), null);
});

test('each cleared round has one receipt and only three wins earn a stamp', () => {
    const date = '2026-11-18';
    let current = challenges.normalize(attempt());
    assert.equal(challenges.advance(current, 'win', date), null);
    for (const round of [1, 2, 3]) {
        current = challenges.advance({ ...current, status: 'in-progress' }, 'win', date);
        assert.deepEqual(challenges.normalize(current), current);
        assert.deepEqual(challenges.recordFor(current), {
            [challenges.key(quarry.id)]: { bestRound: round, earnedAt: round === 3 ? date : '' },
        });
        assert.equal(challenges.advance(current, 'win', date), null);
    }
    assert.equal(current.status, 'cleared');
    const lost = challenges.advance({ ...attempt(), status: 'in-progress' }, 'loss', date);
    const quit = challenges.advance(attempt(), 'quit', date);
    assert.equal(lost.status, 'ended');
    assert.deepEqual(challenges.recordFor(lost), {});
    assert.deepEqual(challenges.recordFor(quit), {});
});

test('overlapping career records merge by best round and earliest day', () => {
    const quarryKey = challenges.key(quarry.id);
    const plateauKey = challenges.key(challenges.catalog[2].id);
    const current = { [quarryKey]: { bestRound: 3, earnedAt: '2026-11-18' }, [plateauKey]: { bestRound: 1 } };
    const backup = { [quarryKey]: { bestRound: 2 }, 'frontier-lakeside/v1': { bestRound: 10 } };
    const merged = challenges.mergeRecords(current, backup);
    assert.deepEqual(merged, { ...current, [plateauKey]: { bestRound: 1, earnedAt: '' } });
    assert.deepEqual(challenges.mergeRecords(merged, backup), merged);
    assert.equal(challenges.mergeRecords(merged, { [quarryKey]: { bestRound: 3, earnedAt: '2026-10-21' } })[quarryKey].earnedAt, '2026-10-21');
});
