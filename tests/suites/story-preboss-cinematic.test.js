// Guard: the pre-boss cinematic (§5) + portrait-emotion (§6.4). Canon villain bosses/
// admins and the Mystery Figure apex get an additive escalation beat (threshold banner +
// canon portrait with an emotion treatment + one framing line) between the narrative scene
// and the VS-splash, reusing _renderNarrativeOverlay. See
// docs/story-design/story-immersion/visual-and-cinematic.md §5 / §6.4.
// Run: node --test tests/suites/story-preboss-cinematic.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;
const document = W.document;
assert.ok(ST, 'window.__storyTest must be exposed under the harness');

const VILLAIN_ARCS = ['rocket','magma','aqua','galactic','plasma','skull','yell','flare','macroCosmos','star'];

// ── Which battles get a pre-boss cinematic ─────────────────────────────────────
test('preBossCinematicKeyFor maps canon bosses + admins + the Mystery apex', () => {
    assert.equal(ST.preBossCinematicKeyFor('villain.rocket.boss', 'Basic Trainer', false), 'villain.rocket.boss');
    assert.equal(ST.preBossCinematicKeyFor('villain.galactic.miniBoss', 'Basic Trainer', false), 'villain.galactic.miniBoss');
    assert.equal(ST.preBossCinematicKeyFor(null, 'Mystery Figure', true), 'main.mfBattle');
});

test('preBossCinematicKeyFor rejects raids, events, and plain trainers', () => {
    for (const k of ['extra.cubone.raid', 'extra.cubone.miniRaid2', 'villain.rocket.event4',
                     'main.event8', '', null, 'garbage']) {
        assert.equal(ST.preBossCinematicKeyFor(k, 'Basic Trainer', false), null, `${k} → no pre-boss`);
    }
});

// ── Portrait-emotion mapping ───────────────────────────────────────────────────
test('castEmotionClass maps emotions to CSS class lists', () => {
    assert.equal(ST.castEmotionClass('angry'), 'cast-emotion cast-angry');
    assert.equal(ST.castEmotionClass('obscured'), 'cast-emotion cast-obscured');
    assert.equal(ST.castEmotionClass('calm'), 'cast-emotion');     // base transition only
    assert.equal(ST.castEmotionClass(''), '');
    assert.equal(ST.castEmotionClass('bogus'), '');                 // unknown → no treatment
});

// ── Copy coverage ──────────────────────────────────────────────────────────────
test('every villain boss + the Mystery apex has a line + a valid emotion', () => {
    const C = ST.PRE_BOSS_CINEMATICS;
    for (const a of VILLAIN_ARCS) {
        const e = C['villain.' + a + '.boss'];
        assert.ok(e && typeof e.line === 'string' && e.line.length > 15, `${a} boss has a line`);
        assert.ok(ST.castEmotionClass(e.emotion), `${a} boss emotion "${e.emotion}" maps to a class`);
    }
    const mf = C['main.mfBattle'];
    assert.ok(mf && mf.emotion === 'obscured', 'Mystery apex is obscured');
});

// ── The cinematic mounts the canonical overlay with banner + emotion portrait ──
test('playPreBossCinematic mounts the overlay with banner, portrait emotion, and chains onDone', () => {
    // Clear any live overlay so this one mounts (the renderer serializes a queue).
    document.querySelectorAll('button[data-narr-continue="1"]').forEach(b => b.click());
    let done = false;
    ST.playPreBossCinematic('main.mfBattle', { name: '??? Mystery Figure', spriteFile: 'Cyrus' }, () => { done = true; });

    const banner = document.querySelector('.story-preboss-banner');
    assert.ok(banner, 'pre-boss banner mounted');
    assert.equal(banner.textContent, 'YOU KNOW THIS ONE');

    const img = document.querySelector('img.cast-obscured');
    assert.ok(img, 'cast sprite carries the obscured emotion treatment');
    assert.ok(img.classList.contains('cast-emotion'), 'sprite has the emotion base class');
    assert.match(img.getAttribute('src') || '', /Cyrus\.png$/, 'uses the resolved trainer sprite path');
    assert.match(document.body.textContent, /\?\?\?/, 'masked "???" nameplate shown');

    const cont = document.querySelector('button[data-narr-continue="1"]');
    assert.ok(cont, 'continue button present');
    cont.click();
    assert.equal(done, true, 'onDone chained on dismiss (→ showBattleIntro in the live flow)');
});

// ── A boss whose sprite differs from its name resolves via SPRITE_MAP ──────────
test('a canon boss with a mapped sprite (Piers→Roughneck) resolves correctly', () => {
    document.querySelectorAll('button[data-narr-continue="1"]').forEach(b => b.click());
    ST.playPreBossCinematic('villain.yell.boss', { name: 'Piers' }, () => {});
    const banner = document.querySelector('.story-preboss-banner');
    assert.ok(banner, 'portrait mounted');
    // Scope the sprite lookup to THIS overlay (the renderer places the <img> as a sibling
    // of the banner under the overlay root) — not any stray trainer img elsewhere in the DOM.
    const img = banner.parentElement.querySelector('img');
    assert.ok(img, 'overlay has a portrait');
    // getTrainerSprite maps Piers → Roughneck; passing the trainer object (not a bare
    // spriteFile) must honor that map, not request Piers.png.
    assert.match(img.getAttribute('src') || '', /Roughneck\.png$/, 'SPRITE_MAP honored via spriteSrc');
    document.querySelectorAll('button[data-narr-continue="1"]').forEach(b => b.click());
});
