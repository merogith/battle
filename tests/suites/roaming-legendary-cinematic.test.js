// Roaming legendary sighting — two-stage cinematic + deeper narrative
// (2026-07 rework).
//
//   • Stage 1 "SIGNS": the legend as a drifting silhouette (name hidden) over a
//     per-species "the route reacts" line, with its own narrator copy.
//   • Stage 2 "REVEAL": flash + shake + species cry + sparkle burst, then the
//     classic banner / name / Pokédex-flavored lore / narrator frame.
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
    assert.ok(stage1.querySelector('.story-legend-sighting-sprite--silhouette'), 'sprite is silhouetted');
    assert.equal(stage1.querySelector('.story-legend-sighting-name').textContent, '— ? —', 'name is hidden');
    assert.ok(/SOMETHING PACES THE ROUTE/.test(stage1.textContent), 'signs banner');
    assert.ok(stage1.textContent.includes('The puddles along the road have gone perfectly clear'),
        'per-species signs line (Suicune)');
    assert.equal(done, 0, 'onDone has not fired yet');

    stage1.querySelector('button').click();
    const stage2 = W.document.querySelector('.story-legend-sighting');
    assert.ok(stage2 && stage2 !== stage1, 'reveal overlay mounted');
    assert.ok(!stage2.querySelector('.story-legend-sighting-sprite--silhouette'), 'silhouette lifted');
    assert.equal(stage2.querySelector('.story-legend-sighting-name').textContent, 'Suicune', 'name revealed');
    assert.ok(stage2.querySelector('.story-legend-sighting-flash'), 'reveal flash element present');
    assert.ok(stage2.classList.contains('story-legend-sighting--shake'), 'reveal shake class applied');
    assert.ok(/A LEGENDARY HAS BEEN SIGHTED/.test(stage2.textContent), 'classic reveal banner');
    assert.ok(stage2.textContent.includes('It purifies poisoned water'), 'reveal lore line (Suicune)');
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
    assert.ok(/A legend walks the route/.test(stage2.textContent), 'generic lore fallback');
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
    assert.ok(src.includes('The route exhales. The legend rides with you now.'),
        'roaming catch success aftermath');
    assert.ok(src.includes('The route settles back into being just a route. It remembers you, though.'),
        'roaming ball-broken flee aftermath');
    assert.ok(src.includes('By the next bend the route is just a route again. Gone for this run.'),
        'roaming walk-away aftermath');
});

test('reduced-motion collapse: the shared shell checks prefers-reduced-motion before staging', () => {
    const src = fs.readFileSync(path.join(ROOT, 'battle.html'), 'utf8');
    const fn = src.slice(src.indexOf('function _showWildEncounterCinematic'), src.indexOf('function _showWildEncounterCinematic') + 2400);
    assert.ok(/prefers-reduced-motion/.test(fn), 'shell consults the media query');
    assert.ok(/o\.signs && !_reducedMotion/.test(fn), 'signs stage is gated on motion being allowed');
});
