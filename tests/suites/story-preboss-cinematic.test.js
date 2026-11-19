// Guard: the pre-boss cinematic (§5) + portrait-emotion (§6.4). Canon villain bosses/
// admins and the Mystery Figure apex get a threshold banner, portrait, and framing line
// in a single VS entrance with one Start action. See
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

async function openBoss(trainer, role, key, onDone) {
    ST.sm = { active: true, eventIndex: 0, runSeed: 504, _activeBeatBattleKey: key,
        scenesShown: { 'tutorial-first-trainer-battle': true }, settings: { enabledGens: [1] } };
    ST.showBattleIntro(trainer, role, onDone, null, { preBossKey: key });
    await new Promise(resolve => setTimeout(resolve, 15));
    return document.querySelector('.story-vs-intro');
}

test('the threshold belongs to one battle entrance and masks the resolved name', async () => {
    let done = false;
    const overlay = await openBoss({ name: 'Cyrus', spriteFile: 'Cyrus' }, 'Mystery Figure', 'main.mfBattle', () => { done = true; });
    assert.ok(overlay);
    assert.equal(document.querySelectorAll('.story-vs-intro').length, 1);
    assert.equal(document.querySelector('.story-narr-root'), null);

    const banner = document.querySelector('.story-preboss-banner');
    assert.ok(banner, 'pre-boss banner mounted');
    assert.equal(banner.textContent, 'YOU KNOW THIS ONE');

    const img = document.querySelector('img.cast-obscured');
    assert.ok(img, 'cast sprite carries the obscured emotion treatment');
    assert.ok(img.classList.contains('cast-emotion'), 'sprite has the emotion base class');
    assert.match(img.getAttribute('src') || '', /Cyrus\.png$/, 'uses the resolved trainer sprite path');
    assert.match(overlay.textContent, /\?\?\? Mystery Figure/, 'masked name shown');
    assert.ok(!overlay.textContent.includes('Cyrus'));
    assert.ok(img.classList.contains('vs-fighter-mystery'));

    const cont = overlay.querySelector('button[data-vs2-battle="1"]');
    assert.ok(cont, 'Start button present');
    cont.click();
    assert.equal(done, true, 'one action launches the battle');
    assert.equal(document.querySelector('.story-vs-intro'), null);
});

// ── A boss whose sprite differs from its name resolves via SPRITE_MAP ──────────
test('a canon boss with a mapped sprite (Piers→Roughneck) resolves correctly', async () => {
    const overlay = await openBoss({ name: 'Piers' }, 'Basic Trainer', 'villain.yell.boss', () => {});
    const banner = overlay.querySelector('.story-preboss-banner');
    assert.ok(banner, 'portrait mounted');
    const img = overlay.querySelector('.vs-fighter-foe');
    assert.ok(img, 'overlay has a portrait');
    // getTrainerSprite maps Piers → Roughneck; passing the trainer object (not a bare
    // spriteFile) must honor that map, not request Piers.png.
    assert.match(img.getAttribute('src') || '', /Roughneck\.png$/, 'SPRITE_MAP honored via spriteSrc');
    overlay.querySelector('[data-vs2-battle]').click();
});
