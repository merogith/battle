(function (global) {
    'use strict';

    const revision = 1;
    const rounds = 3;
    const catalog = Object.freeze([
        Object.freeze({ id: 'frontier-quarry', name: 'Quarry Trials', seed: 0x4e520101, reward: 'Quarry crest',
            themes: Object.freeze(['bulk', 'speed', 'balanced']) }),
        Object.freeze({ id: 'frontier-lakeside', name: 'Lakeside Circuit', seed: 0x4e520102, reward: 'Glasswater ferry stamp',
            themes: Object.freeze(['mixed', 'sustain', 'weather']) }),
        Object.freeze({ id: 'frontier-plateau', name: 'Plateau Three', seed: 0x4e520103, reward: 'Plateau matchbook',
            themes: Object.freeze(['balanced', 'setup', 'ace']) }),
    ]);
    const find = id => catalog.find(entry => entry.id === id);
    const key = id => id + '/v' + revision;
    const day = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';
    const statuses = new Set(['ready', 'in-progress', 'cleared', 'ended']);
    const mechanicKeys = ['classicMode', 'megaOn', 'zOn', 'dynaOn', 'teraOn'];

    function mergeRecords(current, incoming) {
        const records = {};
        for (const card of catalog) {
            const id = key(card.id);
            for (const source of [current, incoming]) {
                const entry = source && Object.hasOwn(source, id) ? source[id] : null;
                if (!Number.isInteger(entry?.bestRound) || entry.bestRound < 1 || entry.bestRound > rounds) continue;
                const finish = entry.bestRound === rounds ? day(entry.earnedAt) : '';
                const prior = records[id];
                if (!prior || entry.bestRound > prior.bestRound) {
                    records[id] = { bestRound: entry.bestRound, earnedAt: finish };
                } else if (entry.bestRound === prior.bestRound && finish && (!prior.earnedAt || finish < prior.earnedAt)) {
                    prior.earnedAt = finish;
                }
            }
        }
        return records;
    }

    function validParty(party) {
        return Array.isArray(party) && party.length > 0 && party.length <= 6 && party.every(
            slot => typeof slot?.name === 'string' && slot.name.length <= 80
                && Array.isArray(slot.build?.m) && slot.build.m.length > 0 && slot.build.m.length <= 4
                && slot.build.m.every(move => typeof move === 'string' && move.length > 0 && move.length <= 80));
    }

    function normalize(source) {
        const card = find(source?.id);
        if (!card || source.revision !== revision || source.seed !== card.seed || !statuses.has(source.status)) return null;
        const { round, status, runGens, mechanics, roster, opponents, lastCommittedResult } = source;
        if (!Number.isInteger(round) || round < 1 || round > rounds || !Array.isArray(runGens) || !runGens.length
            || runGens.length > 9 || new Set(runGens).size !== runGens.length
            || runGens.some(gen => !Number.isInteger(gen) || gen < 1 || gen > 9)
            || !mechanicKeys.every(id => typeof mechanics?.[id] === 'boolean')
            || !validParty(roster) || !Array.isArray(opponents) || opponents.length !== rounds
            || opponents.some(party => !validParty(party) || party.length !== roster.length)) return null;
        const terminal = status === 'cleared' || status === 'ended';
        const result = lastCommittedResult;
        if (terminal || round !== 1) {
            const expectedRound = terminal ? round : round - 1;
            const allowed = status === 'ended' ? ['loss', 'quit'] : ['win'];
            if (result?.round !== expectedRound || result.id !== resultId(card.id, expectedRound)
                || !allowed.includes(result.outcome) || (status === 'cleared' && round !== rounds)) return null;
        } else if (result != null) return null;
        return {
            id: card.id, revision, seed: card.seed, round, status, runGens: [...runGens], mechanics: { ...mechanics },
            roster, opponents, lastCommittedResult: result ? { ...result, date: day(result.date) } : null,
        };
    }

    function resultId(id, round) {
        return key(id) + ':' + round;
    }

    function advance(challenge, outcome, date) {
        if (!challenge || !['win', 'loss', 'quit'].includes(outcome)) return null;
        if (challenge.status !== 'in-progress' && (challenge.status !== 'ready' || outcome !== 'quit')) return null;
        const { id, round } = challenge;
        const lastCommittedResult = { id: resultId(id, round), round, outcome, date: day(date) };
        if (outcome !== 'win') return { ...challenge, lastCommittedResult, status: 'ended' };
        if (round === rounds) return { ...challenge, lastCommittedResult, status: 'cleared' };
        return { ...challenge, lastCommittedResult, round: round + 1, status: 'ready' };
    }

    function recordFor(challenge) {
        if (!challenge) return {};
        const bestRound = challenge.status === 'cleared' ? rounds : challenge.round - 1;
        if (bestRound < 1) return {};
        const earnedAt = challenge.status === 'cleared' ? day(challenge.lastCommittedResult?.date) : '';
        return { [key(challenge.id)]: { bestRound, earnedAt } };
    }

    function roundSeed(seed, round) {
        const mixed = (seed ^ Math.imul(round, 0x9e3779b9)) >>> 0;
        return Math.imul(mixed ^ (mixed >>> 16), 0x45d9f3b) >>> 0;
    }

    global.FrontierChallenges = Object.freeze({ revision, rounds, catalog, find, key, mergeRecords, normalize, advance, recordFor, roundSeed });
})(window);
