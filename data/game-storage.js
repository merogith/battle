/* Small shared storage contract for the title, Story and Competitive Arena. */
(function (global) {
    'use strict';
    const storyKey = 'pbs_story_save';
    const settingsKey = 'pbs_settings';
    const accessibilityKey = 'pbs_accessibility';
    const storyVersion = 28;

    function parseRecord(raw) {
        try {
            const record = JSON.parse(raw);
            if (record && typeof record === 'object' && !Array.isArray(record)) return record;
        } catch (_) { /* Settings remain usable in memory. */ }
        return {};
    }

    function readRecord(key) {
        try { return parseRecord(global.localStorage.getItem(key)); }
        catch (_) { return {}; }
    }

    function updateRecord(key, changes) {
        try {
            const stored = parseRecord(global.localStorage.getItem(key));
            const patch = typeof changes === 'function' ? changes(stored) : changes;
            global.localStorage.setItem(key, JSON.stringify({ ...stored, ...patch }));
            return true;
        } catch (_) { return false; }
    }

    function inspectStory(raw) {
        if (raw === null) return { status: 'empty' };
        let run;
        try { run = JSON.parse(raw); } catch (_) { return { status: 'invalid' }; }
        if (!Number.isInteger(run?.version) || run.version < 2) return { status: 'invalid' };
        if (run.version > storyVersion) return { status: 'newer' };
        if (!Array.isArray(run.team) || run.team.some(slot =>
            !slot || typeof slot.name !== 'string' || (slot.isEgg !== true && !slot.build))) return { status: 'invalid' };
        const unsafe = (value, depth = 0) => depth > 60 || (!!value && typeof value === 'object'
            && Object.entries(value).some(([key, child]) =>
                ['__proto__', 'prototype', 'constructor'].includes(key) || unsafe(child, depth + 1)));
        if (unsafe(run)) return { status: 'invalid' };
        return { status: run.active === false ? 'inactive' : 'ready', run };
    }

    function readStory() {
        try { return inspectStory(global.localStorage.getItem(storyKey)); }
        catch (_) { return { status: 'unavailable' }; }
    }

    function storyProblem(status) {
        return {
            newer: 'This Story save needs a newer game version. Check for updates or review backups.',
            invalid: 'This Story save could not be read. Review a backup to recover it.',
            unavailable: 'This device did not let the game read its save. Check your browser storage settings to retry.',
        }[status] || '';
    }

    global.GameStorage = Object.freeze({
        storyKey, storyVersion, settingsKey, accessibilityKey, parseRecord, readRecord, updateRecord, inspectStory, readStory, storyProblem,
    });
})(globalThis);
