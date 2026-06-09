// Camp bonding EARNING LOOP — micro-games → slot.bonds → buffs go live (PR D).
// See docs/story-design/camp/CAMP_MINIGAMES.md + BONDING_RELATIONSHIPS.md (§11).
//
// PR D makes the dormant PR-B buff LIVE: a won micro-game = +1 to a path counter;
// mastery (counter ≥ Nature-shifted threshold) turns on the +5% stat buff that
// PR B already wired into buildPokemon. These lock the loop's logic surface —
// award/mastery, titles, seeded pick, favourite, the pure score deciders — and an
// end-to-end integration assertion that mastering a path actually scales a built stat.
//
// Run: node --test tests/suites/camp-bonding-loop-v25.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;

const freshBuild = (n = 'Hardy') => ({ n, ivs: { hp:31, atk:31, def:31, spa:31, spd:31, spe:31 }, evs: {} });
const zeroBonds = () => ({ praise:0, nurture:0, discipline:0, intimidate:0, mimicry:0, devotion:0 });

test('data: 6 actions, clean path bijection, phase-1 ships 1 game per action', () => {
    const A = ST.CAMP_ACTIONS, G = ST.CAMP_MICROGAMES;
    assert.equal(Object.keys(A).length, 6, '6 actions');
    const paths = Object.values(A).map(a => a.path).sort();
    assert.deepEqual(paths, ['devotion','discipline','intimidate','mimicry','nurture','praise']);
    for (const id in A) {
        assert.ok(A[id].games.length >= 1, `${id} has a game pool`);
        for (const g of A[id].games) assert.ok(G[g], `${id} → ${g} exists`);
    }
});

test('campPickMicrogame: returns a game id from the action pool (seeded)', () => {
    const g = ST.campPickMicrogame('cheer');
    assert.ok(ST.CAMP_ACTIONS.cheer.games.includes(g), 'pick is in the pool');
    assert.equal(ST.campPickMicrogame('nope'), null, 'unknown action → null');
});

test('campAwardBond: +1 per call; mastery fires exactly at the threshold crossing', () => {
    const slot = { name: 'Pikachu', build: freshBuild('Hardy'), bonds: zeroBonds() }; // flat → threshold 5
    let mastered = 0, lastAward = null;
    for (let i = 0; i < 4; i++) lastAward = ST.campAwardBond(slot, 'discipline');
    assert.equal(slot.bonds.discipline, 4);
    assert.equal(lastAward.justMastered, false, 'not yet at 4');

    lastAward = ST.campAwardBond(slot, 'discipline'); // 5th → masters
    assert.equal(slot.bonds.discipline, 5);
    assert.equal(lastAward.justMastered, true, 'masters at the 5th win');
    assert.equal(lastAward.threshold, 5);

    lastAward = ST.campAwardBond(slot, 'discipline'); // 6th → already mastered, no re-fire
    assert.equal(lastAward.justMastered, false, 'mastery fires once');
});

test('campBondFavoredPath / campBondGain: the Nature-raised stat is the ×2 favourite', () => {
    // Adamant raises Atk → praise is favoured (×2); everything else is ×1.
    const adamant = { build: freshBuild('Adamant') };
    assert.equal(ST.campBondFavoredPath(adamant), 'praise');
    assert.equal(ST.campBondGain(adamant, 'praise'), 2, 'favoured → ×2');
    assert.equal(ST.campBondGain(adamant, 'nurture'), 1, 'others → ×1');
    // Modest raises Sp.Atk → nurture is the favourite.
    assert.equal(ST.campBondFavoredPath({ build: freshBuild('Modest') }), 'nurture');
    // Timid raises Speed → mimicry.
    assert.equal(ST.campBondFavoredPath({ build: freshBuild('Timid') }), 'mimicry');
});

test('campBondFavoredPath: neutral nature → no favourite, every path ×1', () => {
    const slot = { build: freshBuild('Hardy') };
    assert.equal(ST.campBondFavoredPath(slot), null);
    for (const p of ['praise','nurture','discipline','intimidate','mimicry','devotion'])
        assert.equal(ST.campBondGain(slot, p), 1, `${p} ×1`);
});

test('campBondFavoredPath: HP/Devotion is never the favourite (no Nature touches HP)', () => {
    for (const n of ['Adamant','Modest','Timid','Bold','Calm','Hardy'])
        assert.notEqual(ST.campBondFavoredPath({ build: freshBuild(n) }), 'devotion');
});

