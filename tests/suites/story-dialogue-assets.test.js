import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { dialogueLines } from '../../data/story/dialogue-lines.js';

test('the voice pilot contains local, content-versioned clips within the offline budget', async () => {
    let bytes = 0;
    let duration = 0;
    for (const [id, line] of Object.entries(dialogueLines)) {
        const asset = await readFile(new URL('../../' + line.url, import.meta.url));
        const hash = createHash('sha256').update(asset).digest('hex').slice(0, 10);
        assert.equal(line.url, `music/voices/${id}.${hash}.mp3`);
        assert.equal(asset.byteLength, line.bytes);
        assert.ok(line.caption && line.speaker && line.durationMs > 0 && line.durationMs < 8000);
        bytes += line.bytes;
        duration += line.durationMs;
    }
    assert.ok(bytes <= 750_000);
    assert.ok(duration <= 120_000);
});

test('every chapter dialogue recording matches its full visible speaker and caption', async () => {
    const parts = ['opening', 'early', 'middle', 'finale'];
    const chapters = await Promise.all(parts.map(async part => JSON.parse(await readFile(
        new URL(`../../data/story/adventure-${part}.json`, import.meta.url), 'utf8',
    ))));
    for (const chapter of chapters.flat()) {
        for (const panel of chapter.panels.filter(panel => panel.voiceId)) {
            const line = dialogueLines[panel.voiceId];
            assert.ok(line, `Missing clip for ${chapter.id}: ${panel.voiceId}`);
            assert.equal(line.caption, panel.text);
            assert.equal(line.speaker, panel.speaker);
        }
    }
});

test('selected battle entrances use one matching caption and cancel on entry', async () => {
    const { loadEngine } = await import('../helpers/load-engine.js');
    const { window } = await loadEngine();
    const story = window.__storyTest;
    const doc = window.document;
    const records = [];
    const originalPlayDialogue = window.AudioSystem.playDialogue;
    const originalGymAdvance = window.StoryMode.isGymIntermissionAdvance;
    window.settings.animations = true;
    window.AudioSystem.playDialogue = (id, caption) => {
        const record = { id, caption, stopped: false };
        records.push(record);
        return () => { record.stopped = true; };
    };
    let launched = 0;
    const afterIntro = () => { launched++; };
    const trainer = { name: 'Test trainer', spriteFile: 'Worker', type: 'Normal' };
    const encounters = [
        ['Gym Leader 1', 'flintreach-gym-announcer'],
        ['Gym Leader 5', 'glasswater-court-pa'],
        ['Gym Leader 6', 'brasslock-shutter-pa'],
        ['Gym Leader 7', 'beaconrest-ring-pa'],
        ['E1', 'league-first-chamber-pa'],
        ['E4', 'league-last-chamber-pa'],
        ['Champion', 'league-champion-announcer'],
    ];
    const openIntro = async (event, { repeat = false, source = null, speed = 'normal' } = {}) => {
        const eventIndex = story.STORY_EVENTS_RAW.findIndex(row => row[1] === 'Battle' && row[2] === event);
        assert.ok(eventIndex >= 0);
        const rowId = story.STORY_EVENTS_RAW[eventIndex][0];
        story.sm = {
            ...story.sm,
            active: true,
            eventIndex,
            runSeed: 400,
            scenesShown: { 'tutorial-first-trainer-battle': true },
            banterByRow: { [rowId]: { foeVibe: 'flirty', pick: 'stoic', outcome: 'neutral' } },
            crucibleBattleSource: source,
        };
        window.settings.battleSpeed = speed;
        story.showBattleIntro(trainer, event, afterIntro, rowId, { repeat });
        await new Promise(resolve => setTimeout(resolve, 8));
        const intro = doc.querySelector('.story-vs-intro');
        assert.ok(intro, event + ' opens an introduction');
        return intro;
    };

    function assertVoice(overlay, id) {
        const line = dialogueLines[id];
        const caption = overlay.querySelector('[data-encounter-caption]');
        assert.equal(caption?.textContent, line.caption);
        assert.equal(caption?.parentElement.querySelector('strong')?.textContent, line.speaker);
        assert.deepEqual(records.at(-1), { id, caption: line.caption, stopped: false });
    }

    try {
        for (const [event, id] of encounters) {
            const intro = await openIntro(event);
            assertVoice(intro, id);
            intro.querySelector('[data-vs2-battle]').click();
            assert.equal(records.at(-1).stopped, true);
        }
        for (const options of [{ repeat: true }, { speed: 'fast' }, { source: 'champion' }]) {
            const intro = await openIntro('Champion', options);
            assert.equal(intro.querySelector('[data-encounter-caption]'), null);
            assert.equal(records.length, encounters.length);
            intro.querySelector('[data-vs2-battle]').click();
        }
        window.StoryMode.isGymIntermissionAdvance = () => true;
        const automaticGym = await openIntro('Gym Leader 7');
        assert.equal(automaticGym.querySelector('[data-encounter-caption]'), null);
        assert.equal(records.length, encounters.length);
        automaticGym.querySelector('[data-vs2-battle]').click();
        window.settings.battleSpeed = 'normal';
        const raid = story.showRaidEncounterIntro('Mewtwo', 'extra.mewtwo.raid', afterIntro);
        assertVoice(raid, 'containment-monitor');
        raid.querySelector('[data-encounter-enter]').click();
        assert.equal(records.at(-1).stopped, true);
        const miniRaid = story.showRaidEncounterIntro('Mewtwo', 'extra.mewtwo.miniRaid', afterIntro);
        assert.equal(miniRaid.querySelector('[data-encounter-caption]'), null);
        miniRaid.querySelector('[data-encounter-enter]').click();
        assert.equal(launched, encounters.length + 6);
    } finally {
        window.AudioSystem.playDialogue = originalPlayDialogue;
        window.StoryMode.isGymIntermissionAdvance = originalGymAdvance;
    }
});
