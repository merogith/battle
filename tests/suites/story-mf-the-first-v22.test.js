// PR-6: Mystery Figure identity collapse to a single voice (The First).
// Verifies the 7 trainer-cameo + 2 variant-exclusive identities are deleted,
// and the surviving 'the_first' entry has the expected shape + dialogue.
// Run: node --test tests/suites/story-mf-the-first-v22.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;

const MFI = ST.MYSTERY_FIGURE_IDENTITIES;

test('MYSTERY_FIGURE_IDENTITIES has exactly 1 entry (the_first)', () => {
    assert.ok(MFI, 'MYSTERY_FIGURE_IDENTITIES should exist on window scope');
    const keys = Object.keys(MFI);
    assert.equal(keys.length, 1, `expected 1 identity; got ${keys.length}: ${keys.join(',')}`);
    assert.equal(keys[0], 'the_first');
});

test('the_first identity has the expected shape', () => {
    const tf = MFI.the_first;
    assert.ok(tf, 'the_first identity missing');
    assert.equal(typeof tf.sprite, 'string');
    assert.equal(tf.reveal, 'The First');
    assert.ok(Array.isArray(tf.intros), 'intros should be an array');
    assert.equal(tf.intros.length, 4, 'expected 4 intro lines');
    assert.equal(typeof tf.outro, 'string');
    assert.ok(tf.outro.includes('I am The First'), 'outro should include the canonical reveal speech');
});

test('the_first first intro line is the canonical hook', () => {
    assert.equal(
        MFI.the_first.intros[0],
        "You're going to win this one. The next one too. That's the problem."
    );
});

test('old identities (cyrus, ghetsis, cynthia, ...) are deleted', () => {
    for (const old of ['cyrus','ghetsis','cynthia','steven','n','red','lance','buried_alive','cartridge_self']) {
        assert.equal(MFI[old], undefined, `${old} identity should be deleted`);
    }
});

test('pickMysteryIdentity always returns "the_first"', () => {
    for (let i = 0; i < 50; i++) {
        assert.equal(ST.pickMysteryIdentity(), 'the_first');
    }
});

test('ensureMysteryIdentity migrates legacy identity keys to the_first', () => {
    const oldIds = ['cyrus','ghetsis','cynthia','steven','n','red','lance','buried_alive','cartridge_self'];
    for (const old of oldIds) {
        ST.sm = Object.assign({}, ST.sm, { mysteryIdentity: old });
        const id = ST.ensureMysteryIdentity();
        assert.equal(ST.sm.mysteryIdentity, 'the_first', `failed to migrate from ${old}`);
        assert.ok(id === MFI.the_first, `migration return should be the_first identity`);
    }
});
