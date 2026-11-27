/* Durable, cosmetic campaign records. The host owns saves and scene rendering. */
(function (global) {
    'use strict';

    const VERSION = 1;
    const CHAPTERS = [...Array.from({ length: 9 }, (_, index) => 'chapter-' + (index + 1)), 'aftermath'];
    const RUN_ID = /^run-[a-zA-Z0-9-]{8,96}$/;
    let fallbackSequence = 0;

    const AFTERWORD = {
        id: 'keepers-spare-copy',
        title: 'The Keeper’s Spare Copy',
        place: 'The Archive',
        speaker: { name: 'The Night Clerk', role: 'Archive attendant', sprite: 'Clerk' },
        panels: [
            { text: 'The clerk puts two accounts on the desk. Both have your handwriting. Each one describes a different way out.' },
            { text: '“The first time you came through, I thought one account had to be wrong. Then the dispatch came back signed in both inks.”' },
            { text: 'They file the accounts beside each other. Through the window, someone has finally replaced the lamp that went out on the first road.' },
        ],
    };
    const KEEPSAKES = [
        {
            id: 'survey-rubbing',
            title: 'Survey Rubbing',
            chapter: 'chapter-1',
            choice: 'listen',
            art: 'archive-survey-rubbing.webp',
            note: 'A graphite circle with a dent where the pencil caught. Mara folded the sheet with the mark facing out so you could match it in the dark.',
        },
        {
            id: 'pass-lantern',
            title: 'Pass Lantern',
            chapter: 'chapter-7',
            choice: 'act',
            art: 'archive-pass-lantern.webp',
            note: 'The glass is still clouded on the windward side. It was left on the stairs so the next people off the pass would know where to turn.',
        },
        {
            id: 'keepers-spare-copy',
            title: 'The Keeper’s Spare Copy',
            art: 'archive-spare-copy.webp',
            note: 'Two dispatches sit beneath the same brass key. The clerk has filed both accounts in your handwriting and left neither one sealed.',
        },
    ];

    function createRunId() {
        if (typeof global.crypto?.getRandomValues === 'function') {
            const bytes = global.crypto.getRandomValues(new Uint8Array(16));
            return 'run-' + Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
        }
        const clock = Math.floor((global.performance?.timeOrigin || Date.now()) * 1000).toString(36);
        return 'run-' + clock + '-' + (++fallbackSequence).toString(36);
    }

    function isRecord(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    function isRunId(value) {
        return typeof value === 'string' && RUN_ID.test(value);
    }

    function collectChapterValues(source, prefix, accept) {
        const values = {};
        if (!isRecord(source)) return values;
        for (const chapter of CHAPTERS) {
            const key = prefix + chapter;
            if (Object.hasOwn(source, key) && accept(source[key])) values[chapter] = source[key];
        }
        return values;
    }

    const isChoice = value => value === 'listen' || value === 'act';
    const isEarned = value => value === true;

    function normalize(source) {
        const archive = { version: VERSION, runs: {} };
        if (source?.version !== VERSION || !isRecord(source.runs)) return archive;
        for (const runId in source.runs) {
            if (!isRunId(runId) || !Object.hasOwn(source.runs, runId)) continue;
            const entry = source.runs[runId];
            if (!isRecord(entry) || !Number.isInteger(entry.seed)) continue;
            const run = {
                seed: entry.seed >>> 0,
                choices: collectChapterValues(entry.choices, '', isChoice),
                secrets: collectChapterValues(entry.secrets, '', isEarned),
                leagueCleared: entry.leagueCleared === true,
                endingSeen: entry.endingSeen === true,
            };
            if (hasRecordedProgress(run)) archive.runs[runId] = run;
        }
        return archive;
    }

    function hasRecordedProgress(run) {
        return run.leagueCleared || run.endingSeen
            || Object.keys(run.choices).length > 0 || Object.keys(run.secrets).length > 0;
    }

    function addsProgress(recorded, incoming) {
        return (incoming.leagueCleared && !recorded.leagueCleared)
            || (incoming.endingSeen && !recorded.endingSeen)
            || Object.keys(incoming.choices).some(key => !Object.hasOwn(recorded.choices, key))
            || Object.keys(incoming.secrets).some(key => !Object.hasOwn(recorded.secrets, key));
    }

    function mergeRunRecords(recorded, incoming) {
        return {
            seed: recorded.seed,
            choices: { ...incoming.choices, ...recorded.choices },
            secrets: { ...recorded.secrets, ...incoming.secrets },
            leagueCleared: recorded.leagueCleared || incoming.leagueCleared,
            endingSeen: recorded.endingSeen || incoming.endingSeen,
        };
    }

    function mergeArchives(current, incoming) {
        const archive = normalize(current);
        const restored = normalize(incoming);
        for (const [runId, entry] of Object.entries(restored.runs)) {
            const existing = archive.runs[runId];
            if (!existing) archive.runs[runId] = entry;
            else if (entry.seed === existing.seed) archive.runs[runId] = mergeRunRecords(existing, entry);
        }
        return archive;
    }

    function summaryOf(archive) {
        const runs = Object.values(archive.runs);
        const outcomes = {};
        const secrets = new Set();
        const aftermathChoices = new Set();
        let leagueClears = 0;
        let endings = 0;
        let mostSecretsInRun = 0;
        let finishedJourney = false;

        for (const run of runs) {
            if (run.leagueCleared) leagueClears++;
            if (run.endingSeen) {
                endings++;
                if (run.choices.aftermath) aftermathChoices.add(run.choices.aftermath);
                if (run.leagueCleared) finishedJourney = true;
            }
            for (const [chapter, choice] of Object.entries(run.choices)) {
                outcomes[chapter] = (outcomes[chapter] || 0) | (choice === 'listen' ? 1 : 2);
            }
            const found = Object.keys(run.secrets);
            mostSecretsInRun = Math.max(mostSecretsInRun, found.length);
            for (const chapter of found) secrets.add(chapter);
        }
        const alternateChoices = Object.values(outcomes).filter(outcome => outcome === 3).length;
        const unlockedAfterword = aftermathChoices.size === 2;
        const keepsakes = KEEPSAKES
            .filter(item => item.chapter ? runs.some(run => run.choices[item.chapter] === item.choice) : unlockedAfterword)
            .map(({ id, title, art, note }) => ({ id, title, art, note }));
        const milestone = (id, title, description, earned) => ({ id, title, description, earned });
        return {
            runs: runs.length,
            leagueClears,
            endings,
            distinctChapters: Object.keys(outcomes).length,
            distinctSecrets: secrets.size,
            alternateChoices,
            mostSecretsInRun,
            keepsakes,
            milestones: [
                milestone('first-secret', 'What the Road Kept', 'Uncover a hidden record in any chapter.', secrets.size > 0),
                milestone('three-secrets', 'Threadkeeper', 'Uncover three different hidden records in one journey.', mostSecretsInRun >= 3),
                milestone('alternate-choice', 'A Different Answer', 'Make both choices at the same crossroads across separate journeys.', alternateChoices > 0),
                milestone('complete-journey', 'Past the Podium', 'Clear the League and reach the aftermath in the same journey.', finishedJourney),
                milestone('opposite-aftermaths', 'Two Ways Home', 'Reach the aftermath in two journeys and give a different final answer. This opens an Archive afterword.', unlockedAfterword),
            ],
            replayScenes: unlockedAfterword ? [{
                ...AFTERWORD,
                speaker: { ...AFTERWORD.speaker },
                panels: AFTERWORD.panels.map(panel => ({ ...panel })),
            }] : [],
        };
    }

    function summarize(source) {
        return summaryOf(normalize(source));
    }

    function record(source, snapshot) {
        const archive = normalize(source);
        const { runId, seed, storyChoices, leagueCleared, endingSeen } = snapshot || {};
        const unchanged = { archive, changed: false, newMilestones: [] };
        if (!isRunId(runId) || !Number.isInteger(seed)) return unchanged;
        const incoming = {
            seed: seed >>> 0,
            choices: collectChapterValues(storyChoices, 'adventure.', isChoice),
            secrets: collectChapterValues(storyChoices, 'adventure.secret.', isEarned),
            leagueCleared: leagueCleared === true,
            endingSeen: endingSeen === true,
        };
        if (!hasRecordedProgress(incoming)) return unchanged;
        const existing = archive.runs[runId];
        if (existing && (existing.seed !== incoming.seed || !addsProgress(existing, incoming))) return unchanged;

        const before = new Set(summaryOf(archive).milestones.filter(item => item.earned).map(item => item.id));
        archive.runs[runId] = existing ? mergeRunRecords(existing, incoming) : incoming;
        const newMilestones = summaryOf(archive).milestones.filter(item => item.earned && !before.has(item.id));
        return { archive, changed: true, newMilestones };
    }

    function reconcileChoices(source, runId, seed, storyChoices) {
        const current = isRecord(storyChoices) ? storyChoices : {};
        if (!isRunId(runId) || !Number.isInteger(seed) || source?.version !== VERSION || !isRecord(source.runs)) return current;
        const entry = Object.hasOwn(source.runs, runId) ? source.runs[runId] : null;
        if (!isRecord(entry) || !Number.isInteger(entry.seed) || (entry.seed >>> 0) !== (seed >>> 0)) return current;
        const choices = collectChapterValues(entry.choices, '', isChoice);
        const secrets = collectChapterValues(entry.secrets, '', isEarned);
        let result = current;
        for (const [prefix, entries] of [['adventure.', choices], ['adventure.secret.', secrets]]) {
            for (const [chapter, value] of Object.entries(entries)) {
                const key = prefix + chapter;
                if (result[key] === value) continue;
                if (result === current) result = { ...current };
                result[key] = value;
            }
        }
        return result;
    }

    const api = Object.freeze({ createRunId, isRunId, normalize, record, reconcileChoices, summarize, mergeArchives });
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else global.AdventureProgress = api;
})(globalThis);
