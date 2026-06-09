// Guard: extra-track solo raids are framed as the WILD BOSS they actually fight,
// never the trainer VS-splash — and every raid beat (raid · miniRaid · miniRaid2)
// fields its solo boss. Locks the two fixes in
// docs/story-design/story-immersion/visual-and-cinematic.md §4:
//   1. the trainer-intro mismatch (intro must mount the Pokémon cinematic), and
//   2. the latent miniRaid2 bug (regex excluded the "2" suffix → it silently
//      fought a rolled trainer team).
// Run: node --test tests/suites/story-raid-framing.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;
const document = W.document;

assert.ok(ST, 'window.__storyTest must be exposed under the harness');

const ARCS = ['cubone', 'yamask', 'hypno', 'phantump', 'mimikyu', 'drifloon', 'parasect', 'mewtwo'];
const SUFFIXES = ['raid', 'miniRaid', 'miniRaid2'];
const key = (arc, suffix) => `extra.${arc}.${suffix}`;

// ── 1. The shared predicate matches all 24 keys with the right species + scale ──
test('raidBossInfoForBeatKey resolves all 24 raid beats (raid · miniRaid · miniRaid2)', () => {
    const BY_TIER = ST.EXTRA_RAID_SPECIES_BY_TIER;
    for (const arc of ARCS) {
        for (const suffix of SUFFIXES) {
            const info = ST.raidBossInfoForBeatKey(key(arc, suffix));
            assert.ok(info, `${key(arc, suffix)} resolves to a solo raid boss`);
            assert.equal(info.species, BY_TIER[arc][suffix], `${key(arc, suffix)} → ${BY_TIER[arc][suffix]}`);
            assert.equal(info.arc, arc);
            // miniRaid2 shares the miniRaid beat kind — scaleKind must normalize, never
            // leak the "2" suffix (which would default HP scaling to 1×).
            const expectKind = suffix === 'raid' ? 'raid' : 'miniRaid';
            assert.equal(info.scaleKind, expectKind, `${key(arc, suffix)} scaleKind = ${expectKind}`);
        }
    }
});

test('per-tier escalation: Road-4 base → Road-5 evolved → Road-6 climax', () => {
    const r = (arc, suffix) => ST.rollExtraRaidBossTeam(key(arc, suffix))[0].name;
    // cubone: the skull-less child → the evolved skull-bearer → the climax
    assert.equal(r('cubone', 'miniRaid'),  'Cubone',  'Road-4 names the base Cubone');
    assert.equal(r('cubone', 'miniRaid2'), 'Marowak', 'Road-5 names the evolved Marowak');
    assert.equal(r('cubone', 'raid'),      'Marowak', 'Road-6 climax Marowak');
    // yamask is the one arc whose Road-5 evolved form differs from its base + climax
    assert.equal(r('yamask', 'miniRaid'),  'Yamask',     'Road-4 base Yamask');
    assert.equal(r('yamask', 'miniRaid2'), 'Cofagrigus', 'Road-5 evolved Cofagrigus');
    assert.equal(r('yamask', 'raid'),      'Yamask',     'Road-6 climax Yamask ancestor');
    // single-species arcs stay one creature across all three tiers
    for (const arc of ['hypno', 'mimikyu', 'mewtwo']) {
        assert.equal(r(arc, 'miniRaid'), r(arc, 'raid'), `${arc} is one species across tiers`);
    }
});

test('raidBossInfoForBeatKey rejects non-raid keys', () => {
    for (const k of ['villain.rocket.boss', 'villain.rocket.miniBoss', 'extra.cubone.event4',
                     'main.mfBattle', 'extra.cubone.ending', '', null, undefined, 'garbage']) {
        assert.equal(ST.raidBossInfoForBeatKey(k), null, `${k} is not a solo raid`);
    }
});

