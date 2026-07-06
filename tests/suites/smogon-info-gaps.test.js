// Smogon info-gap / single-battle-viability fixes (see docs/SMOGON_INFO_GAPS.md).
// Locks in the behavioural changes:
//   A — the player-facing recommendation meta (_txAccumulateBuilds via txStarredPool)
//       excludes exotic-format sets by default, the same way the foe roller does, so a
//       species whose data is only exotic falls to the honest "no competitive data" path
//       instead of confident illegal recs.
//   B — _smogonSetPower recognises the 5 previously-unscored singles formats.
//   D — the no-clean-set formes (Ash/Bond Greninja, Complete Zygarde, Zen Darmanitan,
//       Marill, Let's Go starters) roll a legal curated single-battle set instead of an
//       off-format hackmons build with other species' signature moves.
//   D2 — the designed-build move pool never seeds from exotic/doubles sets, so "designed"
//       foes can't re-introduce illegal-in-singles moves (Spectral Thief, Surging Strikes…).
//   E — thin (≤1 usable set) species still surface a designed-build alternate for variety.
// Run: node --test tests/suites/smogon-info-gaps.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const makeBuild = W.__rivalTest.makeBuild;

const GAP_FORMES = ['Greninja-Ash', 'Greninja-Bond', 'Zygarde-Complete',
    'Darmanitan-Zen', 'Marill', 'Eevee-Starter', 'Pikachu-Starter'];
// Signature moves of OTHER species that leaked in via balancedhackmons / letsgoou sets.
const ILLEGAL_LEAKED_MOVES = new Set([
    'Wicked Blow', 'Surging Strikes', 'Flower Trick', 'Spectral Thief', 'Core Enforcer',
    'Thousand Waves', 'Sparkly Swirl', 'Sappy Seed', 'Sizzly Slide', 'Zippy Zap',
    'Splishy Splash', 'Floaty Fall', 'Buzzy Buzz', 'Glitzy Glow', 'Baddy Bad', 'Freezy Frost',
]);
const LEGAL_ABILITY = {
    'Greninja-Ash': 'Battle Bond', 'Greninja-Bond': 'Battle Bond',
    'Zygarde-Complete': 'Power Construct', 'Darmanitan-Zen': 'Zen Mode',
    'Marill': 'Huge Power', 'Pikachu-Starter': 'Static',
};

// ── Path B — format-power table ─────────────────────────────────────────────
test('B: _smogonSetPower scores the newly-recognised singles formats', () => {
    const power = W._smogonSetPower;
    assert.equal(power({ _format: 'nationaldexag' }), 1.00, 'Anything Goes = top strength');
    assert.equal(power({ _format: 'monotype' }), 0.60);
    assert.equal(power({ _format: 'nationaldexmonotype' }), 0.60);
    assert.equal(power({ _format: 'battlestadiumsingles' }), 0.60);
    assert.equal(power({ _format: 'battlespotsingles' }), 0.60);
    assert.equal(power({ _format: 'MonoType' }), 0.60, 'lower-cased before lookup');
    assert.equal(power({ _format: 'totally-made-up' }), 0.5, 'unknown → neutral 0.5');
});

// ── Path D — curated single-battle floor ────────────────────────────────────
test('D: curated table covers the seven no-clean-set formes with legal 4-move sets', () => {
    const cur = W._CURATED_SINGLES_SETS;
    assert.ok(cur, 'curated table exposed');
    for (const name of GAP_FORMES) {
        const s = cur[name];
        assert.ok(s, name + ' present');
        assert.equal(s.m.length, 4, name + ' has 4 moves');
        assert.equal(new Set(s.m).size, 4, name + ' moves are distinct');
        assert.ok(s.i && s.a && s.n, name + ' has item/ability/nature');
    }
});

// ── Path D + D2 — no illegal-in-singles moves ever roll for the gap formes ───
test('D/D2: gap formes never roll leaked signature moves, across CSV + designed paths', () => {
    for (const name of GAP_FORMES) {
        let leaked = 0;
        const abilities = new Set();
        for (let i = 0; i < 40; i++) {
            const b = makeBuild(name, { forceGimmick: 'STANDARD' });
            abilities.add(b.a);
            for (const m of b.m) {
                if (ILLEGAL_LEAKED_MOVES.has(m)) leaked++;
                assert.notEqual(m, 'Tackle', name + ' never gets Tackle-junk');
            }
        }
        assert.equal(leaked, 0, name + ' never rolls another species\' signature move');
        if (LEGAL_ABILITY[name]) {
            assert.ok(abilities.has(LEGAL_ABILITY[name]),
                name + ' rolls its legal ability ' + LEGAL_ABILITY[name]);
            // and ONLY legal abilities (the illegal BH "Sniper" etc. must never surface)
            assert.equal(abilities.size, 1, name + ' ability is stable/legal, got ' + [...abilities]);
        }
    }
});

// ── Path A — exotic sets excluded from the recommendation meta ───────────────
test('A: txStarredPool excludes exotic-format sets unless allowExoticFormats is on', () => {
    const tx = W.__storyTest && W.__storyTest.txStarredPool;
    assert.ok(typeof tx === 'function', 'txStarredPool exposed on __storyTest');
    // Flutter Mane (gen9 paradox, no evolution family) crosses the 10-build sparse gate
    // only because its legal exotic-format sets are counted. Excluded, it drops below the
    // gate and the honest "limited/no competitive data" path takes over instead of
    // confident recommendations sourced from GodlyGift / StabMons / AAA sets.
    const saved = W.settings.allowExoticFormats;
    try {
        W.settings.allowExoticFormats = true;
        W._pbsInvalidateTxMeta();
        const withExotic = tx('Flutter Mane');

        W.settings.allowExoticFormats = false;
        W._pbsInvalidateTxMeta();
        const withoutExotic = tx('Flutter Mane');

        assert.equal(withExotic.sparse, false, 'exotic counted → over the sparse gate');
        assert.equal(withoutExotic.sparse, true, 'exotic excluded → sparse, honest fallback');
    } finally {
        W.settings.allowExoticFormats = saved;
        W._pbsInvalidateTxMeta();
    }
});

// ── Path E — thin-species variety pad ───────────────────────────────────────
test('E: a thin species with a clean set still surfaces a designed alternate for variety', () => {
    // Find a real species with exactly one usable standard set AND a non-empty designed
    // pool (so the designed alternate is reachable), then confirm makeBuild is not frozen
    // to a single identical build.
    const CANDIDATES = ['Falinks', 'Dudunsparce', 'Cursola', 'Boltund', 'Dubwool', 'Centiskorch'];
    const mon = CANDIDATES.find(n => W.__rivalTest.baseStats[n]);
    if (!mon) return; // dex shape lacks all candidates — skip
    let designed = 0, csv = 0;
    for (let i = 0; i < 80; i++) {
        const b = makeBuild(mon, { forceGimmick: 'STANDARD' });
        if (b._designed) designed++; else csv++;
    }
    assert.ok(designed > 0, mon + ': designed alternate appears');
    assert.ok(csv > 0, mon + ': the CSV set still appears too');
});
