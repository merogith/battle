// Camp bonding — relationships START at 1/5, never 0/5 (CAMP_BOND_START).
// A fresh relationship reads 1/5: defaultBonds() seeds every path at 1, bondCount()
// floors missing/legacy-0 values to 1, the V25 migration seeds 1s, and the bond
// meter renders "1/5" for a brand-new mon. Mastery is unchanged (threshold 5), so a
// neutral path now masters in 4 wins (1→5) instead of 5.
//
// Run: node --test tests/suites/camp-bond-start-one.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;

const PATHS = ['praise', 'nurture', 'discipline', 'intimidate', 'mimicry', 'devotion'];
const freshBuild = (n = 'Hardy') => ({ n, ivs: { hp:31, atk:31, def:31, spa:31, spd:31, spe:31 }, evs: {} });

test('defaultBonds: every path seeds at 1 (1/5, never 0/5)', () => {
    const b = { ...ST.defaultBonds() };
    for (const p of PATHS) assert.equal(b[p], 1, `${p} starts at 1`);
});

test('bondCount: missing object, missing key, and legacy 0 all floor to 1', () => {
    assert.equal(ST.bondCount({}, 'praise'), 1, 'no bonds object → 1');
    assert.equal(ST.bondCount({ bonds: {} }, 'praise'), 1, 'missing key → 1');
    assert.equal(ST.bondCount({ bonds: { praise: 0 } }, 'praise'), 1, 'legacy 0 → 1');
    assert.equal(ST.bondCount({ bonds: { praise: 3 } }, 'praise'), 3, 'real progress passes through');
});

test('the 1/5 floor never grants a buff or false mastery', () => {
    // A wholly-fresh slot (bonds at 1) is still dormant: 1 < threshold 5.
    const m = ST.relationshipStatMult({ build: freshBuild(), bonds: ST.defaultBonds() });
    for (const k of ['hp', 'atk', 'def', 'spa', 'spd', 'spe']) assert.equal(m[k], 1, `${k} dormant`);
    assert.deepEqual([...ST.campMasteredPaths({ build: freshBuild(), bonds: ST.defaultBonds() })], []);
});

test('bond meter renders 1/5 for a fresh mon, 5/5 when mastered', () => {
    const fresh = { name: 'Pikachu', build: freshBuild(), bonds: ST.defaultBonds() };
    const html = ST.campBondMeterHtml(fresh);
    assert.ok(html.includes('1/5'), 'fresh relationship reads 1/5');
    assert.ok(!html.includes('0/5'), 'never 0/5');

    const mastered = { name: 'Pikachu', build: freshBuild(), bonds: Object.assign(ST.defaultBonds(), { praise: 5 }) };
    assert.ok(ST.campBondMeterHtml(mastered).includes('5/5'), 'mastered path reads 5/5');
});

test('neutral path masters in 4 wins from the 1 start (1→5)', () => {
    const slot = { name: 'Pikachu', build: freshBuild('Hardy'), bonds: ST.defaultBonds() };
    let a = null;
    for (let i = 0; i < 3; i++) a = ST.campAwardBond(slot, 'discipline'); // 1→2→3→4
    assert.equal(slot.bonds.discipline, 4);
    assert.equal(a.justMastered, false, 'not yet at 4');
    a = ST.campAwardBond(slot, 'discipline'); // 4→5 masters
    assert.equal(slot.bonds.discipline, 5);
    assert.equal(a.justMastered, true, 'masters on the 4th win');
});