// ── 2. Every raid beat FIELDS its solo boss (the miniRaid2 bug fix) ─────────────
test('rollExtraRaidBossTeam fields a 1-mon solo boss for all 24 beats', () => {
    const BY_TIER = ST.EXTRA_RAID_SPECIES_BY_TIER;
    for (const arc of ARCS) {
        for (const suffix of SUFFIXES) {
            const team = ST.rollExtraRaidBossTeam(key(arc, suffix));
            assert.ok(Array.isArray(team) && team.length === 1, `${key(arc, suffix)} → single foe`);
            assert.equal(team[0].name, BY_TIER[arc][suffix], `${key(arc, suffix)} foe is ${BY_TIER[arc][suffix]}`);
            assert.equal(team[0].build._bossStatMult, 1.3, 'legendary-tier stat mult applied');
            assert.ok(team[0].build._bossHpScale >= 1, 'party-scaled HP applied');
        }
    }
});

test('miniRaid2 is scaled exactly like miniRaid (not defaulted to 1×) — the bug fix', () => {
    for (const arc of ARCS) {
        const mini  = ST.rollExtraRaidBossTeam(key(arc, 'miniRaid'));
        const mini2 = ST.rollExtraRaidBossTeam(key(arc, 'miniRaid2'));
        assert.equal(mini2[0].build._bossHpScale, mini[0].build._bossHpScale,
            `${arc}: miniRaid2 HP scale matches miniRaid (was previously a trainer team)`);
    }
});

// ── 3. Phase configs + lore cover every raid beat ──────────────────────────────
test('BOSS_CONFIGS has phase entries for all 24 raid beats', () => {
    const CFG = ST.BOSS_CONFIGS;
    for (const arc of ARCS) {
        for (const suffix of SUFFIXES) {
            const cfg = CFG[key(arc, suffix)];
            assert.ok(cfg && Array.isArray(cfg.mechanics) && cfg.mechanics.length,
                `${key(arc, suffix)} has a phase config`);
            assert.ok(cfg.mechanics[0].banner, `${key(arc, suffix)} phase banner present`);
        }
    }
});

test('RAID_LORE covers all 8 arcs', () => {
    const LORE = ST.RAID_LORE;
    for (const arc of ARCS) {
        assert.ok(typeof LORE[arc] === 'string' && LORE[arc].length > 20, `${arc} has lore`);
    }
});

test('raidNarratorLines distinguishes the full raid from the mini-raids', () => {
    const full = ST.raidNarratorLines('extra.cubone.raid');
    const mini = ST.raidNarratorLines('extra.cubone.miniRaid');
    const mini2 = ST.raidNarratorLines('extra.cubone.miniRaid2');
    assert.ok(Array.isArray(full) && full.length === 2);
    assert.notDeepEqual(full, mini, 'full raid couplet differs from mini');
    assert.deepEqual(mini, mini2, 'both mini-raids share the couplet');
});

// ── 4. The intro mounts the Pokémon cinematic, NEVER the trainer VS-splash ──────
test('showRaidEncounterIntro mounts the cinematic shell, not the trainer VS-splash', () => {
    let done = false;
    const ov = ST.showRaidEncounterIntro('Marowak', 'extra.cubone.raid', () => { done = true; });
    try {
        assert.ok(ov && ov.classList.contains('story-legend-sighting'),
            'raid intro uses the .story-legend-sighting cinematic shell');
        assert.ok(document.querySelector('.story-legend-sighting'), 'cinematic is mounted');
        assert.equal(document.querySelector('.vs-stage'), null,
            'raid intro must NOT mount the trainer VS-splash (.vs-stage)');
        // The boss is named + framed by species, not by a trainer role label.
        assert.match(ov.textContent, /Marowak/, 'foe Pokémon is named on the card');
        assert.match(ov.textContent, /A REMEMBERED PLACE/, 'BOSS_CONFIGS banner shown');
        // Dismiss via the button → onDone fires + overlay is torn down.
        const btn = ov.querySelector('button');
        assert.ok(btn, 'cinematic has a continue button');
        btn.click();
        assert.equal(done, true, 'onDone fired on dismiss');
        assert.equal(document.querySelector('.story-legend-sighting'), null, 'overlay removed on dismiss');
    } finally {
        try { ov && ov.remove && ov.remove(); } catch (e) {}
    }
});
