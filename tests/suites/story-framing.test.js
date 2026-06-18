// Regular-pass framing overlay. Locks the modernization layer: framing.json
// adds per-act speaker/tone + flavor choices at load WITHOUT touching the
// STORY_SCENES literal, and crucially it only FILLS GAPS — it never overrides
// an act that already carries a signature interaction or an authored choice.
// Run: node --test tests/suites/story-framing.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadEngine } from '../helpers/load-engine.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const FR = JSON.parse(readFileSync(join(ROOT, 'data/story/framing.json'), 'utf8'));

const eng = await loadEngine();
const W = eng.window;
const SS = (W.__narrationTest && W.__narrationTest.STORY_SCENES) || W.STORY_SCENES;

function act(sceneKey, phase) {
    const sc = SS[sceneKey];
    return (sc && Array.isArray(sc.acts)) ? sc.acts.find(a => a && a.phase === phase) : null;
}

test('framing engine is present and the overlay loaded', () => {
    assert.equal(typeof W._applyStoryFraming, 'function');
    assert.ok(Array.isArray(W.STORY_FRAMING) && W.STORY_FRAMING.length > 0, 'framing injects loaded at boot');
});

test('every framing entry targets a real scene + phase', () => {
    for (const f of FR.inject) {
        const a = act(f.sceneKey, f.phase);
        assert.ok(a, 'framing target missing: ' + f.sceneKey + ' / ' + f.phase);
    }
});

test('tone and speaker are applied at runtime', () => {
    for (const f of FR.inject) {
        const a = act(f.sceneKey, f.phase);
        if (f.tone != null) assert.equal(a.tone, f.tone, f.sceneKey + '/' + f.phase + ' tone');
        if (f.speaker != null) assert.equal(a.speaker, f.speaker, f.sceneKey + '/' + f.phase + ' speaker');
    }
});

test('framing flavor choices attach to inert acts', () => {
    for (const f of FR.inject) {
        if (!f.choice) continue;
        const a = act(f.sceneKey, f.phase);
        assert.ok(a.choice && a.choice.persistKey === f.choice.persistKey,
            f.sceneKey + '/' + f.phase + ' flavor choice not attached');
        // A flavor choice must carry no mechanical effect on any option.
        for (const o of a.choice.options) assert.ok(!o.effect, 'flavor option must have no effect');
    }
});

test('framing NEVER overrides a signature interaction or authored choice', () => {
    // event3 climax keeps its villain signature interaction (not a flavor choice).
    const e3 = act('villain.rocket.event3', 'climax');
    assert.ok(e3.interaction && e3.interaction.gameId === 'tell_rocket_donated', 'signature preserved');
    assert.ok(!e3.choice, 'no flavor choice forced onto a signature act');
    // event2 climax keeps the arc's authored driver choice.
    const e2 = act('villain.rocket.event2', 'climax');
    assert.ok(e2.choice && e2.choice.persistKey === 'villain.rocket.driver', 'authored choice preserved');
});

test('the rocket arc regular pass covers all its beats with tone', () => {
    const beats = ['event1', 'event2', 'event3', 'battle1', 'event4', 'event5', 'miniBoss', 'event6', 'boss', 'ending'];
    for (const b of beats) {
        const sc = SS['villain.rocket.' + b];
        assert.ok(sc && Array.isArray(sc.acts), 'missing villain.rocket.' + b);
        const toned = sc.acts.some(a => a && typeof a.tone === 'string' && a.tone);
        assert.ok(toned, 'villain.rocket.' + b + ' has no toned act after framing');
    }
});
