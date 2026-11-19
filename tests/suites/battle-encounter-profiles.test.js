import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const window = {};
const resource = new URL('../../battle-encounter-profiles.js', import.meta.url);
runInNewContext(readFileSync(resource, 'utf8'), { window });
const { fromStoryEvent, fromStoryEncounterKey, resolve } = window.BattleEncounterProfiles;

const battle = readFileSync(new URL('../../battle.html', import.meta.url), 'utf8');
const eventTable = battle.match(/const STORY_EVENTS_RAW = \[([\s\S]*?)\n\s*\];/)[1];
const events = Array.from(eventTable.matchAll(/^\s*\[(\d+),'Battle','([^']+)'/gm), ([, id, eventType]) => ({ rowId: Number(id), eventType }));

function luminance(color) {
    const [r, g, b] = color.slice(1).match(/../g).map(component => {
        const value = parseInt(component, 16) / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

test('every shipped main-path battle row has a readable, local presentation profile', () => {
    assert.ok(events.length > 30);
    for (const event of events) {
        const profile = fromStoryEvent(event);
        assert.ok(profile, `missing presentation for row ${event.rowId} ${event.eventType}`);
        assert.ok(profile.location && profile.caption && profile.line && profile.stage);
        for (const color of Object.values(profile.palette)) assert.match(color, /^#[0-9a-f]{6}$/i);
        const contrast = (luminance(profile.palette.accent) + 0.05) / (luminance(profile.palette.shadow) + 0.05);
        assert.ok(contrast >= 7, `${profile.id} text contrast ${contrast}`);
    }
});

test('all Gyms distinguish each existing trainer round from their leader', () => {
    const gymEvents = events.filter(event => event.eventType.startsWith('Gym '));
    const matches = gymEvents.map(fromStoryEvent);
    assert.equal(matches.length, 20);
    assert.equal(new Set(matches.map(match => match.id)).size, 20);
    assert.equal(new Set(matches.map(match => match.caption)).size, 20);
    const locations = new Set(matches.map(match => match.location));
    assert.equal(locations.size, 8);
    for (const location of locations) {
        const rooms = matches.filter(match => match.location === location);
        assert.equal(rooms.at(-1).id.endsWith('leader'), true);
        rooms.forEach((room, index) => {
            assert.equal(room.round, index + 1);
            assert.equal(room.total, rooms.length);
            assert.ok(room.winLine);
        });
    }
    assert.equal(fromStoryEvent({ eventType: 'Gym Trainer 2', cityNumber: 1 }), null);
    assert.equal(fromStoryEvent({ eventType: 'Gym Trainer 2', cityNumber: 5 }).id, 'gym-5-trainer-2');
    assert.equal(fromStoryEvent({ eventType: 'Gym Leader 5' }).id, 'gym-5-leader');
});

test('presentation stays generic before a public branch and hides opponent, shelter and witness details', () => {
    const context = { mode: 'story', rowId: 5 };
    assert.doesNotMatch(resolve(context).line, /Dena/);
    for (const roadChoice of ['scout', 'pass', '<invalid>']) {
        assert.equal(resolve({ ...context, roadChoice }).line, resolve(context).line);
    }
    assert.match(resolve({ ...context, roadChoice: 'help' }).line, /Dena.*warning lamp/);
    const secret = 'private shelter record and opponent named xxxxxxxxx';
    const masked = resolve({ mode: 'story', rowId: 67, trainer: secret, team: [secret], choice: secret });
    assert.equal(masked.id, 'league-mystery');
    assert.doesNotMatch(JSON.stringify(masked), /private|shelter|xxxxxxxxx/i);
    const freight = resolve({ mode: 'story', rowId: 34, roadChoice: 'scout', choice: secret });
    assert.equal(freight.location, 'Switchback Road');
    assert.doesNotMatch(JSON.stringify(freight), /private|shelter|xxxxxxxxx/i);
    assert.equal(fromStoryEvent({ eventType: 'Mystery Figure', cityNumber: 8 }).id, 'vespergate-mystery');
    assert.equal(fromStoryEvent({ eventType: 'Mystery Figure' }), null);
    assert.equal(resolve({ mode: 'competitive', rowId: 67 }), null);
});

test('all live faction and anomaly fights have authored entrance and win lines', () => {
    const generated = readFileSync(new URL('../../scripts/build/story-scenes.generated.js', import.meta.url), 'utf8');
    const scenes = runInNewContext(`${generated}\nSTORY_SCENES;`);
    const factions = Object.keys(scenes).filter(key => /^villain\.[^.]+\.(battle[12]|miniBoss|boss)$/.test(key));
    const anomalies = Object.keys(scenes).filter(key => /^extra\.[^.]+\.(miniRaid2?|raid)$/.test(key));
    assert.equal(factions.length, 40);
    assert.equal(anomalies.length, 24);
    const lines = new Set();
    for (const key of [...factions, ...anomalies]) {
        const profile = fromStoryEncounterKey(key);
        assert.ok(profile && profile.caption && profile.stage && profile.winLine, key);
        assert.equal(profile.id, key);
        assert.ok(!lines.has(profile.line), `reused entrance ${key}`);
        lines.add(profile.line);
        for (const color of Object.values(profile.palette)) assert.match(color, /^#[0-9a-f]{6}$/i);
        const contrast = (luminance(profile.palette.accent) + 0.05) / (luminance(profile.palette.shadow) + 0.05);
        assert.ok(contrast >= 7, `${key} text contrast ${contrast}`);
        if (key.endsWith('.battle1') || key.endsWith('.battle2')) assert.equal(profile.phaseLine, undefined, key);
        else assert.ok(profile.phaseLine, `missing phase approach ${key}`);
    }
});

test('authored boss keys preserve masked identity and legible fallbacks', () => {
    const bossProfiles = JSON.parse(readFileSync(new URL('../../data/story/boss-profiles.json', import.meta.url), 'utf8'));
    for (const key of Object.keys(bossProfiles)) assert.ok(fromStoryEncounterKey(key)?.phaseLine, key);
    const finale = fromStoryEncounterKey('main.mfBattle');
    assert.doesNotMatch([finale.location, finale.caption, finale.line, finale.phaseLine, finale.winLine].join(' '), /yourself|your face|the first|mirror/i);
    for (const key of [null, '', 'villain.rocket.event1', 'villain.rocket.miniBoss.outro', 'extra.hypno.ending', 'extra.unknown.raid', 'villain.__proto__.boss']) {
        assert.equal(fromStoryEncounterKey(key), null);
    }
});
