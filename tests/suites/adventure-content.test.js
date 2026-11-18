import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const storyData = part => JSON.parse(readFileSync(new URL(`../../data/story/adventure-${part}.json`, import.meta.url), 'utf8'));
const chapters = ['opening', 'early', 'middle', 'finale'].flatMap(storyData);

test('every city after Pallet and the Crucible has a complete Open Circle scene', () => {
    for (const [index, chapter] of chapters.entries()) {
        const city = index < 9 ? index + 1 : null;
        assert.equal(chapter.city, city);
        assert.equal(chapter.id, city ? `chapter-${city}` : 'aftermath');
        assert.ok(chapter.title && chapter.place && chapter.invitation && chapter.speaker.name);
        assert.ok(existsSync(new URL(`../../sprites/trainers/${chapter.speaker.sprite}.png`, import.meta.url)));
        assert.ok(chapter.panels.length >= 2 && chapter.panels.every(panel => typeof panel.text === 'string' && panel.text.trim()));
        assert.deepEqual(chapter.choices.map(choice => choice.id), ['listen', 'act']);
        assert.ok(chapter.choices.every(choice => choice.label && choice.reply));
        assert.ok(chapter.choices.some(choice => choice.clue));
        assert.ok(chapter.secret.title && chapter.secret.text && chapter.secret.hint);
    }
    assert.equal(chapters.length, 10);
});

test('every secret can be earned on an attentive run and all echoes point backward', () => {
    const previous = new Map();
    for (const chapter of chapters) {
        assert.ok(chapter.secret.requires.every(id => previous.get(id)?.choices.some(choice => choice.clue)), chapter.id);
        for (const echo of chapter.echoes || []) {
            assert.ok(previous.get(echo.from)?.choices.some(choice => choice.id === echo.choice), chapter.id);
            assert.ok(echo.text.trim());
        }
        previous.set(chapter.id, chapter);
    }
});
