// Roaming legendary sighting — two-stage cinematic + deeper narrative
// (2026-07 rework).
//
//   • Stage 1 "SIGNS": the legend as a drifting silhouette (name hidden) over a
//     per-species roadside sign.
//   • Stage 2 "REVEAL": a localized sprite reveal and cry, then the
//     name and one linked detail.
//   • Reduced motion collapses back to the single classic overlay.
//   • Outcome beats: roaming catch success / ball-broken flee / walk-away all
//     carry their own aftermath copy.
//
// Run: node --test tests/suites/roaming-legendary-cinematic.test.js

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEngine } from '../helpers/load-engine.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

let W, ST;
before(async () => {
    ({ window: W } = await loadEngine());
    ST = W.__storyTest;
    W.settings.animations = true;
});

function clearSightings() {
    W.document.querySelectorAll('.story-legend-sighting').forEach(el => { try { el.remove(); } catch (e) {} });
}

// ── Content coverage ─────────────────────────────────────────────────────────

test('every roaming candidate species has BOTH a lore line and a signs line', () => {
    const pool = ST.SUB_LEGENDARY_POOL;
    assert.ok(Array.isArray(pool) && pool.length >= 40, 'roaming pool exposed');
    const missingLore = pool.filter(n => typeof ST.LEGENDARY_LORE[n] !== 'string');
    const missingSigns = pool.filter(n => typeof ST.LEGENDARY_SIGNS[n] !== 'string');
    assert.deepEqual([...missingLore], [], 'no species missing a reveal lore line');
    assert.deepEqual([...missingSigns], [], 'no species missing a signs-stage line');
});

// ── Two-stage flow ───────────────────────────────────────────────────────────

test('signs stage: silhouette sprite, hidden name, per-species signs line, then reveal on click', () => {
    clearSightings();
    let done = 0;
    ST.showRoamingLegendarySighting('Suicune', () => { done++; });

    const stage1 = W.document.querySelector('.story-legend-sighting');
    assert.ok(stage1, 'signs overlay mounted');
    assert.equal(stage1.getAttribute('role'), 'dialog');
    assert.equal(stage1.getAttribute('aria-modal'), 'true');
    assert.equal(stage1.getAttribute('aria-label'), 'Tracks on the road');
    assert.equal(stage1.querySelector('img')?.getAttribute('alt'), '', 'silhouette does not announce the species');
    assert.ok(stage1.querySelector('.story-legend-sighting-sprite--silhouette'), 'sprite is silhouetted');
    assert.equal(stage1.querySelector('.story-legend-sighting-name').textContent, '— ? —', 'name is hidden');
    assert.match(stage1.textContent, /Tracks on the road/);
    assert.equal(stage1.querySelector('.story-legend-sighting-lore').textContent, ST.LEGENDARY_SIGNS.Suicune);
    assert.ok(!stage1.querySelector('.story-dialog-host'), 'one cue holds the silence at the reveal');
    assert.equal(done, 0, 'onDone has not fired yet');
    stage1.click();
    assert.equal(W.document.querySelector('.story-legend-sighting'), stage1, 'the backdrop cannot advance the encounter');

    stage1.querySelector('button').click();
    const stage2 = W.document.querySelector('.story-legend-sighting');
    assert.ok(stage2 && stage2 !== stage1, 'reveal overlay mounted');
    assert.ok(!stage2.querySelector('.story-legend-sighting-sprite--silhouette'), 'silhouette lifted');
    assert.match(stage2.getAttribute('aria-label'), /Suicune/);
    assert.equal(stage2.querySelector('.story-legend-sighting-name').textContent, 'Suicune', 'name revealed');
    assert.equal(stage2.querySelector('.story-legend-sighting-flash'), null, 'no white flash');
    assert.ok(stage2.classList.contains('story-legend-sighting--reveal'), 'sprite-local reveal applied');
    assert.match(stage2.textContent, /Roaming legendary/);
    assert.equal(stage2.querySelector('.story-legend-sighting-lore').textContent, ST.LEGENDARY_LORE.Suicune);
    assert.equal(done, 0, 'onDone still pending until the reveal is dismissed');

    stage2.querySelector('button').click();
    assert.equal(done, 1, 'onDone fires after the reveal stage');
    assert.equal(W.document.querySelector('.story-legend-sighting'), null, 'overlays cleaned up');
});

test('unknown species falls back to generic signs + lore lines (never blank)', () => {
    clearSightings();
    ST.showRoamingLegendarySighting('MissingNo', () => {});
    const stage1 = W.document.querySelector('.story-legend-sighting');
    assert.ok(/The birds have gone quiet/.test(stage1.textContent), 'generic signs fallback');
    stage1.querySelector('button').click();
    const stage2 = W.document.querySelector('.story-legend-sighting');
    assert.ok(/hiding here all along/.test(stage2.textContent), 'generic lore fallback');
    stage2.querySelector('button').click();
    clearSightings();
});

test('raid intro path is untouched by the two-stage flow (no signs stage)', () => {
    // _showRaidEncounterIntro passes no `signs`, so the shared shell must render
    // the single classic overlay directly. Exercise via the shared caller.
    clearSightings();
    ST.showRoamingLegendarySighting('Suicune', () => {});
    clearSightings(); // roaming asserted above; here just assert source wiring:
    const src = fs.readFileSync(path.join(ROOT, 'battle.html'), 'utf8');
    const raidFn = src.slice(src.indexOf('function _showRaidEncounterIntro'), src.indexOf('function _showRaidEncounterIntro') + 1600);
    assert.ok(!/signs\s*:/.test(raidFn), 'raid intro does not opt into the signs stage');
});

// ── Outcome beats (source-level contracts) ───────────────────────────────────

test('roaming outcomes carry aftermath copy: catch, flee, and walk-away', () => {
    const src = fs.readFileSync(path.join(ROOT, 'battle.html'), 'utf8');
    assert.ok(src.includes('The Ball settles in your palm.'),
        'roaming catch success aftermath');
    assert.ok(src.includes('You pick the empty Ball up after the grass has stopped moving.'),
        'roaming ball-broken flee aftermath');
    assert.ok(src.includes('goes over the ridge without looking back.'),
        'roaming walk-away aftermath');
});

test('explicit cinematic skip reaches the same encounter once', () => {
    let launches = 0;
    ST.showRoamingLegendarySighting('Suicune', () => launches++);
    const skip = W.document.querySelector('.story-encounter-skip');
    assert.ok(skip);
    skip.click();
    skip.click();
    assert.equal(launches, 1);
    assert.equal(W.document.querySelector('.story-legend-sighting'), null);
});

test('Fast and reduced motion keep confirmation and omit the optional signs', () => {
    for (const shouldReduce of [false, true]) {
        W.settings.battleSpeed = shouldReduce ? 'normal' : 'fast';
        W.__reduceGameMotion = shouldReduce;
        let launches = 0;
        try {
            ST.showRoamingLegendarySighting('Suicune', () => launches++);
            const stage = W.document.querySelector('.story-legend-sighting');
            assert.match(stage.getAttribute('aria-label'), /Suicune/);
            assert.equal(stage.dataset.encounterMotion, shouldReduce ? 'still' : 'fast');
            assert.equal(stage.querySelector('.story-encounter-skip'), null);
            assert.equal(launches, 0);
            stage.querySelector('[data-encounter-enter]').click();
            assert.equal(launches, 1);
        } finally {
            W.settings.battleSpeed = 'normal';
            W.__reduceGameMotion = false;
            clearSightings();
        }
    }
});