test('campAwardBond: the favourite earns +2 per win and masters in 3 wins (was 5)', () => {
    const slot = { name: 'Gible', build: freshBuild('Adamant'), bonds: zeroBonds() }; // +atk → praise favoured
    let a = ST.campAwardBond(slot, 'praise'); // +2 → 2
    assert.equal(a.count, 2); assert.equal(a.gain, 2); assert.equal(a.favored, true);
    assert.equal(a.justMastered, false, 'not at 2');
    a = ST.campAwardBond(slot, 'praise'); // +2 → 4
    assert.equal(a.justMastered, false, 'not at 4');
    a = ST.campAwardBond(slot, 'praise'); // +2 → 6 ≥ 5 → masters on the 3rd win
    assert.equal(a.count, 6);
    assert.equal(a.threshold, 5);
    assert.equal(a.justMastered, true, 'favourite masters on the 3rd win');
});

test('titles: bond shape → title (priority order)', () => {
    const T = ST.campTitleFromMastered;
    assert.equal(T(['praise','nurture','discipline','intimidate','mimicry','devotion']), 'Soulbonded');
    assert.equal(T(['devotion','discipline']), 'the Obsession');
    assert.equal(T(['devotion','nurture']), 'the Adored');
    assert.equal(T(['discipline','intimidate']), 'the Hardened');
    assert.equal(T(['praise','nurture']), 'the Beloved');
    assert.equal(T(['mimicry']), 'the Mirror');
    assert.equal(T(['praise']), null, 'no rule → no title');
    // Obsession beats Adored when both could match (devotion + cruel + nurture):
    assert.equal(T(['devotion','nurture','intimidate']), 'the Obsession');
});

test('campAwardBond: surfaces a title change on the win that earns it', () => {
    const slot = { name: 'Eevee', build: freshBuild('Hardy'), bonds: zeroBonds() };
    // master praise (5) then nurture (5) → "the Beloved" on the nurture-mastering win.
    for (let i = 0; i < 5; i++) ST.campAwardBond(slot, 'praise');
    let a = null;
    for (let i = 0; i < 4; i++) a = ST.campAwardBond(slot, 'nurture');
    assert.equal(a.titleChanged, false);
    a = ST.campAwardBond(slot, 'nurture'); // 5th → masters nurture → Beloved
    assert.equal(a.titleChanged, true);
    assert.equal(a.title, 'the Beloved');
});

test('campFavourite: stable per slot.id, in range', () => {
    const s1 = { id: 'mon-abc' }, s2 = { id: 'mon-abc' }, s3 = { id: 'mon-xyz' };
    assert.equal(ST.campFavourite(s1, 3), ST.campFavourite(s2, 3), 'same id → same favourite');
    assert.ok(ST.campFavourite(s3, 3) >= 0 && ST.campFavourite(s3, 3) < 3, 'in range [0,n)');
});

test('score deciders: tapTiming hit-zone, holdRelease green/overdo', () => {
    assert.equal(ST.campScoreTapTiming(0.50, 0.50, 0.13), true, 'dead centre');
    assert.equal(ST.campScoreTapTiming(0.62, 0.50, 0.13), true, 'edge of zone');
    assert.equal(ST.campScoreTapTiming(0.70, 0.50, 0.13), false, 'outside zone');
    assert.equal(ST.campScoreHoldRelease(0.75, 0.60, 0.90), true, 'in the green band');
    assert.equal(ST.campScoreHoldRelease(0.50, 0.60, 0.90), false, 'released too early');
    assert.equal(ST.campScoreHoldRelease(0.95, 0.60, 0.90), false, 'overdo → curdled fail');
});

test('campRunMicrogame: unknown primitive never soft-locks (resolves a win)', () => {
    let res = null;
    ST.campRunMicrogame({ primitive: 'nonexistent', name: 'X' }, (won) => { res = won; });
    assert.equal(res, true, 'unknown primitive → freebie win, loop never stalls');
});

test('INTEGRATION: mastering a path makes the PR-B buff LIVE in buildPokemon', () => {
    const slot = { name: 'Machop', build: freshBuild('Hardy'), bonds: zeroBonds() };
    // Baseline: dormant.
    assert.equal(ST.relationshipStatMult(slot).def, 1, 'no buff before mastery');
    // Master discipline (→ def), flat threshold 5.
    for (let i = 0; i < 5; i++) ST.campAwardBond(slot, 'discipline');
    const m = ST.relationshipStatMult(slot);
    assert.equal(m.def, 1.05, 'discipline mastered → def ×1.05');
    assert.equal(m.atk, 1, 'other stats untouched');

    const base = ST.buildPokemon('Machop', slot.build);
    const buffed = ST.buildPokemon('Machop', Object.assign({}, slot.build, { _relationshipStatMult: m }));
    assert.equal(buffed.stats.def, Math.floor(base.stats.def * 1.05), 'built def actually scales');
    assert.equal(buffed.stats.atk, base.stats.atk, 'built atk unchanged');
});
